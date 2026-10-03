/** AeroSense: Scentbound Labyrinth — adventure mode types (not the phantom campaign). */

export type AdventureDifficulty = 'junior' | 'standard' | 'challenge';

export type AdventureModuleId =
  | 'receptor-cartridge'
  | 'optical-reader'
  | 'signal-filter'
  | 'pattern-decoder';

export type AdventureEnemyKind = 'sporeling' | 'vineCrawler' | 'noiseWisp' | 'mimicSpore' | 'noiseBloom';

export type AdventureSealId = 'storage' | 'garden' | 'signal';

export type AdventureRoomId = 'atrium' | 'storage' | 'greenhouse' | 'signal' | 'corridor';

export type AdventureInteractableKind =
  | 'chest'
  | 'odorSample'
  | 'modulePedestal'
  | 'checkpoint'
  | 'decayBarrier'
  | 'scentTrail'
  | 'scentGate'
  | 'noisyField'
  | 'hiddenPassage'
  | 'hiddenChest'
  | 'scentLock'
  | 'exit'
  | 'exitSeal'
  | 'coffeePile'
  | 'thornWall';

export type AdventureResourceId = 'scanCharge' | 'repairScrap' | 'health' | 'keys';

export type RequirementMode = 'all' | 'any';

export type AdventureRequirements = {
  mode?: RequirementMode;
  learnedOdorIds?: readonly string[];
  moduleIds?: readonly AdventureModuleId[];
  scanRequired?: boolean;
};

export type AdventureLoot = {
  moduleId?: AdventureModuleId;
  resources?: Partial<Record<AdventureResourceId, number>>;
};

export type Vec2 = { x: number; y: number };
export type WorldPos = { x: number; y: number };

export type AdventureGridTile = 'wall' | 'floor';

export type AdventureMapFile = {
  mapVersion: string;
  width: number;
  height: number;
  visionRadius: number;
  grid: string[];
};

export type AdventureMap = {
  mapVersion: string;
  width: number;
  height: number;
  visionRadius: number;
  spawn: Vec2;
  exitTile: Vec2;
  tiles: Array<{ id: string; x: number; y: number; kind: AdventureGridTile }>;
  collision: boolean[];
  interactables: AdventureInteractable[];
  enemies: AdventureEnemySpawn[];
};

export type AdventureInteractable = {
  id: string;
  kind: AdventureInteractableKind;
  tile: Vec2;
  odorId?: string;
  moduleId?: AdventureModuleId;
  loot?: AdventureLoot;
  requirements?: AdventureRequirements;
  trailIntensity?: number;
  secretId?: string;
  lockChoices?: readonly string[];
  sealId?: AdventureSealId;
  trueTarget?: boolean;
  roomId?: AdventureRoomId;
  clueId?: string;
  lockMinigame?: 'skillCheck' | 'patternMemory';
};

export type AdventureEnemySpawn = {
  id: string;
  kind: AdventureEnemyKind;
  tile: Vec2;
  /** Extra tiles that belong to a multi-cell boss. */
  coreTiles?: Vec2[];
};

export type AdventureInventory = {
  scanCharge: number | null;
  repairScrap: number;
  keys: number;
};

export type ScanState = {
  active: boolean;
  remainingMs: number;
  cooldownRemainingMs: number;
};

export type AdventureEnemyState = {
  id: string;
  kind: AdventureEnemyKind;
  position: WorldPos;
  health: number;
  maxHealth: number;
  facing: number;
  aggro: boolean;
  revealed: boolean;
  disguised: boolean;
  defeated: boolean;
  trueCoreIndex: number;
  coreTiles: Vec2[];
  phase: 1 | 2;
  falseMarkerTiles: Vec2[];
};

export type AdventurePlayerState = {
  position: WorldPos;
  prevPosition: WorldPos;
  facing: number;
  maxHealth: number;
  health: number;
  currentCheckpointId: string;
  learnedOdorIds: string[];
  collectedModules: AdventureModuleId[];
  openedChestIds: string[];
  defeatedEnemyIds: string[];
  discoveredSecretIds: string[];
  solvedPuzzleIds: string[];
  revealedBarrierIds: string[];
  restoredSealIds: AdventureSealId[];
  activeScentProfileId: string | null;
  highlightedIds: string[];
  searchedPileIds: string[];
  foundClueIds: string[];
  discoveredCheckpointIds: string[];
  explored: boolean[];
  inspectedExit: boolean;
  exitPatternSolved: boolean;
  inventory: AdventureInventory;
  scan: ScanState;
  invulnerableUntilMs: number;
  attackCooldownUntilMs: number;
};

export type AdventurePhase = 'playing' | 'paused' | 'puzzle' | 'victory';

export type AdventurePuzzle = {
  id: string;
  kind: 'scentLock' | 'exit' | 'skillCheck' | 'patternMemory';
  choices: readonly string[];
  answerId: string;
  needed?: number;
  hits?: number;
  indicator?: number;
  dir?: 1 | -1;
  zoneStart?: number;
  zoneWidth?: number;
  speed?: number;
  cooldownUntilMs?: number;
  sequence?: string[];
  input?: string[];
  revealUntilMs?: number;
};

export type AdventureIntent = {
  moveX: number;
  moveY: number;
  attackPressed: boolean;
  scanPressed: boolean;
  interactPressed: boolean;
  pausePressed: boolean;
  selectScentId: string | null;
  selectScentIndex: number | null;
};

export type AdventureFeedback = {
  hitEnemyIds: string[];
  playerDamaged: boolean;
  respawned: boolean;
  learnedOdorId: string | null;
  openedId: string | null;
  unlockedPassageId: string | null;
  sealId: string | null;
  message: string | null;
};

export type AdventureSession = {
  seed: string;
  difficulty: AdventureDifficulty;
  map: AdventureMap;
  player: AdventurePlayerState;
  enemies: AdventureEnemyState[];
  interactables: AdventureInteractable[];
  openDoorIds: string[];
  unlockedPassageIds: string[];
  elapsedMs: number;
  phase: AdventurePhase;
  activePuzzle: AdventurePuzzle | null;
  lastFeedback: AdventureFeedback;
};

export type AdventureScore = {
  total: number;
  health: number;
  modules: number;
  odors: number;
  secrets: number;
  defeated: number;
  timeBonus: number;
};
