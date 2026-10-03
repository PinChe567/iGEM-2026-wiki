# 06 — Scent Spectrum model (混香解碼局)

**Product:** 混香解碼局 / Scent Spectrum  
**Scope of this document:** pure core + content + **dev-only** visualizer. No full player UI, no online multiplayer.  
**Model flag:** signatures are `illustrativeGenerated` — **not** AeroSense / HEK293T / Drosophila experimental data.

## Package layout

| Layer | Path |
|-------|------|
| Content (16×12-D signatures) | `packages/content/src/spectrum/` |
| Pure rules | `packages/core/src/spectrum/` |
| Dev visualizer | `apps/wiki-client/games/spectrum-visualizer/` |
| Import | `@suite/core/spectrum`, `@suite/content` |

## Virtual receptor channels

- Exactly **12** channels (indices `0 … 11`).
- Each odor has a versioned signature vector in `[0, 1]^12`.
- Provenance field: **`illustrativeGenerated`** only.
- Content version: `SPECTRUM_CONTENT_VERSION` (`1.0.0`).

Do **not** implement FFT-based component naming. The waveform is a channel response plot, not a spectrogram of a physical time series.

### Why the waveform x-axis is channel index (not time / frequency)

Each axis tick is one **virtual receptor channel** in the illustrative model. The connected curve is only a visual aid so the 12-bar pattern is easier to compare. It is **not**:

- a time-domain odorant concentration trace,
- a frequency / FFT spectrum of a sensor voltage,
- a claim that adjacent channels are ordered by chemistry.

Channel order is a stable game convention (`0…11`), not a physical frequency axis.

## Difficulty presets

| Mode | Pool | Components (selected) | Step | Min % | Guesses | Mixing | Hints |
|------|-----:|-----------------------|-----:|------:|--------:|--------|-------|
| easy | 10 | 2–4 | 10% | ≥10% | 8 | linear | signature sketches + reveal mix count |
| hard | 10 | 2–4 | 10% | ≥10% | 10 | saturated | none |

Players **select a subset** of the pool. Unselected odors are **0%** and still count in A/B.

## Mixture representation

- Components are `{ odorId, percent }` with **integer** percentages > 0.
- **Canonical form:** sort by `odorId` ascending. Order of entry does not matter.
- **No duplicate** odor ids; unused pool odors are omitted (= 0%).
- Exact equality uses integers only (`sum === 100`); never float epsilons.
- There is always an exact truth mixture; a perfect guess yields **NA0B** where N = pool size (e.g. **10A0B**).

## Signal model (`ruleVersion`)

All knobs live in `SPECTRUM_RULES` / `SPECTRUM_RULE_VERSION` (currently `2.0.0`). UI must not redefine them.

Let \(w_i = p_i / 100\) (`weightNormalization: percentOver100`).

1. **Linear:** \(x_j = \sum_i w_i\, r_{ij}\)
2. **Saturation:** \(y_j = 1 - \exp(-k\, x_j)\) with fixed \(k =\) `saturationK`
3. **Noise (optional noisy models):** per channel \(U(-\mathrm{amplitude}, +\mathrm{amplitude})\), seeded by  
   `spectrum-noise:{ruleVersion}:{seed}`, then **clamp** to `[0,1]`
4. Round each channel to `signalRoundingDecimals`

Same `(seed, ruleVersion, contentVersion, difficulty)` ⇒ identical truth, noise draws, and observed signal.

## A / B feedback (pool-wide)

For **each odor in the fixed pool**:

| Code | Meaning |
|------|---------|
| **A** | Guess percent equals truth percent (includes correctly absent at 0%, or present with exact concentration) |
| **B** | Odor is present on both sides (>0) but concentrations differ |
| (none) | False positive or false negative |

Examples with a 10-odor pool and truth `banana 60 / lemon 40`:

- Exact guess → **10A0B**
- `banana 40 / lemon 60` → **8A2B** (eight correctly absent + two wrong concentrations)
- Completely different pair → **6A0B** (six correctly absent; four presence errors)

UI must not reveal *which* odor earned A or B.

## 訊號吻合度 (signal fit)

Metric: **normalized RMSE** (`fitMetric.kind = normalizedRmse`):

\[
\mathrm{rmse} = \sqrt{\mathrm{mean}_j (a_j - b_j)^2},\quad
\mathrm{score} = \mathrm{clamp}\big(\mathrm{round}(100\cdot(1 - \mathrm{rmse}/\mathrm{rmseScale})),\,0,\,100\big)
\]

With channels in `[0,1]` and `rmseScale = 1`, identical vectors score **100**.

UI copy must say **「訊號吻合度」** / “signal fit”. Do **not** call it probability or chemical identification confidence.

## Generator & candidate filter

1. **Enumerate** every legal mixture for the preset (step, min %, component count, no dupes).
2. **Pick truth** with seeded RNG: `spectrum-truth:{ruleVersion}:{seed}`.
3. **Filter** candidates so each historical guess would yield the same integer A/B against the candidate.
4. Optional **fitTolerance**: also require  
   `signalFit(observed, candidateModelSignal) >= 100 - fitTolerance`  
   using the same seeded pipeline. Recomputing the true mixture with the same seed scores **100**, so float drift must not eject truth when A/B history is honest.

## Out of scope (this phase)

- Full player shell / guess UX polish beyond the dev visualizer
- Online / multiplayer
- FFT component labeling
- Claiming experimental receptor provenance
