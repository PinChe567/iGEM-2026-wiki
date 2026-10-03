import { INTERACT_RANGE } from './constants';
import { emptyFeedback } from './combat';
import { applyLoot } from './inventory';
import { canRestoreSeal, canUnlockScanWall, requirementsMet } from './progression';
import {
  grantChestLoot,
  openAdventurePuzzle,
  patternMemoryPuzzle,
  scentLockPuzzle,
  skillCheckPuzzle,
} from './puzzles';
import { revealMimic } from './enemies';
import type {
  AdventureInteractable,
  AdventurePlayerState,
  AdventureRequirements,
  AdventureSession,
} from './types';

export type InteractionInput = 'E' | 'Q' | 'none';

export type InteractionActionType =
  | 'none'
  | 'open-chest'
  | 'learn-odor'
  | 'restore-seal'
  | 'inspect-exit'
  | 'use-exit'
  | 'open-scent-lock'
  | 'set-checkpoint'
  | 'reveal-mimic'
  | 'search-pile'
  | 'open-passage'
  | 'inspect';

export type InteractionAffordance = {
  item: AdventureInteractable | null;
  enemyId: string | null;
  input: InteractionInput;
  labelKey: string;
  enabled: boolean;
  disabledReason: string | null;
  actionType: InteractionActionType;
};

export function emptyAffordance(): InteractionAffordance {
  return {
    item: null,
    enemyId: null,
    input: 'none',
    labelKey: '',
    enabled: false,
    disabledReason: null,
    actionType: 'none',
  };
}

export function distToItem(
  session: Pick<AdventureSession, 'player'>,
  item: Pick<AdventureInteractable, 'tile'>,
): number {
  return Math.hypot(
    session.player.position.x - (item.tile.x + 0.5),
    session.player.position.y - (item.tile.y + 0.5),
  );
}

export function findNearbyAdventure(
  session: AdventureSession,
  maxDist = INTERACT_RANGE,
): AdventureInteractable[] {
  const pos = session.player.position;
  return session.interactables
    .map((item) => ({
      item,
      distance: Math.hypot(pos.x - (item.tile.x + 0.5), pos.y - (item.tile.y + 0.5)),
    }))
    .filter((row) => row.distance <= maxDist)
    .sort((a, b) => a.distance - b.distance)
    .map((row) => row.item);
}

export function nearbyDisguisedMimic(session: AdventureSession, maxDist = INTERACT_RANGE) {
  const pos = session.player.position;
  return session.enemies.find((enemy) => {
    if (enemy.kind !== 'mimicSpore' || enemy.defeated || !enemy.disguised) return false;
    return Math.hypot(pos.x - enemy.position.x, pos.y - enemy.position.y) <= maxDist;
  });
}

function missingRequirementMessage(
  req: AdventureRequirements | undefined,
  player: Pick<AdventurePlayerState, 'learnedOdorIds' | 'collectedModules'>,
  scanActive: boolean,
  activeProfile: string | null,
): string | null {
  if (!req) return null;
  if (req.moduleIds?.includes('receptor-cartridge') && !player.collectedModules.includes('receptor-cartridge')) {
    return 'need-receptor';
  }
  if (req.moduleIds?.includes('pattern-decoder') && !player.collectedModules.includes('pattern-decoder')) {
    return 'decoder-offline';
  }
  if (req.moduleIds && req.moduleIds.some((id) => !player.collectedModules.includes(id))) {
    return 'locked';
  }
  if (req.learnedOdorIds && req.learnedOdorIds.length > 0) {
    const missing = req.learnedOdorIds.find((id) => !player.learnedOdorIds.includes(id));
    if (missing) return `${missing}-profile-required`;
    const needed = req.learnedOdorIds[0];
    if (needed && activeProfile !== needed && !scanActive) {
      return `${needed}-profile-required`;
    }
  }
  if (req.scanRequired && !scanActive) return 'scan-surface-first';
  return 'locked';
}

