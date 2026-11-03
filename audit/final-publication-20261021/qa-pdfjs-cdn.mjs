import {chromium} from 'file:///C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('aerosense-wiki/audit/final-publication-20261021');
const browser=await chromium.launch({channel:'chrome',headless:true});
const cases=[['hardware','hardware-topic-manual',null],['education','education-workshop-slides','education-workshop-slides']];
const results=[];
for(const width of [1440,390])for(const [name,anchor,details]of cases){
 console.log('Testing',name,width); const page=await browser.newPage({viewport:{width,height:1000}});const errors=[],consoleIssues=[],workers=[],workerHandles=[],moduleResponses=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(/fake worker|PDF preview failed/i.test(e.text()))consoleIssues.push(e.text())});page.on('worker',w=>{workers.push(w.url());workerHandles.push(w)});page.on('response',r=>{if(/pdfjs(?:-worker)?-6-4-299-[a-f0-9]+\.js(?:$|\?)/.test(r.url()))moduleResponses.push({url:r.url(),status:r.status()})});
 try{
  await page.goto(`http://127.0.0.1:8015/nthu/${name}/#${anchor}`,{waitUntil:'domcontentloaded',timeout:30000});
  if(details){const summary=page.locator(`#${details} > summary`);if(!(await page.locator(`#${details}`).getAttribute('open')!==null))await summary.click();}
  const reader=page.locator(details?`#${details} .pdf-reader`:'#hardware-topic-manual .pdf-reader').first();
  await reader.scrollIntoViewIfNeeded();await reader.locator('.pdf-reader__stage').focus();
  await reader.locator('.pdf-reader__canvas[data-page="1"]').waitFor({state:'visible',timeout:30000});
  await page.waitForFunction(el=>el.dataset.pdfReaderState==='ready',await reader.elementHandle(),{timeout:30000});
  const pages=Number(await reader.locator('.pdf-reader__page-input').getAttribute('max'));
  if(pages>1){await reader.locator('[data-pdf-label="next"]').click();await page.waitForFunction(el=>el.dataset.pdfReaderState==='ready'&&el.querySelector('.pdf-reader__canvas').dataset.page==='2',await reader.elementHandle(),{timeout:30000});}
  const before=await reader.locator('.pdf-reader__canvas').evaluate(e=>e.width);await reader.locator('[data-pdf-label="zoomIn"]').click();
  await page.waitForFunction(el=>el.dataset.pdfReaderState==='ready',await reader.elementHandle(),{timeout:30000});
  const after=await reader.locator('.pdf-reader__canvas').evaluate(e=>e.width);
  const geometry=await reader.evaluate(e=>({readerWidth:e.getBoundingClientRect().width,documentOverflow:document.documentElement.scrollWidth>innerWidth+1,mainCanvasWidth:e.querySelector('.pdf-reader__canvas').width,mainCanvasHeight:e.querySelector('.pdf-reader__canvas').height}));
  if(name==='hardware'||name==='education')await reader.screenshot({path:path.join(out,`pdfjs-cdn-${name}-${width}.png`)});
  const workerRuntime=await Promise.all(workerHandles.map(async w=>({url:w.url(),handlerType:await w.evaluate(()=>typeof globalThis.pdfjsWorker?.WorkerMessageHandler)})));
  results.push({workerRuntime,page:name,width,pages,renderState:await reader.getAttribute('data-pdf-reader-state'),pageAfterNext:await reader.locator('.pdf-reader__canvas').getAttribute('data-page'),zoomIncreased:after>before,geometry,workers,moduleResponses,errors,consoleIssues});
 }catch(e){results.push({page:name,width,failure:e.message,workers,moduleResponses,errors,consoleIssues});}
 await page.close();
}
await browser.close();fs.writeFileSync(path.join(out,'pdfjs-cdn-targeted-qa.json'),JSON.stringify({rootOutput:'gitlab/nthu/public',cases:results},null,2));console.log(JSON.stringify(results,null,2));
if(results.some(x=>x.failure||x.errors.length||x.consoleIssues?.length||x.zoomIncreased===false||!x.workers?.some(u=>u.startsWith('blob:'))||!x.workerRuntime?.every(w=>w.handlerType==='function')))process.exitCode=1;
