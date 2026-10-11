# AeroSense illustrated assembly manual

This manual explains assembly of the eight printed parts, PCB, optical seals, and gas tubes. Start with assembly without cells. Date: 2026-10-08.

The English text follows ASD-STE100 Issue 9 writing principles. The Chinese text gives corresponding procedures. Full vocabulary and rule compliance has not been audited. Each task separates preparation, steps, checks, and corrective actions.

This is an engineering prototype. CAD dimensions are not measurements of the assembled device. The nominal body measures 108 × 108 × 66 mm, excluding screw heads, tubes, and external filters. The four wells share gas but contain separate liquids. The device has no cell-temperature, CO2, humidity, or automatic gas-valve control.

![Figure 1 Assembly sequence and locations](../09_engineering_sources/CAD/drawings/assembly_exploded.png)

## 1 Prepare the parts and work area

Preparation: Use a dry tray, calipers, tweezers, a 2.5 mm hex key, and the parts below. Use the laboratory procedures for resin and biological samples. Detailed specifications are in 05_BOM.

| ID | Qty | Material or specification | Use |
|---|---|---|---|
| 01 | 1 | Rigid PC/GF-like Black | Base and fan support |
| 02 | 1 | Rigid PC/GF-like Black | Black light shield |
| 03 | 1 | Rigid PC/GF-like Black | Gas lid with integral shelf |
| 04 to 07 | 1 each | Aqua Clear Plus | NE, NW, SW, SE wells |
| 08 | 1 | Rigid PC/GF-like Black | Four-hole compression plate |
| H01 | 4 | M3 × 8 mm | PCB attachment |
| H02 | 2 | M3 × 16 mm | Fan attachment |
| H03 | 2 | M3 × 35 mm | Lid attachment |
| H04 | 8 | M3 × 0.5 regular hex nuts | Eight screws above |
| H05 | 6 | M3 flat washers, 0.5 mm thick | Four PCB and two fan positions |

Use socket-head cap screws. Screw lengths exclude the head. Do not substitute countersunk screws. Nut width is 5.5 mm across flats; thickness is 2.4 mm. Washer diameters are 3.2 mm inside and 7 mm outside. Confirm electrical clearance around metal washers.

1. Set SW1 to OFF.

2. Disconnect external PCB power.

3. Remove the battery.

4. Put the eight printed parts on the tray in ID order.

5. Separate the screws by length.

Check: Use the eight current STLs in 01_print. Do not combine an STL old base with the current upper enclosure. Development tools can be borrowed. Future items are outside this assembly.

## 2 Measure the board and clearances

Preparation: Disconnect PCB power. Put the optical side upward. The USB-C side is front, or −Y. SW1 is on +X. A BOTTOM drawing can be mirrored. Confirm orientation with the board and vendor drawings.

1. Measure the PCB outline.

2. Measure the distances between the four mounting-hole centers.

3. Measure board thickness and solder projections below the board.

4. Measure the battery holder height with the battery installed.

5. Measure maximum heights of the LEDs, PD, C21, R27, and U8.

6. Measure the ESP32 overhang, width, and height below the board.

7. Record the measurements in fit_checks.csv.

| Interface | Nominal CAD value | Check |
|---|---|---|
| PCB and holes | 100 × 90 mm; centers (±45, ±40) mm | Compare with the board |
| PCB height | Underside Z38; assumed thickness 1.6 mm | All four posts support the board |
| Lower clearance | General 32 mm; fan 22 mm; above screw heads about 18.5 mm | Leave at least 0.5 mm after component height |
| Outer well floor | Z42.5; 2.9 mm above nominal optical PCB face | No contact with optical or passive components |
| USB-C opening | Center X31.5; width 20; Z28.5 to 40.5 mm | Test the actual cable |
| SW1 opening | Center Y7; width 23; Z27.5 to 40.5 mm | Check full switch travel |
| Antenna opening | Width 23; Z27 to 39.6 mm | Check the insertion path also |

Check: The insertion path permits a nominal 7.2 mm antenna overhang. The PDF drawing suggests about 6.54 mm, leaving 0.66 mm. This is not a certified module outline. If the antenna touches the upper tongue, lift the PCB. Do not press the antenna, grind the PCB, or bend components.

Compared with the old print, the SW1 opening bottom is 5.5 mm lower. Its center is 3 mm lower. Each side wall moved inward by 3 mm. These CAD differences do not prove physical fit. Record results in [fit_checks.csv](../07_validation/templates/fit_checks.csv).

![Figure 2 Interfaces and orientation](../09_engineering_sources/CAD/drawings/port_plan.png)

## 3 Inspect the printed parts

1. Set the slicer units to mm.

2. Set the scale to 100%.

3. Clean the prints with the qualified resin procedure.

4. Complete post-curing with that procedure.

