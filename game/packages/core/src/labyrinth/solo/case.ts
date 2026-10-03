/**
 * Solo official case: 1 human (never phantom) + 4 NPCs.
 * Only Prompt-03-style uniquely solvable evidence sets are accepted.
 */

import { createRng, randomInt } from '../../rng';
import {
  LABYRINTH_CASE_SCHEMA_VERSION,
  LABYRINTH_GAME_VERSION,
  LABYRINTH_MAP_VERSION,
} from '../constants';
import { MAP_V1 } from '../map/load';
import {
  ALL_GATE_IDS,
  LABYRINTH_ODOR_IDS,
  ROLE_GATE_TABLE,
  type GateId,
  type LabyrinthOdorId,
} from '../role-gates';
import {
  countSolutions,
  defaultOdorPool,
  uniqueSolutionOrNull,
} from '../solver/constraint-solver';
import { buildFullEvidence } from '../case/generator';
import type {
  EvidenceEvent,
  OfflineCase,
  PlayerRoleAssignment,
} from '../types';
import {
  SOLO_ACTOR_COUNT,
  SOLO_HUMAN_ID,
  SOLO_TASK_KINDS,
  type SoloTaskKind,
} from './constants';

export type NpcGoalKind =
  | 'wander_central'
  | 'do_task'
  | 'visit_scanner'
  | 'visit_review'
  | 'phantom_illegal_gate'
  | 'phantom_jam'
  | 'phantom_sabotage_door';

export type NpcGoal = {
  kind: NpcGoalKind;
  /** Optional task / gate / door id */
  targetId?: string;
  /** Sim time (ms from round start) when this goal becomes active. */
  atMs: number;
  durationMs: number;
};

export type NpcPlan = {
  npcId: string;
  goals: NpcGoal[];
};

export type NpcStatement = {
  npcId: string;
  /** Stable template id for i18n — never free-form NLG. */
  templateId:
    | 'saw_gate'
    | 'worked_task'
    | 'heard_door'
    | 'no_artifact'
    | 'visited_central';
  /** Bound facts (true but incomplete). */
  facts: {
    gateId?: GateId;
    taskId?: string;
    doorId?: string;
  };
};

export type SoloCase = OfflineCase & {
  humanPlayerId: typeof SOLO_HUMAN_ID;
  npcIds: string[];
  plans: NpcPlan[];
  statements: NpcStatement[];
  /** Mini-task kinds scheduled for the human (seeded order). */
  humanTaskKinds: SoloTaskKind[];
  /** Evidence ids that must appear by end of round for uniqueness. */
  requiredEvidenceIds: string[];
};

export type GenerateSoloResult =
  | { ok: true; case: SoloCase; attempts: number }
  | {
      ok: false;
      reason: 'non_unique' | 'phantom_on_human' | 'invalid';
      seed: string;
      attempts: number;
      solutionCount?: number;
    };

function playerId(index: number): string {
  return `P${index + 1}`;
}

function pickDistinctOdors(rng: () => number, count: number): LabyrinthOdorId[] {
  const pool = [...LABYRINTH_ODOR_IDS];
  const picked: LabyrinthOdorId[] = [];
  for (let i = 0; i < count; i += 1) {
    const index = randomInt(rng, pool.length);
    picked.push(pool.splice(index, 1)[0]!);
  }
  return picked;
}

function buildNpcStatements(
  roles: readonly PlayerRoleAssignment[],
  phantomId: string,
  rng: () => number,
): NpcStatement[] {
  const statements: NpcStatement[] = [];
  for (const role of roles) {
    if (role.playerId === SOLO_HUMAN_ID) continue;
    const gates = ROLE_GATE_TABLE[role.odorId];
    const gateId = gates[randomInt(rng, gates.length)]!;
    const legalTasks = MAP_V1.tasks.filter((t) =>
      ROLE_GATE_TABLE[role.odorId].includes(t.requiredGateId),
    );
    const task = legalTasks[randomInt(rng, Math.max(1, legalTasks.length))];
    // True but incomplete: only one owned gate + one task mention; never names phantom.
    statements.push({
      npcId: role.playerId,
      templateId: 'saw_gate',
      facts: { gateId },
    });
    if (task) {
      statements.push({
        npcId: role.playerId,
        templateId: 'worked_task',
        facts: { taskId: task.id },
      });
    }
    if (role.playerId !== phantomId) {
      statements.push({
        npcId: role.playerId,
        templateId: 'no_artifact',
        facts: {},
      });
    } else {
      statements.push({
        npcId: role.playerId,
        templateId: 'visited_central',
        facts: {},
      });
    }
    void ALL_GATE_IDS;
  }
  return statements;
}

