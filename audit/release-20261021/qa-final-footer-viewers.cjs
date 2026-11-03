const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const rows=[];const root=path.resolve(__dirname,'../../../gitlab/nthu/public');
 const gameRoot=path.join(root,'game/apps/wiki-client/dist');
 const scan=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?scan(path.join(d,e.name)):e.name.endsWith('.html')?[path.join(d,e.name)]:[]);
 const pages=[...scan(gameRoot),...['hole-sweep-3d.html','operating-sweep-3d.html'].map(n=>path.join(root,'resources/hardware-en',n))];
 for(const width of [1440,390])for(const file of pages){
  const relative=path.relative(root,file).replaceAll('\\','/');const page=await browser.newPage({viewport:{width,height:900}});const errors=[],localFailures=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith('http://127.0.0.1:8015'))localFailures.push({url:r.url(),status:r.status()});});
  await page.goto('http://127.0.0.1:8015/nthu/'+relative,{waitUntil:'domcontentloaded'});await page.waitForTimeout(350);
  const footer=page.locator('[data-publication-license]');await footer.scrollIntoViewIfNeeded();
  const info=await footer.evaluate(f=>({position:getComputedStyle(f).position,links:[...f.querySelectorAll('a')].map(a=>a.href),width:innerWidth,documentWidth:document.documentElement.scrollWidth,footerTop:f.getBoundingClientRect().top,bodyHeight:document.body.scrollHeight}));
  let interaction=null;
  if(relative.includes('sweep-3d')){const selector=page.locator('#case-select');const first=await page.locator('#selected-result').innerText();await selector.selectOption({index:1});const second=await page.locator('#selected-result').innerText();interaction={selectionChangesValue:first!==second,options:await selector.locator('option').count(),sourceCsv:await page.locator('nav a').last().getAttribute('href')};}
  if(relative.endsWith('/games/labyrinth/index.html')){const button=page.getByRole('button',{name:/Start Game/i});await button.click();await page.waitForTimeout(500);await page.keyboard.press('ArrowRight');interaction={canvasVisible:await page.locator('canvas').first().isVisible(),footerVisible:await footer.isVisible()};}
  if(width===390&&(relative.includes('sweep-3d')||relative.endsWith('/games/labyrinth/index.html')))await page.screenshot({path:path.join(__dirname,'qa-footer-'+path.basename(path.dirname(file))+'-'+path.basename(file,'.html')+'.png')});
  rows.push({path:relative,width,...info,errors,localFailures,interaction});console.log(JSON.stringify({path:relative,width,overflow:info.documentWidth>width,errors:errors.length,localFailures:localFailures.length,interaction}));
  fs.writeFileSync(path.join(__dirname,'final-footer-viewers-browser-qa.json'),JSON.stringify({servingRoot:'gitlab/nthu/public',port:8015,rows},null,2)+'\n');await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
