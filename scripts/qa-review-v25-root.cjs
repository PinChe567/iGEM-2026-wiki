const {chromium}=require('../game/node_modules/playwright');
const fs=require('fs');const path=require('path');
const out=path.resolve(__dirname,'../../reports/review-v25/root');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
 for(const width of [1440,1146,390]){const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  for(const slug of ['human-practices','entrepreneurship','description']){
   await page.goto('http://127.0.0.1:8011/'+slug+'.html',{waitUntil:'networkidle'});await page.waitForTimeout(350);
   const errors=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+2,title:document.title}));
   if(slug==='human-practices')for(const name of ['editorial-hp-intro','hp-odor']){const box=page.locator('.'+name).first();await box.scrollIntoViewIfNeeded();await box.screenshot({path:path.join(out,`${slug}-${name}-${width}.png`)});}
   if(slug==='entrepreneurship'){await page.screenshot({path:path.join(out,`${slug}-hero-${width}.png`)});if(width>760){for(const id of ['table-2','table-9']){const first=page.locator('#'+id+' tbody th').first();await first.scrollIntoViewIfNeeded();await page.locator('#'+id).locator('..').screenshot({path:path.join(out,`${slug}-${id}-${width}.png`)});errors[id]=await first.evaluate(e=>({w:e.offsetWidth,break:getComputedStyle(e).wordBreak,font:getComputedStyle(e).fontSize}));}}}
   if(slug==='description'){const back=page.locator('#ref-harvie-2023 .ref-backlink');if(await back.count()){await back.scrollIntoViewIfNeeded();await back.hover();await page.waitForTimeout(120);errors.picker={visible:await page.locator('#return-ref-harvie-2023').isVisible(),links:await page.locator('#return-ref-harvie-2023 li a').count(),selects:await page.locator('.ref-citation-picker select').count()};await page.screenshot({path:path.join(out,`refs-${width}.png`)});await page.locator('#return-ref-harvie-2023 li a').last().click();errors.picker.returned=await page.evaluate(()=>location.hash);}}
   results.push({slug,width,...errors});
  }await page.close();
 }fs.writeFileSync(path.join(out,'preflight.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));await browser.close();})();
