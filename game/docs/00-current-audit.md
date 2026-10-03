# 00 — Current Repository Audit

**Date:** 2026-08-01  
**Scope:** Read-only audit of the as-shipped single-game static site.  
**Constraint honored:** No game refactor, no framework change, no edits to existing HTML/CSS/JS. This file is the only addition.

**Verdict preview:** **NO-GO** for starting Game 2 / Game 3 until the Blocker items in §10 are closed. The current Game 1 is playable as a static page, but noise-% correctness and scientific framing risks block suite expansion.

---

## 1. Inventory

### 1.1 File tree

```
game/
├── index.html                 # Single-page shell (markup, dialogs, copy)
├── app.js                     # All game logic, odor data, rendering, audio
├── styles.css                 # Layout, LED matrix, responsive, motion
├── README.md                  # Run instructions + high-level rules
├── assets/
│   └── odor-atlas.png         # 5×4 sprite sheet for 20 odor images (~2.09 MB)
└── docs/
    └── 00-current-audit.md    # This audit (added this phase)
```

No `package.json`, no bundler, no `node_modules`, no test directory, no `.gitignore` observed in the working tree for this audit.

### 1.2 File purposes

| Path | Role |
|------|------|
| `index.html` | Document shell: header, intro, control chrome, `#playArea` mount, `#atlasDialog` / `#guideDialog`, script include |
| `app.js` | Odor catalog (`ODORS`), levels, pattern generation, quiz flow, atlas UI, Web Audio tones |
| `styles.css` | Visual system, LED / option / modal styles, breakpoints `@media (max-width: 900px|680px)`, reduced-motion partial support |
| `README.md` | How to open / `python3 -m http.server 4173`; summarizes rules |
| `assets/odor-atlas.png` | Cropped via CSS `background-position` into per-odor thumbnails |

### 1.3 Runtime dependencies

| Dependency | Required? | Source |
|------------|-----------|--------|
| Modern browser DOM (`querySelector`, `<dialog>`, CSS Grid, custom properties) | Yes | Browser |
| Web Audio API (`AudioContext` / `webkitAudioContext`) | Optional | Browser; failures swallowed in `playTone` |
| Google Fonts (Noto Sans TC, DM Mono) | Soft | `styles.css` `@import` — layout works with `system-ui` fallback |
| Node / npm / build tooling | No | Not used at runtime |
| Network `fetch` / XHR | No | None in code |
| Canvas API | No | LED matrix is DOM `<i class="led-cell">` grid, not `<canvas>` |

### 1.4 External URLs and asset sources

| URL / asset | Where | Purpose |
|-------------|-------|---------|
| `https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Noto+Sans+TC:wght@400;500;600;700;800&display=swap` | `styles.css:1` | Font CSS |
| (transitive) `fonts.gstatic.com` font files | Loaded by Google Fonts CSS | Font binaries |
| `assets/odor-atlas.png` | `styles.css` `.smell-visual` | Local relative sprite; **2,193,351 bytes**; SHA-256 `186394DE809D5638871438951FDA5DF7DA83E8EB87A38BB6959B6951EAE5FD06` |
| Inline `data:image/svg+xml,…feTurbulence…` | `styles.css` `.noise` | Decorative grain overlay |
| `http://localhost:4173` | `README.md` only | Local server example — not referenced by app code |

All app resource paths are **relative** (`styles.css`, `app.js`, `assets/odor-atlas.png`). No absolute site paths like `/game/...`.

**Media credits / license:** None in repo. `odor-atlas.png` has no attribution, license, or generation note in `README.md` or HTML.

---

## 2. Game rules restored from code

### 2.1 Catalog and levels

- **Odor catalog:** 20 entries in `ODORS` (`app.js`), each with `id`, Chinese `name`, English `en`, and a 5-D hand-authored `vector` (implicit axes used in UI copy: 果香 / 花香 / 清新 / 烘焙 / 鹹鮮 — see `index.html` guide).
- **Session pool:** Each run shuffles all 20 and takes **6** (`beginStudy` → `shuffle(ODORS).slice(0, 6)`).
- **Matrix sizes (main levels):** 3×3, 4×4, 5×5, 6×6, 7×7 (`LEVELS`), names 感知初醒 → 神經星圖.
- **Activation presets:** `[1, 5, 10, 15, 20]` percent (`ACTIVATIONS`).
- **Questions per run:** 10. **Pass:** ≥ 6 correct (60%). **Score:** +100 per correct; max 1000 (`answerQuestion` / `renderResult`).

