import fs from 'node:fs';

const zh = (s) => s; // already unicode-escaped below

const credits = `import type { CreditStatus, SourceStatus } from './schema';

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

export const ASSET_CREDIT_MANIFEST: readonly AssetCredit[] = [
  {
    id: 'odor-atlas',
    path: 'games/pixel/assets/odor-atlas.png',
    title: 'Odor atlas sprite sheet',
    creditStatus: 'TODO-VERIFY',
    sourceStatus: 'TODO-VERIFY',
    creditText: {
      'zh-Hant': '${'\\u6c23\\u5473\\u5716\\u9451\\u5716\\u50cf\\u4f86\\u6e90\\u5f85\\u78ba\\u8a8d\\uff08TODO-VERIFY\\uff09\\uff0c\\u8acb\\u52ff\\u8996\\u70ba\\u5df2\\u6388\\u6b0a\\u7d20\\u6750\\u3002'}',
      en: 'Odor atlas image source unverified (TODO-VERIFY). Do not treat as cleared rights.',
    },
  },
];

export function getAssetCredit(id: string): AssetCredit | undefined {
  return ASSET_CREDIT_MANIFEST.find((asset) => asset.id === id);
}
`;

// Expand unicode escape sequences in the template for zh-Hant
const expanded = credits.replace(/'\\u([0-9a-fA-F]{4})/g, (_, h) => "'" + String.fromCharCode(parseInt(h, 16)));
// Actually the string contains literal backslash-u - evaluate properly:
const finalCredits = credits.replace(/\$\{'((?:\\u[0-9a-fA-F]{4})+)'\}/g, (_, esc) => {
  const text = esc.replace(/\\u([0-9a-fA-F]{4})/g, (__, h) => String.fromCharCode(parseInt(h, 16)));
  return text;
});

fs.writeFileSync('packages/content/src/credits.ts', finalCredits, 'utf8');
console.log('credits ok', finalCredits.includes('\u6c23\u5473'));
