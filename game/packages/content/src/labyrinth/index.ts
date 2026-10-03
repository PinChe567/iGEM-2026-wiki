import {
  LABYRINTH_CONTENT_VERSION,
  assertLabyrinthRole,
  type LabyrinthContentCatalog,
  type LabyrinthOdorId,
  type LabyrinthRoleRecord,
} from './schema';

/** Gate triples — each identity has a unique unordered set of three fictional gates. */
const ROLE_SEEDS: ReadonlyArray<Omit<LabyrinthRoleRecord, 'fictionalModel'>> = [
  {
    id: 'banana',
    name: { 'zh-Hant': '\u9999\u8549', en: 'Banana' },
    gates: ['A', 'B', 'D'],
    blurb: {
      'zh-Hant':
        '\u53ef\u901a\u904e\u53d7\u9ad4\u9598 A\u3001B\u3001D\u3002\u6b64\u70ba\u904a\u6232\u865b\u69cb gate \u7d44\u5408\uff0c\u975e\u5be6\u9a57\u89aa\u548c\u8868\u3002',
      en: 'Authorized fictional gates A, B, D — not an experimental affinity table.',
    },
  },
  {
    id: 'lemon',
    name: { 'zh-Hant': '\u6a58\u6aaa', en: 'Lemon' },
    gates: ['A', 'C', 'F'],
    blurb: {
      'zh-Hant':
        '\u53ef\u901a\u904e\u53d7\u9ad4\u9598 A\u3001C\u3001F\u3002\u6b64\u70ba\u904a\u6232\u865b\u69cb gate \u7d44\u5408\uff0c\u975e\u5be6\u9a57\u89aa\u548c\u8868\u3002',
      en: 'Authorized fictional gates A, C, F — not an experimental affinity table.',
    },
  },
  {
    id: 'rose',
    name: { 'zh-Hant': '\u73ab\u7470', en: 'Rose' },
    gates: ['B', 'C', 'E'],
    blurb: {
      'zh-Hant':
        '\u53ef\u901a\u904e\u53d7\u9ad4\u9598 B\u3001C\u3001E\u3002\u6b64\u70ba\u904a\u6232\u865b\u69cb gate \u7d44\u5408\uff0c\u975e\u5be6\u9a57\u89aa\u548c\u8868\u3002',
      en: 'Authorized fictional gates B, C, E — not an experimental affinity table.',
    },
  },
  {
    id: 'coffee',
    name: { 'zh-Hant': '\u5496\u5561', en: 'Coffee' },
    gates: ['B', 'D', 'F'],
    blurb: {
      'zh-Hant':
        '\u53ef\u901a\u904e\u53d7\u9ad4\u9598 B\u3001D\u3001F\u3002\u6b64\u70ba\u904a\u6232\u865b\u69cb gate \u7d44\u5408\uff0c\u975e\u5be6\u9a57\u89aa\u548c\u8868\u3002',
      en: 'Authorized fictional gates B, D, F — not an experimental affinity table.',
    },
  },
  {
    id: 'mint',
    name: { 'zh-Hant': '\u8584\u8377', en: 'Mint' },
    gates: ['A', 'C', 'E'],
    blurb: {
      'zh-Hant':
        '\u53ef\u901a\u904e\u53d7\u9ad4\u9598 A\u3001C\u3001E\u3002\u6b64\u70ba\u904a\u6232\u865b\u69cb gate \u7d44\u5408\uff0c\u975e\u5be6\u9a57\u89aa\u548c\u8868\u3002',
      en: 'Authorized fictional gates A, C, E — not an experimental affinity table.',
    },
  },
  {
    id: 'garlic',
    name: { 'zh-Hant': '\u5927\u849c', en: 'Garlic' },
    gates: ['D', 'E', 'F'],
    blurb: {
      'zh-Hant':
        '\u53ef\u901a\u904e\u53d7\u9ad4\u9598 D\u3001E\u3001F\u3002\u6b64\u70ba\u904a\u6232\u865b\u69cb gate \u7d44\u5408\uff0c\u975e\u5be6\u9a57\u89aa\u548c\u8868\u3002',
      en: 'Authorized fictional gates D, E, F — not an experimental affinity table.',
    },
  },
  {
    id: 'peach',
    name: { 'zh-Hant': '\u6c34\u871c\u6843', en: 'Peach' },
    gates: ['A', 'E', 'F'],
    blurb: {
      'zh-Hant':
        '\u53ef\u901a\u904e\u53d7\u9ad4\u9598 A\u3001E\u3001F\u3002\u6b64\u70ba\u904a\u6232\u865b\u69cb gate \u7d44\u5408\uff0c\u975e\u5be6\u9a57\u89aa\u548c\u8868\u3002',
      en: 'Authorized fictional gates A, E, F — not an experimental affinity table.',
    },
  },
  {
    id: 'pine',
    name: { 'zh-Hant': '\u677e\u6728', en: 'Pine' },
    gates: ['B', 'C', 'D'],
    blurb: {
      'zh-Hant':
        '\u53ef\u901a\u904e\u53d7\u9ad4\u9598 B\u3001C\u3001D\u3002\u6b64\u70ba\u904a\u6232\u865b\u69cb gate \u7d44\u5408\uff0c\u975e\u5be6\u9a57\u89aa\u548c\u8868\u3002',
      en: 'Authorized fictional gates B, C, D — not an experimental affinity table.',
    },
  },
];

