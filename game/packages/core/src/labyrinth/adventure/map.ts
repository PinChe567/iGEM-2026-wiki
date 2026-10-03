import { createRng } from '../../rng';
import rawAdventureV1 from '../map/map-adventure-v1.json';
import rawAdventureV2 from '../map/map-adventure-v2.json';
import rawAdventureV3 from '../map/map-adventure-v3.json';
import rawAdventureV4 from '../map/map-adventure-v4.json';
import type { ActorPermissions, LabyrinthMap, MapDoor, MapTile } from '../types';
import { ADVENTURE_MAP_VERSION } from './constants';
import type {
  AdventureEnemySpawn,
  AdventureInteractable,
  AdventureLoot,
  AdventureMap,
  AdventureMapFile,
  AdventureModuleId,
  AdventureRoomId,
  AdventureSealId,
  Vec2,
} from './types';

const ODOR_GLYPHS: Record<string, string> = {
  b: 'banana',
  l: 'lemon',
  m: 'mint',
  r: 'rose',
  c: 'coffee',
  p: 'pine',
  h: 'peach',
};

function tileId(x: number, y: number): string {
  return `t-${x}-${y}`;
}

function entityId(kind: string, x: number, y: number): string {
  return `${kind}-${x}-${y}`;
}

function isMapFile(raw: unknown): raw is AdventureMapFile {
  return Boolean(raw && typeof raw === 'object' && Array.isArray((raw as AdventureMapFile).grid));
}

export const ADVENTURE_MOVE_ACTOR: ActorPermissions = {
  odorId: 'banana',
  authorizedGates: new Set(),
  isPhantom: false,
  phaseShiftActive: false,
};

