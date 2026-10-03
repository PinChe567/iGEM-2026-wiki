# 10 — Odor Pixel Lab server-verified online modes

**Date:** 2026-08-01  
**Scope:** Game 1 (Odor Pixel Lab) only — Daily Challenge + Sync Race.  
**Non-goals:** Game 2 Labyrinth / Game 3 Spectrum online play.

## Deliverables

| Area | Path |
|------|------|
| Public question sanitizer | `packages/core/src/pixel/public.ts` |
| Daily seed + truth | `apps/server/src/pixel/daily.ts` |
| Run start/answer/finish | `apps/server/src/pixel/runs.ts` |
| Sync Race | `apps/server/src/pixel/sync-race.ts` |
| Migration | `apps/server/migrations/002_pixel_online.sql` |
| Online UI | `apps/online-client/src/main.ts` |
| Integration tests | `apps/server/src/pixel.online.integration.test.ts` |
| Dual-browser E2E | `apps/online-client/e2e/pixel-online.spec.ts` |

## Daily Challenge rules (implemented)

1. UTC date + `CHALLENGE_SECRET` HMAC → private seed in `daily_challenges.server_truth` (never returned).
2. Client receives patterns / options / question ids only (`toPublicQuestion`).
3. `POST .../runs/start` records server `startedAtMs`; answers are `{ questionId, selectedOptionId }`.
4. Server checks order, duplicates, time window; finish recomputes from event log only — client `score` / `durationMs` / `correctCount` rejected (`client_score_rejected`).
5. Resume within window reuses the same run; **timer never rewinds**.
6. Ranked policy: **first completed run per guest per challenge**; later runs practice/unranked. UI shows the policy explicitly; leaderboard is ranked-only.
7. Leaderboard sort: `correctCount DESC`, `durationMs ASC`, `completedAt ASC`; same `game_version` / `content_version` only.

## Sync Race rules (implemented)

6–9. 2–4 player lobby; one shared session seed; server countdown / question open-close; clients see answered flags + scores only (not selected options); reconnect before question end; reactions `ready` / `good_luck` / icons with cooldown; no free text; host cannot alter scores or skip questions.

10. Results show server-verified badge, challenge/match + versions, per-question log (daily) / standings (sync), and report entry (`POST /api/v1/reports`).

## Protocol security review

| Check | Result |
|-------|--------|
| `server_truth` / `privateSeed` / `answerId` absent from daily GET, start, answer, finish, LB, sync lobby/phase payloads | Enforced via `assertNoAnswerLeak` + integration assertions |
| Client-supplied score fields on start/finish | `400 client_score_rejected` |
| Out-of-order / duplicate answers | `409 out_of_order` / concurrent `409` |
| Old `gameVersion` | `409 version_mismatch` |
| WS opponent updates omit selected options | Covered in sync integration test |
| Source maps / network | E2E scans `/api` responses + DOM for leak keys; `npm run build:online` artifacts should not embed private seeds (rules stay server-side for online modes) |
| CSRF on mutating REST | Required (existing session model) |
| `POST /api/v1/scores` | Still `501` — not a trust path |

**Residual note:** Catalog + display patterns are public by design for playability; integrity depends on server scoring / timers / ranked first-completion, not on hiding which odor a pattern resembles from a determined offline solver.

## How to verify

```bash
npm run test:integration -w @suite/server
npm run test:e2e:online
npm run build:online
# optional leak scan:
rg -n "privateSeed|answerKey" apps/online-client/dist || true
```

## Stop condition

Pixel Lab server-verified Daily Challenge + Sync Race delivered. No Game 2 / Game 3 online modes in this phase.
