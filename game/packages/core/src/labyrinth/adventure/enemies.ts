import { tryContinuousMove } from '../exploration';
import { createRng, randomInt } from '../../rng';
import {
  ADVENTURE_PRESETS,
  ENEMY_STATS,
  SCAN_REVEAL_RANGE,
  SPAWN_GRACE_MS,
  VINE_WAKE_RANGE,
  enemyHealthFor,
} from './constants';
import { ADVENTURE_MOVE_ACTOR, adventureToLabyrinthMap, tileCenterOf } from './map';
import type {
  AdventureDifficulty,
  AdventureEnemyState,
  AdventureMap,
  AdventureSession,
  Vec2,
  WorldPos,
} from './types';

function walkable(map: AdventureMap, tile: Vec2): boolean {
  if (tile.x < 0 || tile.y < 0 || tile.x >= map.width || tile.y >= map.height) return false;
  return map.collision[tile.y * map.width + tile.x] !== true;
}

function pickFalseMarkers(map: AdventureMap, origin: Vec2, seed: string, count = 3): Vec2[] {
  const rng = createRng(seed);
  const candidates: Vec2[] = [];
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const tile = { x: origin.x + dx, y: origin.y + dy };
      if (walkable(map, tile)) candidates.push(tile);
    }
  }
  const out: Vec2[] = [];
  const pool = [...candidates];
  while (out.length < count && pool.length > 0) {
    const idx = randomInt(rng, pool.length);
    const picked = pool.splice(idx, 1)[0];
    if (picked) out.push(picked);
  }
  return out;
}

export function spawnEnemies(
  map: AdventureMap,
  seed: string,
  difficulty: AdventureDifficulty = 'standard',
): AdventureEnemyState[] {
  const bossRng = createRng(`${seed}:boss`);
  const extra = ADVENTURE_PRESETS[difficulty].extraNoise;
  return map.enemies.map((spawn) => {
    const hp = enemyHealthFor(spawn.kind, difficulty);
    const coreTiles = spawn.coreTiles ?? [spawn.tile];
    const trueCoreIndex =
      spawn.kind === 'noiseBloom' ? randomInt(bossRng, coreTiles.length) : 0;
    const home = spawn.kind === 'noiseBloom' ? (coreTiles[trueCoreIndex] ?? spawn.tile) : spawn.tile;
    const position = tileCenterOf(home);
    return {
      id: spawn.id,
      kind: spawn.kind,
      position,
      health: hp,
      maxHealth: hp,
      facing: 0,
      aggro: spawn.kind === 'noiseBloom',
      revealed: false,
      disguised: spawn.kind === 'mimicSpore',
      defeated: false,
      trueCoreIndex,
      coreTiles,
      phase: 1,
      falseMarkerTiles:
        spawn.kind === 'noiseWisp'
          ? pickFalseMarkers(map, spawn.tile, `${seed}:${spawn.id}`, extra ? 6 : 3)
          : [],
    };
  });
}

function dist(a: WorldPos, b: WorldPos): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function maybeWake(enemy: AdventureEnemyState, session: AdventureSession): AdventureEnemyState {
  if (enemy.defeated) return enemy;
  const spawnSafe = session.elapsedMs < SPAWN_GRACE_MS;
  const d = dist(enemy.position, session.player.position);
  const scanning = session.player.scan.active;
  let aggro = enemy.aggro;
  let revealed = enemy.revealed;
  let disguised = enemy.disguised;

  if (enemy.kind === 'vineCrawler') {
    if (scanning && d <= SCAN_REVEAL_RANGE) {
      aggro = true;
      revealed = true;
    } else if (!spawnSafe && d <= VINE_WAKE_RANGE) {
      aggro = true;
      revealed = true;
    }
  } else if (enemy.kind === 'mimicSpore') {
    if (scanning && d <= SCAN_REVEAL_RANGE) {
      revealed = true;
      disguised = false;
    }
  } else if (enemy.kind === 'noiseWisp') {
    if (!spawnSafe && d <= ENEMY_STATS.noiseWisp.aggroRange) aggro = true;
    if (scanning && d <= SCAN_REVEAL_RANGE) revealed = true;
  } else if (enemy.kind === 'sporeling') {
    if (!spawnSafe && d <= ENEMY_STATS.sporeling.aggroRange) aggro = true;
  } else if (enemy.kind === 'noiseBloom') {
    if (scanning) revealed = true;
  }

  let phase = enemy.phase;
  let trueCoreIndex = enemy.trueCoreIndex;
  let position = enemy.position;
  if (enemy.kind === 'noiseBloom' && enemy.phase === 1 && enemy.health <= enemy.maxHealth / 2) {
    phase = 2;
    trueCoreIndex = (enemy.trueCoreIndex + 1) % Math.max(1, enemy.coreTiles.length);
    position = tileCenterOf(enemy.coreTiles[trueCoreIndex]!);
  }

  return { ...enemy, aggro, revealed, disguised, phase, trueCoreIndex, position };
}

