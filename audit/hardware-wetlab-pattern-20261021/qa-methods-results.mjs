import {chromium} from 'file:///C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';import path from 'node:path';
const out=path.resolve('aerosense-wiki/audit/hardware-wetlab-pattern-20261021');
const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
for(const pageName of ['measurement','results'])for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:8011/${pageName}.html`,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>Boolean(window.AeroSenseI18n?.setLanguage));
 const selector=pageName==='measurement'?'main article':'#results-supplement-complete-curves';
 if(pageName==='results')await page.locator('#results-supplement-complete-curves summary').click();
 await page.locator(pageName==='measurement'?'#hardware-analysis':selector).scrollIntoViewIfNeeded();
 if(pageName==='results')await page.waitForFunction(()=>{const i=document.querySelector('#fig-odor-complete-curves img');return i.complete&&i.naturalWidth>0});
 const english=await page.locator(selector).evaluate(e=>[...e.querySelectorAll('p,h1,h2,h3,figcaption,summary')].map(x=>x.textContent.replace(/\s+/g,' ').trim()));
 for(const lang of ['en','zh-Hant']){
  await page.evaluate(lang=>window.AeroSenseI18n.setLanguage(lang,false),lang);
  await page.waitForFunction(lang=>document.documentElement.lang===lang,lang);
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const state=await page.evaluate(({selector,english,pageName})=>{
   const current=[...document.querySelector(selector).querySelectorAll('p,h1,h2,h3,figcaption,summary')].map(x=>x.textContent.replace(/\s+/g,' ').trim());
   const missingTranslation=current.map((text,i)=>({text,english:english[i]})).filter(x=>x.text===x.english&&x.text.length>45&&!/[\u3400-\u9fff]/.test(x.text)&&/[A-Za-z]{5}\s+[A-Za-z]{4}/.test(x.text));
   const missingCitations=[...document.querySelectorAll('a.cite,a.reference-backlink')].map(a=>a.getAttribute('href')).filter(h=>h?.startsWith('#')&&!document.getElementById(h.slice(1)));
   const idList=[...document.querySelectorAll('[id]')].map(e=>e.id);
   const image=document.querySelector('#fig-odor-complete-curves img');
   return {lang:document.documentElement.lang,overflow:document.documentElement.scrollWidth>innerWidth+1,scrollWidth:document.documentElement.scrollWidth,width:innerWidth,missingTranslation:document.documentElement.lang==='zh-Hant'?missingTranslation:[],missingCitations,duplicateIds:[...new Set(idList.filter((id,i)=>idList.indexOf(id)!==i))],texts:current,image:image?{loaded:image.complete&&image.naturalWidth>0,src:image.currentSrc,link:image.closest('a').href,caption:image.closest('figure').querySelector('figcaption').innerText}:null};
  },{selector,english,pageName});
  await page.locator(pageName==='measurement'?'#hardware-analysis':selector).screenshot({path:path.join(out,`qa-${pageName}-${width}-${lang}.png`)});
  results.push({page:pageName,width,lang,...state,errors:[...errors]});
 }
 await page.close();
}
await browser.close();
const pass=results.every(r=>!r.overflow&&!r.errors.length&&!r.duplicateIds.length&&!r.missingCitations.length&&(r.lang==='en'||!r.missingTranslation.length)&&(r.page!=='results'||(r.image.loaded&&r.image.src===r.image.link)));
fs.writeFileSync(path.join(out,'measurement-results-page-qa.json'),JSON.stringify({pass,results},null,2));
console.log(JSON.stringify({pass,results:results.map(({texts,...r})=>r)},null,2));if(!pass)process.exitCode=1;
