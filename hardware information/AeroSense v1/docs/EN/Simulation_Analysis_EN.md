# AeroSense engineering analysis

This report separates CAD, physical assumptions, numerical solutions and experimental evidence. Completed: flat-well STLs,24 photon-transport conditions,27 perforated-plate CFD cases plus no-plate control, spatial optical/acceptance maps,48 synthetic DLIA tests, phone UI and compiled ESP32 source. Pending: actual PCB operation, physical fit, sealing, resin/cell compatibility and odor-classification performance.

![assembly_exploded.png](../../results/images/assembly_exploded.png)

Conclusion: the PCB provides four LED gates and one16-bit ADC path for a four-frequency system. Adequate optical throughput, viable cells and independent well recovery still require experiments. Low part count and appearance do not substitute for validation.

# Geometry, optical center and tolerance

![optical_registration.png](../../results/images/optical_registration.png)

Wells register to the corresponding LED X coordinates and preserve clearance from dense components, rather than forming four equal round wells about the PD package center. Both well floors are planar with0.5 mm thickness and150 uL nominal fill. Flatness controls thickness but does not remove angular illumination, reflection or cell-distribution nonuniformity.

The Vishay drawing establishes a0.4 mm long-axis offset; the world sign depends on bottom-view mirroring and placement rotation. Main model:(0,-0.4), with(0,0),(0,+0.4), andX±0.2 sweeps. A3 x2.5 mm equal-area sensitive rectangle is used; the external3 x3 mm window is not assumed to be the active die. The nominal filter seat covers it, while gasket clipping needs measurement.

Four quadrants do not imply exactly90-degree spacing of well-center vectors, nor a fixed90-degree angle for every LED-cell-PD ray. Side excitation/downward collection is the design intent; the MC uses angular distributions.

# Optical method and correspondence to the paper

The plots follow Burton et al. Fig.2 I/J concepts, but that halo cannot be copied as this device result. Their miniature LED/PD, filter, dye solution and dimensions differ. This model uses millimeter resin wells and a20 um floor-cell layer.

η(r) is received power divided by power emitted by an isotropic point source, not peak normalization. Φ is weighted track-length per voxel volume, a scalar fluence rate in uW/mm2. J=Φ_em xη is the paper-style comparison. Source-position contribution uses q_em xη integrated over volume; these are different quantities and units.

Transport includes Beer-Lambert absorption, Henyey-Greenstein scattering, Fresnel refraction/reflection/TIR, diffuse opaque-wall reflection and two-stage fluorescence. Assumptions:470/520 nm,500 uW LED,QY1, cell absorption0.5/mm and20 um cell layer; emitted power includes470/520. Resin n1.5, liquid n1.333. The1 mm absorbing filter proxy is not a measured multilayer angular response.

Geometry is rectilinear CSG corresponding to CAD, not arbitrary STL triangle tracing. Upper cap holes use equal-area squares. Lens shape, roughness, resin autofluorescence, spectra, cell expression, PD spectral responsivity and electronic noise are not included in transport predictions.

# Spatial acceptance and fluence results

![paper_I_J_correspondence.png](../../results/images/paper_I_J_correspondence.png)

247 liquid source positions x32,768 packets =8,093,696 packets. Maximum η=1.398%; median relative SE=11.3%;3 points exceed25%. No peak normalization. Maximum J=0.000503 uW/mm2. Gray/dark areas are outside the liquid-source domain, not uncomputed values filled with zero.

Spatial fluence uses3 seeds, each40,000 excitation and100,000 emission packets. Received green power in this calculation is0.657 +/-0.058 nW (mean +/- MC SE). This is conditional power, not a measurement or biological prediction interval.

# 24 optical parameter conditions

![optical_parameter_sweep.png](../../results/images/optical_parameter_sweep.png)

Each condition has3 seeds x(16,000 excitation+40,000 emission) packets:4,032,000 total. Factors cover detector offsets, resin absorption/scatter, liquid scatter, wall reflection, filter OD/transmission,75/150/200 uL, emitter offsets and all LEDs. Per-seed ledgers, CSV, SE and plotting code are supplied.

Detector reversal materially changes the result; arbitrary centering is inappropriate. Some weak-absorption/small-offset differences are below MC precision and should not be ranked. More scattering may increase collection and crosstalk in this geometry, not justify deliberately cloudy resin. Zero sampled crosstalk is not proof of physical isolation.

# Is the signal sufficient?

Sweep baseline:0.678 +/-0.092 nW; centered proxy0.898 +/-0.049 nW; reversed offset1.068 +/-0.069 nW. These compare sensitivity under common assumptions and do not establish actual placement orientation.

Scale example only: assuming responsivity0.3 A/W at520 nm,0.678 nW gives about0.203 nA and20.3 mV at ideal100 Mohm transimpedance. A2.5 V16-bit ADC LSB is38.15 uV. Unknown GCaMP quantity, QY, background, angular response and TIA noise may dominate; sufficient SNR or detection limit is not established.

Maximum sweep energy-ledger error is about4.44e-15: numerical accounting, not material validation. Tests include rectangular solid-angle acceptance, normal Fresnel0.04, TIR, HG mean angle, Beer-Lambert and homogeneous track length. Three-seed SE is limited; small differences require more seeds and paired analysis, not merely smooth plotting.

Simulated LED-by-well matrix condition number is about1.35, but it is not a hardware calibration matrix. Simulation row order isNE/NW/SW/SE; provisional firmwareD1/D2/D3/D4 mapsSW/SE/NE/NW. Measured M must include frequency gain/phase under matched cells, fill and optics.

# 27-condition airflow sweep

![CFD_full_factorial.png](../../results/images/CFD_full_factorial.png)

