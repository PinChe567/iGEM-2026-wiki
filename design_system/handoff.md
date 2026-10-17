# AeroSense · Signal Atlas v18 handoff

Historical verification reports referenced in this document are not included in the final release. Current editable website sources remain available.
12 October 2026. Read [strategy](strategy.md), [component specification](component-spec.md), [audit](audit.md), [base palettes](palettes-v14.json) and the [watercolor manifest](../assets/editorial/watercolor-v15/manifest.json). The v11 guide and older hero presentations are historical.

## Shared sources, in build order

| Layer | Responsibility |
| --- | --- |
| `styles/tokens.css` | Base typography, fallback tokens and common values |
| `styles/claude-crops.css` | Established proportional illustration crop positions |
| `styles/compatibility.css` | Reconciliation with existing components |
| `styles/foundation.css` | Heroes, article shell, illustrated headings and open bodies |
| `styles/components.css` | Controls, evidence, references and supporting components |
| `styles/home.css` | Shared homepage integration |
| `styles/illustration-palette.css` | Generated base colors from `palettes-v14.json` |
| `styles/palette-components.css` | Base palette application to retained components |
| `styles/content-alignment.css` | Common reading bounds and inline citation flow |
| `styles/watercolor-pixel-v15.css` | Watercolor paper, stepped headings and existing-card details |
| `styles/learning-color-v15.css` | Five-color lesson key, companions and protected answer states |
| `styles/evidence-caption-v15.css` | Caption insets, visible-width native captions and Engineering evidence/document presentation |
| `styles/pixel-frames-v16.css` | Palette-based native SVG nine-slice borders and true stepped corners on existing cards |
| `styles/editorial-v16.css` | Watercolor hero washes, plain breadcrumbs, credits and conceptual-diagram integration |
| `styles/hero-pixel-v17.css` | Full viewport covers, artwork geometry and TOC clearance |
| `styles/heading-insets-v17.css` | Chapter-title breathing room with preserved article text baselines |
| `styles/typography-v17.css` | Conventional serif outlines and larger bold sans-serif Hero titles |
| `styles/surface-harmony-v17.css` | Clean theme washes, broad stepped fields and page-colored footers |

These 18 layers are assembled in the listed order. V15 intentionally overrides the earlier zero-inset caption rule and brown-only Learning components. Keep page behavior with its owner. Homepage continuity overrides are in `css/home-continuum-v16.css`; `css/home-color-v17.css` follows it and harmonizes the forest-green night with sage and paper, and gives the notebook calendar a fine monochrome stepped outline with 24 px / 16 px inner padding. The shared sensing continuum owns the railway canvas and measured gradient stops through the team photograph. The homepage footer ends on a solid forest surface, without a transition gradient.

From the website root (`aerosense-wiki/`):

```text
python scripts/build-illustration-palettes-v14.py
python scripts/build-pixel-frames-v16.py
node scripts/build-design-system.mjs
node scripts/build-home-bundles.mjs
```

Use `palettes-v14.json` and the [palette generator](../scripts/build-illustration-palettes-v14.py) for base colors. Never edit generated CSS or bundles directly. Synchronize versioned asset URLs after final integration; the final report owns build hashes.

## Integration rules

- Preserve the original Claude PNG and [manifest](../assets/editorial/claude-v13/manifest.json). Heroes use `assets/editorial/watercolor-v15/hero-watercolor-atlas.png`, with 27 topics in a 6 × 5 grid. Keep crop proportions, paper texture and exclusion of filename labels. Learning geometry is in `css/learning-wiki-v12.css`; dynamic lesson markup is in `js/learning-module.js`.
- Retain the 27 v14 page bases. Learning keeps warm heroes and adds sage, sky, lavender, gold and coral lesson keys, with two or three companions in each lesson. Protect correct/incorrect semantics.
- Use actual stepped native-SVG borders on existing cards. Keep the watercolor hero level, without a paper-frame rotation or shadow; its edge mask and multiply blend integrate it into the page wash. The final surface layer removes scattered grain and small punched-out squares in favor of one broad stepped field. Keep body sections open and scientific 2D media clear; no pixelation of text or data.
- Align heading text, prose and evidence outer bounds. Heading fields bleed 24 px desktop / 16 px mobile, with matching inner padding and 20 px / 16 px vertical padding. Keep the reading column's overflow visible so the actual painted title inset survives ancestor clipping. Captions retain 24 px desktop / 16 px mobile internal padding. Direct table wrappers use `container-type: inline-size`; native captions use `100cqw` and horizontal sticky positioning while rows scroll.
- `js/hero-layout-v17.js` measures viewport width, parent inset and cover height to support full-bleed artwork without moving the article DOM. The TOC starts below the cover and retains its normal sticky behavior. Dynamic Learning covers are observed after insertion. Preserve the no-JavaScript painted fallback and print styling.
- Preserve justified prose, natural last lines, the 56 px bibliography-number column, inline citation flow, deliberate grids, scientific proportions and CAD geometry.
- The user clarified that f/j looked crooked, rather than moving in time. The current editorial font is Georgia with conventional serif outlines. Keep body text in Segoe UI and mono labels in AscMono; do not reintroduce Fraunces through the shared tokens or page overrides. Hero titles are enlarged Segoe UI 700; the long Entrepreneurship title has a smaller desktop cap to remain inside its column. Existing purposeful animations are unaffected.
- Keep Model's three studies and accessible navigation. Odor decoding is the default; specific hashes reveal their owning study. The neural teaching component lives in `assets/neural-circuit/` and has the stable anchor `#neural-circuit-demo`; it illustrates scripted patterns rather than reporting trained SNN results. Keep Engineering reader modes, Skip and in-flow Expand all. Nine media-free status blocks are evidence asides with their anchors; five actual figures remain. The V1 preview links to the archived circuit-schematic PDF.
- Preserve scientific values, sources, limits, genuine images and meaningful colors. Editorial art is outside scientific numbering; Parts maps document design rather than receptor function.
- Hardware's PCB circuit details stay visible as a normal section. Selecting a board marker updates and focuses its explanation beneath the fixed navigation. Model Figure 7 panel C uses a linear 0–100% axis; retain its original four conditions and eight saved values. The existing two-condition selected-design chart on Hardware is unchanged.

