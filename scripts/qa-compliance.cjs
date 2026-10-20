/* Read-only source audit. Writes one current report, never publishes or copies the wiki.
 * Run: node scripts/qa-compliance.cjs
 * Network playback, permissions, citation accuracy and official submission status
 * require independent evidence; this scanner does not claim to certify them.
 */
const fs = require('node:fs');
const path = require('node:path');
const site = path.resolve(__dirname, '..');
const out = path.join(site, 'audit', 'compliance-review.json');
const slash = p => p.replaceAll('\\', '/');
const rel = p => slash(path.relative(site, p));
const read = p => fs.readFileSync(p, 'utf8');
const decode = s => {
  s = String(s).replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&quot;', '"');
  try { return decodeURIComponent(s); } catch { return s; }
};
const official = host => /(^|\.)igem\.(org|wiki)$/i.test(host);
const external = s => /^https?:\/\//i.test(s) || s.startsWith('//');
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map(m => [m[1].toLowerCase(), decode(m[3])]));
const clean = text => text.replace(/<!--[\s\S]*?-->/g, '');
const display = text => text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const pages = fs.readdirSync(site).filter(n => n.endsWith('.html')).sort();
const issues = [];
const runtime = new Map();
const outbound = new Map();
const pending = [];
const seen = new Set();
const identifiersCache = new Map();
const pageRecords = [];
function issue(severity, code, source, detail, target) { issues.push({severity, code, source, detail, ...(target ? {target} : {})}); }
function resolve(raw, from) {
  raw = decode(raw);
  if (/^(?:data:|blob:|mailto:|tel:|javascript:)/i.test(raw)) return null;
  if (external(raw)) return {url: raw.startsWith('//') ? 'https:' + raw : raw};
  let [p, anchor] = raw.split('#', 2);
  p = p.split('?')[0];
  if (/[${}<>\n\r]/.test(p)) return {dynamic:true};
  if (p.startsWith('/nthu/')) p = p.slice(6);
  const f = p ? path.resolve(p.startsWith('/') ? site : path.dirname(from), p.replace(/^\/+/, '')) : from;
  if (f !== site && !f.startsWith(site + path.sep)) return {file:f, anchor, outside:true};
  const choices = [f, f + '.html', path.join(f, 'index.html')];
  const file = choices.find(x => fs.existsSync(x) && fs.statSync(x).isFile());
  return {file:file || f, anchor, exists:!!file};
}
function record(raw, from, kind, runtimeRequest, location) {
  if (!raw) return;
  const source = rel(from), target = resolve(raw, from);
  if (!target || target.dynamic) return;
  if (target.url) {
    let u; try { u = new URL(target.url); } catch { issue('error','invalid-url',source,kind,raw); return; }
    const map = runtimeRequest ? runtime : outbound;
    const key = u.href;
    if (!map.has(key)) map.set(key, {url:key, host:u.hostname, official:official(u.hostname), uses:[]});
    const entry = map.get(key);
    if (!entry.uses.some(x => x.source === source && x.kind === kind)) entry.uses.push({source,kind});
    if (runtimeRequest && !official(u.hostname)) issue('error','external-runtime',source,kind,key);
    if (/drive\.google\.com|docs\.google\.com|forms\.gle|notion\.so|notion\.site/i.test(u.hostname)) issue(runtimeRequest?'error':'review','external-team-content',source,runtimeRequest?'External hosted content is a runtime dependency.':'Outbound link: inspect whether this contains essential team work that must be preserved on iGEM.',key);
    if ((/^(?:video|audio)-src$/.test(kind) || kind === 'source-src' && /\.(?:mp4|m4v|webm|avi|mov|mp3|wav|ogg|flac)(?:[?#]|$)/i.test(key)) && u.hostname !== 'video.igem.org') issue('error','non-video-universe-media',source,kind,key);
    return;
  }
  if (!target.exists) {
    issue('error', target.outside ? 'outside-site-dependency' : 'missing-local-target', source, kind, raw);
    return;
  }
  if (target.anchor && /\.html?$/i.test(target.file)) {
    if (!identifiersCache.has(target.file)) {
      const html = clean(read(target.file)).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
      identifiersCache.set(target.file,new Set([...html.matchAll(/<[a-z][^>]*>/gi)].flatMap(m => {const a=attrs(m[0]);return [a.id,a.name].filter(Boolean)})));
    }
    const identifiers = identifiersCache.get(target.file);
    if (!identifiers.has(target.anchor)) issue('review','unresolved-static-anchor',source,'Anchor is not in static HTML; a rendered-page check is needed for dynamically generated targets.',raw);
  }
  if (runtimeRequest && /\.(?:png|jpe?g|gif|webp|avif|ico|bmp|tiff?|woff2?|ttf|otf|eot)$/i.test(target.file)) issue('error','local-static-media',source,'Upload static media/fonts to the official CDN and use the verified URL.',raw);
  if (runtimeRequest && /\.(?:mp4|m4v|webm|avi|mov|mp3|wav|ogg|flac)$/i.test(target.file)) issue('error','local-audiovisual-media',source,'Use an approved Video Universe embed.',raw);
  if (/\.(?:html?|css|m?js)$/i.test(target.file) && (runtimeRequest || /\.html?$/i.test(target.file))) pending.push(target.file);
}
function inspect(file) {
  if (seen.has(file)) return;
  seen.add(file);
  const source = rel(file), text = clean(read(file));
  if (/\.html?$/i.test(file)) {
    for (const match of text.matchAll(/<(a|img|source|video|audio|iframe|script|link|object|embed)\b[^>]*>/gi)) {
      const tag = match[1].toLowerCase(), a = attrs(match[0]);
      for (const key of ['src','poster','data','data-src','data-image','data-full','data-original','data-pdf-preview-src']) {
        if (a[key]) record(a[key],file,`${tag}-${key}`,true);
      }
      if (a.href) {
        const resource = tag === 'link' && !/\b(?:canonical|alternate|author|license)\b/i.test(a.rel || '');
        record(a.href,file,`${tag}-href`,resource);
      }
      if (a.srcset) for (const entry of a.srcset.split(',')) record(entry.trim().split(/\s+/)[0],file,`${tag}-srcset`,true);
    }
    const ids = [...text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').matchAll(/<[a-z][^>]*>/gi)].map(m=>attrs(m[0]).id).filter(Boolean);
    for (const id of new Set(ids.filter((x,i) => ids.indexOf(x) !== i))) issue('error','duplicate-id',source,'Duplicate static IDs cause ambiguous anchors.',id);
    for (const m of text.matchAll(/<img\b[^>]*>/gi)) if (!/\balt\s*=/.test(m[0])) issue('review','image-missing-alt',source,'Image has no alt attribute.',attrs(m[0]).src);
    // Root pages use one shared design system; the homepage bundles its sources.
    if (pages.includes(source)) {
      const footer = [...text.matchAll(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi)].map(m=>m[0]).join('\n');
      const styles = [...text.matchAll(/<link\b[^>]*>/gi)].map(m=>attrs(m[0])).filter(a=>a.rel==='stylesheet').map(a=>a.href);
      const shared = source === 'index.html' ? /home(?:-core|\.bundle)\.css/.test(styles.join(' ')) : styles.some(s=>/css\/design-system\.css/.test(s));
      const gitlab = /https:\/\/gitlab\.igem\.org\/2026\/nthu/.test(footer);
      const cc = /https:\/\/creativecommons\.org\/licenses\/by\/4\.0\//.test(footer);
      const main = text.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] || text;
      pageRecords.push({page:source,title:display(text.match(/<title>(.*?)<\/title>/is)?.[1]||''),shared_design_system:shared,footer_gitlab:gitlab,footer_cc_by_4:cc,headings:[...main.matchAll(/<h([12])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map(m=>({level:Number(m[1]),text:display(m[2])}))});
      if (!shared) issue('review','shared-design-system',source,'No common stylesheet or known homepage bundle detected.');
      if (!gitlab || !cc) issue('error','required-footer-link',source,`GitLab footer: ${gitlab}; CC BY 4.0 footer: ${cc}.`);
    }
  }
  // CSS URLs include inline style blocks and page-level style attributes.
  const css = /\.css$/i.test(file) ? text : /\.html?$/i.test(file) ? text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'') : '';
  for (const m of css.matchAll(/\burl\(\s*["']?([^)"']+)["']?\s*\)/gi)) record(m[1],file,'css-url',true);
  if (/\.css$/i.test(file)) for (const m of text.matchAll(/@import\s+["']([^"']+)["']/gi)) record(m[1],file,'css-import',true);
  if (/\.(?:m?js|html?)$/i.test(file)) {
    // This intentionally only identifies executable constructs; plain vendor
    // documentation URLs and commented examples are not runtime dependencies.
    const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm,'');
    for (const m of code.matchAll(/\b(?:fetch|import|Worker|EventSource|WebSocket)\s*\(\s*(["'])([^"'\r\n]+)\1/g)) record(m[2],file,'script-request',true);
    for (const m of code.matchAll(/\.src\s*=\s*(["'])(https?:\/\/[^"'\r\n]+)\1/g)) record(m[2],file,'script-resource-assignment',true);
    // A hyperlink assignment is navigation, not an automatic fetch. Dynamically
    // created stylesheet/link elements still require the rendered HAR review.
    for (const m of code.matchAll(/\.href\s*=\s*(["'])(https?:\/\/[^"'\r\n]+)\1/g)) record(m[2],file,'script-link-assignment',false);
    if (/\.(?:m?js)$/i.test(file)) for (const m of code.matchAll(/\b(?:from|import)\s*(["'])(\.{0,2}\/[^"'\r\n]+)\1/g)) record(m[2],file,'script-import',true);
  }
}
for (const page of pages) pending.push(path.join(site,page));
for (let i=0;i<pending.length;i++) inspect(pending[i]);
const required = ['attributions','contribution','engineering','human-practices'];
const routes = required.map(slug => ({route:`/nthu/${slug}`,source:`${slug}.html`,exists:fs.existsSync(path.join(site,slug+'.html'))}));
for (const route of routes) if (!route.exists) issue('error','missing-standard-page',route.source,'Required medal/attribution page absent.',route.route);
const attributions = read(path.join(site,'attributions.html'));
const form = /<iframe\b[^>]*src=["']https:\/\/teams\.igem\.org\/wiki\/6460\/attributions["']/i.test(attributions);
if (!form) issue('error','attribution-form-embed','attributions.html','Official team 6460 attribution embed absent.');
const credits = display(read(path.join(site,'credits.html')));
const uniqueIssues = [...new Map(issues.map(x=>[JSON.stringify(x),x])).values()];
const manual = [
  {severity:'blocking-review',code:'official-submission',detail:'No wiki upload/push is authorized in this review. Local routes do not establish that the official site or pipeline is deployed; verify the final main pipeline and standard URLs before freeze.'},
  {severity:'blocking-review',code:'source-build',detail:'The official 2026 requirement is source-built CI with pinned dependencies and no hand-uploaded compiled output. Hand-authored HTML is valid source; build-publication.py generates its standard routes. Confirm that CI also rebuilds generated homepage bundles/game output from their retained sources and preserves the root LICENSE.'},
  {severity:'blocking-review',code:'official-forms',detail:'Check the official submitted Attributions, Judging and Safety forms, Registry entries and deliverable state. A local iframe or narrative does not prove a form is complete or submitted.'},
  {severity:'review',code:'ai-human-review',detail:'The user identified the tools as chatgpt-6 astra, claude opus 5.5 and fable 5.1, and confirmed review by team members. Treat these as team-declared names, not independently verified vendor/version identifiers. Each scientific claim, citation and calculation still needs defensible source evidence.'},
  {severity:'blocking-review',code:'decorative-image-license',detail:'Verified cover illustrations now show the known OpenAI image-generation tool family and CC BY 4.0 next to the image. Individual image-model/version records remain unconfirmed; do not assign the declared language models to these pictures. Third-party images/logos/fonts still require redistribution/modification rights and source/license next to the asset. A central credits page alone does not satisfy the inline attribution rule.'},
  {severity:'review',code:'scientific-integrity',detail:'Validate each numerical claim against raw records, sample units, controls and uncertainty; verify citations and quoted stakeholder statements. Editorial removal of negative wording must not convert unmeasured or preliminary work into a completed result.'},
  {severity:'review',code:'selected-awards',detail:'Final award eligibility depends on the Judging Form selections; at most three elective awards, covering both General Bio Engineering and Specialization. Do not infer the selections from the presence of pages.'},
  {severity:'review',code:'video-public-playback',detail:'A Video Universe URL is not proof of approved public playback. Confirm each video after transcoding and moderation. Edit an existing video rather than uploading duplicates.'}
];
const sources = [
  {url:'https://teams.igem.org/6460/deliverables/wiki/requirements',verified:'2026-10-20',scope:'2026 NTHU official wiki requirements read directly from the signed-in dashboard.',rules:['Runtime assets and requests must stay on iGEM domains; ordinary outbound scholarly links are permitted.','Source, CI configuration and locked dependencies must reproduce the wiki.','Content CC BY 4.0, preserved root LICENSE, inline third-party and AI-image attribution.','Fixed judging URLs and visible GitLab footer link.','Real evidence/citations and transparent AI model, purpose and human review disclosure.']},
  {url:'https://teams.igem.org/6460/deliverables/wiki/videos-and-audios',verified:'2026-10-20',scope:'2026 NTHU Video Universe checklist.',rules:['Use Video Universe for video/audio; moderator approval is required for public playback.','Avoid duplicate uploads; edit existing video details.','Include wiki URL, appropriate category, Attribution license, narration language or No linguistic content, Public, no sensitive content, publish after transcoding.']},
  {url:'https://competition.igem.org/judging/special-prizes',verified:'2026-10-20',scope:'Award criteria.',rules:['Best Wiki assesses clear goals, convincing evidence, usable navigation, durable documentation and citation quality.','Hardware evidence includes utility, user feedback and reproducibility; Model evidence includes data grounding and design relevance.','Best Software needs an OSI license and dedicated iGEM GitLab source repository.']},
  {url:'https://competition.igem.org/judging/project-prizes',verified:'2026-10-20',scope:'Project ballot.',rules:['Judge claims against measured/modeled evidence, engineering decisions, integrated Human Practices, documented components and student leadership.']},
  {url:'https://competition.igem.org/deliverables/',verified:'2026-10-20',scope:'2026 deliverables timeline.',rules:['Wiki, Judging Form, Attributions Form, Registry and Software list October 21; Presentation Video lists October 28. Exact deadline time must be checked on the dashboard.']}
];
const report = {
  schema:1, reviewed_on:'2026-10-20', generated_at:new Date().toISOString(),
  scope:{site:'aerosense-wiki',root_pages:pages.length,parsed_runtime_or_html_files:seen.size,method:'Static source and reachable HTML/CSS/JS graph; official requirements read from the team dashboard.',limits:['Not a full browser HAR; constructed URLs, lazy content, playback and interactions need rendered verification.','External references are distinguished from prohibited external runtime dependencies.','Source scan cannot certify publication, scientific accuracy, permissions, or personal sign-off.'],no_publication:true,github_untouched:true},
  summary:{errors:uniqueIssues.filter(x=>x.severity==='error').length,review_items:uniqueIssues.filter(x=>x.severity==='review').length,external_runtime_urls:[...runtime.values()].filter(x=>!x.official).length,official_runtime_urls:[...runtime.values()].filter(x=>x.official).length,outbound_urls:outbound.size,official_attributions_embed:form,ai_disclosure_present:/Responsible use of AI/.test(credits)},
  standard_routes:routes, pages:pageRecords, issues:uniqueIssues,
  manual_release_gates:manual,official_sources:sources,
  runtime_urls:[...runtime.values()].sort((a,b)=>a.url.localeCompare(b.url)),
  outbound_urls:[...outbound.values()].sort((a,b)=>a.url.localeCompare(b.url))
};
// Keep independently recorded browser evidence with its original timestamp.
// Running a static check must not silently replace it with a claim of UI testing.
if (fs.existsSync(out)) {
  const previous = JSON.parse(read(out));
  for (const key of ['rendered_layout','illustration_credit_check','official_dashboard_review','pdf_browser_checks','final_targeted_browser_check','final_local_preparation']) if (previous[key]) report[key]=previous[key];
}
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({report:rel(out),...report.summary}));
if (report.summary.errors) process.exitCode=1;