Diameter1.6/2.0/2.4 mm x4/6/12 holes x1.5/3/4.5 mm inlet-axis standoff gives27 full-factorial3-D CFD cases plus no-plate control on a common0.4 mm grid. Changing inlet height also changes upper-plenum volume; effects are not solely due to distance.

All28 cases meet the declared iteration criteria; maximum terminal mass imbalance is0.117%. Lowest plate-case mean well-headspace speed isgap_4p5:0.001316 mm/s at1 mL/min, versus0.00080951 without a plate. Every plate case is higher. This does not support a claim that the plate necessarily protects cells.

# CFD method, videos and limitations

![airflow_base_060.png](../../results/images/airflow_base_060.png)

D3Q19 BGK lattice-Boltzmann,τ0.8, air density1.2 kg/m3 and viscosity1.8e-5 Pa s. No-slip solid/stationary-liquid boundaries and nonequilibrium-extrapolation pressure planes. The solver uses density difference0.001 at lowRe. Results at1 mL/min or0.01 Pa use Stokes scaling, not new nonlinear solves at those conditions.

Check every200 steps; require relative velocity change<2e-5 and terminal mass imbalance<0.2% for3 checks. Baseline pressure changes over0.4→0.3→0.2 mm are nonmonotonic (about-7.8%,+9.1%), with local velocity changes. Mesh independence is not established. Poiseuille and NumPy/C# comparisons are reproducible but do not eliminate voxelized circular-wall errors.

MP4s advect passive markers through saved steady fields:60 s physical time in10 s video, Y projection, nearest-voxel velocity and stopping at solids. No diffusion, liquid flow, odor dissolution, evaporation, oxygen transfer, cell shear or growth is solved. Videos do not establish cell safety, receptor exposure or a transfer time constant.

# Electronics and DLIA numerical checks

![DLIA_sweep.png](../../results/images/DLIA_sweep.png)

LED1-4 gates areGPIO25/26/27/32; ADC SCLK18,DOUT19,CONVST33. Firmware uses one4 kHz hardware timebase for integer DDS gates and the sampling task, avoiding frequency overwrites from shared LEDC timers. A2 s I/Q window has8000 samples; ADC wait10 us, SPI2 MHz.

48 synthetic cases sweep0.5/1/2/4 s windows,0.1/1/10 mV noise and0/1/10/50 us timestamp perturbation. Maximum offline joint-LS relative amplitude error is5.82%, not board accuracy. At25% duty, simulated DDS cross-frequency leakage reaches0.71%; calibration is still required, not ideal orthogonality.

The simplified100 Mohm x2.2 pF feedback pole is about723 Hz. Operating below it does not establish closed-loop stability or accuracy. Measure detector capacitance, parasitics, leakage, resistor voltage coefficient, ADC drive and Wi-Fi interference. An enclosure or firmware cannot compensate for a poor high-impedance TIA layout.

# Cost, iGEM evidence and publication boundaries

Estimated consumed resin for8 parts:TWD713.99; core hardware/fan269.70–452.70; quoted/allowed gas-optical portion140–390. Filter, two gas filters, coupling kit and shared equipment remain unquoted. PCB quote:TWD131,250/2 boards including design/setup; average65,625 is not a production price. Known partial device cost:66,748.69–67,181.69, not a full total.

iGEM Hardware emphasizes useful function, testing, improvement over existing tools, reproducible documentation and usability by others. This package supplies drawings, code, BOM, manuals and survey; actual functionality and user responses remain unmeasured. No separate Overgrad-specific numerical hardware scoring formula is claimed.

Suggested wiki evidence: distinguish photographs/CAD, show LED/PD registration, I/J definitions, sweeps with SE, CFD controls/mesh limits, measured raw curves, independent assembly statistics and cost gaps. Trace requirement→calculation→build→test→iteration. Label unfinished work planned, not validated.

Before publication, check source attribution, third-party datasheet rights, team code licensing and personal data. Describe reproduced methods and assumed materials in Methods. Synthetic UI/NN tests are not odor-sensing performance.

# Sources and reproducibility

Primary geometry/wiring sources: supplied NTHU_TEST_BOARD_Schematic.pdf, TOP/BOT-0911.pdf and NTHU_TEST_BOARD_BOM.docx. PCB not fabricated; no vendor-certified populated STEP. Paper/SI were read from the supplied paper collection. Datasheets/official pages below support comparisons, not vendor endorsement.

Vishay VEMD5060X01 Rev1.2, package drawing and sensitive area
https://www.vishay.com/docs/84278/vemd5060x01.pdf

Wurth155124BS73200, side-view LED
https://www.we-online.com/components/products/datasheet/155124BS73200.pdf

TI ADS8866 RevC, 3-wire CS timing
https://www.ti.com/lit/ds/symlink/ads8866.pdf

TI LMP7721, amplifier design constraints
https://www.ti.com/lit/ds/symlink/lmp7721.pdf

Burton et al., PNAS2020, wireless photometry and supplied supplementary paper
https://pmc.ncbi.nlm.nih.gov/articles/PMC7022161/

iGEM special awards, Hardware
https://competition.igem.org/judging/special-prizes

Espressif LEDC timer sharing
https://docs.espressif.com/projects/esp-idf/en/v4.4.7/esp32/api-reference/peripherals/ledc.html

ATCC HEK293T CRL-3216 cell-line reference
https://www.atcc.org/products/crl-3216

Phrozen resin documentation index
https://helpcenter.phrozen3d.com/hc/en-us/articles/6485205777561-Manuals-and-Documentations

Package includes requirements, parameter settings, fixed seeds, raw CSV/NPZ, MC ledgers, CFD residuals, plotting and video code. manifest.json records SHA-256 per delivered file. Cross-platform floating-point differences should be assessed with statistical errors and declared tolerances, not bitwise equality.