export function parseAdventureMap(raw: unknown): AdventureMap {
  if (!isMapFile(raw)) throw new Error('Adventure map JSON must be an object with grid[]');
  if (raw.mapVersion !== ADVENTURE_MAP_VERSION) {
    throw new Error(
      `Unsupported adventure mapVersion ${String(raw.mapVersion)}; expected ${ADVENTURE_MAP_VERSION}`,
    );
  }
  if (raw.grid.length !== raw.height) {
    throw new Error(`grid height ${raw.grid.length} != ${raw.height}`);
  }
  for (const [i, row] of raw.grid.entries()) {
    if (row.length !== raw.width) {
      throw new Error(`grid row ${i} length ${row.length} != ${raw.width}`);
    }
  }

  const tiles: AdventureMap['tiles'] = [];
  const collision: boolean[] = [];
  const interactables: AdventureInteractable[] = [];
  const enemies: AdventureEnemySpawn[] = [];
  const bossTiles: Vec2[] = [];
  let spawn: Vec2 | null = null;
  let exitTile: Vec2 | null = null;

  for (let y = 0; y < raw.height; y += 1) {
    const row = raw.grid[y]!;
    for (let x = 0; x < raw.width; x += 1) {
      const ch = row[x]!;
      const wall = ch === '#' || ch === 'H' || ch === 'A' || ch === 'V';
      collision.push(wall);
      tiles.push({
        id: tileId(x, y),
        x,
        y,
        kind: wall ? 'wall' : 'floor',
      });

      const tile = { x, y };
      if (ch === '@') spawn = tile;
      if (ch === 'X') {
        exitTile = tile;
        interactables.push({
          id: entityId('exit', x, y),
          kind: 'exit',
          tile,
          roomId: roomIdAt(x, y),
        });
      }
      if (ch === 'C' || ch === 'P' || ch === 'K') {
        interactables.push({
          id: entityId('checkpoint', x, y),
          kind: 'checkpoint',
          tile,
          roomId: roomIdAt(x, y),
        });
      }
      if (ch === '1') {
        interactables.push({
          id: entityId('chest', x, y),
          kind: 'chest',
          tile,
          roomId: roomIdAt(x, y),
          loot: { moduleId: 'receptor-cartridge' },
        });
      }
      if (ch === '2') {
        interactables.push({
          id: entityId('chest', x, y),
          kind: 'chest',
          tile,
          roomId: roomIdAt(x, y),
          loot: { moduleId: 'optical-reader' },
          lockMinigame: 'skillCheck',
        });
      }
      if (ch === '4') {
        interactables.push({
          id: entityId('chest', x, y),
          kind: 'chest',
          tile,
          roomId: roomIdAt(x, y),
          loot: { resources: { scanCharge: 3, repairScrap: 1, health: 1 } },
        });
      }
      if (ch === '3') {
        interactables.push({
          id: entityId('chest', x, y),
          kind: 'chest',
          tile,
          roomId: roomIdAt(x, y),
          loot: { moduleId: 'signal-filter' },
        });
      }
      if (ch === 'o' || ch === 'q' || ch === 'i') {
        interactables.push({
          id: entityId('coffeePile', x, y),
          kind: 'coffeePile',
          tile,
          roomId: roomIdAt(x, y),
          odorId: 'coffee',
          trueTarget: ch === 'o',
          clueId: ch === 'o' ? 'storage-coffee' : undefined,
          loot: ch === 'o' ? { resources: { keys: 1 } } : undefined,
        });
      }
      if (ch === 'U' || ch === 'Y' || ch === 'Z') {
        const sealId: AdventureSealId = ch === 'U' ? 'storage' : ch === 'Y' ? 'garden' : 'signal';
        interactables.push({
          id: entityId('exitSeal', x, y),
          kind: 'exitSeal',
          tile,
          roomId: roomIdAt(x, y),
          sealId,
        });
      }
      if (ch === 'V') {
        interactables.push({
          id: entityId('thornWall', x, y),
          kind: 'thornWall',
          tile,
          roomId: roomIdAt(x, y),
          odorId: 'rose',
          trueTarget: true,
          secretId: 'garden-thorn',
          requirements: { learnedOdorIds: ['rose'], scanRequired: true },
        });
      }
      if (ch === 't') {
        interactables.push({
          id: entityId('scentTrail', x, y),
          kind: 'scentTrail',
          tile,
          roomId: roomIdAt(x, y),
          odorId: 'mint',
          trailIntensity: 0.78,
        });
      }
      const odorId = ODOR_GLYPHS[ch];
      if (odorId) {
        interactables.push({
          id: entityId('odorSample', x, y),
          kind: 'odorSample',
          tile,
          roomId: roomIdAt(x, y),
          odorId,
          requirements: { moduleIds: ['receptor-cartridge'] },
        });
      }
      if (ch === 'G') {
        interactables.push({
          id: entityId('scentGate', x, y),
          kind: 'scentGate',
          tile,
          roomId: roomIdAt(x, y),
          requirements: { moduleIds: ['receptor-cartridge'] },
        });
      }
      if (ch === 'D') {
        interactables.push({
          id: entityId('scentGate', x, y),
          kind: 'scentGate',
          tile,
          roomId: roomIdAt(x, y),
          requirements: { moduleIds: ['optical-reader'] },
        });
      }
      if (ch === 'S') {
        interactables.push({
          id: entityId('scentGate', x, y),
          kind: 'scentGate',
          tile,
          roomId: roomIdAt(x, y),
          requirements: { moduleIds: ['signal-filter'] },
        });
      }
      if (ch === 'F') {
        interactables.push({
          id: entityId('decayBarrier', x, y),
          kind: 'decayBarrier',
          tile,
          roomId: roomIdAt(x, y),
          odorId: 'lemon',
          requirements: { learnedOdorIds: ['lemon'], scanRequired: true },
        });
      }
      if (ch === 'g') {
        interactables.push({
          id: entityId('scentGate', x, y),
          kind: 'scentGate',
          tile,
          roomId: roomIdAt(x, y),
          odorId: 'peach',
          requirements: { learnedOdorIds: ['peach'] },
        });
      }
      if (ch === 'T') {
        interactables.push({
          id: entityId('scentTrail', x, y),
          kind: 'scentTrail',
          tile,
          roomId: roomIdAt(x, y),
          odorId: 'lemon',
          trailIntensity: 0.72,
        });
      }
      if (ch === 'N') {
        interactables.push({
          id: entityId('noisyField', x, y),
          kind: 'noisyField',
          tile,
          roomId: roomIdAt(x, y),
        });
      }
      if (ch === 'H') {
        interactables.push({
          id: entityId('hiddenPassage', x, y),
          kind: 'hiddenPassage',
          tile,
          roomId: roomIdAt(x, y),
          odorId: 'banana',
          secretId: 'banana-vent',
          requirements: {
            scanRequired: true,
            learnedOdorIds: ['banana'],
          },
        });
      }
      if (ch === 'A') {
        interactables.push({
          id: entityId('hiddenChest', x, y),
          kind: 'hiddenChest',
          tile,
          roomId: roomIdAt(x, y),
          odorId: 'pine',
          secretId: 'pine-panel',
          loot: { resources: { scanCharge: 2, keys: 1 } },
          requirements: { scanRequired: true, learnedOdorIds: ['pine'] },
        });
      }
      if (ch === 'L') {
        interactables.push({
          id: entityId('scentLock', x, y),
          kind: 'scentLock',
          tile,
          roomId: roomIdAt(x, y),
          odorId: 'peach',
          lockChoices: ['banana', 'mint', 'peach'],
          requirements: { learnedOdorIds: ['peach'] },
        });
      }
      if (ch === 'e') {
        enemies.push({ id: entityId('enemy-sporeling', x, y), kind: 'sporeling', tile });
      }
      if (ch === 'v') {
        enemies.push({ id: entityId('enemy-vineCrawler', x, y), kind: 'vineCrawler', tile });
      }
      if (ch === 'w') {
        enemies.push({ id: entityId('enemy-noiseWisp', x, y), kind: 'noiseWisp', tile });
      }
      if (ch === 'M') {
        enemies.push({ id: entityId('enemy-mimicSpore', x, y), kind: 'mimicSpore', tile });
      }
      if (ch === 'B') bossTiles.push(tile);
    }
  }

  if (!spawn) throw new Error('Adventure map missing spawn (@)');
  if (!exitTile) throw new Error('Adventure map missing exit (X)');

  if (bossTiles.length >= 2) {
    enemies.push({
      id: 'enemy-noiseBloom',
      kind: 'noiseBloom',
      tile: bossTiles[0]!,
      coreTiles: bossTiles,
    });
  }

  return {
    mapVersion: raw.mapVersion,
    width: raw.width,
    height: raw.height,
    visionRadius: raw.visionRadius,
    spawn,
    exitTile,
    tiles,
    collision,
    interactables,
    enemies,
  };
}

