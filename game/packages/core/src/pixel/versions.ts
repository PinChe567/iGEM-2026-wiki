/** Pixel Lab rule / seed protocol versions (independent of suite packaging). */
export const PIXEL_GAME_VERSION = '2.1.0' as const;
export const PIXEL_SEED_VERSION = '3' as const;

export type PixelVersions = {
  gameVersion: typeof PIXEL_GAME_VERSION;
  seedVersion: typeof PIXEL_SEED_VERSION;
};

export function getPixelVersions(): PixelVersions {
  return {
    gameVersion: PIXEL_GAME_VERSION,
    seedVersion: PIXEL_SEED_VERSION,
  };
}
