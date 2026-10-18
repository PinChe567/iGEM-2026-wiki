// Generated from assets-manifest.json by scripts/rewrite-credits.mjs.
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

export const ASSET_CREDIT_MANIFEST: readonly AssetCredit[] = [
  {
    "id": "odor-atlas",
    "path": "Odor Pixel Suite / Pixel Lab atlas",
    "title": "Odor atlas sprite sheet",
    "creditStatus": "credited",
    "sourceStatus": "verified",
    "creditText": {
      "zh-Hant": "Odor Pixel Suite 與氣味圖鑑由 NTHU FLY iGEM 2026 團隊製作；使用者於 2026 年 10 月 18 日確認團隊自製。遊戲與圖鑑的重用及再散布條款尚未另行指定。",
      "en": "Odor Pixel Suite and its odor atlas were created by the NTHU FLY iGEM 2026 team; team authorship was confirmed by the user on 18 October 2026. Reuse and redistribution terms for the game and atlas have not been separately specified."
    }
  }
];

export function getAssetCredit(id: string): AssetCredit | undefined {
  return ASSET_CREDIT_MANIFEST.find((asset) => asset.id === id);
}
