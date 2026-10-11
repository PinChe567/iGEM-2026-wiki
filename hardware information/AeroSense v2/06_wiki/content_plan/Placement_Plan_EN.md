# Placement and action plan

## Editorial decision

Keep **Hardware as the engineering decision and reproduction page**, **Model as the methods, validation and interpretation page**, and **Description as the short system story**. Publish the main methods and decisive results directly on those pages. The appendix holds complete runnable records and extended tables; it must not be the only place a judge can understand the evidence.

The current package supports a reproducible computational design and a prepared hardware test campaign. It does not establish a functioning manufactured reader, rapid delivery to the cells, a validated odor classifier, or a sterile cell-compatible cartridge. Attractive graphics should make those distinctions easier to inspect.

## What is currently on the public pages

The following refers to the successful 2026-10-05 HTTP snapshots, not an assumed future website state.

| Page / existing anchor | Current content | Integration action |
|---|---|---|
| Hardware opening and `hardware-architecture` | Older eight-mesh design and 27-case perforated sweep | Replace overview numbers and viewer meshes together. State 108 × 108 × 66 mm candidate, eight selected operating STLs, PCB not yet physically fitted. |
| Hardware `optical-question` | 247 positions, 32,768 packets/position, 0.657 ± 0.058 nW | Replace the entire figure/caption/method block with current maps: 224 positions × 65,536, current NE 0.593 ± 0.035 nW reference. Do not update only the number while retaining the old image. |
| Hardware `well-floor-results` | Older optical sensitivity interpretation | Retain the question, replace evidence; include nonuniform floor illumination and optical well mixing. |
| Hardware `gas-path-results` | Old 27-case geometry: all plates worse under an old mean-speed metric | Keep as a dated historical observation in Engineering if needed. Replace current-design claims with the selected shelf comparison and the new 18-case hole sweep. Different geometry/metrics prevent a direct contradictory “before/after efficiency” claim. |
| Hardware `mechanical-package` | Optional split-cap download links | Remove optional operating choices from the recommended build; point to the eight selected STL files. CAD alternatives must not look like current print instructions. |
| Hardware `electronics-bridge` | Synthetic timing results beside PCB design | Separate firmware build/tests, synthetic signal tests and future physical ADC timing. Retain the unresolved low-rail/TIA issue. |
| Hardware `cost-and-reproduction` | Old priced subset and manuals | Replace with current bilingual BOM/manual/UI guide links. Keep unquoted items beside the subtotal. |
| Hardware `validation-boundary` | Three broad evidence gates | Link to the short two-week test plan; add a dedicated usability feedback record only after sessions occur. |
| Model `evidence-snapshot` / `performance` | Reported pooled KT macro-F1 0.868, seed 100 | Preserve its source and scope. Do not relabel it as an AeroSense fluorescence result or drift test. |
| Model `aerosense-bridge` | No closed fluorescence-to-model validation loop | Add the physical-model chain and measurement-quality interface below. This is computational co-design, not experimental validation of the decoder. |
| Model `reproduce` | SNN code/config/report release missing | Keep that gap visible. The new optical/flow code does not fill the missing SNN training artifacts. |
| Description `read`, `decode`, `evidence-ladder` | Sense–Read–Decode–Act architecture | Add a concise evidence-state paragraph and link to the detailed pages. Do not crowd Description with sweep heatmaps. |

## Main-page architecture and figure placement

### Hardware: about six evidence blocks

1. **Need and design constraints:** modular measurement of four living-cell response wells, one shared PD, rapid replacement, limited purchased parts. Distinguish compactness from proven portability or autonomy.
2. **Build:** current assembled/exploded CAD, connector access and integrated fan seat. Caption as CAD, not a prototype photograph. Show a simple parts/resin table and link the full BOM/manual.
3. **Optical decision:** put the current floor map and LED-by-well matrix side by side with short conclusions: nonzero conditional collection, nonuniform illumination, residual mixing. Link Model `optical-transport` and `detector-interference`.
4. **Gas decision:** show shelf/open comparison plus the 18-point plate sweep or its interactive view. Explain the cost/cleanability tradeoff and worsen­ing circulation symmetry. Link Model `gas-and-liquid-transport`.
5. **Use and reproduce:** genuine UI screenshots or a clearly marked demo; setup/calibration sequence; exact print/BOM/firmware/download paths. Distinguish software test success from board operation.
6. **Evidence still needed:** blank/fluorescent standard, measured mixing, delivery to the cell plane, and manual assembly trial. Display measured results here only after raw records exist.

