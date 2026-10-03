/**
 * Deterministic mini-task logic (5–12s). UI drives input; core validates completion.
 */

import { createRng, randomInt } from '../../rng';
import type { SoloTaskKind } from './constants';

export type TaskSessionBase = {
  kind: SoloTaskKind;
  seed: string;
  started: boolean;
  completed: boolean;
  aborted: boolean;
  elapsedMs: number;
  durationMs: number;
};

export type PatternPairTask = TaskSessionBase & {
  kind: 'patternPair';
  left: string;
  options: string[];
  answerIndex: number;
  selectedIndex: number | null;
  lastMiss: boolean;
};

export type SignalRoutingTask = TaskSessionBase & {
  kind: 'signalRouting';
  /** Ordered node ids player must activate 0..n-1 */
  path: number[];
  cursor: number;
  /** Set when player presses a wrong node (UI can show feedback). */
  lastMiss: boolean;
};

export type CalibrationHoldTask = TaskSessionBase & {
  kind: 'calibrationHold';
  holdMs: number;
  heldMs: number;
  holding: boolean;
};

export type MemoryOrderTask = TaskSessionBase & {
  kind: 'memoryOrder';
  sequence: number[];
  input: number[];
  revealMs: number;
};

export type SoloTaskSession =
  | PatternPairTask
  | SignalRoutingTask
  | CalibrationHoldTask
  | MemoryOrderTask;

const PATTERNS = ['αβ', 'βγ', 'γδ', 'δε', 'εζ', 'ζη'] as const;

export function createSoloTask(kind: SoloTaskKind, seed: string): SoloTaskSession {
  const rng = createRng(`task:${kind}:${seed}`);
  const durationMs = 5_000 + randomInt(rng, 7_000);

  switch (kind) {
    case 'patternPair': {
      const answerIndex = randomInt(rng, 3);
      const left = PATTERNS[randomInt(rng, PATTERNS.length)]!;
      const options = [left, left, left];
      const decoys = PATTERNS.filter((p) => p !== left);
      options[0] = decoys[randomInt(rng, decoys.length)]!;
      options[1] = decoys[randomInt(rng, decoys.length)]!;
      options[2] = decoys[randomInt(rng, decoys.length)]!;
      options[answerIndex] = left;
      return {
        kind,
        seed,
        started: true,
        completed: false,
        aborted: false,
        elapsedMs: 0,
        durationMs,
        left,
        options,
        answerIndex,
        selectedIndex: null,
        lastMiss: false,
      };
    }
    case 'signalRouting': {
      const path = [0, 1, 2, 3];
      return {
        kind,
        seed,
        started: true,
        completed: false,
        aborted: false,
        elapsedMs: 0,
        durationMs,
        path,
        cursor: 0,
        lastMiss: false,
      };
    }
    case 'calibrationHold': {
      return {
        kind,
        seed,
        started: true,
        completed: false,
        aborted: false,
        elapsedMs: 0,
        durationMs,
        holdMs: 2_000 + randomInt(rng, 2_000),
        heldMs: 0,
        holding: false,
      };
    }
    case 'memoryOrder': {
      const sequence = [1, 2, 3, 4].map(() => 1 + randomInt(rng, 4));
      return {
        kind,
        seed,
        started: true,
        completed: false,
        aborted: false,
        elapsedMs: 0,
        durationMs,
        sequence,
        input: [],
        revealMs: 1_800,
      };
    }
  }
}

export type TaskInput =
  | { type: 'select'; index: number }
  | { type: 'route'; node: number }
  | { type: 'hold'; down: boolean }
  | { type: 'memory'; value: number }
  | { type: 'abort' };

export function applyTaskInput(
  task: SoloTaskSession,
  input: TaskInput,
): SoloTaskSession {
  if (task.completed || task.aborted) return task;
  if (input.type === 'abort') return { ...task, aborted: true };

  switch (task.kind) {
    case 'patternPair': {
      if (input.type !== 'select') return task;
      const selectedIndex = input.index;
      const completed = selectedIndex === task.answerIndex;
      return {
        ...task,
        selectedIndex,
        completed,
        lastMiss: !completed,
      };
    }
    case 'signalRouting': {
      if (input.type !== 'route') return task;
      if (input.node !== task.path[task.cursor]) {
        return { ...task, lastMiss: true };
      }
      const cursor = task.cursor + 1;
      return {
        ...task,
        cursor,
        completed: cursor >= task.path.length,
        lastMiss: false,
      };
    }
    case 'calibrationHold': {
      if (input.type !== 'hold') return task;
      return { ...task, holding: input.down };
    }
    case 'memoryOrder': {
      if (input.type !== 'memory') return task;
      if (task.elapsedMs < task.revealMs) return task;
      const inputArr = [...task.input, input.value];
      const completed =
        inputArr.length === task.sequence.length &&
        inputArr.every((v, i) => v === task.sequence[i]);
      const aborted =
        inputArr.length <= task.sequence.length &&
        inputArr.some((v, i) => task.sequence[i] !== undefined && v !== task.sequence[i]);
      return {
        ...task,
        input: inputArr,
        completed,
        aborted: aborted && !completed,
      };
    }
  }
}

export function tickSoloTask(task: SoloTaskSession, dtMs: number): SoloTaskSession {
  if (task.completed || task.aborted) return task;
  let next = { ...task, elapsedMs: task.elapsedMs + dtMs };
  if (next.kind === 'calibrationHold' && next.holding) {
    next = { ...next, heldMs: next.heldMs + dtMs };
    if (next.heldMs >= next.holdMs) {
      next = { ...next, completed: true };
    }
  }
  if (next.elapsedMs >= next.durationMs && !next.completed) {
    next = { ...next, aborted: true };
  }
  return next;
}
