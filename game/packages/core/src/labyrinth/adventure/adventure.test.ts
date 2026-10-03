import { describe, expect, it } from 'vitest';
import {
  ADVENTURE_MODULE_IDS,
  ADVENTURE_MOVE_ACTOR,
  ADVENTURE_TITLE_EN,
  ADVENTURE_TITLE_ZH,
  adventureToLabyrinthMap,
  applyMeleeAttack,
  applyPlayerHit,
  canUseExit,
  createAdventureSession,
  currentObjective,
  emptyAdventureIntent,
  ePromptHasAction,
  findInteractionTarget,
  getInteractionAffordance,
  interactAdventure,
  MAP_ADVENTURE_V1,
  ADVENTURE_OFFICIAL_MAPS,
  pickAdventureMap,
  requirementsMet,
  requiredOdorIds,
  scentHasGameplayUse,
  shortestAdventurePath,
  setActiveScentProfile,
  simulateOfficialProgress,
  skillCheckSpec,
  patternMemoryLength,
  solveAdventurePuzzle,
  tickAdventure,
  visibleScentMarkers,
  SPAWN_GRACE_MS,
} from './index';
import { computeReachability } from '../map/reachability';
import type { AdventureDifficulty, AdventureModuleId, AdventureSession } from './types';

function at(session: AdventureSession, x: number, y: number): AdventureSession {
  const pos = { x: x + 0.5, y: y + 0.5 };
  return {
    ...session,
    player: {
      ...session.player,
      position: pos,
      prevPosition: pos,
    },
  };
}

function goTo(session: AdventureSession, tile: { x: number; y: number }): AdventureSession {
  return at(session, tile.x, tile.y);
}

function withModules(session: AdventureSession, modules: AdventureModuleId[]): AdventureSession {
  return {
    ...session,
    player: { ...session.player, collectedModules: [...modules] },
  };
}

function withOdors(session: AdventureSession, odorIds: string[]): AdventureSession {
  return {
    ...session,
    player: {
      ...session.player,
      learnedOdorIds: [...odorIds],
      activeScentProfileId: odorIds[0] ?? null,
    },
  };
}

function press(
  session: AdventureSession,
  intent: Partial<ReturnType<typeof emptyAdventureIntent>>,
  dtMs = 16,
): AdventureSession {
  return tickAdventure(session, { ...emptyAdventureIntent(), ...intent }, dtMs);
}

function itemOf(session: AdventureSession, kind: string, extra?: (id: string) => boolean) {
  return session.interactables.find((item) => item.kind === kind && (extra ? extra(item.id) : true))!;
}

