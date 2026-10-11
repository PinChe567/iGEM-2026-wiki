# Gas delivery and drift reference

Updated 2026-10-06. [繁體中文](Gas_Delivery_Reference_ZH.md). This note supplies provenance; it changes neither saved CFD results nor printable geometry.

## Citation

Alexander Vergara, Shankar Vembu, Tuba Ayhan, Margaret A. Ryan, Margie L. Homer, Ramón Huerta. Chemical gas sensor drift compensation using classifier ensembles. *Sensors and Actuators B: Chemical*, 166–167 (2012), 320–329. ISSN 0925-4005. [DOI 10.1016/j.snb.2012.01.074](https://doi.org/10.1016/j.snb.2012.01.074). Importable citation: [references.bib](references.bib).

Sources are the user-supplied abstract, publisher DOI and author-deposited [UCI Gas Sensor Array Drift Dataset](https://archive.ics.uci.edu/dataset/224/gas%2Bsensor%2Barray%2Bdrift%2Bdataset). UCI describes 13,910 measurements from 16 chemical sensors exposed to six gases, organized across time batches. The full methods were not retrieved in this review; no unverified paper-specific flow rate, chamber volume or switching duration is quoted.

## Relevance to AeroSense

The work motivates controlled delivery and time/batch records when assessing chemical-sensor drift. Record measured flow through the complete tubing/filter assembly, sample/blank switching times, concentration provenance, temperature/humidity when measured, cell batch, optical calibration and date. Retained blanks and a fixed standard can expose changes between sessions; they do not implement or validate the paper's classifier ensemble.

AeroSense uses a shared headspace and one regulated downstream suction pump. Its 3 mL/min candidate comes from the project's fixed-CAD transport sweep. Metal-oxide sensor evidence does not validate HEK293T operation, this flow rate, approximately 50-s gas t90, cell viability or VOC uptake. Do not convert a literature sensor flow into a cell-safe rate by simple scaling.

## Suggested wiki text

“Controlled delivery and batch records support reproducible chemical sensing. Vergara et al. studied drift compensation using long-term gas-sensor measurements, motivating our retention of flow, switching and batch metadata. Our chamber operating candidate is separately derived from a fixed-geometry transport model and awaits physical measurement; this reference does not establish a safe flow for the cell system.”

Place this in Model's gas-methods section and Hardware's delivery/data-recording section. Cite the same study rather than treating these as separate evidence. Measured complex-blank DLIA correction has its own methodological sources and must not be attributed to Vergara's classifier ensemble.
