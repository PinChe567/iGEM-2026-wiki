import {
  SPECTRUM_CONTENT_VERSION,
  SPECTRUM_CHANNEL_COUNT,
  assertSpectrumSignature,
  type SpectrumContentCatalog,
  type SpectrumOdorId,
  type SpectrumOdorRecord,
  type ChannelVector12,
} from './schema';

export {
  SPECTRUM_CONTENT_VERSION,
  SPECTRUM_CHANNEL_COUNT,
  assertSpectrumSignature,
  type SpectrumContentCatalog,
  type SpectrumOdorId,
  type SpectrumOdorRecord,
  type ChannelVector12,
  type SpectrumSourceKind,
} from './schema';

type Seed = Omit<SpectrumOdorRecord, 'signatureVersion' | 'source'>;

/**
 * Fixed illustrative 12-channel signatures (generated offline, then frozen).
 * Provenance is always illustrativeGenerated — not experimental measurements.
 */
const SEEDS: readonly Seed[] = [
  {
    id: 'banana',
    name: { 'zh-Hant': '\u9999\u8549', en: 'Banana' },
    signature: [0.178, 0.078, 0.461, 0.097, 0.187, 0.228, 0.137, 0.948, 0.157, 0.207, 0.079, 0.142],
  },
  {
    id: 'lemon',
    name: { 'zh-Hant': '\u6a58\u6aaa', en: 'Lemon' },
    signature: [0.107, 0.141, 0.228, 0.074, 0.062, 0.12, 0.211, 0.916, 0.12, 0.172, 0.123, 0.655],
  },
  {
    id: 'rose',
    name: { 'zh-Hant': '\u73ab\u7470', en: 'Rose' },
    signature: [0.098, 0.097, 0.804, 0.066, 0.153, 0.651, 0.151, 0.097, 0.104, 0.178, 0.111, 0.077],
  },
  {
    id: 'coffee',
    name: { 'zh-Hant': '\u5496\u5561', en: 'Coffee' },
    signature: [0.735, 0.105, 0.221, 0.113, 0.203, 0.816, 0.204, 0.07, 0.089, 0.171, 0.115, 0.052],
  },
  {
    id: 'mint',
    name: { 'zh-Hant': '\u8584\u8377', en: 'Mint' },
    signature: [0.154, 0.136, 0.203, 0.095, 0.742, 0.077, 0.054, 0.197, 0.057, 0.852, 0.055, 0.162],
  },
  {
    id: 'strawberry',
    name: { 'zh-Hant': '\u8349\u8393', en: 'Strawberry' },
    signature: [0.207, 0.212, 0.206, 0.056, 0.173, 0.837, 0.13, 0.066, 0.403, 0.211, 0.119, 0.07],
  },
  {
    id: 'chocolate',
    name: { 'zh-Hant': '\u5de7\u514b\u529b', en: 'Chocolate' },
    signature: [0.621, 0.06, 0.209, 0.183, 0.098, 0.197, 0.058, 0.175, 0.727, 0.15, 0.211, 0.221],
  },
  {
    id: 'lavender',
    name: { 'zh-Hant': '\u85b0\u8863\u8349', en: 'Lavender' },
    signature: [0.154, 0.736, 0.059, 0.06, 0.177, 0.202, 0.076, 0.183, 0.922, 0.067, 0.077, 0.157],
  },
  {
    id: 'orange',
    name: { 'zh-Hant': '\u6a58\u6a59', en: 'Orange' },
    signature: [0.065, 0.103, 0.151, 0.991, 0.157, 0.088, 0.185, 0.192, 0.642, 0.059, 0.131, 0.099],
  },
  {
    id: 'cinnamon',
    name: { 'zh-Hant': '\u8089\u6842', en: 'Cinnamon' },
    signature: [0.207, 0.216, 0.804, 0.201, 0.171, 0.076, 0.095, 0.206, 0.157, 0.543, 0.082, 0.093],
  },
  {
    id: 'apple',
    name: { 'zh-Hant': '\u860b\u679c', en: 'Apple' },
    signature: [0.227, 0.063, 0.052, 0.074, 0.861, 0.067, 0.123, 0.222, 0.554, 0.189, 0.133, 0.06],
  },
  {
    id: 'vanilla',
    name: { 'zh-Hant': '\u9999\u8349', en: 'Vanilla' },
    signature: [0.156, 0.174, 0.505, 0.211, 0.228, 0.132, 0.13, 0.11, 0.891, 0.106, 0.054, 0.085],
  },
  {
    id: 'bread',
    name: { 'zh-Hant': '\u9eb5\u5305', en: 'Bread' },
    signature: [0.222, 0.166, 0.794, 0.207, 0.143, 0.142, 0.708, 0.15, 0.089, 0.14, 0.207, 0.104],
  },
  {
    id: 'pine',
    name: { 'zh-Hant': '\u677e\u6728', en: 'Pine' },
    signature: [0.125, 0.127, 0.056, 0.548, 0.117, 0.14, 0.133, 0.125, 0.221, 0.76, 0.229, 0.115],
  },
  {
    id: 'popcorn',
    name: { 'zh-Hant': '\u7206\u7c73\u82b1', en: 'Popcorn' },
    signature: [0.227, 0.064, 0.738, 0.207, 0.21, 0.095, 0.165, 0.146, 0.053, 0.886, 0.196, 0.055],
  },
  {
    id: 'peach',
    name: { 'zh-Hant': '\u6c34\u871c\u6843', en: 'Peach' },
    signature: [0.132, 0.992, 0.122, 0.074, 0.488, 0.092, 0.153, 0.126, 0.067, 0.087, 0.145, 0.167],
  },
];

