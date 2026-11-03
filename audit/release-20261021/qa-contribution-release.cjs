const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),out=[];
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1100}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8011/contribution.html',{waitUntil:'domcontentloaded'});await page.waitForTimeout(700);
  const test=await page.evaluate(()=>{
   const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
   return {overflow:document.documentElement.scrollWidth>innerWidth+1,
    duplicateIds:ids.filter((v,i)=>ids.indexOf(v)!==i),
    missingAnchors:[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>h.length>1&&!document.getElementById(decodeURIComponent(h.slice(1)))),
    misplacedLimitSections:[...document.querySelectorAll('.contrib-panel--limit')].filter(e=>!e.closest('#resource-roadmap')).length,
    staleDoi:document.documentElement.innerHTML.includes('23469212'),
    mainStatus:[...document.querySelectorAll('p.contrib-status')].map(e=>e.textContent.trim().replace(/\s+/g,' '))};
  });
  if(test.overflow||test.duplicateIds.length||test.missingAnchors.length||test.misplacedLimitSections||test.staleDoi||errors.length)throw new Error(JSON.stringify({width,...test,errors}));
  for(const [name,selector] of [['discussion','#resource-roadmap'],['downloads','#contribution-data-availability']]){
   await page.locator(selector).scrollIntoViewIfNeeded();
   await page.screenshot({path:path.join(__dirname,`qa-contribution-${name}-${width}.png`)});
  }
  out.push({width,...test,errors});await page.close();
 }
 await browser.close();fs.writeFileSync(path.join(__dirname,'contribution-browser-qa.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
})().catch(e=>{console.error(e);process.exit(1)});
