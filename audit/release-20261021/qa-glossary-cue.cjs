const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),out=[];
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1100}});
  await page.goto('http://127.0.0.1:8011/glossary.html',{waitUntil:'domcontentloaded'});await page.waitForTimeout(800);
  const test=await page.evaluate(()=>{
   const a=document.querySelector('.glossary-chat__signature').getBoundingClientRect(),b=document.querySelector('.glossary-scroll-cue').getBoundingClientRect();
   return {overlap:Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top),verticalGap:b.top-a.bottom,overflow:document.documentElement.scrollWidth>innerWidth+1,cuePosition:getComputedStyle(document.querySelector('.glossary-scroll-cue')).position};
  });
  if(test.overlap||test.overflow)throw new Error(JSON.stringify({width,...test}));
  await page.screenshot({path:path.join(__dirname,`qa-glossary-cue-fixed-${width}.png`)});out.push({width,...test});await page.close();
 }
 await browser.close();fs.writeFileSync(path.join(__dirname,'glossary-cue-browser-qa.json'),JSON.stringify(out,null,2)+'\n');console.log(out);
})().catch(e=>{console.error(e);process.exit(1)});
