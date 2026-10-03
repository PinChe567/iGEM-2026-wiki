import { tryMove, neighbors4, defaultDoorState } from '../movement';
import { authorizedGates, type GateId, type LabyrinthOdorId } from '../role-gates';
import type {
  ActorPermissions,
  DoorState,
  LabyrinthMap,
  Vec2,
} from '../types';

export type ReachabilityOptions = {
  odorId: LabyrinthOdorId;
  /** When true, treat phaseShift as always available (analysis only). */
  allowPhaseShift?: boolean;
  doors?: DoorState;
};

export type ReachSet = {
  reachable: Set<string>;
  byKey: Map<string, Vec2>;
};

function key(pos: Vec2): string {
  return `${pos.x},${pos.y}`;
}

function actorFor(opts: ReachabilityOptions): ActorPermissions {
  return {
    odorId: opts.odorId,
    authorizedGates: authorizedGates(opts.odorId),
    isPhantom: Boolean(opts.allowPhaseShift),
    phaseShiftActive: Boolean(opts.allowPhaseShift),
  };
}

/** BFS over legal moves for a given odor identity (and optional phantom bypass). */
export function computeReachability(
  map: LabyrinthMap,
  origin: Vec2,
  opts: ReachabilityOptions,
): ReachSet {
  const doors = opts.doors ?? defaultDoorState(map);
  const actor = actorFor(opts);
  const reachable = new Set<string>();
  const byKey = new Map<string, Vec2>();
  const queue: Vec2[] = [origin];
  reachable.add(key(origin));
  byKey.set(key(origin), origin);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const next of neighbors4(map, cur)) {
      const k = key(next);
      if (reachable.has(k)) continue;
      const result = tryMove(map, cur, next, actor, doors);
      if (!result.ok) continue;
      reachable.add(k);
      byKey.set(k, next);
      queue.push(next);
    }
  }

  return { reachable, byKey };
}

export function canReachTile(
  map: LabyrinthMap,
  origin: Vec2,
  target: Vec2,
  opts: ReachabilityOptions,
): boolean {
  return computeReachability(map, origin, opts).reachable.has(key(target));
}

export function canReachRoom(
  map: LabyrinthMap,
  origin: Vec2,
  roomId: string,
  opts: ReachabilityOptions,
): boolean {
  const reach = computeReachability(map, origin, opts);
  return map.tiles.some(
    (tile) => tile.roomId === roomId && reach.reachable.has(key(tile)),
  );
}

export function reachableTasks(
  map: LabyrinthMap,
  origin: Vec2,
  opts: ReachabilityOptions,
): string[] {
  const reach = computeReachability(map, origin, opts);
  return map.tasks
    .filter((task) => {
      const tile = map.tiles.find((t) => t.id === task.tileId);
      return tile ? reach.reachable.has(key(tile)) : false;
    })
    .map((task) => task.id);
}

export function legalTaskCountForRole(
  map: LabyrinthMap,
  origin: Vec2,
  odorId: LabyrinthOdorId,
  doors?: DoorState,
): number {
  const gates = authorizedGates(odorId);
  return reachableTasks(map, origin, { odorId, doors }).filter((taskId) => {
    const task = map.tasks.find((t) => t.id === taskId);
    return task ? gates.has(task.requiredGateId) : false;
  }).length;
}

/** Gates this identity can enter without phaseShift. */
export function authorizedGateIds(odorId: LabyrinthOdorId): GateId[] {
  return [...authorizedGates(odorId)];
}
