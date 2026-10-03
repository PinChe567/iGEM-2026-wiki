# 11 — Scent Spectrum server-verified online modes

**Date:** 2026-08-01  
**Scope:** Game 3 (Scent Spectrum) Daily Challenge + Race only.  
**Non-goals:** Labyrinth online; Wiki offline Spectrum remains unchanged.

## Trust model

All mixture **truth**, **A/B**, **fit**, **attempt counts**, and **results** are computed on the server with `@suite/core/spectrum` (`validateMixture`, `scoreAB`, `computeSignals`, `signalFitScore`, `computeSpectrumScore`, `buildPuzzle`). Clients may display feedback but never submit score / fit / A/B / solved as authority.

Wire versions: `protocolVersion=1.0.0`, `gameVersion=SPECTRUM_RULE_VERSION` (`2.0.0`), `contentVersion=SPECTRUM_CONTENT_VERSION` (`1.0.0`).

## Daily Challenge

1. UTC date + `CHALLENGE_SECRET` HMAC → `privateSeed` stored in `daily_challenges.server_truth` with truth mixture, pool, observed signal, versions.
2. Public GET / start returns: 12-channel `observedSignal`, `poolIds`, difficulty, ratio rules, `maxGuesses`, challenge/version — **never** truth / private seed / linear·saturated intermediates.
3. Each guess: canonical odor ids + integer percents. Server validates schema, duplicates, step, minimum, sum=100, pool membership, attempt order, duplicate mixture key, and rate limit (`guess_rate_limited`).
4. Response: `nAmB`, fit, attempt number, public curve comparison (`observedSignal` vs `guessSignal`). Truth revealed **only** on finish (solved or exhausted).
5. Ranked board: `solved DESC`, `guessesUsed ASC`, `elapsedMs ASC`, `completedAt ASC`. Unsolved ranked completions appear under **participation**, never above solvers.
6. Ranked policy matches Pixel: **first completed run per guest per UTC day**; later runs unranked. Resume reuses the same run; **server timer never rewinds**.

### REST

| Method | Path |
|--------|------|
| GET | `/api/v1/daily/spectrum` |
| POST | `/api/v1/spectrum/daily/runs/start` |
| POST | `/api/v1/spectrum/daily/runs/:runId/guess` |
| POST | `/api/v1/spectrum/daily/runs/:runId/finish` |
| GET | `/api/v1/spectrum/daily/runs/:runId` |

## Race (2–4)

Mode version: `SPECTRUM_RACE_MODE_VERSION = 1.0.0` (includes grace `45000` ms).

6. All players share the same `observedSignal` + rules; guesses stay private. Broadcasts expose only attempt count, solved status, finish time, ready/connected.
7. Server emits countdown → start → progress → grace → debrief. Client-broadcast A/B is never treated as authoritative (`spectrum_race_guess` only).
8. First solve starts a **grace period** (mode version); match does not hard-cut immediately.
9. Reactions only (`ready`, `good_luck`, icons) with cooldown — no free chat.
10. After debrief, shared guess histories appear only for players with `shareGuessHistory: true` (“不公開我的猜測歷史” → set false before debrief).

### REST + WS

| REST | WS events |
|------|-----------|
| `POST /api/v1/spectrum/race/rooms` | `spectrum_race_join`, `ready`, `guess`, `reaction`, `share_setting` |
| `POST /api/v1/spectrum/race/rooms/join` | `spectrum_race_phase`, `progress`, `guess_feedback`, `debrief`, `reconnected` |

## Files

| Area | Path |
|------|------|
| Public sanitizer | `packages/core/src/spectrum/public.ts` |
| Daily seed/truth | `apps/server/src/spectrum/daily.ts` |
| Runs | `apps/server/src/spectrum/runs.ts` |
| Race | `apps/server/src/spectrum/race.ts` |
| Migration | `apps/server/migrations/003_spectrum_online.sql` |
| Online UI | `apps/online-client/src/spectrum-play.ts` |
| Integration | `apps/server/src/spectrum.online.integration.test.ts` |

## Designated A/B case

On a 2-odor pool, truth `banana 60 + lemon 40` vs guess `banana 40 + lemon 60` ⇒ **`0A2B`** (both present, wrong %). On the standard 10-odor pool the same swap is **`8A2B`** (eight correct absences).

## Verification

```bash
npx vitest run packages/core/src/spectrum/spectrum.test.ts
npm run test:integration -w @suite/server
npm run typecheck -w @suite/server
npm run typecheck -w @suite/online-client
```

Covered: truth absent from pre-finish payloads, float-stable rebuild, canonical order, 0A2B, duplicate/replay/refresh timer, disconnect reconnect, identical race signals, leaderboard tie / participation split.

## Stop

Spectrum online Daily + Race delivered. No further Game 2 online work in this phase.
