/** Content catalog schema (versioned). */

export const CONTENT_VERSION = '1.0.0' as const;

export type LocaleCode = 'zh-Hant' | 'en';

export type SourceStatus =
  | 'illustrative'
  | 'verified'
  | 'TODO-VERIFY';

export type CreditStatus =
  | 'credited'
  | 'pending'
  | 'TODO-VERIFY';

/** Five illustrative axes used by Game 1 (not wet-lab measurements). */
export type FeatureVector5 = readonly [number, number, number, number, number];

export type LocalizedName = {
  'zh-Hant': string;
  en: string;
};

export type OdorRecord = {
  id: string;
  name: LocalizedName;
  /** Hand-authored illustrative feature vector for the virtual receptor model (not experimental). */
  featureVector: FeatureVector5;
  imageKey: string;
  sourceStatus: SourceStatus;
  creditStatus: CreditStatus;
  /** Explicit model label for UI / science copy. */
  modelKind: 'illustrative-virtual-receptor';
};

export type ContentCatalog = {
  contentVersion: typeof CONTENT_VERSION;
  odors: readonly OdorRecord[];
  modelDisclaimer: {
    'zh-Hant': string;
    en: string;
  };
};

export function assertOdorRecord(odor: OdorRecord): void {
  if (!odor.id) throw new Error('OdorRecord.id is required');
  if (odor.featureVector.length !== 5) {
    throw new Error(`OdorRecord ${odor.id} featureVector must have length 5`);
  }
  if (!odor.imageKey) throw new Error(`OdorRecord ${odor.id} imageKey is required`);
}
