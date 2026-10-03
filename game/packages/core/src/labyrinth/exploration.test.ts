import { describe, expect, it } from 'vitest';
import { MAP_V1 } from './map/load';
import {
  createExplorationSession,
  tickExploration,
  tryContinuousMove,
  permissionsFor,
} from './exploration';
import { defaultDoorState } from './movement';

describe('exploration continuous movement', () => {
  it('blocks unauthorized gate entry through core move (UI cannot bypass)', () => {
    // Approach gate C from the south; garlic lacks C.
    const from = { x: 12.5, y: 6.5 };
    const actor = {
      odorId: 'garlic' as const,
      authorizedGates: permissionsFor({
        odorId: 'garlic',
        isPhantom: false,
        phaseShiftActive: false,
      }).authorizedGates,
      isPhantom: false,
      phaseShiftActive: false,
    };
    const result = tryContinuousMove(
      MAP_V1,
      from,
      { x: 0, y: -1.2 },
      actor,
      defaultDoorState(MAP_V1),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('gate_unauthorized');
  });

  it('allows banana through gate A via session tick', () => {
    let session = createExplorationSession(MAP_V1, { odorId: 'banana', spawnIndex: 0 });
    // Place just south of gate A
    session = {
      ...session,
      player: {
        ...session.player,
        position: { x: 6.5, y: 6.2 },
        prevPosition: { x: 6.5, y: 6.2 },
        facing: -Math.PI / 2,
      },
    };
    for (let i = 0; i < 45; i += 1) {
      session = tickExploration(
        session,
        { moveX: 0, moveY: -1, aimAngle: -Math.PI / 2, interactPressed: false },
        1 / 60,
      );
    }
    expect(session.player.position.y).toBeLessThan(5.5);
  });
});
