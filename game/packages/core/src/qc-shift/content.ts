/**
 * Educational catalog for QC Shift.
 * Readings and outcomes are illustrative simulations — not AeroSense lab claims.
 */

export const QC_SHIFT_SCIENTIFIC_ROLE = 'screening' as const;

export const QC_SHIFT_DISCLAIMER = {
  en: 'All risk readings, confidence values, outcomes and costs are educational simulations, not experimental AeroSense performance claims.',
  'zh-Hant':
    '\u6240\u6709\u98a8\u96aa\u8b80\u503c\u3001\u4fe1\u5fc3\u6c34\u6e96\u3001\u7d50\u679c\u8207\u6210\u672c\u7686\u70ba\u6559\u80b2\u6a21\u64ec\uff0c\u4e26\u975e AeroSense \u5be6\u9a57\u6548\u80fd\u8072\u660e\u3002',
} as const;

export const QC_SHIFT_SCREENING_NOTE = {
  en: 'AeroSense is an early fungal-risk screening system, not a diagnostic or official confirmatory food-safety test.',
  'zh-Hant':
    '\u0041\u0065\u0072\u006f\u0053\u0065\u006e\u0073\u0065 \u662f\u65e9\u671f\u771f\u83cc\u98a8\u96aa\u7be9\u6aa2\u7cfb\u7d71\uff0c\u4e0d\u662f\u8a3a\u65b7\u6216\u5b98\u65b9\u78ba\u8a8d\u98df\u5b89\u6aa2\u9a57\u3002',
} as const;

export type QcProduct = {
  id: string;
  labelKey: string;
};

export const QC_SHIFT_PRODUCTS: readonly QcProduct[] = [
  { id: 'lot-grain-01', labelKey: 'product.grain' },
  { id: 'lot-nuts-02', labelKey: 'product.nuts' },
  { id: 'lot-fruit-03', labelKey: 'product.driedFruit' },
  { id: 'lot-spice-04', labelKey: 'product.spice' },
  { id: 'lot-feed-05', labelKey: 'product.feed' },
  { id: 'lot-cocoa-06', labelKey: 'product.cocoa' },
  { id: 'lot-coffee-07', labelKey: 'product.coffee' },
  { id: 'lot-rice-08', labelKey: 'product.rice' },
  { id: 'lot-maize-09', labelKey: 'product.maize' },
  { id: 'lot-seed-10', labelKey: 'product.seed' },
  { id: 'lot-herb-11', labelKey: 'product.herb' },
  { id: 'lot-flour-12', labelKey: 'product.flour' },
];