### 2.2 Pattern generation (`rawOdorPattern` / `patternsForSize`)

For size `n`, `total = n²`:

1. Each cell gets a deterministic 5-D “receptor” feature vector from `hash(\`receptor-${size}-${index}\`)` → `cellFeatures`.
2. Affinity = weighted sum of cell features × odor vector, normalized by sum of odor vector components; plus a small personal jitter `personal() * 0.13` from `hash(\`${odor.id}-${size}\`)`.
3. Top `activeCount = max(3, round(total * 0.36))` cells become ON (base encoding).
4. Patterns are cached per size. If two odors collide on the same bitstring, `patternsForSize` tries single-cell ON↔OFF swaps until unique (comment: “个体簽名”).

**Observed uniqueness (scripted reimplementation of the same helpers, 2026-08-01):**

| Size | Active cells | Collisions before fix | Unique after fix |
|------|--------------|----------------------|------------------|
| 3×3 | 3 | 10 | 20/20 |
| 4×4 | 6 | 10 | 20/20 |
| 5×5 | 9 | 2 | 20/20 |
| 6×6 | 13 | 2 | 20/20 |
| 7×7 | 18 | 0 | 20/20 |

Patterns are **deterministic** for a given `(odor.id, size)` after collision repair; not sampled from wet-lab data.

### 2.3 Similarity

`similarity(a, b)` = cosine similarity of the hand-authored 5-D vectors. Used to:

- Prefer **near** distractors in `makeQuestions` (top similar in pool, take 2, plus 1 farther from remaining).
- Pick a “nearest neighbor” name for feedback copy after answering (nearest among **all 20**, not only session pool).

### 2.4 Interference / noise (`noisyPattern`)

```text
noiseCount = min(offCells.length, round(n² * activation / 100))
```

Noise indices are chosen only among **currently OFF** base cells, shuffled with seed `` `${odor.id}-${size}-${activation}-${round}` ``. Quiz markup paints noise cells as `.noise-cell` (purple); base ON as `.on` (lime).

**See §4 for actual counts vs UI.**

### 2.5 Question selection (`makeQuestions`)

1. Answer list = shuffle(session 6 + 4 random repeats from the same 6) → 10 answers.
2. Each question: 4 options = correct + 2 similar distractors + 1 farther distractor from the session pool; options shuffled.

### 2.6 Flow, scoring, pass

1. **ready** → start → **study** (must advance through furthest unlocked odor; last step confirms) → **quiz** (10) → **result**.
2. Changing level tab or activation resets to **ready** (`setLevel` / activation picker).
3. Pass badge if `score/100 >= 6`; perfect fanfare if 10/10; “next level” only if passed and not last level.

### 2.7 Audio

`playTone` / `playFanfare` via Web Audio sine beeps; `state.muted` toggled by `#soundButton`. No external audio files.

### 2.8 Responsive behavior (`styles.css`)

| Breakpoint | Behavior |
|------------|----------|
| ≤900px | Single-column game card; control panel becomes 3-column strip; **stats + encoding key hidden** |
| ≤680px | Narrower chrome; level tabs compact; ready/quiz/result/study stack to one column; atlas 2 columns; guide list tighter |
| `prefers-reduced-motion: reduce` | Sets `animation-duration: .01ms` and `scroll-behavior: auto`; **does not** zero `transition-*` |

Sprite mapping: `visualStyle(index)` assumes 5 columns × 4 rows (`background-size: 500% 400%`).

---

## 3. Syntax checks and tests

### 3.1 What exists

- **No test framework** (no Jest/Vitest/Playwright/etc., no `*.test.js`).
- **No `package.json` scripts.**

### 3.2 Commands actually run (2026-08-01)

