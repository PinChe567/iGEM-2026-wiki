# 09 — Online foundation result

**Date:** 2026-08-01  
**Status:** Foundation complete (score ingestion intentionally disabled)

## Deliverables

| Item | Path |
|------|------|
| Architecture | [`docs/09-online-architecture.md`](./09-online-architecture.md) |
| Server | `apps/server` (`@suite/server`) |
| Online client | `apps/online-client` (`@suite/online-client`) |
| OpenAPI | `apps/server/openapi/openapi.yaml` |
| Event schema | `apps/server/schemas/events.schema.json` |
| Migrations | `apps/server/migrations/001_init.sql` |
| Env example | `apps/server/.env.example` |
| Compose (local PG) | `apps/server/docker-compose.yml` |

## Separation from Wiki

- Wiki client has **no** dependency on `@suite/server` / `@suite/online-client` (enforced by `packages/core/src/wiki-online-isolation.test.ts`).
- `npm run build:wiki` produces a static `dist` that does not require the online server.
- Online companion is same-origin + Vite proxy in development; secrets stay in server env only.

## What works in this phase

- Guest session (opaque id, HttpOnly cookie, CSRF on mutating REST)
- Nickname normalize / reserve-list rejection
- Public profile read
- Daily challenge **metadata** (auto-seeded; `server_truth` never returned)
- Leaderboard **read** (empty until a later score phase)
- WS ticket handshake + version envelope hard-reject
- `POST /api/v1/scores` → **501**
- Schema: users, sessions, game_runs, daily_challenges, leaderboard_entries, rooms, matches, match_players, match_events, reports, blocks, moderation_actions, ws_tickets

## Verification run

| Check | Result |
|-------|--------|
| `npm run typecheck` | pass |
| `npm test` (unit, includes wiki isolation + server unit) | pass (84) |
| `npm run test:integration -w @suite/server` | pass (8) — uses real Postgres when reachable, else **PGlite** stand-in |
| `npm run build:wiki` | pass |
| `npm run build:online` | pass |
| `npm run build:server` | pass (`tsc --noEmit`) |

### Security cases covered in integration

- Unauthenticated `/session/me` → 401  
- Tampered cookie → 401  
- Expired idle session → 401  
- Wrong Origin → 403  
- Missing CSRF on PATCH → 403  
- Client-supplied `role` / `score` in body → 400 (strict schema)  
- Oversized body → ≥400  
- Rate limit burst → 429  
- WS without / with bad ticket → connect_error  
- WS version mismatch → `version_mismatch` + disconnect  
- Migration apply + re-apply idempotent  

## Local notes

- This machine had **no Docker**; integration tests fell back to PGlite. Prefer `docker compose -f apps/server/docker-compose.yml up -d` when available, then `npm run db:migrate`.
- Compose passwords are **dev-only**; production must inject secrets via server environment.

## Explicit non-goals (stop here)

- Accepting / ranking game scores  
- Matchmaking UI / free chat  
- Redis / Kafka / multi-region  
- Account recovery / email OAuth  
- Embedding Online inside iGEM Wiki pages  

## How to run companion

```bash
cp apps/server/.env.example apps/server/.env
# optional: docker compose -f apps/server/docker-compose.yml up -d
npm run db:migrate
npm run dev:server
npm run dev:online   # http://127.0.0.1:5180
```

Wiki offline path remains: `npm run dev:wiki`.
