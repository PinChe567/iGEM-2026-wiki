import {
  LABYRINTH_CASE_SCHEMA_VERSION,
  LABYRINTH_GAME_VERSION,
  LABYRINTH_MAP_VERSION,
  MAX_PLAYERS,
  MIN_PLAYERS,
} from '../constants';
import { createRng, randomInt } from '../../rng';
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
import type {
  EvidenceEvent,
  OfflineCase,
  PlayerRoleAssignment,
  TaskPlacement,
} from '../types';
import { MAP_V1 } from '../map/load';

export type GenerateCaseOptions = {
  seed: string;
  playerCount?: number;
  contentVersion: string;
  /** Max attempts when uniqueness fails (same seed stream advances). */
  maxAttempts?: number;
};

export type GenerateCaseResult =
  | { ok: true; case: OfflineCase; attempts: number }
  | {
      ok: false;
      reason: 'non_unique' | 'invalid_player_count';
      seed: string;
      attempts: number;
      solutionCount?: number;
    };

function pickDistinctOdors(
  rng: () => number,
  count: number,
): LabyrinthOdorId[] {
  const pool = [...LABYRINTH_ODOR_IDS];
  const picked: LabyrinthOdorId[] = [];
  for (let i = 0; i < count; i += 1) {
    const index = randomInt(rng, pool.length);
    picked.push(pool.splice(index, 1)[0]!);
  }
  return picked;
}

function playerId(index: number): string {
  return `P${index + 1}`;
}

/**
 * Build a full obtainable evidence set that pins each player's three gates
 * (positive for owned, negative for the other three) plus an artifact on the phantom.
 * This is the MVP “complete evidence” profile used to demand uniqueness.
 */
export function buildFullEvidence(
  roles: readonly PlayerRoleAssignment[],
  phantomPlayerId: string,
  nowMs = 0,
): EvidenceEvent[] {
  const events: EvidenceEvent[] = [];
  let seq = 0;
  const nextId = () => `ev_${seq++}`;

  for (const role of roles) {
    const gates = ROLE_GATE_TABLE[role.odorId];
    const owned = new Set<GateId>(gates);
    for (const gateId of gates) {
      events.push({
        id: nextId(),
        type: 'positiveChannel',
        playerId: role.playerId,
        gateId,
        source: 'channel_array',
        timeWindow: { startMs: nowMs, endMs: nowMs + 1_000 },
        reliability: 'hard',
      });
      events.push({
        id: nextId(),
        type: 'observedGateUse',
        playerId: role.playerId,
        gateId,
        source: 'witness',
        timeWindow: { startMs: nowMs, endMs: nowMs + 1_000 },
        reliability: 'hard',
      });
    }
    for (const gateId of ALL_GATE_IDS) {
      if (owned.has(gateId)) continue;
      events.push({
        id: nextId(),
        type: 'negativeChannel',
        playerId: role.playerId,
        gateId,
        source: 'channel_array',
        timeWindow: { startMs: nowMs, endMs: nowMs + 1_000 },
        reliability: 'hard',
      });
    }
    for (const task of MAP_V1.tasks) {
      if (!owned.has(task.requiredGateId)) continue;
      events.push({
        id: nextId(),
        type: 'taskPresence',
        playerId: role.playerId,
        taskId: task.id,
        requiredGateId: task.requiredGateId,
        source: 'task_system',
        timeWindow: { startMs: nowMs, endMs: nowMs + 1_000 },
        reliability: 'hard',
      });
    }
  }

  const phantom = roles.find((r) => r.playerId === phantomPlayerId)!;
  const illegal = ALL_GATE_IDS.find(
    (gateId) => !ROLE_GATE_TABLE[phantom.odorId].includes(gateId),
  )!;
  events.push({
    id: nextId(),
    type: 'artifactTrace',
    playerId: phantomPlayerId,
    gateId: illegal,
    x: 0,
    y: 0,
    source: 'artifact_sensor',
    timeWindow: { startMs: nowMs, endMs: nowMs + 8_000 },
    reliability: 'hard',
  });
  events.push({
    id: nextId(),
    type: 'doorLog',
    playerId: phantomPlayerId,
    doorId: MAP_V1.doors[0]?.id ?? 'door_east_bypass',
    opened: true,
    source: 'door_log',
    timeWindow: { startMs: nowMs, endMs: nowMs + 1_000 },
    reliability: 'soft',
  });

  return events;
}

function buildCaseFromAttempt(
  seed: string,
  contentVersion: string,
  playerCount: number,
  rng: () => number,
): OfflineCase {
  const odors = pickDistinctOdors(rng, playerCount);
  const phantomIndex = randomInt(rng, playerCount);
  const playerRoles: PlayerRoleAssignment[] = odors.map((odorId, index) => ({
    playerId: playerId(index),
    odorId,
    isPhantom: index === phantomIndex,
    spawnId: MAP_V1.spawns[index % MAP_V1.spawns.length]!.id,
  }));
  const phantomPlayerId = playerRoles[phantomIndex]!.playerId;
  const taskPlacement: TaskPlacement[] = MAP_V1.tasks.map((task) => ({
    taskId: task.id,
    enabled: true,
  }));
  const evidenceEvents = buildFullEvidence(playerRoles, phantomPlayerId);
  return {
    schemaVersion: LABYRINTH_CASE_SCHEMA_VERSION,
    seed,
    contentVersion,
    gameVersion: LABYRINTH_GAME_VERSION,
    mapVersion: LABYRINTH_MAP_VERSION,
    playerCount,
    playerRoles,
    npcRoles: [],
    phantomPlayerId,
    taskPlacement,
    evidenceEvents,
    truth: {
      phantomPlayerId,
      assignments: playerRoles.map((role) => ({
        playerId: role.playerId,
        odorId: role.odorId,
      })),
    },
  };
}

/**
 * Generate an offline official case. If the full evidence set is not uniquely
 * solvable, reject and retry with the same seed's RNG stream — never silently
 * pick among multiple solutions.
 */
export function generateOfficialCase(
  options: GenerateCaseOptions,
): GenerateCaseResult {
  const playerCount = options.playerCount ?? 4;
  if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
    return {
      ok: false,
      reason: 'invalid_player_count',
      seed: options.seed,
      attempts: 0,
    };
  }

  const maxAttempts = options.maxAttempts ?? 64;
  const rng = createRng(`labyrinth-case:${options.seed}`);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const offlineCase = buildCaseFromAttempt(
      options.seed,
      options.contentVersion,
      playerCount,
      rng,
    );
    const playerIds = offlineCase.playerRoles.map((r) => r.playerId);
    const solutionCount = countSolutions({
      playerIds,
      odorPool: defaultOdorPool(),
      evidence: offlineCase.evidenceEvents,
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
      evidence: offlineCase.evidenceEvents,
    });
    if (
      !solution ||
      solution.phantomPlayerId !== offlineCase.truth.phantomPlayerId
    ) {
      continue;
    }
    return { ok: true, case: offlineCase, attempts: attempt };
  }

  return {
    ok: false,
    reason: 'non_unique',
    seed: options.seed,
    attempts: maxAttempts,
  };
}

/** Reproduce rejection: same seed ⇒ same failure/success path. */
export function generateOfficialCaseOrThrow(options: GenerateCaseOptions): OfflineCase {
  const result = generateOfficialCase(options);
  if (!result.ok) {
    throw new Error(
      `Official case rejected for seed=${options.seed} reason=${result.reason} attempts=${result.attempts} solutions=${result.solutionCount ?? '?'}`,
    );
  }
  return result.case;
}
