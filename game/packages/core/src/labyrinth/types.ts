import type { GateId, LabyrinthOdorId } from './role-gates';

export type LocaleCode = 'zh-Hant' | 'en';

export type LocalizedName = {
  'zh-Hant': string;
  en: string;
};

export type PhaseId =
  | 'briefing'
  | 'explore'
  | 'review1'
  | 'review2'
  | 'finalVerdict'
  | 'debrief';

/** explore appears twice in the legal path; distinguished by exploreIndex. */
export type LabyrinthPhase =
  | { id: 'briefing' }
  | { id: 'explore'; exploreIndex: 1 | 2 }
  | { id: 'review1' }
  | { id: 'review2' }
  | { id: 'finalVerdict' }
  | { id: 'debrief' };

export type TileKind =
  | 'wall'
  | 'floor'
  | 'gate'
  | 'door'
  | 'spawn'
  | 'task'
  | 'scanner'
  | 'review';

export type RoomKind =
  | 'central'
  | 'corridor'
  | 'review'
  | 'scanner'
  | 'spawn'
  | 'task';

export type MapTile = {
  id: string;
  x: number;
  y: number;
  kind: TileKind;
  roomId: string;
  gateId?: GateId;
  doorId?: string;
  taskId?: string;
};

export type MapRoom = {
  id: string;
  name: LocalizedName;
  kind: RoomKind;
  entryGateId?: GateId;
};

export type MapGate = {
  id: GateId;
  tileId: string;
  fromRoomId: string;
  toRoomId: string;
};

export type MapDoor = {
  id: string;
  tileId: string;
  defaultOpen: boolean;
};

export type MapSpawn = {
  id: string;
  tileId: string;
  x: number;
  y: number;
};

export type MapTask = {
  id: string;
  tileId: string;
  roomId: string;
  requiredGateId: GateId;
};

export type LabyrinthMap = {
  mapVersion: string;
  width: number;
  height: number;
  visionRadius: number;
  rooms: MapRoom[];
  gates: MapGate[];
  doors: MapDoor[];
  spawns: MapSpawn[];
  tasks: MapTask[];
  scannerTileId: string;
  reviewRoomId: string;
  centralRoomId: string;
  tiles: MapTile[];
  /** Row-major; true = blocked (wall). Length = width * height. */
  collision: boolean[];
};

export type Vec2 = { x: number; y: number };

export type DoorState = ReadonlyMap<string, boolean>;

export type ActorPermissions = {
  odorId: LabyrinthOdorId;
  /** Authorized gates for the odor identity. */
  authorizedGates: ReadonlySet<GateId>;
  isPhantom: boolean;
  phaseShiftActive: boolean;
};

export type MoveFailureReason =
  | 'out_of_bounds'
  | 'blocked_wall'
  | 'door_closed'
  | 'gate_unauthorized'
  | 'not_adjacent'
  | 'phase_shift_required';

export type MoveResult =
  | {
      ok: true;
      to: Vec2;
      crossedGateId?: GateId;
      usedPhaseShift: boolean;
      artifactRequired: boolean;
    }
  | { ok: false; reason: MoveFailureReason };

export type EvidenceReliability = 'hard' | 'soft' | 'corrupted';

export type EvidenceSource =
  | 'scanner'
  | 'door_log'
  | 'witness'
  | 'task_system'
  | 'artifact_sensor'
  | 'channel_array';

export type TimeWindow = {
  startMs: number;
  endMs: number;
};

export type EvidenceBase = {
  id: string;
  source: EvidenceSource;
  timeWindow: TimeWindow;
  reliability: EvidenceReliability;
};

export type ObservedGateUseEvidence = EvidenceBase & {
  type: 'observedGateUse';
  playerId: string;
  gateId: GateId;
};

export type DoorLogEvidence = EvidenceBase & {
  type: 'doorLog';
  playerId: string;
  doorId: string;
  opened: boolean;
};

export type PositiveChannelEvidence = EvidenceBase & {
  type: 'positiveChannel';
  playerId: string;
  gateId: GateId;
};

export type NegativeChannelEvidence = EvidenceBase & {
  type: 'negativeChannel';
  playerId: string;
  gateId: GateId;
};

export type ArtifactTraceEvidence = EvidenceBase & {
  type: 'artifactTrace';
  playerId: string;
  gateId: GateId;
  x: number;
  y: number;
};

export type TaskPresenceEvidence = EvidenceBase & {
  type: 'taskPresence';
  playerId: string;
  taskId: string;
  requiredGateId: GateId;
};

export type EvidenceEvent =
  | ObservedGateUseEvidence
  | DoorLogEvidence
  | PositiveChannelEvidence
  | NegativeChannelEvidence
  | ArtifactTraceEvidence
  | TaskPresenceEvidence;

export type EvidenceType = EvidenceEvent['type'];

export type PlayerRoleAssignment = {
  playerId: string;
  odorId: LabyrinthOdorId;
  isPhantom: boolean;
  spawnId: string;
};

export type TaskPlacement = {
  taskId: string;
  enabled: boolean;
};

export type CaseTruth = {
  assignments: ReadonlyArray<{ playerId: string; odorId: LabyrinthOdorId }>;
  phantomPlayerId: string;
};

export type OfflineCase = {
  schemaVersion: string;
  seed: string;
  contentVersion: string;
  gameVersion: string;
  mapVersion: string;
  playerCount: number;
  playerRoles: PlayerRoleAssignment[];
  /** Offline NPC fillers (may be empty when all slots are human). */
  npcRoles: PlayerRoleAssignment[];
  phantomPlayerId: string;
  taskPlacement: TaskPlacement[];
  evidenceEvents: EvidenceEvent[];
  truth: CaseTruth;
};

export type SolutionAssignment = {
  assignments: ReadonlyArray<{ playerId: string; odorId: LabyrinthOdorId }>;
  phantomPlayerId: string;
};

export type WinSide = 'investigators' | 'phantom' | 'unresolved';

export type VerdictSubmission = {
  accusedPhantomPlayerId: string;
  /** Optional full identity map; if provided must match for full credit. */
  accusedAssignments?: ReadonlyArray<{ playerId: string; odorId: LabyrinthOdorId }>;
};
