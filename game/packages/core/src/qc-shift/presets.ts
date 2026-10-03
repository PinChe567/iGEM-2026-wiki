import type { QcShiftPresetId, QcShiftSettings, ScenarioType } from './types';

export const QC_SHIFT_PRESET_IDS: readonly QcShiftPresetId[] = ['junior', 'standard', 'challenge'];

export const QC_SHIFT_PRESETS: Record<QcShiftPresetId, QcShiftSettings> = {
  junior: {
    presetId: 'junior',
    batchCount: 4,
    restrictiveBudget: false,
    retestBudget: null,
    confirmBudget: null,
    timeBudget: null,
    retestTimeCost: 0,
    confirmTimeCost: 0,
    showConfidence: false,
    showQcFlags: false,
  },
  standard: {
    presetId: 'standard',
    batchCount: 6,
    restrictiveBudget: true,
    retestBudget: 3,
    confirmBudget: 2,
    timeBudget: 16,
    retestTimeCost: 2,
    confirmTimeCost: 3,
    showConfidence: true,
    showQcFlags: true,
  },
  challenge: {
    presetId: 'challenge',
    batchCount: 8,
    restrictiveBudget: true,
    retestBudget: 2,
    confirmBudget: 1,
    timeBudget: 12,
    retestTimeCost: 2,
    confirmTimeCost: 3,
    showConfidence: true,
    showQcFlags: true,
  },
};

/** Required educational mix for a balanced run. Order is later shuffled by seed. */
export const QC_SHIFT_REQUIRED_TYPES: Record<QcShiftPresetId, readonly ScenarioType[]> = {
  junior: ['true-low', 'true-high', 'invalid-reading', 'borderline'],
  standard: ['true-low', 'true-high', 'true-medium', 'false-positive', 'borderline', 'invalid-reading'],
  challenge: [
    'true-low',
    'true-high',
    'true-medium',
    'false-positive',
    'false-negative',
    'borderline',
    'invalid-reading',
    'drift-qc',
  ],
};

export function getQcShiftPreset(presetId: QcShiftPresetId): QcShiftSettings {
  const preset = QC_SHIFT_PRESETS[presetId];
  if (!preset) throw new Error(`Unknown QC Shift preset: ${presetId}`);
  return { ...preset };
}

export function isQcShiftPresetId(value: string): value is QcShiftPresetId {
  return (QC_SHIFT_PRESET_IDS as readonly string[]).includes(value);
}

export function initialResources(settings: QcShiftSettings): {
  retestRemaining: number | null;
  confirmRemaining: number | null;
  timeRemaining: number | null;
} {
  return {
    retestRemaining: settings.retestBudget,
    confirmRemaining: settings.confirmBudget,
    timeRemaining: settings.timeBudget,
  };
}
