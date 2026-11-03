const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:true});const report=[];
for(const width of [1440,390])for(const slug of ['results','hardware']){
 const page=await browser.newPage({viewport:{width,height:1000}});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:8011/${slug}.html`,{waitUntil:'networkidle'});
 const selector=slug==='results'?'.final-assay-figure--integrated img':'#reader-cell-integration-composite img';
 for(const img of await page.locator(selector).all()){await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode().catch(()=>{}));}
 if(slug==='results')await page.locator('#fig-vuaa1-reference').scrollIntoViewIfNeeded();
 else await page.locator('#reader-cell-integration-composite').scrollIntoViewIfNeeded();
 await page.screenshot({path:path.join(__dirname,`${slug}-presentation-${width}.png`)});
 const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,
  figures:[...document.querySelectorAll('.final-assay-figure--integrated,#reader-cell-integration-composite')].map(f=>({id:f.id,label:f.querySelector('.media-caption__label')?.textContent,
   images:[...f.querySelectorAll('img')].map(i=>({src:i.currentSrc,loaded:i.complete&&i.naturalWidth>0,width:i.getBoundingClientRect().width,parentWidth:i.closest('a').getBoundingClientRect().width,horizontalScroll:i.closest('a').scrollWidth>i.closest('a').clientWidth+1}))})),
  mainFormulaCount:document.querySelectorAll('#kinetic-controls .assay-formula').length,
  calculationInSupplement:!!document.querySelector('#results-supplement-odor21 .assay-formula'),
  obsoleteLabels:(['kinetic-pilot','kinetic-controls','kinetic-map'].map(id=>document.getElementById(id)?.innerText||'').join(' ').match(/earlier assay|current assay|Scroll across|F0last|F1last/ig)||[]),
  removedHardwareSection:!document.body.textContent.includes('Normalization, actual timing and measurement limits'),
  hardwareCaption:document.querySelector('#reader-cell-integration-composite figcaption')?.textContent,
  otherOversizeFigureImages:[...document.querySelectorAll('figure img')].filter(i=>i.getBoundingClientRect().width>innerWidth).map(i=>i.currentSrc)
 }));
 await page.evaluate(()=>localStorage.setItem('aerosense-language','zh-Hant'));await page.reload({waitUntil:'networkidle'});
 const zh=await page.evaluate(()=>({lang:document.documentElement.lang,overflow:document.documentElement.scrollWidth>innerWidth,
  resultsHeading:document.querySelector('#kinetic-controls h3')?.textContent,
  referenceCaption:document.querySelector('#fig-vuaa1-reference figcaption')?.textContent,
  hardwareCaption:document.querySelector('#reader-cell-integration-composite figcaption')?.textContent,
  tableValues:[...document.querySelectorAll('#results-supplement-odor21 tbody td')].length}));
 report.push({slug,width,...state,zh,errors});await page.close();
 fs.writeFileSync(path.join(__dirname,'presentation-qa.json'),JSON.stringify(report,null,2));
}
await browser.close();console.log(JSON.stringify(report.map(r=>({slug:r.slug,width:r.width,overflow:r.overflow,zhOverflow:r.zh.overflow,errors:r.errors,
 imagesLoaded:r.figures.every(f=>f.images.every(i=>i.loaded)),figureHorizontalScroll:r.figures.some(f=>f.images.some(i=>i.horizontalScroll)),obsoleteLabels:r.obsoleteLabels,
 mainFormulaCount:r.mainFormulaCount,calculationInSupplement:r.calculationInSupplement,removedHardwareSection:r.removedHardwareSection,otherOversizeFigureImages:r.otherOversizeFigureImages})),null,2));
})().catch(e=>{console.error(e);process.exit(1)});
