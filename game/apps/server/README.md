# Online companion server (not part of iGEM Wiki static deliverable)

## Quick start

```bash
# from repo root
docker compose -f apps/server/docker-compose.yml up -d
cp apps/server/.env.example apps/server/.env   # local only — never commit
npm install
npm run db:migrate -w @suite/server
npm run dev -w @suite/server
# other terminal:
npm run dev -w @suite/online-client
```

Open http://127.0.0.1:5180 — Vite proxies `/api` and `/socket.io` to `:8787`.

## Tests

```bash
npm run test -w @suite/server
npm run test:integration -w @suite/server   # requires Postgres on DATABASE_URL
```

## Secrets

Never put production passwords in `docker-compose.yml`, Vite `VITE_*` env, client bundles, or git.
Production secrets live only in server process environment.
