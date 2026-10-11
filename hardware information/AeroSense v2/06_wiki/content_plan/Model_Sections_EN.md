# Model: connecting transport, measurement and decoding

<a id="physical-models"></a>
## Different models answer different questions

The physical models ask whether the proposed geometry transports gas to the sample interface and carries fluorescence to a finite detector, and how those signals may be distorted. The existing PN–KC–MBON SNN page asks a different question using KT Batch 1–3 metal-oxide recordings. Its reported macro-F1 of 0.868 at seed 100 is a pooled random-split benchmark; it is not a measurement from AeroSense cells, a drift-robustness result, or a result reproduced by the physical-model package. Its missing training/configuration/report artifacts remain a separate release gap.

<a id="optical-transport"></a>
## Optical transport: where excitation and fluorescence can go

The model includes four LED-referenced wells, a finite detector with a provisional offset center, a finite filter, opaque shielding and specified material interfaces. Excitation and fluorescence packets are scored separately. Ideal transparent resin removes the purple-resin concern from this first calculation; it does not remove Fresnel reflection or create a measured material specification. The reference cell layer is 20 µm thick at the liquid floor, with assumed excitation absorption 0.5 mm⁻¹ and quantum yield 1. LED-on power is 500 µW; the nominal wavelengths are 470 and 520 nm.

The original 24 conditions used three seeds with 24,000 excitation and 60,000 fluorescence packets per seed. Separate maps used 600,000 excitation packets and 224 isotropic-source positions with 65,536 packets each. Ledger and event-limit checks test numerical behavior under those assumptions. Seed SE does not include uncertainty in actual LED output, PD aperture/orientation, filter angular response, resin optics or cellular expression.

The NE reference yielded 0.593 ± 0.035 nW of collected green light. Floor illumination remained nonuniform (NE CV about 46.2%), and intended-well contributions were approximately 88.6–90.9% across LED rows. We therefore retain flat wells for fabrication while requiring measured illumination and mixing calibration. The photon budget is a parameter study, not evidence that an arbitrary GCaMP response is large enough for the real electronics.

