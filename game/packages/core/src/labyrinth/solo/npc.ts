/**
 * Seeded NPC high-level plan execution. Movement uses nav + tryMove only —
 * no teleport, no reading undiscovered player evidence.
 */

import { MAP_V1 } from '../map/load';
import { getTileAt, tryMove } from '../movement';
import {
  activatePhaseShift,
  activateSignalJam,
  createPhantomAbilityState,
  isPhaseShiftActive,
  leavePhaseShiftArtifact,
  type PhantomAbilityState,
} from '../phantom';
import { ROLE_GATE_TABLE, type GateId, type LabyrinthOdorId } from '../role-gates';
import type { DoorState, EvidenceEvent, Vec2 } from '../types';
import type { NpcGoal, NpcPlan, SoloCase } from './case';
import { actorPerms, shortestPath } from './nav';

export type NpcRuntime = {
  id: string;
  odorId: LabyrinthOdorId;
  isPhantom: boolean;
  tile: Vec2;
  facing: number;
  plan: NpcPlan;
  goalIndex: number;
  path: Vec2[];
  pathIndex: number;
  phantom: PhantomAbilityState;
  stuckFrames: number;
  illegalGateUses: number;
};

export type NpcSimEvent =
  | { type: 'evidence'; evidence: EvidenceEvent }
  | { type: 'door_toggle'; doorId: string; open: boolean };

function tileForSpawn(spawnId: string): Vec2 {
  const spawn = MAP_V1.spawns.find((s) => s.id === spawnId) ?? MAP_V1.spawns[0]!;
  return { x: spawn.x, y: spawn.y };
}

function goalTargetTile(goal: NpcGoal, odorId: LabyrinthOdorId): Vec2 | null {
  switch (goal.kind) {
    case 'wander_central': {
      const central = MAP_V1.tiles.find(
        (t) => t.roomId === MAP_V1.centralRoomId && t.kind === 'floor',
      );
      return central ? { x: central.x, y: central.y } : { x: 10, y: 6 };
    }
    case 'do_task': {
      const task = MAP_V1.tasks.find((t) => t.id === goal.targetId);
      if (!task) return null;
      const tile = MAP_V1.tiles.find((t) => t.id === task.tileId);
      return tile ? { x: tile.x, y: tile.y } : null;
    }
    case 'visit_scanner': {
      const tile = MAP_V1.tiles.find((t) => t.id === MAP_V1.scannerTileId);
      return tile ? { x: tile.x, y: tile.y } : null;
    }
    case 'visit_review': {
      const tile = MAP_V1.tiles.find((t) => t.roomId === MAP_V1.reviewRoomId && t.kind === 'review');
      return tile ? { x: tile.x, y: tile.y } : null;
    }
    case 'phantom_illegal_gate': {
      const gate = MAP_V1.gates.find((g) => g.id === goal.targetId);
      if (!gate) return null;
      const tile = MAP_V1.tiles.find((t) => t.id === gate.tileId);
      // Approach from south of gate
      return tile ? { x: tile.x, y: tile.y + 1 } : null;
    }
    case 'phantom_jam':
    case 'phantom_sabotage_door':
      void odorId;
      return { x: 10, y: 6 };
    default:
      return null;
  }
}

export function createNpcRuntimes(solo: SoloCase): NpcRuntime[] {
  return solo.npcIds.map((id) => {
    const role = solo.playerRoles.find((r) => r.playerId === id)!;
    const plan = solo.plans.find((p) => p.npcId === id)!;
    return {
      id,
      odorId: role.odorId,
      isPhantom: role.isPhantom,
      tile: tileForSpawn(role.spawnId),
      facing: 0,
      plan,
      goalIndex: 0,
      path: [],
      pathIndex: 0,
      phantom: createPhantomAbilityState(),
      stuckFrames: 0,
      illegalGateUses: 0,
    };
  });
}

function currentGoal(npc: NpcRuntime, simMs: number): NpcGoal | null {
  const goals = npc.plan.goals;
  let active: NpcGoal | null = null;
  for (let i = 0; i < goals.length; i += 1) {
    const g = goals[i]!;
    if (simMs >= g.atMs && simMs < g.atMs + g.durationMs) {
      active = g;
      npc.goalIndex = i;
    }
  }
  return active;
}

function ensurePath(
  npc: NpcRuntime,
  goal: NpcGoal,
  doors: DoorState,
  simMs: number,
): void {
  const target = goalTargetTile(goal, npc.odorId);
  if (!target) {
    npc.path = [];
    return;
  }
  const needPhase =
    goal.kind === 'phantom_illegal_gate' && npc.isPhantom;
  if (needPhase && !isPhaseShiftActive(npc.phantom, simMs)) {
    const act = activatePhaseShift(npc.phantom, simMs);
    if (act.ok) npc.phantom = act.state;
  }
  const perms = actorPerms(
    npc.odorId,
    npc.isPhantom,
    isPhaseShiftActive(npc.phantom, simMs),
  );
  const path = shortestPath(MAP_V1, npc.tile, target, perms, doors);
  npc.path = path ?? [];
  npc.pathIndex = 0;
  if (!path) npc.stuckFrames += 1;
  else npc.stuckFrames = 0;
}

/**
 * Advance all NPCs by one discrete tile step (headless / low-rate AI tick).
 * Emits evidence events that match core schemas when phantom abilities fire.
 */
