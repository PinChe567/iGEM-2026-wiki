// Local static preview with byte ranges, so video scrubbing need not copy an
// entire movie into a Blob. No dependencies and no publishing behavior.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const port = Number(process.argv[2] || 8000);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.svg':'image/svg+xml','.ico':'image/x-icon','.mp4':'video/mp4','.webm':'video/webm','.glb':'model/gltf-binary','.pdf':'application/pdf','.woff2':'font/woff2','.stl':'model/stl','.csv':'text/csv; charset=utf-8'};
const inside = name => name===root || name.startsWith(root+path.sep);
http.createServer(async(req,res)=>{
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405,{Allow:'GET, HEAD'}).end();return;}
  try {
    const url = new URL(req.url,'http://localhost');
    // The official /nthu prefix and extensionless standard pages can be checked locally.
    const pathname = decodeURIComponent(url.pathname).replace(/^\/nthu(?=\/|$)/, '') || '/';
    let file = path.resolve(root,'.'+pathname);
    if (!inside(file)) {res.writeHead(403).end();return;}
    let stat;
    try {stat = await fs.promises.stat(file);}
    catch(error) {
      if(error.code !== 'ENOENT' || path.extname(file)) throw error;
      file = file.replace(/[\\/]$/, '') + '.html';
      stat = await fs.promises.stat(file);
    }
    if(stat.isDirectory()){
      const directory=file;
      try {file=path.join(directory,'index.html');stat=await fs.promises.stat(file);}
      catch(error) {
        if(error.code!=='ENOENT' || path.extname(directory)) throw error;
        file=directory+'.html';stat=await fs.promises.stat(file);
      }
    }
    if(!inside(await fs.promises.realpath(file))||!stat.isFile()){res.writeHead(403).end();return;}
    const headers = {'Content-Type':types[path.extname(file).toLowerCase()]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'};
    let start=0,end=stat.size-1,status=200;
    if(req.headers.range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
      start=match[1]?Number(match[1]):Math.max(0,stat.size-Number(match[2]));
      end=match[1]&&match[2]?Math.min(Number(match[2]),stat.size-1):stat.size-1;
      if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
      status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
    }
    headers['Content-Length']=String(Math.max(0,end-start+1));
    res.writeHead(status,headers);
    if(req.method==='HEAD'||!stat.size){res.end();return;}
    const stream=fs.createReadStream(file,{start,end});
    stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
  }catch(error){if(!res.headersSent)res.writeHead(error.code==='ENOENT'?404:400,{'Content-Type':'text/plain'});res.end('File unavailable');}
}).listen(port,'127.0.0.1',()=>console.log(`AeroSense preview: http://127.0.0.1:${port}/index.html`));
