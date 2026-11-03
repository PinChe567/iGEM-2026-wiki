const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const workspace = path.resolve(__dirname,'../../..');
const output = path.join(workspace,'gitlab/nthu/public');
const base = 'http://127.0.0.1:8015/nthu/';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const reportPath=path.join(__dirname,'source-only-build-browser-qa.json');
 const results=process.argv.includes('--resume')&&fs.existsSync(reportPath)?JSON.parse(fs.readFileSync(reportPath,'utf8')).pages:[];
 const names=fs.readdirSync(output).filter(n=>n.endsWith('.html')).map(n=>n.slice(0,-5));
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1});
  for(const name of names){
   if(results.some(r=>r.page===name&&r.width===width))continue;
   const page=await context.newPage();const errors=[],localFailures=[],externalFailures=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400)(r.url().startsWith('http://127.0.0.1:8015/')?localFailures:externalFailures).push({url:r.url(),status:r.status()});});
   const response=await page.goto(base+(name==='index'?'':name+'/'),{waitUntil:'commit',timeout:30000});
   let loadWait='domcontentloaded';
   try{await page.waitForLoadState('domcontentloaded',{timeout:30000});}catch(e){loadWait='DOMContentLoaded timed out; page state retained for review';}
   await page.waitForTimeout(650);
   await page.evaluate(async()=>{const pause=ms=>new Promise(r=>setTimeout(r,ms));for(let y=0;y<Math.min(document.body.scrollHeight,200000);y+=3200){scrollTo(0,y);await pause(8);}scrollTo(0,0);});
   await page.waitForTimeout(250);
   const info=await page.evaluate(()=>{
    const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
    return {width:innerWidth,documentWidth:document.documentElement.scrollWidth,
     duplicateIds:[...new Set(ids.filter((v,i)=>ids.indexOf(v)!==i))],
     brokenSamePageAnchors:[...new Set([...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>h.length>1&&!document.getElementById(decodeURIComponent(h.slice(1)))))],
     visibleStaleReproductionText:/reproduction files not released/i.test(document.body.innerText),
     figures:document.querySelectorAll('main figure').length,tables:document.querySelectorAll('main table').length};
   });
   const interactions=[];
   if(name==='model')for(const tab of ['hardware','decoding','receptor']){const l=page.locator('[data-model-tab="'+tab+'"]');if(await l.count()){await l.first().click();interactions.push({tab,selected:await l.first().getAttribute('aria-selected')});}}
   if(name==='engineering')for(const id of ['wl-cycle-tab-2','wl-cycle-tab-3','receptor-loop-tab-6']){const l=page.locator('#'+id);if(await l.count()){await l.click();const panel=await l.getAttribute('aria-controls');interactions.push({id,selected:await l.getAttribute('aria-selected'),panelVisible:await page.locator('#'+panel).isVisible()});}}
   if(name==='hardware'){
    const target=page.locator('#reader-integrated-demo');await target.scrollIntoViewIfNeeded();await page.waitForTimeout(300);
    info.figure18Images=await target.locator('img').evaluateAll(es=>es.map(e=>({src:e.currentSrc||e.src,loaded:e.complete&&e.naturalWidth>0})));
    await page.screenshot({path:path.join(__dirname,'qa-source-only-hardware-'+width+'.png')});
    const toggle=page.locator('[data-language-toggle]');if(await toggle.count()&&await toggle.isEnabled()){await toggle.click();await page.waitForTimeout(300);info.languageAfterToggle=await page.locator('html').getAttribute('lang');}
   }
   const row={page:name,width,status:response.status(),loadWait,...info,errors,localFailures,externalFailures,interactions};results.push(row);
   fs.writeFileSync(path.join(__dirname,'source-only-build-browser-qa.json'),JSON.stringify({servingRoot:output,base,pages:results},null,2)+'\n');
   console.log(JSON.stringify({page:name,width,status:row.status,overflow:info.documentWidth>width,errors:errors.length,localFailures:localFailures.length,duplicateIds:info.duplicateIds.length,brokenAnchors:info.brokenSamePageAnchors.length}));
   await page.close();
  }
  await context.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:900}});await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForTimeout(800);
 await page.keyboard.press('Control+k');await page.locator('#project-search-input').fill('VUAA1');await page.waitForTimeout(250);
 const search=await page.locator('#project-search-results').evaluate(el=>({text:el.innerText,links:[...el.querySelectorAll('[data-href],a[href]')].map(e=>e.dataset.href||e.getAttribute('href'))}));
 search.expected=['results.html#kinetic-pilot','results.html#fig-vuaa1-reference','hardware.html#reader-integrated-demo'];search.missing=search.expected.filter(x=>!search.links.includes(x));search.stale=/reproduction files not released/i.test(search.text);
 await page.screenshot({path:path.join(__dirname,'qa-source-only-vuaa1-search.png')});
 await page.close();
 const report={servingRoot:output,base,pages:results,search,limits:'Static routes and selected interactions checked in local production output. Lazy/hidden images are not all forced to load; remote upload byte audits and GitLab CI deployment are separate checks.'};
 fs.writeFileSync(path.join(__dirname,'source-only-build-browser-qa.json'),JSON.stringify(report,null,2)+'\n');
 await browser.close();
 console.log(JSON.stringify({search,failures:results.filter(x=>x.status!==200||x.documentWidth>x.width||x.errors.length||x.localFailures.length||x.duplicateIds.length||x.brokenSamePageAnchors.length).map(x=>({page:x.page,width:x.width,errors:x.errors,localFailures:x.localFailures,duplicates:x.duplicateIds,anchors:x.brokenSamePageAnchors}))}));
})().catch(e=>{console.error(e);process.exit(1);});
