export const QC_SHIFT_GAME_VERSION = '1.0.0' as const;
export const QC_SHIFT_SEED_VERSION = '1' as const;
export const QC_SHIFT_CONTENT_VERSION = '1.0.0' as const;

export type QcShiftVersions = {
  gameVersion: typeof QC_SHIFT_GAME_VERSION;
  seedVersion: typeof QC_SHIFT_SEED_VERSION;
  contentVersion: typeof QC_SHIFT_CONTENT_VERSION;
};

export function getQcShiftVersions(): QcShiftVersions {
  return {
    gameVersion: QC_SHIFT_GAME_VERSION,
    seedVersion: QC_SHIFT_SEED_VERSION,
    contentVersion: QC_SHIFT_CONTENT_VERSION,
  };
}
