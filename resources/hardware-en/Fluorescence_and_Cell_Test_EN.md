# Fluorescein preparation and HEK293 cell experiments

## Update, 2026-10-14: The current wells are not qualified culture vessels

The user reports Aqua-Clear Plus wells printed with a Phrozen Mighty Revo 16K. After approximately 24 hours at 37°C and 5% CO₂, medium had dried in several wells. One well still contained liquid, but normal attached cells were not observed. Cells from the same batch were normal in a standard culture dish with the same DMEM. These are user observations of morphology and liquid loss. They are not a quantitative viability assay or a resin toxicity result. The user also reports that PCB heating is resolved and the fan turns. This does not establish sample temperature, humidity or cell compatibility.

**Stop overnight culture in these wells for now. The cell count, 100 µL volume and 24-hour schedule in Section 7 remain conditional development examples. They are not validated settings for these printed wells.** Keep healthy cells in standard culture vessels. Retain the complete DMEM formulation that already supports this cell batch. Do not increase the cell count to compensate for the failed culture. Do not refill a dried well and treat it as a normal experimental group.

### Check liquid loss first

1. Use no cells. Put the removable wells in a sterile secondary culture dish with a lid. Keep the PCB outside the incubator.
2. Add the same medium at a working volume that does not overflow the actual wells. Record the initial volume and liquid level.
3. Inspect the bottom, joints and secondary dish for leaked liquid.
4. Use the original culture environment. Inspect the liquid level at approximately 2 hours. Compare the remaining volume at 24 hours. Stop the condition if a well dries earlier.
5. If evaporation is the cause, improve the cover and local humidity. A separate sterile water or PBS reservoir in the secondary dish is a candidate humidity control. Keep reservoir liquid separate from the samples. Use a cover that permits the required incubator gas exchange. Do not seal the sample wells airtight.
6. Do not blow dry air across the samples during culture. The electronics fan does not control sample temperature or humidity.
7. Repeat the test without cells after each change. Remaining liquid can still be concentrated. Do not use a condition with large liquid loss to isolate resin toxicity.

