import { MIN_LEGAL_TASKS_REACHABLE } from '../constants';
import { defaultDoorState } from '../movement';
import { chebyshev } from '../movement';
import { ALL_GATE_IDS, LABYRINTH_ODOR_IDS, type LabyrinthOdorId } from '../role-gates';
import type { DoorState, LabyrinthMap, Vec2 } from '../types';
import {
  canReachRoom,
  legalTaskCountForRole,
} from './reachability';

export type MapValidationIssue = {
  code: string;
  message: string;
};

export type MapValidationResult = {
  ok: boolean;
  issues: MapValidationIssue[];
};

function issue(code: string, message: string): MapValidationIssue {
  return { code, message };
}

function hasStableIds(map: LabyrinthMap, issues: MapValidationIssue[]): void {
  const tileIds = new Set<string>();
  for (const tile of map.tiles) {
    if (!tile.id) issues.push(issue('tile_id', 'Tile missing id'));
    if (tileIds.has(tile.id)) issues.push(issue('tile_id', `Duplicate tile id ${tile.id}`));
    tileIds.add(tile.id);
  }
  const roomIds = new Set<string>();
  for (const room of map.rooms) {
    if (!room.id) issues.push(issue('room_id', 'Room missing id'));
    if (roomIds.has(room.id)) issues.push(issue('room_id', `Duplicate room id ${room.id}`));
    roomIds.add(room.id);
  }
  const gateIds = new Set<string>();
  for (const gate of map.gates) {
    if (!gate.id) issues.push(issue('gate_id', 'Gate missing id'));
    if (gateIds.has(gate.id)) issues.push(issue('gate_id', `Duplicate gate id ${gate.id}`));
    gateIds.add(gate.id);
  }
}

function assertGatesPresent(map: LabyrinthMap, issues: MapValidationIssue[]): void {
  const present = new Set(map.gates.map((g) => g.id));
  for (const id of ALL_GATE_IDS) {
    if (!present.has(id)) {
      issues.push(issue('gate_missing', `Gate ${id} does not appear on the map`));
    }
  }
  for (const gate of map.gates) {
    const tile = map.tiles.find((t) => t.id === gate.tileId);
    if (!tile || tile.kind !== 'gate' || tile.gateId !== gate.id) {
      issues.push(issue('gate_tile', `Gate ${gate.id} tile mismatch`));
    }
  }
}

function assertSpawnVision(map: LabyrinthMap, issues: MapValidationIssue[]): void {
  for (let i = 0; i < map.spawns.length; i += 1) {
    for (let j = i + 1; j < map.spawns.length; j += 1) {
      const a = map.spawns[i]!;
      const b = map.spawns[j]!;
      const dist = chebyshev({ x: a.x, y: a.y }, { x: b.x, y: b.y });
      if (dist <= map.visionRadius) {
        issues.push(
          issue(
            'spawn_vision',
            `Spawns ${a.id} and ${b.id} are within visionRadius (${dist} ≤ ${map.visionRadius})`,
          ),
        );
      }
    }
  }
}

function originForSpawn(map: LabyrinthMap, spawnId?: string): Vec2 {
  const spawn = spawnId
    ? map.spawns.find((s) => s.id === spawnId)
    : map.spawns[0];
  if (!spawn) throw new Error('Map has no spawns');
  return { x: spawn.x, y: spawn.y };
}

function assertRoleReachability(
  map: LabyrinthMap,
  doors: DoorState,
  issues: MapValidationIssue[],
): void {
  for (const odorId of LABYRINTH_ODOR_IDS) {
    for (const spawn of map.spawns) {
      const origin = { x: spawn.x, y: spawn.y };
      if (!canReachRoom(map, origin, map.centralRoomId, { odorId, doors })) {
        issues.push(
          issue(
            'reach_central',
            `Role ${odorId} from ${spawn.id} cannot reach central`,
          ),
        );
      }
      if (!canReachRoom(map, origin, map.reviewRoomId, { odorId, doors })) {
        issues.push(
          issue(
            'reach_review',
            `Role ${odorId} from ${spawn.id} cannot reach review room`,
          ),
        );
      }
      const legalTasks = legalTaskCountForRole(map, origin, odorId, doors);
      if (legalTasks < MIN_LEGAL_TASKS_REACHABLE) {
        issues.push(
          issue(
            'reach_tasks',
            `Role ${odorId} from ${spawn.id} reaches only ${legalTasks} legal tasks (need ≥ ${MIN_LEGAL_TASKS_REACHABLE})`,
          ),
        );
      }
    }
  }
}

/**
 * For every subset of door open/closed states, ensure no spawn is soft-locked
 * from central (players must not be permanently trapped).
 */
function assertNoPermanentDoorTrap(
  map: LabyrinthMap,
  issues: MapValidationIssue[],
): void {
  const doorIds = map.doors.map((d) => d.id);
  const combinations = 1 << doorIds.length;
  for (let mask = 0; mask < combinations; mask += 1) {
    const doors = new Map<string, boolean>();
    doorIds.forEach((id, index) => {
      doors.set(id, (mask & (1 << index)) !== 0);
    });
    for (const spawn of map.spawns) {
      const origin = { x: spawn.x, y: spawn.y };
      // Use banana as a generic walker for corridor reach (central has no gate).
      const odorId: LabyrinthOdorId = 'banana';
      if (!canReachRoom(map, origin, map.centralRoomId, { odorId, doors })) {
        issues.push(
          issue(
            'door_trap',
            `Door mask ${mask} traps ${spawn.id} from central`,
          ),
        );
        return;
      }
      if (!canReachRoom(map, origin, map.reviewRoomId, { odorId, doors })) {
        issues.push(
          issue(
            'door_trap',
            `Door mask ${mask} traps ${spawn.id} from review`,
          ),
        );
        return;
      }
    }
  }
}

function assertCollisionConsistency(
  map: LabyrinthMap,
  issues: MapValidationIssue[],
): void {
  for (const tile of map.tiles) {
    const idx = tile.y * map.width + tile.x;
    const blocked = map.collision[idx] === true;
    const shouldBlock = tile.kind === 'wall';
    if (blocked !== shouldBlock) {
      issues.push(
        issue(
          'collision',
          `Collision mismatch at ${tile.id}: collision=${blocked} kind=${tile.kind}`,
        ),
      );
    }
  }
}

function assertRoomCount(map: LabyrinthMap, issues: MapValidationIssue[]): void {
  if (map.rooms.length < 10) {
    issues.push(
      issue('rooms', `Expected ~10+ rooms, found ${map.rooms.length}`),
    );
  }
  if (!map.rooms.some((r) => r.kind === 'corridor')) {
    issues.push(issue('rooms', 'Missing neutral corridor room'));
  }
}

export function validateMap(map: LabyrinthMap): MapValidationResult {
  const issues: MapValidationIssue[] = [];
  hasStableIds(map, issues);
  assertGatesPresent(map, issues);
  assertSpawnVision(map, issues);
  assertCollisionConsistency(map, issues);
  assertRoomCount(map, issues);
  assertRoleReachability(map, defaultDoorState(map), issues);
  assertNoPermanentDoorTrap(map, issues);

  // Ensure every spawn origin helper works
  try {
    originForSpawn(map);
  } catch (error) {
    issues.push(issue('spawn', (error as Error).message));
  }

  return { ok: issues.length === 0, issues };
}
