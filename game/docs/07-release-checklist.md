# Release checklist — Odor Pixel Suite (Wiki)

Use before any claim of Wiki readiness. Checkboxes are process gates; automation results belong in `docs/08-wiki-release-report.md`.

## Content

- [ ] zh-Hant + en strings proofread on hub, about, all three games
- [ ] Learning path labels match: Pattern Recognition → QC Shift (screening) → Scent Mixer
- [ ] Science / Model Limits copy does not claim wet-lab measurements or real concentration readout

## Science review

- [ ] Domain reviewer signs off illustrative / fictional-model disclaimers
- [ ] Spectrum antagonism/enhancement note present
- [ ] Labyrinth gates marked fictional

## Provenance / licensing

- [ ] Every entry in `assets-manifest.json` has author, source, license, verificationStatus
- [ ] No `TODO-VERIFY` remains for production release (`check:assets-manifest:release`)
- [ ] No unauthorized stock/web images used as fillers
- [ ] WebP siblings keep sprite crop dimensions; originals retained

## Device / UX

- [ ] Real phone + tablet smoke (portrait/landscape): hub, Game 1–3
- [ ] Keyboard-only path works (focus visible, skip link, dialogs Esc)
- [ ] High contrast + reduced motion toggles
- [ ] Safe-area padding acceptable on notched devices

## Language

- [ ] Full pass with UI locked to English
- [ ] Full pass with UI locked to zh-Hant

## Offline / no remote API

- [ ] Airplane mode / blocked network: suite still loads from static files
- [ ] `check:external-assets` PASS on `dist`
- [ ] No Service Worker registered

## iGEM preview

- [ ] Files copied into Wiki static tree with relative paths intact
- [ ] Hub reachable from Wiki navigation
- [ ] Optional online companion is a new-tab link only (no iframe dependency)
- [ ] Official CI/LICENSE/deps binaries untouched

## Automation (must run)

- [ ] `npm run typecheck`
- [ ] `npm run optimize:images`
- [ ] `npm run build:wiki`
- [ ] `npm run check:external-assets`
- [ ] `npm run report:bundle-size`
- [ ] `npm run check:assets-manifest` (dev warn OK)
- [ ] `npm run check:assets-manifest:release` (must PASS for release claim)
- [ ] `npm test` (unit + property + headless solo sims)
- [ ] `npm run test:e2e` (Playwright)
