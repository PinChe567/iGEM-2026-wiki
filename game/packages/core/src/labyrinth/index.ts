export {
  LABYRINTH_GAME_VERSION,
  LABYRINTH_MAP_VERSION,
  LABYRINTH_CASE_SCHEMA_VERSION,
  PHASE_SHIFT_DURATION_MS,
  PHASE_SHIFT_COOLDOWN_MS,
  PHASE_SHIFT_ARTIFACT_MS,
  SIGNAL_JAM_DURATION_MS,
  SIGNAL_JAM_COOLDOWN_MS,
  SIGNAL_JAM_CORRUPTION_MS,
  EXPLORE_PHASE_MS,
  REVIEW_PHASE_MS,
  BRIEFING_PHASE_MS,
  VERDICT_PHASE_MS,
  MIN_PLAYERS,
  MAX_PLAYERS,
  MIN_LEGAL_TASKS_REACHABLE,
} from './constants';

export {
  ALL_GATE_IDS,
  ROLE_GATE_TABLE,
  LABYRINTH_ODOR_IDS,
  authorizedGates,
  gateKey,
  odorIdFromGateKey,
  isAuthorizedGate,
  type GateId,
  type LabyrinthOdorId,
} from './role-gates';

export type * from './types';

export {
  createInitialMachineState,
  nextPhase,
  applyTransition,
  assertLegalPhaseEdge,
  resolveWinSide,
  isExplorePhase,
  isTerminal,
  makeTimer,
  type PhaseTimer,
  type MachineState,
  type TransitionEvent,
  type TransitionResult,
} from './state-machine';

export { canPassGate, type GatePassageDecision } from './gates';

export {
  tileIndex,
  inBounds,
  getTileAt,
  isWallCollision,
  defaultDoorState,
  isDoorOpen,
  chebyshev,
  isAdjacent,
  tryMove,
  neighbors4,
  gateIdAt,
} from './movement';

export {
  createPhantomAbilityState,
  isPhaseShiftActive,
  isSignalJamActive,
  isCorrupted,
  activatePhaseShift,
  activateSignalJam,
  leavePhaseShiftArtifact,
  activeArtifacts,
  PHANTOM_TIMINGS,
  type PhantomAbilityId,
  type PhantomAbilityState,
  type ActivateResult,
} from './phantom';

export { parseLabyrinthMap, MAP_V1, loadDefaultMap, tileById } from './map/load';
export {
  computeReachability,
  canReachTile,
  canReachRoom,
  reachableTasks,
  legalTaskCountForRole,
} from './map/reachability';
export {
  validateMap,
  type MapValidationIssue,
  type MapValidationResult,
} from './map/validate';

export {
  enumerateSolutions,
  countSolutions,
  hasUniqueSolution,
  uniqueSolutionOrNull,
  solutionMatchesTruth,
  defaultOdorPool,
  type SolverInput,
} from './solver/constraint-solver';

export {
  generateOfficialCase,
  generateOfficialCaseOrThrow,
  buildFullEvidence,
  type GenerateCaseOptions,
  type GenerateCaseResult,
} from './case/generator';
export {
  validateOfflineCase,
  assertValidOfflineCase,
  type CaseValidationIssue,
} from './case/schema';

export {
  VISION_HALO_RADIUS,
  VISION_FLASHLIGHT_RANGE,
  VISION_FLASHLIGHT_FOV_DEG,
  castRay,
  castVisibility,
  isPointLit,
  visibilityPolygonFromRays,
  flashlightFovRad,
  normalizeAngle,
  type VisionPoint,
  type RayHit,
  type VisionCastOptions,
  type VisionCastResult,
} from './vision';

export {
  ACTOR_RADIUS,
  DEFAULT_MOVE_SPEED,
  tryContinuousMove,
  overlappingTiles,
  findNearbyInteractables,
  createExplorationSession,
  tickExploration,
  permissionsFor,
  currentRoomId,
  tileCenter,
  collisionAt,
  type WorldPos,
  type ExplorationIntent,
  type ContinuousMoveResult,
  type DebugActor,
  type NearbyInteractable,
  type InteractableKind,
  type ExplorationActorState,
  type ExplorationSession,
} from './exploration';

export {
  LABYRINTH_STORAGE_KEY,
  LABYRINTH_STORAGE_VERSION,
  DEFAULT_LABYRINTH_STORED_STATE,
  migrateLabyrinthStoredState,
  parseLabyrinthStoredJson,
  recordSoloBest,
  type LabyrinthStoredState,
} from './storage';

export * from './solo';

export {
  ADVENTURE_GAME_VERSION,
  ADVENTURE_MAP_VERSION,
  ADVENTURE_TITLE_EN,
  ADVENTURE_TITLE_ZH,
  ADVENTURE_MODULE_IDS,
  ADVENTURE_MODULE_SCIENCE,
  ADVENTURE_ODOR_IDS,
  ADVENTURE_PRESETS,
  ADVENTURE_SEAL_IDS,
  INTERACT_RANGE,
  requiredOdorIds,
  parseAdventureMap,
  MAP_ADVENTURE_V1,
  MAP_ADVENTURE_V2,
  MAP_ADVENTURE_V3,
  MAP_ADVENTURE_V4,
  ADVENTURE_OFFICIAL_MAPS,
  pickAdventureMap,
  loadOfficialAdventureMap,
  adventureToLabyrinthMap,
  roomIdAt,
  createAdventureSession,
  tickAdventure,
  interactAdventure,
  emptyAdventureIntent,
  findNearbyAdventure,
  findInteractionTarget,
  getInteractionAffordance,
  setActiveScentProfile,
  applyMeleeAttack,
  applyPlayerHit,
  applyContactDamage,
  canPlayerBeDamaged,
  respawnAtCheckpoint,
  defeatEnemy,
  nearAnyCore,
  spawnEnemies,
  tickEnemies,
  visibleScentMarkers,
  canRejectNoise,
  canSeeTrailIntensity,
  requirementsMet,
  canUnlockHiddenPassage,
  canUseExit,
  canRestoreSeal,
  simulateOfficialProgress,
  scentHasGameplayUse,
  computeAdventureScore,
  currentObjective,
  currentWingLabelKey,
  compassAngle,
  shortestAdventurePath,
  solveAdventurePuzzle,
  cancelAdventurePuzzle,
  secretCount,
  modulesReadyForExit,
  buildAdventureMinimap,
} from './adventure';

export type {
  AdventureDifficulty,
  AdventureModuleId,
  AdventureEnemyKind,
  AdventureInteractableKind,
  AdventureSession,
  AdventureIntent,
  AdventureScore,
  AdventureMap,
  AdventureSealId,
  AdventureRoomId,
  CreateAdventureOptions,
  InteractionAffordance,
} from './adventure';

