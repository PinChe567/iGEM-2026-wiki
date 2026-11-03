import {chromium} from 'file:///C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('.');
const canonical=path.join(root,'zenodo-release/aerosense-wiki/data/hardware-wetlab-pattern-comparison-2026-10-21');
const output=path.join(root,'aerosense-wiki/audit/hardware-wetlab-pattern-20261021');
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/resources/hardware-wetlab-pattern-2026-10-21/**',async route=>{
  const suffix=new URL(route.request().url()).pathname.split('/resources/hardware-wetlab-pattern-2026-10-21/')[1];
  const file=path.resolve(canonical,suffix);
  if(!file.startsWith(canonical+path.sep))throw new Error('Route escapes canonical package');
  await route.fulfill({body:fs.readFileSync(file),contentType:suffix.endsWith('.svg')?'image/svg+xml':'text/plain'});
 });
 await page.goto('http://127.0.0.1:8011/hardware.html#reader-wetlab-pattern-comparison',{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('#reader-wetlab-pattern-comparison').scrollIntoViewIfNeeded();
 const figures=[];
 for(const id of ['reader-wetlab-matched-curves','reader-wetlab-pairwise-correlations']){
  const fig=page.locator('#'+id);await fig.scrollIntoViewIfNeeded();
  await page.waitForFunction(id=>{const i=document.querySelector('#'+id+' img');return i.complete&&i.naturalWidth>0},id);
  figures.push(await fig.evaluate(e=>({id:e.id,caption:e.querySelector('figcaption').innerText,src:e.querySelector('img').currentSrc,naturalWidth:e.querySelector('img').naturalWidth,renderedWidth:e.querySelector('img').getBoundingClientRect().width,renderedHeight:e.querySelector('img').getBoundingClientRect().height})));
  await fig.screenshot({path:path.join(output,`${id}-${width}.png`)});
 }
 const sensitivity=page.locator('#reader-crossplatform-sensitivity');await sensitivity.locator('summary').click();
 const table=await sensitivity.locator('table').innerText();
 const state=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return {overflow:document.documentElement.scrollWidth>innerWidth+1,duplicateIds:[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))],supplementLabels:[...document.querySelectorAll('figure[data-static-figure-number^=S]')].map(e=>e.querySelector('figcaption .media-caption__label')?.textContent.trim()),oldCadLabels:['figure-12','figure-13'].map(id=>document.querySelector('#'+id+' figcaption').textContent.trim().slice(0,25))}});
 results.push({width,figures,sensitivityTable:table,...state,errors});await page.close();
}
await browser.close();
const pass=results.every(r=>!r.errors.length&&!r.overflow&&!r.duplicateIds.length&&r.figures.length===2&&r.figures[0].caption.startsWith('Figure 19.')&&r.figures[1].caption.startsWith('Figure 20.')&&r.supplementLabels.join(',')==='Figure S1.,Figure S2.,Figure S3.,Figure S4.'&&r.oldCadLabels[0].startsWith('Figure 21.')&&r.oldCadLabels[1].startsWith('Figure 22.'));
fs.writeFileSync(path.join(output,'hardware-pattern-page-qa.json'),JSON.stringify({pass,canonicalFallbackEnabled:true,actualFigureURLs:results.flatMap(r=>r.figures.map(f=>f.src)),results},null,2));
console.log(JSON.stringify({pass,results},null,2));if(!pass)process.exitCode=1;