## Verification handoff

- `reports/check-learning-color-v15.cjs --compiled`: 14 cases at 1440/390 px; JSON (historical record), report (historical record).
- `reports/check-model-parts-captions-v15.cjs`: Model/Parts at both widths; JSON (historical record).
- `reports/check-caption-widths-v15.cjs`: 205 checks across 38 page/width/study cases, including all three Model tabs; JSON (historical record). Checks preserve native display, visible width and horizontal caption position.

Representative Learning, Model and Parts screenshots were inspected. The v14 report (historical record) preserves palette/alignment and Notebook history. The v15 integration report (historical record) records final combined checks; do not infer its outcome from these scoped runs. This handoff makes no deployment claim.

## Attributions presentation

At the user's request, `attributions.html` embeds the live official record at `https://teams.igem.org/wiki/6460/attributions`. It uses the same illustrated Hero as the other chapters; the main content is the official form, without a parallel editorial contribution record. The five official categories and their submitted contents load inside the iframe. `css/attributions-embed-v17.css` controls only its shell and iframe bounds; shared Hero and surface layers own its cover and footer. The official form remains unchanged. Artwork, software and AI provenance remain in `credits.html`, linked from the footer. No official form was edited or submitted.

The v17 integration record is `reports/2026-10-12-hero-harmony-v17.md`, with scoped QA in `reports/hero-v17/`, `reports/home-v17/`, `reports/attributions-v17/`, `reports/engineering-v17/`, `reports/hardware-v17/` and `reports/visual-v17/`. Older reports remain historical evidence, not a claim about the later build.

## V18 loading and illustration refinements

The current follow-up is `reports/2026-10-12-first-paint-v18.md`.

The three workspace-level installer/prerender commands described below are historical migration steps, not commands in the current self-contained release workflow. Their resulting HTML and runtime files are retained. Use the website-root build commands above for current retained generators.

- `js/hero-first-paint-v18.js` is inlined after the head stylesheets in every chapter that uses the Hero helper. It measures progressively parsed covers before they can paint at the old column width. `js/hero-layout-v17.js` takes over the observers without changing the initial geometry or hiding the cover. After editing the bootstrap, regenerate all copies with `python scripts/install_hero_first_paint_v18.py` from the workspace root.
- The five Learning reading editions now use the same `renderHero` output and layout as the interactive edition. Their original reading content remains available without JavaScript. Runtime activity initialization preserves the existing header node. After changes to lesson Hero content or its renderer, run `node scripts/prerender_learning_heroes_v18.cjs`, then refresh cache fingerprints.
- Long articles include their native mobile contents menu in the initial HTML so its arrival cannot push the Hero down. `js/judging-review-v7.js` reuses this menu; Model filters it by the active study. After changing section headings or anchors, run `python scripts/prerender_mobile_contents_v18.py` from the workspace root. Both prerender generators support `--check`. Rebuild the Home bundle when changing the judging script, even when the behavior change is limited to article pages.
- Homepage stars and all 18 curves retain their original spread through the team photo; do not restore the narrow arrival multiplier or straight corridor. Only the current's center is gently guided toward the photograph. The solid homepage footer remains unchanged.
- The native `assets/visuals/home-learning-book.svg` uses thin sage covers, warm paper and a light wash. The cute inline fly and all five chapter links retain their original positions. Keep the fifth link inside the right page and preserve mobile touch targets.
- Hardware's component explorer is the immediate sibling after PCB Figure 1. The always-open circuit narrative and schematic follow it; do not put intervening content between the PCB and its interactive component explanations.
