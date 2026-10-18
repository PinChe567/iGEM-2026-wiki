/* Read-only deployment inventory. Never uploads, rewrites pages or copies assets. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const site = path.resolve(__dirname,'..');
const out = path.join(site,'igem-upload','publication');
const allowed = /\.(?:html?|css|m?js|json|jsonl|map|csv|tsv|txt|md|pdf|zip|7z|gz|bz2|tar|docx?|xlsx?|pptx?|png|jpe?g|webp|avif|gif|svg|ico|bmp|tiff?|mp4|m4v|webm|avi|mov|mp3|wav|ogg|flac|woff2?|ttf|otf|eot|glb|gltf|obj|mtl|stl|step|stp|scad|bin|wasm|pdb|cif|sdf|xyz|fasta|fa|fna|gb|gbk|genbank|gff|ab1|seq|py|ipynb|kicad_pcb|kicad_sch|kicad_pro)$/i;
const textExt = /\.(?:html?|css|m?js|json|jsonl|md|gltf|mtl)$/i;
const fileMap = new Map(), externalMap = new Map(), missing = new Map(), skipped = new Map(), templates = new Map(), visited = new Set(), queue = [], families = [];
const slash = p=>p.replaceAll('\\','/');
const relative = p=>slash(path.relative(site,p));
const decode = s=>{s=s.replaceAll('&amp;','&').replaceAll('&#32;',' ');try{return decodeURIComponent(s)}catch{return s}};
const excluded = p=>/(?:^|[/\\])(?:node_modules|igem-upload|\.git)(?:[/\\]|$)/.test(p);
const fromPath = s=>path.join(site,...s.split('/'));
// A removed local media copy is satisfied only by a preserved verified mapping.
// Existing local research/download files continue to be inventoried as before.
const verifiedMediaPath = path.join(site,'igem-upload','verified-official-urls.json');
const verifiedMedia = new Map();
if (fs.existsSync(verifiedMediaPath)) {
 for (const row of JSON.parse(fs.readFileSync(verifiedMediaPath,'utf8'))) {
  if (!row.official_url?.startsWith('https://static.igem.wiki/teams/6460/') || !/^[a-f0-9]{64}$/.test(row.response_sha256 || '')) throw new Error('Invalid preserved official media mapping.');
  for (const source of row.source_paths || []) verifiedMedia.set(source,row.official_url);
 }
}
function candidate(raw,from){
 raw=decode(String(raw).trim());
 if(!raw || /^(?:#|data:|blob:|mailto:|tel:|javascript:)/i.test(raw))return null;
 if(/^https?:\/\//i.test(raw))return {external:raw};
 if(raw.startsWith('//'))return {external:'https:'+raw};
 raw=raw.replace(/[?#].*$/,'');
 if(/[${}<>*\n\r]/.test(raw))return {template:raw};
 const possible=raw.startsWith('/')?[path.join(site,raw.slice(1))]:[path.resolve(path.dirname(from),raw),path.resolve(site,raw)];
 let excludedReason;
 for(let p of possible){
  if(!p.startsWith(site+path.sep)){if(fs.existsSync(p))excludedReason='Existing workspace file outside the publishable site root';continue;}
  if(excluded(p)){if(fs.existsSync(p))excludedReason='Existing path in an explicitly excluded directory';continue;}
  if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');
  if(fs.existsSync(p)&&fs.statSync(p).isFile())return {file:p};
 }
 for (const p of possible) {
  if (!p.startsWith(site+path.sep) || excluded(p)) continue;
  const url = verifiedMedia.get(relative(p));
  if (url) return {external:url};
 }
 return excludedReason?{excluded:raw,reason:excludedReason}:{missing:raw};
}
function add(raw,from,kind,strict=false){
 const r=candidate(raw,from);if(!r)return;
 const source=relative(from);
 if(r.external){const key=r.external;if(!externalMap.has(key))externalMap.set(key,{url:key,kinds:new Set(),referenced_by:new Set()});const e=externalMap.get(key);e.kinds.add(kind);e.referenced_by.add(source);return;}
 if(r.template){if(allowed.test(r.template)){const k=source+'|'+r.template;templates.set(k,{source,expression:r.template});}return;}
 if(r.excluded){if(strict)skipped.set(source+'|'+r.excluded,{source,path:r.excluded,reason:r.reason});return;}
 if(r.missing){if(strict&&allowed.test(r.missing))missing.set(source+'|'+r.missing,{source,path:r.missing,kind});return;}
 // Explicit HTML/document references may point to arbitrary download types
 // (e.g. a KiCad report, LICENSE or source file), not only known media suffixes.
 if(!strict&&!allowed.test(r.file))return;
 const key=relative(r.file);
 if(!fileMap.has(key)){fileMap.set(key,{path:key,file:r.file,kinds:new Set(),referenced_by:new Set()});queue.push(r.file);}
 const f=fileMap.get(key);f.kinds.add(kind);f.referenced_by.add(source);
}
function attrs(tag){const a={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs))a[m[1].toLowerCase()]=m[3];return a;}
function parse(file){
 if(visited.has(file))return;visited.add(file);
 // This provenance manifest records original/excluded editions and hashes.
 // Its strings are audit metadata, not browser dependencies or download links.
 // Public HTML/Markdown resource links are still traversed and validated below.
 if(['resources/hardware-en/publication-manifest.json','publication-files.json'].includes(relative(file)))return;
 // The design handoff links editable build layers as source downloads. Their
 // URLs are deliberately relative to the emitted css/design-system.css, not
 // to design_system/styles/. Runtime dependencies are checked in that compiled
 // stylesheet and the homepage bundle, both reached from actual page links.
 if(/^design_system\/styles\/[^/]+\.css$/.test(relative(file)))return;
 if(/\.glb$/i.test(file)){
  const fd=fs.openSync(file,'r');try{const header=Buffer.alloc(20);fs.readSync(fd,header,0,20,0);if(header.readUInt32LE(0)===0x46546c67&&header.readUInt32LE(16)===0x4e4f534a){const size=header.readUInt32LE(12);if(size<16*1024*1024){const json=Buffer.alloc(size);fs.readSync(fd,json,0,size,20);const g=JSON.parse(json.toString('utf8'));for(const item of [...(g.buffers||[]),...(g.images||[])])if(item.uri)add(item.uri,file,'glb-external-dependency',true);}}}finally{fs.closeSync(fd)}return;
 }
 if(!textExt.test(file))return;
 const full=fs.readFileSync(file,'utf8');
 // Comments document dependencies but are not deployed requests or downloads.
 const text=full.replace(/<!--[\s\S]*?-->/g,'');
 if(/\.html?$/i.test(file)){
  for(const m of text.matchAll(/<(?:a|img|source|video|audio|iframe|script|link|object|embed|meta)\b[^>]*>/gi)){
   const tag=m[0],a=attrs(tag);const t=tag.match(/^<(\w+)/)[1].toLowerCase();
   for(const key of ['src','href','poster','data','data-src','data-model','data-file','data-full','data-original','data-image'])if(a[key])add(a[key],file,t==='a'?'link-or-download':t+'-resource',true);
   if(a.srcset)for(const item of a.srcset.split(','))add(item.trim().split(/\s+/)[0],file,'responsive-image',true);
   if(t==='meta'&&a.content&&allowed.test(a.content.replace(/[?#].*$/,'')))add(a.content,file,'meta-image');
  }
 }
 for(const m of text.matchAll(/url\(\s*["']?([^\)"']+)["']?\s*\)/gi))add(m[1],file,'css-url',true);
 if(/\.md$/i.test(file))for(const m of text.matchAll(/!?\[[^\]]*\]\((?:<([^>]+)>|([^\s)]+))(?:\s+[^)]*)?\)/g))add(m[1]||m[2],file,'document-link',true);
 if(/\.gltf$/i.test(file)){try{const g=JSON.parse(text);for(const v of [...(g.buffers||[]),...(g.images||[])])if(v.uri)add(v.uri,file,'gltf-dependency',true);}catch{}}
 // Quoted paths include data attributes, data manifests, lazy imports and JS URLs.
 const literals=[...text.matchAll(/(["'`])([^"'`\r\n]+)\1/g)].map(m=>m[2]);
 const bases=[];
 for(const raw of literals){
  if(raw.endsWith('/')&&!/[${}<>]/.test(raw)){
   for(const base of [path.resolve(path.dirname(file),decode(raw)),path.resolve(site,decode(raw))])if(base.startsWith(site+path.sep)&&!excluded(base)&&fs.existsSync(base)&&fs.statSync(base).isDirectory())bases.push(base);
  }
  if(allowed.test(decode(raw).replace(/[?#].*$/,'')))add(raw,file,'literal-reference');
 }
 for(const raw of literals){
  if(/[\/]/.test(raw)||!allowed.test(raw)||/[${}<>]/.test(raw))continue;
  for(const base of bases){const f=path.join(base,decode(raw));if(fs.existsSync(f)&&fs.statSync(f).isFile())add(relative(f),fromPath('index.html'),'dynamic-prefix:'+relative(file));}
 }
}
function drain(){for(let i=0;i<queue.length;i++)parse(queue[i]);}
function family(name,source,paths){const before=fileMap.size;for(const p of paths)add(p,fromPath(source),'dynamic-family:'+name,true);families.push({name,source,expected_paths:paths.length,new_paths:fileMap.size-before,paths});}
function csv(rows){return '\ufeff'+rows.map(row=>row.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(',')).join('\r\n')+'\r\n'}
function readCsv(text){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else if(c!=='\ufeff')cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}return rows;}
function sha(file){return new Promise((resolve,reject)=>{const h=crypto.createHash('sha256');const s=fs.createReadStream(file);s.on('error',reject);s.on('data',chunk=>h.update(chunk));s.on('end',()=>resolve(h.digest('hex')));});}
async function main(){
 const entries=fs.readdirSync(site).filter(f=>f.endsWith('.html')).sort();
 for(const name of entries)add(name,fromPath('index.html'),'entry-page',true);
 drain();
 // Home videos run exclusively through official embeds. The eight original
 // MP4/WebM files are retained for evaluation, not runtime dependencies.
 family('homepage-official-video-embeds','index.html',[
  'e9061255-56e7-4587-ad3d-13358b46b76d','bfb52eef-be2b-497f-9f0d-df724ae8514d',
  '46349dd9-79d5-43c7-b619-ee7fc177680b','6e3cf0fe-1525-4155-80b2-d645cd098f51'
 ].map(id=>'https://video.igem.org/videos/embed/'+id+'?api=1&p2p=0&muted=1&autoplay=0&controls=0&title=0&warningTitle=0'));
 const micro='assets/results/microscopy/';
 const microscopy=[...verifiedMedia.keys()].filter(p=>p.startsWith(micro)&&/\/field-\d{2}-[^/]+\.(?:webp|png)$/.test(p));
 if(microscopy.length!==225)throw new Error('Expected 225 verified microscopy image paths.');
 family('microscopy-all-fields-and-views','results.html',microscopy);
 family('pcb-four-layout-views','hardware.html',['TOP','BTM'].flatMap(side=>['','_Etch'].map(etch=>'hardware information/pcb v2/PCB_'+side+etch+'.png')));
 family('schematic-pages','hardware.html',[1,2].map(n=>'fig/hardware/schematics/reader-schematic-'+n+'.png'));
 family('pcb-flow-responsive-bilingual','hardware.html',['wide','stacked'].flatMap(layout=>['en','zh-Hant'].map(language=>'assets/hardware/pcb-flow-v32/pcb-flow-'+layout+'-'+language+'.svg')));
 family('optical-spectra-bilingual','hardware.html',['en','zh-Hant'].flatMap(language=>['svg','png'].map(extension=>'assets/hardware/optics-v38/spectral-alignment-'+language+'.'+extension)));
 family('product-story-current-pcb-drawings','hardware.html',['top','bottom'].map(side=>'assets/hardware/product-story/pcb-'+side+'-0911.png'));
 // STL names in the viewer are GLB part identifiers. Original print files are kept only in the Zenodo package.
 drain();
 const prior=new Map();const old=path.join(out,'all-assets-inventory.json');if(fs.existsSync(old)){for(const a of JSON.parse(fs.readFileSync(old,'utf8')).assets||[])if(a.official_url)prior.set(a.sha256,a.official_url);}
 const imageManifest=fromPath('igem-upload/manifest.json');if(fs.existsSync(imageManifest))for(const a of JSON.parse(fs.readFileSync(imageManifest,'utf8')).assets||[])if(a.official_url)prior.set(a.sha256,a.official_url);
 for(const filename of [fromPath('igem-upload/official-urls.csv'),path.join(out,'all-assets-inventory.csv')])if(fs.existsSync(filename)){const rows=readCsv(fs.readFileSync(filename,'utf8')),head=rows.shift()||[],shaIndex=head.indexOf('sha256'),urlIndex=head.indexOf('official_url');if(shaIndex>=0&&urlIndex>=0)for(const row of rows)if(row[urlIndex])prior.set(row[shaIndex],row[urlIndex]);}
 const groups=new Map();
 for(const entry of fileMap.values()){
  const bytes=fs.statSync(entry.file).size,digest=await sha(entry.file);
  if(!groups.has(digest))groups.set(digest,{sha256:digest,bytes,paths:[],extensions:new Set(),kinds:new Set(),referenced_by:new Set(),official_url:prior.get(digest)||''});
  const a=groups.get(digest);a.paths.push(entry.path);a.extensions.add(path.extname(entry.path).slice(1).toLowerCase());entry.kinds.forEach(x=>a.kinds.add(x));entry.referenced_by.forEach(x=>a.referenced_by.add(x));
 }
 const assets=[...groups.values()].map(a=>({...a,paths:a.paths.sort(),extensions:[...a.extensions].sort(),kinds:[...a.kinds].sort(),referenced_by:[...a.referenced_by].sort(),upload_status:a.official_url?'URL supplied; upload not independently tested':'Official destination unfilled; not uploaded by this audit'})).sort((a,b)=>a.paths[0].localeCompare(b.paths[0]));
 const byType={};for(const a of assets){const k=a.extensions.join('/');byType[k]??={unique_files:0,bytes:0};byType[k].unique_files++;byType[k].bytes+=a.bytes;}
 const videos=assets.filter(a=>a.extensions.some(x=>/^(mp4|m4v|webm|avi|mov)$/.test(x))).map(a=>({paths:a.paths,bytes:a.bytes,sha256:a.sha256,referenced_by:a.referenced_by,action:'Plan a Video Universe upload and embed replacement; no upload or account/file-type validation performed.'}));
 const summaryOut={generated_at:new Date().toISOString(),entry_pages:entries,linked_paths:fileMap.size,unique_sha256_files:assets.length,total_unique_bytes:assets.reduce((n,a)=>n+a.bytes,0),total_linked_path_bytes:[...fileMap.values()].reduce((n,a)=>n+fs.statSync(a.file).size,0),by_extension:byType,largest_files:[...assets].sort((a,b)=>b.bytes-a.bytes).slice(0,35).map(a=>({paths:a.paths,bytes:a.bytes,sha256:a.sha256})),local_videos_for_video_universe:videos,missing_explicit_references:[...missing.values()],excluded_existing_references:[...skipped.values()],external_sources:[...externalMap.values()].map(e=>({...e,kinds:[...e.kinds].sort(),referenced_by:[...e.referenced_by].sort()})).sort((a,b)=>a.url.localeCompare(b.url)),dynamic_families:families,unresolved_template_literals:[...templates.values()],limitations:['Static dependency graph from every root HTML page, recursively follows linked HTML/CSS/JS/JSON/Markdown/GLTF and quoted asset literals. Explicit dynamic families are listed. Runtime strings generated from remote or arbitrary user data cannot be proven complete by static scanning.','node_modules, igem-upload itself and unlinked files are excluded. Large CTB files are not swept in. No bytes are copied, edited, compressed or uploaded.','Official file-type, per-file, total-size and upload rules remain unverified in the authenticated team portal. An official_url field is a mapping slot, not proof of deployment.']};
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'all-assets-inventory.json'),JSON.stringify({summary:summaryOut,assets},null,2));
 // Keep one canonical inventory. CSV exports would duplicate the same records.
 console.log(JSON.stringify({linked_paths:summaryOut.linked_paths,unique_sha256_files:assets.length,unique_gib:summaryOut.total_unique_bytes/1024**3,missing_explicit_references:summaryOut.missing_explicit_references,local_videos:videos.map(v=>v.paths),dynamic_families:families.map(f=>({name:f.name,expected_paths:f.expected_paths})),external_sources:summaryOut.external_sources.length},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
