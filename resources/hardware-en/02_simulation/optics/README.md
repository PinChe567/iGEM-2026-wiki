# Optical transport and detector-filter comparison

The current comparison has four cases: no filter, one LEE 101 layer, two LEE 101 layers, and one Edmund #29-190 500 nm OD4 longpass scenario. The calculations are conditional models, not measurements of the PCB or cells.

Open [the four-case signal movie](../../../../hardware%20information/AeroSense%20v2/02_simulation/optics/videos/filter_signal_comparison.mp4). It shows received current, filtered ideal current, raw residual, and a magnified corrected residual. The [optical-path movie](../../../../hardware%20information/AeroSense%20v2/02_simulation/optics/videos/optical_slow_motion.mp4) explains the earlier geometry and modulation model. Its fixed-OD assumptions differ from the current comparison.

## Files and reproduction

- `code/` contains Python sources and requirements.
- `code/data/` contains the necessary MC records, source metadata, summary JSON, saved NPZ fields and video alignment records. Keep these files with the code.
- `results/` contains spectral inputs and tabular results as CSV. Use `filter_comparison_*` for the current comparison. Earlier fixed-OD frequency/noise sensitivity CSVs support the original path movie and conditional photon-budget study; they do not compare commercial filters.
- `figures/` contains seven geometry/collection figures and three current filter figures.
- `videos/` contains two MP4 files. Duplicate GIF, PDF, HTML and QA images are omitted.

From this folder, rebuild figures and the current spectral/noise model from saved MC data:

```text
python -m pip install -r code/requirements.txt
python -B code/run.py --plots
python -B code/filter_compare_model.py
python -B code/validate_filter_comparison.py
```

The last command also checks the supplied current movie. If the source-only package has no movie, first run `python -B code/filter_compare_model.py --video`.

To regenerate either movie:

```text
python -B code/filter_compare_model.py --video
python -B code/run.py --plots --video
```

Imageio-ffmpeg supplies the encoder. An explicit `--ffmpeg PATH` is also accepted by `run.py`. Scripts write within the existing model layout. They do not generate duplicate reports, interactive HTML, GIFs or preview screenshots.

Full MC regeneration is expensive. Run it only when the physical assumptions change or an independent replay is needed:

```text
python -B code/run.py --verify --run --maps --convergence --standard --workers 4
python -B code/leakage_sweep.py --workers 4
python -B code/signal_model.py
python -B code/filter_compare_model.py --geometry --video
```

The solvers use analytic geometry defined in `transport.py`. No STL, CAD software or external CAD folder is required at runtime. `geometry_provenance.json` records the historical CAD comparison. Geometry changes require an explicit update to the model.

## Current four-case result

Each percentage below is relative to the unfiltered spectrum. Integration uses the wavelength-dependent typical PD response. The green spectrum is an assumed GCaMP-like shape, not measured total GCaMP6f emission.

| Case | LED optical power left | LED photocurrent left | Green photocurrent left | T at 520 nm |
|---|---:|---:|---:|---:|
| No filter | 100% | 100% | 100% | 100% |
| LEE 101 ×1 | 2.772% | 2.987% | 70.426% | 67.840% |
| LEE 101 ×2 | 0.367% | 0.410% | 51.273% | 46.023% |
| 500 nm OD4 ×1, constructed scenario | 0.165% | 0.194% | 82.745% | 90.000% |

One LEE layer loses about 30% of the proxy green current. Two layers lose about 49%. The second layer reduces the remaining blue current by about 86%. It also reduces the remaining green current by about 27%. Place the filter across the complete PD collection opening. Do not place it between the LED and the sample: that would suppress excitation. Prevent edge leakage. These calculations assume complete coverage and normal-incidence scalar transmission.

The longpass result is a **scenario**, not a prediction guaranteed by the manufacturer's band averages. Its assumed curve transmits 0.01% through 482.7 nm. It rises logarithmically to 50% at 500 nm, then linearly to 90% at 517.7 nm. A 90% plateau follows. Cut-on, transition shape, blocking and plateau sensitivity produce 0.0104–9.36% remaining LED current and 71.8–90.3% remaining proxy green current. These ranges are scenario sensitivity, not confidence intervals or guaranteed bounds.

| Case | Raw peak current, nA | Worst raw complex bias / green | Ideal stable-blank corrected error | Worst analytic SNR for 1% change |
|---|---:|---:|---:|---:|
| No filter | 104.363 | 11210.32% | 0.1341% | 9.095 |
| LEE 101 ×1 | 4.087 | 475.46% | 0.0704% | 16.143 |
| LEE 101 ×2 | 1.220 | 89.55% | 0.0849% | 12.765 |
| OD4 scenario | 1.344 | 26.20% | 0.0534% | 20.537 |

