import {chromium} from 'file:///C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
const output=path.resolve('aerosense-wiki/audit/final-publication-20261021');
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:1000}}),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1:8015')&&r.status()>=400)missing.push({url:r.url(),status:r.status()})});
 try{
  await page.goto('http://127.0.0.1:8015/nthu/contribution/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#contribution-data-availability a[href^="#pdf-document-"]'));
  const base=await page.evaluate(()=>document.baseURI);
  const resource=page.locator('a[href="#bio-resources"]').first();
  const resourceHref=await resource.getAttribute('href');
  const resolved=await resource.evaluate(e=>e.href);
  await resource.click();
  await page.waitForURL('**/nthu/contribution.html#bio-resources');
  const ordinaryTarget=await page.locator('#bio-resources').isVisible();
  await page.goto('http://127.0.0.1:8015/nthu/contribution/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#contribution-data-availability a[href^="#pdf-document-"]'));
  const paragraph=page.locator('#contribution-data-availability p').filter({hasText:'The general protocol'});
  const text=await paragraph.innerText();
  const inline=paragraph.locator('a').filter({hasText:'Test 1 executed methods'});
  const previewId=(await inline.getAttribute('href')).slice(1);
  await inline.click();
  const inlinePreviewOpen=await page.locator('#'+previewId).evaluate(e=>e.open);
  const afterInline=page.url();
  const toc=page.locator('.page-toc a[href="#contribution-data-availability"]').first();
  const tocExercised=await toc.isVisible();if(tocExercised){await toc.click();}
  const tocStayedInPage=page.url().includes('/nthu/contribution');
  const backlinkPaths=await page.locator('a.ref-backlink').evaluateAll(es=>es.map(e=>new URL(e.href).pathname));
  results.push({page:'contribution',width,base,resourceHref,resolved,ordinaryTarget,ordinaryClickDestination:'/nthu/contribution.html#bio-resources',inlineParagraph:text,inlinePreviewOpen,afterInline,tocExercised,tocStayedInPage,backlinkPaths,errors,missing});
 }catch(e){results.push({page:'contribution',width,failure:e.message,errors,missing});}
 await page.close();
}
const page=await browser.newPage();
await page.goto('http://127.0.0.1:8015/nthu/engineering/',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>document.querySelector('[data-reference-enhanced="true"]'));
const clean=await page.evaluate(()=>({base:document.baseURI,contexts:[...document.querySelectorAll('.reference-reading-note .cite')].map(e=>({id:e.getAttribute('href'),section:e.closest('section')?.id})),backlinks:[...document.querySelectorAll('a.ref-backlink')].map(e=>new URL(e.href).pathname)}));
await page.goto('http://127.0.0.1:8015/nthu/engineering.html',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>document.querySelector('[data-reference-enhanced="true"]'));
const htmlContexts=await page.locator('.reference-reading-note .cite').evaluateAll(es=>es.map(e=>({id:e.getAttribute('href'),section:e.closest('section')?.id})));
results.push({page:'engineering',clean,referenceContextsEqual:JSON.stringify(clean.contexts)===JSON.stringify(htmlContexts)});
await page.close();await browser.close();
const pass=results.every(x=>!x.failure&&(!x.errors||!x.errors.length)&&(!x.missing||!x.missing.length)&&x.ordinaryTarget!==false&&x.inlinePreviewOpen!==false&&x.tocStayedInPage!==false&&x.referenceContextsEqual!==false&&(!x.inlineParagraph||x.inlineParagraph.includes('Standalone protocol record')&&x.inlineParagraph.includes('Test 1 executed methods'))&&(!x.backlinkPaths||x.backlinkPaths.every(p=>p==='/nthu/contribution.html')));
fs.writeFileSync(path.join(output,'navigation-targeted-qa.json'),JSON.stringify({pass,rootOutput:'gitlab/nthu/public',cases:results},null,2));
console.log(JSON.stringify({pass,cases:results},null,2));if(!pass)process.exitCode=1;
