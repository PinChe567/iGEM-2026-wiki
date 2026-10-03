import {
  ATTACK_ARC_DEG,
  ATTACK_COOLDOWN_MS,
  ATTACK_RANGE,
  CONTACT_DAMAGE,
  ENEMY_RADIUS,
  PLAYER_ATTACK_DAMAGE,
  PLAYER_INVULN_MS,
  PLAYER_RADIUS,
  SPAWN_GRACE_MS,
} from './constants';
import { applyLoot } from './inventory';
import { tileCenterOf } from './map';
import { grantModule } from './progression';
import type { AdventureEnemyState, AdventureLoot, AdventureSession, WorldPos } from './types';

export function emptyFeedback(): AdventureSession['lastFeedback'] {
  return {
    hitEnemyIds: [],
    playerDamaged: false,
    respawned: false,
    learnedOdorId: null,
    openedId: null,
    unlockedPassageId: null,
    sealId: null,
    message: null,
  };
}

export function canPlayerBeDamaged(session: AdventureSession, atMs = session.elapsedMs): boolean {
  return atMs >= session.player.invulnerableUntilMs;
}

function hypot(a: WorldPos, b: WorldPos): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleDelta(a: number, b: number): number {
  let d = Math.abs(a - b) % (Math.PI * 2);
  if (d > Math.PI) d = Math.PI * 2 - d;
  return d;
}

export function enemyHurtboxes(enemy: AdventureEnemyState): WorldPos[] {
  if (enemy.kind === 'noiseBloom') {
    return enemy.coreTiles.map((tile) => tileCenterOf(tile));
  }
  return [enemy.position];
}

export function nearTrueCore(player: WorldPos, enemy: AdventureEnemyState, range: number): boolean {
  const core = enemy.coreTiles[enemy.trueCoreIndex] ?? enemy.coreTiles[0];
  if (!core) return hypot(player, enemy.position) <= range;
  return hypot(player, tileCenterOf(core)) <= range;
}

export function nearAnyCore(player: WorldPos, enemy: AdventureEnemyState, range: number): boolean {
  if (enemy.coreTiles.length === 0) return hypot(player, enemy.position) <= range;
  return enemy.coreTiles.some((tile) => hypot(player, tileCenterOf(tile)) <= range);
}

export function inMeleeRange(
  session: AdventureSession,
  enemy: AdventureEnemyState,
  omni: boolean,
): boolean {
  if (enemy.defeated) return false;
  if (enemy.kind === 'noiseBloom') {
    const closeEnough = omni
      ? nearAnyCore(session.player.position, enemy, ATTACK_RANGE)
      : nearTrueCore(session.player.position, enemy, ATTACK_RANGE);
    if (!closeEnough) return false;
    if (omni) return true;
    const core = enemy.coreTiles[enemy.trueCoreIndex]!;
    const aim = Math.atan2(
      tileCenterOf(core).y - session.player.position.y,
      tileCenterOf(core).x - session.player.position.x,
    );
    return angleDelta(session.player.facing, aim) <= ((ATTACK_ARC_DEG / 2) * Math.PI) / 180;
  }
  const dist = hypot(session.player.position, enemy.position);
  if (dist > ATTACK_RANGE) return false;
  if (omni) return true;
  const aim = Math.atan2(
    enemy.position.y - session.player.position.y,
    enemy.position.x - session.player.position.x,
  );
  return angleDelta(session.player.facing, aim) <= ((ATTACK_ARC_DEG / 2) * Math.PI) / 180;
}

const NORMAL_DROPS: Record<AdventureEnemyState['kind'], AdventureLoot> = {
  sporeling: { resources: { scanCharge: 1 } },
  vineCrawler: { resources: { repairScrap: 1 } },
  noiseWisp: { resources: { scanCharge: 1 } },
  mimicSpore: { resources: { keys: 1, health: 1 } },
  noiseBloom: { moduleId: 'signal-filter', resources: { scanCharge: 1 } },
};

