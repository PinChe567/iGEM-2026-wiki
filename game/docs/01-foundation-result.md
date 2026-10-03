# 01 — Foundation result

**Date:** 2026-08-01  
**Phase goal:** Maintainable three-game suite skeleton + iGEM pure-static wiki build.  
**Game 2 / Game 3 gameplay:** not implemented (hub placeholders only).  
**Game 1 rules:** unchanged (behavioral parity migration).

## Delivered

| Item | Status |
|------|--------|
| npm workspaces (`apps/wiki-client`, `packages/core`, `packages/content`, `packages/ui`) | Done |
| TypeScript + ESM + Vite multi-page (`base: './'`) + Vitest | Done |
| Lockfile (`package-lock.json`) | Done — pinned vite `6.0.11`, vitest `3.0.5`, typescript `5.7.3` |
| Hub with Game 1 enterable; Game 2/3 disabled “開發中 / Coming soon” | Done |
| Game 1 at `apps/wiki-client/games/pixel` | Done |
| Legacy root files retained | Done (`index.html`, `app.js`, `styles.css`, `assets/`) |
| Shared tokens / shell / modal / button / focus | Done (`@suite/ui`) |
| Content schema + odor catalog (`contentVersion`, bilingual names, vectors, imageKey, source/credit status) | Done — credits `TODO-VERIFY` |
| Seeded RNG in `@suite/core` (legacy-compatible) | Done + tests |
| zh-Hant / en i18n for hub + shared shell | Done |
| No Google Fonts / CDN runtime; system font stack | Done |
| Scripts: `dev:wiki`, `build:wiki`, `test`, `typecheck`, `check:external-assets` | Done |

## Verification (ran this phase)

| Command | Result |
|---------|--------|
| `npm run typecheck` | PASS |
| `npm test` | PASS (10 tests) |
| `npm run build:wiki` | PASS → `apps/wiki-client/dist` |
| `npm run check:external-assets` | PASS |
| Static serve `apps/wiki-client/dist` (no Vite, no API) | Hub + Game 1 HTML/JS `200` |

Relative asset paths in dist HTML confirmed (`./assets/...`, `../../assets/...`).

## Migration map

See [`docs/01-migration-map.md`](./01-migration-map.md).

## Not migrated / deferred (explicit)

1. **Game 1 in-game copy i18n** — quiz/study/ready/atlas/guide strings remain zh-Hant for parity; only shell chrome (brand, footer, lang switch, sound/guide labels) is bilingual.
2. **Audit blockers B1–B3** (1% noise = 0, scientific disclaimer / rename) — **not fixed** this phase (rules must stay equivalent).
3. **Media credits / atlas compression** — schema flags `TODO-VERIFY`; ~2.1 MB PNG still shipped.
4. **Game 2 / Game 3** — no routes, no blank pages; hub cards disabled only.
5. **Deleting legacy root game files** — intentionally kept until later acceptance cleanup.
6. **Self-hosted custom fonts** — deliberately not downloaded; system stack only.
7. **Focus / a11y deep fixes** from audit (tablist pattern, study-dot hit area, etc.) — not in scope.
8. **Extracting pixel pattern engine into `@suite/core`** — logic still lives in `games/pixel/src/game.ts` (uses core RNG only).

## How to run

```bash
npm install
npm run dev:wiki          # development
npm run build:wiki        # static build
npx serve apps/wiki-client/dist   # preview build without Vite
```

**Stop here.** Next phases may fix audit blockers and/or implement Game 2/3 after GO gate.
