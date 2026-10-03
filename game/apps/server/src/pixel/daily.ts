import { CONTENT_VERSION, toPixelOdors } from '@suite/content';
import {
  PIXEL_GAME_VERSION,
  buildSession,
  buildSessionMeta,
  getPreset,
  questionIdForRound,
  toPublicSession,
  type BuiltSession,
  type PixelOdor,
} from '@suite/core/pixel';
import { createHmac, randomBytes } from 'node:crypto';
import type { Db } from '../db/pool.js';
import { PROTOCOL_VERSION } from '../config.js';

export const PIXEL_PRESET_ID = 'daily-standard' as const;
export const RANKED_POLICY = 'first_completed_only' as const;

/** Overall daily run budget (server clock). */
export const DAILY_MAX_DURATION_MS = 15 * 60 * 1000;
/** Incomplete runs may resume within this window from original start; timer never rewinds. */
export const DAILY_RESUME_WINDOW_MS = 30 * 60 * 1000;

export type PixelDailyTruth = {
  privateSeed: string;
  presetId: typeof PIXEL_PRESET_ID;
  ruleVersion: string;
  contentVersion: string;
  seedVersion: string;
  answerKey: Array<{ questionId: string; round: number; answerId: string; optionIds: string[] }>;
};

export type PixelDailyPublicMeta = {
  title: string;
  open: true;
  presetId: typeof PIXEL_PRESET_ID;
  questionCount: number;
  rankedPolicy: typeof RANKED_POLICY;
  rankedPolicyNote: string;
  maxDurationMs: number;
  resumeWindowMs: number;
};

const odorsCache: PixelOdor[] = toPixelOdors();

export function pixelOdors(): readonly PixelOdor[] {
  return odorsCache;
}

export function derivePrivateSeed(args: {
  challengeSecret: string;
  dateUTC: string;
  gameVersion: string;
  contentVersion: string;
}): string {
  return createHmac('sha256', args.challengeSecret)
    .update(`pixel-daily:${args.dateUTC}:v${args.gameVersion}:c${args.contentVersion}`)
    .digest('base64url');
}

export function buildPixelDailySession(privateSeed: string, contentVersion: string = CONTENT_VERSION): BuiltSession {
  const settings = getPreset(PIXEL_PRESET_ID);
  const meta = buildSessionMeta({
    seed: privateSeed,
    mode: 'daily',
    presetId: PIXEL_PRESET_ID,
    contentVersion,
  });
  return buildSession({ odors: odorsCache, settings, meta });
}

export function truthFromSession(session: BuiltSession, privateSeed: string): PixelDailyTruth {
  return {
    privateSeed,
    presetId: PIXEL_PRESET_ID,
    ruleVersion: session.meta.gameVersion,
    contentVersion: session.meta.contentVersion,
    seedVersion: session.meta.seedVersion,
    answerKey: session.questions.map((q) => ({
      questionId: questionIdForRound(q.round),
      round: q.round,
      answerId: q.answerId,
      optionIds: [...q.optionIds],
    })),
  };
}

export function publicMetaFromSession(session: BuiltSession): PixelDailyPublicMeta {
  return {
    title: 'Odor Pixel Lab daily',
    open: true,
    presetId: PIXEL_PRESET_ID,
    questionCount: session.settings.questionCount,
    rankedPolicy: RANKED_POLICY,
    rankedPolicyNote:
      'Each guest’s first completed run each UTC day is ranked. Later runs are practice (unranked). Leaderboard uses the same rule — best-of is not mixed in.',
    maxDurationMs: DAILY_MAX_DURATION_MS,
    resumeWindowMs: DAILY_RESUME_WINDOW_MS,
  };
}

export function isPixelTruth(value: unknown): value is PixelDailyTruth {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.privateSeed === 'string' &&
    v.privateSeed.length > 8 &&
    Array.isArray(v.answerKey) &&
    v.answerKey.length > 0
  );
}

export async function ensurePixelDailyChallenge(
  db: Db,
  challengeSecret: string,
  dateUTC = new Date().toISOString().slice(0, 10),
): Promise<{
  id: string;
  game_key: string;
  challenge_date: string;
  protocol_version: string;
  game_version: string;
  content_version: string;
  public_metadata: PixelDailyPublicMeta;
  server_truth: PixelDailyTruth;
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
     WHERE game_key = 'pixel' AND challenge_date = $1::date`,
    [dateUTC],
  );

  const row = existing.rows[0];
  if (row && isPixelTruth(row.server_truth)) {
    return {
      ...row,
      public_metadata: row.public_metadata as PixelDailyPublicMeta,
      server_truth: row.server_truth,
    };
  }

  const privateSeed = derivePrivateSeed({
    challengeSecret,
    dateUTC,
    gameVersion: PIXEL_GAME_VERSION,
    contentVersion: CONTENT_VERSION,
  });
  const session = buildPixelDailySession(privateSeed);
  const truth = truthFromSession(session, privateSeed);
  const meta = publicMetaFromSession(session);

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
        PIXEL_GAME_VERSION,
        CONTENT_VERSION,
        JSON.stringify(meta),
        JSON.stringify(truth),
      ],
    );
    const u = updated.rows[0]!;
    return {
      ...u,
      public_metadata: u.public_metadata as PixelDailyPublicMeta,
      server_truth: u.server_truth as PixelDailyTruth,
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
     VALUES ('pixel', $1::date, $2, $3, $4, $5::jsonb, $6::jsonb)
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
      PIXEL_GAME_VERSION,
      CONTENT_VERSION,
      JSON.stringify(meta),
      JSON.stringify(truth),
    ],
  );
  const i = inserted.rows[0]!;
  return {
    ...i,
    public_metadata: i.public_metadata as PixelDailyPublicMeta,
    server_truth: i.server_truth as PixelDailyTruth,
  };
}

export function publicChallengeView(challenge: {
  id: string;
  game_key: string;
  challenge_date: string;
  protocol_version: string;
  game_version: string;
  content_version: string;
  public_metadata: PixelDailyPublicMeta;
}) {
  return {
    challengeId: challenge.id,
    gameKey: challenge.game_key,
    date: challenge.challenge_date,
    protocolVersion: challenge.protocol_version,
    gameVersion: challenge.game_version,
    contentVersion: challenge.content_version,
    metadata: challenge.public_metadata,
    rankedPolicy: RANKED_POLICY,
  };
}

export function publicQuestionsForChallenge(truth: PixelDailyTruth) {
  const session = buildPixelDailySession(truth.privateSeed, truth.contentVersion);
  return toPublicSession(session);
}

/** Fallback ephemeral seed for sync-race matches (not daily). */
export function freshMatchSeed(): string {
  return `m-${randomBytes(24).toString('base64url')}`;
}
