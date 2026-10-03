# 08 — Wiki release report (Odor Pixel Suite)

**Date:** 2026-08-01  
**Scope:** Three-game Wiki static trilogy (no online backend).  
**Verdict:** **NOT ready for iGEM** — blocker FAIL on media provenance (`TODO-VERIFY`).

Do **not** claim “ready for iGEM” until the blocker below is cleared and `npm run check:assets-manifest:release` passes.

---

## Spec checklist

| # | Requirement | Result | Notes |
|---|-------------|--------|-------|
| 1 | Hub learning path Pattern Recognition → Identity & Path Deduction → Mixture Inference; cards show time / solo / concept / local progress | **PASS** | `hub.ts` + Explorer Level panel |
| 2 | Shared Science / Model Limits / Media Credits / Privacy (zh-Hant + en) | **PASS** | Shell modal + `about/index.html` |
| 3 | Explorer Level local non-competitive progress (not global rank) | **PASS** | `suite.explorer.v1`; copy states not a ranking |
| 4 | Unified nav, hub return, language, a11y, focus, safe-area, 404 / asset fallback | **PASS** | Shell skip-link + a11y dialog; `public/404.html`; relative hub links |
| 5 | `assets-manifest.json` + release fail on `TODO-VERIFY` | **FAIL (blocker)** | Manifest exists; release gate correctly **fails** on `odor-atlas` |
| 6 | WebP + fallback without breaking sprite crop; originals + conversion log | **PASS** | WebP 1568×1003 (= PNG); `assets/conversion-log.json`; CSS `image-set` |
| 7 | Runtime external audit | **PASS** | `check:external-assets OK` (29 text files in dist) |
| 8 | `docs/igem-integration.md` (dist layout, Frozen-Flask copy, no SW, companion = new-tab link) | **PASS** | Written |
| 9 | Release checklist | **PASS** | `docs/07-release-checklist.md` |
| 10 | Automation suite + bundle metrics (no invented Lighthouse/device claims) | **PASS*** | See runs below; *assets release gate still FAIL |

\*Automation for code quality passed; release readiness blocked by #5.

---

## Automation runs (this session)

| Check | Result |
|-------|--------|
| `npm run typecheck` | **PASS** |
| `npm run optimize:images` | **PASS** (WebP 139 914 bytes) |
| `npm run build:wiki` | **PASS** |
| `npm run check:external-assets` | **PASS** |
| `npm run report:bundle-size` | **PASS** — total **2 561 094 bytes (2.44 MiB)**, 31 files |
| `npm run check:assets-manifest` (dev) | **WARN** — `odor-atlas` TODO-VERIFY |
| `npm run check:assets-manifest:release` | **FAIL** — `odor-atlas` TODO-VERIFY |
| `npm test` (unit / property / headless solo sims) | **PASS** — 11 files / 73 tests |
| `npm run test:e2e` (Playwright) | **PASS** after hub `data-game` fix (pixel + labyrinth + spectrum) |
| Service Worker present | **PASS (absent)** — none registered |
| Lighthouse / real-device lab | **NOT RUN** — no fabricated scores |

### Largest dist assets

| Asset | Size |
|-------|------|
| `assets/odor-atlas-*.png` | **2141.9 KiB** |
| `assets/odor-atlas-*.webp` | **136.6 KiB** |
| `assets/labyrinth-*.js` | 44.8 KiB |
| `assets/spectrum-*.js` | 30.7 KiB |
| `assets/mount-*.js` | 30.7 KiB |

---

## Blocker — minimal fix

**Issue:** `odor-atlas` remains `TODO-VERIFY` for author / source / license / verificationStatus in `assets-manifest.json` (and matching `packages/content` credits). Production release mode is designed to fail until cleared.

**Minimal paths (pick one):**

1. **Verify rights:** Document real author, source URL/file, and license; set `verificationStatus` (and credit fields) to cleared values in `assets-manifest.json` **and** `packages/content/src/credits.ts`; re-run `npm run check:assets-manifest:release`.
2. **Replace asset:** Swap the sprite for a team-authored illustrative sheet (or CSS/SVG placeholders) that the team owns; keep crop geometry (`background-size: 500% 400%`); update manifest to credited/illustrative with no `TODO-VERIFY`; keep conversion log for any WebP step.

Until then: shipable as **internal/dev Wiki preview** only — **not** an iGEM-ready public media claim.

---

## Delivered paths (reference)

- Hub / Explorer: `apps/wiki-client/src/hub.ts`
- Legal modal + about page: `apps/wiki-client/src/legal/`, `apps/wiki-client/about/`
- Explorer progress: `apps/wiki-client/src/progress/explorer.ts`
- Manifest / gates: `assets-manifest.json`, `scripts/check-assets-manifest.mjs`, `scripts/optimize-images.mjs`
- Docs: `docs/igem-integration.md`, `docs/07-release-checklist.md`, this file
