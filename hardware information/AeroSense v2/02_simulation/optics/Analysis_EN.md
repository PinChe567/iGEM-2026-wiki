# Optical-path and frequency analysis

## Design decision

The new opaque carrier has nonzero optical collection and is suitable for a cell-free optical prototype. It has not demonstrated complete well isolation, uniform illumination or sufficient biological detection sensitivity. Wells are registered to the LEDs. The modeled PD-sensitive center is offset (0, −0.4) mm from the package datum; assembly rotation and bottom-view mirroring still require vendor confirmation.

The carrier encloses the clear walls from Z 44.2 to 55.5 mm, with a minimum central opaque web of 1.2 mm. The bottom band Z 42.5–44.2 remains open for excitation and collection. That shared band preserves the optical path but also permits cross-well excitation. Actual black resin opacity at 470/520 nm has not been measured. Retain the carrier, flat-bottom wells and PD seal; test filtering and reseating repeatability before cell work. Do not remove the seal merely because the predicted signal increases.

## Geometry and assumptions

| Item | Model |
|---|---|
| LED centers | (±3.3,±5.7)mm; side emitters facing central Y direction |
| Emitting area | 1.0×0.3 mm, Z 40.2 mm; Lambertian, no package lens |
| Well centers | (±3.3,±2.65)mm |
| Outer/cavity dimensions | 5×3.8 mm /4×2.8 mm; outer floor 42.5, inner floor 43, top 55.5 mm |
| Fill | 100 µL per well; flat meniscus Z 51.93 mm |
| Opaque carrier | 20×18 mm outside; four 5.3×4.1 mm clearance pockets |
| Four-well compression plate | 20×18 mm,Z 56.1–57.3, four 4×2.8 mm holes; four-hole lower gasket Z 55.5–56.1 |
| Common cap | Upper perimeter seal Z 57.3–57.9,14.8×12 mm opening; cap outside 18.4×15.6 mm, lower 57.9, inside roof 62.5, outside roof 64 mm |
| Inlet shelf | X−7.4..−0.2,Y±4,Z 58.2..59.4 mm, represented as an opaque solid |
| PD | Top Z 40.5 mm;3×2.5 mm equal-area 7.5 mm² rectangular proxy, not measured die shape |
| PD seal | Outer 4×4 mm, aperture 3×3.4 mm, compressed Z 40.5–41.1 mm |
| Filter | 5.2×4.2×1 mm, Z 41.1–42.1 mm; homogeneous absorptive proxy |
| Refractive indices | Air 1.0, liquid 1.333, clear material 1.5; Fresnel/TIR retained |
| Ideal clear material | Zero parasitic absorption and scattering |
| Cell layer | 20 µm at the floor; excitation absorption 0.5/mm, assumed |
| Representative wavelengths | Excitation 470 nm/emission 520 nm; no spectral integration |
| Reference radiant power | LED-on 500 µW, QY 1 upper-bound scenario; not measured LED output |

GCaMP calcium dynamics change the fluorescence envelope; the cell does not have to perform 41–113 calcium responses per second to follow optical excitation modulation. The original GCaMP6 study does not supply this project's expression, cell density, odor response or phototoxicity threshold. [Chen et al., Nature 2013](https://www.nature.com/articles/nature12354)

The PCB plane at Z 39.6 is a lower escape/loss boundary; substrate back-reflection is not modeled. The black-reflectance sweep applies to the represented enclosure and component solids, not measured solder-mask, metal-pad or LED-package reflectance. The real empty-well leakage test therefore remains essential.

This is rectilinear material-boundary transport, not arbitrary STL triangle tracing. Main wells including top flanges, carrier including flange pockets, compression plate, inlet shelf, PD, filter and nearby component envelopes are represented. The filter arm is X−8.35..−3.05/Y±0.3/Z 40.9..42.1; its column is X−9.5..−7.5/Y±1/Z 40.9..50.9. The underside relief above C21 is included. Remote enclosure walls and structural bridges use rectangular proxies; rounded corners and external service apertures are treated opaque. Curved lenses, chamfers, roughness and ambient light through external gas ports are not fully represented. A black outer model boundary cannot certify a light-tight product.

## Computation and checks

The primary sweep contains 24 conditions×3 seeds, 24,000 excitation and 60,000 emission packets per run: **6,048,000 packets**. Cell absorption events seed isotropic fluorescence with appropriate absorption weights. Power conversion is P_LED×absorbed_fraction×QY×470/520×collection_fraction.

