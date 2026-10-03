import {
  SPECTRUM_CONTENT_VERSION,
  SPECTRUM_ODOR_IDS,
  signatureMap,
} from '@suite/content';
import {
  SPECTRUM_RULE_VERSION,
  buildPuzzle,
  toPublicPuzzle,
  type CanonicalMixture,
  type DifficultyId,
  type SpectrumPuzzle,
} from '@suite/core/spectrum';
import { createHmac } from 'node:crypto';
import type { Db } from '../db/pool.js';
import { PROTOCOL_VERSION } from '../config.js';

export const RANKED_POLICY = 'first_completed_only' as const;
export const SPECTRUM_DAILY_DIFFICULTY: DifficultyId = 'easy';
export const DAILY_MAX_DURATION_MS = 20 * 60 * 1000;
export const DAILY_RESUME_WINDOW_MS = 40 * 60 * 1000;
/** Per-user guess rate limit window. */
export const GUESS_RATE_LIMIT_MS = 400;
export const GUESS_RATE_LIMIT_BURST = 3;

const SIGS = signatureMap();
const ODOR_IDS = [...SPECTRUM_ODOR_IDS];

export type SpectrumDailyTruth = {
  privateSeed: string;
  difficulty: DifficultyId;
  ruleVersion: string;
  contentVersion: string;
  truth: CanonicalMixture;
  poolIds: string[];
  observedSignal: number[];
  legalMixtureCount: number;
};

export type SpectrumDailyPublicMeta = {
  title: string;
  open: true;
  difficulty: DifficultyId;
  rankedPolicy: typeof RANKED_POLICY;
  rankedPolicyNote: string;
  maxDurationMs: number;
  resumeWindowMs: number;
  maxGuesses: number;
  ratioRules: {
    componentCountMin: number;
    componentCountMax: number;
    percentStep: number;
    minPercent: number;
  };
};

export function deriveSpectrumPrivateSeed(args: {
  challengeSecret: string;
  dateUTC: string;
  difficulty: DifficultyId;
  ruleVersion: string;
  contentVersion: string;
}): string {
  return createHmac('sha256', args.challengeSecret)
    .update(
      `spectrum-daily:${args.dateUTC}:d${args.difficulty}:v${args.ruleVersion}:c${args.contentVersion}`,
    )
    .digest('base64url');
}

export function buildSpectrumDailyPuzzle(
  privateSeed: string,
  difficulty: DifficultyId = SPECTRUM_DAILY_DIFFICULTY,
): SpectrumPuzzle {
  return buildPuzzle({
    seed: privateSeed,
    difficulty,
    signatures: SIGS,
    odorIds: ODOR_IDS,
    contentVersion: SPECTRUM_CONTENT_VERSION,
  });
}

export function truthFromPuzzle(puzzle: SpectrumPuzzle, privateSeed: string): SpectrumDailyTruth {
  return {
    privateSeed,
    difficulty: puzzle.difficulty,
    ruleVersion: puzzle.ruleVersion,
    contentVersion: puzzle.contentVersion,
    truth: {
      components: puzzle.truth.components.map((c) => ({
        odorId: c.odorId,
        percent: c.percent,
      })),
    },
    poolIds: [...puzzle.poolIds],
    observedSignal: [...puzzle.observedSignal],
    legalMixtureCount: puzzle.legalMixtureCount,
  };
}

export function publicMetaFromPuzzle(puzzle: SpectrumPuzzle): SpectrumDailyPublicMeta {
  const pub = toPublicPuzzle(puzzle);
  return {
    title: 'Scent Spectrum daily',
    open: true,
    difficulty: puzzle.difficulty,
    rankedPolicy: RANKED_POLICY,
    rankedPolicyNote:
      'Each guest’s first completed run each UTC day is ranked. Later runs are practice (unranked). Solved entries rank above unsolved participation.',
    maxDurationMs: DAILY_MAX_DURATION_MS,
    resumeWindowMs: DAILY_RESUME_WINDOW_MS,
    maxGuesses: pub.maxGuesses,
    ratioRules: pub.ratioRules,
  };
}

export function isSpectrumTruth(value: unknown): value is SpectrumDailyTruth {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.privateSeed === 'string' &&
    v.privateSeed.length > 8 &&
    v.truth !== undefined &&
    Array.isArray(v.poolIds) &&
    Array.isArray(v.observedSignal)
  );
}