5. Inspect each optical floor for flatness and cracks.

6. Check that the tube bores are clear.

7. Remove support remains from seals, nut pockets, and mating surfaces.

8. Measure the wells, slots, and sealing surfaces.

Check: The nominal liquid section is 4 × 2.8 mm. The flat floor is 0.5 mm thick. Keep supports off optical and sealing surfaces. Do not change global scale to correct one fit. Do not thin the optical floor. Aqua 8K Gray is not selected for this assembly.

Transparency, black pigment, or completed curing does not establish cell compatibility, light blocking, or sterility. Do not assume the prints tolerate autoclaving.

![Figure 3 Eight printed parts](../09_engineering_sources/CAD/drawings/parts.png)

## 4 Install the fan

Preparation: Use part 01, a 40 × 40 × 10 mm fan, two M3 × 16 mm screws, two nuts, and two washers. Mounting pitch is 32 mm. The vendor must confirm the fan supply connection.

1. Put two nuts in the diagonal hex pockets under the base.

2. Put the fan in the four-corner support.

3. Point the fan airflow arrow toward the PCB.

4. Put one washer on each M3 × 16 mm screw.

5. Put each screw through its fan hole into the nut.

6. Tighten the screws alternately until the fan does not move.

7. Secure the wires along the enclosure edge.

8. Check for wires near the blades.

Check: The fan sits flat without frame distortion. Screw tips must stay above the feet. Nominal clearance is 0.3 mm per side. Fan tolerances can reduce this clearance. Stop if the fan does not fit. Do not power the fan from an ESP32 GPIO. This fan does not supply sample gas.

![Figure 4 Base fan and openings](../09_engineering_sources/CAD/drawings/base_fan_ports.png)

## 5 Install the PCB

1. Put four M3 nuts in the PCB-post side pockets.

2. Put two more M3 nuts in the front and rear lid posts.

3. Hold the PCB with its optical face upward.

4. Align the antenna with the front opening.

5. Lower the PCB slowly.

6. Check clearance between the lower components and the fan.

7. Put one washer on each M3 × 8 mm screw.

8. Turn each screw about two turns into its nut.

9. Tighten the screws gradually in a diagonal sequence.

10. Insert the actual USB-C plug fully.

11. Move SW1 through its full travel.

12. Photograph the four supports and interface locations.

Check: The PCB stays flat on all four supports. The antenna is unloaded. No wire is trapped. J3, SW2, and SW3 remain accessible. Stop if washers contact conductors, components touch the enclosure, or the plug moves the PCB. Do not use screw force to remove interference.

After assembly, test communication with the enclosure open and closed for about two minutes each. Use the same phone, distance, and orientation. Record start, stop, and missing records. This checks the intended working distance; it is not RF certification.

## 6 Install the filter and light shield

Preparation: Use part 02, a qualified emission filter, and 0.8 mm opaque silicone sheet. Maximum filter size is 5.2 × 4.2 × 1.0 mm. Larger stock filters do not fit directly.

1. Invert the light shield on a clean tray.

2. Put the filter flat in the central filter seat.

3. Check that the filter does not obstruct the designed aperture.

4. Cut the PD seal with the full-size template.

5. Put the seal around the PD.

6. Check alignment with the actual PD window.

7. Turn the light shield to its normal orientation.

8. Lower the light shield slowly onto the PCB.

9. Check clearance around C21, R27, U8, and the LEDs.

The PD seal measures 4 × 4 mm outside and 3 × 3.4 mm inside. Nominal compression reduces thickness from 0.8 to 0.6 mm. The modeled optical center is (0, −0.4) mm. Confirm its direction from the actual package. The narrowest seal edge is only 0.3 mm. Incorrect cutting can obstruct the sensitive area.

Use the [full-size seal template](../09_engineering_sources/CAD/drawings/gasket_cut_template_1to1.svg). Measure a printed dimension before cutting. Resized Word figures are not cutting templates. If adhesive is necessary, qualify it first. Apply it only at opaque corners. Keep adhesive off optical surfaces.

Check: The shield seats without screw force. Rigid prints must not press on LEDs or the PD. A green transparent sheet is not a qualified emission filter. Verify excitation rejection and oblique-angle performance.

![Figure 5 Optical alignment and PD offset](../09_engineering_sources/CAD/drawings/optical_registration.png)

## 7 Install the wells and seal stack

Preparation: Start with empty wells. Use parts 04 to 07, part 08, the lower four-hole seal, and the upper ring seal. The four well geometries are unchanged.

1. Insert the wells in their NE, NW, SW, and SE positions.

2. Point each well flange outward.

3. Check that all flat floors face downward.

4. Check that the four flange tops are level.

5. Install the lower four-hole seal.

6. Align its four holes with the well openings.

7. Put compression plate 08 inside the corner guides.

8. Install the upper ring seal.