| Command | Result |
|---------|--------|
| `node --check app.js` | **PASS** (`EXIT 0`, logged `SYNTAX_OK`). Node v24.14.0 |
| `node --check index.html` | **N/A** — Node rejects `.html` (`ERR_UNKNOWN_FILE_EXTENSION`). Not a meaningful HTML validator |
| Automated unit/e2e suite | **None** — not pretended |

Ad-hoc Node scripts (not committed) were used only for this audit to recompute `noiseCount` and pattern uniqueness; they are not project tests.

---

## 4. Correctness bugs and noiseCount audit

### 4.1 Actual `noiseCount` by size × activation%

Formula evidence: `noisyPattern` in `app.js`  
`Math.min(off.length, Math.round(size * size * activation / 100))`  
with `off.length = total - max(3, round(total * 0.36))`.

| Matrix | total | active | off | **1%** | **5%** | **10%** | **15%** | **20%** |
|--------|------:|-------:|----:|-------:|-------:|--------:|--------:|--------:|
| 3×3 | 9 | 3 | 6 | **0** | **0** | 1 | 1 | 2 |
| 4×4 | 16 | 6 | 10 | **0** | 1 | 2 | 2 | 3 |
| 5×5 | 25 | 9 | 16 | **0** | 1 | 3 | 4 | 5 |
| 6×6 | 36 | 13 | 23 | **0** | 2 | 4 | 5 | 7 |
| 7×7 | 49 | 18 | 31 | **0** | 2 | 5 | 7 | 10 |

Raw `round(total * pct/100)` never exceeds `off` at these presets, so the `min(off, …)` cap does not change these numbers today.

### 4.2 UI vs reality

| UI claim | Evidence | Match? |
|----------|----------|--------|
| Selectable **1%** 干擾活化 | `#activationPicker` / `ACTIVATIONS` | Label exists, but **noiseCount = 0 on every size** → no purple cells |
| 3×3 **5%** | same | **noiseCount = 0** → 5% identical to 1% on 3×3 |
| 「隨機加入亮點干擾；比例越高，辨認越有挑戰」 | `index.html` control-group copy | **False at 1% (all sizes)** and **3×3 @ 5%** |
| Guide: 「紫色亮點是隨機干擾」 | `index.html` `#guideDialog` | Misleading when noiseCount is 0 |
| Encoding key always shows 干擾活化 swatch | `.encoding-key .key-noise` | Suggests noise is present even when count is 0 |
| Effective rate ≠ labeled % | e.g. 7×7 @ 20% → 10/49 ≈ **20.4%**; 5×5 @ 10% → 3/25 = **12%** | Rounding skew |

### 4.3 Other correctness / logic issues

1. **Default activation is the no-op tier** — `state.activation = 1` → always zero noise until user picks ≥5% (and ≥10% on 3×3).
2. **Feedback “nearest” may be outside the session pool** — `answerQuestion` sorts over full `ODORS`, so copy can mention an odor the player never studied this run.
3. **Ready showcase odor ≠ session** — `renderReady` uses `ODORS[min(level*4, 19)]`, unrelated to the upcoming random 6.
4. **Brand “home” does not reset** — `a.brand[href="#"]` does not call `setLevel` / clear quiz state (aria-label claims 回到遊戲首頁).
5. **Tab semantics incomplete** — `#levelTabs` is `role="tablist"` / `role="tab"` but no `tabpanel`, `aria-controls`, or arrow-key tab pattern.

---

## 5. Scientific narrative risks

### 5.1 Explicitly artificial (safe if labeled as such)

| Artifact | Evidence | Nature |
|----------|----------|--------|
| 5-D odor `vector` numbers | `ODORS` literals | Hand-tuned illustrative weights |
| Cell “receptor” features | `cellFeatures` hash seed ``receptor-${size}-${index}`` | PRNG geometry, not measured receptors |
| Active fraction ~36% | `round(total * .36)` | Design constant |
| Collision repair swap | `patternsForSize` | Game fairness hack |
| Cosine “similarity” | `similarity()` | Toy metric on toy vectors |
| Noise % | `noisyPattern` | Game difficulty knob |

### 5.2 Copy that can be misread as real biology / device data