function buildNpcPlans(
  roles: readonly PlayerRoleAssignment[],
  phantomId: string,
  rng: () => number,
): NpcPlan[] {
  const plans: NpcPlan[] = [];
  for (const role of roles) {
    if (role.playerId === SOLO_HUMAN_ID) continue;
    const goals: NpcGoal[] = [];
    const legalTasks = MAP_V1.tasks.filter((t) =>
      ROLE_GATE_TABLE[role.odorId].includes(t.requiredGateId),
    );
    goals.push({
      kind: 'wander_central',
      atMs: 0,
      durationMs: 20_000 + randomInt(rng, 15_000),
    });
    if (legalTasks.length > 0) {
      const task = legalTasks[randomInt(rng, legalTasks.length)]!;
      goals.push({
        kind: 'do_task',
        targetId: task.id,
        atMs: 25_000 + randomInt(rng, 40_000),
        durationMs: 25_000,
      });
    }
    goals.push({
      kind: 'visit_scanner',
      atMs: 80_000 + randomInt(rng, 30_000),
      durationMs: 15_000,
    });

    if (role.playerId === phantomId) {
      const illegal = ALL_GATE_IDS.find(
        (g) => !ROLE_GATE_TABLE[role.odorId].includes(g),
      )!;
      goals.push({
        kind: 'phantom_illegal_gate',
        targetId: illegal,
        atMs: 45_000 + randomInt(rng, 25_000),
        durationMs: 20_000,
      });
      goals.push({
        kind: 'phantom_jam',
        atMs: 100_000 + randomInt(rng, 20_000),
        durationMs: 10_000,
      });
      if (MAP_V1.doors[0]) {
        goals.push({
          kind: 'phantom_sabotage_door',
          targetId: MAP_V1.doors[0].id,
          atMs: 110_000 + randomInt(rng, 15_000),
          durationMs: 12_000,
        });
      }
    }

    goals.sort((a, b) => a.atMs - b.atMs);
    plans.push({ npcId: role.playerId, goals });
  }
  return plans;
}

function buildSoloAttempt(seed: string, contentVersion: string, rng: () => number): SoloCase {
  const odors = pickDistinctOdors(rng, SOLO_ACTOR_COUNT);
  // Phantom among NPCs only (indices 1..4)
  const phantomIndex = 1 + randomInt(rng, SOLO_ACTOR_COUNT - 1);
  const playerRoles: PlayerRoleAssignment[] = odors.map((odorId, index) => ({
    playerId: playerId(index),
    odorId,
    isPhantom: index === phantomIndex,
    spawnId: MAP_V1.spawns[index % MAP_V1.spawns.length]!.id,
  }));
  const phantomPlayerId = playerRoles[phantomIndex]!.playerId;
  const npcRoles = playerRoles.filter((r) => r.playerId !== SOLO_HUMAN_ID);
  const evidenceEvents = buildFullEvidence(playerRoles, phantomPlayerId);
  const humanTaskKinds = [...SOLO_TASK_KINDS];
  for (let i = humanTaskKinds.length - 1; i > 0; i -= 1) {
    const j = randomInt(rng, i + 1);
    [humanTaskKinds[i], humanTaskKinds[j]] = [humanTaskKinds[j]!, humanTaskKinds[i]!];
  }

  return {
    schemaVersion: LABYRINTH_CASE_SCHEMA_VERSION,
    seed,
    contentVersion,
    gameVersion: LABYRINTH_GAME_VERSION,
    mapVersion: LABYRINTH_MAP_VERSION,
    playerCount: SOLO_ACTOR_COUNT,
    playerRoles,
    npcRoles,
    phantomPlayerId,
    taskPlacement: MAP_V1.tasks.map((t) => ({ taskId: t.id, enabled: true })),
    evidenceEvents,
    truth: {
      phantomPlayerId,
      assignments: playerRoles.map((r) => ({
        playerId: r.playerId,
        odorId: r.odorId,
      })),
    },
    humanPlayerId: SOLO_HUMAN_ID,
    npcIds: npcRoles.map((r) => r.playerId),
    plans: buildNpcPlans(playerRoles, phantomPlayerId, rng),
    statements: buildNpcStatements(playerRoles, phantomPlayerId, rng),
    humanTaskKinds,
    requiredEvidenceIds: evidenceEvents.map((e) => e.id),
  };
}