export const LABYRINTH_ROLES: readonly LabyrinthRoleRecord[] = ROLE_SEEDS.map((seed) => {
  const role: LabyrinthRoleRecord = { ...seed, fictionalModel: true };
  assertLabyrinthRole(role);
  return role;
});

const byId = new Map<LabyrinthOdorId, LabyrinthRoleRecord>(
  LABYRINTH_ROLES.map((role) => [role.id, role]),
);

export function getLabyrinthRole(id: LabyrinthOdorId): LabyrinthRoleRecord {
  const role = byId.get(id);
  if (!role) throw new Error(`Unknown labyrinth role: ${id}`);
  return role;
}

export function gatesForRole(id: LabyrinthOdorId): ReadonlySet<string> {
  return new Set(getLabyrinthRole(id).gates);
}

/** Sorted gate-key → odor id (each triple is unique). */
export function roleIdFromGateKey(gateKey: string): LabyrinthOdorId | undefined {
  for (const role of LABYRINTH_ROLES) {
    if ([...role.gates].sort().join('') === gateKey) return role.id;
  }
  return undefined;
}

export function gateKeyForRole(id: LabyrinthOdorId): string {
  return [...getLabyrinthRole(id).gates].sort().join('');
}

export const labyrinthContentCatalog: LabyrinthContentCatalog = {
  contentVersion: LABYRINTH_CONTENT_VERSION,
  gameId: 'labyrinth',
  productName: {
    'zh-Hant': '\u6697\u57df\u55c5\u8e64 / Scentbound Labyrinth',
    en: 'Scentbound Labyrinth',
  },
  fictionalModel: true,
  roles: LABYRINTH_ROLES,
  phantom: {
    id: 'phantom',
    name: { 'zh-Hant': '\u5e7b\u5f71', en: 'Phantom' },
    blurb: {
      'zh-Hant':
        '\u5916\u52a0\u89d2\u8272\uff1a\u53ef\u4f7f\u7528 phaseShift \u7a7f\u8d8a\u975e\u6388\u6b0a gate\uff08\u6703\u7559\u4e0b artifact\uff09\u8207 signalJam\u3002\u4ecd\u6709\u4e00\u500b\u6c23\u5473\u8eab\u4efd\u3002',
      en: 'Additional role: may phaseShift through unauthorized gates (leaves an artifact) and signalJam. Still holds one odor identity.',
    },
    abilities: {
      phaseShift: {
        'zh-Hant':
          'phaseShift\uff1a\u77ed\u66ab\u53ef\u7a7f\u8d8a\u975e\u6388\u6b0a gate\uff1b 25 \u79d2 cooldown\uff1b\u7522\u751f 8 \u79d2 artifact\u3002',
        en: 'phaseShift: briefly pass unauthorized gates; 25s cooldown; leaves an 8s artifact.',
      },
      signalJam: {
        'zh-Hant':
          'signalJam\uff1a\u5e72\u64fe\u6383\u63cf\uff0f\u983b\u9053\u8b49\u64da\uff1b 45 \u79d2 cooldown\uff08MVP \u6703\u6c61\u67d3\u53ef\u9760\u5ea6\u8996\u7a97\uff0c\u4e0d\u505a\u96a8\u6a5f\u8aaa\u8b0a\uff09\u3002',
        en: 'signalJam: corrupts scanner/channel evidence window; 45s cooldown (MVP marks corruption — no random lying).',
      },
    },
  },
  scienceLimits: [
    {
      id: 'combinatorial-signature',
      title: {
        'zh-Hant': '\u7c21\u5316\u7684\u7d44\u5408\u5f0f\u6c23\u5473\u7c3d\u7ae0\u904a\u6232',
        en: 'Simplified combinatorial odor-signature game',
      },
      body: {
        'zh-Hant':
          '\u672c\u904a\u6232\u4ee5\u4e09\u500b\u865b\u69cb gate \u7d44\u5408\u4f5c\u70ba\u6c23\u5473\u8eab\u4efd\u7c3d\u7ae0\uff0c\u50c5\u7528\u65bc\u63a8\u7406\u6559\u5b78\uff0c\u4e0d\u4ee3\u8868\u771f\u5be6\u55c5\u89ba\u53d7\u9ad4\u89aa\u548c\u8868\u3002',
        en: 'Identities are three-gate combinatorial signatures for deduction practice only — not real olfactory receptor affinity tables.',
      },
    },
    {
      id: 'fictional-gates',
      title: {
        'zh-Hant': 'A\u2013F \u70ba\u865b\u69cb\u53d7\u9ad4\u9598',
        en: 'A–F are fictional receptor gates',
      },
      body: {
        'zh-Hant':
          '\u904a\u6232\u4e2d\u7684 gate \u4e0d\u5c0d\u61c9\u771f\u5be6\u55c5\u89ba\u53d7\u9ad4\u4e9e\u578b\u3001\u679c\u9f8d\u6216 AeroSense \u91cf\u6e2c\u7d50\u679c\uff1b\u50c5\u7528\u65bc\u63a8\u7406\u8207\u7a7a\u9593\u63a2\u7d22\u73a9\u6cd5\u3002',
        en: 'In-game gates do not map to real OR subtypes, Drosophila assays, or AeroSense measurements; they exist for deduction gameplay only.',
      },
    },
    {
      id: 'no-wet-lab-claim',
      title: {
        'zh-Hant': '\u4e0d\u4f5c\u6ffa\u5f0f\u5be6\u9a57\u8ad2\u7a31',
        en: 'No wet-lab claim',
      },
      body: {
        'zh-Hant':
          '\u6c23\u5473\u8eab\u4efd\u8207\u8b49\u64da\u983b\u9053\u70ba\u6559\u80b2\u6027\u865b\u69cb\u6a21\u578b\uff08fictionalModel=true\uff09\uff0c\u4e0d\u61c9\u8996\u70ba\u751f\u7269\u91cf\u6e2c\u8cc7\u6599\u3002',
        en: 'Odor identities and evidence channels are an educational fictional model (fictionalModel=true), not biological measurement data.',
      },
    },
    {
      id: 'mvp-scope',
      title: {
        'zh-Hant': 'MVP \u73a9\u6cd5\u908f\u8f2f',
        en: 'MVP scope',
      },
      body: {
        'zh-Hant':
          '\u7121\u64ca\u6bba\u3001\u7121\u6dd8\u6c70\u3001\u7121\u81ea\u7531\u804a\u5929\uff1b\u6b63\u5f0f\u6848\u4ef6\u5728\u5b8c\u6574\u53ef\u53d6\u8b49\u64da\u4e0b\u5fc5\u9808\u552f\u4e00\u89e3\u3002',
        en: 'No kills, no eliminations, no free chat; official cases must be uniquely solvable from full obtainable evidence.',
      },
    },
  ],
  modelDisclaimer: {
    'zh-Hant':
      '\u300c\u6697\u57df\u55c5\u8e64\u300d\u4f7f\u7528\u865b\u69cb\u53d7\u9ad4\u9598\uff08A\u2013F\uff09\u8207\u6c23\u5473\u8eab\u4efd\u63a8\u7406\uff1b\u4e0d\u662f\u4eba\u9ad4\u3001\u679c\u9f8d\u6216 AeroSense \u5be6\u9a57\u91cf\u6e2c\u8cc7\u6599\u3002fictionalModel=true\u3002',
    en: 'Scentbound Labyrinth uses fictional receptor gates (A–F) for odor-identity deduction — not human, Drosophila, or AeroSense experimental data. fictionalModel=true.',
  },
};

export const LABYRINTH_ODOR_IDS: readonly LabyrinthOdorId[] = LABYRINTH_ROLES.map(
  (role) => role.id,
);
