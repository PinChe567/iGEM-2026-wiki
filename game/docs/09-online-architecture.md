# 09 — Online companion architecture

**Scope:** independent Online companion (`apps/online-client` + `apps/server`).  
**Non-goals for this foundation:** score ingestion, matchmaking UI, free chat, Redis/Kafka, multi-region.

## Separation from iGEM Wiki

| Artifact | Depends on online server? |
|----------|---------------------------|
| `apps/wiki-client` source | **No** |
| Wiki static `dist` / iGEM upload | **No** |
| `@suite/core` / `content` / `ui` | Shared libraries only; no network I/O |
| `apps/online-client` | Yes (REST + optional Socket.IO) |
| `apps/server` | Yes (PostgreSQL) |

Wiki pages must continue to open offline or on a static host with **no** infinite loading when the companion is down. Companion links from Wiki (if any) are ordinary **new-tab** outbound URLs — never iframes, never required for Game 1–3 play.

Game rules live only in `@suite/core` (+ `@suite/content`). Online code **imports** those packages; it must not fork rule logic.

---

## Trust boundaries

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (untrusted)                                        │
│  apps/online-client                                         │
│  - public nickname, UI state                                │
│  - HttpOnly session cookie (opaque; JS cannot read)         │
│  - short-lived WS ticket (memory only, never localStorage)  │
│  MUST NOT: set userId, role, score, rank, verified, win     │
└───────────────────────────┬─────────────────────────────────┘
                            │ same-origin HTTPS (prod)
                            │ Vite proxy → server (dev)
┌───────────────────────────▼─────────────────────────────────┐
│  Edge / reverse proxy (deployment)                          │
│  TLS termination, size limits, optional WAF                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  apps/server (trusted compute)                              │
│  - issues / validates sessions & CSRF                       │
│  - origin allowlist, rate limits, idle timeouts             │
│  - owns all authoritative identity & match truth            │
│  - secrets only via process env                             │
└───────────────────────────┬─────────────────────────────────┘
                            │ private network
┌───────────────────────────▼─────────────────────────────────┐
│  PostgreSQL (trusted store)                                 │
│  - users, sessions, runs, challenges, rooms, matches, …     │
│  - sensitive server_truth vs public_result columns          │
└─────────────────────────────────────────────────────────────┘
```

**Client is never trusted** for: `userId`, `verified`, `score`, `rank`, `role`, `win`, match outcomes, challenge answers, or session identity.

---

## Deployment assumptions

1. **Same-origin production:** online client static assets and API share one origin (e.g. `https://play.example.org` serves SPA; `/api` and `/socket.io` reverse-proxied to Node). Cookies use `Secure; HttpOnly; SameSite=Lax` (or `Strict` if no cross-site navigations needed).
2. **Development:** Vite on `:5180` proxies `/api` and `/socket.io` to the server on `:8787`. No production secrets in `.env.example`.
3. **Single region MVP:** one Node process (or a few behind a sticky LB) + one Postgres. No Redis/Kafka until proven need.
4. **Secrets:** `DATABASE_URL`, `SESSION_SECRET`, `CSRF` pepper if any — **server env only**. Never `VITE_*` for secrets; never commit real credentials.
5. **Wiki:** separate static host (iGEM). Online outage must not affect Wiki builds.

---

## REST / WebSocket flow

### Guest session (REST)

```
Client                         Server                         Postgres
  |  POST /api/v1/session/guest   |                              |
  |------------------------------>|  INSERT users (guest)        |
  |                               |----------------------------->|
  |                               |  INSERT sessions             |
  |                               |----------------------------->|
  |  Set-Cookie: sid=… (HttpOnly) |                              |
  |  body: { publicId, nickname, csrfToken }                     |
  |<------------------------------|                              |
```

Subsequent state-changing requests send `X-CSRF-Token` matching the session-bound token (double-submit / session-stored). Cookie alone is insufficient for mutating REST.

### Authenticated read

```
GET /api/v1/session/me          Cookie: sid
GET /api/v1/profiles/:publicId  public fields only
GET /api/v1/daily/:gameKey      metadata (no answers)
GET /api/v1/leaderboards/:id    public ranks/scores already published
```

**This foundation does not accept score POST.** Tables for `game_runs` / `leaderboard_entries` exist for later phases.

