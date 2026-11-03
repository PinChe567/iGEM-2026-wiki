// Targeted semantic TypeScript check using the existing local compiler; no dependency installation.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const ts = require(path.join(root, 'aerosense-wiki/game/node_modules/typescript/lib/typescript.js'));
const suite = path.join(root, 'gitlab/aerosense-software/code/aerosense/education/odor-pixel-suite');
const entry = path.join(suite, 'apps/wiki-client/games/labyrinth/src/art.ts');
const options = {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler, strict: true,
  skipLibCheck: true, noEmit: true, noUnusedLocals: true, noUnusedParameters: true,
  resolveJsonModule: true, isolatedModules: true, esModuleInterop: true,
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  baseUrl: suite, paths: {
    '@suite/core': ['packages/core/src/index.ts'],
    '@suite/core/*': ['packages/core/src/*/index.ts'],
    '@suite/content': ['packages/content/src/index.ts'],
    '@suite/content/*': ['packages/content/src/*/index.ts'],
  },
};
const program = ts.createProgram([entry], options);
const diagnostics = ts.getPreEmitDiagnostics(program);
const report = {
  checked_at_utc: new Date().toISOString(), compiler_version: ts.version,
  scope: 'Targeted semantic check of migrated art.ts and its transitive local TypeScript imports; not a fresh install or full suite/build test.',
  entry: path.relative(root, entry).replaceAll('\\', '/'),
  source_files: program.getSourceFiles().filter(f => !f.isDeclarationFile).length,
  diagnostics: diagnostics.map(d => ({code:d.code, file:d.file ? path.relative(root,d.file.fileName).replaceAll('\\','/') : null, message:ts.flattenDiagnosticMessageText(d.messageText,'\n')})),
  passed: diagnostics.length === 0,
};
fs.writeFileSync(path.join(__dirname, 'software-art-typecheck.json'), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
process.exitCode=report.passed ? 0 : 1;