See [optical methods/results](../../02_simulation/optics/Analysis_EN.md), [figure explanations](../../02_simulation/optics/Figure_Guide_EN.md) and the corresponding [hardware decision](Hardware_Sections_EN.md#hardware-optics). Uniform fluorescent-liquid validation uses a separate volume-source model; matching a dye solution does not validate the thin cell-layer assumption.

<a id="detector-interference"></a>
## Frequency separation does not remove all interference

Additional per-LED OD3/4/5 runs used 12 conditions and three seeds each, adding 3,024,000 packets. Each LED has its own leakage estimate. The desired trace retains all modeled green fluorescence, including useful reflected fluorescence and existing well mixing. The conditional received trace adds MC excitation leakage, assumed ambient light, Poisson photoelectron noise and electronic noise. The default responsivities, ambient modulation and noise level are declared assumptions; output is green-equivalent nW, not measured current or voltage.

The four views are ideal, conditional received, overlay and residual. At the default scenario, amplitude bias after joint four-frequency demodulation spans 2.63–3.52% and waveform AC SINR is 23.40 dB. The 144-scenario sweep uses 32 noise repetitions per condition and varies excitation rejection, ambient behavior, electronic noise and spectral responsivity ratio. Better excitation rejection reduces its modeled leakage term; ambient light coherent with a measurement frequency can still bias that channel. A visible frequency peak is not proof of clean fluorescence.

The synchronized video uses one sample clock from its first frame. It shows actual NE sampled trajectories only, with four LED state indicators; it does not mirror paths around the offset PD or invent a slow photon-flight delay. Its 20-second playback represents 0.2 seconds of modulation at 100× slow motion. Numerical checks and fixed seeds reproduce the plots; they do not establish actual PCB timing or noise. See [signal assumptions and files](../../02_simulation/optics/README_EN.md).

<a id="gas-and-liquid-transport"></a>
## Gas delivery to the liquid interface

Low-Reynolds-number gas CFD compares the same enclosure using directional momentum, local speed, pressure and distribution metrics. The selected integral shelf improves the chosen directional-flow metric while worsening circulation symmetry; some perforated candidates lower momentum further but add geometric, cleaning and mesh-resolution tradeoffs. No case is labeled turbulent or biologically protective.

Advection–diffusion then asks when gas concentration reaches the region near the liquid. These molecules are not the velocity tracers in the flow movie. Under the stated 1 mL/min baseline and gas diffusivity assumptions, t90 is about 150 seconds. The operating-point sweep holds STL geometry fixed and varies flow and gas diffusivity. A provisional 60-second target is an engineering comparison objective, not a biological threshold. Report the chosen sampled operating point, worst-well/worst-diffusivity t90, pressure and Reynolds checks together, rather than choosing the fastest attractive movie.

The original five flow levels were followed by a declared bracket refinement at 2.5 and 3 mL/min, giving 21 solved Q×D conditions. Gas diffusivity 5/10/20 mm²/s is an uncertain material assumption, not an operator setting. The nominal comparison selects 3 mL/min: worst gas t90 50.0 s, near-liquid gas P95 speed 0.00280 mm/s, port Reynolds number 1.77 and chamber-only pressure drop 0.0274 Pa. The targets were worst t90 ≤60 s, port Re ≤3 and P95 speed ≤0.01 mm/s; the speed cap is not a cell-injury threshold. The 2.5 mL/min case at about 60.04 s is borderline within modeling uncertainty. Selected-point mesh/timestep results must accompany this conditional choice; it is neither an interpolated/global optimum nor an allowance for filter and tubing pressure losses.

Protein-assisted uptake remains a separate hypothesis. The gas model does not determine binding, liquid transport, receptor activation or GCaMP kinetics. The appendix's liquid/PDMS screening calculations intentionally include a no-protein/no-mixing boundary case; its long bottom-delivery time is not presented as the actual cell response. It identifies an assumption that a proposed uptake mechanism must eventually test. PDMS has not been added to the selected hardware or mandatory BOM.

See [gas methods](../../02_simulation/airflow/Airflow_Analysis_EN.md), [operating-point record](../../02_simulation/airflow/operating_sweep_summary.json), [detailed liquid/membrane boundary cases](../../02_simulation/membrane/Analysis_EN.md) and the [hardware implementation](Hardware_Sections_EN.md#hardware-gas).

<a id="model-to-build"></a>
## What the models changed

| Engineering question | Evidence | Decision | Remaining independent test |
|---|---|---|---|
| Can the finite PD collect modeled well fluorescence? | MC geometry and acceptance maps | Retain the current optical carrier as a test candidate; preserve filter and PD registration | Blank, standard and detector/filter characterization |
| Are four frequency tags four independent wells? | Nonzero modeled off-diagonal well contributions | Measure and store a mixing matrix; retain complex channel data | One fluorescent source well at a time |
| Does lock-in remove reflected excitation? | Per-LED leakage and synthetic complex-channel bias | Use spectral rejection and matched blank correction; do not rely on frequency tagging alone | Real LED-synchronous background and noise |
| Can gas direction change without another print? | Shelf/open comparison with distribution tradeoff | Keep the integrated shelf and eight operating prints | Actual flow, pressure and interface delivery |
| Which flow gives a useful interface wash-in? | Fixed-CAD Q×D sweep | Choose a declared sampled candidate, not a universal optimum | Actual gas concentration history and flow control |
| Does an uptake protein make cell delivery fast? | No target-specific transport/binding evidence supplied | Keep it as a separately labeled hypothesis | Identify the protein/ligand and measure uptake/release |

<a id="molecular-hypotheses"></a>
## Docking and capture proteins: exploratory scope

No project docking inputs, run logs, scores or poses were found in the inspected local release or the public repository tree at the recorded commit. “OBP” is not a unique protein identity. Species, gene/accession, sequence, structure, construct and target ligand must be specified before a reproducible claim can be made. Docking can generate candidate poses or rankings under one scoring model; it does not measure affinity, demonstrate receptor activation, or prove delivery to cells. Proposed capture could change both uptake and release, so a lower docking score alone does not select the best interface.

The [docking/OBP evidence note](Docking_OBP_Evidence_EN.md) defines the missing records and a bounded publication route. Until those records exist, this section is a hypothesis and should not be graphed as a completed result.


## Delivery reference and physical comparison

[Vergara et al.2012](../../08_reference/Gas_Delivery_Reference_EN.md) motivates controlled gas delivery and batch/time records; it does not supply a validated AeroSense flow setting. [The standard test](../../07_validation/Fluorescence_and_Cell_Test_EN.md) compares relative channel proportions against the uniform-volume optical model, not an absolute-power calibration or gas t90. Cell comparison is a separate later test; retain a common time window and faster reference data rather than shifting curves until they agree.
