const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../../..');
const out=path.join(root,'aerosense-wiki/audit/final-publication-20261021/cdn-document-conversions');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const plan=JSON.parse(await fs.readFile(path.join(out,'html-document-render-plan.json'),'utf8'));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({viewport:{width:1123,height:794}});
 const historical=new Map(plan.historical_remote_assets.map(x=>[x.url,x]));
 const remoteReceipts=[]; const allowedAssets=new Map(Object.entries(plan.assets));
 const errors=[]; const results=[];
 const cache=path.join(out,'historical-image-cache'); await fs.mkdir(cache,{recursive:true});
 await context.route('https://**/*',async route=>{
  const url=route.request().url();
  try{
   if(allowedAssets.has(url)){
    const asset=allowedAssets.get(url); const body=await fs.readFile(asset.local_path);
    if(hash(body)!==asset.sha256) throw new Error('Canonical source changed: '+url);
    return await route.fulfill({status:200,contentType:asset.mime_type,body});
   }
   if(historical.has(url)){
    const spec=historical.get(url); const file=path.join(cache,hash(Buffer.from(url))+'.webp');
    let body; let fromCache=true;
    try{body=await fs.readFile(file)}catch{
     fromCache=false; const response=await route.fetch({timeout:60000});
     if(response.status()!==200)throw new Error('Historical asset HTTP '+response.status()+': '+url);
     body=await response.body();
     if(!response.headers()['content-type']?.includes('image/'))throw new Error('Historical asset not an image: '+url);
     await fs.writeFile(file,body);
    }
    const sha256=hash(body);
    if(spec.expected_sha256 && spec.expected_sha256!==sha256)throw new Error('Historical asset mismatch: '+url);
    remoteReceipts.push({...spec,bytes:body.length,sha256,cache_path:file,from_cache:fromCache});
    return await route.fulfill({status:200,contentType:'image/webp',body});
   }
   errors.push({url,error:'Unexpected network resource blocked'}); return await route.abort();
  }catch(e){errors.push({url,error:String(e)});return await route.abort();}
 });
 for(const doc of plan.documents){
  const page=await context.newPage(); const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  await page.emulateMedia({media:'print'});
  await page.goto(pathToFileURL(doc.prepared_html).href,{waitUntil:'load',timeout:90000});
  await page.evaluate(async()=>{await document.fonts.ready; await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
  const qa=await page.evaluate(()=>({
   images:[...document.images].map(i=>({src:i.getAttribute('src'),complete:i.complete,natural_width:i.naturalWidth,natural_height:i.naturalHeight,width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height})),
   tables:[...document.querySelectorAll('table')].map(t=>({rows:t.rows.length,width:t.getBoundingClientRect().width,scroll_width:t.scrollWidth})),
   headings:[...document.querySelectorAll('h1,h2,h3,h4')].map(h=>h.textContent.trim()),
   document_width:document.documentElement.scrollWidth,viewport_width:window.innerWidth,
   body_text:document.body.innerText
  }));
  if(qa.images.some(i=>!i.complete || i.natural_width===0))throw new Error('Missing image in '+doc.title);
  if(qa.images.length!==doc.image_count || qa.tables.length!==doc.table_count)throw new Error('DOM structure changed for '+doc.title);
  await page.pdf({path:doc.pdf_path,format:'A4',landscape:true,printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="width:100%;font:8px Arial,sans-serif;color:#53626c;padding:0 12mm;display:flex;justify-content:space-between"><span>AeroSense · Supporting research record</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',margin:{top:'12mm',right:'12mm',bottom:'16mm',left:'12mm'}});
  const bytes=await fs.readFile(doc.pdf_path);
  results.push({...doc,pdf_sha256:hash(bytes),pdf_bytes:bytes.length,render_qa:qa,page_errors:pageErrors});
  console.log(JSON.stringify({file:path.basename(doc.pdf_path),bytes:bytes.length,images:qa.images.length,tables:qa.tables.length,overflow:qa.document_width>qa.viewport_width}));
  await page.close();
 }
 await browser.close();
 await fs.writeFile(path.join(out,'html-document-render-receipt.json'),JSON.stringify({documents:results,historical_image_receipts:remoteReceipts,network_errors:errors},null,2)+'\n');
 if(errors.length)throw new Error('Unexpected failed dependencies; inspect receipt');
})().catch(e=>{console.error(e);process.exitCode=1});