| Text / label | Location | Risk |
|---------------|----------|------|
| Eyebrow **「NEURAL SCENT TRAINING」** | `index.html` `.eyebrow` | Implies neural training / neuroscience protocol |
| Level name **「神經星圖」** | `LEVELS[4].name` | “Neural star map” framing |
| Guide: each cell has **敏感度** to 果香/花香/… | `#guideDialog` `.similarity-note` | Reads like real receptor tuning curves |
| Control label **「干擾活化率」** | `index.html` | Sounds like biological / sensor activation rate, not “extra LEDs” |
| Hash seed substring **`receptor-`** | `cellFeatures` (code-only, but leaks into narrative if documented) | Suggests receptor model |
| README: features closer → more overlap | `README.md` | True for the toy model; easy to cite as experimental finding |
| No disclaimer that patterns are **not** AeroSense / wet-lab outputs | Whole UI | High risk for iGEM judges / public if project also discusses AeroSense |

**Note:** The string “AeroSense” does **not** appear in this repo. Risk is **associative** if this game is embedded next to team hardware/wet-lab pages without a “schematic / educational toy” disclaimer.

### 5.3 Numbers that look empirical but are design constants

- 20 odors, 6 per session, 10 questions, 60% pass, 36% fill, activation ladder 1–20%, score 100/question.

---

## 6. iGEM static deployment risks

| Risk | Severity | Evidence | Notes |
|------|----------|----------|-------|
| Google Fonts runtime dependency | High for offline / strict CSP wiki mirrors | `styles.css:1` `@import` | Wiki CSP or China network may block; FOUT / failed load |
| No self-hosted fonts | — | Only Google + `system-ui` fallback | Fallback OK visually but brand typography changes |
| Large atlas PNG (~2.1 MB) | High for wiki upload / mobile | `assets/odor-atlas.png` | Compress / resize / WebP+PNG fallback recommended later |
| No media license / credits | High for iGEM attribution norms | Missing from README/HTML | Must document source (AI, photo, CC, team-drawn) before public |
| Absolute paths | Low (currently OK) | Relative `href`/`src` only | Keep relative when moving under suite folders |
| Runtime fetch | None | No `fetch`/`XHR` | Good for static hosting |
| CDN JS | None | Vanilla `app.js` | Good |
| `<dialog>` support | Medium on very old browsers | `atlasDialog` / `guideDialog` | Acceptable for 2026 education sites; polyfill only if required |
| Embedding in MediaWiki | Medium | Inline script + external fonts | Team wiki may strip scripts; plan standalone URL or allowed JS path |

---

## 7. Accessibility

| Area | Current state | Evidence |
|------|---------------|----------|
| **Canvas** | **None.** Matrix is DOM grid of `<i class="led-cell">` inside `role="img"` + `aria-label` | `matrixMarkup` |
| Canvas text alternative | N/A (no canvas). Matrix has summary label but **individual ON/noise cells are empty `<i>`** — screen readers get size + label only, not which cells light | `matrixMarkup` |
| Dialogs | Native `<dialog>`; backdrop click closes; close buttons have `aria-label` | `index.html`, listeners in `app.js` |
| Live region | `#playArea` has `aria-live="polite"` — full re-renders may be verbose | `index.html` |
| Keyboard | Buttons are focusable; **no custom focus styles** (`.focus-visible` / `:focus-visible` absent); tablist lacks arrow-key behavior | `styles.css` / `renderControls` |
| Touch | Buttons generally OK; `.study-dot` hit height is **5px** | `.study-dot` |
| Color vision | Base = lime, noise = purple, wrong = coral — **hue-only encoding** for LED meaning; option cards also get ✓/× text marks after answer | `.led-cell.on` / `.noise-cell` / `.option-mark` |
| Reduced motion | Animations nearly disabled; **transitions** (hover lift, progress width) still run | `@media (prefers-reduced-motion)` only sets `animation-duration` |
| Sound toggle | `aria-label` updates; icon path does not switch to a “muted” glyph (color only) | `#soundButton` |
| Language | `lang="zh-Hant"` set | `index.html` |

---

## 8. Mobile layout and performance

### 8.1 Layout

