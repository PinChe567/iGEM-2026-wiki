// Update cache-query hashes for local code/HTML only; never change remote URLs.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const site = "C:\\Users\\user\\Desktop\\\u5927\u5b78\u7684\u6771\u897f\\iGEM\\lolab 1th\\wiki\\aerosense-wiki";
const inside=p=>p.startsWith(site+path.sep);
const files=[];
function walk(directory){
  if(!fs.existsSync(directory)) return;
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
    const p=path.join(directory,entry.name);
    if(entry.isDirectory()&&entry.name!=='vendor')walk(p);
    else if(entry.isFile()&&/\.(?:html|js|mjs|css)$/.test(p))files.push(p);
  }
}
for(const name of fs.readdirSync(site))if(name.endsWith('.html'))files.push(path.join(site,name));
for(const name of ['js','css','templates','learning-platform','design_system'])walk(path.join(site,name));
const pattern=/(["'])([^"'\s<>]+)\?v=([a-f0-9]{8,64})([^"'\s<>]*)\1/g;
let total=0,converged=false;
for(let pass=0;pass<12;pass++){
  let changed=0;
  for(const file of files){
    const before=fs.readFileSync(file,'utf8');
    const after=before.replace(pattern,(match,quote,url,digest,tail)=>{
      if(/^[a-z][a-z0-9+.-]*:/i.test(url)||url.startsWith('//')||url.includes('\\'))return match;
      let decoded;try{decoded=decodeURIComponent(url)}catch{return match}
      const candidates=decoded.startsWith('/nthu/')?[path.resolve(site,decoded.slice(6))]:decoded.startsWith('/')?[]:[path.resolve(path.dirname(file),decoded),path.resolve(site,decoded)];
      const target=candidates.find(p=>inside(p)&&fs.existsSync(p)&&fs.statSync(p).isFile());
      if(!target||!/\.(?:css|js|mjs|html)$/.test(target))return match;
      const hash=createHash('sha256').update(fs.readFileSync(target)).digest('hex').slice(0,digest.length);
      return quote+url+'?v='+hash+tail+quote;
    });
    if(after!==before){fs.writeFileSync(file,after);changed++;total++;}
  }
  if(!changed){converged=true;break}
}
if(!converged)throw new Error('Cache hashes did not converge; inspect circular hash references.');
console.log(JSON.stringify({local_hash_refresh:true,file_writes:total,remote_urls_unchanged:true}));