export function tickEnemies(session: AdventureSession, dtSec: number): AdventureSession {
  const geo = adventureToLabyrinthMap(session.map, session.unlockedPassageIds);
  const doors = new Map(geo.doors.map((door) => [door.id, session.openDoorIds.includes(door.id)]));
  const playerPos = session.player.position;

  const enemies = session.enemies.map((raw) => {
    const enemy = maybeWake(raw, session);
    if (enemy.defeated) return enemy;
    if (enemy.kind === 'mimicSpore' && enemy.disguised) return enemy;
    if (enemy.kind === 'vineCrawler' && !enemy.aggro) return enemy;

    const stats = ENEMY_STATS[enemy.kind];
    const speed =
      (enemy.kind === 'noiseBloom' && enemy.phase === 2 ? stats.speed * 1.25 : stats.speed) *
      ADVENTURE_PRESETS[session.difficulty].enemySpeedMul;
    const target =
      enemy.kind === 'noiseBloom'
        ? tileCenterOf(enemy.coreTiles[enemy.trueCoreIndex] ?? enemy.coreTiles[0]!)
        : playerPos;
    if (enemy.kind === 'noiseBloom') {
      return { ...enemy, position: { ...target } };
    }
    if (!enemy.aggro) return enemy;

    const dx = target.x - enemy.position.x;
    const dy = target.y - enemy.position.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.08) return enemy;
    const delta = { x: (dx / len) * speed * dtSec, y: (dy / len) * speed * dtSec };
    const moved = tryContinuousMove(geo, enemy.position, delta, ADVENTURE_MOVE_ACTOR, doors);
    return {
      ...enemy,
      position: moved.position,
      facing: Math.atan2(dy, dx),
    };
  });

  return { ...session, enemies };
}

export function spawnAlarmSporeling(session: AdventureSession, near: Vec2): AdventureSession {
  const hp = enemyHealthFor('sporeling', session.difficulty);
  const candidates = [
    { x: near.x + 1, y: near.y },
    { x: near.x - 1, y: near.y },
    { x: near.x, y: near.y + 1 },
    { x: near.x, y: near.y - 1 },
  ];
  const tile = candidates.find((t) => walkable(session.map, t)) ?? near;
  const id = `alarm-spore-${Math.floor(session.elapsedMs)}`;
  if (session.enemies.some((e) => e.id === id && !e.defeated)) return session;
  return {
    ...session,
    enemies: [
      ...session.enemies,
      {
        id,
        kind: 'sporeling',
        position: tileCenterOf(tile),
        health: hp,
        maxHealth: hp,
        facing: 0,
        aggro: true,
        revealed: true,
        disguised: false,
        defeated: false,
        trueCoreIndex: 0,
        coreTiles: [tile],
        phase: 1,
        falseMarkerTiles: [],
      },
    ],
  };
}

export function revealMimic(session: AdventureSession, enemyId: string): AdventureSession {
  return {
    ...session,
    enemies: session.enemies.map((e) =>
      e.id === enemyId ? { ...e, disguised: false, revealed: true, aggro: true } : e,
    ),
  };
}