describe('AeroSense: Scentbound Labyrinth', () => {
  it('names the new adventure mode without replacing QC Shift', () => {
    expect(ADVENTURE_TITLE_EN).toBe('AeroSense: Scentbound Labyrinth');
    expect(ADVENTURE_TITLE_ZH).toBe('AeroSense：氣味迷宮');
  });

  it('uses a 32×18 maze with the exit far from spawn', () => {
    expect(MAP_ADVENTURE_V1.width).toBe(32);
    expect(MAP_ADVENTURE_V1.height).toBe(18);
    expect(MAP_ADVENTURE_V1.interactables.some((i) => i.kind === 'exit')).toBe(true);
    expect(MAP_ADVENTURE_V1.interactables.filter((i) => i.kind === 'exitSeal')).toHaveLength(0);
    expect(MAP_ADVENTURE_V1.enemies.some((e) => e.kind === 'noiseBloom')).toBe(false);
    const spawn = MAP_ADVENTURE_V1.spawn;
    const exit = MAP_ADVENTURE_V1.exitTile;
    expect(Math.abs(spawn.x - exit.x) + Math.abs(spawn.y - exit.y)).toBeGreaterThanOrEqual(16);
    expect(MAP_ADVENTURE_V1.interactables.some((i) => i.loot?.moduleId === 'receptor-cartridge')).toBe(true);
    expect(MAP_ADVENTURE_V1.interactables.some((i) => i.loot?.moduleId === 'optical-reader')).toBe(true);
    expect(MAP_ADVENTURE_V1.interactables.some((i) => i.loot?.moduleId === 'signal-filter')).toBe(true);
    const floors = MAP_ADVENTURE_V1.collision.filter((blocked) => !blocked).length;
    const walls = MAP_ADVENTURE_V1.collision.filter((blocked) => blocked).length;
    expect(walls).toBeGreaterThan(floors);
  });

  it('damages enemies with a simple melee attack', () => {
    let session = createAdventureSession({ seed: 'combat', difficulty: 'junior' });
    const enemy = session.enemies.find((e) => e.kind === 'sporeling')!;
    const hp = enemy.health;
    session = at(session, enemy.position.x - 0.5, enemy.position.y - 0.5);
    session = applyMeleeAttack(session, true);
    const hit = session.enemies.find((e) => e.id === enemy.id)!;
    expect(hit.health).toBe(hp - 1);
    expect(session.lastFeedback.hitEnemyIds).toContain(enemy.id);
  });

  it('does not contact-damage during spawn grace even if an enemy overlaps the player', () => {
    let session = createAdventureSession({ seed: 'grace', difficulty: 'junior' });
    const spore = session.enemies.find((e) => e.kind === 'sporeling')!;
    const max = session.player.maxHealth;
    session = {
      ...session,
      enemies: session.enemies.map((e) =>
        e.id === spore.id ? { ...e, position: { ...session.player.position } } : e,
      ),
    };
    session = press(session, {}, 16);
    expect(session.elapsedMs).toBeLessThan(SPAWN_GRACE_MS);
    expect(session.player.health).toBe(max);
    expect(session.enemies.find((e) => e.id === spore.id)?.aggro).toBe(false);
  });

  it('applies player damage and ignores hits during invulnerability', () => {
    let session = createAdventureSession({ seed: 'hurt', difficulty: 'junior' });
    const max = session.player.maxHealth;
    session = applyPlayerHit(session);
    expect(session.player.health).toBe(max - 1);
    expect(session.lastFeedback.playerDamaged).toBe(true);
    session = applyPlayerHit(session);
    expect(session.player.health).toBe(max - 1);
    session = { ...session, elapsedMs: session.player.invulnerableUntilMs };
    session = applyPlayerHit(session);
    expect(session.player.health).toBe(max - 2);
  });

  it('respawns at the current checkpoint and keeps learned scents/modules', () => {
    let session = createAdventureSession({ seed: 'respawn', difficulty: 'junior' });
    const cp = session.interactables.find((i) => i.kind === 'checkpoint')!;
    session = {
      ...withModules(withOdors(session, ['coffee']), ['receptor-cartridge']),
      player: {
        ...session.player,
        learnedOdorIds: ['coffee'],
        collectedModules: ['receptor-cartridge'],
        currentCheckpointId: cp.id,
        health: 1,
      },
    };
    session = applyPlayerHit(session, 99);
    expect(session.lastFeedback.respawned).toBe(true);
    expect(session.player.health).toBe(session.player.maxHealth);
    expect(session.player.position).toEqual({ x: cp.tile.x + 0.5, y: cp.tile.y + 0.5 });
    expect(session.player.learnedOdorIds).toEqual(['coffee']);
    expect(session.player.collectedModules).toEqual(['receptor-cartridge']);
  });

  it('opens a chest only once', () => {
    let session = createAdventureSession({ seed: 'chest', difficulty: 'junior' });
    const chest = session.interactables.find((i) => i.loot?.moduleId === 'receptor-cartridge')!;
    session = goTo(session, chest.tile);
    session = interactAdventure(session);
    expect(session.player.collectedModules).toEqual(['receptor-cartridge']);
    expect(session.player.openedChestIds).toHaveLength(1);
    session = interactAdventure(session);
    expect(session.player.collectedModules).toEqual(['receptor-cartridge']);
    expect(session.player.openedChestIds).toHaveLength(1);
    expect(session.lastFeedback.message).toBe('already-open');
  });

  it('learns an illustrative odor after the receptor cartridge is equipped', () => {
    let session = createAdventureSession({ seed: 'odor', difficulty: 'junior' });
    const coffee = session.interactables.find((i) => i.kind === 'odorSample' && i.odorId === 'coffee')!;
    session = goTo(session, coffee.tile);
    session = interactAdventure(session);
    expect(session.player.learnedOdorIds).toEqual([]);
    session = withModules(session, ['receptor-cartridge']);
    session = interactAdventure(session);
    expect(session.player.learnedOdorIds).toEqual(['coffee']);
    expect(session.player.activeScentProfileId).toBe('coffee');
    session = interactAdventure(session);
    expect(session.player.learnedOdorIds).toEqual(['coffee']);
  });

  it('reveals a vine crawler with AeroSense Scan before it wakes', () => {
    let session = createAdventureSession({ seed: 'scan', difficulty: 'junior' });
    const vine = session.enemies.find((e) => e.kind === 'vineCrawler')!;
    session = at(session, vine.position.x - 0.5, vine.position.y - 0.5 + 4);
    session = press(session, {}, 16);
    expect(session.enemies.find((e) => e.id === vine.id)?.revealed).toBe(false);
    session = press(session, { scanPressed: true }, 16);
    const after = session.enemies.find((e) => e.id === vine.id)!;
    expect(after.revealed).toBe(true);
    expect(after.aggro).toBe(true);
  });

  it('requires the matching banana profile to unlock the hidden passage', () => {
    const hidden = itemOf(createAdventureSession({ seed: 'secret', difficulty: 'junior' }), 'hiddenPassage');
    let session = goTo(createAdventureSession({ seed: 'secret', difficulty: 'junior' }), {
      x: hidden.tile.x - 1,
      y: hidden.tile.y,
    });
    session = withOdors(withModules(session, ['receptor-cartridge']), ['banana']);
    session = interactAdventure(session);
    expect(session.unlockedPassageIds).not.toContain(hidden.id);
    session = press(session, { scanPressed: true }, 16);
    expect(session.unlockedPassageIds).toContain(hidden.id);
    expect(session.player.discoveredSecretIds).toContain('banana-vent');
  });

  it('opens scanned secret doors into rooms instead of one-tile alcoves', () => {
    for (const map of ADVENTURE_OFFICIAL_MAPS) {
      const session = createAdventureSession({ seed: 'rooms', difficulty: 'junior', map });
      const doors = [
        itemOf(session, 'hiddenPassage'),
        itemOf(session, 'hiddenChest'),
        session.interactables.find((i) => i.kind === 'thornWall' && i.trueTarget)!,
      ];
      const geoClosed = adventureToLabyrinthMap(session.map, []);
      const openScentDoors = new Map(geoClosed.doors.map((door) => [door.id, true]));
      const before = computeReachability(geoClosed, session.map.spawn, {
        odorId: ADVENTURE_MOVE_ACTOR.odorId,
        doors: openScentDoors,
      });
      for (const door of doors) {
        const geoOpen = adventureToLabyrinthMap(session.map, [door.id]);
        const after = computeReachability(geoOpen, session.map.spawn, {
          odorId: ADVENTURE_MOVE_ACTOR.odorId,
          doors: new Map(geoOpen.doors.map((d) => [d.id, true])),
        });
        expect(
          after.reachable.size - before.reachable.size,
          `${map.exitTile.x},${map.exitTile.y} ${door.id}`,
        ).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('lets walking onto the exit finish the maze without seals', () => {
    let session = createAdventureSession({ seed: 'exit', difficulty: 'junior' });
    const exit = itemOf(session, 'exit');
    expect(currentObjective(session).id).toBe('cartridge');
    expect(canUseExit(session)).toBe(true);
    session = goTo(session, exit.tile);
    session = press(session, {}, 16);
    expect(session.phase).toBe('victory');
  });

  it('blocks the unique exit path until scent tools open the gates', () => {
    let session = createAdventureSession({ seed: 'gates', difficulty: 'junior' });
    expect(currentObjective(session).id).toBe('cartridge');
    expect(shortestAdventurePath(session, session.map.exitTile)).toEqual([]);
    const startY = session.player.position.y;
    session = press(session, { moveY: 1 }, 400);
    expect(session.player.position.y).toBeLessThan(4);
    expect(session.player.position.y).toBeLessThanOrEqual(startY + 0.35);

    const rec = session.interactables.find((i) => i.loot?.moduleId === 'receptor-cartridge')!;
    session = goTo(session, rec.tile);
    session = interactAdventure(session);
    session = press(session, {}, 16);
    expect(session.player.collectedModules).toContain('receptor-cartridge');
    expect(session.openDoorIds.some((id) => id.startsWith('scentGate'))).toBe(true);
    expect(currentObjective(session).id).toBe('lemon');
    expect(shortestAdventurePath(session, session.map.exitTile)).toEqual([]);
  });

  it('finds a walkable hint path to the current objective', () => {
    const session = createAdventureSession({ seed: 'hint-path', difficulty: 'junior' });
    const obj = currentObjective(session);
    const path = shortestAdventurePath(session, obj.tile);
    expect(path.length).toBeGreaterThan(1);
    expect(path[0]).toEqual({ x: session.map.spawn.x, y: session.map.spawn.y });
    expect(path[path.length - 1]).toEqual(obj.tile);
    for (const step of path) {
      expect(session.map.collision[step.y * session.map.width + step.x]).not.toBe(true);
    }
  });

  it('faces only left or right, even when walking up or down', () => {
    let session = createAdventureSession({ seed: 'facing', difficulty: 'junior' });
    expect(session.player.facing).toBe(0);
    session = goTo(session, { x: 3, y: 5 });
    session = press(session, { moveY: 1 }, 80);
    expect(session.player.facing).toBe(0);
    session = press(session, { moveX: -1 }, 80);
    expect(session.player.facing).toBe(Math.PI);
    session = press(session, { moveY: -1 }, 80);
    expect(session.player.facing).toBe(Math.PI);
    session = press(session, { moveX: 1 }, 80);
    expect(session.player.facing).toBe(0);
  });

  it('is deterministic from the same seed', () => {
    const a = createAdventureSession({ seed: 'lab-seed-7', difficulty: 'standard' });
    const b = createAdventureSession({ seed: 'lab-seed-7', difficulty: 'standard' });
    const wispA = a.enemies.find((e) => e.kind === 'noiseWisp')!;
    const wispB = b.enemies.find((e) => e.kind === 'noiseWisp')!;
    expect(wispA.falseMarkerTiles).toEqual(wispB.falseMarkerTiles);
    expect(pickAdventureMap('lab-seed-7').spawn).toEqual(pickAdventureMap('lab-seed-7').spawn);
    const layouts = new Set(
      ADVENTURE_OFFICIAL_MAPS.map((map) => `${map.exitTile.x},${map.exitTile.y}|${map.interactables.find((i) => i.kind === 'hiddenPassage')?.tile.x}`),
    );
    expect(layouts.size).toBe(ADVENTURE_OFFICIAL_MAPS.length);
  });

  it('does not soft-lock any official map on any difficulty', () => {
    const difficulties: AdventureDifficulty[] = ['junior', 'standard', 'challenge'];
    expect(ADVENTURE_OFFICIAL_MAPS.length).toBeGreaterThanOrEqual(3);
    for (const map of ADVENTURE_OFFICIAL_MAPS) {
      expect(map.width).toBe(32);
      expect(map.height).toBe(18);
      for (const difficulty of difficulties) {
        const sim = simulateOfficialProgress(map, difficulty);
        expect(sim.exitReachable, `${map.exitTile.x},${map.exitTile.y} ${difficulty}`).toBe(true);
        expect(sim.allRequiredOdors, difficulty).toBe(true);
        expect(sim.collectedModules).toEqual(
          expect.arrayContaining(['receptor-cartridge', 'optical-reader', 'signal-filter']),
        );
      }
    }
  });

  it('lets Junior reach the exit without restoring seals', () => {
    const sim = simulateOfficialProgress(MAP_ADVENTURE_V1, 'junior');
    expect(sim.exitReachable).toBe(true);
    expect(sim.restoredSealIds).toEqual([]);
    expect(requiredOdorIds('junior').every((id) => sim.learnedOdorIds.includes(id))).toBe(true);
  });

  it('does not grant AeroSense modules from ordinary enemy drops', () => {
    let session = createAdventureSession({ seed: 'drops', difficulty: 'junior' });
    const spore = session.enemies.find((e) => e.kind === 'sporeling')!;
    session = {
      ...session,
      enemies: session.enemies.map((e) =>
        e.id === spore.id ? { ...e, health: 1, aggro: true, disguised: false } : e,
      ),
    };
    session = at(session, spore.position.x - 0.5, spore.position.y - 0.5);
    session = applyMeleeAttack(session, true);
    expect(session.player.defeatedEnemyIds).toContain(spore.id);
    expect(session.player.collectedModules).toEqual([]);
    expect(session.player.inventory.scanCharge === null || session.player.inventory.scanCharge >= 0).toBe(
      true,
    );
  });

  it('grants Signal Filter from a dead-end chest', () => {
    let session = createAdventureSession({ seed: 'filter-chest', difficulty: 'junior' });
    const chest = session.interactables.find((i) => i.loot?.moduleId === 'signal-filter')!;
    session = goTo(session, chest.tile);
    session = interactAdventure(session);
    expect(session.player.collectedModules).toContain('signal-filter');
  });

  it('supports combined requirement checks (all vs any)', () => {
    const player = {
      learnedOdorIds: ['coffee'],
      collectedModules: ['receptor-cartridge'] as AdventureModuleId[],
    };
    expect(
      requirementsMet(
        { mode: 'all', learnedOdorIds: ['coffee'], moduleIds: ['receptor-cartridge'] },
        player,
        false,
      ),
    ).toBe(true);
    expect(
      requirementsMet(
        { mode: 'all', learnedOdorIds: ['coffee'], moduleIds: ['pattern-decoder'] },
        player,
        false,
      ),
    ).toBe(false);
    expect(
      requirementsMet(
        { mode: 'any', learnedOdorIds: ['mint'], moduleIds: ['receptor-cartridge'] },
        player,
        false,
      ),
    ).toBe(true);
    expect(requirementsMet({ scanRequired: true }, player, false)).toBe(false);
    expect(requirementsMet({ scanRequired: true }, player, true)).toBe(true);
  });

  it('hides odor trails until the optical reader is collected', () => {
    let session = createAdventureSession({ seed: 'trails', difficulty: 'junior' });
    session = withModules(session, ['receptor-cartridge']);
    expect(visibleScentMarkers(session).some((m) => m.id.startsWith('trail-'))).toBe(false);
    session = withModules(session, ['receptor-cartridge', 'optical-reader']);
    expect(visibleScentMarkers(session).some((m) => m.id.startsWith('trail-'))).toBe(true);
  });

  it('uses 3 / 5 / 7 illustrative scents by difficulty', () => {
    expect(requiredOdorIds('junior')).toEqual(['coffee', 'rose', 'mint']);
    expect(requiredOdorIds('standard')).toHaveLength(5);
    expect(requiredOdorIds('challenge')).toHaveLength(7);
  });

  it('gives every required scent a concrete gameplay use', () => {
    const difficulties: AdventureDifficulty[] = ['junior', 'standard', 'challenge'];
    for (const map of ADVENTURE_OFFICIAL_MAPS) {
      for (const difficulty of difficulties) {
        for (const odorId of requiredOdorIds(difficulty)) {
          expect(scentHasGameplayUse(map, odorId), odorId).toBe(true);
        }
      }
    }
  });

  it('pauses on Esc and does not simulate while paused', () => {
    let session = createAdventureSession({ seed: 'pause', difficulty: 'junior' });
    session = press(session, { pausePressed: true }, 16);
    expect(session.phase).toBe('paused');
    const x = session.player.position.x;
    session = press(session, { moveX: 1 }, 200);
    expect(session.player.position.x).toBe(x);
    session = press(session, { pausePressed: true }, 16);
    expect(session.phase).toBe('playing');
  });

  it('reveals decaying vines with lemon-profile scan', () => {
    let session = createAdventureSession({ seed: 'vines', difficulty: 'junior' });
    const vines = itemOf(session, 'decayBarrier');
    session = goTo(session, { x: vines.tile.x, y: vines.tile.y - 1 });
    session = withOdors(session, ['lemon']);
    session = interactAdventure(session);
    expect(session.player.revealedBarrierIds).not.toContain(vines.id);
    expect(session.lastFeedback.message).toBeTruthy();
    session = press(session, { scanPressed: true }, 16);
    expect(session.player.revealedBarrierIds).toContain(vines.id);
    expect(session.openDoorIds).toContain(vines.id);
  });

  it('unlocks the pine wood panel with a pine-profile scan', () => {
    let session = createAdventureSession({ seed: 'alcove', difficulty: 'junior' });
    const panel = itemOf(session, 'hiddenChest');
    session = goTo(session, { x: panel.tile.x - 1, y: panel.tile.y });
    session = withOdors(withModules(session, ['receptor-cartridge']), ['pine']);
    expect(session.unlockedPassageIds).not.toContain(panel.id);
    session = press(session, { scanPressed: true }, 16);
    expect(session.unlockedPassageIds).toContain(panel.id);
  });

  it('opens the rose thorn wall with the rose profile', () => {
    let session = createAdventureSession({ seed: 'thorn', difficulty: 'junior' });
    const thorn = session.interactables.find((i) => i.kind === 'thornWall' && i.trueTarget)!;
    session = withOdors(session, ['rose']);
    session = goTo(session, { x: thorn.tile.x - 1, y: thorn.tile.y });
    session = press(session, { scanPressed: true }, 16);
    expect(session.unlockedPassageIds).toContain(thorn.id);
  });

  it('identifies the true coffee pile with the coffee profile', () => {
    let session = createAdventureSession({ seed: 'coffee', difficulty: 'junior' });
    const truePile = session.interactables.find((i) => i.kind === 'coffeePile' && i.trueTarget)!;
    session = withOdors(withModules(session, ['receptor-cartridge']), ['coffee']);
    session = goTo(session, truePile.tile);
    session = press(session, { scanPressed: true }, 16);
    session = interactAdventure(session);
    expect(session.player.foundClueIds).toContain('storage-coffee');
  });

  it('solves the 3-choice scent lock', () => {
    let session = createAdventureSession({ seed: 'lock', difficulty: 'junior' });
    const lock = itemOf(session, 'scentLock');
    session = goTo(
      withOdors(withModules(session, [...ADVENTURE_MODULE_IDS]), requiredOdorIds('challenge')),
      lock.tile,
    );
    session = interactAdventure(session);
    expect(session.phase).toBe('puzzle');
    session = solveAdventurePuzzle(session, 'banana');
    expect(session.phase).toBe('puzzle');
    session = solveAdventurePuzzle(session, 'peach');
    expect(session.player.solvedPuzzleIds).toContain(lock.id);
  });

  it('never shows an E prompt for an object with no E action', () => {
    const session = createAdventureSession({ seed: 'affordance', difficulty: 'junior' });
    for (const item of session.interactables) {
      const aff = getInteractionAffordance(session, item);
      expect(ePromptHasAction(aff), item.id).toBe(true);
      if (aff.input === 'E') expect(aff.actionType).not.toBe('none');
    }
    const nearby = findInteractionTarget(session);
    if (nearby.input === 'E') expect(nearby.actionType).not.toBe('none');
  });

  it('matches HUD affordance to the executable interaction', () => {
    let session = createAdventureSession({ seed: 'match', difficulty: 'junior' });
    const chest = session.interactables.find((i) => i.loot?.moduleId === 'receptor-cartridge')!;
    session = goTo(session, chest.tile);
    const aff = findInteractionTarget(session);
    expect(aff.input).toBe('E');
    expect(aff.actionType).toBe('open-chest');
    expect(aff.enabled).toBe(true);
    session = interactAdventure(session);
    expect(session.player.collectedModules).toContain('receptor-cartridge');
    const after = findInteractionTarget(session);
    expect(after.actionType).toBe('inspect');
    expect(after.disabledReason).toBe('already-open');
  });

  it('never silently ignores E', () => {
    const session = createAdventureSession({ seed: 'silent', difficulty: 'junior' });
    const result = interactAdventure(session);
    expect(result.lastFeedback.message).toBeTruthy();
  });

  it('selects an active scent profile from learned scents', () => {
    let session = withOdors(
      withModules(createAdventureSession({ seed: 'profile', difficulty: 'junior' }), ['receptor-cartridge']),
      ['coffee', 'rose'],
    );
    session = setActiveScentProfile(session, 'rose');
    expect(session.player.activeScentProfileId).toBe('rose');
    session = press(session, { selectScentIndex: 0 }, 16);
    expect(session.player.activeScentProfileId).toBe('coffee');
  });

  it('opens common chests immediately and valuable chests with lock mini-games', () => {
    let session = createAdventureSession({ seed: 'locks', difficulty: 'junior' });
    const common = session.interactables.find((i) => i.loot?.moduleId === 'receptor-cartridge')!;
    session = goTo(session, common.tile);
    session = interactAdventure(session);
    expect(session.phase).toBe('playing');
    expect(session.player.openedChestIds).toContain(common.id);

    const optical = session.interactables.find((i) => i.loot?.moduleId === 'optical-reader')!;
    expect(optical.lockMinigame).toBe('skillCheck');
    session = goTo(session, optical.tile);
    session = interactAdventure(session);
    expect(session.phase).toBe('puzzle');
    expect(session.activePuzzle?.kind).toBe('skillCheck');
  });

  it('opens a skill-check chest after two successful hits and does not lock on a miss', () => {
    let session = createAdventureSession({ seed: 'skill', difficulty: 'junior' });
    const optical = session.interactables.find((i) => i.loot?.moduleId === 'optical-reader')!;
    session = goTo(session, optical.tile);
    session = interactAdventure(session);
    expect(session.activePuzzle?.kind).toBe('skillCheck');
    session = {
      ...session,
      activePuzzle: { ...session.activePuzzle!, indicator: 0.02, cooldownUntilMs: 0 },
    };
    session = press(session, { attackPressed: true }, 16);
    expect(session.phase).toBe('puzzle');
    expect(session.player.openedChestIds).not.toContain(optical.id);
    expect(session.activePuzzle?.hits).toBe(0);

    session = {
      ...session,
      activePuzzle: { ...session.activePuzzle!, indicator: 0.5, cooldownUntilMs: 0 },
    };
    session = press(session, { attackPressed: true }, 16);
    expect(session.activePuzzle?.hits).toBe(1);
    session = {
      ...session,
      activePuzzle: { ...session.activePuzzle!, indicator: 0.5, cooldownUntilMs: 0 },
    };
    session = press(session, { attackPressed: true }, 16);
    expect(session.phase).toBe('playing');
    expect(session.player.collectedModules).toContain('optical-reader');
  });

  it('spawns a sporeling on a Challenge skill-check miss without locking the chest', () => {
    let session = createAdventureSession({ seed: 'alarm', difficulty: 'challenge' });
    const optical = session.interactables.find((i) => i.loot?.moduleId === 'optical-reader')!;
    const before = session.enemies.length;
    session = goTo(session, optical.tile);
    session = interactAdventure(session);
    session = {
      ...session,
      activePuzzle: { ...session.activePuzzle!, indicator: 0.02, cooldownUntilMs: 0 },
    };
    session = press(session, { interactPressed: true }, 16);
    expect(session.phase).toBe('puzzle');
    expect(session.player.openedChestIds).not.toContain(optical.id);
    expect(session.enemies.length).toBe(before + 1);
    expect(session.enemies.some((e) => e.id.startsWith('alarm-spore-'))).toBe(true);
  });

  it('makes Junior lock checks wider and slower than Challenge', () => {
    expect(skillCheckSpec('junior').zoneWidth).toBeGreaterThan(skillCheckSpec('challenge').zoneWidth);
    expect(skillCheckSpec('junior').speed).toBeLessThan(skillCheckSpec('challenge').speed);
    expect(patternMemoryLength('junior')).toBe(3);
    expect(patternMemoryLength('standard')).toBe(4);
    expect(patternMemoryLength('challenge')).toBe(5);
  });
});