9. Check all sealing surfaces for debris and wrinkles.

Lower seal: 20 × 18 mm outside, with four 4 × 2.8 mm holes centered at (±3.3, ±2.65) mm. Upper seal: 18.4 × 15.6 mm outside and 14.8 × 12 mm inside. Each seal is 0.8 mm thick, with 0.2 mm nominal compression. The plate is 1.2 mm thick. Nominal flange-top height is Z55.5.

Check: Each well lifts with light tweezer force. Nominal clearance is 0.15 mm per side. Do not omit the compression plate. It distributes force to the well rims. Stop if flange heights differ.

Fill volume: The user reports that about 100 µL fills a printed well. Use 80 µL only as a provisional working volume. First measure capacity with water away from the device. Then test lid closure. Reduce the volume if liquid spills or wets a seal. The CAD estimate of 140 µL is not an operating limit. Existing 100 µL simulations were not recalculated for this document update.

![Figure 6 Wells and seal stack](../09_engineering_sources/CAD/drawings/stack_section.png)

## 8 Connect gas tubes and close the lid

Preparation: Use part 03, two M3 × 35 mm screws, flexible couplers, PTFE tubes, and two hydrophobic gas filters. Part 03 contains a horizontal shelf. No separate perforated plate is installed. All four wells share the gas path.

1. Put the gas lid on a tray.

2. Identify the inlet side from the internal shelf.

3. Mark IN and OUT on the outside.

4. Support the root of the first printed tube tail.

5. Push a flexible coupler gently over the tail.

6. Connect the second tail in the same way.

7. Pass each tube through a side opening in the light shield.

8. Connect the inlet filter and sample tube.

9. Connect the outlet filter to the controlled downstream suction equipment.

10. Stop the suction equipment.

11. Keep the outlet open to gas flow.

12. Lower the lid slowly.

13. Insert the two M3 × 35 mm screws into the base nuts.

14. Tighten alternately until the lid contacts its designed stops.

15. Check that the side openings do not pinch the tubes.

Gas path: sample → inlet filter → IN → shared chamber → OUT → outlet filter → one controlled suction unit → approved exhaust. In CAD, IN is −X and OUT is +X. Do not identify ports only by left and right after turning the lid.

Tail dimensions: 3.4 mm outside diameter, 4.0 mm retention ring, and 2.4 mm bore. The coupler fits over the tail. Usable engagement is about 4.8 mm before the reinforcement rib. Do not force rigid PTFE tubing over the tail. Side openings are about 7 × 7 mm. Leave enough tube slack to open the lid. Confirm the actual coupler dimensions and material.

Check: Both ports are clear. The lid gap is even. Well rims are dry. The design calls for 0.2 µm hydrophobic gas filters. A priced 0.22 µm reference filter does not establish sterilization or retention qualification. Confirm intended use, pressure drop, fittings, and VOC recovery before substitution.

![Figure 7 Integral shelf and internal tube tails](../09_engineering_sources/CAD/drawings/lid_gas_shelf.png)

## 9 Do checks without cells

1. Test each well with 80 µL of water away from the PCB.

2. Dry the outside and rim of each well.

3. Assemble the device with Sections 7 and 8.

4. Start the complete gas path at a controlled low flow.

5. Measure actual flow with the tubes and filters installed.

6. Inspect the liquid for splashes, wet rims, and bubbles.

7. Record external liquid leakage.

8. Stop the gas flow.

9. Do dark and fluorescence-standard checks with the operation manual.

The modeled candidate flow is 3 mL/min under the 100 µL assumptions. It does not validate 80 µL operation or cell safety. Do not apply maximum pump suction to sealed wells. Stop for wet filters, rising liquid, or unstable flow. See [Flow Operation](../02_simulation/airflow/Flow_Operation_EN.md).

## 10 Replace wells and correct faults

1. Press Stop / LEDs off in the UI.

2. Check that acquisition has stopped.

3. Stop suction.

4. Keep the outlet open until pressure equalizes.

5. Set SW1 to OFF.

6. Remove the two lid screws.

7. Remove tension from the external tubes.

8. Lift the lid vertically.

9. Remove the upper seal.

10. Remove the compression plate.

11. Remove the lower seal.

12. Lift each well by its flange with tweezers.

13. Inspect for cracks, residue, deformed seals, and wet filters.

Corrective action: Disconnect power if liquid reaches the PCB. Follow the laboratory cleanup procedure before reuse. If the lid does not close, inspect flanges, seals, guides, nuts, and tubes. Do not use longer screws to force closure. Repeat calibration after changes to wells, fill, filter, cell batch, or duty.

For flashing and controls, use Operation_and_Setup in this folder. Report fit checks, measurements, and model predictions separately. Writing reference: [ASD-STE100 official website](https://www.asd-ste100.org/).
