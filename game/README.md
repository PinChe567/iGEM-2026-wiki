# Odor Pixel Suite

iGEM education suite: three playable Wiki games, plus an optional workshop study mode. Pure-static wiki build (Vite multi-page), TypeScript workspaces.

## Quick start

```bash
npm install
npm run dev:wiki
```

Open the printed local URL. The hub lists **Game 1 Odor Pixel Lab**, **Game 2 AeroSense: Scentbound Labyrinth**, and **Game 3 Scent Mixer**. All three are active.

Workshop / education evidence (optional): append `?study=1` to a game URL. Everyday visitors play immediately — no pre-test. See `docs/education-study-protocol.md` and `docs/education-games/`.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev:wiki` | Vite dev server |
| `npm run build:wiki` | Production static build → `apps/wiki-client/dist` |
| `npm test` | Vitest |
| `npm run test:e2e` | Playwright smoke (all three games + hub) |
| `npm run typecheck` | TypeScript `--noEmit` across packages |
| `npm run check:external-assets` | Fail on runtime CDN/Google Fonts/etc. in dist |
| `npm run release:check` | Full Wiki release suite (typecheck, build, tests, e2e, asset gates) |

Serve the build without the Vite dev server:

```bash
npm run build:wiki
npx --yes serve apps/wiki-client/dist
```

Summarize exported study JSON (descriptive counts only):

```bash
node scripts/summarize-education.mjs path/to/export.json [--out out-dir]
```

## Layout

- `apps/wiki-client` — hub, about, education, games
- `packages/core` — game engines + education evidence schema
- `packages/content` — versioned odor content schema
- `packages/ui` — shared tokens / shell / components
- `docs/education-games/` — reusable educator package (protocol, question bank, data dictionary)

## Science vs experiment

The games are **educational illustrative models**. They do not validate AeroSense sensor performance or report experimental concentrations. Science / model-limit copy lives in the suite dialog, `about/index.html`, and each game’s Science note.
