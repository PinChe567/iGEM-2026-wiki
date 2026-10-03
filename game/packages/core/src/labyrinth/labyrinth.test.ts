import { describe, expect, it } from 'vitest';
import { LABYRINTH_CONTENT_VERSION, LABYRINTH_ROLES } from '@suite/content';
import {
  ALL_GATE_IDS,
  ROLE_GATE_TABLE,
  LABYRINTH_ODOR_IDS,
  authorizedGates,
  MAP_V1,
  validateMap,
  legalTaskCountForRole,
  tryMove,
  canPassGate,
  defaultDoorState,
  createPhantomAbilityState,
  activatePhaseShift,
  activateSignalJam,
  leavePhaseShiftArtifact,
  isPhaseShiftActive,
  isCorrupted,
  activeArtifacts,
  PHASE_SHIFT_COOLDOWN_MS,
  PHASE_SHIFT_ARTIFACT_MS,
  SIGNAL_JAM_COOLDOWN_MS,
  createInitialMachineState,
  applyTransition,
  assertLegalPhaseEdge,
  nextPhase,
  generateOfficialCase,
  enumerateSolutions,
  hasUniqueSolution,
  buildFullEvidence,
  assertValidOfflineCase,
  MIN_LEGAL_TASKS_REACHABLE,
} from './index';
import type { ActorPermissions, LabyrinthPhase } from './types';

describe('labyrinth gate distribution', () => {
  it('matches the eight fixed identity triples', () => {
    expect(ROLE_GATE_TABLE).toEqual({
      banana: ['A', 'B', 'D'],
      lemon: ['A', 'C', 'F'],
      rose: ['B', 'C', 'E'],
      coffee: ['B', 'D', 'F'],
      mint: ['A', 'C', 'E'],
      garlic: ['D', 'E', 'F'],
      peach: ['A', 'E', 'F'],
      pine: ['B', 'C', 'D'],
    });
  });

  it('stays in lockstep with @suite/content roles', () => {
    for (const role of LABYRINTH_ROLES) {
      expect([...ROLE_GATE_TABLE[role.id]]).toEqual([...role.gates]);
      expect(role.fictionalModel).toBe(true);
    }
  });
});

describe('map validator + reachability', () => {
  it('validates map-v1', () => {
    const result = validateMap(MAP_V1);
    if (!result.ok) {
      console.error(result.issues);
    }
    expect(result.ok).toBe(true);
    expect(MAP_V1.rooms.length).toBeGreaterThanOrEqual(10);
    expect(MAP_V1.gates.map((g) => g.id).sort().join('')).toBe(
      ALL_GATE_IDS.join(''),
    );
  });

  it('each role reaches central, review, and ≥3 legal tasks from every spawn', () => {
    for (const odorId of LABYRINTH_ODOR_IDS) {
      for (const spawn of MAP_V1.spawns) {
        const origin = { x: spawn.x, y: spawn.y };
        const legal = legalTaskCountForRole(MAP_V1, origin, odorId);
        expect(legal, `${odorId} @ ${spawn.id}`).toBeGreaterThanOrEqual(
          MIN_LEGAL_TASKS_REACHABLE,
        );
      }
    }
  });
});

describe('movement / gate permissions', () => {
  const doors = defaultDoorState(MAP_V1);
  const gateA = MAP_V1.tiles.find((t) => t.gateId === 'A')!;
  const from = { x: gateA.x, y: gateA.y + 1 };
  const to = { x: gateA.x, y: gateA.y };

  function actor(
    odorId: keyof typeof ROLE_GATE_TABLE,
    opts?: { phantom?: boolean; phase?: boolean },
  ): ActorPermissions {
    return {
      odorId,
      authorizedGates: authorizedGates(odorId),
      isPhantom: Boolean(opts?.phantom),
      phaseShiftActive: Boolean(opts?.phase),
    };
  }

  it('rejects unauthorized gate for a legal role', () => {
    // garlic = DEF — cannot use A
    const decision = canPassGate(actor('garlic'), 'A');
    expect(decision.allowed).toBe(false);
    const move = tryMove(MAP_V1, from, to, actor('garlic'), doors);
    expect(move.ok).toBe(false);
    if (!move.ok) expect(move.reason).toBe('gate_unauthorized');
  });

  it('allows authorized gate without artifact', () => {
    const move = tryMove(MAP_V1, from, to, actor('banana'), doors);
    expect(move.ok).toBe(true);
    if (move.ok) {
      expect(move.usedPhaseShift).toBe(false);
      expect(move.artifactRequired).toBe(false);
    }
  });

  it('phantom may pass unauthorized gate only while phaseShift is active and must leave artifact', () => {
    const blocked = tryMove(
      MAP_V1,
      from,
      to,
      actor('garlic', { phantom: true, phase: false }),
      doors,
    );
    expect(blocked.ok).toBe(false);

    const allowed = tryMove(
      MAP_V1,
      from,
      to,
      actor('garlic', { phantom: true, phase: true }),
      doors,
    );
    expect(allowed.ok).toBe(true);
    if (allowed.ok) {
      expect(allowed.usedPhaseShift).toBe(true);
      expect(allowed.artifactRequired).toBe(true);
    }
  });
});

