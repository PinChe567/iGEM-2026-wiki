import type { AdventureDifficulty, AdventureModuleId } from './types';

export const ADVENTURE_GAME_VERSION = '1.1.0' as const;
export const ADVENTURE_MAP_VERSION = 'adventure-1.0.0' as const;
export const ADVENTURE_TITLE_EN = 'AeroSense: Scentbound Labyrinth';
export const ADVENTURE_TITLE_ZH = 'AeroSense\uFF1A\u6c23\u5473\u8ff7\u5bae';

export const ADVENTURE_MODULE_IDS: readonly AdventureModuleId[] = [
  'receptor-cartridge',
  'optical-reader',
  'signal-filter',
  'pattern-decoder',
] as const;

/** Conceptual links are educational labels, not claims that enemies drop biological parts. */
export const ADVENTURE_MODULE_SCIENCE: Record<
  AdventureModuleId,
  { concept: string; unlock: string }
> = {
  'receptor-cartridge': {
    concept: 'OR / Orco sensing cells (illustrative)',
    unlock: 'basic odor detection',
  },
  'optical-reader': {
    concept: 'fluorescence excitation / readout (illustrative)',
    unlock: 'odor trail intensity visualization',
  },
  'signal-filter': {
    concept: 'weak-signal processing / noise rejection (illustrative)',
    unlock: 'remove false / noisy scent markers',
  },
  'pattern-decoder': {
    concept: 'computational / neuromorphic pattern decoding (illustrative)',
    unlock: 'classify learned scent patterns and final gate',
  },
};

export const ADVENTURE_SEAL_IDS = ['storage', 'garden', 'signal'] as const;

export const ADVENTURE_ODOR_IDS = [
  'coffee',
  'rose',
  'mint',
  'lemon',
  'pine',
  'banana',
  'peach',
] as const;

/** Concrete in-map use for every scent that appears on a difficulty. */
export const SCENT_GAMEPLAY_USES: Record<string, string> = {
  coffee: 'coffee-pile',
  rose: 'thorn-wall',
  mint: 'airflow-trail',
  lemon: 'cleaning-trail',
  pine: 'wood-panel',
  banana: 'banana-passage',
  peach: 'scent-lock',
};

export const ADVENTURE_ODOR_VECTORS: Record<string, readonly number[]> = {
  banana: [1, 0.1, 0.1, 0.45, 0.05],
  lemon: [1, 0.05, 0.9, 0.05, 0.08],
  mint: [0.08, 0.25, 1, 0.02, 0.08],
  rose: [0.15, 1, 0.12, 0.2, 0.02],
  coffee: [0.02, 0.02, 0.08, 1, 0.35],
  pine: [0.02, 0.15, 0.88, 0.3, 0.18],
  peach: [1, 0.38, 0.18, 0.22, 0.02],
};

export const INTERACT_RANGE = 1.5;
export const PLAYER_RADIUS = 0.28;
export const ENEMY_RADIUS = 0.32;
export const ATTACK_RANGE = 1.05;
export const ATTACK_ARC_DEG = 130;
export const ATTACK_COOLDOWN_MS = 450;
export const PLAYER_INVULN_MS = 800;
export const SPAWN_GRACE_MS = 2200;
export const SCAN_DURATION_MS = 1800;
export const SCAN_COOLDOWN_MS = 4000;
export const CONTACT_DAMAGE = 1;
export const PLAYER_ATTACK_DAMAGE = 1;
export const MOVE_SPEED = 3.2;
export const VINE_WAKE_RANGE = 2.2;
export const SCAN_REVEAL_RANGE = 8;

export type AdventurePreset = {
  difficulty: AdventureDifficulty;
  maxHealth: number;
  odorCount: number;
  startingScanCharges: number | null;
  attackOmni: boolean;
  scanCooldownMs: number;
  enemySpeedMul: number;
  extraNoise: boolean;
  shimmerSecrets: boolean;
  compassStrength: 'strong' | 'normal' | 'subtle';
  hintIdleMs: number;
};

export const ADVENTURE_PRESETS: Record<AdventureDifficulty, AdventurePreset> = {
  junior: {
    difficulty: 'junior',
    maxHealth: 6,
    odorCount: 3,
    startingScanCharges: null,
    attackOmni: true,
    scanCooldownMs: 500,
    enemySpeedMul: 0.62,
    extraNoise: false,
    shimmerSecrets: true,
    compassStrength: 'strong',
    hintIdleMs: 28000,
  },
  standard: {
    difficulty: 'standard',
    maxHealth: 5,
    odorCount: 5,
    startingScanCharges: 5,
    attackOmni: false,
    scanCooldownMs: SCAN_COOLDOWN_MS,
    enemySpeedMul: 1,
    extraNoise: false,
    shimmerSecrets: false,
    compassStrength: 'normal',
    hintIdleMs: 40000,
  },
  challenge: {
    difficulty: 'challenge',
    maxHealth: 4,
    odorCount: 7,
    startingScanCharges: 4,
    attackOmni: false,
    scanCooldownMs: 5500,
    enemySpeedMul: 1.18,
    extraNoise: true,
    shimmerSecrets: false,
    compassStrength: 'subtle',
    hintIdleMs: 55000,
  },
};

export function requiredOdorIds(difficulty: AdventureDifficulty): string[] {
  return ADVENTURE_ODOR_IDS.slice(0, ADVENTURE_PRESETS[difficulty].odorCount);
}

export const ENEMY_STATS: Record<
  'sporeling' | 'vineCrawler' | 'noiseWisp' | 'mimicSpore' | 'noiseBloom',
  { health: number; speed: number; aggroRange: number }
> = {
  sporeling: { health: 2, speed: 1.15, aggroRange: 5.5 },
  vineCrawler: { health: 2, speed: 1.55, aggroRange: 6 },
  noiseWisp: { health: 2, speed: 1.35, aggroRange: 5 },
  mimicSpore: { health: 3, speed: 1.4, aggroRange: 4.5 },
  noiseBloom: { health: 6, speed: 0.85, aggroRange: 9 },
};

export function enemyHealthFor(
  kind: keyof typeof ENEMY_STATS,
  difficulty: AdventureDifficulty,
): number {
  const base = ENEMY_STATS[kind].health;
  if (difficulty === 'junior') {
    if (kind === 'noiseBloom') return 4;
    if (kind === 'mimicSpore') return 2;
    return 1;
  }
  if (difficulty === 'challenge' && kind === 'noiseBloom') return base + 2;
  return base;
}
