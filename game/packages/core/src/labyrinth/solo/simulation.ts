/**
 * Headless solo simulation for fairness checks.
 * Same seed ⇒ same truth + high-level NPC plans (frame timing must not alter truth).
 */

import { defaultDoorState } from '../movement';
import { MAP_V1 } from '../map/load';
import { countSolutions, defaultOdorPool } from '../solver/constraint-solver';
import {
  generateSoloOfficialCase,
  type SoloCase,
} from './case';
import { createNpcRuntimes, tickNpcs, type NpcRuntime } from './npc';

export type HeadlessSimResult = {
  seed: string;
  ok: boolean;
  issues: string[];
  solo: SoloCase | null;
  evidenceCollected: number;
  maxStuck: number;
  illegalGateByNonPhantom: boolean;
  uniqueFinal: boolean;
};

const SIM_MS = 300_000; // 5 min AI budget to produce evidence
const STEP_MS = 400;

/**
 * Fast-forward NPCs; inject case full-evidence as the obtainable ceiling,
 * while also verifying live NPC actions stay legal.
 */
export function runHeadlessSoloCase(seed: string): HeadlessSimResult {
  const issues: string[] = [];
  const gen = generateSoloOfficialCase({ seed, contentVersion: '1.0.0' });
  if (!gen.ok) {
    return {
      seed,
      ok: false,
      issues: [`case_gen:${gen.reason}`],
      solo: null,
      evidenceCollected: 0,
      maxStuck: 0,
      illegalGateByNonPhantom: false,
      uniqueFinal: false,
    };
  }
  const solo = gen.case;
  if (solo.phantomPlayerId === solo.humanPlayerId) {
    issues.push('phantom_on_human');
  }

  let npcs: NpcRuntime[] = createNpcRuntimes(solo);
  let doors = defaultDoorState(MAP_V1);
  const seq = { n: 0 };
  let maxStuck = 0;
  const liveEvidenceIds = new Set<string>();

  for (let t = 0; t < SIM_MS; t += STEP_MS) {
    const stepped = tickNpcs(npcs, doors, t, seq);
    npcs = stepped.npcs;
    doors = stepped.doors;
    for (const ev of stepped.events) {
      if (ev.type === 'evidence') liveEvidenceIds.add(ev.evidence.id);
    }
    for (const npc of npcs) {
      maxStuck = Math.max(maxStuck, npc.stuckFrames);
    }
  }

  const illegalGateByNonPhantom = npcs.some(
    (n) => !n.isPhantom && n.illegalGateUses > 0,
  );
  if (illegalGateByNonPhantom) issues.push('non_phantom_illegal_gate');
  if (maxStuck > 120) issues.push(`permanent_stuck:${maxStuck}`);

  // Official uniqueness uses the case's full obtainable evidence (Prompt 03 rule).
  const uniqueFinal =
    countSolutions({
      playerIds: solo.playerRoles.map((r) => r.playerId),
      odorPool: defaultOdorPool(),
      evidence: solo.evidenceEvents,
    }) === 1;
  if (!uniqueFinal) issues.push('non_unique_final');

  // Phantom must have a plan that includes illegal gate / jam / sabotage
  const phantomPlan = solo.plans.find((p) => p.npcId === solo.phantomPlayerId);
  const hasSabotage = phantomPlan?.goals.some(
    (g) =>
      g.kind === 'phantom_illegal_gate' ||
      g.kind === 'phantom_jam' ||
      g.kind === 'phantom_sabotage_door',
  );
  if (!hasSabotage) issues.push('phantom_plan_missing');

  // Required evidence present on case
  if (solo.requiredEvidenceIds.length < 10) issues.push('too_little_evidence');

  return {
    seed,
    ok: issues.length === 0,
    issues,
    solo,
    evidenceCollected: liveEvidenceIds.size + solo.evidenceEvents.length,
    maxStuck,
    illegalGateByNonPhantom,
    uniqueFinal,
  };
}

export function runHeadlessSoloBatch(
  count: number,
  seedPrefix = 'solo-fair',
): {
  passed: number;
  failed: HeadlessSimResult[];
} {
  const failed: HeadlessSimResult[] = [];
  let passed = 0;
  for (let i = 0; i < count; i += 1) {
    const result = runHeadlessSoloCase(`${seedPrefix}-${i}`);
    if (result.ok) passed += 1;
    else failed.push(result);
  }
  return { passed, failed };
}

/** Assert same seed yields identical truth + plan fingerprints. */
export function soloPlanFingerprint(solo: SoloCase): string {
  return JSON.stringify({
    truth: solo.truth,
    plans: solo.plans,
    statements: solo.statements,
    humanTaskKinds: solo.humanTaskKinds,
  });
}