/**
 * Generate a wiki-solo official case. Phantom is never the human player.
 * Multi-solution seeds are rejected (never silently disambiguated).
 */
export function generateSoloOfficialCase(options: {
  seed: string;
  contentVersion?: string;
  maxAttempts?: number;
}): GenerateSoloResult {
  const contentVersion = options.contentVersion ?? '1.0.0';
  const maxAttempts = options.maxAttempts ?? 64;
  const rng = createRng(`labyrinth-solo:${options.seed}`);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const solo = buildSoloAttempt(options.seed, contentVersion, rng);
    if (solo.phantomPlayerId === SOLO_HUMAN_ID) {
      continue;
    }
    const playerIds = solo.playerRoles.map((r) => r.playerId);
    const solutionCount = countSolutions({
      playerIds,
      odorPool: defaultOdorPool(),
      evidence: solo.evidenceEvents,
    });
    if (solutionCount !== 1) {
      if (attempt === maxAttempts) {
        return {
          ok: false,
          reason: 'non_unique',
          seed: options.seed,
          attempts: attempt,
          solutionCount,
        };
      }
      continue;
    }
    const solution = uniqueSolutionOrNull({
      playerIds,
      odorPool: defaultOdorPool(),
      evidence: solo.evidenceEvents,
    });
    if (!solution || solution.phantomPlayerId !== solo.truth.phantomPlayerId) {
      continue;
    }
    return { ok: true, case: solo, attempts: attempt };
  }

  return {
    ok: false,
    reason: 'non_unique',
    seed: options.seed,
    attempts: maxAttempts,
  };
}

export function generateSoloOfficialCaseOrThrow(seed: string): SoloCase {
  const result = generateSoloOfficialCase({ seed });
  if (!result.ok) {
    throw new Error(
      `Solo case rejected seed=${seed} reason=${result.reason} solutions=${result.solutionCount ?? '?'}`,
    );
  }
  return result.case;
}

/** Filter evidence the player has actually discovered (ids). */
export function discoveredEvidence(
  solo: SoloCase,
  discoveredIds: ReadonlySet<string>,
): EvidenceEvent[] {
  return solo.evidenceEvents.filter((e) => discoveredIds.has(e.id));
}

export function solutionStatusForEvidence(
  solo: SoloCase,
  discoveredIds: ReadonlySet<string>,
): { count: number; unique: boolean; matchesTruth: boolean } {
  const evidence = discoveredEvidence(solo, discoveredIds);
  const solutions = countSolutions({
    playerIds: solo.playerRoles.map((r) => r.playerId),
    odorPool: defaultOdorPool(),
    evidence,
  });
  const unique = solutions === 1;
  const sol = unique
    ? uniqueSolutionOrNull({
        playerIds: solo.playerRoles.map((r) => r.playerId),
        odorPool: defaultOdorPool(),
        evidence,
      })
    : null;
  return {
    count: solutions,
    unique,
    matchesTruth: Boolean(
      sol && sol.phantomPlayerId === solo.truth.phantomPlayerId,
    ),
  };
}