The last two columns assume perfectly repeatable blank leakage and the stated noise model. They do not demonstrate hardware SNR. In this scenario, one LEE layer gives better noise-only SNR than two layers. Two layers reduce sensitivity to changing blue leakage. Measure both effects before choosing a filter. The OD4 scenario gives a favorable tradeoff, but requires a measured transmission curve and a physical test.

## Blue leakage, noise and blank correction

The raw PD signal includes blue LED leakage, useful green fluorescence, ambient light, dark current, photon shot noise and electronic noise. Useful reflected green light remains in the ideal signal. Reflected blue light remains interference.

The LED and the fluorescence share the same modulation frequency. DLIA cannot distinguish them by frequency alone. Blank subtraction removes only the reproducible complex offset. It cannot remove shot noise or prevent TIA/ADC saturation. No TIA transfer function, ADC range, analog bandwidth or clipping is modeled here.

The model uses a 4 kHz sample rate and a 2 s record. PWM duty is 25%. Frequencies are NE 89, NW 113, SW 41 and SE 67 Hz. Each case uses the same physical parameters and seed 20261011. Electronic draws are shared for a fair comparison. Photoelectron rates differ after filtering. Poisson draws use the same seed, not identical counts.

Ambient light is an assumed uniform 500–650 nm spectrum: 0.15 nW DC plus a 0.05 nW, 100.3 Hz component with phase 0.4 rad. Dark current is assumed to be 0.2 nA. Electronic noise is assumed to be 1.5 pA RMS per readout sample. These are not measurements of this PCB. Poisson counts use a discrete sample-hold approximation. The saved noise sensitivity CSV varies electronic noise explicitly.

Five independent 2 s blank records are averaged. The sample and blank have exactly the same deterministic blue leakage in the nominal case. The complex fit uses four sine/cosine fundamentals and a DC term. The corrected AC reconstruction includes only the four fundamentals. It excludes DC and PWM harmonics. It is an offline fit to the full record, not an online causal estimator.

Definitions:

- **Unfiltered ideal:** useful green current before a detector filter.
- **Filtered ideal:** useful green current after that filter, without contamination.
- **Raw residual:** received current minus filtered ideal current.
- **Corrected residual:** blank-corrected four-fundamental reconstruction minus the filtered-ideal four-fundamental reconstruction. Its pA scale is different from the raw residual scale.

Even small blank-to-sample blue gain drift can dominate a small fluorescence change. The following is a deterministic sensitivity calculation. It changes only the fitted blue vector; ambient and DC offsets are excluded.

| Blue gain drift | No filter | LEE ×1 | LEE ×2 | OD4 scenario |
|---|---:|---:|---:|---:|
| 0.01% | 1.1210% | 0.04755% | 0.008963% | 0.002625% |
| 0.1% | 11.2105% | 0.47553% | 0.08963% | 0.02625% |

Table entries are worst-channel residual bias relative to the filtered green baseline. A quiet nominal blank therefore does not establish reliable unfiltered operation. Record LED-off dark, cell-free medium with LEDs on, and a fluorescent standard. Repeat the blank after filter changes, movement, gain changes and temperature drift. Check raw headroom before relying on corrected values.

## Optical transport method and uncertainty

The geometry model is a rectangular approximation of the opaque carrier and clear flat wells. It uses Fresnel reflection/refraction, absorption, optional scattering, a black-wall model and an equal-area PD proxy. It is not a surface-mesh ray trace. It omits real surface roughness, scratches, print gaps, filter angle effects, polarization, filter back-reflection and mounting tolerances.

The original sensitivity study has 24 cases and three seeds per case. The additional rejection study has 12 cases: four LEDs at OD3/4/5. The current comparison uses four independent unfiltered LED transport cases, each with three seeds. Each seed launches 24,000 excitation and 60,000 emission packets. The current unfiltered geometry run therefore has 1,008,000 primary packets.

Baseline assumptions are 500 µW LED radiant power, 100 µL liquid, a 20 µm floor fluorescent layer, absorption coefficient 0.5/mm and quantum yield 1. These values set a conditional scale. They are not inferred cell expression or measured GCaMP6f brightness. Post-process filtering uses the same frozen geometry gains for every case.

| Active LED | Unfiltered green power, nW ± SE | Unfiltered blue power, nW ± SE |
|---|---:|---:|
| NE | 0.7848 ± 0.0723 | 110.49 ± 13.81 |
| NW | 0.6559 ± 0.0685 | 62.26 ± 23.85 |
| SW | 0.8228 ± 0.0501 | 123.77 ± 20.89 |
| SE | 0.9558 ± 0.0772 | 124.20 ± 12.03 |

SE is between-seed Monte Carlo uncertainty. It does not cover uncertain materials, brightness or manufacturing. The 64 repeated noise realizations check the analytic complex RMS. Geometry uncertainty and noise uncertainty are separate.