export function getInteractionAffordance(
  session: AdventureSession,
  item?: AdventureInteractable | null,
): InteractionAffordance {
  const mimic = nearbyDisguisedMimic(session);
  if (!item && mimic) {
    return {
      item: null,
      enemyId: mimic.id,
      input: 'E',
      labelKey: 'promptChest',
      enabled: true,
      disabledReason: null,
      actionType: 'reveal-mimic',
    };
  }

  if (!item) return emptyAffordance();

  const player = session.player;
  const scan = player.scan.active;
  const highlighted = player.highlightedIds.includes(item.id);

  if (item.kind === 'scentTrail' || item.kind === 'noisyField' || item.kind === 'scentGate') {
    if (item.kind === 'scentGate' && !session.openDoorIds.includes(item.id)) {
      const need = item.requirements?.moduleIds?.[0];
      const reason =
        need === 'optical-reader'
          ? 'need-optical'
          : need === 'signal-filter'
            ? 'need-filter'
            : 'need-receptor';
      return {
        item,
        enemyId: null,
        input: 'E',
        labelKey: 'promptGateLocked',
        enabled: false,
        disabledReason: reason,
        actionType: 'inspect',
      };
    }
    if (item.kind === 'scentTrail' && item.odorId && player.learnedOdorIds.includes(item.odorId) && !highlighted) {
      return {
        item,
        enemyId: null,
        input: 'Q',
        labelKey: 'promptScanTrail',
        enabled: true,
        disabledReason: player.activeScentProfileId === item.odorId ? null : `${item.odorId}-profile-required`,
        actionType: 'none',
      };
    }
    return emptyAffordance();
  }

  if (item.kind === 'checkpoint') {
    if (item.id === player.currentCheckpointId) {
      return {
        item,
        enemyId: null,
        input: 'E',
        labelKey: 'promptCheckpoint',
        enabled: false,
        disabledReason: 'checkpoint',
        actionType: 'inspect',
      };
    }
    return {
      item,
      enemyId: null,
      input: 'E',
      labelKey: 'promptCheckpoint',
      enabled: true,
      disabledReason: null,
      actionType: 'set-checkpoint',
    };
  }

  if (item.kind === 'odorSample' && item.odorId) {
    if (player.learnedOdorIds.includes(item.odorId)) {
      return {
        item,
        enemyId: null,
        input: 'E',
        labelKey: 'promptSample',
        enabled: false,
        disabledReason: 'already-learned',
        actionType: 'inspect',
      };
    }
    if (!requirementsMet(item.requirements, player, scan)) {
      return {
        item,
        enemyId: null,
        input: 'E',
        labelKey: 'promptSample',
        enabled: false,
        disabledReason: missingRequirementMessage(item.requirements, player, scan, player.activeScentProfileId),
        actionType: 'inspect',
      };
    }
    return {
      item,
      enemyId: null,
      input: 'E',
      labelKey: 'promptSample',
      enabled: true,
      disabledReason: null,
      actionType: 'learn-odor',
    };
  }

  if (item.kind === 'chest' || item.kind === 'modulePedestal') {
    if (player.openedChestIds.includes(item.id)) {
      return {
        item,
        enemyId: null,
        input: 'E',
        labelKey: 'promptChest',
        enabled: false,
        disabledReason: 'already-open',
        actionType: 'inspect',
      };
    }
    if (!requirementsMet(item.requirements, player, scan)) {
      return {
        item,
        enemyId: null,
        input: 'E',
        labelKey: 'promptChest',
        enabled: false,
        disabledReason: missingRequirementMessage(item.requirements, player, scan, player.activeScentProfileId),
        actionType: 'inspect',
      };
    }
    return {
      item,
      enemyId: null,
      input: 'E',
      labelKey: item.kind === 'modulePedestal' ? 'promptPedestal' : 'promptChest',
      enabled: true,
      disabledReason: null,
      actionType: 'open-chest',
    };
  }

  if (item.kind === 'coffeePile') {
    if (player.searchedPileIds.includes(item.id)) {
      return {
        item,
        enemyId: null,
        input: 'E',
        labelKey: 'promptPile',
        enabled: false,
        disabledReason: 'already-searched',
        actionType: 'inspect',
      };
    }
    if (!player.learnedOdorIds.includes('coffee') || player.activeScentProfileId !== 'coffee') {
      return {
        item,
        enemyId: null,
        input: player.learnedOdorIds.includes('coffee') ? 'Q' : 'E',
        labelKey: player.learnedOdorIds.includes('coffee') ? 'promptScanPile' : 'promptPile',
        enabled: false,
        disabledReason: 'coffee-profile-required',
        actionType: 'inspect',
      };
    }
    if (!highlighted) {
      return {
        item,
        enemyId: null,
        input: 'Q',
        labelKey: 'promptScanPile',
        enabled: true,
        disabledReason: 'scan-surface-first',
        actionType: 'none',
      };
    }
    return {
      item,
      enemyId: null,
      input: 'E',
      labelKey: 'promptPile',
      enabled: true,
      disabledReason: null,
      actionType: 'search-pile',
    };
  }

  if (item.kind === 'exitSeal' && item.sealId) {
    if (player.restoredSealIds.includes(item.sealId)) {
      return {
        item,
        enemyId: null,
        input: 'E',
        labelKey: 'promptSeal',
        enabled: false,
        disabledReason: 'seal-already',
        actionType: 'inspect',
      };
    }
    if (!canRestoreSeal(session, item)) {
      const reason =
        item.sealId === 'storage'
          ? 'coffee-profile-required'
          : item.sealId === 'garden'
            ? 'rose-profile-required'
            : 'signal-seal-locked';
      return {
        item,
        enemyId: null,
        input: 'E',
        labelKey: 'promptSeal',
        enabled: false,
        disabledReason: reason,
        actionType: 'inspect',
      };
    }
    return {
      item,
      enemyId: null,
      input: 'E',
      labelKey: 'promptSeal',
      enabled: true,
      disabledReason: null,
      actionType: 'restore-seal',
    };
  }

  if (item.kind === 'decayBarrier') {
    if (player.revealedBarrierIds.includes(item.id) || session.openDoorIds.includes(item.id)) {
      return emptyAffordance();
    }
    return {
      item,
      enemyId: null,
      input: 'Q',
      labelKey: 'promptVines',
      enabled: player.learnedOdorIds.includes('lemon') && player.activeScentProfileId === 'lemon',
      disabledReason: player.learnedOdorIds.includes('lemon')
        ? player.activeScentProfileId === 'lemon'
          ? 'scan-surface-first'
          : 'lemon-profile-required'
        : 'lemon-profile-required',
      actionType: 'none',
    };
  }

  if (item.kind === 'thornWall') {
    if (session.unlockedPassageIds.includes(item.id)) return emptyAffordance();
    if (!player.learnedOdorIds.includes('rose') || player.activeScentProfileId !== 'rose') {
      return {
        item,
        enemyId: null,
        input: player.learnedOdorIds.includes('rose') ? 'Q' : 'E',
        labelKey: 'promptThorn',
        enabled: false,
        disabledReason: 'rose-profile-required',
        actionType: 'inspect',
      };
    }
    if (!highlighted && !canUnlockScanWall(item, player, scan)) {
      return {
        item,
        enemyId: null,
        input: 'Q',
        labelKey: 'promptThorn',
        enabled: true,
        disabledReason: 'scan-surface-first',
        actionType: 'none',
      };
    }
    return {
      item,
      enemyId: null,
      input: 'E',
      labelKey: 'promptThorn',
      enabled: true,
      disabledReason: null,
      actionType: 'open-passage',
    };
  }

  if (item.kind === 'hiddenPassage' || item.kind === 'hiddenChest') {
    const unlocked = session.unlockedPassageIds.includes(item.id);
    if (!unlocked) {
      const odor = item.odorId ?? item.requirements?.learnedOdorIds?.[0];
      const profileOk = !odor || player.activeScentProfileId === odor;
      if (!requirementsMet({ ...item.requirements, scanRequired: false }, player, false) || !profileOk) {
        return {
          item,
          enemyId: null,
          input: odor && player.learnedOdorIds.includes(odor) ? 'Q' : 'E',
          labelKey: 'promptScanWall',
          enabled: false,
          disabledReason: missingRequirementMessage(
            item.requirements,
            player,
            scan,
            player.activeScentProfileId,
          ),
          actionType: 'inspect',
        };
      }
      return {
        item,
        enemyId: null,
        input: 'Q',
        labelKey: 'promptScanWall',
        enabled: true,
        disabledReason: 'scan-surface-first',
        actionType: 'none',
      };
    }
    if (item.kind === 'hiddenChest') {
      if (player.openedChestIds.includes(item.id)) {
        return {
          item,
          enemyId: null,
          input: 'E',
          labelKey: 'promptChest',
          enabled: false,
          disabledReason: 'already-open',
          actionType: 'inspect',
        };
      }
      return {
        item,
        enemyId: null,
        input: 'E',
        labelKey: 'promptChest',
        enabled: true,
        disabledReason: null,
        actionType: 'open-chest',
      };
    }
    return emptyAffordance();
  }

  if (item.kind === 'scentLock') {
    if (player.solvedPuzzleIds.includes(item.id)) {
      return {
        item,
        enemyId: null,
        input: 'E',
        labelKey: 'promptLock',
        enabled: false,
        disabledReason: 'lock-open',
        actionType: 'inspect',
      };
    }
    if (!requirementsMet(item.requirements, player, false)) {
      return {
        item,
        enemyId: null,
        input: 'E',
        labelKey: 'promptLock',
        enabled: false,
        disabledReason: missingRequirementMessage(item.requirements, player, false, player.activeScentProfileId),
        actionType: 'inspect',
      };
    }
    return {
      item,
      enemyId: null,
      input: 'E',
      labelKey: 'promptLock',
      enabled: true,
      disabledReason: null,
      actionType: 'open-scent-lock',
    };
  }

  if (item.kind === 'exit') {
    return {
      item,
      enemyId: null,
      input: 'E',
      labelKey: 'promptExit',
      enabled: true,
      disabledReason: null,
      actionType: 'use-exit',
    };
  }

  return emptyAffordance();
}

