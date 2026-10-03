/** Labyrinth (Game 2) role / odor-identity content schema. */

import type { LocaleCode, LocalizedName } from '../schema';

export const LABYRINTH_CONTENT_VERSION = '1.0.0' as const;

export type GateId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export const ALL_GATE_IDS: readonly GateId[] = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

/** Stable odor-identity ids used by Scentbound Labyrinth (subset of suite odors). */
export type LabyrinthOdorId =
  | 'banana'
  | 'lemon'
  | 'rose'
  | 'coffee'
  | 'mint'
  | 'garlic'
  | 'peach'
  | 'pine';

export type LabyrinthRoleRecord = {
  id: LabyrinthOdorId;
  name: LocalizedName;
  /** Authorized receptor gates for this identity (exactly three, unique across roster). */
  gates: readonly [GateId, GateId, GateId];
  blurb: LocalizedName;
  /**
   * Always true for labyrinth identities: A–F are fictional receptor gates,
   * not a claim about real OR affinity tables.
   */
  fictionalModel: true;
};

export type ScienceLimitNote = {
  id: string;
  title: LocalizedName;
  body: LocalizedName;
};

export type LabyrinthContentCatalog = {
  contentVersion: typeof LABYRINTH_CONTENT_VERSION;
  gameId: 'labyrinth';
  productName: LocalizedName;
  fictionalModel: true;
  roles: readonly LabyrinthRoleRecord[];
  phantom: {
    id: 'phantom';
    name: LocalizedName;
    blurb: LocalizedName;
    abilities: {
      phaseShift: LocalizedName;
      signalJam: LocalizedName;
    };
  };
  scienceLimits: readonly ScienceLimitNote[];
  modelDisclaimer: LocalizedName;
};

export function assertLabyrinthRole(role: LabyrinthRoleRecord): void {
  if (!role.id) throw new Error('LabyrinthRoleRecord.id is required');
  if (role.gates.length !== 3) {
    throw new Error(`LabyrinthRoleRecord ${role.id} must have exactly 3 gates`);
  }
  if (new Set(role.gates).size !== 3) {
    throw new Error(`LabyrinthRoleRecord ${role.id} gates must be unique`);
  }
  if (role.fictionalModel !== true) {
    throw new Error(`LabyrinthRoleRecord ${role.id} must set fictionalModel=true`);
  }
}

export type { LocaleCode, LocalizedName };
