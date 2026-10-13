# Fluorescein preparation and HEK293 cell experiments

Revision: 2026-10-11. Use the existing **GCaMP6f-expressing HEK293 cells and Gibco DMEM**. Section 6 gives the complete-medium preparation. EMEM is not a required purchase for this workflow.

This manual uses short instructions, fixed terms, and preparation–procedure–check sections. It follows selected ASD-STE100 writing principles. It does not claim formal ASD-STE100 compliance. The procedures are development tests, not completed experiments or a validated resin-culture process. Use [Validation_Plan_EN.md](Validation_Plan_EN.md) for the hardware checks.

**Working volume: provisionally 80 µL per well.**

The physical wells reportedly become full near 100 µL. This observation takes precedence over ideal CAD capacity. Check each well away from the PCB. Check usable volume with the lid installed. Use 80 µL only if clearance and handling checks pass. Otherwise, select a smaller common volume. Recalculate the cell suspension for that volume. The historical optical and transport models use 100 µL. They were not recalculated for 80 µL.

## 1. Use sodium fluorescein

### Preparation

Borrow a small amount of **fluorescein sodium salt / sodium fluorescein, CAS 518-47-8**, preferably a documented laboratory stock or fluorescence-grade reagent. An identifiable purchase example is Sigma/Merck 46960; local stock and price have not been confirmed. It is a fluorescent molecule, not simply a coloured or pH-indicator solution. Avoid substituting FITC, highlighter ink or unspecified tracer mixtures. The supplier lists excitation/emission at 490/514 nm in 0.1 M Tris, pH 8.0; these are condition-specific values, not guaranteed peaks in PBS. [Supplier identity and spectral information](https://www.sigmaaldrich.com/US/en/product/sigma/46960)

The specified Würth 155124BS73200 LED has a typical 468 nm peak and 470 nm dominant wavelength. Its spectral bandwidth is 25 nm at the 20 mA datasheet condition. Fluorescein is therefore a practical candidate for this blue-excitation/green-detection path. Excitation is below its alkaline-solution maximum. This overlap is an engineering inference. Actual device sensitivity remains to be measured. Datasheet current and luminous intensity do not establish PCB optical power. [Actual LED datasheet, page 2](https://www.we-online.com/components/products/datasheet/155124BS73200.pdf)

Keep buffer, pH, temperature and light exposure consistent. Fluorescein changes with pH and can bleach; increasing concentration can introduce nonlinearity, self-quenching or absorption/reabsorption effects. Published thresholds from a different cuvette or buffer are not acceptance thresholds for our wells. [Manufacturer handbook](https://www.thermofisher.com/us/en/home/references/molecular-probes-the-handbook/fluorophores-and-their-amine-reactive-derivatives/fluorescein-oregon-green-and-rhodamine-green-dyes.html), [primary sodium-fluorescein study](https://pubmed.ncbi.nlm.nih.gov/20444121/), [NIST fluorescence guidance](https://nvlpubs.nist.gov/nistpubs/ir/2007/ir7457.pdf)

## 2. Minimal materials and one starting dilution series

### Preparation

Use existing pipettes, tips, tubes, foil for light protection, the four finished wells and the installed emission filter. No new printed part, second dye, spectrometer or certified reference kit is required. Use one batch of **1× PBS at recorded pH approximately 7.4** for this cell-free test only. This is not a recommendation to maintain cells in PBS. All blanks and dye solutions must have matching buffer composition. Do not introduce culture-medium additives into only one concentration.

Start with **C = 0.10 µM = 100 nM** and **0.5C = 0.05 µM = 50 nM**. Use the checked working volume, provisionally 80 µL per well. These are proposed starting concentrations. They are not a measured sensitivity limit or a guaranteed detectable range. An 80 µL well at 100 nM contains 8 pmol. This is approximately 3.01 ng of anhydrous sodium salt. Prepare a bulk dilution. Then dispense 80 µL. Do not weigh this tiny mass directly. Sodium fluorescein needs **no DMSO or ethanol** here. Use the same PBS for stock, dilutions and blank.

### Procedure A — Start from a documented 1 mM stock

Use a **1 mM sodium-fluorescein stock made in the same PBS**. If only powder is available, complete Procedure B first.

| Prepare | Mix | Final amount and concentration |
|---|---|---|
| Intermediate | 10 µL of 1 mM stock + 990 µL PBS | 1.00 mL at 10 µM |
| C | 50 µL of intermediate + 4.950 mL PBS | 5.00 mL at 0.10 µM |
| 0.5C | 2.50 mL of C + 2.50 mL PBS | 5.00 mL at 0.05 µM |
| Blank | Same PBS without dye | Prepare at least 10 mL, plus rinse volume |

1. Prepare the intermediate with the quantities in the table.
2. Mix the intermediate before you prepare C.
3. Prepare C.
4. Mix C before you prepare 0.5C.
5. Prepare 0.5C.
6. Mix 0.5C.
7. Label each tube with its concentration, buffer and preparation date.
8. Protect the tubes from unnecessary light.

### Procedure B — Start from powder

1. Confirm the sodium-salt identity on the bottle.
2. Check the hydration state and assay certificate.
3. If the applicable formula mass is 376.27 g/mol, weigh 37.627 mg.
4. Dissolve the powder in less than 10 mL of the selected PBS.
5. Add PBS to a **final volume of 10.00 mL**.
6. Mix the solution.
7. Label it as nominal 10 mM.
8. Transfer 100 µL of this stock to a clean tube.
9. Add 900 µL PBS.
10. Mix the solution.
11. Label it as 1 mM.
12. Continue with Procedure A.

**Check:** The mass calculation assumes the stated anhydrous formula and full mass purity. Use a mass-fraction correction only if the certificate supports it. HPLC area percentage is not automatically a mass fraction. Otherwise retain the nominal label. If bottle identity differs, recalculate before weighing. Check the pipette ranges. Do not weigh nanogram quantities directly.

Prepare working dilutions fresh for the session and protect them from unnecessary light; follow the bottle instructions for stock storage. A certified NIST-traceable fluorescein product exists, but its calibration is supplied in a different buffer and does not confer traceability on these ordinary powder dilutions. It is not a required purchase here. [Certified-standard instructions and matrix matching](https://documents.thermofisher.com/TFS-Assets/LSG/manuals/mp36915.pdf)

## 3. Brief pilot, then freeze the formal experiment

### Preparation

Complete the power, leak, ADC and timing checks. Confirm the physical D1–D4 mapping. Use the verified working volume in every well.

The current filter comparison is **no filter, one LEE 101 layer, two LEE 101 layers, and one specified OD4 filter**. Record the actual product for each configuration. OD4 alone does not specify a passband or mechanical fit. Check those properties in the optical report. This guide does not assign new transmission values.

### Procedure

1. Install the selected filter configuration.
2. Close the enclosure.
3. Set a fixed, hardware-checked low LED duty.
4. Measure a PBS blank.
5. Measure C at the same volume and duty.
6. Inspect raw ADC clipping.
7. Check timing QC.
8. Compare the C response with the blank.

**If the signal clips:** Reduce duty or concentration. Restart the pilot. Retain the failed records.

**If C is not distinguishable:** Check mapping, filter installation, alignment and raw acquisition first. If those checks pass, try one higher pilot at **C = 0.50 µM**. Mix 250 µL of 10 µM intermediate with 4.750 mL PBS. Dilute this C 1:1 with PBS for 0.25 µM. The higher range must still pass the concentration-ratio check.

**If the higher pilot fails:** Stop and investigate the instrument. Do not repeatedly increase concentration until the result appears satisfactory.

Before the formal sequence, fix concentration, duty, filter, wells, volume, room light and acquisition settings. For a new filter configuration, collect new blank and phase calibrations. Run a separate complete sequence. Do not combine filter configurations in one `quick_check.py` input.

## 4. One sequence: 45 formal blocks plus phase-reference setup

### Preparation

Stop scheduling before opening/refilling. Fill without bubbles, dry the exterior and close the lid before measurement. Keep the same assembly/acquisition correction context; change the condition tag before collecting each state. All four LEDs operate at their configured frequencies during illuminated states.

Before the continuous series, establish a controlled small-volume exchange procedure that keeps liquid away from the PCB. For each exchange, stop scheduling, LEDs and gas; keep the device boot/session and optical assembly unchanged where the verified handling arrangement permits. Initial seeding, leak checks and major assembly are performed off the electronics; they are not reasons to power-cycle at every dye condition. If liquid cannot be exchanged safely in the verified setup, stop and change the handling arrangement first. If power must be removed, or a reboot or optical reassembly occurs, restart calibration and the full formal series. `quick_check.py` rejects mixed boots/settings; do not combine partial series across reboots.

### Procedure

Set the condition tag before acquisition. Follow the table in order.

| Tag | Contents of the four wells | Acquisition |
|---|---|---|
| DARK | All PBS; LEDs off | Save raw ADC and dark QC; separate from the 45 blocks |
| B_CAL | All PBS; LEDs on | Five valid blocks, then freeze illuminated-blank calibration; stop and download the latest raw ADC now |
| PHASE_REF | C in all four | Five additional setup blocks using the UI phase-reference collector; enable measured subtraction and set smoothing τ = 0 |
| B_CHECK | Return all wells to fresh PBS after a carryover-checked rinse | Five held-out blocks; never add these to calibration |
| NE_C | C only in NE; PBS in the other three | Five blocks |
| NW_C | C only in NW; PBS in the other three | Five blocks |
| SW_C | C only in SW; PBS in the other three | Five blocks |
| SE_C | C only in SE; PBS in the other three | Five blocks |
| ALL_HALF | 0.5C in all four | Five blocks |
| ALL_C | C in all four | Five formal blocks; supplies the offline analysis phase; stop and download the latest raw ADC now |
| ALL_HALF_REPEAT | Fresh refill of 0.5C in all four | Five blocks |

The nine formal illuminated conditions contribute **45 blocks**. PHASE_REF adds five UI setup blocks. DARK is separate. Complete PHASE_REF before samples that need the UI's signed corrected display. Do not reuse that tag for ALL_C. `quick_check.py` ignores PHASE_REF and uses formal ALL_C for its offline phase. Each block is a new valid 2-second acquisition. Leave at least the permitted 3-second idle interval. Five blocks are technical repeats, not five biological samples. Between conditions, rinse with fresh matched buffer using the laboratory's appropriate procedure. A clean appearance does not prove zero dye carryover. If fluorescence persists after rinsing, retain the result. Stop treating that well as blank. Do not hide retention with a new background fit. Dye retention in resin can cause results to depend on test order.

### Checks and data export

1. Keep the gas pump off for the first optical test.
2. If gas is necessary, fix and record its measured flow.
3. After B_CAL, stop acquisition.
4. Download its last raw-ADC block before PHASE_REF.
5. After ALL_C, stop acquisition.
6. Download its last raw-ADC block before ALL_HALF_REPEAT.
7. At the end, export the full session JSON.
8. Preserve settings, invalid blocks and pilot data.

**Check:** The device retains only the latest raw waveform. The final block from each specified five-block condition is sufficient. A later download cannot recover an earlier waveform. Session JSON retains observed block records, not every waveform. Use raw I/Q for offline analysis. Do not subtract background again from already corrected values. Follow the [correction guide](../03_software/guides/Measured_Correction_EN.md).

## 5. Three outputs and the correct model comparison

### Procedure

1. Run `quick_check.py` as specified in the main validation plan.
2. Enter the physically observed D1–D4 mapping.
3. Inspect the unsmoothed concentration response and technical SD.
4. Inspect the single-well 4×4 matrix.
5. Inspect independent B_CHECK before and after fixed subtraction.
6. Compare each result with the predeclared criterion.

**Check:** Do not replace failed criteria after seeing data. The half/full target of 0.35–0.65 is a project screening target. It is not a published law.

For comparison, use [volume-standard comparison in the optical model](../02_simulation/optics/README.md), **not the model of cells on the floor**. Rows are physical LED quadrants and columns are the fluorescent well, both ordered NE, NW, SW, SE. The implemented matrix entry is **abs(mean(blank-corrected complex I/Q))**, then each row is divided by its row sum. This is a magnitude of a complex mean, not a signed projection, a mean of individual magnitudes or clipping negative projections to zero. Inspect signed projections and blank variability separately: at low SNR, the nonnegative magnitude matrix has positive bias and can overstate weak cross-well coupling. The existing model's dominant-well row fractions are approximately **80.6%, 86.8%, 86.7% and 82.5%** in that order. These are simulated proportions, not measured isolation. A simulated zero from finite sampling does not prove no optical coupling.

The volume model uses absorption 0.001 mm^-1, reference quantum yield 1, and 100 µL fill. It uses LED on-power 500 µW and ideal transparent material. The provisional 80 µL test is not volume-matched to it. The dye concentration has no established mapping to that absorption or quantum yield. Historical fractions are qualitative context until geometry, volume and optical properties match. Do not compare ADC units directly with simulated nW. Do not call that comparison absolute-power validation.

If a calibrated absorbance instrument is available, measure the actual solution at excitation wavelengths. Measure the optical path length in mm. Calculate μa = ln(10) × absorbance / path length. This optional measurement supports later model matching. It is not required for the compact screen.

Successful results support **assembled-device fluorescence detection, short-session repeatability, concentration dependence, physical channel mapping and stable-background correction**. They do not establish GCaMP sensitivity, receptor selectivity, cell compatibility, sterility, gas-to-liquid transfer or neural-network accuracy. Frequency separation cannot remove unknown fluorescence-channel background that carries the same LED frequency.

## 6. Prepare complete Gibco DMEM and qualify the wells

### Preparation

Use the existing HEK293 cells that already express GCaMP6f. A new reporter-expression procedure is not part of this manual. Keep the cell line's successful culture conditions. GCaMP emits green fluorescence after excitation. Reporter expression alone does not establish odor-receptor function.

Prepare the existing Gibco DMEM, suitable FBS, sterile containers, and cell-culture pipettes. Use the laboratory's normal aseptic handling procedure. “Only DMEM” does not imply that FBS is absent.

### Procedure A — Prepare 50 mL complete DMEM

1. Read the DMEM bottle label before you add supplements.
2. Check whether it is basal DMEM or already complete medium.
3. Check whether it contains L-glutamine or GlutaMAX.
4. If the medium is already complete, use its preparation label and omit additional FBS.
5. If it is basal DMEM, transfer 45.00 mL to a sterile container.
6. Add 5.00 mL of the FBS already used successfully for these cells.
7. Mix gently.
8. Label the final 50.00 mL as DMEM with 10% FBS.

**Glutamine branch:** If the bottle contains L-glutamine or GlutaMAX, do not add more automatically. If it contains neither, add the supplement required by the existing cell procedure and product instructions. Include its volume in the final 50.00 mL.

Calculation example: **only if the established recipe requires 2 mM added glutamine**, use 0.50 mL of 200 mM stock. Combine it with 44.50 mL basal DMEM and 5.00 mL FBS. Final volume is 50.00 mL. This example does not prescribe an extra 2 mM for all Gibco DMEM products.

Keep any established selection conditions for this reporter line. Do not add new antibiotics, pyruvate or nonessential amino acids merely because another recipe contains them. Do not heat-inactivate FBS unless the existing cell procedure requires it.

**Check:** The final FBS concentration is 10% for the example above. If other supplements are necessary, reduce the basal DMEM volume by their combined volume. If the existing successful recipe differs, keep that recipe for the first device comparison. Do not change medium and resin at the same time.

### Procedure B — Prepare the culture environment

The standard starting example is **37 °C in a humidified 5% CO₂ incubator**. If the product label or successful conditions for these cells differ, use those conditions instead.

1. Set the incubator to 37 °C.
2. Use a humidified culture environment.
3. Set CO₂ to 5% for the standard example.
4. Apply any different condition specified by the product or the successful cell procedure.
5. Check medium pH after equilibration in the intended atmosphere.
6. Use a healthy expanding culture for seeding.

**Check:** Gibco DMEM formulations differ in glucose, glutamine, pyruvate and bicarbonate. A product name alone does not identify all ingredients. The cited bicarbonate-medium instructions give a 5–10% CO₂ range. The 5% starting example is within that range. If equilibrated pH is unsuitable, correct the product-specific medium/CO₂ condition before use. [Gibco DMEM instructions](https://assets.thermofisher.com/TFS-Assets%2FLSG%2Fmanuals%2FMAN0018898_DMEM_IFU.pdf)

**Applicability note:** ATCC recommends EMEM plus 10% FBS for CRL-1573. However, a primary study cultured CRL-1573 in ATCC DMEM plus 10% FBS at 37 °C and 5% CO₂. DMEM therefore has evidence for HEK293 itself. This is not a HEK293T recipe. The study does not qualify every DMEM product or this printed well. No immediate EMEM purchase is required. [ATCC reference recommendation](https://www.atcc.org/products/crl-1573), [He and Soderlund, 2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC2815232/)

If a new DMEM formulation must replace the successful one, check it in standard cultureware first. Inspect attachment and morphology at 18–24 h. Check viability and the known-positive reporter response at 24–48 h. Proceed to the resin comparison only if these checks pass.

### Procedure C — Check the cell-contact surface

The project has no demonstrated sterilization or cell-compatibility process for Aqua-Clear Plus. Use documented resin washing and post-curing instructions. Use a qualified aseptic process compatible with the material. Alcohol, UV, clarity or a coating alone does not establish compatibility. Do not invent an autoclave cycle. Results from other resins do not qualify this product. [Primary resin-device study](https://pubmed.ncbi.nlm.nih.gov/37534979/)

1. Prepare the removable wells away from electronics.
2. Prepare standard tissue-culture-treated plastic controls from the same cell batch.
3. Use the selected complete DMEM in both conditions.
4. Match the viable cells/cm².
5. Inspect attachment at 4–6 h.
6. Inspect morphology and distribution at 24 h.
7. Measure viability at 24–48 h with the laboratory's established method.
8. Use separate samples for destructive tests or viability dyes.

**Proposed check:** Require no visible contamination, marked detachment or morphology deterioration. Require viability at least 80% of the matched plastic control. These are development criteria, not regulatory qualification. If plastic passes but resin fails, resolve the material or surface process first. If a coating is needed, use an established procedure for these cells. Then repeat background and viability checks.

## 7. How many cells, how much liquid and how long

### Preparation and cell calculation

Calculate from **floor area**, not a generic 96-well recipe. The nominal floor is 4 × 2.8 mm = 11.2 mm² = **0.112 cm²**. Check the printed inner dimensions because physical capacity disagrees with ideal CAD. ATCC gives HEK293 inoculation at 1–4 × 10⁴ viable cells/cm². This gives approximately 1,120–4,480 viable cells on the nominal floor. The **3,000 viable cells/well** starting choice is within that range. It is an area-based pilot, not a measured optimum for DMEM in resin. [ATCC HEK293 culture instructions](https://www.atcc.org/products/crl-1573)

| Pilot condition | Viable cells/well | Density on nominal floor | Suspension for 80 µL/well |
|---|---:|---:|---:|
| Low, if testing a range | 1,500 | 1.34 × 10⁴ cells/cm² | 1.875 × 10⁴ viable cells/mL |
| Default starting point | **3,000** | **2.68 × 10⁴ cells/cm²** | **3.75 × 10⁴ viable cells/mL** |
| Higher, if testing a range | 4,000 | 3.57 × 10⁴ cells/cm² | 5.00 × 10⁴ viable cells/mL |

Four starting wells need 12,000 viable cells in 320 µL. Prepare at least 400 µL for handling losses. For stock at **1.00 × 10⁶ viable cells/mL**, mix 15 µL with 385 µL complete DMEM. This makes 400 µL at 3.75 × 10⁴ viable cells/mL.

Count viable cells, not total particles. A total count of 1.00 × 10⁶/mL at 90% viability gives 0.90 × 10⁶ viable cells/mL. Stock volume = target viable concentration × final volume / measured viable concentration. For another verified fill V in µL, use 3,000 × 1,000 / V viable cells/mL. Match the reference plate by cells/cm². Putting 3,000 cells in a much larger well does not give the same density.

### Procedure — Seed the wells

1. Start from the healthy expanding GCaMP6f-expressing HEK293 culture.
2. If only a frozen stock is available, recover it in standard cultureware first.
3. Follow the existing cell procedure for recovery.
4. Dissociate the expanding culture with the established method.
5. Neutralize or remove the dissociation reagent as that method requires.
6. Count viable cells.
7. Prepare the required suspension in the complete DMEM from Section 6.
8. Put the processed removable wells in a level sterile secondary dish.
9. Use a suitable cover that permits incubator gas exchange.
10. Mix the suspension gently before each transfer.
11. Dispense 80 µL slowly along the well side.
12. Keep the pipette tip away from the floor.
13. Check for bubbles.
14. Put the covered dish in the qualified culture environment.

Do not let the cell layer dry. Do not incubate the PCB or battery in a humid incubator. Time after thawing is not time after seeding.

### Timetable and required checks

| Time | Check | Action if the check fails |
|---|---|---|
| Before seeding | Complete DMEM, viable count, prepared surface and verified volume | Correct the failed preparation step. |
| 4–6 h after seeding | Attachment and distribution | Check the surface and handling before the next pilot. |
| 18–24 h | Morphology, contamination and coverage | Do not proceed with unhealthy or contaminated cells. |
| 24–48 h | Viability, assay-appropriate coverage and known-positive reporter response | Proceed only after these checks pass. Time alone is insufficient. |
| Before and after readout | Attachment, actual temperature, pH and volume | Stop if conditions leave the accepted assay range. |

The first readiness assessment is **24–48 h after seeding**. A provisional coverage target is 60–80%. Use the established assay's range when available. If density is unsuitable, change the next pilot. Do not assume another fixed waiting period solves it.

### Procedure — Maintain volume

1. Use a matched cell-free well to estimate evaporation.
2. Check the small working volume daily.
3. If loss exceeds 10% of 80 µL, or 8 µL, correct the exposure conditions.
4. For longer culture, follow the existing medium-renewal schedule.
5. During exchange, aspirate gently from the side.
6. Keep the floor wet.
7. Restore the recorded working volume.

The 10% loss threshold is a development choice. Evaporation changes concentration and osmolality. Do not top up blindly and treat the data as unchanged.

At nominal area, 80 µL corresponds to about **7.14 mm liquid depth**; historical 100 µL corresponds to 8.93 mm. These are geometry-based estimates, not measured depth. This is still a deep liquid layer: gas arrival above the liquid does not prove rapid exposure of cells on the floor. Reducing the working volume does not by itself validate the gas-to-cell transport model.

## 8. Measurement medium and environment

For growth, use complete culture medium in the incubator. For measurement, use one fixed, qualified assay medium on both instruments. Do not keep cells in the PBS fluorescein solution. The device has no demonstrated temperature, CO₂, humidity or cell-pH control. Its fan is not an incubator. A UI setting is not a measurement.

### Preferred branch — Use the qualified DMEM

Keep the complete DMEM already used successfully for these cells if the established assay permits it. A special imaging buffer is not a required purchase. Use the same recipe for device samples, reference samples and cell-free blanks.

1. Provide the CO₂ condition required by that DMEM.
2. Provide externally controlled 37 °C for the cell readout.
3. Measure the actual sample temperature.
4. Check medium pH after equilibration.
5. Check the working volume.
6. Keep the gas pump off for the first cell pilot.
7. Inspect attachment before measurement.
8. Start with a planned 10–15 min feasibility run.
9. Inspect attachment after measurement.

**Check:** Room air over bicarbonate-buffered DMEM changes the culture condition. DMEM, serum and phenol red can also change optical background. Use the actual-medium blank. Do not remove serum or change medium only to improve the plot. First check any medium change with matched biological controls.

### Optional branch — Use a qualified imaging buffer

If a new imaging buffer is necessary, one candidate is Live Cell Imaging Solution A59688DJ. Test it on the reference instrument first. It contains Ca²⁺/Mg²⁺ and 20 mM HEPES at pH 7.4. The supplied solution has no glucose. The supplier permits 5–20 mM glucose.

For a proposed 10 mM mixture, add **100 µL sterile 1 M D-glucose to 9.900 mL solution**. Final volume is 10.00 mL. Other components become 99% of their bottle concentrations. Use the same mixture for blanks and reference samples. It is not a growth medium. General supplier claims do not establish a safe duration for this reporter in resin. [Current product instructions](https://documents.thermofisher.com/TFS-Assets/LSG/manuals/MAN1001427-LiveCellImagingSolution-QR.pdf)

**Check:** Test a new buffer on the reference instrument first. Its medium-change, vehicle and known-positive responses must meet the established assay criteria. For **HEK293 ATCC CRL-1573, keep externally controlled, verified 37 °C readout**. ATCC notes that this line can lose attachment at room temperature. HEPES controls neither temperature nor attachment. The proposed 10–15 min run is not a demonstrated safe duration. If verified conditions are unavailable, continue cell-free work first. The enclosure has no qualified temperature control. [ATCC HEK293 handling notes](https://www.atcc.org/products/crl-1573)

Keep light exposure minimal and fix LED duty. Do not change extracellular calcium, serum or selection drugs during the formal series without an assay-specific reason and matched controls. During the initial optical/cell pilot, leave the gas pump off; airflow and odor exposure are a later separately controlled comparison.

## 9. Calibrate before cells, then establish living-cell F0

### Preparation

Use the existing GCaMP6f-expressing cells. Allocate matched device and reference samples before you see results. Prepare the actual-medium blank, cells without reporter where available, vehicle control, and established positive control. The positive control checks that the existing reporter still responds.

| Stage | What to collect | What it answers |
|---|---|---|
| Hardware/dye qualification | DARK, B_CAL, independent B_CHECK and 50/100 nM dye series above | Whether the reader works at the selected fill/filter/settings |
| Final assay-matrix calibration | Cell-free **actual assay medium**, final wells/filter stack/duty; at least five independent illuminated blocks, then held-out check | Background from resin, medium and LED leakage in the final optical context |
| Fluorescence phase reference | A separate matched reference validated for that optical context; a separate dye-filled calibration well may be used after carryover is controlled | Reference I/Q direction; not living-cell baseline |
| Living-cell baseline | Reporter cells before stimulus; suggested 2–5 min stable raw and unsmoothed corrected recording | F0 for this batch and environment; retain the whole period |
| Biological controls | Non-reporter cells; reporter + vehicle; reporter + established positive stimulus; matched reference-reader samples | Cellular background, handling response and whether reporter readout is functional |

### Procedure

1. Complete the dye qualification in Sections 2–5.
2. Install the final wells and filter configuration.
3. Set the correction context and fixed acquisition settings.
4. Collect at least five illuminated blocks of cell-free actual assay medium.
5. Freeze the complex blank calibration.
6. Collect an independent held-out medium blank.
7. Collect a suitable fluorescence phase reference.
8. Enable measured subtraction.
9. Set smoothing τ = 0.
10. Install the prepared cells with the verified handling method.
11. Check temperature, pH, volume and attachment.
12. Record a stable unstimulated baseline for a proposed 2–5 min.
13. Save at least five valid unstimulated Baseline blocks for F0.
14. Apply the established stimulus according to the laboratory assay.
15. Record its exact start time.
16. Acquire the predefined response window.
17. Export raw and corrected data.
18. Inspect the cells after measurement.

**Check:** Subtract the independent complex blank **once**. Never save living cells as the optical blank. PBS calibration does not replace the actual-medium blank. Weak or near-zero F0 cannot support a reliable ΔF/F0 ratio. If filter, wells, volume, duty, medium or calibration changes, establish a new context and F0. Do not add fluorescein to these cells. Use separate qualified wells or a demonstrated carryover-free process. [Correction guide](../03_software/guides/Measured_Correction_EN.md)

If calibration and cell measurements use different inserts, first test repeated insert exchanges with cell-free solutions. Check seating, resin background and optical-path variability. Record that transfer uncertainty. Another insert's blank is not automatically exact for a cell insert. Do not hide an optical change with an unchanged context label. After a restart, obtain valid calibration and F0 again.

For the first reporter comparison, use matched samples from the existing cell batch. Allocate them before you see data. Keep the established stimulus identity, concentration, solvent and timing. An unidentified receptor cannot support a universal odor or drug dose. A general calcium-positive control checks the reporter pathway, not odor specificity. Retain cell identity, passage, viable input, coverage, medium, volume, sample temperature, pH, filter configuration and stimulus time.

Current firmware records a **2-second I/Q block followed by at least 3 seconds idle**. Approximately 5 seconds or more separate observations; 41/67/89/113 Hz identifies light sources, not cellular sampling speed. GCaMP6f can change faster than this schedule captures. Choose an already validated sustained response and retain a faster reference trace. Before collection, choose one post-stimulus comparison window and compare mean unsmoothed ΔF/F0 in that same window, including vehicle and baseline variability. Align only to recorded stimulus time, without best-fitting delays or separate peak normalization. Average the reference over actual 2-second windows if useful; do not fill acquisition gaps and present them as measurements. [Original GCaMP6 study](https://www.nature.com/articles/nature12354)

Use identical cell/stimulus conditions in all four device wells for the simplest first biological comparison; retain all four channel traces. They remain optically mixed channels. Shared gas is not four independent exposure replicates. Liquid dosing in a reference instrument and gas dosing here are not equal-dose tests. One cell batch is a feasibility pilot; later replication must use independent culture batches. Dye results do not validate protein-assisted gas uptake or receptor specificity.

## 10. Small final evidence set

Keep one device photo and the three cell-free figures. Keep the full session JSON and preparation/settings notes. State each predeclared criterion as pass, fail or not performed.

If the cell comparison is complete, retain both unsmoothed traces and the matched reference data. Show vehicle responses, stimulus markers and the fixed comparison window. State the actual number of independent cell batches. One batch is a feasibility pilot. Do not hide agreement or disagreement through normalization, channel selection or shifted time axes.

Optional record sheets are available for the [cell experiment](templates/cell_experiment.csv) and [fluorescein preparation](templates/fluorescein_preparation.csv). They support the procedure; they are not prerequisites for reading this manual. Blank fields are not results. Source metadata and claim boundaries are in [Fluorescence_Test_References.json](Fluorescence_Test_References.json). DMEM evidence was checked on 2026-10-11. Earlier sources retain their retrieval dates.
