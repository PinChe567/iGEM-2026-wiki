const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
 for(const width of [1440,390]){
  const ctx=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1});
  await ctx.route('**/*',async r=>{if(r.request().isNavigationRequest()&&!r.request().url().startsWith('http://127.0.0.1:8011/'))return r.abort();return r.continue();});
  for(const name of ['education','contribution','safety-and-security']){
   const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`http://127.0.0.1:8011/${name}.html`,{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForTimeout(700);
   await page.evaluate(async()=>{document.querySelectorAll('main details').forEach(e=>e.open=true);for(let y=0;y<document.body.scrollHeight;y+=1000){scrollTo(0,y);await new Promise(r=>setTimeout(r,10));}scrollTo(0,0)});
   await page.waitForTimeout(1200);
   const report=await page.evaluate(()=>{
    const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
    const overflow=[...document.querySelectorAll('main *')].filter(e=>{const b=e.getBoundingClientRect(),s=getComputedStyle(e);return b.width&&s.visibility!=='hidden'&&s.display!=='none'&&s.position!=='fixed'&&!e.closest('[hidden],[aria-hidden=true],.cite-preview,.table-scroll')&&(b.left< -2||b.right>innerWidth+2)}).slice(0,20).map(e=>({tag:e.tagName,id:e.id,class:e.className,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}));
    return {viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,wide:overflow,duplicates:[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))],missingAnchors:[...new Set([...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>h.length>1&&!document.getElementById(decodeURIComponent(h.slice(1)))))],brokenImages:[...document.images].filter(i=>i.getAttribute('src')&&i.complete&&!i.naturalWidth).map(i=>i.currentSrc),toolkitFiles:document.querySelectorAll('.edu-toolkit-disclosure li').length,restrictedBadgeCount:document.querySelectorAll('.saf-status[data-status=restricted]').length,openItemsHeading:[...document.querySelectorAll('h2')].some(e=>e.textContent.includes('Open items')),learningChart:document.querySelector('#learning-lab-cohort-comparison img')?.currentSrc};
   });
   if(name==='education'){
    for(const id of ['learning-lab-cohort-comparison','education-teacher-toolkit','camp-creative-wall']){const e=page.locator('#'+id);await e.scrollIntoViewIfNeeded();await e.screenshot({path:path.join(__dirname,`${name}-${id}-${width}.png`),timeout:20000});}
    const details=page.locator('.edu-toolkit-disclosure');await details.evaluate(e=>e.open=false);await details.locator(':scope > summary').click();report.toolkitTogglePassed=await details.evaluate(e=>e.open);
   }
   if(name==='contribution'){await page.locator('#pkg-biology').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(__dirname,`contribution-${width}.png`)});}
   if(name==='safety-and-security'){await page.locator('#compliance').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(__dirname,`safety-${width}.png`)});}
   results.push({name,width,...report,errors});console.log(JSON.stringify({name,width,overflow:report.overflow,errors,brokenImages:report.brokenImages,duplicates:report.duplicates,missingAnchors:report.missingAnchors,toolkitTogglePassed:report.toolkitTogglePassed}));await page.close();
  }await ctx.close();
 }await browser.close();fs.writeFileSync(path.join(__dirname,'editorial-revision-browser-qa.json'),JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exit(1)});

