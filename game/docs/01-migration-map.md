# 01 — Migration map (legacy → suite)

Legacy root files are **kept** for acceptance comparison. The wiki client is the new entrypoint.

| Legacy path | New path | Notes |
|-------------|----------|-------|
| `index.html` | `apps/wiki-client/games/pixel/index.html` + `apps/wiki-client/games/pixel/src/main.ts` (markup) | Shell chrome moved to shared mount; game body markup preserved in TS template |
| `app.js` | `apps/wiki-client/games/pixel/src/game.ts` | Rules unchanged; RNG via `@suite/core`; odors via `@suite/content` `toLegacyOdors()` |
| `styles.css` | `apps/wiki-client/games/pixel/src/styles.css` + `packages/ui/src/{tokens,shell,components}.css` | Google Fonts `@import` removed; system font stacks in tokens |
| `assets/odor-atlas.png` | `apps/wiki-client/games/pixel/assets/odor-atlas.png` (+ copy under `public/assets` for hub static) | Credit still `TODO-VERIFY` in content schema |
| `README.md` | Still present; suite scripts documented in root `package.json` / `docs/01-foundation-result.md` | |
| `docs/00-current-audit.md` | unchanged | Audit baseline |

## New packages

| Package | Role |
|---------|------|
| `packages/core` | Seeded RNG (`createRng` / `shuffle`), suite version metadata |
| `packages/content` | Versioned odor catalog schema + records |
| `packages/ui` | Design tokens, page shell, buttons, modal, focus styles |
| `apps/wiki-client` | Vite multi-page hub + Game 1 (`base: './'`) |

## Hub routes

| URL (relative) | Status |
|----------------|--------|
| `index.html` | Suite hub (zh-Hant / en) |
| `games/pixel/index.html` | Game 1 playable |
| Game 2 / Game 3 | Hub cards only — **disabled**, no blank pages |
