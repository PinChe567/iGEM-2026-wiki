import fs from 'node:fs';

const names = {
  banana: ['\u9999\u8549', 'Banana'],
  lemon: ['\u6a58\u6aac', 'Lemon'],
  rose: ['\u73ab\u7470', 'Rose'],
  coffee: ['\u5496\u5561', 'Coffee'],
  mint: ['\u8584\u8377', 'Mint'],
  strawberry: ['\u8349\u8393', 'Strawberry'],
  chocolate: ['\u5de7\u514b\u529b', 'Chocolate'],
  lavender: ['\u85b0\u8863\u8349', 'Lavender'],
  orange: ['\u67f3\u6a59', 'Orange'],
  cinnamon: ['\u8089\u6842', 'Cinnamon'],
  apple: ['\u860b\u679c', 'Apple'],
  vanilla: ['\u9999\u8349', 'Vanilla'],
  bread: ['\u9eba\u5305', 'Bread'],
  pine: ['\u677e\u6728', 'Pine'],
  popcorn: ['\u7206\u7c73\u82b1', 'Popcorn'],
  peach: ['\u6c34\u871c\u6843', 'Peach'],
  garlic: ['\u5927\u849c', 'Garlic'],
  ocean: ['\u6d77\u6d0b', 'Ocean'],
  honey: ['\u8702\u871c', 'Honey'],
  smoke: ['\u71df\u706b', 'Campfire'],
};

const vectors = {
  banana: [1, 0.1, 0.1, 0.45, 0.05],
  lemon: [1, 0.05, 0.9, 0.05, 0.08],
  rose: [0.15, 1, 0.12, 0.2, 0.02],
  coffee: [0.02, 0.02, 0.08, 1, 0.35],
  mint: [0.08, 0.25, 1, 0.02, 0.08],
  strawberry: [1, 0.4, 0.12, 0.25, 0.02],
  chocolate: [0.1, 0.05, 0.02, 1, 0.15],
  lavender: [0.05, 1, 0.45, 0.18, 0.02],
  orange: [1, 0.08, 0.75, 0.12, 0.05],
  cinnamon: [0.06, 0.12, 0.04, 1, 0.4],
  apple: [1, 0.15, 0.42, 0.15, 0.04],
  vanilla: [0.18, 0.7, 0.05, 0.75, 0.02],
  bread: [0.02, 0.02, 0.08, 0.85, 0.65],
  pine: [0.02, 0.15, 0.88, 0.3, 0.18],
  popcorn: [0.04, 0.02, 0.04, 0.78, 0.72],
  peach: [1, 0.38, 0.18, 0.22, 0.02],
  garlic: [0.02, 0.01, 0.1, 0.12, 1],
  ocean: [0.02, 0.02, 1, 0.02, 0.58],
  honey: [0.35, 0.35, 0.06, 0.9, 0.03],
  smoke: [0.01, 0.01, 0.12, 1, 0.75],
};

const ids = Object.keys(names);
const rows = ids
  .map((id, i) => {
    const [zh, en] = names[id];
    const v = vectors[id].join(', ');
    return `  { id: '${id}', name: { 'zh-Hant': '${zh}', en: '${en}' }, featureVector: [${v}], imageKey: 'odor-atlas:${i}', sourceStatus: 'illustrative', creditStatus: 'TODO-VERIFY' },`;
  })
  .join('\n');

const disclaimerZh =
  '\u672c\u904a\u6232\u7684\u6c23\u5473\u7de8\u78bc\u8207\u7279\u5fb5\u5411\u91cf\u70ba\u300c\u793a\u610f\u7528\u865b\u64ec\u53d7\u9ad4\u6a21\u578b\u300d\uff0c\u4e0d\u662f\u4eba\u9ad4\u3001\u679c\u8805\u6216 AeroSense \u7684\u5be6\u9a57\u91cf\u6e2c\u8cc7\u6599\u3002';
const disclaimerEn =
  'Odor codes and feature vectors are an illustrative virtual-receptor model — not human, Drosophila, or AeroSense experimental measurements.';

const out = `import {
  CONTENT_VERSION,
  type ContentCatalog,
  type OdorRecord,
  assertOdorRecord,
} from './schema';

type OdorSeed = Omit<OdorRecord, 'modelKind'> & { modelKind?: OdorRecord['modelKind'] };

/** Generated with Unicode escapes to preserve zh-Hant on all platforms. */
const SEEDS: OdorSeed[] = [
${rows}
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
    'zh-Hant': '${disclaimerZh}',
    en: '${disclaimerEn}',
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
`;

fs.writeFileSync('packages/content/src/odors.ts', out, 'utf8');
console.log('ok', names.banana[0], fs.readFileSync('packages/content/src/odors.ts', 'utf8').includes(names.banana[0]));