Additional maps use 600,000 excitation packets and 224 isotropic source locations×65,536 packets. Collection means the fraction of source power reaching the PD, not peak-normalized brightness. Per-pixel SE and 95% Wilson intervals are saved. Median relative SE is **17.3%**, with 0 zero-hit pixels. A zero-hit estimate is not proof of zero collection.

Sweep bars are **mean±1 SE across three seeds**, not 95% confidence intervals, and exclude material/biological/model uncertainty. With only three seeds, small rankings should not be interpreted as optimization proof.

Analytic rectangular solid angle, 4% normal-incidence Fresnel reflection, TIR, HG mean cosine and 10,000 random material-classification points passed. Maximum energy-ledger error was 2.9e-15. Primary runs cap transport at 2500 events; maximum unfinished fraction was 0.0117%, with a worst conservative unresolved green-power bound of approximately 0.121 nW in an individual run. Three additional higher-packet NE comparisons at 2500/10000 events are saved in event_limit_convergence.json. This check addresses the reference condition, not full convergence for every case.

## Power and uniformity

NE reference green power is **0.593±0.035 nW**; NW/SW/SE are 0.723/0.829/1.008 nW. These are LED-on powers. At 25% duty, time-average power is 0.25 times the on-state power and the sinusoidal fundamental amplitude is approximately 0.450 times it. On-state power must not be substituted directly for lock-in amplitude.

Mean upward NE floor irradiance is **4.366 µW/mm²**, with spatial pixel CV **46.2%**. This is upward crossing flux per floor area, not all-direction fluence. It excludes cellular distribution variation. **A flat floor does not imply uniform illumination.** Side illumination, component shadows and refractive interfaces still create spatial structure.

Reversing PD offset gives 0.994 nW; centering it gives 0.922 nW. Removing the seal gives 1.103 nW, but sacrifices the light/sealing boundary and is not recommended.

Only **19.3%** of collected reference green power is within 45° of the normal and **64.8%** within 65°. These are artificial acceptance-cone diagnostics. The VEMD5060X01's±65° specification is a half-sensitivity angle, not a hard cutoff. The model does not multiply an additional cosθ factor because finite-area geometric projection is already included. The actual package response and oblique-incidence filter spectrum remain uncalibrated. [Vishay datasheet](https://www.vishay.com/docs/84278/vemd5060x01.pdf)

## Cross-well transfer and reflection

| Active LED /emitting well | NE | NW | SW | SE |
|---|---:|---:|---:|---:|
| NE | 0.5260 | 0.0506 | 0.0000 | 0.0168 |
| NW | 0.0624 | 0.6571 | 0.0031 | 0.0000 |
| SW | 0.0000 | 0.0000 | 0.7409 | 0.0881 |
| SE | 0.0201 | 0.0000 | 0.0943 | 0.8933 |

Units: nW. Each row separates received fluorescence by its well of origin. Intended-well fractions are **88.6–90.9%**; approximately 9.1–11.4% comes from other wells. Finite-sampling zeros do not establish perfect isolation. The simulated matrix condition number is **1.86**. This suggests possible numerical separation under these assumptions, but the actual 4×4 matrix must be measured using a single fluorescent standard well at a time. Fill, cell distribution and reseating can change it.

Approximately **32.0%** of received NE green power underwent at least one Fresnel reflection **after fluorescence emission**. Reflection is not automatically interference: reflected target-well fluorescence can still be useful signal. This counter does not combine the earlier excitation-path history with the emission history.

Black reflectance 0.02/0.10 gives 0.877/1.303 nW; liquid scattering 0.1/1.0 mm⁻¹ gives 0.813/2.122 nW. These are sensitivity cases, not recommendations to make wells reflective or cloudy. Higher total collection does not establish better channel independence.

At liquid scattering 1/mm, the intended-well fraction is 84.3%. Removing the upper carrier gives an NE intended fraction of 90.75%, versus 88.63% with the carrier. These comparisons must be read with finite-sampling uncertainty. **The sleeve does not eliminate shared-bottom cross-talk.** The carrier provides positioning and external-wall shielding; actual ambient-light rejection needs an empty-well illumination test.

## Filtering and synchronous background

