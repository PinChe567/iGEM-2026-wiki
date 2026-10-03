# 02 — Pixel Lab rule extraction result

**Scope:** Game 1 only. Game 2 / Game 3 / online backend untouched.

## Done

- Pure rules in `packages/core/src/pixel` (pattern, uniqueness, similarity, questions, fixed-count OFF-cell noise 0/10/20/30/40%, scoring, session seeds, storage migration).
- UI consumes `@suite/core/pixel`; does not recompute rules.
- Explicit seeds + `seedVersion` / `contentVersion` / `gameVersion`; practice randomize + copy/replay; daily fixed preset.
- Illustrative virtual-receptor labeling + science modal + asset credit `TODO-VERIFY`.
- Feedback: nearest from pool + visual pattern diff; keyboard 1–4 / Enter / Esc; high-contrast & patterned noise cells.
- Versioned localStorage + clear-data control (no names/analytics).

## Acceptance

| Command | Result |
|---------|--------|
| `npm run typecheck` | PASS |
| `npm test` | PASS (22) |
| `npm run test:e2e` | PASS (1 Playwright smoke) |
| `npm run build:wiki` | PASS |
| `npm run check:external-assets` | PASS |
