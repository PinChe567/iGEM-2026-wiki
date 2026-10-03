import {
  BRIEFING_PHASE_MS,
  EXPLORE_PHASE_MS,
  REVIEW_PHASE_MS,
  VERDICT_PHASE_MS,
} from './constants';
import type {
  CaseTruth,
  LabyrinthPhase,
  VerdictSubmission,
  WinSide,
} from './types';

export type PhaseTimer = {
  phase: LabyrinthPhase;
  startedAtMs: number;
  durationMs: number;
  endsAtMs: number;
};

export type MachineState = {
  phase: LabyrinthPhase;
  timer: PhaseTimer;
  verdict: VerdictSubmission | null;
  winSide: WinSide;
};

export type TransitionEvent =
  | { type: 'TIMER_ELAPSED' }
  | { type: 'ADVANCE' }
  | { type: 'SUBMIT_VERDICT'; verdict: VerdictSubmission }
  | { type: 'FORCE_DEBRIEF' };

export type TransitionResult =
  | { ok: true; state: MachineState }
  | { ok: false; reason: 'illegal_transition' | 'wrong_phase' | 'already_terminal' };

function durationFor(phase: LabyrinthPhase): number {
  switch (phase.id) {
    case 'briefing':
      return BRIEFING_PHASE_MS;
    case 'explore':
      return EXPLORE_PHASE_MS;
    case 'review1':
    case 'review2':
      return REVIEW_PHASE_MS;
    case 'finalVerdict':
      return VERDICT_PHASE_MS;
    case 'debrief':
      return Number.POSITIVE_INFINITY;
  }
}

export function makeTimer(phase: LabyrinthPhase, nowMs: number): PhaseTimer {
  const durationMs = durationFor(phase);
  return {
    phase,
    startedAtMs: nowMs,
    durationMs,
    endsAtMs: Number.isFinite(durationMs) ? nowMs + durationMs : Number.POSITIVE_INFINITY,
  };
}

export function createInitialMachineState(nowMs: number): MachineState {
  const phase: LabyrinthPhase = { id: 'briefing' };
  return {
    phase,
    timer: makeTimer(phase, nowMs),
    verdict: null,
    winSide: 'unresolved',
  };
}

/** Legal linear path: briefing → explore(1) → review1 → explore(2) → review2 → finalVerdict → debrief */
export function nextPhase(phase: LabyrinthPhase): LabyrinthPhase | null {
  switch (phase.id) {
    case 'briefing':
      return { id: 'explore', exploreIndex: 1 };
    case 'explore':
      return phase.exploreIndex === 1 ? { id: 'review1' } : { id: 'review2' };
    case 'review1':
      return { id: 'explore', exploreIndex: 2 };
    case 'review2':
      return { id: 'finalVerdict' };
    case 'finalVerdict':
      return { id: 'debrief' };
    case 'debrief':
      return null;
  }
}

export function isExplorePhase(phase: LabyrinthPhase): boolean {
  return phase.id === 'explore';
}

export function isTerminal(phase: LabyrinthPhase): boolean {
  return phase.id === 'debrief';
}

export function resolveWinSide(
  truth: CaseTruth,
  verdict: VerdictSubmission,
): WinSide {
  if (verdict.accusedPhantomPlayerId !== truth.phantomPlayerId) {
    return 'phantom';
  }
  if (verdict.accusedAssignments) {
    const truthMap = new Map(truth.assignments.map((a) => [a.playerId, a.odorId]));
    for (const row of verdict.accusedAssignments) {
      if (truthMap.get(row.playerId) !== row.odorId) return 'phantom';
    }
    if (verdict.accusedAssignments.length !== truth.assignments.length) {
      return 'phantom';
    }
  }
  return 'investigators';
}

export function applyTransition(
  state: MachineState,
  event: TransitionEvent,
  nowMs: number,
  truth?: CaseTruth,
): TransitionResult {
  if (isTerminal(state.phase) && event.type !== 'FORCE_DEBRIEF') {
    return { ok: false, reason: 'already_terminal' };
  }

  switch (event.type) {
    case 'FORCE_DEBRIEF': {
      const phase: LabyrinthPhase = { id: 'debrief' };
      return {
        ok: true,
        state: {
          ...state,
          phase,
          timer: makeTimer(phase, nowMs),
          winSide:
            state.verdict && truth
              ? resolveWinSide(truth, state.verdict)
              : state.winSide,
        },
      };
    }
    case 'SUBMIT_VERDICT': {
      if (state.phase.id !== 'finalVerdict') {
        return { ok: false, reason: 'wrong_phase' };
      }
      if (!truth) {
        return { ok: false, reason: 'illegal_transition' };
      }
      const phase: LabyrinthPhase = { id: 'debrief' };
      return {
        ok: true,
        state: {
          phase,
          timer: makeTimer(phase, nowMs),
          verdict: event.verdict,
          winSide: resolveWinSide(truth, event.verdict),
        },
      };
    }
    case 'TIMER_ELAPSED':
    case 'ADVANCE': {
      if (event.type === 'TIMER_ELAPSED' && nowMs < state.timer.endsAtMs) {
        return { ok: false, reason: 'illegal_transition' };
      }
      if (state.phase.id === 'finalVerdict' && event.type === 'TIMER_ELAPSED') {
        // Timer expiry without verdict → unresolved debrief (phantom escape by silence).
        const phase: LabyrinthPhase = { id: 'debrief' };
        return {
          ok: true,
          state: {
            ...state,
            phase,
            timer: makeTimer(phase, nowMs),
            winSide: 'phantom',
          },
        };
      }
      const nxt = nextPhase(state.phase);
      if (!nxt) return { ok: false, reason: 'illegal_transition' };
      return {
        ok: true,
        state: {
          ...state,
          phase: nxt,
          timer: makeTimer(nxt, nowMs),
        },
      };
    }
  }
}

/** Reject any phase jump that is not the single legal successor. */
export function assertLegalPhaseEdge(from: LabyrinthPhase, to: LabyrinthPhase): boolean {
  const nxt = nextPhase(from);
  if (!nxt) return false;
  if (nxt.id !== to.id) return false;
  if (nxt.id === 'explore' && to.id === 'explore') {
    return nxt.exploreIndex === to.exploreIndex;
  }
  return true;
}
