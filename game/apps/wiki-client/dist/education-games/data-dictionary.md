# Anonymous study data dictionary

Storage key (browser): `suite.education.v1`  
Schema version: `1`  
Privacy flag on export: `anonymous-local-only`

Nothing is sent to a server automatically. There is no name, email, exact age, IP, or school ID field. Older stored objects that contain those keys are dropped on migrate.

Export: **JSON** (source of truth) and optional **CSV** (one row per answer; session fields repeated).

Parser: `parseEducationExportJson` accepts `{ sessions: [...] }`, a raw array, or a single session object.

## Session fields

| Field | Type | Notes |
|-------|------|--------|
| `schemaVersion` | number | Currently `1` |
| `anonymousSessionId` | string | Random local ID, not a person |
| `gameId` | `'pixel' \| 'qc-shift' \| 'spectrum'` | |
| `gameVersion` | string | Software version of that game |
| `contentVersion` | string | Content catalog version |
| `locale` | `'zh-Hant' \| 'en'` | UI language for that session |
| `selectedDifficulty` | string \| null | e.g. junior / practice / easy / hard |
| `startedAt` | string | ISO timestamp |
| `completedPlay` | boolean | Play finished |
| `durationMs` | number \| null | Omit from medians if null; do not invent |
| `numberOfAttempts` | number \| null | |
| `hintsUsed` | number \| null | |
| `answers` | array | See below |
| `outcome` | object \| null | Game-specific |

## Answer fields

| Field | Type | Notes |
|-------|------|--------|
| `studyItemId` | string | e.g. `G1-COMB-01` |
| `phase` | `'pre' \| 'post' \| 'transfer' \| 'feedback'` | |
| `answer` | string | Option id |
| `correct` | boolean \| null | `null` if unscored |
| `recordedAt` | string | ISO timestamp |

## Pixel `outcome.pixel`

`correctCount`, `questionCount`, `score`, `presetId`, `studyReviewUsed`

## QC Shift `outcome.qcShift`

`monitorCount`, `retestCount`, `holdConfirmCount`, `missedSimulatedRisks`, `unnecessaryHolds`, `invalidReadingBatches`, `invalidReadingsFollowedUp`, `qcInvalidComprehension` (boolean or null), `alertInformationPreference` (string or null)

## Spectrum `outcome.spectrum`

`guesses`, `hintLevel`, `solved`, `difficulty`

## CSV columns (export)

`anonymousSessionId`, `gameId`, `gameVersion`, `contentVersion`, `locale`, `selectedDifficulty`, `completedPlay`, `durationMs`, `numberOfAttempts`, `hintsUsed`, `studyItemId`, `phase`, `answer`, `correct`, pixel counts, QC decision fields, spectrum fields.

Empty cells mean **missing**, not zero, unless the JSON actually stored `0`.

## Summarizer outputs

Descriptive only: paired n, pre/post correct counts, improved / no-change / declined, completion, median duration/hints **if present**, QC mean decisions **if present**, spectrum solved/attempted **if present**.

No p-values, t-tests, or imputed rows.
