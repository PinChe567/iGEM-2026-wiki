import { createRng, randomInt } from '../../rng';
import { ADVENTURE_MODULE_IDS, ADVENTURE_ODOR_IDS } from './constants';
import { emptyFeedback } from './combat';
import { spawnAlarmSporeling } from './enemies';
import { applyLoot } from './inventory';
import { grantModule, requirementsMet } from './progression';
import type { AdventureDifficulty, AdventureIntent, AdventurePuzzle, AdventureSession } from './types';

const SKILL_SPEC: Record<AdventureDifficulty, { zoneWidth: number; speed: number }> = {
  junior: { zoneWidth: 0.4, speed: 0.62 },
  standard: { zoneWidth: 0.24, speed: 0.96 },
  challenge: { zoneWidth: 0.14, speed: 1.28 },
};

const PATTERN_LEN: Record<AdventureDifficulty, number> = {
  junior: 3,
  standard: 4,
  challenge: 5,
};

const PATTERN_POOL = ADVENTURE_ODOR_IDS.slice(0, 6);

export function scentLockPuzzle(session: AdventureSession, lockId: string): AdventurePuzzle | null {
  const lock = session.interactables.find((item) => item.id === lockId && item.kind === 'scentLock');
  if (!lock?.odorId) return null;
  return {
    id: lock.id,
    kind: 'scentLock',
    choices: lock.lockChoices ?? ['banana', 'lemon', 'mint'],
    answerId: lock.odorId,
  };
}

export function exitPatternPuzzle(): AdventurePuzzle {
  return {
    id: 'exit-pattern',
    kind: 'exit',
    choices: ['banana', 'lemon', 'mint'],
    answerId: 'lemon',
  };
}

export function skillCheckPuzzle(session: AdventureSession, chestId: string): AdventurePuzzle {
  const spec = SKILL_SPEC[session.difficulty];
  const zoneStart = 0.5 - spec.zoneWidth / 2;
  return {
    id: chestId,
    kind: 'skillCheck',
    choices: [],
    answerId: 'hit',
    needed: 2,
    hits: 0,
    indicator: 0.08,
    dir: 1,
    zoneStart,
    zoneWidth: spec.zoneWidth,
    speed: spec.speed,
    cooldownUntilMs: 0,
  };
}

export function patternMemoryPuzzle(session: AdventureSession, chestId: string): AdventurePuzzle {
  const len = PATTERN_LEN[session.difficulty];
  const rng = createRng(`${session.seed}:${chestId}:pattern`);
  const sequence: string[] = [];
  for (let i = 0; i < len; i += 1) {
    sequence.push(PATTERN_POOL[randomInt(rng, PATTERN_POOL.length)] ?? 'coffee');
  }
  const fillers = PATTERN_POOL.filter((id) => !sequence.includes(id)).slice(0, 2);
  const choices = [...new Set([...sequence, ...fillers])];
  return {
    id: chestId,
    kind: 'patternMemory',
    choices,
    answerId: sequence.join(','),
    sequence,
    input: [],
    revealUntilMs: session.elapsedMs + (session.difficulty === 'junior' ? 2200 : 1600),
  };
}

export function modulesReadyForExit(session: AdventureSession): boolean {
  return ADVENTURE_MODULE_IDS.every((id) => session.player.collectedModules.includes(id));
}

export function openAdventurePuzzle(
  session: AdventureSession,
  puzzle: AdventurePuzzle,
): AdventureSession {
  return {
    ...session,
    phase: 'puzzle',
    activePuzzle: puzzle,
    lastFeedback: { ...emptyFeedback(), message: 'puzzle' },
  };
}

export function cancelAdventurePuzzle(session: AdventureSession): AdventureSession {
  if (session.phase !== 'puzzle') return session;
  return {
    ...session,
    phase: 'playing',
    activePuzzle: null,
  };
}

export function grantChestLoot(session: AdventureSession, chestId: string): AdventureSession {
  const chest = session.interactables.find((item) => item.id === chestId);
  if (!chest || session.player.openedChestIds.includes(chestId)) {
    return { ...session, phase: 'playing', activePuzzle: null };
  }
  const applied = applyLoot(
    session.player.inventory,
    session.player.health,
    session.player.maxHealth,
    chest.loot,
  );
  const moduleId = chest.loot?.moduleId;
  return {
    ...session,
    phase: 'playing',
    activePuzzle: null,
    player: {
      ...session.player,
      inventory: applied.inventory,
      health: applied.health,
      collectedModules: moduleId
        ? grantModule(session.player.collectedModules, moduleId)
        : session.player.collectedModules,
      openedChestIds: [...session.player.openedChestIds, chestId],
    },
    lastFeedback: {
      ...emptyFeedback(),
      openedId: chestId,
      message: moduleId ? 'module-online' : 'opened',
    },
  };
}

