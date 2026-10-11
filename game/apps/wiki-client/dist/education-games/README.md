# Education games — reusable package

This folder is the facilitator-facing documentation for the three Wiki games. It is designed for iGEM Education / Human Practices records and for reuse in workshops.

**Do not invent player counts, quotes, percentages, or learning gains.** Until a real playtest export exists, treat evaluation results as empty.

## Games

| Game | Wiki route | Doc |
|------|------------|-----|
| 1 · Odor Pixel Lab | `games/pixel/index.html` | [game-1-pixel.md](./game-1-pixel.md) |
| 2 · Odor Maze (Scentbound Labyrinth) | [Current maze](../games/labyrinth/index.html) | See current-activity note below; no matched facilitator assessment is published |
| 3 · Scent Mixer | `games/spectrum/index.html` | [game-3-scent-mixer.md](./game-3-scent-mixer.md) |

All three are **playable**. Game 2 at the existing `/games/labyrinth/` route is the current **Odor Maze / Scentbound Labyrinth**: the player finds an exit while dead-end chests unlock scans, scent guidance and secret passages. The current build exposes Junior, Standard and Challenge difficulty choices. Its teaching opportunity is using limited signal information to navigate; no learning improvement or real sensor performance is established.

## Archived Game 2 materials

[QC Shift facilitator notes](./game-2-qc-shift.md) and the `G2-SCREEN-01`, `G2-QC-01`, and `G2-TRANSFER-01` items in the [question bank](./question-bank.md) describe an earlier screening-decision activity. They are retained as an archive, **not a facilitator guide or matched assessment for the current maze**. Do not use those items to report a Maze learning gain. The current Maze needs a version-matched protocol and assessment before an education study is reported.

## What this suite is (and is not)

The games are **educational illustrative models**. They help people practice pattern reading, screening-vs-confirmation decisions, and mixture decoding.

They do **not** validate AeroSense sensor hardware, measure real gas concentrations, or set professional operational thresholds.

## For educators

| Resource | File |
|----------|------|
| Study-mode instructions | [education-study-protocol.md](./education-study-protocol.md) (included next to this pack in the Wiki build) |
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