Drying severely damages cells. Evaporation concentrates medium before the well becomes dry. A wet well can still have evaporation, attachment, material-leaching, cleaning-residue, contamination or imaging problems. The current observations do not isolate one cause. See [Corning guidance on evaporation and gas exchange](https://www.corning.com/catalog/cls/documents/faqs/CLS-AN-437_DL.pdf).

### Change the cell-contact vessel

Prefer a commercial cell-culture vessel that already supports attachment of this cell line. Use the printed part as a holder. Keep the cells and medium in a complete inner vessel. Isolate both the bottom and the side walls from the resin. A glass piece on the floor alone does not isolate resin side walls. Adapt the holder and optical path to the actual vessel dimensions. The present wells are not confirmed to accept an insert. Recheck alignment, background and fluorescence collection after the vessel changes.

For further development of direct resin culture, first control liquid loss. Then compare a small cell pilot with standard vessels from the same batch. Check early attachment and viability with the laboratory's established method. GCaMP brightness and cell shape alone are not a quantitative viability result. An attachment coating is not automatically a barrier to leachates. Extra UV, alcohol or a cleaning method from a different resin does not establish compatibility.

The [official Aqua-Clear Plus product page](https://global.phrozen3d.com/collections/standard-resins/products/phrozen-standard-aqua-clear-plus-resin) describes a transparent printing resin. It does not provide HEK293 culture validation for this project. A [primary study of other photopolymers](https://pmc.ncbi.nlm.nih.gov/articles/PMC7372443/) reports cytotoxicity and discusses the material-surface-to-medium-volume ratio. It does not prove that Aqua-Clear Plus caused this failure.

The constant ADC code was an earlier diagnostic issue. The current cell-free records are evaluated with their acquisition QC; this update does not turn the earlier culture observations into a successful live-cell test. GCaMP6f cell measurements in standard vessels with the existing microscope remain separate biological evidence. They do not establish live-cell operation of this device. A brief transfer into the device also requires evidence for the actual contact time. Ten or fifteen minutes is not an automatic safe limit.

Working-volume update: 2026-10-16. Use the existing **GCaMP6f-expressing HEK293 cells and Gibco DMEM**. Section 6 gives the complete-medium preparation. EMEM is not a required purchase for this workflow.

This manual uses short instructions, fixed terms, and preparation–procedure–check sections. It follows selected ASD-STE100 writing principles. It does not claim formal ASD-STE100 compliance. Sections 2–5 describe the current double-distilled water workflow and its recorded repeat structure. The later cell procedures are development tests, not a validated resin-culture process. Use [Validation_Plan_EN.md](Validation_Plan_EN.md) for the hardware checks.

**Selected working volume: 100 µL per well.**

The latest user report places the full volume near 120 µL. The selected working fill is 100 µL. These are reported operating choices, not measured capacity tolerances or proof of culture suitability. Check each well away from the PCB. Check usable volume with the lid installed. Use 100 µL only if clearance and handling checks pass. Otherwise, record a smaller common volume and recalculate the suspension. The optical model uses the same nominal 100 µL fill. The current airflow study ends in the gas above the liquid. It excludes OBP binding, liquid-phase transfer and cellular response.

## 1. Use sodium fluorescein

### Preparation

Borrow a small amount of **fluorescein sodium salt / sodium fluorescein, CAS 518-47-8**, preferably a documented laboratory stock or fluorescence-grade reagent. An identifiable purchase example is Sigma/Merck 46960; local stock and price have not been confirmed. It is a fluorescent molecule, not simply a coloured or pH-indicator solution. Avoid substituting FITC, highlighter ink or unspecified tracer mixtures. The supplier lists excitation/emission at 490/514 nm in 0.1 M Tris, pH 8.0; these are condition-specific values, not guaranteed peaks in double-distilled water. [Supplier identity and spectral information](https://www.sigmaaldrich.com/US/en/product/sigma/46960)

The specified Würth 155124BS73200 LED has a typical 468 nm peak and 470 nm dominant wavelength. Its spectral bandwidth is 25 nm at the 20 mA datasheet condition. Fluorescein is therefore a practical candidate for this blue-excitation/green-detection path. Excitation is below its alkaline-solution maximum. This overlap is an engineering inference. Actual device sensitivity remains to be measured. Datasheet current and luminous intensity do not establish PCB optical power. [Actual LED datasheet, page 2](https://www.we-online.com/components/products/datasheet/155124BS73200.pdf)

Keep buffer, pH, temperature and light exposure consistent. Fluorescein changes with pH and can bleach; increasing concentration can introduce nonlinearity, self-quenching or absorption/reabsorption effects. Published thresholds from a different cuvette or buffer are not acceptance thresholds for our wells. [Manufacturer handbook](https://www.thermofisher.com/us/en/home/references/molecular-probes-the-handbook/fluorophores-and-their-amine-reactive-derivatives/fluorescein-oregon-green-and-rhodamine-green-dyes.html), [primary sodium-fluorescein study](https://pubmed.ncbi.nlm.nih.gov/20444121/), [NIST fluorescence guidance](https://nvlpubs.nist.gov/nistpubs/ir/2007/ir7457.pdf)

## 2. Prepare the expanded water standards

Use sodium fluorescein in double-distilled water, with **100 µL in every well**. Keep the stock, working solutions, blank and final rinse in the same solvent. Record stock identity, concentration, preparation ID and available temperature and pH measurements. Protect standards from unnecessary light.

| Reported label | Sodium-fluorescein concentration | Four-well fill |
|---|---|---|
| Water blank | 0 µM | Water in D1-D4 |
| 10C | 1 µM = 0.001 mM | Same concentration in D1-D4 |
| 25C | 2.5 µM = 0.0025 mM | Same concentration in D1-D4 |
| 50C | 5 µM = 0.005 mM | Same concentration in D1-D4 |
| 100C | 10 µM = 0.01 mM | Same concentration in D1-D4 |
| 200C | 20 µM = 0.02 mM | Same concentration in D1-D4 |

The 2.5 µM acquisitions are retained for QC; the current primary calibration uses water, 1, 5, 10 and 20 µM, as explained in Section 5.

The original naming convention has C = 0.1 µM. Use the full concentration in figures, reports and new sample labels. The preparation route must follow the actual laboratory record; the table does not imply that one measured standard was diluted to make another.

For future preparation from a documented stock, use Cstock × Vstock = Cfinal × Vfinal. Make each target solution in a separate labelled tube. Select a stock or documented intermediate concentration that gives an accurately pipettable volume. Mix before dispensing; do not prepare a concentration directly inside an individual well.

**Recorded repeat structure:** each group has one freshly prepared sample/fill, read three consecutive times without reloading. Different named groups were freshly prepared. Thus the expanded series has six preparation groups and 18 technical readings; each concentration has one preparation. Keep its three technical readings together during fitting and validation. The earlier four-level study has a different preparation structure and remains a separate dataset.

## 3. Acquire and preserve the raw signal

1. Fix the filter, carrier, lid, LED settings and 100 µL fill. Record D1-D4 orientation and the acquisition condition ID.
2. Before solution exchange, stop acquisition, switch LEDs off and stop external gas flow. Keep liquids away from the PCB.
3. For a new session, acquire a fresh illuminated water blank before standards. Recheck water after rinsing and near the end of the series. These bracketing blanks help detect carryover or changing background.
4. Inspect bubbles and liquid level, dry the outside of the carrier and close the light shield. Use a consistent interval between loading and measurement.
5. Read the same fill three times. Keep the LEDs off between acquisitions. Record any accidental change to the filter, lid or carrier.
6. Download each raw ADC CSV before the next acquisition. Retain the complete JSON, record ID, settings and actual acquisition order.
7. Clean and rinse before a fresh group. Keep preparation ID, fill ID and read number separate.
8. After a filter change or changed alignment, establish a new condition ID, blank and calibration.

The expanded records use 4,000 samples/s, 8,000 samples per two-second acquisition, 25% LED duty and D1-D4 frequencies of 41, 67, 89 and 113 Hz. All 33 records, including the separately supplied 2.5 µM acquisition, reproduce the recorded I/Q within 6.53 × 10^-10 V; recorded ADC codes span 89-27674 without rail saturation.

The supplied expanded dataset contains one water group acquired after the single-well groups. Its mean complex I/Q supplies the within-session reference for offline analysis. The earlier saved blank remains archived but is not substituted for this reference. This retrospective correction does not supply the before-and-after blank checks recommended above.

## 4. Measure uniform and single-well groups

In the uniform series, fill D1-D4 with the same concentration from Section 2. In the single-well series, use the following four fresh fills; all four LEDs remain active during each acquisition.

| Fill | D1 | D2 | D3 | D4 |
|---|---|---|---|---|
| D1 only | 10 µM | Water | Water | Water |
| D2 only | Water | 10 µM | Water | Water |
| D3 only | Water | Water | 10 µM | Water |
| D4 only | Water | Water | Water | 10 µM |

Each single-well fill has three technical readings. These four inputs identify a four-column optical response matrix at 10 µM. D1-D4 label the physical source wells and their assigned LED channels consistently; a channel can also receive fluorescence excited in another well.

The earlier mixed layouts A and B remain an external comparison. They use 0, 0.1, 1 and 10 µM with multiple fresh loadings. Do not combine their preparation counts with the expanded series, or assume that a changed optical configuration preserves the same response.

## 5. Calibrate and verify an unknown measurement

### Subtract the matching water reference

Recompute the lock-in vector Z = I + iQ at each LED frequency. Subtract the current water-reference mean once in complex space: Zcorrected = Zsample - mean(Zwater). Retain raw and corrected I/Q. Determine each channel's fixed phase from its own isolated 10 µM source measurement after the same blank subtraction. Project the corrected signal along that phase to obtain a signed response in mV. The phase therefore does not use the uniform concentration labels.

Blank subtraction removes the measured background offset. It does not eliminate random noise or a background that changes after the reference was collected. Preserve negative values; taking an absolute magnitude would fold them upward. The 41/67/89/113 Hz spectrum demonstrates LED-frequency separation, not an optical wavelength measurement.

### Use one curve family for D1–D4

Fit the same exponential function family for all four channels, with separate coefficients to account for their sensitivities:

**y = a + b × [exp(k × c / 20) - 1] / [exp(k) - 1]**

Here y is the signed blank-corrected signal in mV and c is sodium-fluorescein concentration in µM. The coefficient file supplies a, b and k for D1–D4. These curves describe the tested configuration with the same concentration in all four wells and a 100 µL fill. Keep the filling pattern and optical assembly consistent when using this conversion.

The primary calibration uses water, 1, 5, 10 and 20 µM. The original 2.5 µM acquisition is kept as QC data because D3 changed by 81.1% between consecutive readings. The additional 2.5 µM acquisition has good carrier repeatability, with CV 0.18–0.42%, but was measured earlier and has no matching water reference. Its D3/D4 signals fall below the later blank, so it is retained separately rather than substituted into the primary curve. Both raw acquisitions and sensitivity fits remain archived. This QC decision does not establish a detection limit at 2.5 µM.

### Compare predicted and actual concentration

Invert the exponential curve only when the measured value gives a unique concentration inside 0–20 µM:

**c = (20 / k) × ln[1 + ((y - a) / b) × (exp(k) - 1)]**

Check the logarithm argument and calibrated range before reporting a value. Report an out-of-range result instead of clipping it to zero or choosing a root to match the expected answer. For routine measurements, retain the signal, curve version, blank ID, sample condition and calculated concentration together.

To check prediction, remove the entire 1, 5 or 10 µM group in turn and refit using the other levels. All three technical readings remain together. Across the 12 channel-by-concentration checks, the common exponential family gives RMSE 1.28 µM, compared with 3.04 µM for the common linear family. The held-out 10 µM predictions are 11.59, 10.93, 11.24 and 10.99 µM for D1–D4. The 1 µM predictions span 1.00–3.27 µM, so relative error is larger at the low end. Curve-family selection and the 2.5 µM QC exclusion are exploratory development decisions; these checks do not replace a fresh validation batch.

### Test residual corrections before applying them

Define residual as predicted minus assigned concentration. Evaluate an optional constant correction or a linear residual function using nested concentration holdouts. Learn the residual correction from inner training predictions only; then apply it to the outer withheld concentration without using its true value.

For a linear residual fit e = alpha + beta × cpredicted, use cadjusted = cpredicted - (alpha + beta × cpredicted). In the current data, a constant correction changes nested RMSE from 1.28 to 1.34 µM; a linear correction raises it to 19.57 µM and produces three out-of-range predictions. Use the unadjusted exponential curve for the present uniform-loading candidate. An extra offset is not supported by these checks.

### Use isolated wells to assess channel interference

Build a response matrix from the four isolated 10 µM fills after blank subtraction, retaining four I and four Q components. A held-out technical reading is excluded from both its source-column estimate and the corresponding blank estimate. The active well is identified in all 12 held-out readings; active-well estimates span 9.25–10.83 µM, with RMSE 0.51 µM. This demonstrates repeatable source identification at the tested concentration.

The requested matrix-first approach was also tested before curve fitting. With a common exponential family, its concentration-holdout RMSE is 3.07 µM among 11 valid results, with one failed inverse, compared with 1.28 µM and 12 valid results for the uniform empirical curves. The matrix alone estimates D3 at -2.37 µM for a uniform 10 µM sample; source-only ridge tuning changes this to -2.29 µM. The single-concentration matrix therefore is not used as a universal interference subtraction for mixed unknowns. To extend the method, measure each isolated well at several concentrations and validate independently prepared mixed fills.

### Read the statistics and preserve the calibration context

The primary five-level series has a positive joint concentration trend across D1–D4: exact two-sided joint Spearman permutation p = 0.0167. One star denotes this joint association. Individual-channel tests after Holm correction give p = 0.0667; the figure does not claim four separately significant tests or pairwise differences between technical readings. Error bars describe three technical reads of one preparation per condition.

After a filter or geometry change, collect a fresh water blank, a span standard and a separate unused intermediate check standard. Keep optical position and timing fixed; collect bracketing blanks and inspect all readings before averaging. Accept a routine conversion only after independent check samples meet a tolerance selected for the experiment.

Use the same D1–D4 orientation and normalization when comparing simulation and measurements. The original cell-floor simulation and the homogeneous 100 µL liquid simulation describe different emitter distributions. Preserve their separate labels; simulation optical-power fractions are not measured ADC voltages. In signed heatmaps, positive values are red and negative values are blue.

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

| Pilot condition | Viable cells/well | Density on nominal floor | Suspension for 100 µL/well |
|---|---:|---:|---:|
| Low, if testing a range | 1,500 | 1.34 × 10⁴ cells/cm² | 1.50 × 10⁴ viable cells/mL |
| Default starting point | **3,000** | **2.68 × 10⁴ cells/cm²** | **3.00 × 10⁴ viable cells/mL** |
| Higher, if testing a range | 4,000 | 3.57 × 10⁴ cells/cm² | 4.00 × 10⁴ viable cells/mL |

Four starting wells need 12,000 viable cells in 400 µL. Prepare 500 µL to allow for handling losses. For stock at **1.00 × 10⁶ viable cells/mL**, mix 15 µL with 485 µL complete DMEM. This makes 500 µL at 3.00 × 10⁴ viable cells/mL.

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
11. Dispense 100 µL slowly along the well side.
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
3. If loss exceeds 10% of 100 µL, or 10 µL, correct the exposure conditions.
4. For longer culture, follow the existing medium-renewal schedule.
5. During exchange, aspirate gently from the side.
6. Keep the floor wet.
7. Restore the recorded working volume.

The 10% loss threshold is a development choice. Evaporation changes concentration and osmolality. Do not top up blindly and treat the data as unchanged.

At nominal area, 100 µL corresponds to about **8.93 mm liquid depth**. This is a geometry-based estimate, not measured depth. The current airflow study predicts gas arrival above the liquid. It does not predict transfer into liquid, OBP behavior or exposure of cells on the floor.

## 8. Measurement medium and environment

For growth, use complete culture medium in the incubator. For measurement, use one fixed, qualified assay medium on both instruments. Do not keep cells in the DDW fluorescein solution. The device has no demonstrated temperature, CO₂, humidity or cell-pH control. Its fan is not an incubator. A UI setting is not a measurement.

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
| Hardware/dye qualification | The water and 1/2.5/5/10/20 µM series above, single-well fills, raw acquisition QC and unused check standards | Whether the selected fill/filter/settings support the intended measurement |
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

**Check:** Subtract the independent complex blank **once**. Never save living cells as the optical blank. DDW calibration does not replace the actual-medium blank. Weak or near-zero F0 cannot support a reliable ΔF/F0 ratio. If filter, wells, volume, duty, medium or calibration changes, establish a new context and F0. Do not add fluorescein to these cells. Use separate qualified wells or a demonstrated carryover-free process. [Correction guide](../03_software/guides/Measured_Correction_EN.md)

If calibration and cell measurements use different inserts, first test repeated insert exchanges with cell-free solutions. Check seating, resin background and optical-path variability. Record that transfer uncertainty. Another insert's blank is not automatically exact for a cell insert. Do not hide an optical change with an unchanged context label. After a restart, obtain valid calibration and F0 again.

For the first reporter comparison, use matched samples from the existing cell batch. Allocate them before you see data. Keep the established stimulus identity, concentration, solvent and timing. An unidentified receptor cannot support a universal odor or drug dose. A general calcium-positive control checks the reporter pathway, not odor specificity. Retain cell identity, passage, viable input, coverage, medium, volume, sample temperature, pH, filter configuration and stimulus time.

Current firmware records a **2-second I/Q block followed by at least 3 seconds idle**. Approximately 5 seconds or more separate observations; 41/67/89/113 Hz identifies light sources, not cellular sampling speed. GCaMP6f can change faster than this schedule captures. Choose an already validated sustained response and retain a faster reference trace. Before collection, choose one post-stimulus comparison window and compare mean unsmoothed ΔF/F0 in that same window, including vehicle and baseline variability. Align only to recorded stimulus time, without best-fitting delays or separate peak normalization. Average the reference over actual 2-second windows if useful; do not fill acquisition gaps and present them as measurements. [Original GCaMP6 study](https://www.nature.com/articles/nature12354)

Use identical cell/stimulus conditions in all four device wells for the simplest first biological comparison; retain all four channel traces. They remain optically mixed channels. Shared gas is not four independent exposure replicates. Liquid dosing in a reference instrument and gas dosing here are not equal-dose tests. One cell batch is a feasibility pilot; later replication must use independent culture batches. Dye results do not validate protein-assisted gas uptake or receptor specificity.

## 10. Retain the measurement record

Keep device photos, analysis figures, full session JSON, raw CSVs and preparation/settings notes. Mark each predeclared criterion as pass, fail or not performed.

For a completed cell comparison, retain unsmoothed device and reference traces, vehicle responses, stimulus markers and the fixed comparison window. State the number of independent cell batches; one batch is a feasibility pilot. Preserve the original comparison when normalizing, selecting channels and aligning time.

