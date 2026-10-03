# Redesign log

Use one block per version. **Evidence** may only cite real playtest notes, export filenames, or “none yet.” Never put made-up n, quotes, or percentages in Evidence or Re-test result.

Template:

- Version
- Observation / player feedback
- Evidence
- Design decision
- Change made
- Re-test result
- Remaining limitation

---

## Version

Pixel Lab as Game 1 pattern-recognition activity.

### Observation / player feedback

Design intent: visitors should see odor identity as a **pattern across receptors**, not one lamp per smell. No recorded player quotes in this repository yet.

### Evidence

None yet — no playtest export or facilitator note is checked in.

### Design decision

Keep an illustrative LED grid with optional noise; Junior / Standard / Challenge presets; bilingual UI.

### Change made

Shipped in `games/pixel/index.html` with in-game science disclaimer (illustrative model, not measurements).

### Re-test result

Not yet. Awaiting human playtest data.

### Remaining limitation

Does not model a biological nose or validate AeroSense hardware.

---

## Version

Game 2 public Wiki activity is AeroSense QC Shift (screening shift), still served at `games/labyrinth/index.html`.

### Observation / player feedback

Education brief for Game 2: screening is an early warning, not confirmatory diagnosis; invalid readings need follow-up. The maze / identity-deduction prototype is not the public education activity.

### Evidence

Code mount: `apps/wiki-client/games/labyrinth/src/main.ts` starts QC Shift. No player-count dataset in this repository.

### Design decision

Teach monitor / retest / hold-and-confirm with limited tokens; keep the labyrinth URL stable for the Wiki.

### Change made

QC Shift ready → tutorial → play → debrief; science note states the simulation is not an SOP.

### Re-test result

Not yet. Awaiting human playtest data.

### Remaining limitation

Decision counts are from a **simulation**. Do not infer professional operational thresholds from child or general-public participants.

---

## Version

Game 3 Scent Mixer, including a Junior path (two cards + 25/75-style ratios).

### Observation / player feedback

Design intent: mixtures overlap; computational comparison of candidates and ratios is the skill. Younger players need fewer simultaneous controls than a full percent mixer.

### Evidence

Implementation: Junior preset in the Spectrum game. No playtest scores checked in.

### Design decision

Keep the 12-channel chart with a text summary; Junior vs Standard vs Challenge; antagonism/enhancement disclaimer in science copy.

### Change made

Live at `games/spectrum/index.html`. Chart is an illustration, not a spectrometer.

### Re-test result

Not yet. Awaiting human playtest data.

### Remaining limitation

Linear/saturation model ≠ real mixture chemistry; solving a puzzle ≠ concentration measurement.

---

## Version

Optional education study mode (`?study=1`) shared across the three games.

### Observation / player feedback

Workshops need paired pre/post evidence without turning everyday Wiki play into a quiz.

### Evidence

Module `@suite/core/education`; protocol `docs/education-study-protocol.md`. No workshop export is stored in this repo.

### Design decision

Activate only with `?study=1`. Local storage only. Anonymous session IDs. Facilitator JSON/CSV export. Two short pre items, same concepts post, one transfer, optional feedback.

### Change made

Study banner, question forms, export bar; summarizer script without significance tests.

### Re-test result

Not yet. Awaiting real exported JSON from a human session.

### Remaining limitation

Items are short and in-game. Unpaired (pre-only) sessions must be excluded from paired n. Missing duration/hints must not be invented.
