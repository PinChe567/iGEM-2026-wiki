# AeroSense mechanical design and evidence boundaries

Design freeze: 2026-10-05. This report introduces the mechanical decisions and then includes the complete optical and airflow analyses. This is a traceable engineering-prototype package, not certification of physical fit, cell compatibility or odor recognition. The PCB has not been manufactured; no fully populated STEP model was available. A guaranteed first-print fit would therefore be an unsupported claim.


## Current operating conclusion

The eight STL files are unchanged. The fixed-geometry flow sweep selects **3 mL/min as a conditional starting point**: nominal worst gas t90=50.00 s; finer-grid check=50.98 s; half-timestep=49.85 s. This uses a provisional 60 s / 90% inlet-concentration target, not a known biological threshold. Use one externally regulated downstream pump and physically verify flow; software settings do not measure or regulate flow. The protein-assisted capture mechanism remains unvalidated.

The UI now supports measured illuminated-blank I/Q subtraction, a measured fluorescence phase reference, unsmoothed corrected export and timestamp-based display EMA. Raw data remain intact. Constant subtraction cannot remove changing same-frequency contamination or shot noise. One cell-free standard-liquid experiment tests hardware response and optical transfer; it does not establish odor sensing.

The later liquid/PDMS chapter is a conditional no-protein/no-mixing sensitivity, not an observed response-time result.

## Design decision

The user confirms bottom-adherent cells and100 µL per well. The transport analysis therefore includes the approximately8.93 mm liquid column and evaluates a PDMS film at the well mouth. Retain the eight-part experimental carrier and do not add PDMS to the selected assembly: hydrophobicity does not establish a water-vapor barrier, and target-specific membrane properties are unknown. Gas arrival at the mouth is not exposure at bottom cells. With stagnant liquid, assumed D=10⁻⁹ m²/s and an immediately fixed surface concentration, bottom t90 is approximately22.83 h. This is a conditional transport warning, not a measured biological response time. Assumptions, sweeps and limits are documented in the later PDMS/liquid chapter.

The nominal body is108×108×66 mm, excluding external tubing and cables. Its bounding volume is31.9% below the previous114×109×91 mm envelope; this does not establish measured mass or battery endurance. There are eight prints: four black structural parts and four independent flat-bottom clear wells. Two long screws release the lid. A separate hinge, fan bracket, four-valve set and status LED have been avoided; the phone reports status.

Each well is a single piece removed upward. Opaque sleeves, a minimum1.2 mm shared wall, the filter seat and support arm are integrated into the hood. Only the Z42.5–44.2 mm bottom optical band remains open. The well must not press directly onto LED or PD packages. Wells follow the LED positions in four quadrants; their centre vectors are not exactly90° apart. The provisional PD sensitive-centre offset is(0,−0.4) mm, distinct from the package centre.

![Assembly exploded view rendered from the actual STLs](../09_engineering_sources/CAD/drawings/assembly_exploded.png)

The separate four-hole compression plate distributes lid load over all well seals. Removing it merely to reduce part count would leave the inner well mouths inadequately supported. The plate can be removed for cleaning; the integrated gas shelf has an accessible underside instead of an enclosed perforated cavity.

## Dimensions and allowances

| Item | Design value and boundary |
|---|---|
| PCB |100×90×1.6 mm; optical face Z39.6. Thickness assumed; four mounting centres±45/±40 mm inferred from PDFs |
| Fan |40×40×10 mm,5 V,32 mm pitch; integral cradle,0.3 mm clearance per side; two diagonal M3×16 screws |
| Under-board space |22 mm above fan,18.5 mm above screw heads to bare PCB; battery holder, battery and underside parts unverified |
| USB-C |Front negative-Y opening: X31.5 centre,20 mm wide, Z28.5–40.5; generous PDF-based service opening, not a measured connector fit |
| SW1/service |Right-side23×13 mm switch access; bottom J3 and SW2/SW3 access. Bottom-view mirroring must be confirmed |
| Clear well |5×3.8 outside,4×2.8 inside,0.5 mm flat floor;12.5 mm inner height,140 µL brim,100 µL working fill |
| Well sleeve |5.3×4.1 slot,0.15 mm nominal clearance per side; shoulder-supported flange retained by sealing, no brittle resin snap flexure |
| C21 relief |0.5 mm nominal vertical clearance above the assumed1.2 mm component envelope; height unconfirmed |
| Filter/seals |Maximum filter5.2×4.2×1 mm; three gasket shapes cut from0.8 mm sheet, nominally compressed to0.6 mm |
| Gas chamber |14.8×12 mm fluid plan, Z57.3–62.5;2.4 mm bore; selected shelf7.2×8×1.2 mm |

Geometric volume is4×2.8×12.5=140 mm³=140 µL. At100 µL the liquid depth is8.93 mm and headroom to the mouth is3.57 mm. Meniscus, printing error and cells are excluded.

Nominal gasket compression is(0.8−0.6)/0.8=25%. This is a geometric preload target, not a leak rating. Hardness, tolerances, warping and screw loads determine real contact. Do not force the lid to overcome interference. No tightening torque is validated; close progressively and evaluate a cell-free leak test.

The0.15 mm sliding allowance is not a16K-printer accuracy specification. Exposure, shrinkage, orientation, washing and post-curing can exceed it. Print hood02 and well04 first; measure the slot and well and check their fit before completing the other six parts. No unmeasured shrinkage compensation has been applied.

