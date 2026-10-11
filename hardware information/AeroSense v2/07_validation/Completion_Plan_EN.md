# Completion plan for less than two weeks

2026-10-06. [繁體中文](Completion_Plan_ZH.md). Use this checklist to assign work and preserve evidence. The exact deadline is not supplied: Day 1 begins when assembly can start; reserve the final two days for checking and publication. If the PCB is delayed, prepare the manual, parts and simulation pages in parallel. Waiting for a board is not a passed test.

## Seven tasks and their evidence

| Task | Available now | Next action and completion condition | Preserve |
|---|---|---|---|
| 1 Assemble | Eight STLs, exploded view and gasket template; wells printing | Keep wells/interfaces unchanged; check antenna insertion, board height and battery clearance unpowered; test water off-board | Overall/antenna/port/well photos, dimensions and problems |
| 2 Flash and operate | Buildable firmware, LittleFS and instructions; no real-board success record | Use 3.3-V UART; verify power, unclipped ADC, start/stop/export and real D1–D4 orientation | Build identity, settings, real JSON and phone video; DEMO is excluded |
| 3 Finalize manual | Editable bilingual Word and PDFs | Add actual assembly photos and observed difficult steps; reconcile accepted Word edits into Markdown | One current manual and reasons for changes |
| 4 Independent assembly | Blank bilingual feedback forms | 2–3 non-designers attempt specified tasks; log time/help/errors; revise 1–2 priorities and retest | Anonymous records, observations and problem→change→retest comparison |
| 5 Fluorescence standard | Experiment sequence and analysis | Borrow sodium fluorescein; run illuminated blank, single-well and concentration conditions | Raw JSON, reagent details and three analysis figures |
| 6 Cell comparison | Strategy; no biological results | Only after cell-free readout works, material suitability and wet-lab controls are established; compare the same cell batch/window | Device/reference traces, batch, stimulus timing and negative/positive controls |
| 7 Wiki | Local drafts, model figures, package and appendix | Show core methods/evidence/limits on pages; use appendix for reproduction | Figures, captions, actual n, original data and working downloads |

## Schedule

| Window | Priority | Parallel work |
|---|---|---|
| Days 1–2 | Confirm three antenna dimensions, fit and off-board leak check; verify optical filter and power parts | Borrow standard and flow equipment; schedule participants; draft model methods |
| Days 2–4 | Flash and perform UI/ADC/LED checks; resolve failures that prevent measurement | Photograph assembly and record unclear steps |
| Days 4–6 | One standard-liquid experiment, about 60–120 min excluding troubleshooting | 2–3 manual trials and choose 1–2 revisions |
| Days 6–8 | Retest changes; perform matched cell comparison only if ready | Hardware/Engineering figures and feedback summary |
| Days 9–10 | Record pass/fail/not-done honestly; organize data and reproducible analysis | English review, citations, costs, downloads and anonymization |
| Final two days | Freeze artifacts and check the official site, media, links and backup | No new untested geometry, classifier or docking claims |

With fewer than ten days, protect the chain “assembly → real-board readout → standard result → independent use and revision → wiki.” Leave immature cell results pending instead of omitting controls to complete a story.

## Essential short checks

Unpowered, check antenna/battery/underside clearance and keep liquid off the PCB. Powered, check the correct supply, abnormal heating, ADC rails and the stop command. Obvious faults can often be detected quickly, but first bring-up cannot be promised in five minutes. Stop for leakage, interference, heating, clipping or failed stopping. More LED power, background subtraction and a neural network are not repairs for these faults.

With the same phone, distance and orientation, operate for about two minutes each with the housing open and closed. Log command success, missing records and timestamps. This checks communication at the intended working distance; it is not an antenna measurement or RF certification. Investigate the nearby battery, metal, wiring and housing if it fails.

## What the standard establishes

Use sodium fluorescein, preferably a traceable reagent/stock borrowed from a laboratory familiar with fluorescence. It checks green readout, channel mixing and concentration response, not gas t90, GCaMP sensitivity or odor recognition. Follow [Fluorescence_and_Cell_Test_EN.md](Fluorescence_and_Cell_Test_EN.md) with the existing [Validation_Plan_EN.md](Validation_Plan_EN.md). Highlighter ink is not a quantitative standard.

Current records average a 2-s demodulation block followed by at least a 3-s idle interval, approximately one point every 5 s. They cannot resolve all fast GCaMP6f peaks. Use an already established sustained/repeatable laboratory response, preserve the faster wet-lab reference and compare the same time window. Missing a short peak does not establish absent cellular response.

## Where the questionnaire belongs

Keep assembly usability evidence in Hardware and observation→revision→retest in Engineering Cycle 5. Entrepreneurship and Education can link to the same activity where appropriate: actual target-user needs/adoption barriers support Entrepreneurship; learning objectives, dialogue and learning evidence support Education. A peer assembly score alone is neither customer validation nor educational impact. The [2026 iGEM judging questions](https://competition.igem.org/judging/special-prizes) do not justify adding another purposeless survey under deadline pressure.

Use the current free-response space for “Which task was unclear; identify the step?” and “Where would you use this, and what is the largest barrier?” For a real teaching activity, separately record prior understanding and whether participants can explain LED/PD function or experimental controls afterward. Do not report outcomes that were not collected.

## Today

- [ ] Obtain ESP32 overhang, module width and maximum projection below the board; confirm whether the photos show this exact revision.
- [ ] Assign assembly/firmware, wet-lab/standard and documentation/wiki owners; people may share roles.
- [ ] Check filter, screws, fan, gasket and borrowed equipment against the updated BOM before buying.
- [ ] Book 2–3 independent assemblers; finish the manual using the first actual assembly.
- [ ] Set the freeze point two days before submission; retain raw data, not screenshots alone.
