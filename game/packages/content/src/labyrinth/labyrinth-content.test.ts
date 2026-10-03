import { describe, expect, it } from 'vitest';
import {
  ALL_GATE_IDS,
  LABYRINTH_CONTENT_VERSION,
  type GateId,
} from './schema';
import {
  LABYRINTH_ODOR_IDS,
  LABYRINTH_ROLES,
  gateKeyForRole,
  labyrinthContentCatalog,
  roleIdFromGateKey,
} from './index';

describe('labyrinth content roles', () => {
  it('exports versioned catalog with fictionalModel', () => {
    expect(labyrinthContentCatalog.contentVersion).toBe(LABYRINTH_CONTENT_VERSION);
    expect(labyrinthContentCatalog.fictionalModel).toBe(true);
    expect(labyrinthContentCatalog.roles).toHaveLength(8);
  });

  it('matches fixed gate distribution', () => {
    const expected: Record<string, GateId[]> = {
      banana: ['A', 'B', 'D'],
      lemon: ['A', 'C', 'F'],
      rose: ['B', 'C', 'E'],
      coffee: ['B', 'D', 'F'],
      mint: ['A', 'C', 'E'],
      garlic: ['D', 'E', 'F'],
      peach: ['A', 'E', 'F'],
      pine: ['B', 'C', 'D'],
    };
    for (const role of LABYRINTH_ROLES) {
      expect(role.fictionalModel).toBe(true);
      expect([...role.gates]).toEqual(expected[role.id]);
    }
    expect(LABYRINTH_ODOR_IDS).toEqual(Object.keys(expected));
  });

  it('has unique gate triples and covers A–F', () => {
    const keys = new Set(LABYRINTH_ROLES.map((role) => gateKeyForRole(role.id)));
    expect(keys.size).toBe(8);
    const used = new Set<GateId>();
    for (const role of LABYRINTH_ROLES) {
      for (const gate of role.gates) used.add(gate);
      expect(roleIdFromGateKey(gateKeyForRole(role.id))).toBe(role.id);
    }
    expect([...used].sort().join('')).toBe(ALL_GATE_IDS.join(''));
  });

  it('includes bilingual science limits', () => {
    expect(labyrinthContentCatalog.scienceLimits.length).toBeGreaterThanOrEqual(2);
    for (const note of labyrinthContentCatalog.scienceLimits) {
      expect(note.title['zh-Hant'].length).toBeGreaterThan(2);
      expect(note.title.en.length).toBeGreaterThan(2);
      expect(note.body.en.length).toBeGreaterThan(10);
    }
    expect(labyrinthContentCatalog.modelDisclaimer.en).toMatch(/fictional/i);
  });
});
