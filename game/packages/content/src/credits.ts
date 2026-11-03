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
      "zh-Hant": "Odor Pixel Suite 與氣味圖鑑由 NTHU FLY iGEM 2026 團隊製作；使用者於 2026 年 10 月 18 日確認團隊自製。團隊原創遊戲軟體採 MIT 授權；氣味圖鑑的獨立重用與再散布條款尚未指定，不受軟體授權變更影響。",
      "en": "Odor Pixel Suite and its odor atlas were created by the NTHU FLY iGEM 2026 team; team authorship was confirmed by the user on 18 October 2026. Team-original game software is MIT-licensed; the odor-atlas artwork's separate reuse and redistribution terms remain unspecified and are not changed by the software license."
    }
  }
];

export function getAssetCredit(id: string): AssetCredit | undefined {
  return ASSET_CREDIT_MANIFEST.find((asset) => asset.id === id);
}