describe('phantom abilities', () => {
  it('enforces phaseShift cooldown, artifact lifetime, and signalJam corruption', () => {
    let state = createPhantomAbilityState();
    const t0 = 1_000_000;
    const act = activatePhaseShift(state, t0);
    expect(act.ok).toBe(true);
    if (!act.ok) return;
    state = act.state;
    expect(isPhaseShiftActive(state, t0 + 100)).toBe(true);

    const again = activatePhaseShift(state, t0 + 100);
    expect(again.ok).toBe(false);

    state = leavePhaseShiftArtifact(state, t0 + 200, {
      gateId: 'A',
      x: 6,
      y: 5,
    });
    expect(activeArtifacts(state, t0 + 200).length).toBe(1);
    expect(activeArtifacts(state, t0 + 200 + PHASE_SHIFT_ARTIFACT_MS).length).toBe(0);

    expect(activatePhaseShift(state, t0 + PHASE_SHIFT_COOLDOWN_MS - 1).ok).toBe(
      false,
    );
    expect(activatePhaseShift(state, t0 + PHASE_SHIFT_COOLDOWN_MS).ok).toBe(true);

    let jamState = createPhantomAbilityState();
    const jam = activateSignalJam(jamState, t0);
    expect(jam.ok).toBe(true);
    if (!jam.ok) return;
    jamState = jam.state;
    expect(isCorrupted(jamState, t0 + 100)).toBe(true);
    expect(activateSignalJam(jamState, t0 + 100).ok).toBe(false);
    expect(
      activateSignalJam(jamState, t0 + SIGNAL_JAM_COOLDOWN_MS).ok,
    ).toBe(true);
  });
});

describe('state machine', () => {
  it('follows briefing → explore → review1 → explore → review2 → finalVerdict → debrief', () => {
    let state = createInitialMachineState(0);
    const path: string[] = [state.phase.id];
    const truth = {
      phantomPlayerId: 'P1',
      assignments: [
        { playerId: 'P1', odorId: 'banana' as const },
        { playerId: 'P2', odorId: 'lemon' as const },
        { playerId: 'P3', odorId: 'rose' as const },
        { playerId: 'P4', odorId: 'coffee' as const },
      ],
    };

    // Advance through explore1, review1, explore2, review2
    for (let i = 0; i < 4; i += 1) {
      const nxt = nextPhase(state.phase)!;
      expect(assertLegalPhaseEdge(state.phase, nxt)).toBe(true);
      const advanced = applyTransition(
        state,
        { type: 'ADVANCE' },
        state.timer.endsAtMs,
      );
      expect(advanced.ok).toBe(true);
      if (!advanced.ok) return;
      state = advanced.state;
      path.push(
        state.phase.id === 'explore'
          ? `explore:${state.phase.exploreIndex}`
          : state.phase.id,
      );
    }
    expect(path).toEqual([
      'briefing',
      'explore:1',
      'review1',
      'explore:2',
      'review2',
    ]);

    const toVerdict = applyTransition(
      state,
      { type: 'ADVANCE' },
      state.timer.endsAtMs,
    );
    expect(toVerdict.ok).toBe(true);
    if (!toVerdict.ok) return;
    state = toVerdict.state;
    expect(state.phase.id).toBe('finalVerdict');

    // Illegal: cannot submit during explore
    const illegal: LabyrinthPhase = { id: 'explore', exploreIndex: 1 };
    const early = createInitialMachineState(0);
    early.phase = illegal;
    const bad = applyTransition(
      early,
      { type: 'SUBMIT_VERDICT', verdict: { accusedPhantomPlayerId: 'P1' } },
      0,
      truth,
    );
    expect(bad.ok).toBe(false);

    const done = applyTransition(
      state,
      { type: 'SUBMIT_VERDICT', verdict: { accusedPhantomPlayerId: 'P1' } },
      state.timer.startedAtMs,
      truth,
    );
    expect(done.ok).toBe(true);
    if (!done.ok) return;
    expect(done.state.phase.id).toBe('debrief');
    expect(done.state.winSide).toBe('investigators');
  });

  it('rejects timer skip before endsAt', () => {
    const state = createInitialMachineState(1000);
    const tooEarly = applyTransition(state, { type: 'TIMER_ELAPSED' }, 1001);
    expect(tooEarly.ok).toBe(false);
  });
});

