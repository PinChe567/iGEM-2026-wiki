import { isAuthorizedGate, LABYRINTH_ODOR_IDS, type LabyrinthOdorId } from '../role-gates';
import type {
  EvidenceEvent,
  SolutionAssignment,
} from '../types';

export type SolverInput = {
  playerIds: readonly string[];
  /** Odors that may be assigned (usually all 8, or a fixed pool). */
  odorPool: readonly LabyrinthOdorId[];
  evidence: readonly EvidenceEvent[];
};

function assignmentsEqual(a: SolutionAssignment, b: SolutionAssignment): boolean {
  if (a.phantomPlayerId !== b.phantomPlayerId) return false;
  if (a.assignments.length !== b.assignments.length) return false;
  const map = new Map(a.assignments.map((row) => [row.playerId, row.odorId]));
  return b.assignments.every((row) => map.get(row.playerId) === row.odorId);
}

function consistentWithEvidence(
  assignment: Map<string, LabyrinthOdorId>,
  phantomPlayerId: string,
  evidence: readonly EvidenceEvent[],
): boolean {
  for (const ev of evidence) {
    if (ev.reliability === 'corrupted') {
      // Corrupted evidence does not constrain (MVP: jam marks window, no lies).
      continue;
    }
    switch (ev.type) {
      case 'positiveChannel': {
        const odor = assignment.get(ev.playerId);
        if (!odor || !isAuthorizedGate(odor, ev.gateId)) return false;
        break;
      }
      case 'negativeChannel': {
        const odor = assignment.get(ev.playerId);
        if (!odor || isAuthorizedGate(odor, ev.gateId)) return false;
        break;
      }
      case 'observedGateUse': {
        const odor = assignment.get(ev.playerId);
        if (!odor) return false;
        if (!isAuthorizedGate(odor, ev.gateId) && ev.playerId !== phantomPlayerId) {
          return false;
        }
        break;
      }
      case 'artifactTrace': {
        if (ev.playerId !== phantomPlayerId) return false;
        break;
      }
      case 'taskPresence': {
        const odor = assignment.get(ev.playerId);
        if (!odor) return false;
        if (
          !isAuthorizedGate(odor, ev.requiredGateId) &&
          ev.playerId !== phantomPlayerId
        ) {
          return false;
        }
        break;
      }
      case 'doorLog': {
        // Door logs do not constrain odor identity in MVP.
        break;
      }
      default: {
        const _exhaustive: never = ev;
        return _exhaustive;
      }
    }
  }
  return true;
}

function* permutations<T>(items: readonly T[]): Generator<T[]> {
  const arr = [...items];
  if (arr.length === 0) {
    yield [];
    return;
  }
  for (let i = 0; i < arr.length; i += 1) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      yield [arr[i]!, ...perm];
    }
  }
}

function* combinations<T>(items: readonly T[], k: number): Generator<T[]> {
  if (k === 0) {
    yield [];
    return;
  }
  if (k > items.length) return;
  for (let i = 0; i <= items.length - k; i += 1) {
    const head = items[i]!;
    for (const tail of combinations(items.slice(i + 1), k - 1)) {
      yield [head, ...tail];
    }
  }
}

/**
 * Enumerate every injective odor assignment + phantom choice consistent with evidence.
 * Does not secretly pick among multiple solutions — callers must reject multi-solution cases.
 */
export function enumerateSolutions(input: SolverInput): SolutionAssignment[] {
  const { playerIds, odorPool, evidence } = input;
  const n = playerIds.length;
  if (n < 1 || odorPool.length < n) return [];

  const solutions: SolutionAssignment[] = [];

  for (const odorCombo of combinations(odorPool, n)) {
    for (const odorPerm of permutations(odorCombo)) {
      const assignment = new Map<string, LabyrinthOdorId>();
      playerIds.forEach((playerId, index) => {
        assignment.set(playerId, odorPerm[index]!);
      });
      for (const phantomPlayerId of playerIds) {
        if (!consistentWithEvidence(assignment, phantomPlayerId, evidence)) {
          continue;
        }
        solutions.push({
          phantomPlayerId,
          assignments: playerIds.map((playerId) => ({
            playerId,
            odorId: assignment.get(playerId)!,
          })),
        });
      }
    }
  }

  return solutions;
}

export function countSolutions(input: SolverInput): number {
  return enumerateSolutions(input).length;
}

export function hasUniqueSolution(input: SolverInput): boolean {
  return countSolutions(input) === 1;
}

export function uniqueSolutionOrNull(input: SolverInput): SolutionAssignment | null {
  const solutions = enumerateSolutions(input);
  return solutions.length === 1 ? solutions[0]! : null;
}

export function solutionMatchesTruth(
  solution: SolutionAssignment,
  truth: SolutionAssignment,
): boolean {
  return assignmentsEqual(solution, truth);
}

export function defaultOdorPool(): readonly LabyrinthOdorId[] {
  return LABYRINTH_ODOR_IDS;
}
