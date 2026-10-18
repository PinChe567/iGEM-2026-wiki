# Education games — reusable package

This folder is the facilitator-facing documentation for the three Wiki games. It is designed for iGEM Education / Human Practices records and for reuse in workshops.

**Do not invent player counts, quotes, percentages, or learning gains.** Until a real playtest export exists, treat evaluation results as empty.

## Games

| Game | Wiki route | Doc |
|------|------------|-----|
| 1 · Odor Pixel Lab | `games/pixel/index.html` | [game-1-pixel.md](./game-1-pixel.md) |
| 2 · AeroSense: Scentbound Labyrinth (Odor Maze) | `games/labyrinth/index.html` | [Archived QC Shift plan](./game-2-qc-shift.md); not a matched Maze guide |
| 3 · Scent Mixer | `games/spectrum/index.html` | [game-3-scent-mixer.md](./game-3-scent-mixer.md) |

All three are **playable**. Game 2 uses `/games/labyrinth/` for the current Maze. QC Shift documents and G2 items are archived; the Maze does not mount their study mode or export their outcomes.

## What this suite is (and is not)

The current games are **educational illustrative models** for pattern reading, maze exploration using scent information, and mixture decoding. Screening-vs-confirmation questions belong to the archived QC Shift plan.

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

Workshop evidence: append `?study=1` to **Pixel Lab or Scent Mixer**. See the study protocol. The current Maze has no matched pre/post study flow; do not apply the archived G2 QC Shift items to it.

## Wiki page

The Education page (`education/index.html`) lists structured activity records. Status is **in-progress** and **results are empty** until the team pastes real playtest findings.

## License

The user confirmed on 18 October 2026 that Odor Pixel Suite and its odor atlas were created by the NTHU FLY iGEM 2026 team. Authorship is recorded in `assets-manifest.json`. Reuse and redistribution terms for the game and atlas have not been separately specified; the website's general license link does not establish a separate license for these files.