export function findInteractionTarget(session: AdventureSession): InteractionAffordance {
  const mimic = nearbyDisguisedMimic(session);
  if (mimic) return getInteractionAffordance(session);

  for (const item of findNearbyAdventure(session)) {
    const affordance = getInteractionAffordance(session, item);
    if (affordance.input !== 'none' || affordance.actionType !== 'none') return affordance;
  }
  return emptyAffordance();
}

function feedback(session: AdventureSession, message: string | null): AdventureSession {
  return { ...session, lastFeedback: { ...emptyFeedback(), message } };
}

export function setActiveScentProfile(
  session: AdventureSession,
  odorId: string | null,
): AdventureSession {
  if (odorId && !session.player.learnedOdorIds.includes(odorId)) {
    return feedback(session, 'scent-not-learned');
  }
  return {
    ...session,
    player: { ...session.player, activeScentProfileId: odorId },
    lastFeedback: {
      ...emptyFeedback(),
      message: odorId ? 'profile-selected' : 'profile-cleared',
    },
  };
}

export function interactAdventure(session: AdventureSession): AdventureSession {
  const affordance = findInteractionTarget(session);

  if (affordance.actionType === 'reveal-mimic' && affordance.enemyId) {
    return {
      ...revealMimic(session, affordance.enemyId),
      lastFeedback: { ...emptyFeedback(), message: 'mimic' },
    };
  }

  if (affordance.input === 'none' && affordance.actionType === 'none') {
    return feedback(session, 'nothing-nearby');
  }

  if (affordance.input === 'Q' || !affordance.enabled) {
    return feedback(session, affordance.disabledReason ?? 'scan-surface-first');
  }

  const nearby = affordance.item;
  if (!nearby) return feedback(session, 'nothing-nearby');

  if (affordance.actionType === 'set-checkpoint') {
    return {
      ...session,
      player: {
        ...session.player,
        currentCheckpointId: nearby.id,
        discoveredCheckpointIds: session.player.discoveredCheckpointIds.includes(nearby.id)
          ? session.player.discoveredCheckpointIds
          : [...session.player.discoveredCheckpointIds, nearby.id],
      },
      lastFeedback: { ...emptyFeedback(), message: 'checkpoint' },
    };
  }

  if (affordance.actionType === 'inspect') {
    return feedback(session, affordance.disabledReason ?? 'locked');
  }

  if (affordance.actionType === 'open-passage') {
    if (session.unlockedPassageIds.includes(nearby.id)) return feedback(session, 'secret-found');
    return {
      ...session,
      unlockedPassageIds: [...session.unlockedPassageIds, nearby.id],
      player: {
        ...session.player,
        discoveredSecretIds: nearby.secretId
          ? session.player.discoveredSecretIds.includes(nearby.secretId)
            ? session.player.discoveredSecretIds
            : [...session.player.discoveredSecretIds, nearby.secretId]
          : session.player.discoveredSecretIds,
      },
      lastFeedback: {
        ...emptyFeedback(),
        unlockedPassageId: nearby.id,
        message: 'thorn-open',
      },
    };
  }

  if (affordance.actionType === 'open-scent-lock') {
    const puzzle = scentLockPuzzle(session, nearby.id);
    if (!puzzle) return feedback(session, 'locked');
    return openAdventurePuzzle(session, puzzle);
  }

  if (affordance.actionType === 'learn-odor' && nearby.odorId) {
    return {
      ...session,
      player: {
        ...session.player,
        learnedOdorIds: [...session.player.learnedOdorIds, nearby.odorId],
        activeScentProfileId: nearby.odorId,
      },
      lastFeedback: { ...emptyFeedback(), learnedOdorId: nearby.odorId, message: 'learned' },
    };
  }

  if (affordance.actionType === 'search-pile') {
    const searched = [...session.player.searchedPileIds, nearby.id];
    if (!nearby.trueTarget) {
      return {
        ...session,
        player: { ...session.player, searchedPileIds: searched },
        lastFeedback: { ...emptyFeedback(), message: 'no-matching-pattern' },
      };
    }
    const applied = applyLoot(
      session.player.inventory,
      session.player.health,
      session.player.maxHealth,
      nearby.loot,
    );
    const clueId = nearby.clueId ?? 'storage-coffee';
    return {
      ...session,
      player: {
        ...session.player,
        inventory: applied.inventory,
        health: applied.health,
        searchedPileIds: searched,
        foundClueIds: session.player.foundClueIds.includes(clueId)
          ? session.player.foundClueIds
          : [...session.player.foundClueIds, clueId],
      },
      lastFeedback: { ...emptyFeedback(), openedId: nearby.id, message: 'pile-clue' },
    };
  }

  if (affordance.actionType === 'restore-seal' && nearby.sealId) {
    return {
      ...session,
      player: {
        ...session.player,
        restoredSealIds: session.player.restoredSealIds.includes(nearby.sealId)
          ? session.player.restoredSealIds
          : [...session.player.restoredSealIds, nearby.sealId],
      },
      lastFeedback: { ...emptyFeedback(), message: 'seal-restored', sealId: nearby.sealId },
    };
  }

  if (affordance.actionType === 'open-chest') {
    if (nearby.lockMinigame === 'skillCheck') {
      return openAdventurePuzzle(session, skillCheckPuzzle(session, nearby.id));
    }
    if (nearby.lockMinigame === 'patternMemory') {
      return openAdventurePuzzle(session, patternMemoryPuzzle(session, nearby.id));
    }
    return grantChestLoot(session, nearby.id);
  }

  if (affordance.actionType === 'inspect-exit') {
    return {
      ...session,
      player: { ...session.player, inspectedExit: true },
      lastFeedback: { ...emptyFeedback(), message: 'restore-seals' },
    };
  }

  if (affordance.actionType === 'use-exit') {
    return {
      ...session,
      phase: 'victory',
      lastFeedback: { ...emptyFeedback(), message: 'exit' },
    };
  }

  return feedback(session, 'nothing-nearby');
}

export function promptUsesAction(affordance: InteractionAffordance): boolean {
  return affordance.input !== 'none';
}

export function ePromptHasAction(affordance: InteractionAffordance): boolean {
  if (affordance.input !== 'E') return true;
  return affordance.actionType !== 'none';
}
