# Education games — reusable package

This folder is the facilitator-facing documentation for the three Wiki games. It is designed for iGEM Education / Human Practices records and for reuse in workshops.

**Do not invent player counts, quotes, percentages, or learning gains.** Until a real playtest export exists, treat evaluation results as empty.

## Games

| Game | Wiki route | Doc |
|------|------------|-----|
| 1 · Odor Pixel Lab | `games/pixel/index.html` | [game-1-pixel.md](./game-1-pixel.md) |
| 2 · AeroSense QC Shift | `games/labyrinth/index.html` | [game-2-qc-shift.md](./game-2-qc-shift.md) |
| 3 · Scent Mixer | `games/spectrum/index.html` | [game-3-scent-mixer.md](./game-3-scent-mixer.md) |

All three are **playable**. Game 2 keeps the historical `/games/labyrinth/` URL; the live activity is QC Shift, not a maze.

## What this suite is (and is not)

The games are **educational illustrative models**. They help people practice pattern reading, screening-vs-confirmation decisions, and mixture decoding.

They do **not** validate AeroSense sensor hardware, measure real gas concentrations, or set professional operational thresholds.

## For educators

| Resource | File |
|----------|------|
| Study-mode instructions | [../education-study-protocol.md](../education-study-protocol.md) (copied next to this pack on Wiki build as `education-study-protocol.md`) |
| Question bank (stable item IDs) | [question-bank.md](./question-bank.md) |
| Playtest protocol | [playtest-protocol.md](./playtest-protocol.md) |
| Anonymous data schema | [data-dictionary.md](./data-dictionary.md) |
| Redesign log (fill evidence only from real notes) | [redesign-log.md](./redesign-log.md) |
| Summarizer | `node scripts/summarize-education.mjs export.json` |

## How visitors play

Public hub: open a game and play immediately. No pre-test.

Workshop evidence: append `?study=1` to a game URL. See the study protocol.

## Wiki page

The Education page (`education/index.html`) lists structured activity records. Status is **in-progress** and **results are empty** until the team pastes real playtest findings.

## License

This repository does not currently publish a root `LICENSE` file. Do not assume Creative Commons or similar rights until the team adds one. iGEM Wiki hosting remains subject to iGEM rules. Media credits that still say `TODO-VERIFY` are not cleared.