- ≤900px hides **氣味數量 / 題數 / 及格** and the **encoding color key** — players lose the green/purple legend exactly when space is tight.
- ≤680px stacks quiz matrix above options; long pages (`min-height: 700px` play area) increase scroll.
- Five level tabs on narrow screens compress labels (`LEVEL 0x` at 8px) — readable but cramped.
- Atlas detail insert spans full grid; OK but tall on 2-column mobile atlas.

### 8.2 Performance

- **~2.1 MB** sprite is the main cost (decode + memory on low-end phones).
- Fixed full-viewport SVG noise overlay (feTurbulence) — cheap alone, but extra compositing on weak GPUs.
- Continuous CSS animations: `.matrix-aura` breathe, `.noise-cell` flicker (when noise present).
- Replacing `#playArea` `innerHTML` each step discards DOM (acceptable for this size; watch if suite shares one mega-bundle later).
- No image `width`/`height` hints on smell visuals (CSS aspect-ratio only).

---

## 9. Findings by severity

Each item: **evidence** → **minimal fix** (do not implement in this phase).

### Blocker

| ID | Finding | Evidence | Minimal fix |
|----|---------|----------|-------------|
| B1 | **1% activation adds zero noise on all sizes**; default difficulty is identical to “no interference.” | `noisyPattern`; table §4.1; `state.activation = 1` | Change formula to guarantee ≥1 noise when activation &gt; 0 **or** remove/replace 1% tier; sync UI copy |
| B2 | **3×3 @ 5% also zero noise** — two UI tiers collapse. | §4.1 | Same as B1; for 3×3 use `max(1, round(...))` or percent-of-off-cells |
| B3 | **Scientific framing can be read as real receptor / neural / experimental data** with no “illustrative toy” disclaimer; dangerous beside AeroSense narrative. | `NEURAL SCENT TRAINING`, `干擾活化率`, guide 敏感度 copy, level `神經星圖` | Add visible disclaimer + rename activation to e.g. 「額外干擾比例」; avoid “receptor/neural” in player-facing strings |

### Major

| ID | Finding | Evidence | Minimal fix |
|----|---------|----------|-------------|
| M1 | Google Fonts hard `@import` — wiki/CSP/offline risk. | `styles.css:1` | Self-host WOFF2 or drop to stack already listed as fallback |
| M2 | `odor-atlas.png` ~2.1 MB + **no license/credits**. | `assets/odor-atlas.png`; README gap | Compress; add `docs/media-credits.md` or footer credit |
| M3 | Mobile hides encoding key — color meaning lost. | `@media (max-width: 900px)` `.encoding-key { display: none }` | Keep a compact key in play area during quiz/study |
| M4 | No automated tests; noise/% regressions undetectable. | No test runner | Add a tiny Node assert script for `noiseCount` table (no framework required) |

### Medium

| ID | Finding | Evidence | Minimal fix |
|----|---------|----------|-------------|
| N1 | Feedback nearest odor can be outside session pool. | `answerQuestion` filters `ODORS` | Restrict nearest to `state.sessionPool` |
| N2 | `prefers-reduced-motion` ignores transitions. | `styles.css` reduce block | Also set `transition-duration: 0.01ms` |
| N3 | Study progress dots are 5px tall targets. | `.study-dot` | Increase hit area via padding/`min-height` |
| N4 | Incomplete `tablist` a11y. | `renderControls` / `#levelTabs` | Either real tabs pattern or drop `role="tablist"` to button group |
| N5 | Brand link does not reset game. | `a.brand href="#"` | Wire to ready state or `location.reload()` intentionally |

### Minor

| ID | Finding | Evidence | Minimal fix |
|----|---------|----------|-------------|
| m1 | Ready matrix showcase odor unrelated to session. | `renderReady` `ODORS[level*4]` | Use neutral demo pattern or last session |
| m2 | Mute control lacks distinct icon geometry. | `#soundButton` SVG | Swap path when muted |
| m3 | Intro chip 「6 種隨機挑戰」 slightly ambiguous vs “6 odors / 10 questions”. | `.intro-chips` | Clarify copy |
| m4 | `aria-live` on whole play area may over-announce. | `#playArea` | Narrow live region to feedback only |

