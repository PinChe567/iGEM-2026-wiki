const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const rows=[];
 const prefix='https://gitlab.igem.org/2026/nthu/-/blob/main/site/game/docs/';
 const expected=['education-games/README.md','education-games/data-dictionary.md','education-games/game-1-pixel.md','education-games/game-2-qc-shift.md','education-games/game-3-scent-mixer.md','education-games/playtest-protocol.md','education-games/question-bank.md','education-games/redesign-log.md','education-study-protocol.md'].map(p=>prefix+p);
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8015/nthu/game/apps/wiki-client/dist/education/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(300);
  const links=await page.locator('a[href*="/-/blob/main/site/game/docs/"]').evaluateAll(es=>es.map(e=>({href:e.href,label:e.textContent.trim(),visible:!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length)})));
  const row={width,documentWidth:await page.evaluate(()=>document.documentElement.scrollWidth),errors,links,expected,missing:expected.filter(h=>!links.some(l=>l.href===h&&l.visible)),localMarkdownLinks:await page.locator('a[href*="education-games/"]').evaluateAll(es=>es.map(e=>e.href).filter(h=>h.startsWith(location.origin))),sourceLabelsPresent:links.every(l=>/Markdown/.test(l.label))};
  rows.push(row);console.log(JSON.stringify({width,overflow:row.documentWidth>width,errors,missing:row.missing,sourceLabelsPresent:row.sourceLabelsPresent,localMarkdownLinks:row.localMarkdownLinks}));
  await page.locator('#for-educators').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(__dirname,'qa-game-source-docs-'+width+'.png')});await page.close();
 }
 fs.writeFileSync(path.join(__dirname,'source-only-game-markdown-browser-qa.json'),JSON.stringify({sitePreview:'gitlab/nthu/public',rows,scope:'Outbound Markdown sources verified locally; remote source URLs require the final authorized GitLab push. No document content or game behavior changed.'},null,2)+'\n');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