export const SPECTRUM_ODORS: readonly SpectrumOdorRecord[] = SEEDS.map((seed) => ({
  ...seed,
  signature: seed.signature as ChannelVector12,
  signatureVersion: SPECTRUM_CONTENT_VERSION,
  source: 'illustrativeGenerated' as const,
}));

SPECTRUM_ODORS.forEach(assertSpectrumSignature);

/** Stable roster order used by difficulty pools (first N odors). */
export const SPECTRUM_ODOR_IDS: readonly SpectrumOdorId[] = SPECTRUM_ODORS.map((o) => o.id);

export const spectrumContentCatalog: SpectrumContentCatalog = {
  contentVersion: SPECTRUM_CONTENT_VERSION,
  channelCount: SPECTRUM_CHANNEL_COUNT,
  odors: SPECTRUM_ODORS,
  modelDisclaimer: {
    'zh-Hant':
      '\u672c\u904a\u6232\u7684 12 \u901a\u9053\u6c23\u5473\u7c3d\u540d\u70ba\u300cillustrativeGenerated\u300d\u793a\u610f\u7528\u865b\u64ec\u53d7\u9ad4\u5411\u91cf\uff0c\u4e0d\u662f AeroSense\u3001HEK293T \u6216 Drosophila \u5be6\u9a57\u6e2c\u5f97\u8cc7\u6599\u3002',
    en: '12-channel odor signatures are illustrativeGenerated virtual-receptor vectors — not AeroSense, HEK293T, or Drosophila experimental measurements.',
  },
};

export function getSpectrumOdor(id: string): SpectrumOdorRecord | undefined {
  return SPECTRUM_ODORS.find((odor) => odor.id === id);
}

/** First `count` odors from the stable roster (beginner 8 / intermediate 12 / expert 16). */
export function spectrumPool(count: number): readonly SpectrumOdorRecord[] {
  if (count < 1 || count > SPECTRUM_ODORS.length) {
    throw new Error(`spectrumPool count must be 1..${SPECTRUM_ODORS.length}`);
  }
  return SPECTRUM_ODORS.slice(0, count);
}

export function signatureMap(
  odors: readonly SpectrumOdorRecord[] = SPECTRUM_ODORS,
): ReadonlyMap<string, ChannelVector12> {
  return new Map(odors.map((o) => [o.id, o.signature]));
}
