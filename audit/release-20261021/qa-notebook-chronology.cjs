const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:900}});
 await page.goto('http://127.0.0.1:8011/notebook.html#hw-enclosure-assembly-test',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(1000);
 const drawer=page.locator('[data-event-drawer]');const text=await drawer.innerText();
 const result={drawerOpen:await drawer.isVisible(),sourceNoteShown:text.includes('The 16 October 2026 board-diagnosis record'),pendingTestsExplicit:text.includes('pending at that point'),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)};
 if(!result.drawerOpen||!result.sourceNoteShown||!result.pendingTestsExplicit)throw new Error(JSON.stringify(result));
 await drawer.locator('text=Source / date context').scrollIntoViewIfNeeded();
 await page.screenshot({path:path.join(__dirname,'qa-notebook-chronology-390.png')});
 await browser.close();
 fs.writeFileSync(path.join(__dirname,'notebook-chronology-browser-qa.json'),JSON.stringify(result,null,2)+'\n');console.log(result);
 const q=path.join(__dirname,'editorial-browser-qa.json'),data=JSON.parse(fs.readFileSync(q,'utf8'));
 for(const row of data){row.emptySourceImagePlaceholders=row.brokenImages.filter(x=>!x).length;row.brokenImages=row.brokenImages.filter(Boolean);}
 fs.writeFileSync(q,JSON.stringify(data,null,2)+'\n');
})().catch(e=>{console.error(e);process.exit(1)});
