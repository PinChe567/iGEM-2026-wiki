#!/usr/bin/env node
/**
 * Rebuild the homepage's ordered, dependency-free CSS and classic-script bundles.
 * Edit the original sources, then run: node scripts/build-home-bundles.mjs
 * home-bundle-sources.json is the source of truth after the first build.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = path.join(root, 'index.html');
const manifestPath = path.join(root, 'home-bundle-sources.json');
const outputs = { styles: 'css/home.bundle.css', scripts: 'js/home.bundle.js' };
const comment = '<!-- Homepage bundles: edit original sources, then run node scripts/build-home-bundles.mjs. -->';
const html = readFileSync(indexPath, 'utf8');
const newline = html.includes('\r\n') ? '\r\n' : '\n';
const tagPattern = /<link\b[^>]*>|<script\b[^>]*>[\s\S]*?<\/script\s*>/gi;

function fail(message) {
  throw new Error(`Homepage bundle: ${message}`);
}

function attributes(tag) {
  const opening = tag.match(/^<(?:link|script)\b([^>]*)>/i)[1];
  const result = new Map();
  const pattern = /([^\s=/'">]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const match of opening.matchAll(pattern)) {
    result.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
  }
  return result;
}

function assetPath(url) {
  const source = decodeURIComponent(url.split(/[?#]/)[0]);
  if (!source || /^(?:[a-z]+:|\/|\\)/i.test(source) || source.includes('\\')) {
    fail(`only site-relative local sources are supported: ${url}`);
  }
  const absolute = path.resolve(root, source);
  if (!absolute.startsWith(`${root}${path.sep}`)) fail(`source leaves the site: ${source}`);
  return source;
}

function resource(tag) {
  const attrs = attributes(tag);
  const script = /^<script\b/i.test(tag);
  if (!script && attrs.get('rel') !== 'stylesheet') return null;
  const allowed = script ? ['src', 'defer'] : ['rel', 'href'];
  for (const name of attrs.keys()) {
    if (!allowed.includes(name)) fail(`unsupported ${script ? 'script' : 'stylesheet'} attribute: ${name}`);
  }
  const url = attrs.get(script ? 'src' : 'href');
  if (!url) fail('inline scripts or stylesheets without a URL cannot be bundled');
  if (script && !/^<script\b[^>]*>\s*<\/script\s*>$/i.test(tag)) {
    fail(`external script has unexpected inline content: ${url}`);
  }
  return { kind: script ? 'scripts' : 'styles', source: assetPath(url), deferred: attrs.has('defer') };
}

const resources = [...html.matchAll(tagPattern)].map(match => resource(match[0])).filter(Boolean);
let manifest;
if (existsSync(manifestPath)) {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} else {
  const blocking = resources.filter(item => item.kind === 'scripts' && !item.deferred);
  if (blocking.length !== 1 || blocking[0].source !== 'js/notebook-data.js') {
    fail('initial capture expects notebook-data.js as the only parser-blocking script');
  }
  manifest = {
    version: 1,
    note: 'CSS preserves document order. Notebook data originally ran before all deferred scripts, so it stays first. Edit these original sources and run node scripts/build-home-bundles.mjs.',
    styles: resources.filter(item => item.kind === 'styles').map(item => item.source),
    scripts: [...blocking, ...resources.filter(item => item.kind === 'scripts' && item.deferred)].map(item => item.source),
  };
}
if (manifest.version !== 1) fail('unsupported source manifest version');
if (manifest.scripts?.[0] !== 'js/notebook-data.js') fail('notebook-data.js must precede all deferred code');

function bundle(kind) {
  const sources = manifest[kind];
  if (!Array.isArray(sources) || !sources.length || new Set(sources).size !== sources.length) {
    fail(`${kind} must be a nonempty list without duplicate sources`);
  }
  const parts = sources.map(source => {
    if (typeof source !== 'string' || assetPath(source) !== source) fail(`invalid source path: ${source}`);
    if (source === outputs[kind]) fail('generated bundles cannot be their own inputs');
    if (path.posix.dirname(source) !== path.posix.dirname(outputs[kind])) {
      fail(`source must share its bundle directory so relative URLs stay valid: ${source}`);
    }
    const content = readFileSync(path.join(root, source), 'utf8').replace(/^\uFEFF/, '');
    if (kind === 'styles') {
      const withoutComments = content.replace(/\/\*[\s\S]*?\*\//g, '');
      if (/@(?:import|charset)\b/i.test(withoutComments)) fail(`unsupported CSS import or charset in ${source}`);
    } else {
      if (/\bdocument\s*(?:\.\s*currentScript|\[\s*['"]currentScript['"]\s*\])/.test(content)) {
        fail(`document.currentScript needs a separate script file: ${source}`);
      }
      if (/\bimport\s*\(/.test(content)) fail(`dynamic imports need a separate script file: ${source}`);
      new Script(content, { filename: source });
    }
    return `${kind === 'scripts' ? ';\n' : ''}/* Source: ${source} */\n${content}\n`;
  });
  const content = `/* Generated by scripts/build-home-bundles.mjs. Edit the original sources. */\n${parts.join('\n')}${kind === 'scripts' ? ';\n' : ''}`;
  if (kind === 'scripts') new Script(content, { filename: outputs[kind] });
  return { content, hash: createHash('sha256').update(content).digest('hex').slice(0, 16) };
}

// Validate everything before changing any generated file or include tag.
const bundles = { styles: bundle('styles'), scripts: bundle('scripts') };
for (const item of resources) {
  if (item.source !== outputs[item.kind] && !manifest[item.kind].includes(item.source)) {
    fail(`unlisted ${item.kind} source ${item.source}; add it to home-bundle-sources.json in execution order`);
  }
}
const inserted = { styles: false, scripts: false };
const withoutBuildComment = html.replace(/^[ \t]*<!-- Homepage bundles: edit original sources, then run node scripts\/build-home-bundles\.mjs\. -->\r?\n/m, '');
const updated = withoutBuildComment.replace(tagPattern, tag => {
  const item = resource(tag);
  if (!item) return tag;
  if (inserted[item.kind]) return '';
  inserted[item.kind] = true;
  const url = `${outputs[item.kind]}?v=${bundles[item.kind].hash}`;
  return item.kind === 'styles'
    ? `${comment}${newline}  <link rel="stylesheet" href="${url}">`
    : `<script src="${url}" defer></script>`;
});
if (!inserted.styles || !inserted.scripts) fail('index.html must contain both stylesheet and script include tags');

function writeChanged(filename, content) {
  if (!existsSync(filename) || readFileSync(filename, 'utf8') !== content) writeFileSync(filename, content);
}

for (const kind of ['styles', 'scripts']) writeChanged(path.join(root, outputs[kind]), bundles[kind].content);
writeChanged(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
writeChanged(indexPath, updated);
for (const kind of ['styles', 'scripts']) {
  console.log(`${manifest[kind].length} ${kind} -> ${outputs[kind]} (${Buffer.byteLength(bundles[kind].content)} bytes, ${bundles[kind].hash})`);
}
