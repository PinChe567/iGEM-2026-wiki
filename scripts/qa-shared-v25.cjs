const{chromium}=require('../game/node_modules/playwright'),fs=require('fs'),path=require('path');
const site=path.resolve(__dirname,'..'),out=path.resolve(site,'../reports/review-v25/shared');fs.mkdirSync(out,{recursive:true});
const allRoutes=fs.readdirSync(site).filter(n=>n.endsWith('.html')&&!['index.html','glossary.html'].includes(n)).concat('learning-platform/progress.html');
// A scoped rerun replaces only its matching route/width records in the existing report.
const args=process.argv.slice(2);
if(args.some(a=>!a.startsWith('--route=')))throw new Error('Use --route=credits.html (repeat or comma-separate routes).');
const selectedRoutes=args.flatMap(a=>a.slice('--route='.length).split(',')).filter(Boolean);
if(args.length&&!selectedRoutes.length)throw new Error('The route filter must not be empty.');
for(const route of selectedRoutes)if(!allRoutes.includes(route))throw new Error('Unknown route: '+route);
const routes=selectedRoutes.length?allRoutes.filter(r=>selectedRoutes.includes(r)):allRoutes;
const reportPath=path.join(out,'checks.json'),previous=selectedRoutes.length&&fs.existsSync(reportPath)?JSON.parse(fs.readFileSync(reportPath,'utf8')):[];
const untouched=previous.filter(r=>!routes.includes(r.route));
function saveRows(rows){const merged=previous.slice();for(const row of rows){const index=merged.findIndex(r=>r.route===row.route&&r.width===row.width);if(index<0)merged.push(row);else merged[index]=row;}if(JSON.stringify(merged.filter(r=>!routes.includes(r.route)))!==JSON.stringify(untouched))throw new Error('Scoped rerun changed unrelated records.');fs.writeFileSync(reportPath,JSON.stringify(merged,null,2));}
const rootPages=['human-practices.html','entrepreneurship.html','education.html','sustainability.html','engineering.html','safety-and-security.html'];
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),rows=[];
 for(const route of routes)for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:960},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{const q=r.request();if(q.resourceType()==='document'&&!q.url().startsWith('http://127.0.0.1:8011/')&&q.frame().parentFrame())r.abort();else r.continue();});
  const row={route,width,errors};
  try{await page.goto('http://127.0.0.1:8011/'+route,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.AeroSenseI18n&&!document.querySelector('[data-language-toggle]')?.disabled);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(120);
   for(const lang of rootPages.includes(route)?['en','zh-Hant']:['en']){
    await page.evaluate(lang=>window.AeroSenseI18n.setLanguage(lang),lang);await page.waitForTimeout(60);
    const state=await page.evaluate(()=>{const hero=document.querySelector('.page-hero,.members-intro,.learn-hero,.lm-hero,.credits-intro'),crumb=document.querySelector('nav.page-breadcrumb'),r=e=>e?.getBoundingClientRect(),main=document.querySelector('.page-main-column'),slot=document.querySelector('.page-toc-slot');
     // Compare the reading content edge, including inner layout padding, rather than its outer shell.
     const content=main?.querySelector('.page-article')||main,style=content&&getComputedStyle(content),contentLeft=content?r(content).left+(parseFloat(style.borderLeftWidth)||0)+(parseFloat(style.paddingLeft)||0):null,alignmentDelta=content&&crumb?r(crumb).left-contentLeft:null;
     return {overflow:document.documentElement.scrollWidth>innerWidth+1,hero:r(hero)?.toJSON(),crumb:r(crumb)?.toJSON(),count:document.querySelectorAll('nav.page-breadcrumb').length,outside:!!crumb&&!hero?.contains(crumb),after:hero?.nextElementSibling===crumb,aligned:!content||alignmentDelta!==null&&Math.abs(alignmentDelta)<2,alignmentTarget:content?.classList.contains('page-article')?'.page-article':'.page-main-column',contentLeft,alignmentDelta,tocLeft:!slot||innerWidth<1100||r(slot).right<=r(main).left+2,fullBleed:hero?.classList.contains('credits-intro')||Math.abs(r(hero).x)<2&&Math.abs(r(hero).right-document.documentElement.clientWidth)<2,h1:document.querySelector('main h1')?.innerText};});
    row[lang]=state;
    if(rootPages.includes(route)&&width===390)await page.screenshot({path:path.join(out,route.replace('.html','')+'-'+width+'-'+lang+'.png')});
   }
   row.pass=!errors.length&&Object.values(row).filter(x=>x&&typeof x==='object'&&'overflow'in x).every(s=>!s.overflow&&s.count===1&&s.outside&&s.after&&s.aligned&&s.tocLeft&&s.fullBleed);
  }catch(e){row.pass=false;row.error=e.message;}
  rows.push(row);await page.close();saveRows(rows);console.log(route,width,row.pass?'PASS':'FAIL');
 }
 await browser.close();console.log(JSON.stringify({cases:rows.length,preservedCases:untouched.length,failures:rows.filter(r=>!r.pass).map(r=>({route:r.route,width:r.width,error:r.error,en:r.en,zh:r['zh-Hant']}))}));if(rows.some(r=>!r.pass))process.exitCode=1;
})();
