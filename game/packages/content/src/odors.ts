import {
  CONTENT_VERSION,
  type ContentCatalog,
  type OdorRecord,
  assertOdorRecord,
} from './schema';

type OdorSeed = Omit<OdorRecord, 'modelKind'> & { modelKind?: OdorRecord['modelKind'] };

/** Generated with Unicode escapes to preserve zh-Hant on all platforms. */
const SEEDS: OdorSeed[] = [
  { id: 'banana', name: { 'zh-Hant': '香蕉', en: 'Banana' }, featureVector: [1, 0.1, 0.1, 0.45, 0.05], imageKey: 'odor-atlas:0', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
  { id: 'lemon', name: { 'zh-Hant': '橘檬', en: 'Lemon' }, featureVector: [1, 0.05, 0.9, 0.05, 0.08], imageKey: 'odor-atlas:1', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
  { id: 'rose', name: { 'zh-Hant': '玫瑰', en: 'Rose' }, featureVector: [0.15, 1, 0.12, 0.2, 0.02], imageKey: 'odor-atlas:2', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
  { id: 'coffee', name: { 'zh-Hant': '咖啡', en: 'Coffee' }, featureVector: [0.02, 0.02, 0.08, 1, 0.35], imageKey: 'odor-atlas:3', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
  { id: 'mint', name: { 'zh-Hant': '薄荷', en: 'Mint' }, featureVector: [0.08, 0.25, 1, 0.02, 0.08], imageKey: 'odor-atlas:4', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
  { id: 'strawberry', name: { 'zh-Hant': '草莓', en: 'Strawberry' }, featureVector: [1, 0.4, 0.12, 0.25, 0.02], imageKey: 'odor-atlas:5', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
  { id: 'chocolate', name: { 'zh-Hant': '巧克力', en: 'Chocolate' }, featureVector: [0.1, 0.05, 0.02, 1, 0.15], imageKey: 'odor-atlas:6', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
  { id: 'lavender', name: { 'zh-Hant': '薰衣草', en: 'Lavender' }, featureVector: [0.05, 1, 0.45, 0.18, 0.02], imageKey: 'odor-atlas:7', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
  { id: 'orange', name: { 'zh-Hant': '柳橙', en: 'Orange' }, featureVector: [1, 0.08, 0.75, 0.12, 0.05], imageKey: 'odor-atlas:8', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
  { id: 'cinnamon', name: { 'zh-Hant': '肉桂', en: 'Cinnamon' }, featureVector: [0.06, 0.12, 0.04, 1, 0.4], imageKey: 'odor-atlas:9', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
  { id: 'apple', name: { 'zh-Hant': '蘋果', en: 'Apple' }, featureVector: [1, 0.15, 0.42, 0.15, 0.04], imageKey: 'odor-atlas:10', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
  { id: 'vanilla', name: { 'zh-Hant': '香草', en: 'Vanilla' }, featureVector: [0.18, 0.7, 0.05, 0.75, 0.02], imageKey: 'odor-atlas:11', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
  { id: 'bread', name: { 'zh-Hant': '麺包', en: 'Bread' }, featureVector: [0.02, 0.02, 0.08, 0.85, 0.65], imageKey: 'odor-atlas:12', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
  { id: 'pine', name: { 'zh-Hant': '松木', en: 'Pine' }, featureVector: [0.02, 0.15, 0.88, 0.3, 0.18], imageKey: 'odor-atlas:13', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
  { id: 'popcorn', name: { 'zh-Hant': '爆米花', en: 'Popcorn' }, featureVector: [0.04, 0.02, 0.04, 0.78, 0.72], imageKey: 'odor-atlas:14', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
  { id: 'peach', name: { 'zh-Hant': '水蜜桃', en: 'Peach' }, featureVector: [1, 0.38, 0.18, 0.22, 0.02], imageKey: 'odor-atlas:15', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
  { id: 'garlic', name: { 'zh-Hant': '大蒜', en: 'Garlic' }, featureVector: [0.02, 0.01, 0.1, 0.12, 1], imageKey: 'odor-atlas:16', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
  { id: 'ocean', name: { 'zh-Hant': '海洋', en: 'Ocean' }, featureVector: [0.02, 0.02, 1, 0.02, 0.58], imageKey: 'odor-atlas:17', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
  { id: 'honey', name: { 'zh-Hant': '蜂蜜', en: 'Honey' }, featureVector: [0.35, 0.35, 0.06, 0.9, 0.03], imageKey: 'odor-atlas:18', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
  { id: 'smoke', name: { 'zh-Hant': '營火', en: 'Campfire' }, featureVector: [0.01, 0.01, 0.12, 1, 0.75], imageKey: 'odor-atlas:19', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },
];

const ODOR_RECORDS: OdorRecord[] = SEEDS.map((seed) => ({
  ...seed,
  modelKind: 'illustrative-virtual-receptor' as const,
}));

ODOR_RECORDS.forEach(assertOdorRecord);

export const contentCatalog: ContentCatalog = {
  contentVersion: CONTENT_VERSION,
  odors: ODOR_RECORDS,
  modelDisclaimer: {
    'zh-Hant': '本遊戲的氣味編碼與特徵向量為「示意用虛擬受體模型」，不是人體、果蠅或 AeroSense 的實驗量測資料。',
    en: 'Odor codes and feature vectors are an illustrative virtual-receptor model — not human, Drosophila, or AeroSense experimental measurements.',
  },
};

export const odors = contentCatalog.odors;

export type LegacyOdor = {
  id: string;
  name: string;
  en: string;
  vector: number[];
};

export function toLegacyOdors(records: readonly OdorRecord[] = odors): LegacyOdor[] {
  return records.map((odor) => ({
    id: odor.id,
    name: odor.name['zh-Hant'],
    en: odor.name.en,
    vector: [...odor.featureVector],
  }));
}

export function toPixelOdors(records: readonly OdorRecord[] = odors): Array<{ id: string; vector: number[] }> {
  return records.map((odor) => ({
    id: odor.id,
    vector: [...odor.featureVector],
  }));
}

export function getOdorById(id: string): OdorRecord | undefined {
  return odors.find((odor) => odor.id === id);
}
