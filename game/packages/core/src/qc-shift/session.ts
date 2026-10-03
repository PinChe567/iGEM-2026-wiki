import { createRng } from '../rng';
import { generateQcShiftScenarios } from './generator';
import { getQcShiftPreset, initialResources } from './presets';
import type {
  QcBatchState,
  QcShiftPresetId,
  QcShiftSession,
  QcShiftSessionMeta,
  QcShiftSessionMode,
} from './types';
import { QC_SHIFT_CONTENT_VERSION, QC_SHIFT_GAME_VERSION, QC_SHIFT_SEED_VERSION } from './versions';

export function createQcShiftPracticeSeed(nowMs: number = Date.now()): string {
  const rng = createRng(`qc-shift-practice-${nowMs}`);
  const part = () => Math.floor(rng() * 1e9).toString(36);
  const salt = Math.floor(Math.random() * 1e9).toString(36);
  return `qc-${part()}-${salt}`;
}

export function createQcShiftDailySeed(
  dateUTC: string,
  presetId: QcShiftPresetId,
  gameVersion = QC_SHIFT_GAME_VERSION,
): string {
  return `qcd-${dateUTC}-v${gameVersion}-${presetId}`;
}

export function todayUTC(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function buildQcShiftSessionMeta(args: {
  seed: string;
  mode: QcShiftSessionMode;
  presetId: QcShiftPresetId;
  contentVersion?: string;
}): QcShiftSessionMeta {
  return {
    seed: args.seed,
    seedVersion: QC_SHIFT_SEED_VERSION,
    contentVersion: args.contentVersion ?? QC_SHIFT_CONTENT_VERSION,
    gameVersion: QC_SHIFT_GAME_VERSION,
    mode: args.mode,
    presetId: args.presetId,
  };
}

function initialBatchStates(sessionLike: Pick<QcShiftSession, 'scenarios'>): QcBatchState[] {
  return sessionLike.scenarios.map((scenario) => ({
    scenarioId: scenario.id,
    retestUsed: false,
    resolved: false,
    terminalAction: null,
    currentReading: {
      ...scenario.initialReading,
      qcFlags: [...scenario.initialReading.qcFlags],
    },
  }));
}

export function buildQcShiftSession(args: {
  seed: string;
  presetId: QcShiftPresetId;
  mode?: QcShiftSessionMode;
  contentVersion?: string;
}): QcShiftSession {
  const settings = getQcShiftPreset(args.presetId);
  const scenarios = generateQcShiftScenarios({ seed: args.seed, presetId: args.presetId });
  const meta = buildQcShiftSessionMeta({
    seed: args.seed,
    mode: args.mode ?? 'practice',
    presetId: args.presetId,
    contentVersion: args.contentVersion,
  });
  const session: QcShiftSession = {
    meta,
    settings,
    scenarios,
    play: {
      batchIndex: 0,
      batchStates: [],
      resources: initialResources(settings),
      log: [],
      status: 'playing',
    },
  };
  session.play.batchStates = initialBatchStates(session);
  return session;
}

export function buildQcShiftPracticeSession(args: {
  presetId: QcShiftPresetId;
  seed?: string;
  contentVersion?: string;
}): QcShiftSession {
  return buildQcShiftSession({
    seed: args.seed ?? createQcShiftPracticeSeed(),
    presetId: args.presetId,
    mode: 'practice',
    contentVersion: args.contentVersion,
  });
}

export function buildQcShiftDailySession(args: {
  presetId: QcShiftPresetId;
  dateUTC?: string;
  contentVersion?: string;
}): QcShiftSession {
  const dateUTC = args.dateUTC ?? todayUTC();
  return buildQcShiftSession({
    seed: createQcShiftDailySeed(dateUTC, args.presetId),
    presetId: args.presetId,
    mode: 'daily',
    contentVersion: args.contentVersion,
  });
}

export function replayQcShiftSession(session: QcShiftSession): QcShiftSession {
  return buildQcShiftSession({
    seed: session.meta.seed,
    presetId: session.meta.presetId,
    mode: session.meta.mode,
    contentVersion: session.meta.contentVersion,
  });
}

export function currentQcScenario(session: QcShiftSession) {
  if (session.play.status === 'complete') return undefined;
  return session.scenarios[session.play.batchIndex];
}