The [volume-standard matrix](../../../../hardware%20information/AeroSense%20v2/02_simulation/optics/results/volume_standard_LED_by_well_fraction.csv) and [its summary](../../../../hardware%20information/AeroSense%20v2/02_simulation/optics/code/data/volume_standard_summary.json) use uniform fluorescent liquid. The cell model uses a thin floor layer. A fluorescein sodium test therefore cannot be interpreted as the same spatial calibration as adherent GCaMP cells. The 100 µL liquid volume is a model reference, not a validated working volume or leakage limit.

## Figures and movies

| File | What it shows and how to read it |
|---|---|
| [01](../../../../hardware%20information/AeroSense%20v2/02_simulation/optics/figures/01_parameter_sweep.png) | 24-case received green power. Bars are means; whiskers are one between-seed SE. |
| [02](../../../../hardware%20information/AeroSense%20v2/02_simulation/optics/figures/02_floor_maps.png) | NE-LED floor irradiance in µW/mm² and collection probability in percent. The two panels have separate color scales. |
| [03](../../../../hardware%20information/AeroSense%20v2/02_simulation/optics/figures/03_well_transfer.png) | Active LED by floor source well. Values are conditional received green nW. Crosstalk is retained. |
| [04](../../../../hardware%20information/AeroSense%20v2/02_simulation/optics/figures/04_detector_angles.png) | Cumulative green power versus detector acceptance half-angle. This is not a measured angular response. |
| [06](../../../../hardware%20information/AeroSense%20v2/02_simulation/optics/figures/06_conditional_budget.png) | Earlier conditional power/noise threshold. Assumed electronic noise is not a board specification. |
| [07](../../../../hardware%20information/AeroSense%20v2/02_simulation/optics/figures/07_sample_paths.png) | Actual sampled NE trajectories. This is an illustrative subset, not a measured path distribution. |
| [08](../../../../hardware%20information/AeroSense%20v2/02_simulation/optics/figures/08_volume_standard_validation.png) | Row-normalized uniform-volume fluorescence transfer. Compare with the floor-layer matrix. |
| [12](../../../../hardware%20information/AeroSense%20v2/02_simulation/optics/figures/12_filter_spectral_comparison.png) | Assumed spectra, transmission and PD-weighted retained current for four cases. |
| [13](../../../../hardware%20information/AeroSense%20v2/02_simulation/optics/figures/13_filter_waveform_comparison.png) | Raw/ideal signals, raw residual, corrected AC and corrected residual. Read each axis scale. |
| [14](../../../../hardware%20information/AeroSense%20v2/02_simulation/optics/figures/14_filter_residual_and_drift.png) | Corrected residual at pA scale and hypothetical blue gain drift sensitivity. |

Both movies have 200 frames at 10 fps and last 20 s. They display physical time 0–199 ms at 100× slow playback. Every panel uses sample index `4 × frame`. Traces reveal history only. The corrected fit uses the full 2 s record. No physical photon flight delay is represented. The original movie draws only sampled NE paths; it does not mirror paths into other wells. Its older fixed-OD noise assumptions are retained for provenance.

## Primary sources

- [LEE 101 Yellow](https://leefilters.com/colour/101-yellow/): official 5 nm transmission values are preserved in `results/lee101_official_spectrum.csv`. T470=0.797%, T515=63.264% and T520=67.840%.
- [Edmund Optics #29-190](https://www.edmundoptics.com/p/500nm-125mm-ultra-thin-od4-longpass-filter/53064/): flexible Everix polymer/dye filter, not glass. Diameter 12.45 ± 0.15 mm; thickness 0.30 mm; clear aperture 90%. Average OD ≥4 over 420.8–482.7 nm. Cut-on 500 ±10 nm. Average T >85% over 517.7–1100 nm. These averages do not guarantee each wavelength, including the LED tail. No product-specific pointwise curve was available.
- [Würth 155124BS73200](https://www.we-online.com/components/products/datasheet/155124BS73200.pdf): a Gaussian with typical peak 468 nm and assumed 25 nm FWHM approximates the LED. This is not a measured device spectrum.
- [Vishay VEMD5060X01](https://www.vishay.com/docs/84278/vemd5060x01.pdf): Fig. 6, revision 1.2, 17-Mar-2025 supplies a typical relative response. The digitized vector curve is normalized to R950=0.346667 A/W from the stated typical test response and 7.5 mm² area. Approximate R470=0.247 and R520=0.320 A/W. The manufacturer PDF is not bundled. To repeat extraction, pass that local PDF to `python -B code/extract_pd_response.py --pdf PATH`. Expected SHA256: `e0b196d66d096e951f371e45ac26e4fe9cbc40c9236933add2cec037c040cd28`.

The optional PDF extraction also requires PyMuPDF. The normal saved-CSV reproduction does not require it.

The green proxy has a 515 nm mode and half-Gaussian widths of 10 and 25 nm. It is a sensitivity assumption, not an official measured GCaMP6f spectrum. Source metadata and constructed longpass parameters are in `code/data/filter_comparison_sources.json`.

