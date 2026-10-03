import { currentObjective, type AdventureSession } from '@suite/core/labyrinth';

const OBJ_ODOR: Record<string, string> = {
  coffee: 'coffee',
  piles: 'coffee',
  'storage-seal': 'coffee',
  rose: 'rose',
  thorns: 'rose',
  'garden-seal': 'rose',
  mint: 'mint',
};

export function objectiveOdor(session: AdventureSession): string | null {
  return OBJ_ODOR[currentObjective(session).id] ?? null;
}

/** Challenge breadcrumbs stay faint unless the matching profile is active. */
export function scanTrailStrength(session: AdventureSession, hintLevel: number): number {
  if (hintLevel >= 2) return 1;
  if (session.difficulty === 'junior') return 1;
  if (session.difficulty === 'standard') return 0.62;
  const need = objectiveOdor(session);
  if (!need) return 0.4;
  return session.player.activeScentProfileId === need ? 0.55 : 0.12;
}

export function scanTrailMs(session: AdventureSession): number {
  if (session.difficulty === 'junior') return 5000;
  if (session.difficulty === 'standard') return 4000;
  return 3000;
}

export function beaconStrength(session: AdventureSession, hintLevel: number, scanning: boolean): number {
  if (hintLevel >= 3) return 0.7;
  if (session.difficulty === 'junior') return 0.48;
  if (session.difficulty === 'standard') return 0.22;
  return scanning ? 0.38 : 0;
}

export function compactClueKey(objectiveId: string): string {
  const keys: Record<string, string> = {
    lemon: 'hudClueLemon',
    vines: 'hudClueVines',
    cartridge: 'hudClueCartridge',
    optical: 'hudClueOptical',
    filter: 'hudClueFilter',
    secret: 'hudClueSecret',
    leave: 'hudClueLeave',
  };
  return keys[objectiveId] ?? '';
}

export function majorWing(room: string): 'storage' | 'greenhouse' | 'signal' | null {
  if (room === 'storage' || room === 'greenhouse' || room === 'signal') return room;
  return null;
}

export function hintIdleMs(difficulty: AdventureSession['difficulty'], presetMs: number): number {
  if (difficulty === 'junior') return Math.max(35000, Math.min(presetMs, 40000));
  if (difficulty === 'standard') return 40000;
  return 45000;
}
