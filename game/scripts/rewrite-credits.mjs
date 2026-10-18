import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets-manifest.json'), 'utf8'));
const credits = manifest.assets.map((asset) => ({
  id: asset.id,
  path: asset.displayPath ?? asset.path,
  title: asset.id === 'odor-atlas' ? 'Odor atlas sprite sheet' : asset.filename,
  creditStatus: asset.creditStatus ?? 'pending',
  sourceStatus: asset.sourceStatus ?? 'TODO-VERIFY',
  creditText: asset.creditText,
}));

const source = `// Generated from assets-manifest.json by scripts/rewrite-credits.mjs.
import type { CreditStatus, SourceStatus } from './schema';

export type AssetCredit = {
  id: string;
  path: string;
  title: string;
  creditStatus: CreditStatus;
  sourceStatus: SourceStatus;
  creditText: {
    'zh-Hant': string;
    en: string;
  };
};

export const ASSET_CREDIT_MANIFEST: readonly AssetCredit[] = ${JSON.stringify(credits, null, 2)};

export function getAssetCredit(id: string): AssetCredit | undefined {
  return ASSET_CREDIT_MANIFEST.find((asset) => asset.id === id);
}
`;

fs.writeFileSync(path.join(root, 'packages/content/src/credits.ts'), source, 'utf8');
console.log(`Generated ${credits.length} asset credit record(s) from assets-manifest.json.`);
