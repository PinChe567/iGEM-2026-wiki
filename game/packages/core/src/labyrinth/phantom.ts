import {
  PHASE_SHIFT_ARTIFACT_MS,
  PHASE_SHIFT_COOLDOWN_MS,
  PHASE_SHIFT_DURATION_MS,
  SIGNAL_JAM_COOLDOWN_MS,
  SIGNAL_JAM_CORRUPTION_MS,
  SIGNAL_JAM_DURATION_MS,
} from './constants';

export type PhantomAbilityId = 'phaseShift' | 'signalJam';

export type PhantomAbilityState = {
  phaseShiftActiveUntil: number;
  phaseShiftCooldownUntil: number;
  signalJamActiveUntil: number;
  signalJamCooldownUntil: number;
  /** Artifact traces expire at these timestamps (gate tile keys). */
  artifacts: Array<{ key: string; expiresAt: number; gateId: string; x: number; y: number }>;
  /** Corruption window end (scanner/channel evidence tainted). */
  corruptionUntil: number;
};

export function createPhantomAbilityState(): PhantomAbilityState {
  return {
    phaseShiftActiveUntil: 0,
    phaseShiftCooldownUntil: 0,
    signalJamActiveUntil: 0,
    signalJamCooldownUntil: 0,
    artifacts: [],
    corruptionUntil: 0,
  };
}

export function isPhaseShiftActive(state: PhantomAbilityState, nowMs: number): boolean {
  return nowMs < state.phaseShiftActiveUntil;
}

export function isSignalJamActive(state: PhantomAbilityState, nowMs: number): boolean {
  return nowMs < state.signalJamActiveUntil;
}

export function isCorrupted(state: PhantomAbilityState, nowMs: number): boolean {
  return nowMs < state.corruptionUntil;
}

export type ActivateResult =
  | { ok: true; state: PhantomAbilityState }
  | { ok: false; reason: 'on_cooldown' | 'already_active' };

export function activatePhaseShift(
  state: PhantomAbilityState,
  nowMs: number,
): ActivateResult {
  if (nowMs < state.phaseShiftCooldownUntil) {
    return { ok: false, reason: 'on_cooldown' };
  }
  if (isPhaseShiftActive(state, nowMs)) {
    return { ok: false, reason: 'already_active' };
  }
  return {
    ok: true,
    state: {
      ...state,
      phaseShiftActiveUntil: nowMs + PHASE_SHIFT_DURATION_MS,
      phaseShiftCooldownUntil: nowMs + PHASE_SHIFT_COOLDOWN_MS,
    },
  };
}

export function activateSignalJam(
  state: PhantomAbilityState,
  nowMs: number,
): ActivateResult {
  if (nowMs < state.signalJamCooldownUntil) {
    return { ok: false, reason: 'on_cooldown' };
  }
  if (isSignalJamActive(state, nowMs)) {
    return { ok: false, reason: 'already_active' };
  }
  return {
    ok: true,
    state: {
      ...state,
      signalJamActiveUntil: nowMs + SIGNAL_JAM_DURATION_MS,
      signalJamCooldownUntil: nowMs + SIGNAL_JAM_COOLDOWN_MS,
      corruptionUntil: nowMs + SIGNAL_JAM_CORRUPTION_MS,
    },
  };
}

/** Record artifact after unauthorized gate passage via phaseShift. */
export function leavePhaseShiftArtifact(
  state: PhantomAbilityState,
  nowMs: number,
  info: { gateId: string; x: number; y: number },
): PhantomAbilityState {
  const key = `${info.gateId}:${info.x},${info.y}:${nowMs}`;
  const artifacts = state.artifacts.filter((a) => a.expiresAt > nowMs);
  artifacts.push({
    key,
    expiresAt: nowMs + PHASE_SHIFT_ARTIFACT_MS,
    gateId: info.gateId,
    x: info.x,
    y: info.y,
  });
  return { ...state, artifacts };
}

export function activeArtifacts(state: PhantomAbilityState, nowMs: number) {
  return state.artifacts.filter((a) => a.expiresAt > nowMs);
}

export const PHANTOM_TIMINGS = {
  PHASE_SHIFT_DURATION_MS,
  PHASE_SHIFT_COOLDOWN_MS,
  PHASE_SHIFT_ARTIFACT_MS,
  SIGNAL_JAM_DURATION_MS,
  SIGNAL_JAM_COOLDOWN_MS,
  SIGNAL_JAM_CORRUPTION_MS,
} as const;
