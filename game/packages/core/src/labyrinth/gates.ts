import type { GateId } from './role-gates';
import { isAuthorizedGate } from './role-gates';
import type { ActorPermissions } from './types';

export type GatePassageDecision =
  | { allowed: true; usedPhaseShift: boolean; artifactRequired: boolean }
  | { allowed: false; reason: 'gate_unauthorized' | 'phase_shift_required' };

/**
 * Pure gate permission check. UI / NPC controllers must call this before crossing.
 * Unauthorized passage is only allowed for an active phantom phaseShift, and always
 * requires leaving an artifact.
 */
export function canPassGate(
  actor: ActorPermissions,
  gateId: GateId,
): GatePassageDecision {
  if (actor.authorizedGates.has(gateId) || isAuthorizedGate(actor.odorId, gateId)) {
    return { allowed: true, usedPhaseShift: false, artifactRequired: false };
  }
  if (actor.isPhantom && actor.phaseShiftActive) {
    return { allowed: true, usedPhaseShift: true, artifactRequired: true };
  }
  if (actor.isPhantom && !actor.phaseShiftActive) {
    return { allowed: false, reason: 'phase_shift_required' };
  }
  return { allowed: false, reason: 'gate_unauthorized' };
}