export function defeatEnemy(session: AdventureSession, enemyId: string): AdventureSession {
  const enemy = session.enemies.find((e) => e.id === enemyId);
  if (!enemy || enemy.defeated) return session;
  const loot = NORMAL_DROPS[enemy.kind];
  const applied = applyLoot(
    session.player.inventory,
    session.player.health,
    session.player.maxHealth,
    loot,
  );
  let collected = session.player.collectedModules;
  if (loot.moduleId) collected = grantModule(collected, loot.moduleId);
  return {
    ...session,
    enemies: session.enemies.map((e) =>
      e.id === enemyId ? { ...e, defeated: true, health: 0, aggro: false, disguised: false } : e,
    ),
    player: {
      ...session.player,
      inventory: applied.inventory,
      health: applied.health,
      collectedModules: collected,
      defeatedEnemyIds: session.player.defeatedEnemyIds.includes(enemyId)
        ? session.player.defeatedEnemyIds
        : [...session.player.defeatedEnemyIds, enemyId],
    },
  };
}

export function applyMeleeAttack(session: AdventureSession, omni: boolean): AdventureSession {
  if (session.elapsedMs < session.player.attackCooldownUntilMs) return session;
  let next: AdventureSession = {
    ...session,
    player: {
      ...session.player,
      attackCooldownUntilMs: session.elapsedMs + ATTACK_COOLDOWN_MS,
    },
    lastFeedback: { ...emptyFeedback() },
  };
  const hitEnemyIds: string[] = [];
  for (const enemy of next.enemies) {
    if (!inMeleeRange(next, enemy, omni)) continue;
    hitEnemyIds.push(enemy.id);
    const woken: AdventureEnemyState = {
      ...enemy,
      aggro: true,
      revealed: true,
      disguised: false,
      health: enemy.health - PLAYER_ATTACK_DAMAGE,
    };
    next = {
      ...next,
      enemies: next.enemies.map((e) => (e.id === enemy.id ? woken : e)),
    };
    if (woken.health <= 0) {
      next = defeatEnemy(next, enemy.id);
    }
  }
  let message: string | null = hitEnemyIds.length > 0 ? 'hit' : null;
  if (!message) {
    const bloom = next.enemies.find((enemy) => enemy.kind === 'noiseBloom' && !enemy.defeated);
    if (
      bloom &&
      nearAnyCore(session.player.position, bloom, ATTACK_RANGE) &&
      !nearTrueCore(session.player.position, bloom, ATTACK_RANGE)
    ) {
      message = 'bloom-wrong-core';
    }
  }
  return {
    ...next,
    lastFeedback: {
      ...next.lastFeedback,
      hitEnemyIds,
      message,
    },
  };
}

export function checkpointTile(session: AdventureSession): WorldPos {
  const found = session.interactables.find((item) => item.id === session.player.currentCheckpointId);
  const tile = found?.tile ?? session.map.spawn;
  return tileCenterOf(tile);
}

export function respawnAtCheckpoint(session: AdventureSession): AdventureSession {
  const pos = checkpointTile(session);
  return {
    ...session,
    player: {
      ...session.player,
      health: session.player.maxHealth,
      position: { ...pos },
      prevPosition: { ...pos },
      invulnerableUntilMs: session.elapsedMs + PLAYER_INVULN_MS,
    },
    lastFeedback: {
      ...session.lastFeedback,
      respawned: true,
      playerDamaged: true,
    },
  };
}

export function applyPlayerHit(
  session: AdventureSession,
  amount: number = CONTACT_DAMAGE,
): AdventureSession {
  if (!canPlayerBeDamaged(session)) {
    return session;
  }
  const health = Math.max(0, session.player.health - amount);
  let next: AdventureSession = {
    ...session,
    player: {
      ...session.player,
      health,
      invulnerableUntilMs: session.elapsedMs + PLAYER_INVULN_MS,
    },
    lastFeedback: {
      ...emptyFeedback(),
      playerDamaged: true,
    },
  };
  if (health <= 0) {
    next = respawnAtCheckpoint(next);
  }
  return next;
}

export function applyContactDamage(session: AdventureSession): AdventureSession {
  if (session.elapsedMs < SPAWN_GRACE_MS) return session;
  if (!canPlayerBeDamaged(session)) return session;
  const range = PLAYER_RADIUS + ENEMY_RADIUS;
  for (const enemy of session.enemies) {
    if (enemy.defeated) continue;
    if (enemy.kind === 'mimicSpore' && enemy.disguised) continue;
    if (enemy.kind === 'vineCrawler' && !enemy.aggro && !enemy.revealed) continue;
    const hit =
      enemy.kind === 'noiseBloom'
        ? nearTrueCore(session.player.position, enemy, range)
        : enemyHurtboxes(enemy).some((pos) => hypot(session.player.position, pos) <= range);
    if (hit) {
      return applyPlayerHit(session);
    }
  }
  return session;
}