Without excitation rejection, received blue power is **110.5 nW**, approximately 141 times that case's green power. Absorptive OD 3/4/5 proxies give blue powers **0.02423/0.00149/0.00010 nW**. Oblique rays travel farther in this absorptive model. These values must not be applied as real interference-filter angular specifications.

The linear signal is y(t)=Σ[g_j(c)+b_j]u_j(t)+n(t). Cell-fluorescence gain g_j and synchronous background b_j both retain their LED's modulation. Reflection changes path/weight; it does not automatically turn 41 Hz into another frequency. Lock-in extraction suppresses unrelated-frequency noise but cannot guarantee removal of reflected excitation light.

The detector comparison now uses a separate three-seed MC calculation for each LED at OD3, OD4 and OD5: 12 additional cases and 3,024,000 packets. The original 24-case results are unchanged. Each LED has its own blue leakage; no NE gain is reused as another LED's prediction. The desired green comparator uses the OD3 green means (emission normal transmittance 0.9), retains reflected fluorescence, and stays fixed across the synthetic rejection sweep.

| LED | Desired green on-state nW | Blue optical on-state nW | Blue MC SE nW | Amplitude bias % | Error-inclusive SINR dB |
|---|---:|---:|---:|---:|---:|
| NE | 0.65060 | 0.02423 | 0.00423 | 2.781 | 31.12 |
| NW | 0.55182 | 0.01634 | 0.00647 | 2.626 | 31.61 |
| SW | 0.70940 | 0.02934 | 0.00515 | 3.283 | 29.67 |
| SE | 0.83776 | 0.03769 | 0.00292 | 3.521 | 29.07 |

All four frequency signals use 4 kHz sampling, two seconds and 25% duty. The default assumes R470/R520=0.8 and R520=0.3 A/W; these are not measured detector specifications. Plots use green-equivalent nW, not measured current or voltage. Ambient is 0.15 nW DC plus a 0.05 nW cosine at 100.3 Hz, phase 0.4 rad. Independent photoelectron counts obey Poisson statistics at the total fluorescence + leakage + ambient rate; electronic white noise has 0.005 nW per-sample RMS. The gate is held at its point-sampled state during each 250 µs bin; true PWM-edge overlap, TIA bandwidth, ADC response, dark current and jitter are omitted.

The ideal comparator removes parasitic excitation, ambient and both noise sources while preserving the same green trajectory. The residual therefore is not “all reflected light.” Default waveform RMSE is 0.17631 nW; DC residual 0.17155 nW; AC residual RMS 0.04067 nW; waveform AC SINR 23.40 dB. Default shot/electronic RMS are 0.001358/0.005010 nW. Joint sine/cosine least squares gives complex C; error-inclusive SINR is 20log10(|Cideal|/|Creceived−Cideal|). Noise-only SNR instead uses repeat-to-repeat fluctuations and excludes systematic bias.

The synthetic sweep has 144 scenarios × 32 repetitions: OD∞/3/4/5, four ambient cases, electronic RMS 0/5/20 pW and responsivity ratios 0.6/0.8/1.0. Its 18,432 channel records and 576 aggregated rows are saved in interference_sweep*.csv. MC means are held fixed, so these repeated seeds do not propagate MC or biological uncertainty. Same-frequency ambient remains even with ideal excitation rejection; a high noise-only SNR can coexist with biased amplitude.

The 20-second MP4/GIF uses 200 common timestamps at 10 fps and 100× slow playback. Every panel starts at sample zero. Cursor, trace endpoint, LED state and path gating share the same sample index. Only actual NE sampled paths are drawn; no mirrored paths are presented as other LEDs' trajectories. The PD active-center cross marks the provisional offset (0,−0.4) mm. Paths switch together, without fabricated travel delays. This does not simulate calcium dynamics or validate hardware timing. Detailed methods, results, axes, legends and limitations for all ten figures and the movie are in Figure_Guide_EN.md and figure_notes/.

## Is the intensity sufficient?

Nonzero collection is established in the model; odor detection is not. The relevant quantity is ΔF relative to measured noise. `conditional_photon_budget.csv` varies LED-on power 0.05–2 mW,QY 0.1–1,andΔF/F 1–50%, including the 25% duty fundamental factor.

