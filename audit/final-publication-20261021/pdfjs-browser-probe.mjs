import {chromium} from 'file:///C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(/PDF|worker/i.test(e.text()))console.log(e.type(),e.text())});page.on('worker',w=>console.log('WORKER',w.url()));
await page.goto('http://127.0.0.1:8015/nthu/hardware/#hardware-topic-manual',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(3000);
console.log(await page.locator('.pdf-reader').evaluateAll(els=>els.map(e=>({label:e.getAttribute('aria-label'),state:e.dataset.pdfReaderState,visible:e.getBoundingClientRect().width>0}))),errors);
console.log(await page.locator('#hardware-topic-manual').isVisible());
await browser.close();

