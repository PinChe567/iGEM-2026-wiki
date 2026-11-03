const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const names=['description','design','results','measurement','experiments','parts','contribution','safety-and-security','credits','index','members','glossary','attributions','notebook','human-practices','education','entrepreneurship','sustainability'];
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const output=[];
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1});
  await context.route('**/*',async route=>{
   const req=route.request();
   if(req.isNavigationRequest()&&!req.url().startsWith('http://127.0.0.1:8011/'))return route.abort();
   return route.continue();
  });
  let next=0;
  const worker=async()=>{while(next<names.length){
   const name=names[next++],page=await context.newPage();const errors=[],failed=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()});});
   await page.goto(`http://127.0.0.1:8011/${name}.html`,{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForTimeout(900);
   await page.evaluate(async()=>{
    for(let y=0;y<document.body.scrollHeight;y+=900){scrollTo(0,y);await new Promise(r=>setTimeout(r,12));}
    scrollTo(0,0);
   });
   await page.waitForTimeout(1000);
   const data=await page.evaluate(()=>{
    const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
    const wide=[...document.querySelectorAll('main *')].filter(e=>{
     const r=e.getBoundingClientRect(),s=getComputedStyle(e);
     if(r.width===0||s.position==='fixed'||s.visibility==='hidden'||s.display==='none')return false;
     if(e.closest('.table-scroll,[hidden],.cite-preview,[aria-hidden="true"],.menu-panel'))return false;
     return r.left < -2 || r.right > innerWidth+2;
    }).slice(0,25).map(e=>({tag:e.tagName,id:e.id,class:e.className,left:Math.round(e.getBoundingClientRect().left),right:Math.round(e.getBoundingClientRect().right)}));
    return {documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,wideElements:wide,duplicateIDs:[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))],missingAnchors:[...new Set([...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>h.length>1&&!document.getElementById(decodeURIComponent(h.slice(1)))))],brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.currentSrc||i.src),headings:[...document.querySelectorAll('main h2')].map(x=>x.textContent.trim())};
   });
   if(['safety-and-security','notebook','results','design','parts','glossary','members','index'].includes(name))await page.screenshot({path:path.join(__dirname,`qa-editorial-${name}-${width}.png`)});
   output.push({page:name,width,...data,errors,failed});
   console.log(`${name} ${width}: overflow=${data.overflow}, errors=${errors.length}, brokenImages=${data.brokenImages.length}, HTTP errors=${failed.length}`);
   await page.close();
  }};
  await Promise.all([worker(),worker()]);await context.close();
 }
 await browser.close();fs.writeFileSync(path.join(__dirname,'editorial-browser-qa.json'),JSON.stringify(output,null,2)+'\n');
})().catch(e=>{console.error(e);process.exit(1)});
