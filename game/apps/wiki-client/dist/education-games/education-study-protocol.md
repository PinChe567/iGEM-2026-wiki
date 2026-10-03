# Education study protocol (optional workshop mode)

This protocol is for **workshop / education events**. It does not change everyday Wiki play.

Public visitors should open a game from the hub and play immediately. Study questions appear **only** when a facilitator adds a query parameter.

## Intended audience

- iGEM education / Human Practices workshops
- Classroom or museum events using the three Wiki games
- Facilitators who need **anonymous, paired pre/post evidence** without collecting personal data

Not intended as:

- professional QC operator training
- a diagnostic or concentration-measurement study
- a source of operational thresholds for warehouses or sensors

Child and general-public answers must **not** be used to infer professional screening cut-offs, sensor performance, or AeroSense experimental results.

## How to enable study mode

Append `?study=1` to a game URL (same device / browser as the workshop laptops):

- Game 1: `games/pixel/index.html?study=1`
- Game 2: `games/labyrinth/index.html?study=1` (AeroSense QC Shift)
- Game 3: `games/spectrum/index.html?study=1`

Without the parameter, there is **no** mandatory pre-test and **no** mandatory survey.

Hub “Play” cards do **not** add this flag.

## What participants see in study mode

1. A short banner that this is workshop study mode and that answers stay on the device.
2. **Two** short pre questions (required to start).
3. The normal game (tutorial / play / results unchanged in mechanics).
4. After play: the **same two concepts** again, plus **one transfer/application** question, plus **optional** feedback. Game 2 also offers an optional alert-information preference item.
5. Facilitator controls: **Export anonymous study data** (JSON and CSV).

## Item IDs and what they measure

Paired pre/post items reuse the same ID. Transfer and feedback have their own IDs.

| ID | Game | Phase | Measures |
|---|---|---|---|
| `G1-COMB-01` | Pixel | pre / post | Odor identity is a **multi-receptor pattern**, not a single receptor. |
| `G1-NOISE-01` | Pixel | pre / post | Extra lights (noise) can distract; identity is still the **overall pattern**. |
| `G1-TRANSFER-01` | Pixel | transfer | Apply pattern comparison when two odors look similar. |
| `G1-FEED-01` | Pixel | feedback (optional) | What was confusing or useful. Unscored. |
| `G2-SCREEN-01` | QC Shift | pre / post | Screening is an **early warning**, not confirmatory diagnosis. |
| `G2-QC-01` | QC Shift | pre / post | Invalid / uncertain readings need **follow-up**, not blind trust. |
| `G2-TRANSFER-01` | QC Shift | transfer | Apply screening-vs-diagnosis when a second reading is invalid. |
| `G2-FEED-01` | QC Shift | feedback (optional) | What was confusing or useful. Unscored. |
| `G2-ALERT-01` | QC Shift | feedback (optional) | Preferred alert information (risk / confidence / quality / next step). Unscored. |
| `G3-MIX-01` | Spectrum | pre / post | Mixtures can create **overlapping** receptor-response patterns. |
| `G3-DECODE-01` | Spectrum | pre / post | **Computational decoding** helps separate similar overlapping patterns. |
| `G3-TRANSFER-01` | Spectrum | transfer | Compare mixture candidates and ratios, not a single peak. |
| `G3-FEED-01` | Spectrum | feedback (optional) | What was confusing or useful. Unscored. |

Questions are conceptual. They are **not** AeroSense brand trivia.

## Evidence stored (local only)

Storage key: `suite.education.v1` (browser `localStorage`).

Each anonymous session includes:

- `schemaVersion`
- `anonymousSessionId` (random local ID — not a person)
- `gameId`, `gameVersion`, `contentVersion`, `locale`
- `selectedDifficulty`
- pre / post / transfer / feedback answers, with `correct` where the item is scored
- `completedPlay`, `durationMs`, `numberOfAttempts`, `hintsUsed` when known

Game-specific outcome fields (when the run finished):

- Pixel: correct count, question count, score, preset, whether study-review was used
- QC Shift: monitor / retest / hold-confirm counts, missed simulated high-risk lots, unnecessary holds, invalid-reading follow-up, optional alert preference
- Spectrum: guesses, hint level, solved, difficulty

**Never collected:** name, email, exact age, IP, school ID, or other PII.  
**Never transmitted automatically** to any external server.

## How to export

On a study-mode game page:

1. Click **Export anonymous study data (JSON)** (primary archive).
2. Optionally export **CSV** (one row per answer, session fields repeated).

Keep JSON as the source of truth. CSV is a convenience for spreadsheets.

If several workshop laptops were used, export from each and pass all JSON files to the summarizer.

## How to report paired n

Paired *n* for an item is the number of sessions that have **both** a pre answer and a post answer for that **same item ID**, with scored `correct` booleans.

Sessions with only pre (abandoned play) are **not** counted as paired.

Do **not** impute missing post answers.

Descriptive report (no significance tests):

- paired n
- pre correct count
- post correct count
- improved / no-change / declined (individual, among paired sessions)
- play completion count
- median duration when `durationMs` exists
- median hint usage when `hintsUsed` exists
- Game 2 mean decision counts when outcomes exist

## Summarizer

From the repo root:

```bash
node scripts/summarize-education.mjs path/to/export.json [more.json ...] [--out out-dir]
```

The script:

- reads exported JSON (wrapper `{ sessions: [...] }` or a raw array)
- skips unreadable files instead of inventing rows
- prints a markdown summary
- writes `paired-summary.csv` (and the markdown) if `--out` is set
- does **not** run t-tests, p-values, or other inferential statistics

## Limitations

- Self-selected workshop participants; not a randomized trial.
- Items are short and in-game; they do not measure long-term retention.
- Games are **educational simulations** (illustrative receptor patterns / screening role-play / mixture decoding), not experimental AeroSense measurements.
- Junior / child play is valid educational evidence for *this* audience only.
- Do not generalize scores into warehouse SOP, toxin limits, or sensor calibration.
- Local storage can be cleared by the browser; export before wiping workshop devices.

## Privacy reminder for facilitators

Export files still contain only anonymous session IDs. Do not rename files with class lists or merge them with attendance sheets that include names.
