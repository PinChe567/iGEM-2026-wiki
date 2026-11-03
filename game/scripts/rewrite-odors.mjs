import fs from 'node:fs';

const names = {
  banana: 'Banana',
  lemon: 'Lemon',
  rose: 'Rose',
  coffee: 'Coffee',
  mint: 'Mint',
  strawberry: 'Strawberry',
  chocolate: 'Chocolate',
  lavender: 'Lavender',
  orange: 'Orange',
  cinnamon: 'Cinnamon',
  apple: 'Apple',
  vanilla: 'Vanilla',
  bread: 'Bread',
  pine: 'Pine',
  popcorn: 'Popcorn',
  peach: 'Peach',
  garlic: 'Garlic',
  ocean: 'Ocean',
  honey: 'Honey',
  smoke: 'Campfire',
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
    const en = names[id];
    const v = vectors[id].join(', ');
    return `  { id: '${id}', name: { en: '${en}' }, featureVector: [${v}], imageKey: 'odor-atlas:${i}', sourceStatus: 'illustrative', creditStatus: 'credited' },`;
  })
  .join('\n');

const disclaimerEn =
  'Odor codes and feature vectors are an illustrative virtual-receptor model — not human, Drosophila, or AeroSense experimental measurements.';

const out = `import {
  CONTENT_VERSION,
  type ContentCatalog,
  type OdorRecord,
  assertOdorRecord,
} from './schema';

type OdorSeed = Omit<OdorRecord, 'modelKind'> & { modelKind?: OdorRecord['modelKind'] };

/** English odor labels with unchanged illustrative vectors. */
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
    name: odor.name.en,
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
