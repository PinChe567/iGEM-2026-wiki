export {
  ADVENTURE_GAME_VERSION,
  ADVENTURE_MAP_VERSION,
  ADVENTURE_TITLE_EN,
  ADVENTURE_TITLE_ZH,
  ADVENTURE_MODULE_IDS,
  ADVENTURE_MODULE_SCIENCE,
  ADVENTURE_ODOR_IDS,
  ADVENTURE_ODOR_VECTORS,
  ADVENTURE_PRESETS,
  ADVENTURE_SEAL_IDS,
  INTERACT_RANGE,
  SCENT_GAMEPLAY_USES,
  SPAWN_GRACE_MS,
  requiredOdorIds,
} from './constants';

export type {
  AdventureDifficulty,
  AdventureModuleId,
  AdventureEnemyKind,
  AdventureInteractableKind,
  AdventureResourceId,
  AdventureSealId,
  AdventureRoomId,
  RequirementMode,
  AdventureRequirements,
  AdventureLoot,
  AdventureMap,
  AdventureInteractable,
  AdventureEnemySpawn,
  AdventureInventory,
  ScanState,
  AdventureEnemyState,
  AdventurePlayerState,
  AdventurePhase,
  AdventurePuzzle,
  AdventureIntent,
  AdventureFeedback,
  AdventureSession,
  AdventureScore,
} from './types';

export {
  parseAdventureMap,
  MAP_ADVENTURE_V1,
  MAP_ADVENTURE_V2,
  MAP_ADVENTURE_V3,
  MAP_ADVENTURE_V4,
  ADVENTURE_OFFICIAL_MAPS,
  pickAdventureMap,
  loadOfficialAdventureMap,
  adventureToLabyrinthMap,
  ADVENTURE_MOVE_ACTOR,
  roomIdAt,
  roomLabelKey,
} from './map';

export {
  createAdventureSession,
  tickAdventure,
  interactAdventure,
  emptyAdventureIntent,
  findNearbyAdventure,
  geometryFor,
  setActiveScentProfile,
  type CreateAdventureOptions,
} from './state';

export {
  getInteractionAffordance,
  findInteractionTarget,
  ePromptHasAction,
  type InteractionAffordance,
  type InteractionActionType,
  type InteractionInput,
} from './interaction';

export {
  applyMeleeAttack,
  applyPlayerHit,
  applyContactDamage,
  canPlayerBeDamaged,
  respawnAtCheckpoint,
  defeatEnemy,
  inMeleeRange,
  nearAnyCore,
  nearTrueCore,
  emptyFeedback,
} from './combat';

export { spawnEnemies, tickEnemies, revealMimic, spawnAlarmSporeling } from './enemies';
export { createInventory, applyLoot, canSpendScan, consumeScanCharge } from './inventory';
export {
  visibleScentMarkers,
  illustrativeOdorVector,
  canDetectOdors,
  canSeeTrailIntensity,
  canRejectNoise,
  canClassifyPatterns,
  applyActiveProfileScan,
} from './scent';
export {
  requirementsMet,
  canUnlockHiddenPassage,
  canUnlockScanWall,
  canRevealDecayBarrier,
  canUseExit,
  canRestoreSeal,
  computeOpenDoorIds,
  hasModule,
  simulateOfficialProgress,
  scentHasGameplayUse,
} from './progression';
export {
  currentObjective,
  currentWingId,
  currentWingLabelKey,
  compassAngle,
  secretCount,
  shortestAdventurePath,
} from './guidance';
export { buildAdventureMinimap, markExplored, playerRoomId } from './minimap';
export {
  solveAdventurePuzzle,
  cancelAdventurePuzzle,
  openAdventurePuzzle,
  exitPatternPuzzle,
  scentLockPuzzle,
  skillCheckPuzzle,
  patternMemoryPuzzle,
  grantChestLoot,
  tickSkillCheckPuzzle,
  skillCheckSpec,
  patternMemoryLength,
  modulesReadyForExit,
} from './puzzles';
export { computeAdventureScore } from './scoring';