### Model: organize by question, not software name

Add a physical-model section before `aerosense-bridge`, with a navigation choice between **Read: physical measurement models** and **Decode: the existing SNN benchmark**.

- `optical-transport`: geometry/orientation, finite PD/filter model, photon bookkeeping, cell-layer assumption, seeds, maps and uncertainty; show the current sweep and spatial maps.
- `detector-interference`: show clean/received/overlay/residual, four-channel bias and rejection/ambient sensitivity. Cite the measured-vs-assumed parameter table. Add the synchronized video as an illustration, not the main evidence.
- `gas-and-liquid-transport`: distinguish velocity, molecular diffusion, gas concentration near liquid and bottom-cell exposure. Show gas wash-in and the fixed-CAD flow-rate/diffusivity sweep. Keep the main engineering target at the gas–liquid interface; link the detailed no-protein/no-mixing liquid and membrane boundary cases in the appendix. Protein-assisted uptake is an untested hypothesis.
- `model-to-build`: a compact question → computation → design choice → remaining test table. Each row links to a concrete Hardware feature.
- `molecular-hypotheses`: optional docking/OBP hypothesis section. Until inputs and logs are supplied, publish only its status and evidence requirements, not poses or rankings presented as team results.
- Keep `network`, `training-evaluation`, `performance`, `limitations` as the separately scoped SNN track. Do not use physical-model error bars as uncertainty for its F1.

### Description: one diagram and one evidence paragraph

Use a simple chain: gas sample → shared gas space → liquid/cells → fluorescence → PD/ADC → phone/data analysis. Label transport and biology as unresolved validation interfaces. Put prospective OBP capture in a visually separate future-work branch; it is not an installed component. Link Hardware for the apparatus and Model for assumptions and results.

## Evidence that should remain visible without a download

| Finding | Meaning to show | What it does not establish |
|---|---|---|
| NE conditional green power 0.593 ± 0.035 nW; three-seed SE | A modeled route to the finite detector exists under specified source/material/cell assumptions | Measured power, viable cell signal or detection limit |
| NE floor CV about 46.2%; target-well share about 88.6–90.9% across LED rows | Flat wells still need illumination and mixing calibration | Uniform brightness or four biologically independent channels |
| Default synthetic amplitude bias 2.63–3.52%; AC waveform SINR 23.40 dB | Source-synchronous leakage survives demodulation under the declared scenario | Actual noise floor or board precision |
| Selected shelf finest-grid momentum proxy reduced about 36.1%; P95 speed about 20.1% | A directional gas-flow objective improved in this comparison | Turbulence, cell protection or a global optimum |
| Fine-grid exchange CV worsens about 0.0098 → 0.369 | The directional improvement has a distribution tradeoff | Uniform analyte delivery |
| Gas near liquid t90 around 150 s at the 1 mL/min baseline; conditional 3 mL/min candidate has nominal worst t90 about 50 s | Fixed-CAD Q×D comparison chooses a sampled operating point; 2.5 mL/min at about 60.04 s is numerically borderline | Delivery to HEK293T cells, a cell-injury limit, or protein-assisted uptake |
| SNN macro-F1 0.868 on the current page | A reported single-seed pooled metal-oxide benchmark | AeroSense cell data, drift robustness, or a reproduced result from this package |

## Connection to 2026 judging