/** Explanation keys consumed by a future UI. Copy here is for tests and metadata only. */
export const QC_SHIFT_EXPLANATIONS: Record<string, { en: string; 'zh-Hant': string }> = {
  'explain.true-low': {
    en: 'Low screening output with good signal quality. Routine monitoring is the matching follow-up, not a claim that the lot passed a confirmatory test.',
    'zh-Hant':
      '\u4f4e\u98a8\u96aa\u7be9\u6aa2\u8b80\u503c\u4e14\u8a0a\u865f\u54c1\u8cea\u826f\u597d\u3002\u4f8b\u884c\u76e3\u6e2c\u5373\u53ef\uff0c\u4e26\u4e0d\u8868\u793a\u5df2\u901a\u904e\u78ba\u8a8d\u6aa2\u9a57\u3002',
  },
  'explain.true-high': {
    en: 'High screening output. Hold the lot for follow-up confirmation. This is an escalation, not a final food-safety verdict.',
    'zh-Hant':
      '\u9ad8\u98a8\u96aa\u7be9\u6aa2\u8b80\u503c\u3002\u61c9\u66ab\u755c\u4e26\u9001\u4ea4\u8ffd\u8e64\u78ba\u8a8d\uff1b\u9019\u662f\u5347\u7d1a\u8655\u7f6e\uff0c\u4e0d\u662f\u6700\u7d42\u98df\u5b89\u5224\u5b9a\u3002',
  },
  'explain.true-medium': {
    en: 'Medium screening output. Retest or hold for confirmation depending on quality flags; it is still a screening result.',
    'zh-Hant':
      '\u4e2d\u7b49\u7be9\u6aa2\u8b80\u503c\u3002\u8996\u54c1\u8cea\u6a19\u8a18\u53ef\u91cd\u6e2c\u6216\u66ab\u755c\u78ba\u8a8d\uff1b\u4ecd\u5c6c\u7be9\u6aa2\u7d50\u679c\u3002',
  },
  'explain.false-positive': {
    en: 'The first screening looked high, but simulated follow-up did not show elevated fungal risk. Extra holding costs time and food movement; it is not the same as missing a high-risk lot.',
    'zh-Hant':
      '\u9996\u6b21\u7be9\u6aa2\u504f\u9ad8\uff0c\u4f46\u6a21\u64ec\u8ffd\u8e64\u672a\u898b\u6607\u9ad8\u771f\u83cc\u98a8\u96aa\u3002\u591a\u9918\u66ab\u755c\u6703\u82b1\u6642\u9593\u8207\u7269\u6599\u6d41\u7a0b\uff0c\u4e0d\u7b49\u540c\u65bc\u9055\u6f0f\u9ad8\u98a8\u96aa\u6279\u6b21\u3002',
  },
  'explain.false-negative': {
    en: 'A low or unclear screening missed simulated high fungal risk. Missing high-risk lots is the most serious screening error.',
    'zh-Hant':
      '\u504f\u4f4e\u6216\u4e0d\u660e\u7684\u7be9\u6aa2\u9055\u6f0f\u4e86\u6a21\u64ec\u9ad8\u771f\u83cc\u98a8\u96aa\u3002\u9055\u6f0f\u9ad8\u98a8\u96aa\u6279\u6b21\u662f\u6700\u56b4\u91cd\u7684\u7be9\u6aa2\u8aa4\u5dee\u3002',
  },
  'explain.borderline': {
    en: 'Borderline medium output with uncertain quality. A repeat screening can clarify before choosing monitor or hold-for-confirmation.',
    'zh-Hant':
      '\u908a\u7de3\u4e2d\u7b49\u8b80\u503c\u4e14\u54c1\u8cea\u4e0d\u78ba\u5b9a\u3002\u53ef\u5148\u91cd\u8907\u7be9\u6aa2\uff0c\u518d\u6c7a\u5b9a\u76e3\u6e2c\u6216\u66ab\u755c\u78ba\u8a8d\u3002',
  },
  'explain.invalid-reading': {
    en: 'Invalid screening output. Uncertain or invalid results may require retesting before any hold-or-monitor decision.',
    'zh-Hant':
      '\u7121\u6548\u7be9\u6aa2\u8b80\u503c\u3002\u4e0d\u78ba\u5b9a\u6216\u7121\u6548\u7d50\u679c\u61c9\u5148\u91cd\u6e2c\uff0c\u518d\u6c7a\u5b9a\u66ab\u755c\u6216\u76e3\u6e2c\u3002',
  },
  'explain.drift-qc': {
    en: 'Poor QC / drift flags mean the first number is not trustworthy. Repeat screening before treating it as a stable low or high output.',
    'zh-Hant':
      '\u54c1\u7ba1\u4e0d\u4f73\u6216\u6f02\u79fb\u6a19\u8a18\u8868\u793a\u9996\u6b21\u6578\u503c\u4e0d\u53ef\u4fe1\u3002\u61c9\u91cd\u8907\u7be9\u6aa2\uff0c\u52ff\u76f4\u63a5\u7576\u6210\u7a69\u5b9a\u7684\u4f4e\u6216\u9ad8\u8b80\u503c\u3002',
  },
};

export function getQcProduct(id: string): QcProduct | undefined {
  return QC_SHIFT_PRODUCTS.find((p) => p.id === id);
}

export function listQcExplanationKeys(): readonly string[] {
  return Object.keys(QC_SHIFT_EXPLANATIONS);
}