export function tickSkillCheckPuzzle(
  session: AdventureSession,
  intent: AdventureIntent,
  dtMs: number,
): AdventureSession {
  const puzzle = session.activePuzzle;
  if (!puzzle || puzzle.kind !== 'skillCheck') return session;
  const speed = puzzle.speed ?? 1;
  const dir = puzzle.dir ?? 1;
  let indicator = (puzzle.indicator ?? 0) + dir * speed * (dtMs / 1000);
  let nextDir = dir;
  if (indicator >= 1) {
    indicator = 1;
    nextDir = -1;
  } else if (indicator <= 0) {
    indicator = 0;
    nextDir = 1;
  }
  let next: AdventurePuzzle = { ...puzzle, indicator, dir: nextDir };
  if ((intent.attackPressed || intent.interactPressed) && session.elapsedMs >= (puzzle.cooldownUntilMs ?? 0)) {
    const start = puzzle.zoneStart ?? 0.4;
    const width = puzzle.zoneWidth ?? 0.2;
    const inZone = indicator >= start && indicator <= start + width;
    next = { ...next, cooldownUntilMs: session.elapsedMs + 280 };
    if (inZone) {
      const hits = (puzzle.hits ?? 0) + 1;
      next = { ...next, hits };
      if (hits >= (puzzle.needed ?? 2)) {
        return grantChestLoot({ ...session, activePuzzle: next }, puzzle.id);
      }
      return {
        ...session,
        activePuzzle: next,
        lastFeedback: { ...emptyFeedback(), message: 'skill-hit' },
      };
    }
    next = { ...next, hits: 0 };
    let failed: AdventureSession = {
      ...session,
      activePuzzle: next,
      lastFeedback: { ...emptyFeedback(), message: 'skill-miss' },
    };
    if (session.difficulty === 'challenge') {
      const chest = session.interactables.find((item) => item.id === puzzle.id);
      if (chest) failed = spawnAlarmSporeling(failed, chest.tile);
    }
    return failed;
  }
  return { ...session, activePuzzle: next };
}

export function solveAdventurePuzzle(session: AdventureSession, choiceId: string): AdventureSession {
  const puzzle = session.activePuzzle;
  if (!puzzle) return session;
  if (puzzle.kind === 'skillCheck') {
    return tickSkillCheckPuzzle(session, {
      moveX: 0,
      moveY: 0,
      attackPressed: choiceId === 'hit',
      scanPressed: false,
      interactPressed: false,
      pausePressed: false,
      selectScentId: null,
      selectScentIndex: null,
    }, 0);
  }
  if (puzzle.kind === 'patternMemory') {
    if (session.elapsedMs < (puzzle.revealUntilMs ?? 0)) return session;
    const sequence = puzzle.sequence ?? [];
    const input = [...(puzzle.input ?? []), choiceId];
    const idx = input.length - 1;
    if (input[idx] !== sequence[idx]) {
      return {
        ...session,
        activePuzzle: { ...puzzle, input: [] },
        lastFeedback: { ...emptyFeedback(), message: 'pattern-miss' },
      };
    }
    if (input.length >= sequence.length) {
      return grantChestLoot({ ...session, activePuzzle: { ...puzzle, input } }, puzzle.id);
    }
    return {
      ...session,
      activePuzzle: { ...puzzle, input },
      lastFeedback: { ...emptyFeedback(), message: 'pattern-hit' },
    };
  }
  if (choiceId !== puzzle.answerId) {
    return {
      ...session,
      lastFeedback: { ...emptyFeedback(), message: 'wrong-scent' },
    };
  }
  if (puzzle.kind === 'scentLock') {
    return {
      ...session,
      phase: 'playing',
      activePuzzle: null,
      player: {
        ...session.player,
        solvedPuzzleIds: session.player.solvedPuzzleIds.includes(puzzle.id)
          ? session.player.solvedPuzzleIds
          : [...session.player.solvedPuzzleIds, puzzle.id],
      },
      lastFeedback: { ...emptyFeedback(), message: 'lock-open' },
    };
  }
  return {
    ...session,
    phase: 'playing',
    activePuzzle: null,
    player: { ...session.player, exitPatternSolved: true },
    lastFeedback: { ...emptyFeedback(), message: 'exit-ready' },
  };
}

export function canOpenScentLock(session: AdventureSession, lockId: string): boolean {
  const lock = session.interactables.find((item) => item.id === lockId);
  if (!lock) return false;
  return requirementsMet(lock.requirements, session.player, false);
}

export function skillCheckSpec(difficulty: AdventureDifficulty) {
  return SKILL_SPEC[difficulty];
}

export function patternMemoryLength(difficulty: AdventureDifficulty): number {
  return PATTERN_LEN[difficulty];
}