describe('constraint solver + official case uniqueness', () => {
  it('full evidence yields a unique solution matching truth', () => {
    const roles = [
      { playerId: 'P1', odorId: 'banana' as const, isPhantom: true, spawnId: 'spawn_1' },
      { playerId: 'P2', odorId: 'lemon' as const, isPhantom: false, spawnId: 'spawn_2' },
      { playerId: 'P3', odorId: 'rose' as const, isPhantom: false, spawnId: 'spawn_3' },
      { playerId: 'P4', odorId: 'coffee' as const, isPhantom: false, spawnId: 'spawn_4' },
    ];
    const evidence = buildFullEvidence(roles, 'P1');
    const solutions = enumerateSolutions({
      playerIds: roles.map((r) => r.playerId),
      odorPool: LABYRINTH_ODOR_IDS,
      evidence,
    });
    expect(solutions).toHaveLength(1);
    expect(solutions[0]!.phantomPlayerId).toBe('P1');
    expect(solutions[0]!.assignments.find((a) => a.playerId === 'P1')!.odorId).toBe(
      'banana',
    );
  });

  it('rejects multi-solution evidence instead of picking silently', () => {
    // Only one positive channel — many assignments remain possible.
    const evidence = [
      {
        id: 'e1',
        type: 'positiveChannel' as const,
        playerId: 'P1',
        gateId: 'A' as const,
        source: 'channel_array' as const,
        timeWindow: { startMs: 0, endMs: 1 },
        reliability: 'hard' as const,
      },
    ];
    expect(
      hasUniqueSolution({
        playerIds: ['P1', 'P2', 'P3', 'P4'],
        odorPool: LABYRINTH_ODOR_IDS,
        evidence,
      }),
    ).toBe(false);
  });

  it('any of 500 official seeds is uniquely solvable (failures reproducible)', () => {
    const failures: string[] = [];
    for (let i = 0; i < 500; i += 1) {
      const seed = `official-${i}`;
      const result = generateOfficialCase({
        seed,
        contentVersion: LABYRINTH_CONTENT_VERSION,
        playerCount: 4,
      });
      if (!result.ok) {
        failures.push(`${seed}:${result.reason}:${result.solutionCount ?? '?'}`);
        continue;
      }
      assertValidOfflineCase(result.case);
      const unique = hasUniqueSolution({
        playerIds: result.case.playerRoles.map((r) => r.playerId),
        odorPool: LABYRINTH_ODOR_IDS,
        evidence: result.case.evidenceEvents,
      });
      if (!unique) failures.push(`${seed}:post-check-non-unique`);

      // Reproducibility: same seed → same truth phantom + odors
      const again = generateOfficialCase({
        seed,
        contentVersion: LABYRINTH_CONTENT_VERSION,
        playerCount: 4,
      });
      expect(again.ok).toBe(true);
      if (again.ok && result.ok) {
        expect(again.case.truth).toEqual(result.case.truth);
      }
    }
    if (failures.length > 0) {
      throw new Error(
        `Non-unique or rejected official seeds (reproducible): ${failures.join(', ')}`,
      );
    }
  }, 120_000);
});
