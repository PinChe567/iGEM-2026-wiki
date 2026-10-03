# Game 1 — Odor Pixel Lab

**Route:** `games/pixel/index.html`  
**Hub purpose:** Read LED scent codes and identify the matching odor.  
**Approximate duration (planned, not measured):** 10–15 minutes.  
**Target levels in software:** Junior, Standard (practice), Challenge.

## Learning concept

Odor identity is represented by a **multi-receptor pattern**, not a single receptor (or a single bright cell). Extra lights can appear as noise; the identity is still the overall pattern.

## What players do

1. Choose a level.
2. Optionally review odor images next to their LED patterns.
3. See a (possibly noisy) pattern and pick the matching odor.
4. Keyboard: option keys `1`–`4`, Enter to continue.

## Science note (illustrative)

The grid is a **virtual-receptor illustration**. It is not a biological olfactory model and not an experimental measurement. Solving a round does not validate AeroSense sensors.

In-game: **Science** on the lab header, or open `games/pixel/index.html#science`.

## Study items

| ID | Measures |
|----|----------|
| `G1-COMB-01` | Multi-receptor pattern vs one receptor per odor |
| `G1-NOISE-01` | Noise can distract; identity remains the overall pattern |
| `G1-TRANSFER-01` | Apply pattern comparison when two odors look similar |
| `G1-FEED-01` | Optional: what was confusing or useful (unscored) |

Enable with `?study=1`. See [question-bank.md](./question-bank.md).

## Accessibility (implemented)

- Keyboard operation for quiz options
- Visible focus via suite focus ring
- High contrast and reduced-motion / reduced-effects settings
- LED **on** vs **off** uses brightness plus a center mark; noise uses stripes, not hue alone
- Pattern grids expose `aria-label` / `role="img"`
- zh-Hant and English

## Materials

Browser; optional workshop laptops with study mode. No wet-lab materials.

## Evaluation

Planned method: paired pre/post (`pre-post`). No results in this file.
