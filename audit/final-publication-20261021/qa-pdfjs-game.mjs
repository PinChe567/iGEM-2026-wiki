import {chromium} from 'file:///C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('aerosense-wiki/audit/final-publication-20261021');
const browser=await chromium.launch({channel:'chrome',headless:true});
const cases=[['hardware','hardware-topic-manual',null],['education','education-workshop-slides','education-workshop-slides'],['human-practices','fiti-review-report','fiti-review-report'],['entrepreneurship','financial-workbook-preview','financial-workbook-preview']];
const results=[];
for(const width of [1440,390])for(const [name,anchor,details]of cases){
 console.log('Testing',name,width); const page=await browser.newPage({viewport:{width,height:1000}});const errors=[],consoleIssues=[],workers=[],moduleResponses=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(/fake worker|PDF preview failed/i.test(e.text()))consoleIssues.push(e.text())});page.on('worker',w=>workers.push(w.url()));page.on('response',r=>{if(/pdf(?:\.worker)?\.mjs(?:$|\?)/.test(r.url()))moduleResponses.push({url:r.url(),status:r.status()})});
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
  const geometry=await reader.evaluate(e=>({readerWidth:e.getBoundingClientRect().width,documentOverflow:document.documentElement.scrollWidth>innerWidth+1,canvasWidth:e.querySelector('canvas').width,canvasHeight:e.querySelector('canvas').height}));
  if(name==='hardware'||name==='education')await reader.screenshot({path:path.join(out,`pdfjs-${name}-${width}.png`)});
  results.push({page:name,width,pages,renderState:await reader.getAttribute('data-pdf-reader-state'),pageAfterNext:await reader.locator('.pdf-reader__canvas').getAttribute('data-page'),zoomIncreased:after>before,geometry,workers,moduleResponses,errors,consoleIssues});
 }catch(e){results.push({page:name,width,failure:e.message,workers,moduleResponses,errors,consoleIssues});}
 await page.close();
}
for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8015/nthu/game/apps/wiki-client/dist/education/',{waitUntil:'networkidle',timeout:30000});
 const item=await page.evaluate(()=>({text:document.body.innerText,links:[...document.querySelectorAll('a[href*="/site/game/docs/"]')].map(e=>({label:e.textContent.trim(),href:e.href})),overflow:document.documentElement.scrollWidth>innerWidth+1}));
 results.push({page:'game-education',width,hasMIT:/MIT/.test(item.text),oldUnspecifiedGameLicense:/Educator docs and game source license are not published|遊戲原始碼授權尚未/.test(item.text),sourceDocs:item.links,overflow:item.overflow,errors});
 await page.close();
}
await browser.close();fs.writeFileSync(path.join(out,'pdfjs-game-targeted-qa.json'),JSON.stringify({rootOutput:'gitlab/nthu/public',cases:results},null,2));console.log(JSON.stringify(results,null,2));
if(results.some(x=>x.failure||x.errors.length||x.consoleIssues?.length||x.zoomIncreased===false||x.hasMIT===false||x.oldUnspecifiedGameLicense))process.exitCode=1;