The official 2026 [Special Awards page](https://competition.igem.org/judging/special-prizes) emphasizes need, user feedback, functioning hardware and reproduction for Hardware; the Model questions cover computational merit, insight/design impact, relevant data and usefulness as an example. No separate harder numerical “overgraduate threshold” was verified. Apply the same evidence questions seriously; no document or collaboration guarantees an award.

Keep the detailed liquid calculation in the appendix as a boundary case: without protein-assisted transport or mixing, the representative 100 µL, D_liquid=10⁻⁹ m²/s example gives bottom t90 about 22.85 h. This is neither the actual receptor response time nor a finding that invalidates gas CFD. It motivates an independent uptake measurement. The main page should retain the short limitation, without turning this assumed example into the project's measured response-time headline.

Our application of those questions is: show the need on Hardware; publish a traceable design decision on both pages; keep numerical checks distinct from device tests; and let another person reproduce a figure or assemble the apparatus. A collaborator can reveal an electrical error, a confusing manual step or missing tools. Record the task, date, equipment, observation, specific change and repeat outcome. A discussion, endorsement or questionnaire alone does not demonstrate instrument functionality. Planned Cycle 5 remains planned until a real participant follows the manual and evidence is recorded.

## Archive and external-link boundary

The 2026 award routes are explicitly `/hardware` and `/model` on the official team wiki. Keep substantive evidence there. The GitHub Pages site is a staging/mirror location, not proof of official submission.

At this audit, direct reads of current Team Wiki policy returned a JavaScript shell, so this plan does not invent a verified 2026 penalty, deadline or new hosting exception. The [2025 official handbook](https://static.igem.org/websites/competition/2025/judging/2025judgehandbook.pdf) is a **dated fallback**, supporting self-contained, navigable project records on iGEM infrastructure. Current 2026 team-template search results are consistent with that direction but are not the governing policy. Confirm the current policy in the team portal before deployment.

Use the conservative implementation: archive website code, analysis code and frozen data on the assigned iGEM GitLab; upload supported media/documents through iGEM's upload facilities; use iGEM Video Universe for competition video embedding; host interactive JavaScript and its data on allowed iGEM infrastructure. Mirror on GitHub if useful, but make the judged evidence independent of that mirror, a live API or a remote notebook. Ordinary reference links to primary papers are different from runtime-loaded external assets; this plan does not ban normal citations. Check the actual deployment with the official External Content Check and a disconnected/offline reconstruction of the appendix.

The appendix index should state its release date, code/dependency versions, data source, assumptions, commands, file hashes and license/attributions. Include optical/flow/membrane raw tables, code, parameter files, figure notes, CAD source, the eight operating STLs, BOM/manuals and firmware sources. Link a small representative output from each main-page result to its exact source. Do not leave a beautiful main page pointing only to an unstructured ZIP.

## Bounded action sequence

1. **Now:** replace stale Hardware geometry/results/downloads atomically; add the current evidence-state summary and reciprocal Model links.
2. **Now:** insert the physical-model blocks, keeping the SNN benchmark and missing-artifact disclosure separate. State the interface-versus-cell exposure limitation clearly and link the detailed uptake boundary cases.
3. **Now:** build the appendix index from existing verified artifacts and publish all required methods/decisive figures on the main pages too.
4. **After the PCB arrives:** perform the short validation plan already supplied. Promote only results with dates, raw files, units, controls and actual replicate counts.
5. **After a manual trial:** write Cycle 5 as observed confusion → revision → retest. Until then retain the protocol and empty feedback form as planned work.
6. **Only after docking records arrive:** identify the exact protein/ligands and publish an exploratory analysis with search settings and controls. This is lower priority than closing the basic hardware evidence gaps.

No additional experiment is claimed by this integration plan. If time runs out, a clearly documented negative or unresolved result is stronger than an unsupported success claim.


## Assembly feedback across pages

Keep the study method, anonymous observations and measured task outcomes in Hardware, with problem→revision→retest in Engineering Cycle5. Entrepreneurship can link target-user needs/adoption evidence, while Education needs an actual teaching goal, dialogue and learning evidence. A usability questionnaire alone does not establish both. Do not duplicate one participant study as independent evidence. The [completion plan](../../07_validation/Completion_Plan_EN.md) sets out the remaining tasks and the [standard/cell guide](../../07_validation/Fluorescence_and_Cell_Test_EN.md) separates optical proof from biological evidence.
