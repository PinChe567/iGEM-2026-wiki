import {chromium} from 'file:///C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';

const audit=path.dirname(fileURLToPath(import.meta.url));
const root=fs.realpathSync(path.resolve(process.argv[2]||'gitlab/nthu/.build-check/engineering-backend-new-public'));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.pdf':'application/pdf','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 try {
  let rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/nthu(?=\/|$)/,'');
  let file=path.resolve(root,'.'+(rel||'/'));
  if(!file.startsWith(root+path.sep)&&file!==root)throw Error('Outside root');
  if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  const bytes=fs.readFileSync(file);
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true});
const records=process.env.QA_WIDTH==='390'?JSON.parse(fs.readFileSync(path.join(audit,'built-pages-qa-progress.json'),'utf8')).filter(r=>r.width===1440):[];
try {
for(const width of (process.env.QA_WIDTH?[Number(process.env.QA_WIDTH)]:[1440,390]))for(const slug of ['engineering','hardware']){
 console.log(JSON.stringify({checking:slug,width}));
 const page=await browser.newPage({viewport:{width,height:1000}}), errors=[], localFailures=[], pending=new Set();
 page.on('request',r=>pending.add(r.url()));
 page.on('requestfinished',r=>pending.delete(r.url()));
 page.on('requestfailed',r=>pending.delete(r.url()));
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)localFailures.push({url:r.url(),status:r.status()});});
 try {await page.goto(`${origin}/nthu/${slug}/`,{waitUntil:'domcontentloaded',timeout:45000});}
 catch(e){console.log(JSON.stringify({navigationError:e.message,pending:[...pending]}));throw e;}
 console.log(JSON.stringify({loaded:slug,width}));
 await page.waitForFunction(()=>window.AeroSenseI18n&&typeof window.AeroSenseI18n.setLanguage==='function');
 if(slug==='engineering')await page.locator('[data-eng-reading-toggle]').click();
 const figures=[];
 if(slug==='engineering')for(const id of ['engineering-power-control','engineering-historical-cad','engineering-cap-iteration','engineering-tia-diagnostic']){
  const loc=page.locator('#'+id);await loc.scrollIntoViewIfNeeded();
  await page.waitForFunction(id=>{const i=document.querySelector('#'+id+' img');return i.complete&&i.naturalWidth>0;},id);
  figures.push(await loc.evaluate(e=>({id:e.id,label:e.querySelector('.media-caption__label').textContent.trim(),src:e.querySelector('img').currentSrc,width:e.getBoundingClientRect().width})));
 }
 for(const language of ['en','zh-Hant']){
  await page.evaluate(l=>window.AeroSenseI18n.setLanguage(l,false),language);
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const target=page.locator(slug==='engineering'?'#engineering-tia-diagnostic':'#reader-pattern-backend');
  await target.scrollIntoViewIfNeeded();
  const state=await page.evaluate(({slug,language})=>{
   const target=document.querySelector(slug==='engineering'?'#hw-cycle-6':'#reader-pattern-backend');
   const figures=[...document.querySelectorAll('figure[id^="engineering-"]')];
   const links=[...document.querySelectorAll('a[href]')];
   return {slug,language,overflow:document.documentElement.scrollWidth>innerWidth+1,base:document.baseURI,text:target.textContent.trim(),labels:[...document.querySelectorAll('figure[data-static-figure-number] .media-caption__label')].map(e=>e.textContent.trim()),captions:figures.map(e=>e.querySelector('figcaption').textContent.trim()),newLinks:links.filter(e=>/engineering-evidence-guide|PUBLICATION_GUIDE|reference.*\.json/i.test(e.href)).map(e=>({text:e.textContent.trim(),href:e.href})),fragmentRouting:links.filter(e=>e.getAttribute('href').startsWith('#')).every(e=>new URL(e.href).pathname===`/nthu/${slug}.html`)};
  },{slug,language});
  await target.screenshot({path:path.join(audit,`${slug}-${width}-${language}.png`)});
  if(slug==='engineering')await page.locator('#engineering-power-control').screenshot({path:path.join(audit,`power-${width}-${language}.png`)});
  records.push({width,...state,figures,errors:[...errors],localFailures:[...localFailures]});
  fs.writeFileSync(path.join(audit,'built-pages-qa-progress.json'),JSON.stringify(records,null,2)+'\n');
 }
 await page.close();
}
} finally {await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
const failures=[];
for(const r of records){
 if(r.overflow||r.errors.length||r.localFailures.length||!r.fragmentRouting)failures.push({width:r.width,slug:r.slug,language:r.language,type:'layout/runtime/routing'});
 if(r.language==='zh-Hant'&&!/[\u4e00-\u9fff]/.test(r.text))failures.push({width:r.width,slug:r.slug,type:'translation'});
 if(r.slug==='engineering'&&(r.figures.length!==4||r.figures.some(f=>!f.src.startsWith('https://static.igem.wiki/'))))failures.push({width:r.width,type:'figure hosting/loading'});
 if(r.slug==='engineering'&&r.language==='en'&&r.labels.join(',')!=='Figure 1.,Figure 2.,Figure 3.,Figure 4.,Figure 5.,Figure 6.,Figure 7.,Figure 8.,Figure 9.')failures.push({width:r.width,type:'figure labels'});
}
const report={passed:!failures.length,served_root:root,real_official_cdn:true,no_route_interceptions:true,records,failures};
fs.writeFileSync(path.join(audit,'built-pages-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,served_root:root,records:records.length,failures,details:records.map(({width,slug,language,overflow,errors,localFailures,fragmentRouting,newLinks})=>({width,slug,language,overflow,errors,localFailures,fragmentRouting,newLinks}))},null,2));
if(!report.passed)process.exitCode=1;