export async function ensureSpectrumDailyChallenge(
  db: Db,
  challengeSecret: string,
  dateUTC = new Date().toISOString().slice(0, 10),
  difficulty: DifficultyId = SPECTRUM_DAILY_DIFFICULTY,
): Promise<{
  id: string;
  game_key: string;
  challenge_date: string;
  protocol_version: string;
  game_version: string;
  content_version: string;
  public_metadata: SpectrumDailyPublicMeta;
  server_truth: SpectrumDailyTruth;
}> {
  const existing = await db.query<{
    id: string;
    game_key: string;
    challenge_date: string;
    protocol_version: string;
    game_version: string;
    content_version: string;
    public_metadata: unknown;
    server_truth: unknown;
  }>(
    `SELECT id, game_key, challenge_date::text, protocol_version, game_version, content_version,
            public_metadata, server_truth
     FROM daily_challenges
     WHERE game_key = 'spectrum' AND challenge_date = $1::date`,
    [dateUTC],
  );

  const row = existing.rows[0];
  if (row && isSpectrumTruth(row.server_truth)) {
    return {
      ...row,
      public_metadata: row.public_metadata as SpectrumDailyPublicMeta,
      server_truth: row.server_truth,
    };
  }

  const privateSeed = deriveSpectrumPrivateSeed({
    challengeSecret,
    dateUTC,
    difficulty,
    ruleVersion: SPECTRUM_RULE_VERSION,
    contentVersion: SPECTRUM_CONTENT_VERSION,
  });
  const puzzle = buildSpectrumDailyPuzzle(privateSeed, difficulty);
  const truth = truthFromPuzzle(puzzle, privateSeed);
  const meta = publicMetaFromPuzzle(puzzle);

  if (row) {
    const updated = await db.query<{
      id: string;
      game_key: string;
      challenge_date: string;
      protocol_version: string;
      game_version: string;
      content_version: string;
      public_metadata: unknown;
      server_truth: unknown;
    }>(
      `UPDATE daily_challenges
       SET protocol_version = $2, game_version = $3, content_version = $4,
           public_metadata = $5::jsonb, server_truth = $6::jsonb
       WHERE id = $1
       RETURNING id, game_key, challenge_date::text, protocol_version, game_version, content_version,
                 public_metadata, server_truth`,
      [
        row.id,
        PROTOCOL_VERSION,
        SPECTRUM_RULE_VERSION,
        SPECTRUM_CONTENT_VERSION,
        JSON.stringify(meta),
        JSON.stringify(truth),
      ],
    );
    const u = updated.rows[0]!;
    return {
      ...u,
      public_metadata: u.public_metadata as SpectrumDailyPublicMeta,
      server_truth: u.server_truth as SpectrumDailyTruth,
    };
  }

  const inserted = await db.query<{
    id: string;
    game_key: string;
    challenge_date: string;
    protocol_version: string;
    game_version: string;
    content_version: string;
    public_metadata: unknown;
    server_truth: unknown;
  }>(
    `INSERT INTO daily_challenges
       (game_key, challenge_date, protocol_version, game_version, content_version, public_metadata, server_truth)
     VALUES ('spectrum', $1::date, $2, $3, $4, $5::jsonb, $6::jsonb)
     ON CONFLICT (game_key, challenge_date) DO UPDATE
       SET protocol_version = EXCLUDED.protocol_version,
           game_version = EXCLUDED.game_version,
           content_version = EXCLUDED.content_version,
           public_metadata = EXCLUDED.public_metadata,
           server_truth = EXCLUDED.server_truth
     RETURNING id, game_key, challenge_date::text, protocol_version, game_version, content_version,
               public_metadata, server_truth`,
    [
      dateUTC,
      PROTOCOL_VERSION,
      SPECTRUM_RULE_VERSION,
      SPECTRUM_CONTENT_VERSION,
      JSON.stringify(meta),
      JSON.stringify(truth),
    ],
  );
  const i = inserted.rows[0]!;
  return {
    ...i,
    public_metadata: i.public_metadata as SpectrumDailyPublicMeta,
    server_truth: i.server_truth as SpectrumDailyTruth,
  };
}

export function publicSpectrumChallengeView(challenge: {
  id: string;
  game_key: string;
  challenge_date: string;
  protocol_version: string;
  game_version: string;
  content_version: string;
  public_metadata: SpectrumDailyPublicMeta;
  server_truth: SpectrumDailyTruth;
}) {
  const puzzle = buildSpectrumDailyPuzzle(
    challenge.server_truth.privateSeed,
    challenge.server_truth.difficulty,
  );
  const pub = toPublicPuzzle(puzzle);
  return {
    challengeId: challenge.id,
    gameKey: challenge.game_key,
    date: challenge.challenge_date,
    protocolVersion: challenge.protocol_version,
    gameVersion: challenge.game_version,
    contentVersion: challenge.content_version,
    rankedPolicy: RANKED_POLICY,
    metadata: challenge.public_metadata,
    // Display fields required to play — never truth / private seed.
    observedSignal: pub.observedSignal,
    poolIds: pub.poolIds,
    difficulty: pub.difficulty,
    maxGuesses: pub.maxGuesses,
    ratioRules: pub.ratioRules,
    truthComponentCount: pub.truthComponentCount,
    showSignatureHints: pub.showSignatureHints,
    mixingModel: pub.mixingModel,
  };
}
