export {
  SOLO_HUMAN_ID,
  SOLO_ACTOR_COUNT,
  SOLO_NPC_COUNT,
  SOLO_EXPLORE_MS,
  SOLO_REVIEW_MS,
  SOLO_BRIEFING_MS,
  SOLO_VERDICT_MS,
  SOLO_TUTORIAL_MS,
  SOLO_TASK_KINDS,
  type SoloTaskKind,
} from './constants';

export {
  generateSoloOfficialCase,
  generateSoloOfficialCaseOrThrow,
  discoveredEvidence,
  solutionStatusForEvidence,
  type SoloCase,
  type NpcGoal,
  type NpcGoalKind,
  type NpcPlan,
  type NpcStatement,
  type GenerateSoloResult,
} from './case';

export {
  navKey,
  parseNavKey,
  buildWalkableKeys,
  shortestPath,
  actorPerms,
} from './nav';

export {
  createSoloTask,
  applyTaskInput,
  tickSoloTask,
  type SoloTaskSession,
  type TaskInput,
  type PatternPairTask,
  type SignalRoutingTask,
  type CalibrationHoldTask,
  type MemoryOrderTask,
} from './tasks';

export {
  createNpcRuntimes,
  tickNpcs,
  npcUsesOnlyLegalGatesWithoutPhase,
  channelEvidenceForNpc,
  type NpcRuntime,
  type NpcSimEvent,
} from './npc';

export {
  scoreSoloRound,
  buildDebriefRows,
  type SoloScoreBreakdown,
  type SoloScoreInput,
  type DebriefRow,
} from './scoring';

export {
  runHeadlessSoloCase,
  runHeadlessSoloBatch,
  soloPlanFingerprint,
  type HeadlessSimResult,
} from './simulation';
