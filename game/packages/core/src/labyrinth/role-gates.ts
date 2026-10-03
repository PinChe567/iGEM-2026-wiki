/**
 * Authoritative gate distribution for pure core logic.
 * Must stay in lockstep with @suite/content labyrinth roles (enforced by tests).
 */

export type GateId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type LabyrinthOdorId =
  | 'banana'
  | 'lemon'
  | 'rose'
  | 'coffee'
  | 'mint'
  | 'garlic'
  | 'peach'
  | 'pine';

export const ALL_GATE_IDS: readonly GateId[] = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export const ROLE_GATE_TABLE: Readonly<
  Record<LabyrinthOdorId, readonly [GateId, GateId, GateId]>
> = {
  banana: ['A', 'B', 'D'],
  lemon: ['A', 'C', 'F'],
  rose: ['B', 'C', 'E'],
  coffee: ['B', 'D', 'F'],
  mint: ['A', 'C', 'E'],
  garlic: ['D', 'E', 'F'],
  peach: ['A', 'E', 'F'],
  pine: ['B', 'C', 'D'],
} as const;

export const LABYRINTH_ODOR_IDS = Object.keys(ROLE_GATE_TABLE) as LabyrinthOdorId[];

export function authorizedGates(odorId: LabyrinthOdorId): ReadonlySet<GateId> {
  return new Set(ROLE_GATE_TABLE[odorId]);
}

export function gateKey(odorId: LabyrinthOdorId): string {
  return [...ROLE_GATE_TABLE[odorId]].sort().join('');
}

export function odorIdFromGateKey(key: string): LabyrinthOdorId | undefined {
  for (const id of LABYRINTH_ODOR_IDS) {
    if (gateKey(id) === key) return id;
  }
  return undefined;
}

export function isAuthorizedGate(odorId: LabyrinthOdorId, gateId: GateId): boolean {
  return ROLE_GATE_TABLE[odorId].includes(gateId);
}
