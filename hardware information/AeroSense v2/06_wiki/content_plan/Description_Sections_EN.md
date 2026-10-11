# Description: how the evidence fits together

<a id="aerosense-system-scope"></a>
## From a gas sample to an interpretable signal

AeroSense investigates whether engineered olfactory-receptor responses can support a compact biological odor-measurement platform. The proposed chain is sample gas → shared gas chamber → liquid/cell interface → OR/Orco-associated calcium response → GCaMP fluorescence → optical reader → phone-assisted analysis. Each arrow is a separate interface to characterize; a successful calculation or assay at one stage does not validate the entire chain.

The reader uses four LED excitations and one shared photodiode. Their frequencies help separate excitation channels, while optical calibration is needed to distinguish contributions from different wells. Its CAD, firmware, user interface and reproducible physical simulations are available, but the current PCB/enclosure has not undergone physical validation. [Hardware](Hardware_Sections_EN.md#hardware-status) documents the build and the small set of next tests.

<a id="aerosense-model-scope"></a>
## Models guide what to test next

Optical transport evaluates the path from source to modeled cell layer to detector. Gas transport evaluates delivery to the gas–liquid interface and helps choose a flow setting without changing the selected CAD. Proposed capture/uptake proteins remain a separate hypothesis until their identity, binding behavior and delivery effects are established. These models support engineering decisions; they do not yet establish a rapid biological response.

The fly-inspired decoder is another workstream. The existing reported benchmark uses public metal-oxide sensor data, not fluorescence measured by AeroSense. A measured receptor-response dataset, independent validation split and complete training records will be required before claiming an integrated odor classifier. [Model](Model_Sections_EN.md#physical-models) separates these evidence types and documents their assumptions.

<a id="aerosense-current-boundary"></a>
## Current claim and next step

The current contribution is an inspectable candidate reader and a reproducible way to ask where its assumptions may fail. The next step is a focused physical campaign: fit and electrical checks, blank/reference and well-mixing measurements, measured gas delivery, and an independent assembly-manual trial. We do not presently claim a validated field instrument, a food-safety decision, a sterile reusable cell cartridge or a measured detection limit. The full supporting files belong in the appendix, with the key evidence and limitations retained on the main Hardware and Model pages.