---

## 10. GO / NO-GO gate (before Game 2 / Game 3)

### NO-GO (current)

Do **not** begin implementing Game 2 or Game 3 until **all Blockers B1–B3** are fixed in Game 1 (or explicitly waived in writing by the team with judge-facing disclaimer copy already merged).

### GO criteria

| Gate | Required |
|------|----------|
| G1 | B1+B2: Documented noise table matches UI; every selectable activation% that claims interference produces **visible** noise on **every** matrix size (or that tier is removed). |
| G2 | B3: Player-visible disclaimer that encodings/vectors are **educational schematics**, not measured receptor maps / AeroSense experimental readouts; rename loaded terms (活化/neural/receptor) in UI. |
| G3 | M2 license/credits at least drafted for atlas art (can be short footer). |
| G4 | Suite folder plan from §11 agreed; Game 1 moves **without** rewriting rules mid-migration. |

**Major M1/M3/M4** are strongly recommended before public iGEM freeze but are not suite-start blockers if B1–B3 + G3 are done.

### After GO

Game 2 / Game 3 may be added as siblings under the suite map below; shared chrome/fonts/credits land in `shared/`.

---

## 11. File-by-file migration map → three-game suite

**Status: proposal only — not executed.**

### Target shape

```
game/   (or repo root)
├── index.html                 # Suite hub: pick Game 1 / 2 / 3
├── shared/
│   ├── styles/tokens.css      # Colors, fonts (self-hosted later)
│   ├── styles/chrome.css      # Topbar, footer, dialog primitives
│   ├── js/audio.js            # playTone / mute (extract from app.js)
│   ├── js/hash.js             # hash / shuffle helpers
│   └── assets/…               # Shared media + credits
├── games/
│   ├── pixel-lab/             # Current Game 1
│   │   ├── index.html         # Moved from ./index.html (paths adjusted)
│   │   ├── app.js             # Current app.js (then thin shared imports)
│   │   ├── styles.css         # Game-specific rules
│   │   └── assets/odor-atlas.png
│   ├── game-2/                # NEW later
│   │   ├── index.html
│   │   ├── app.js
│   │   └── styles.css
│   └── game-3/                # NEW later
│       ├── index.html
│       ├── app.js
│       └── styles.css
├── docs/
│   ├── 00-current-audit.md    # This file
│   ├── media-credits.md       # To add when clearing M2
│   └── 01-suite-plan.md       # Optional later
└── README.md                  # Hub + per-game run instructions
```

### File-by-file actions

| Current file | Migration action |
|--------------|------------------|
| `index.html` | Move → `games/pixel-lab/index.html`; replace root `index.html` with suite hub linking three games |
| `app.js` | Move → `games/pixel-lab/app.js`; later extract `hash`/`shuffle`/`playTone` into `shared/js/*` (optional second step) |
| `styles.css` | Split: keep game layout in `games/pixel-lab/styles.css`; move `:root` tokens + topbar/modal primitives to `shared/styles/*` when Game 2 needs them |
| `assets/odor-atlas.png` | Move → `games/pixel-lab/assets/odor-atlas.png` (or `shared/assets` if reused) |
| `README.md` | Rewrite as suite README; keep Game 1 rules subsection pointing at `games/pixel-lab/` |
| `docs/00-current-audit.md` | Stay; append suite changelog later |
| *(none)* | Add `games/game-2/**`, `games/game-3/**` only after GO gate |

### Non-goals for migration

- Do not rewrite pattern math while moving files.
- Do not introduce React/Vite/etc. in the migration step unless a later phase explicitly chooses a toolchain.
- Keep relative paths valid for both `file://` (if still required) and static server / wiki mirror.

---

## 12. Audit metadata

| Item | Value |
|------|-------|
| Node | v24.14.0 |
| `node --check app.js` | PASS |
| Project tests | None |
| Canvas | Not used |
| External runtime network | Google Fonts only (optional enhancement) |
| Phase result | **Audit complete; stop. No Game 2/3 work started.** |

---

**Final gate call: NO-GO** until Blockers **B1, B2, B3** (and credits gate **G3**) are satisfied.