export const MAP_ADVENTURE_V1: AdventureMap = parseAdventureMap(rawAdventureV1);
export const MAP_ADVENTURE_V2: AdventureMap = parseAdventureMap(rawAdventureV2);
export const MAP_ADVENTURE_V3: AdventureMap = parseAdventureMap(rawAdventureV3);
export const MAP_ADVENTURE_V4: AdventureMap = parseAdventureMap(rawAdventureV4);

export const ADVENTURE_OFFICIAL_MAPS: readonly AdventureMap[] = [
  MAP_ADVENTURE_V1,
  MAP_ADVENTURE_V2,
  MAP_ADVENTURE_V3,
  MAP_ADVENTURE_V4,
];

export function pickAdventureMap(seed: string): AdventureMap {
  const rng = createRng(`adventure-map:${seed}`);
  const maps = ADVENTURE_OFFICIAL_MAPS;
  return maps[Math.floor(rng() * maps.length)]!;
}

export function loadOfficialAdventureMap(seed?: string): AdventureMap {
  return seed ? pickAdventureMap(seed) : MAP_ADVENTURE_V1;
}

function isScanWall(
  item: { kind: string },
): boolean {
  return item.kind === 'hiddenPassage' || item.kind === 'hiddenChest' || item.kind === 'thornWall';
}

function isLockedHidden(
  map: AdventureMap,
  x: number,
  y: number,
  unlockedPassageIds: ReadonlySet<string>,
): boolean {
  return map.interactables.some(
    (item) =>
      isScanWall(item) &&
      item.tile.x === x &&
      item.tile.y === y &&
      !unlockedPassageIds.has(item.id),
  );
}

