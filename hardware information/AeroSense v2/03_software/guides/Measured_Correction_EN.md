# Measured background correction and display averaging

The new path subtracts a **measured illuminated blank in I/Q space**. It does not add an arbitrary counter-waveform or promise to remove unknown same-frequency interference. ESP32 firmware still exports untouched raw I, Q and magnitude; the browser performs correction and retains both corrected and original records. Nothing has been flashed or validated on a physical board by these software tests.

## What the three controls mean

| Control | Preparation and purpose |
|---|---|
| Illuminated blank | Nonfluorescent, cell-free blank at the same fill, wells, filter, duty and optical assembly. All four LEDs run. Measures repeatable electronic plus optical background. It already contains dark background. |
| Fluorescence phase reference | A stable fluorescence standard under the same acquisition/optical conditions. Its blank-subtracted mean defines each channel's reference direction. It does not calibrate concentration or establish GCaMP sensitivity. |
| Living-cell F0 | Unstimulated cells under the intended experiment conditions. Collected separately after optical calibration, for ΔF/F0. Do not subtract this as unwanted background. |

Dark-only blocks remain useful for first-board ADC/timing checks. The new correction path subtracts the illuminated blank **once**, without subtracting dark again. The older dark-only normalization remains available while measured correction is off.

## Short operating sequence

1. Complete the power, ADC, and timing checks in the operation manual.
2. Connect the phone UI.
3. Enter a Condition ID for the board, wells, fill, filter, and duty.
4. Install a cell-free nonfluorescent blank with the intended fill volume.
5. Set Current sample label to B_CAL.
6. Press 1. Collect illuminated blank.
7. Keep the page open until five valid blank blocks are collected.
8. Install a stable fluorescence standard.
9. Set Current sample label to PHASE_REF.
10. Press 2. Collect fluorescence phase reference.
11. Wait for five valid reference blocks.
12. Check the channel reference status.
13. Select 3. Enable measured blank subtraction.
14. Set Display smoothing τ to 0 for the initial comparison.
15. Install the test sample.
16. Set its Current sample label.
17. Record the sample with unchanged acquisition settings.
18. Export JSON.
19. Export CSV.

Check: The collector requires matching device acknowledgment and valid records. A button click is not a completed calibration. Weak references cannot define a phase projection. Corrected magnitude can remain available. For biological normalization, collect five unstimulated-cell baseline blocks after optical calibration. Collect a qualified reference stimulus separately. New blank or phase calibration invalidates earlier F0 and Reference. Do not subtract dark again. DEMO data do not change when a physical sample is replaced.

Sample labels and notes are snapshotted when a new block is first received. Editing the label later does not relabel an earlier block. Existing raw-history capacity is 1,000 observed blocks; export promptly. Successful normalization identifies its exact F0/reference record IDs, and JSON retains those reference snapshots separately within the session. Calibration is browser-local, so another phone does not automatically inherit it. A reload reinitializes the display smoother and observed-session history; export before reloading. Corrected feature values are blocked from the existing research classifier: that model requires retraining/validation with a matching preprocessing definition.

## Calculation and what it cannot fix

For each frequency, let `C = I + iQ`. The firmware uses `I=2 mean(v cos θ)` and `Q=2 mean(v sin θ)` and reports peak Fourier-component volts. This Q convention is the conjugate of some phasor conventions; all correction terms use the same exported convention.

The measured blank mean is `B = mean(C_blank)`. Correction is `C_corrected = C_sample − B`, not `|C_sample| − |B|`. Let `u = (mean(C_reference) − B) / |mean(C_reference) − B|`. The signed projection is `P = Re(C_corrected × conjugate(u))`; the orthogonal component and corrected magnitude are retained. A phase change can reduce P even when magnitude stays constant; the display flags a provisional 15° phase deviation when signal is sufficiently above the blank variability. This warning is an engineering diagnostic, not an established biological rejection threshold.

F0 and sample values use the **unsmoothed signed projection** when the new mode is enabled. F0 must exceed a conservative internal guard of five times the larger of measured block variability and one nominal ADC code expressed in volts. The optional standard-stimulus denominator also includes reference-block variability in its guard. Duplicate F0/reference record IDs are rejected. Phase-reference confidence uses the measured means' standard errors with the same ADC-code floor. These guards prevent unstable divisions; they are not a measured LOD, and averaging can in principle resolve below one raw ADC code.

Blank subtraction removes an estimated stable complex mean. It does not remove photon shot noise or random electronic noise, and uncertainty in the blank mean persists in all corrected observations. For independent sample and blank estimates, variances add; averaging the subsequent samples does not eliminate their shared blank uncertainty. If the contaminating same-frequency vector changes after calibration, it remains in the output. There is no mathematical separation of two unknown contributions at the same frequency from one complex measurement.

The lock-in X/Y vector and narrow-band averaging principles follow [SRS, About Lock-In Amplifiers](https://www.thinksrs.com/downloads/pdfs/applicationnotes/AboutLIAs.pdf) and [Zurich Instruments, Principles of Lock-in Detection](https://blogs.zhinst.com/en/resources/principles-of-lock-in-detection/). Complex blank subtraction and projection here are linear operations on the measured vector, not a claim that those instruments validate AeroSense. We do not apply the simulated optical mixing matrix automatically.

## Display time constant

The optional first-order EMA averages corrected I/Q between valid blocks:

`alpha = 1 − exp(−Δt/τ)`; `Y_new = (1−alpha)Y_old + alpha C_corrected`.

Δt comes from firmware monotonic acquisition-midpoint timestamps, not phone polling or network arrival time. Default τ is 2 s; 0 disables averaging, and the UI accepts 0–120 s. The first valid block initializes the state. Duplicate polling does not average a block again. Invalid data, a changed calibration/configuration, reboot, changed τ or page reload resets the state; nonincreasing device time is rejected.

For an ideal sustained step with a previously initialized state, the continuous first-order response reaches 90% after about 2.303τ and 95% after about 3τ; the actual sparse block updates follow the displayed formula. With a 2 s block plus a 3 s idle interval, Δt is roughly 5 s and τ=2 s provides little averaging. A longer τ trades lower independent variation for slower response. This is additional averaging after the existing 2 s rectangular I/Q calculation, not a new ADC filter or a verified analog bandwidth. Do not use smoothed blocks as independent replicates or hide brief responses, clipping or drift. The general time-constant/filter-order distinction is described in the [Zurich HF2 lock-in documentation](https://docs.zhinst.com/hf2_user_manual/functional_description/lock_in.html).

## Reproducible checks and release boundary

Run `node test_correction.cjs`, `node test_ui.cjs`, `node test_calibration.cjs` and `python test_software.py` from `03_software`. The tests cover stable complex background, unknown added synchronous interference, phase shifts, weak/zero references, repeated IDs, metadata/configuration invalidation, raw-data preservation, label/export provenance and irregular-time EMA. `test_ui.cjs` is a DOM/API harness, not visual browser verification. Their synthetic signals are not PCB or biological measurements. Compile firmware and LittleFS using the existing guide; keep private credentials out of published sources. Software compilation and browser tests do not establish ADC headroom, phase stability, optical blank stability or cellular detection performance.
