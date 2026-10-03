# Playtest protocol

Use this when a facilitator runs a real session. Fill the Education page **results** fields only after the session, using exported files — never from memory of “it went well.”

## Audience (planned)

- iGEM education / Human Practices workshops
- Classroom or museum events
- General Wiki visitors (normal play, no study questions)

Not: professional QC operator training, diagnostic studies, or sensor-validation trials.

## Public play (default)

1. Open the hub.
2. Choose Play. No pre-test, no survey.
3. Optional Science on the card opens the in-game illustrative-model note.

Do **not** add `?study=1` to hub Play links.

## Workshop / evidence mode

On each participant device (or shared station):

1. Set language (zh-Hant or English) in the suite switcher.
2. Optionally turn on **Accessibility**: high contrast, reduced motion.
3. Open one game with `?study=1`:
   - Game 1: `games/pixel/index.html?study=1`
   - Game 2: `games/labyrinth/index.html?study=1`
   - Game 3: `games/spectrum/index.html?study=1`
4. Two short pre questions → play the game as usual → post + transfer + optional feedback.
5. Before wiping the browser, click **Export anonymous study data (JSON)**. CSV is optional.

If several laptops were used, export from **each** device.

## What not to collect

Do not ask for or type name, email, exact age, IP, school ID, class list, or other personal identifiers. Session IDs are random local IDs.

Do not upload exports to a random cloud form unless the team has a separate, consented pipeline. The games themselves **do not** transmit study data automatically.

## After the session

1. Keep JSON as the archive.
2. Summarize descriptively:

```bash
node scripts/summarize-education.mjs path/to/export.json [--out out-dir]
```

3. Report **paired n** only for item IDs that have both a scored pre and post answer.
4. Do not run significance tests in the official summarizer. Do not impute missing posts.
5. Paste **only real counts** into Education `results`. If you have no file, leave results empty.

## How to report paired n

Paired *n* = sessions with both pre and post `correct` booleans for the **same** item ID.

Also report, when present in the export: completion, median `durationMs`, median `hintsUsed`, Game 2 decision counts, Game 3 solved/attempted.

## Limitations (always state)

- Workshop samples are not a randomized trial.
- Short in-game items do not measure long-term retention.
- Junior / child play is evidence for **that audience only**.
- Do not infer warehouse cut-offs, toxin limits, or sensor calibration from these sessions.

## Observation notes (optional, human)

If you write qualitative notes, store them **separately** from the anonymous JSON. Do not put names in the JSON. When you later fill [redesign-log.md](./redesign-log.md) **Evidence**, quote the note or the export filename — never invent a percentage.
