# Game 3 — Scent Mixer / Odor Fingerprint Mixer

**Route:** `games/spectrum/index.html`  
**Hub purpose:** Mix scents, read overlapping receptor-response patterns, and decode which odors made the fingerprint.  
**Approximate duration (planned, not measured):** 15–25 minutes.  
**Target levels in software:** Junior, Standard, Challenge.

## Learning concept

Mixtures can create **overlapping** receptor-response patterns. **Computational decoding** (comparing candidates and ratios) is useful; a single peak is not enough.

## What players do

1. Choose a run and difficulty.
2. Read a 12-channel virtual-receptor chart (polyline is a reading aid, not a time wave).
3. Junior: pick two odor cards and a 25/75, 50/50, or 75/25 mix.
4. Standard / Challenge: set integer percents that sum to 100.
5. Optional staged hints.

## Science note (illustrative)

The mixer uses a **simplified linear / saturation illustration**. Real mixtures may show antagonism or enhancement. Solving a puzzle is **not** measuring real gas concentrations, and signal fit is **not** chemical identification confidence. The game does not validate AeroSense sensors.

In-game: **Science**, or open `games/spectrum/index.html#science`.

## Study items

| ID | Measures |
|----|----------|
| `G3-MIX-01` | Mixtures can overlap; the mix is not a single-odor fingerprint |
| `G3-DECODE-01` | Computational decoding helps separate similar overlapping patterns |
| `G3-TRANSFER-01` | Compare mixture candidates and ratios, not one peak |
| `G3-FEED-01` | Optional feedback (unscored) |

Enable with `?study=1`. See [question-bank.md](./question-bank.md).

## Game-specific evidence fields (when exported)

Guesses, hint level reached, solved, difficulty.

## Accessibility (implemented)

- Keyboard-focusable controls (cards, ratios, steppers, submit)
- Visible focus
- High contrast and reduced motion
- Chart **text summaries** (`.sr-only` / `channelSummaryText`) in addition to the canvas
- Axis note in copy: X = virtual receptor/channel, Y = relative response
- zh-Hant and English

## Materials

Browser only.

## Evaluation

Planned method: paired pre/post (`pre-post`). No results in this file.