export function tickNpcs(
  npcs: NpcRuntime[],
  doors: Map<string, boolean>,
  simMs: number,
  evidenceSeq: { n: number },
): { npcs: NpcRuntime[]; doors: Map<string, boolean>; events: NpcSimEvent[] } {
  const events: NpcSimEvent[] = [];
  const nextNpcs: NpcRuntime[] = [];
  let nextDoors = doors;

  for (const raw of npcs) {
    const npc = { ...raw, phantom: { ...raw.phantom, artifacts: [...raw.phantom.artifacts] } };
    const goal = currentGoal(npc, simMs);

    if (goal?.kind === 'phantom_jam' && npc.isPhantom) {
      const jam = activateSignalJam(npc.phantom, simMs);
      if (jam.ok) npc.phantom = jam.state;
    }

    if (goal?.kind === 'phantom_sabotage_door' && npc.isPhantom && goal.targetId) {
      nextDoors = new Map(nextDoors);
      const open = nextDoors.get(goal.targetId) !== false;
      nextDoors.set(goal.targetId, !open);
      events.push({
        type: 'door_toggle',
        doorId: goal.targetId,
        open: !open,
      });
      events.push({
        type: 'evidence',
        evidence: {
          id: `sim_door_${evidenceSeq.n++}`,
          type: 'doorLog',
          playerId: npc.id,
          doorId: goal.targetId,
          opened: !open,
          source: 'door_log',
          timeWindow: { startMs: simMs, endMs: simMs + 1_000 },
          reliability: 'soft',
        },
      });
    }

    if (goal) {
      if (npc.path.length === 0 || npc.pathIndex >= npc.path.length - 1) {
        ensurePath(npc, goal, nextDoors, simMs);
      }
      if (npc.pathIndex < npc.path.length - 1) {
        const from = npc.tile;
        const to = npc.path[npc.pathIndex + 1]!;
        const perms = actorPerms(
          npc.odorId,
          npc.isPhantom,
          isPhaseShiftActive(npc.phantom, simMs),
        );
        const step = tryMove(MAP_V1, from, to, perms, nextDoors);
        if (step.ok) {
          npc.tile = to;
          npc.pathIndex += 1;
          npc.facing = Math.atan2(to.y - from.y, to.x - from.x);
          if (step.crossedGateId) {
            events.push({
              type: 'evidence',
              evidence: {
                id: `sim_gate_${evidenceSeq.n++}`,
                type: 'observedGateUse',
                playerId: npc.id,
                gateId: step.crossedGateId,
                source: 'witness',
                timeWindow: { startMs: simMs, endMs: simMs + 500 },
                reliability: 'hard',
              },
            });
            if (step.artifactRequired) {
              npc.phantom = leavePhaseShiftArtifact(npc.phantom, simMs, {
                gateId: step.crossedGateId,
                x: to.x,
                y: to.y,
              });
              npc.illegalGateUses += 1;
              events.push({
                type: 'evidence',
                evidence: {
                  id: `sim_art_${evidenceSeq.n++}`,
                  type: 'artifactTrace',
                  playerId: npc.id,
                  gateId: step.crossedGateId,
                  x: to.x,
                  y: to.y,
                  source: 'artifact_sensor',
                  timeWindow: {
                    startMs: simMs,
                    endMs: simMs + 8_000,
                  },
                  reliability: 'hard',
                },
              });
            }
          }
          const tile = getTileAt(MAP_V1, to.x, to.y);
          if (tile?.kind === 'task' && tile.taskId) {
            const required = MAP_V1.tasks.find((t) => t.id === tile.taskId)?.requiredGateId;
            if (required) {
              events.push({
                type: 'evidence',
                evidence: {
                  id: `sim_task_${evidenceSeq.n++}`,
                  type: 'taskPresence',
                  playerId: npc.id,
                  taskId: tile.taskId,
                  requiredGateId: required as GateId,
                  source: 'task_system',
                  timeWindow: { startMs: simMs, endMs: simMs + 500 },
                  reliability: 'hard',
                },
              });
            }
          }
        } else {
          npc.stuckFrames += 1;
          npc.path = [];
        }
      }
    }

    // Soft cap: if stuck too long, repath wander (still no teleport)
    if (npc.stuckFrames > 30) {
      npc.stuckFrames = 0;
      npc.path = [];
      ensurePath(
        npc,
        { kind: 'wander_central', atMs: simMs, durationMs: 10_000 },
        nextDoors,
        simMs,
      );
    }

    nextNpcs.push(npc);
  }

  return { npcs: nextNpcs, doors: nextDoors, events };
}

export function npcUsesOnlyLegalGatesWithoutPhase(npc: NpcRuntime): boolean {
  if (npc.isPhantom) return true;
  return npc.illegalGateUses === 0;
}

export function channelEvidenceForNpc(
  npc: NpcRuntime,
  simMs: number,
  seq: { n: number },
): EvidenceEvent[] {
  const owned = ROLE_GATE_TABLE[npc.odorId];
  const events: EvidenceEvent[] = [];
  for (const gateId of owned) {
    events.push({
      id: `sim_pos_${seq.n++}`,
      type: 'positiveChannel',
      playerId: npc.id,
      gateId,
      source: 'channel_array',
      timeWindow: { startMs: simMs, endMs: simMs + 1_000 },
      reliability: 'hard',
    });
  }
  return events;
}