At 500 µW,QY 0.6,andΔF/F 10%, predicted lock-in amplitude change is **16.03 pW**. If SNR≥5 is chosen as an engineering target, repeated lock-in amplitude RMS noise must be below **3.21 pW equivalent input power**. This is not a per-ADC-sample noise limit. Without measured responsivity, gain, filtering, baseline drift and GCaMP expression, it is not a defensible detection limit.

## Minimal two-week validation

1. **Dark and empty-well background:** collect ten 2 s blocks at identical settings; check saturation/timing errors and each channel's mean/SD.
2. **One standard well, four readouts:** put the same fluorescent standard in one well and matched blank in the others; repeat for all wells to obtain the measured 4×4 matrix for that standard. Compare normalized ratios before claiming absolute nW agreement. Preserve raw and blank-subtracted I/Q. Uniform liquid standards should be compared with the volume-source model below, not used directly for cell-layer unmixing.
3. **Three reseatings:** repeat removal/reassembly at fixed concentration, volume and settings. Record channel means andCV. CV≤10% and standard-vs-blank SNR≥5 can be initial internal targets; they are not achieved results, official iGEM requirements or clinical standards.

Large synchronous blanks require filtering/light-leak correction, not normalization that conceals faults. Poor reseating repeatability requires a mechanical fix. Proceed to cells after these inexpensive checks. A fluorescent flat film image is an optional spatial-uniformity validation, not a required extra experiment under the two-week schedule.

## Forward model for the liquid-standard experiment

A homogeneous fluorescent liquid emits throughout its volume, unlike the 20 µm floor cell layer. An additional four LED×three-seed weak-absorption volume model uses 100 µL and 0.001/mm excitation absorption, transporting another 1,008,000 packets. Row-normalized source-well fractions are:

| Active LED /standard well | NE | NW | SW | SE |
|---|---:|---:|---:|---:|
| NE | 80.6% | 14.2% | 0.0% | 5.2% |
| NW | 12.5% | 86.8% | 0.8% | 0.0% |
| SW | 0.0% | 0.5% | 86.7% | 12.8% |
| SE | 4.9% | 0.0% | 12.6% | 82.5% |

This is a comparison for the same simple standard-liquid test, not an additional required experiment. With unknown dye concentration, spectrum, quantum yield and LED power, compare direction and normalized ratios first, not absolute power. Actual floor-cell unmixing requires a localized bottom standard or independent calibration under cell conditions. Do not substitute a liquid-standard matrix for the cell-layer matrix.

## Figures and reproducibility

| File | Caption |
|---|---|
| 01_parameter_sweep.png | Conditional received green power for 24 optical cases. Bars are means and error bars are one Monte Carlo standard error across three seeds; they are not confidence intervals for device performance. |
| 02_floor_maps.png | A: upward excitation power transmitted across the resin–liquid floor under NE illumination. B: isotropic point-source power reaching the PD. Each row shares one color scale across all four wells. |
| 03_well_transfer.png | Received green power resolved by active LED and the well where fluorescence originated, for the ideal-material bottom-cell-layer model. |
| 04_detector_angles.png | Cumulative NE green power admitted by artificial detector acceptance cones. Points are three-seed means with ±1 SE. |
| 05_frequency_recovery.png | A: ideal noise-free received fluorescence. B: conditional received signal including MC excitation leakage and assumed ambient, photoelectron shot noise and electronics noise. C: overlay. D: received minus ideal. |
| 06_conditional_budget.png | Maximum lock-in amplitude RMS noise compatible with an engineering SNR target of five, for the stated optical model and quantum yield 0.6. |
| 07_sample_paths.png | A cutaway rendering of actual sampled NE excitation and fluorescence trajectories. Selected detected fluorescence paths are emphasized; line density is not optical intensity. |
| 08_volume_standard_validation.png | Row-normalized source-well contributions for a weakly absorbing uniform fluorescent liquid, distinct from a bottom cell layer. |
| 09_interference_metrics.png | A: ideal/received amplitude spectra. B: signed amplitude bias and complex relative error after joint four-frequency demodulation. C: signal-to-error ratio including systematic contamination and random noise. |
| 10_interference_sweep.png | A/B summarize worst-channel complex error and lowest-channel median SINR at electronic RMS 5 pW/sample and assumed responsivity ratio 0.8. C varies electronic noise; all panels also include assumed photoelectron shot noise. |

Detailed per-figure methods and reading instructions: [Figure_Guide_EN.md](Figure_Guide_EN.md).
