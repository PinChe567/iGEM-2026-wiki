import mapV1 from './map-v1.json';
import { LABYRINTH_MAP_VERSION } from '../constants';
import { ALL_GATE_IDS, type GateId } from '../role-gates';
import type { LabyrinthMap, MapTile, TileKind } from '../types';

const TILE_KINDS = new Set<TileKind>([
  'wall',
  'floor',
  'gate',
  'door',
  'spawn',
  'task',
  'scanner',
  'review',
]);

function isGateId(value: string): value is GateId {
  return (ALL_GATE_IDS as readonly string[]).includes(value);
}

export function parseLabyrinthMap(raw: unknown): LabyrinthMap {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Map JSON must be an object');
  }
  const data = raw as LabyrinthMap;
  if (data.mapVersion !== LABYRINTH_MAP_VERSION) {
    throw new Error(
      `Unsupported mapVersion ${String(data.mapVersion)}; expected ${LABYRINTH_MAP_VERSION}`,
    );
  }
  if (!Array.isArray(data.tiles) || data.tiles.length !== data.width * data.height) {
    throw new Error('tiles length must equal width * height');
  }
  if (!Array.isArray(data.collision) || data.collision.length !== data.width * data.height) {
    throw new Error('collision length must equal width * height');
  }
  for (const tile of data.tiles) {
    if (!TILE_KINDS.has(tile.kind)) {
      throw new Error(`Unknown tile kind on ${tile.id}`);
    }
    if (tile.gateId && !isGateId(tile.gateId)) {
      throw new Error(`Invalid gateId on ${tile.id}`);
    }
  }
  return data as LabyrinthMap;
}

export const MAP_V1: LabyrinthMap = parseLabyrinthMap(mapV1);

export function tileById(map: LabyrinthMap, id: string): MapTile {
  const tile = map.tiles.find((t) => t.id === id);
  if (!tile) throw new Error(`Missing tile ${id}`);
  return tile;
}

export function loadDefaultMap(): LabyrinthMap {
  return MAP_V1;
}
