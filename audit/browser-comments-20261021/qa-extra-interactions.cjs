const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const out=[];
for(const width of [1440,390]){
 const ctx=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1});
 await ctx.route('**/*',async r=>{if(r.request().isNavigationRequest()&&!r.request().url().startsWith('http://127.0.0.1:8011/'))return r.abort();return r.continue()});
 for(const name of ['description','notebook','engineering','model']){
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const result={name,width};
  await page.goto(`http://127.0.0.1:8011/${name}.html`,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(650);
  try{
   if(name==='description'){
    result.stages=[];
    for(const key of ['sense','read','decode','act']){const a=page.locator(`[data-flow-tick="${key}"]`);await a.click();await page.waitForTimeout(130);result.stages.push(await page.evaluate(key=>{const root=document.querySelector('[data-desc-flow]'),img=root.querySelector(`[data-flow-tick="${key}"] img`);return{key,current:root.dataset.scene,visible:[...root.querySelectorAll('.desc-flow__stage')].filter(e=>!e.hidden).map(e=>e.dataset.layer),imgLoaded:img.complete&&img.naturalWidth>0}},key))}
    result.banner=await page.locator('.journey-launch').evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})).catch(()=>null);
    await page.locator('[data-desc-flow]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(__dirname,`extra-description-${width}.png`)});
   }
   if(name==='notebook'){
    await page.locator('[data-cal-today]').click();result.days=[];
    for(const date of ['2026-10-21','2026-10-22']){await page.locator(`[data-cal-day="${date}"]`).click();result.days.push(await page.evaluate(date=>({date,confirmed:window.AerosenseNotebook.META.completionConfirmedThrough,statuses:[...document.querySelectorAll('[data-cal-day-agenda] .nb-status')].map(e=>({text:e.textContent.trim(),class:e.className})),text:document.querySelector('[data-cal-day-agenda]')?.textContent.trim().slice(0,1200)}),date))}
   }
   if(name==='engineering'){
    const body=page.locator('.has-meshed-gears:visible').first();await body.scrollIntoViewIfNeeded();await page.waitForTimeout(300);
    result.before=await body.evaluate(e=>{const g=e.querySelector('.eng-gears').getBoundingClientRect(),n=e.querySelector('[data-eng-stage]:not([hidden])');return{status:e.querySelector('[data-guide-status]')?.textContent,stage:n?.dataset.engStage,gearLeft:g.left,gearRight:g.right,noteLeft:n?.getBoundingClientRect().left,noteRight:n?.getBoundingClientRect().right}});
    await body.locator('[data-guide-next]').click();await page.waitForTimeout(300);result.after=await body.evaluate(e=>({status:e.querySelector('[data-guide-status]')?.textContent,stage:e.querySelector('[data-eng-stage]:not([hidden])')?.dataset.engStage}));
    await page.screenshot({path:path.join(__dirname,`extra-engineering-${width}.png`)});
   }
   if(name==='model'){
    result.tabs=[];const keys=await page.locator('[data-model-tab]').evaluateAll(a=>a.map(x=>x.dataset.modelTab));
    for(const key of keys){await page.locator(`[data-model-tab="${key}"]`).click();await page.waitForTimeout(200);const data=await page.evaluate(key=>({key,refs:[...document.querySelectorAll('.model-study-reference-list > li')].filter(e=>!e.hidden).map(e=>({id:e.id,value:e.value})),firstCitation:[...document.querySelectorAll(`[data-model-panel="${key}"] a.cite`)].filter(e=>e.getBoundingClientRect().width)[0]?.textContent}),key);result.tabs.push(data);}
    const visibleCite=page.locator('[data-model-panel]:visible a.cite:visible').first();if(await visibleCite.count()){result.citeHref=await visibleCite.getAttribute('href');await visibleCite.click();await page.waitForTimeout(200);const back=page.getByRole('link',{name:/Back to citation/i}).filter({visible:true}).first();if(await back.count()){result.backHref=await back.getAttribute('href');await back.click();await page.waitForTimeout(200);result.backHash=await page.evaluate(()=>location.hash);}else result.backLinkMissing=true;}
   }
  }catch(e){result.interactionError=e.message.slice(0,500)}
  result.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);result.errors=errors;out.push(result);console.log(JSON.stringify(result));await page.close();
 }await ctx.close();
}await browser.close();fs.writeFileSync(path.join(__dirname,'extra-interaction-qa.json'),JSON.stringify(out,null,2));})().catch(e=>{console.error(e);process.exit(1)});
