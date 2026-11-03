const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
const path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const report=[];
 for(const width of [1440,390]){
  for(const slug of ['results','hardware','description','model']){
   const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`http://127.0.0.1:8011/${slug}.html`,{waitUntil:'networkidle'});
   if(slug==='model')await page.locator('[data-model-tab="receptor"]').click();
   const target=slug==='results'?'#kinetic-pilot':slug==='hardware'?'#reader-integrated-demo':slug==='description'?'[data-igem-video-link]':'#receptor-positive-control-video';
   await page.locator(target).first().scrollIntoViewIfNeeded();
   await page.waitForTimeout(700);
   if(slug==='results'||slug==='hardware'){
    for(const img of await page.locator(slug==='results'?'.final-assay-figure--integrated img':'#reader-cell-integration-composite img').all()){
     await img.scrollIntoViewIfNeeded(); await img.evaluate(e=>e.decode().catch(()=>{}));
    }
    await page.locator(target).first().scrollIntoViewIfNeeded();
   }
   const data=await page.evaluate(()=>({
    overflow:document.documentElement.scrollWidth>innerWidth,
    duplicateIds:[...document.querySelectorAll('[id]')].map(e=>e.id).filter((v,i,a)=>a.indexOf(v)!==i),
    figures:[...document.querySelectorAll('.final-assay-figure--integrated,#reader-cell-integration-composite')].map(e=>({id:e.id,label:e.querySelector('.media-caption__label')?.textContent,images:[...e.querySelectorAll('img')].map(i=>({src:i.currentSrc,loaded:i.complete&&i.naturalWidth>0}))})),
    videoLinks:[...document.querySelectorAll('[data-igem-video-link]')].map(a=>({url:a.href,label:a.closest('figure')?.querySelector('.media-caption__label')?.textContent})),
    currentTableCount:document.querySelectorAll('#results-supplement-odor21 tbody tr').length,
    residualBatchLabels:document.body.innerText.match(/\bP2\b|21 October|October 21|2026-10-21/g)||[]
   }));
   if(['results','hardware'].includes(slug))await page.screenshot({path:path.join(__dirname,`${slug}-revision-${width}.png`)});
   await page.evaluate(()=>localStorage.setItem('aerosense-language','zh-Hant'));
   await page.reload({waitUntil:'networkidle'});
   if(slug==='model')await page.locator('[data-model-tab="receptor"]').click();
   await page.locator(target).first().scrollIntoViewIfNeeded();await page.waitForTimeout(400);
   const zh=await page.evaluate(()=>({lang:document.documentElement.lang,overflow:document.documentElement.scrollWidth>innerWidth,
    heading:document.querySelector('#kinetic-pilot h2,#reader-integrated-demo h2')?.textContent,
    intro:document.querySelector('#kinetic-pilot > p:not(.final-assay-kicker),#reader-integrated-demo > p')?.textContent,
    figureCaption:document.querySelector('#fig-p2-map figcaption')?.textContent,
    videoLabels:[...document.querySelectorAll('.official-video-link__label')].map(e=>e.textContent)}));
   report.push({slug,width,...data,zh,errors});await page.close();
  }
 }
 await browser.close();
 fs.writeFileSync(path.join(__dirname,'revision-browser-qa.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report.map(x=>({slug:x.slug,width:x.width,overflow:x.overflow,zhOverflow:x.zh.overflow,errors:x.errors,duplicateIds:x.duplicateIds,figuresLoaded:x.figures.every(f=>f.images.every(i=>i.loaded)),videos:x.videoLinks.length,tableRows:x.currentTableCount,residualBatchLabels:x.residualBatchLabels,zhHeading:x.zh.heading})),null,2));
})().catch(e=>{console.error(e);process.exit(1)});