![Optical and gas sealing stack](../09_engineering_sources/CAD/drawings/stack_section.png)

## Interfaces and purchases

According to the schematic, J2 USB-C supplies power/charging and is not an ESP32 programming interface. Program through J3 with BOOT/RESET as detailed in the operation guide. J3 pin1 is3V3, pin2 TX, pin3 RX, pin4 GND. When the PCB is powered normally, do not connect UART-adapter VCC; cross TX/RX and use3.3 V logic only. Confirm any orientation ambiguity with the vendor.

Mechanical purchases are one fan, eight M3 screws, eight nuts, six washers, one silicone sheet for three seals, and short tubing/couplings. Inlet/outlet gas filters and a fluorescence filter remain functional requirements. Gas-filter pressure drop and odor adsorption are not included in the chamber model. Confirm fan current and its supply connection; a GPIO is not a fan power output.

The very small fluorescence filter is a critical procurement dependency: a suitably sized part with suitable spectra and oblique-incidence behaviour has not been selected. Confirm availability before batch-printing the optical hood. Mechanical openings do not create electronic interfaces that the PCB lacks.

## Materials, cooling and contamination

Use PC/GF-like Black for all four black structures, including fit checks. Measure transmission through the actual black hood and check seam leakage after full assembly. Use Aqua Clear Plus wells initially for dimensions, water-leak and cell-free optical tests. Ideal simulations omit its tint, absorption, autofluorescence and roughness. Polishing changes a surface and cannot remove intrinsic spectral absorption. Direct HEK293T contact, residues and sterilization are unqualified; complete post-curing is not proof of cell-culture compatibility.

The fan sits under the PCB, separate from the well-mouth gas path. This CFD models the gas cap and well headspaces, not fan cooling, heat generation, battery temperature or37°C control. No cell-temperature sensor or thermal feedback loop is provided. Reliable thermal, battery-life and weight claims require measured power, temperature, airflow and mass.

Liquid is separated; gas is shared. The wells are not independent sterile gas samples. Seals may reduce leakage and spills but neither sterility nor pressure integrity is validated. Stop inlet flow and keep the outlet vented while closing; resume at low controlled flow only after closing. Do not clamp both ports and compress the lid. External filters can dominate the approximately0.009 Pa simulated internal pressure drop. That result does not establish harmless lid-closure pressure or cell protection.

## Executed checks and limits

All eight operating STLs are single connected, closed, positive-volume meshes. Printed-part intersections and nominal bare-PCB, fan, PD/C21/R27/U8 envelopes show no positive-volume interference. This is a check of those specified proxies, not all populated components. Details are in 09_engineering_sources/CAD/checks. Resin stiffness, fatigue, barb strength and drop performance were not experimentally tested; no strength or ruggedness rating is claimed.

Optics and CFD use the final optical core, compression plate, sealing stack and selected shelf. Both use explicitly defined geometric representations, not full triangulated-STL multiphysics. The following analyses document equations, sweeps, errors and limitations. Optical transport supports a testable collection path, not adequate biological signal. The airflow choice is a conditional tradeoff, not a global optimum or cell-protection proof.

Firmware and LittleFS compile successfully. Software, normalization and DLIA checks use synthetic inputs. BOARD_VALIDATED defaults to false for dark-only acquisition until bench checks pass. The phone schedules/stops acquisition, displays frequency amplitudes, calibrates and exports. Missing temperature, battery, flow and trained-classifier data are explicitly identified rather than fabricated.

## Shortest path to a physical decision

1. Read the assembly manual and 04_manuals/Vendor_Confirmation_EN.md. Obtain populated STEP, thickness, hole diameters, interface positions, battery envelope, optical heights and PD rotation. The request is drafted, not sent.
2. If printing immediately, check dimensions and fit with hood02 and well04. Take the eight operating files only from 01_print. Assembly-coordinate files are not supplied separately; engineers can regenerate them from the CAD source when needed.
3. Follow the ten-day plan after PCB arrival: electronics/frequencies; cell-free three-level and single-well matrix tests; fit/light-leak/water checks; then3–5 manual users and two retests.
4. Record and stop on interference, ADC rail clipping, incorrect single-LED timing or leakage. Do not hide hardware defects with normalization. Consider a small biological confirmation only within an already established laboratory workflow after the four core tests.

## Cost and iGEM evidence

The BOM separately lists prints, the vendor's61 PCB rows, and purchases. The NT$131,250 quote covers two boards including design/setup; NT$65,625 is the allocation per prototype board, not a production quote. Known non-PCB material consumption is approximatelyNT$768.32–1,041.32, with seven required purchase rows and four shared-equipment rows still unquoted. It is not a complete cost. Resin use is geometry×density×support/waste assumptions, not measured consumption. Yellow spreadsheet cells accept actual prices; PCB components are not double-counted on top of the assembled-board quote.

Hardware evidence should connect a synthetic-biology need, user input, a functioning proof of concept, and reproducible documentation. The06_wiki package separates these evidence types. Cycle4 documents the enclosure/interface/shielding/flow/seal redesign and calculations. Cycle5 currently documents a study plan; observed improvements must await real testing. See the official[Special Prizes](https://review.igem.org/main/competition/judging/special-prizes)criteria.

The critical missing evidence is actual board geometry, blank leakage, measurable fluorescence and repeatable reassembly. Additional simulations cannot replace those measurements.
