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

Archived Game 2 plan: AeroSense QC Shift (screening shift). The current `games/labyrinth/index.html` serves AeroSense: Scentbound Labyrinth (Odor Maze).

### Observation / player feedback

The archived QC Shift brief teaches screening as an early warning and follow-up for invalid readings. The current Maze instead uses exploration and illustrative scent-vision scanning. These activities have different learning objectives.

### Evidence

Current code mount: `apps/wiki-client/games/labyrinth/src/main.ts` imports and starts `startScentbound`. The distributed page describes maze exploration. The current Maze does not mount the education study flow. No player-count dataset or matched Maze learning result is supplied here.

### Design decision

Preserve the QC Shift plan and G2 item IDs as archived records. Do not interpret them as Maze instruction or outcome measures.

### Change made

The live route opens Scentbound Labyrinth. QC Shift's proposed monitor / retest / hold-and-confirm flow is not the activity at that route. This documentation correction aligns the record with the current implementation; it is not evidence of a participant-driven redesign.

### Re-test result

Not yet. Awaiting human playtest data.

### Remaining limitation

No matched Maze pre/post instrument or education export is implemented. Archived QC Shift decision fields describe a **simulation** and cannot establish Maze learning or professional operational thresholds.

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

Optional education study mode (`?study=1`) in Pixel Lab and Scent Mixer.

### Observation / player feedback

Workshops need paired pre/post evidence without turning everyday Wiki play into a quiz.

### Evidence

Pixel and Spectrum `src/game.ts` use `isStudyMode`, pre/post questions and local export from `@suite/core/education`. The current Maze does not mount that flow. Protocol: `docs/education-study-protocol.md`. No workshop export is stored in this repo.

### Design decision

Activate only with `?study=1` in Pixel Lab and Scent Mixer. Local storage only. Anonymous session IDs. Facilitator JSON/CSV export. Two short pre items, same concepts post, one transfer, optional feedback. Retain archived G2 definitions without presenting them as Maze evaluation.

### Change made

Study banner, question forms, export bar; summarizer script without significance tests.

### Re-test result

Not yet. Awaiting real exported JSON from a human session.

### Remaining limitation

Items are short and in-game. Unpaired (pre-only) sessions must be excluded from paired n. Missing duration/hints must not be invented.
