# Operating and validation protocols

This document defines an executable engineering sequence, data fields and provisional acceptance gates. Thresholds are initial project requirements, not established GCaMP6f/HEK293T biological safety standards. Pre-register them in the test plan and retain failures and raw data.

| Stage | Inputs / records |
| A Electronics | Supply, D1-D4 frequency/current, ADC waveform and raw codes |
| B Optical blanks | Dark, empty well, medium, GCaMP-negative cells, fluorescent standard |
| C Gas/mechanics | Flow/pressure, leaks, closure pulse,20 replacement cycles |
| D Cells/reference | Batch, density, receptor, reference challenge, viability and pH |
| E Analysis | Raw I/Q, mixing matrix, normalization and independent-batch validation |

Log operator ID, date, device ID, firmware/CAD hashes, resin lot/cure, well and cell batch, fill volume, temperature, humidity, CO2/pH, standard gas concentration with units, flow, duty and filter IDs. Exclude unitless concentration records from training.

# A. PCB bring-up and four-frequency sampling

1. Ask the vendor to verify power routing, battery polarity, SW1, digital/analog3.3 V and2.5 V reference. Start with a current-limited supply and record voltage/current/heating with idle, Wi-Fi, each LED and fan. The candidate fan adds up to157 mA at5 V (0.785 W); supply margin is not established.

2. Scope GPIO25/26/27/32 and MOSFET drains for D1-D4. Use41/67/89/113 Hz and initially low-duty short tests; measure LED current and optical power. Duty changes pulse fraction, not regulated current amplitude. Verify LEDs off at stop, error, reset and power-down.

3. ADS8866 uses GPIO33 CONVST,18 SCLK,19 DOUT; DIN is pulled high. Check conversion-high time of at least8.8 us before reading. Implementation waits10 us, then SPI mode0 at2 MHz,16-bit MSB first. Verify offset, midscale and gain using a suitable known input and measured VREF; never apply an over-range signal.

4. Each2 s block has8000 samples at4 kS/s. Provisional gates: no lost samples, no rail samples, maximum interval error≤50 us; otherwise invalid. This timing gate does not prove accuracy: measure synchronous crosstalk and amplitude error as well. Enable BOARD_VALIDATED only after checking actual waveforms.

5. Use a stable controllable optical source at≥5 intensities and10 blocks each for linearity, dark noise, repeatability and channel leakage. Initial targets: midrange CV≤5%, fit residual≤5%, no saturation. Detection limits require blank distributions and replicated low-concentration measurements.

# B. Optical calibration and purple resin

Print0.5/1/2 mm coupons with identical cure, measure transmission over the LED and GCaMP emission bands, and separately assess scattering and blank fluorescence. Use matched blanks/exposure and≥3 coupons; report mean, SD, thickness and instrument calibration. Beer-Lambert estimates bulk absorption only after accounting for reflection/scattering.

Purple tint may reflect bulk absorption or dye/photoinitiator. Polishing addresses surface scatter. A single scale factor cannot correct background or spectral attenuation that changes with lot, cure or soaking. Fast path: cell-free optical blanks first. If they fail, use qualified optical windows/culture vessels and re-fit the mechanics.

Mixing matrix: hold LED/electronics settings constant; place the same stable fluorescent standard in one well at a time, with matched blanks in the others. Record complex I/Q at all four frequencies,≥5 replicates per well. Rows of M are LED frequencies, columns are wells: y=Mx+b. Subtract complex background before inversion. Attempt inversion only under matched conditions and condition number<30, a provisional threshold requiring uncertainty propagation.

Synchronous signals from GCaMP-negative cells or medium may arise from blue leakage or resin. DLIA does not remove LED-synchronous background. Verify the filter over actual angles/spectra; catalog optical density is not the assembled-system leakage ratio.

# C. Gas, pressure and assembly stability

With cell-free liquid, compare the no-plate control and selected plate at an initial0.25/0.5/1 mL/min sweep. This is a test range, not demonstrated cell tolerance. Install both filters, tubing and cap. Record inlet/outlet flow, differential pressure, closure pulse, mass loss and liquid disturbance.

Hole speed scales approximately asQ/A_open; reducing area at fixed flow raises jet speed. Filters are excluded from CFD and may dominate pressure loss. With blocked ports, closure gives ΔP≈P_atm ΔV/V: a1% compression is about1 kPa, far above the modeled chamber loss near0.01 Pa. Keep filtered exhaust open and close slowly.

Define leak acceptance from exposure requirements after measuring flow-meter uncertainty. An inlet/outlet mismatch may reflect leakage, instrument error or transients. Stop for wet/blocked exhaust filters or abnormal pressure. This enclosure is not a pressure vessel.

Assembly stability:20 well/lid replacement cycles with the same blank or stable fluorescent standard, fill and settings. Record channels, leaks, positioning, damage and time. Start with signal CV≤5% and compare against drift without disassembly. Report failures; a plate need not improve uniformity.

# D. Cells and reference challenges

The system uses HEK293T, not bacteria. Culture, identity, mycoplasma checks, handling and waste follow the laboratory procedures for that cell line. Filters and gaskets are not a biosafety cabinet, and optical qualification is not cell compatibility.

First compare extract exposure and direct contact against a commercial culture-vessel control, matching batch, density, medium, receptor/GCaMP expression and observation time. Use≥3 independent batches. Assess morphology, attachment, viability, pH, baseline and reference response, not brightness alone.

The device has no heater, cell-temperature or CO2 sensor. Even short exposure outside culture conditions may alter pH and response. Record actual liquid temperature, buffer, CO2, humidity and evaporation. Continuous culture requires external environmental control or additional design; a cooling fan is not culture control.

Prefer a traceable, stable odor reference known to activate the specific receptor, with matched carrier gas as blank. Select a repeatable nonsaturated concentration from dose-response data. Calcium-active reagents may test downstream response but are not receptor-specific odor controls and may alter later measurements. No universal dose is invented for an unspecified receptor.

Per batch: blank → baseline → reference → recovery check → randomized samples/blanks → ending reference. If reference causes irreversible drift, use a separate reference well/batch rather than repeatedly stimulating the same well. Shared-gas wells are not unexposed gas controls.

# E. Normalization, performance and model validation

Correct instrument gain, phase and background before biological ΔF/F0=(F-F0)/F0. The UI subtracts complex dark signal per frequency before taking amplitude. Use≥5 valid blocks each for dark, baseline and reference. Reject a near-noise baseline. Reference normalization isR=(F-F0)/(Fref-F0); do not report R when the denominator is below5 times dark-noise estimate.

Excitation differs between LEDs; wells need not share a scale. Without measured M, the UI displays normalized LED channels rather than claiming unmixed cellular wells. Calibration does not repair saturation, nonlinearity, changing spectra or inactive receptors.

Performance testing includes blanks, rise/recovery time, range/dose response, within/between-day repeatability, cross-odor responses, temperature/humidity interference, carryover/cleaning, bleaching/phototoxicity and assembly cycling. Biological n is independent batch; windows from one batch are technical replicates. Report raw data, exclusion reasons and intervals, not selected attractive traces.

Split the NN dataset by cell batch/day/device; never place adjacent windows from one run across train/test. Fit feature scaling on training only. The supplied small MLP trains and predicts, but no labeled biological dataset is available, so no fabricated odor model or accuracy is supplied. Reserve prospective testing and report confusion, per-class recall, unknown/no-response cases and failures.
