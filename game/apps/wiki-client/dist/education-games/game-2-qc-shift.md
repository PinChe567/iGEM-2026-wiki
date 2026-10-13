# Game 2 — AeroSense QC Shift

**Route:** `games/labyrinth/index.html` (URL kept for the Wiki; the maze is not the public activity)  
**Hub purpose:** Read an early-warning signal, manage uncertainty, and decide when a food batch needs retesting or confirmation.  
**Approximate duration (planned, not measured):** 8–12 minutes.  
**Target levels in software:** Junior, Standard, Challenge.

## Learning concept

**Screening is not confirmatory diagnosis.** Invalid or uncertain measurements need appropriate follow-up (retest / hold-and-confirm), not blind trust and not an automatic “destroy everything” rule.

## What players do

1. Choose a shift length / difficulty.
2. Short tutorial (first visit).
3. For each simulated batch: **monitor**, **retest**, or **hold & confirm**, with limited time and tokens.
4. Keyboard: `1` monitor, `2` retest, `3` hold & confirm, Enter to continue.

Risk and signal quality are shown as **numbers plus glyphs**, not color alone.

## Science note (illustrative)

This is a **role-play screening shift**. Alerts are simulated. Outcomes are not warehouse SOPs, toxin limits, or AeroSense hardware performance.

In-game: **Science**, or open `games/labyrinth/index.html#science`.

## Study items

| ID | Measures |
|----|----------|
| `G2-SCREEN-01` | Screening is an early warning, not a confirmed diagnosis |
| `G2-QC-01` | Invalid / uncertain readings need follow-up |
| `G2-TRANSFER-01` | Apply screening-vs-diagnosis when a follow-up reading is invalid |
| `G2-FEED-01` | Optional feedback (unscored) |
| `G2-ALERT-01` | Optional alert-information preference (unscored) |

Enable with `?study=1`. See [question-bank.md](./question-bank.md).

## Game-specific evidence fields (when exported)

Monitor / retest / hold-confirm counts, missed simulated high-risk lots, unnecessary holds, invalid-reading follow-up, optional alert preference.

These fields describe **this simulation**. Do not treat them as professional QC metrics.

## Accessibility (implemented)

- Keyboard shortcuts for the three actions
- Visible focus
- High contrast and reduced motion
- Meters include numeric values; risk/quality use glyphs as well as styling
- zh-Hant and English

## Materials

Browser only. No food, sensors, or chemicals.

## Evaluation

Planned method: paired pre/post (`pre-post`). No results in this file.

**Reminder:** Child and general-public play must not be used to infer professional operational thresholds.