### WebSocket (Socket.IO)

```
1. Client GET /api/v1/ws-ticket  (authenticated cookie + CSRF-safe GET)
2. Server returns short-lived opaque ticket (TTL ~60s, single use)
3. Client connects: io({ auth: { ticket } })
4. Server validates ticket → attaches userId; rejects missing/expired/foreign origin
5. Events carry envelope: protocolVersion, gameVersion, contentVersion, challengeId|matchId
6. Incompatible versions → hard reject (close / error), never silent rule mismatch
```

Idle disconnect and max payload size apply on both HTTP and WS.

---

## Data minimization

| Collected | Purpose | Retention note |
|-----------|---------|----------------|
| Opaque `user_id` (server UUID) | Session binding | Until account purge |
| Public nickname | Display | Editable; moderated |
| Session hash (not raw cookie) | Auth | TTL + idle |
| Aggregated public leaderboard rows | Competition display | Challenge-scoped |
| Report / block rows | Safety | Operator review |
| **Not collected:** legal name, DOB, school, email, OAuth | — | — |

Guest copy must state: **without account recovery, changing device/browser does not restore guest progress.**

Logs may include request id, route, status, coarse error codes. Logs **must not** include session cookie values, WS tickets, full client IP (optional truncated hash only if needed later), or `server_truth` payloads.

---

## Schema (logical)

- `users` — opaque id, public_id, nickname, created_at, is_guest
- `sessions` — id, user_id, token_hash, csrf_hash, expires_at, idle_expires_at
- `game_runs` — run metadata; `server_truth` (jsonb, internal) vs `public_result` (jsonb, shareable)
- `daily_challenges` — game key, UTC date, versions, public metadata; secrets in `server_truth`
- `leaderboard_entries` — challenge_id, user_id, published score/rank fields only
- `rooms`, `matches`, `match_players`, `match_events` — multiplayer scaffolding
- `moderation_actions` — report/block/action audit
- `blocks`, `reports` — player safety structures (UI later)

Sensitive columns are never returned by public endpoints.

---

## Versioning policy

Every game-related event / future submission includes:

- `protocolVersion` — wire schema
- `gameVersion` — which `@suite/core` game package contract
- `contentVersion` — content pack
- `challengeId` and/or `matchId`

Server compares against supported ranges. Mismatch → `409` / WS `version_mismatch` with explicit codes. No silent fallback to alternate rules.

---

## Security controls (MVP)

| Control | Mechanism |
|---------|-----------|
| Session | Opaque cookie, hashed at rest, Secure+HttpOnly(+SameSite) |
| CSRF | Session-bound token on mutating REST |
| Origin | Allowlist (`ORIGIN_ALLOWLIST`) |
| Payload | Body size limit (e.g. 32 KiB JSON) |
| Rate limit | Per-IP + per-session buckets on sensitive routes |
| Idle | Session idle timeout; WS ping timeout |
| Identity spoofing | Ignore client-supplied user id / roles |
| Nickname | NFC normalize, length, strip controls, ban system labels |

---

## Local development

```bash
# Postgres (no production passwords)
docker compose -f apps/server/docker-compose.yml up -d

# Copy apps/server/.env.example → apps/server/.env (local only)
npm run db:migrate -w @suite/server
npm run dev -w @suite/server
npm run dev -w @suite/online-client
```

Wiki remains: `npm run dev:wiki` — no proxy to online required.

Integration tests use `DATABASE_URL` when Postgres is reachable; otherwise they fall back to an in-process **PGlite** database so CI/dev machines without Docker can still exercise migrations and HTTP/WS security cases. Production always targets real PostgreSQL.

---

## API surface (this phase)

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | none |
| POST | `/api/v1/session/guest` | none (rate limited) |
| GET | `/api/v1/session/me` | session |
| POST | `/api/v1/session/logout` | session + CSRF |
| PATCH | `/api/v1/profile` | session + CSRF |
| GET | `/api/v1/profiles/:publicId` | optional session |
| GET | `/api/v1/daily/:gameKey` | optional |
| GET | `/api/v1/leaderboards/:challengeId` | optional |
| GET | `/api/v1/ws-ticket` | session |

OpenAPI: `apps/server/openapi/openapi.yaml`  
Event envelope: `apps/server/schemas/events.schema.json`
