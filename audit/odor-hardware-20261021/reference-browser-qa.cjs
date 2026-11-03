const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),report=[];
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8011/results.html',{waitUntil:'networkidle'});
  for(const target of ['#fig-p2-map','#fig-vuaa1-reference']){
   for(const i of await page.locator(target+' img').all()){await i.scrollIntoViewIfNeeded();await i.evaluate(e=>e.decode());}
   await page.locator(target).scrollIntoViewIfNeeded();
   await page.screenshot({path:path.join(__dirname,`${target.slice(1)}-${width}.png`)});
  }
  const figures=await page.evaluate(()=>({
   removed:!document.querySelector('#fig-p2-correction'),
   labels:[...document.querySelectorAll('.final-assay-figure--integrated .media-caption__label')].map(e=>e.textContent.trim()),
   referenceWidth:document.querySelector('#fig-vuaa1-reference img').getBoundingClientRect().width,
   referenceMaxWidth:parseFloat(getComputedStyle(document.querySelector('#fig-vuaa1-reference>a')).maxWidth),
   overflow:document.documentElement.scrollWidth>innerWidth,
   duplicateIds:[...document.querySelectorAll('[id]')].map(e=>e.id).filter((v,i,a)=>a.indexOf(v)!==i)
  }));
  await page.locator('#vuaa1-referenced-response a[href="#vuaa1-reference-method"]').click();
  const disclosure=await page.locator('#vuaa1-reference-method').evaluate(e=>({
   open:e.closest('details').open,visible:e.getBoundingClientRect().height>0,tableCells:e.querySelectorAll('tbody td').length
  }));
  if(!figures.removed||figures.overflow||figures.referenceWidth>781||!disclosure.open||!disclosure.visible||disclosure.tableCells!==66||errors.length||figures.duplicateIds.length)throw Error(JSON.stringify({figures,disclosure,errors}));
  report.push({width,...figures,disclosure,errors});await page.close();
 }
 await browser.close();fs.writeFileSync(path.join(__dirname,'reference-browser-qa.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
