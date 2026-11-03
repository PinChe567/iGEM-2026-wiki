import {chromium} from 'file:///C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url));
const browser=await chromium.launch({channel:'chrome',headless:true});
const records=[];
try {
for(const [slug,width] of [['engineering',1440],['engineering',390],['hardware',1440]]){
 const page=await browser.newPage({viewport:{width,height:1000}}), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 console.log(JSON.stringify({checkingOfficial:slug,width}));
 await page.goto(`https://2026.igem.wiki/nthu/${slug}/`,{waitUntil:'domcontentloaded',timeout:60000});
 if(slug==='engineering'){
  await page.locator('[data-eng-reading-toggle]').click();
  for(const id of ['engineering-power-control','engineering-historical-cad','engineering-cap-iteration','engineering-tia-diagnostic']){
   const loc=page.locator('#'+id);await loc.scrollIntoViewIfNeeded();
   await page.waitForFunction(id=>{const i=document.querySelector('#'+id+' img');return i.complete&&i.naturalWidth>0},id);
  }
 }
 const id=slug==='engineering'?'engineering-cap-iteration':'reader-pattern-backend';
 await page.locator('#'+id).scrollIntoViewIfNeeded();
 await page.screenshot({path:path.join(out,`official-${slug}-${width}.png`)});
 const state=await page.evaluate(()=>({url:location.href,overflow:document.documentElement.scrollWidth>innerWidth+1,base:document.baseURI,figures:[...document.querySelectorAll('figure[id^="engineering-"]')].map(e=>({id:e.id,label:e.querySelector('.media-caption__label')?.textContent.trim(),src:e.querySelector('img')?.currentSrc,loaded:!!e.querySelector('img')?.naturalWidth}))}));
 records.push({slug,width,...state,errors});
 await page.close();
}
}finally{await browser.close();}
const pass=records.length===3&&records.every(r=>!r.overflow&&!r.errors.length&&r.figures.every(f=>f.loaded&&f.src.startsWith('https://static.igem.wiki/')));
fs.writeFileSync(path.join(out,'official-browser-evidence.json'),JSON.stringify({pass,read_only:true,actual_official_site:true,no_network_interception:true,records},null,2)+'\n');
console.log(JSON.stringify({pass,records},null,2));
if(!pass)process.exitCode=1;
