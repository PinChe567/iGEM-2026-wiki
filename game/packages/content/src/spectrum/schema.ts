/** Scent Spectrum (Game 3) content schema — illustrative 12-channel signatures. */

import type { LocaleCode, LocalizedName } from '../schema';

export const SPECTRUM_CONTENT_VERSION = '1.0.0' as const;

export const SPECTRUM_CHANNEL_COUNT = 12 as const;

/** Versioned 12-D odor signature; every component in [0, 1]. */
export type ChannelVector12 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

/**
 * Provenance of the signature vector.
 * Always `illustrativeGenerated` — never claim AeroSense / HEK293T / Drosophila lab data.
 */
export type SpectrumSourceKind = 'illustrativeGenerated';

export type SpectrumOdorId =
  | 'banana'
  | 'lemon'
  | 'rose'
  | 'coffee'
  | 'mint'
  | 'strawberry'
  | 'chocolate'
  | 'lavender'
  | 'orange'
  | 'cinnamon'
  | 'apple'
  | 'vanilla'
  | 'bread'
  | 'pine'
  | 'popcorn'
  | 'peach';

export type SpectrumOdorRecord = {
  id: SpectrumOdorId;
  name: LocalizedName;
  /** Illustrative virtual-receptor response across 12 channels. */
  signature: ChannelVector12;
  signatureVersion: typeof SPECTRUM_CONTENT_VERSION;
  source: SpectrumSourceKind;
};

export type SpectrumContentCatalog = {
  contentVersion: typeof SPECTRUM_CONTENT_VERSION;
  channelCount: typeof SPECTRUM_CHANNEL_COUNT;
  odors: readonly SpectrumOdorRecord[];
  modelDisclaimer: Record<LocaleCode, string>;
};

export function assertSpectrumSignature(odor: SpectrumOdorRecord): void {
  if (!odor.id) throw new Error('SpectrumOdorRecord.id is required');
  if (odor.signature.length !== SPECTRUM_CHANNEL_COUNT) {
    throw new Error(
      `SpectrumOdorRecord ${odor.id} signature must have length ${SPECTRUM_CHANNEL_COUNT}`,
    );
  }
  if (odor.source !== 'illustrativeGenerated') {
    throw new Error(`SpectrumOdorRecord ${odor.id} source must be illustrativeGenerated`);
  }
  for (let i = 0; i < odor.signature.length; i += 1) {
    const v = odor.signature[i]!;
    if (!Number.isFinite(v) || v < 0 || v > 1) {
      throw new Error(
        `SpectrumOdorRecord ${odor.id} signature[${i}] must be finite and in [0,1]`,
      );
    }
  }
}