function isUnlockedHidden(
  map: AdventureMap,
  x: number,
  y: number,
  unlockedPassageIds: ReadonlySet<string>,
): boolean {
  return map.interactables.some(
    (item) =>
      isScanWall(item) &&
      item.tile.x === x &&
      item.tile.y === y &&
      unlockedPassageIds.has(item.id),
  );
}

/** Collision / door geometry reused by tryContinuousMove, tryMove, and vision. */
export function adventureToLabyrinthMap(
  map: AdventureMap,
  unlockedPassageIds: readonly string[] = [],
): LabyrinthMap {
  const unlocked = new Set(unlockedPassageIds);
  const doorTiles = map.interactables.filter(
    (item) => item.kind === 'scentGate' || item.kind === 'decayBarrier' || item.kind === 'scentLock',
  );
  const doorAt = new Map(doorTiles.map((item) => [`${item.tile.x},${item.tile.y}`, item]));

  const tiles: MapTile[] = [];
  const collision: boolean[] = [];
  const doors: MapDoor[] = [];

  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const idx = y * map.width + x;
      const lockedHidden = isLockedHidden(map, x, y, unlocked);
      const openedHidden = isUnlockedHidden(map, x, y, unlocked);
      const blocked = openedHidden ? false : lockedHidden || map.collision[idx] === true;
      collision.push(blocked);

      const door = doorAt.get(`${x},${y}`);
      let kind: MapTile['kind'] = blocked ? 'wall' : 'floor';
      if (map.spawn.x === x && map.spawn.y === y) kind = 'spawn';
      if (door && !blocked) kind = 'door';

      const tile: MapTile = {
        id: tileId(x, y),
        x,
        y,
        kind,
        roomId: roomIdAt(x, y),
        doorId: door?.id,
      };
      tiles.push(tile);
      if (door) {
        doors.push({ id: door.id, tileId: tile.id, defaultOpen: false });
      }
    }
  }

  const spawnId = tileId(map.spawn.x, map.spawn.y);
  return {
    mapVersion: map.mapVersion,
    width: map.width,
    height: map.height,
    visionRadius: map.visionRadius,
    rooms: [
      {
        id: 'atrium',
        name: { en: 'Central Atrium', 'zh-Hant': '\u4e2d\u592e\u4e2d\u5ead' },
        kind: 'central',
      },
      {
        id: 'storage',
        name: { en: 'Storage Wing', 'zh-Hant': '\u5009\u5132\u7ffc' },
        kind: 'task',
      },
      {
        id: 'greenhouse',
        name: { en: 'Greenhouse Wing', 'zh-Hant': '\u6eab\u5ba4\u7ffc' },
        kind: 'task',
      },
      {
        id: 'signal',
        name: { en: 'Signal Lab Wing', 'zh-Hant': '\u8a0a\u865f\u5be6\u9a57\u7ffc' },
        kind: 'task',
      },
    ],
    gates: [],
    doors,
    spawns: [
      {
        id: 'spawn',
        tileId: spawnId,
        x: map.spawn.x,
        y: map.spawn.y,
      },
    ],
    tasks: [],
    scannerTileId: spawnId,
    reviewRoomId: 'atrium',
    centralRoomId: 'atrium',
    tiles,
    collision,
  };
}

export function moduleFromLoot(loot: AdventureLoot | undefined): AdventureModuleId | undefined {
  return loot?.moduleId;
}

export function tileCenterOf(tile: Vec2): { x: number; y: number } {
  return { x: tile.x + 0.5, y: tile.y + 0.5 };
}

export function roomIdAt(x: number, y: number): AdventureRoomId {
  if (x <= 8) return 'storage';
  if (y <= 4) return 'atrium';
  if (x >= 22) return 'signal';
  if (y >= 12) return 'greenhouse';
  return 'corridor';
}

export function roomLabelKey(room: AdventureRoomId): string {
  if (room === 'storage') return 'wingStorage';
  if (room === 'greenhouse') return 'wingGreenhouse';
  if (room === 'signal') return 'wingSignal';
  if (room === 'atrium') return 'wingAtrium';
  return 'wingCorridor';
}
