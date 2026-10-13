# AeroSense Developer Manual

Revision: 2026-10-11. Use this manual to assemble, program, and verify the reader. Physical and biological validation results are not yet available.

The procedures use ASD-STE100 Issue 9 writing principles. They use short sentences, stable terms, conditions before actions, and one instruction per step. Full vocabulary and rule compliance has not been audited. This document does not claim formal ASD-STE100 compliance. [Writing reference](https://www.asd-ste100.org/assets/files/ASD-STE100_ISSUE9.pdf).

Use the [User Manual](User_Manual_EN.pdf) for routine controls. Keep the [USD BOM](../05_BOM/BOM_EN.xlsx) and [feedback form](../07_validation/User_Feedback_EN.pdf) separate. The eight selected STL files and firmware are unchanged.

## 1 Prepare the parts

Preparation: Use a dry tray, calipers, tweezers, and a 2.5 mm hex key. Use the current parts in 01_print. Follow the laboratory resin-handling procedure.

| Part | Quantity | Specification |
|---|---:|---|
| 01 base; 02 light shield; 03 gas lid; 08 compression plate | One each | Specified PC/GF-like Black resin |
| 04 NE; 05 NW; 06 SW; 07 SE wells | One each | Aqua Clear Plus |
| PCB screws | 4 | M3 × 8 mm socket-head cap screws |
| Fan screws | 2 | M3 × 16 mm socket-head cap screws |
| Lid screws | 2 | M3 × 35 mm socket-head cap screws |
| Nuts | 8 | M3 × 0.5; 5.5 mm across flats; 2.4 mm thick |
| Flat washers | 6 | 3.2 mm inside diameter; 7 mm outside diameter; 0.5 mm thick |
| Fan | 1 | 40 × 40 × 10 mm; 32 mm mounting pitch |
| Seal sheet | As required | 0.8 mm opaque silicone |

Screw lengths exclude the head. Countersunk screws are unsuitable. The gas shelf is integral to lid 03. No separate deflector, fan bracket, or hinge is required.

Steps:

1. Set SW1 to OFF.
2. Disconnect external PCB power.
3. Remove the battery.
4. Put the parts on the tray in ID order.
5. Separate the screws by length.

Check: All eight current parts are present. Development tools can be borrowed. Future BOM items are outside this assembly.

Failure action: If a specification is uncertain, record it in Section 15. Resolve it before assembly.

![Assembly positions](../09_engineering_sources/CAD/drawings/assembly_exploded.png)

## 2 Measure the board and prints

Preparation: Keep the board unpowered. Put the optical face upward. USB-C is at the front, or −Y. SW1 is on +X. A BOTTOM drawing can be mirrored.

Steps:

1. Measure the PCB outline.
2. Measure the mounting-hole center distances.
3. Measure PCB thickness.
4. Measure solder projections below the PCB.
5. Measure the battery-holder height with its battery installed.
6. Measure the LED, PD, C21, R27, and U8 heights.
7. Measure the ESP32 overhang, width, and underside height.
8. Record the measurements in [fit_checks.csv](../07_validation/templates/fit_checks.csv).
9. Inspect prints for cracks and distortion.
10. Complete washing with the resin supplier's procedure.
11. Complete post-curing with that procedure.
12. Remove support remains from mating surfaces.
13. Check that the tube bores are clear.
14. Measure the wells, slots, and sealing surfaces.

| Interface | Nominal CAD value | Check |
|---|---|---|
| Body | 108 × 108 × 66 mm | Excludes tubes and external filters |
| PCB | 100 × 90 mm; hole centers (±45, ±40) mm | Compare with actual board |
| PCB underside | Z38 mm; assumed thickness 1.6 mm | Four posts support the PCB |
| Lower clearance | General 32 mm; fan 22 mm; screw heads about 18.5 mm | Check actual components and wires |
| Outer well floor | Z42.5 mm | No component contact |
| USB-C opening | X31.5 center; 20 mm width; Z28.5–40.5 mm | Actual cable inserts fully |
| SW1 opening | Y7 center; 23 mm width; Z27.5–40.5 mm | Full switch travel |
| Antenna opening | 23 mm width; Z27–39.6 mm | Check insertion path |
| Well interior | 4 × 2.8 × 12.5 mm; 0.5 mm floor | Measure print and working fill |

Check: The narrow insertion path permits about 7.2 mm antenna overhang. The drawing suggests about 6.54 mm. The 0.66 mm margin is nominal. It is not a certified clearance. A provisional 0.5 mm component-clearance target also requires location-specific assessment.

Failure action: If the antenna contacts the upper tongue, lift the PCB. Do not bend components or force the antenna. Do not change global print scale to correct one fit. Do not thin an optical floor.

Use mm and 100% scale when printing. Keep supports off optical and sealing surfaces. Resin color and completed curing do not establish sterility, opacity, or cell compatibility. Do not assume autoclave compatibility.

![Interfaces and orientation](../09_engineering_sources/CAD/drawings/port_plan.png)

![Eight printed parts](../09_engineering_sources/CAD/drawings/parts.png)

## 3 Install the fan and PCB

Preparation: Use the hardware from Section 1. Obtain the vendor-confirmed fan supply connection. The fan does not supply sample gas.

Steps:

1. Put two nuts in the diagonal pockets under the base.
2. Put the fan in its support.
3. Point the fan airflow arrow toward the PCB.
4. Put one washer on each M3 × 16 mm screw.
5. Install the two fan screws.
6. Tighten the screws alternately until the fan is secure.
7. Secure the wires along the enclosure edge.
8. Put four nuts in the PCB-post pockets.
9. Put two nuts in the lid-post pockets.
10. Align the antenna with the front opening.
11. Lower the PCB slowly.
12. Put one washer on each M3 × 8 mm screw.
13. Engage the four PCB screws loosely.
14. Tighten the screws gradually in a diagonal sequence.
15. Insert the actual USB-C plug fully.
16. Move SW1 through its full travel.
17. Photograph the supports and connectors.

Check: The fan frame is flat. Blades turn freely. Screw tips stay above the feet. Washers do not touch conductors. The PCB stays flat. The antenna is unloaded. J3, SW2, and SW3 remain accessible.

Failure action: If a part interferes, stop assembly. Do not remove interference with screw force. Do not power the fan from an ESP32 GPIO.

After electrical checks, compare communication with the enclosure open and closed. Use the same phone, distance, and orientation for about two minutes each. Record start, stop, and missing blocks. This is a working-distance check, not RF certification.

![Fan support and openings](../09_engineering_sources/CAD/drawings/base_fan_ports.png)

## 4 Select and install the receiver filter

Preparation: Keep the PCB unpowered. Use clean tools. The nominal filter seat is 5.2 × 4.2 × 1.0 mm. Measure the actual seat first.

Start the practical trial with one LEE 101 layer. Use these four configurations for the main comparison:

| Configuration | Purpose | Installation check |
|---|---|---|
| No filter | Measure unfiltered leakage | Low-duty engineering test; stop for clipping |
| LEE 101, one layer | First practical trial | Cut size, thickness, and edge seal |
| LEE 101, two layers | Test additional rejection | Same checks for the stack |
| 500 nm 12.5 mm Ultra-Thin OD4 Longpass, one layer | Compare another filter technology | Mechanical fit is unresolved |

The OD4 candidate is Edmund Optics #29-190, an Everix flexible polymer/dye filter. It is not glass. Its nominal thickness is 0.30 mm. Its diameter is 12.45 ± 0.15 mm. The disc does not fit the existing rectangular seat.

Before using OD4, obtain an approved mounting or cutting method. Confirm whether the supplier permits cutting this product. Confirm the usable aperture, edge sealing, damage limits, and angular spectrum. Flexibility does not establish safe cutting or preserved performance. Do not force the disc into the seat. The current STL remains unchanged. [Product specification](https://www.edmundoptics.com/p/500nm-125mm-ultra-thin-od4-longpass-filter/53064/).

Steps:

1. Record the filter name, batch, and configuration.
2. Measure the total filter thickness.
3. Invert light shield 02 on a clean tray.
4. Put the compatible filter flat in the receiver seat.
5. Check the receiver aperture for obstruction.
6. Check that all four LED excitation paths remain open.
7. Block edge light paths with the qualified seal arrangement.
8. Photograph the filter position.

Check: The filter covers the PD collection aperture. Adhesive stays outside the useful optical area. The filter is flat and unloaded. Extra layers cannot stop light that bypasses their edges.

Failure action: If the filter cannot seat without force, do not install it. Resolve its mounting separately. If edge leakage remains, correct the seal before adding layers.

The [filter report](../02_simulation/optics/README.md) gives spectral assumptions and limits. The older Monte Carlo already included blue leakage. Its abstract OD filter did not represent LEE 101. GCaMP6f emits green fluorescence after excitation.

![Optical alignment and PD offset; historical 100 µL model. Use the verified working fill.](../09_engineering_sources/CAD/drawings/optical_registration.png)

## 5 Install the PD seal and wells

Preparation: Use the [full-size seal template](../09_engineering_sources/CAD/drawings/gasket_cut_template_1to1.svg). Measure a printed dimension before cutting. Resized document figures are not cutting templates.

| Seal or part | Nominal dimensions |
|---|---|
| PD seal | 4 × 4 mm outside; 3 × 3.4 mm inside |
| Lower seal | 20 × 18 mm outside; four 4 × 2.8 mm openings |
| Opening centers | (±3.3, ±2.65) mm |
| Upper seal | 18.4 × 15.6 mm outside; 14.8 × 12 mm inside |
| Seal thickness | 0.8 mm; nominally compressed to 0.6 mm |
| Compression plate 08 | 1.2 mm thick |

Steps:

1. Cut the PD seal with the verified template.
2. Align the seal with the actual PD window.
3. Lower light shield 02 onto the PCB.
4. Check clearance around the LEDs, PD, C21, R27, and U8.
5. Insert wells 04–07 in their marked positions.
6. Point each well flange outward.
7. Check that all well floors face downward.
8. Check that the four flange tops are level.
9. Install the lower four-hole seal.
10. Align its holes with the well openings.
11. Put plate 08 in the guides.
12. Install the upper ring seal.
13. Inspect all seal faces for debris and wrinkles.

Check: The modeled PD center is (0, −0.4) mm. Confirm its direction from the actual package. The narrowest PD-seal edge is 0.3 mm. Incorrect cutting can obstruct the sensitive area. Wells rest on their flanges. Their floors do not press on components. Each well lifts with light tweezer force.

Failure action: If flange heights differ, stop assembly. Check the wells and guides. Do not omit plate 08. It distributes force across the well rims. Do not force closure with longer screws.

![Wells and seal stack; historical 100 µL model. Use the verified working fill.](../09_engineering_sources/CAD/drawings/stack_section.png)

## 6 Connect gas tubes and verify working fill

Preparation: Use flexible couplers, tubing, two suitable gas filters, and two M3 × 35 mm screws. Support printed tails during connection.

The nominal tail diameter is 3.4 mm. The retention ring is 4.0 mm. The bore is 2.4 mm. Usable engagement is about 4.8 mm. Side openings are about 7 × 7 mm. Confirm actual coupler dimensions and material.

Steps:

1. Identify IN from the shelf inside lid 03.
2. Mark IN and OUT on the lid.
3. Support the root of the first tube tail.
4. Fit its flexible coupler gently.
5. Fit the second coupler in the same way.
6. Route the tubes through the side openings.
7. Connect the inlet filter and sample tube.
8. Connect the outlet filter to one controlled downstream suction unit.
9. Stop suction.
10. Keep the outlet open to gas flow.
11. Lower the lid slowly.
12. Install both M3 × 35 mm screws.
13. Tighten the screws alternately to the designed stops.
14. Check the tubes for pinching.

Gas path: sample → inlet filter → IN → chamber → OUT → outlet filter → controlled suction → approved exhaust. CAD identifies IN as −X and OUT as +X. Rotation changes apparent left and right.

Check: The lid gap is even. Ports are clear. Tubes have enough slack for opening. Do not force rigid PTFE tubing over printed tails. A priced 0.22 µm filter does not automatically satisfy the specified 0.2 µm gas-filter function. Confirm fittings, pressure drop, intended use, and VOC recovery.

Working-fill steps:

1. Remove the wells from the unpowered device.
2. Add 80 µL water to each well as a provisional test fill.
3. Dry each well exterior.
4. Check for leakage away from the PCB.
5. Test lid closure away from the PCB.
6. Inspect for wet seals, spills, and transfer between wells.
7. If liquid escapes, reduce the fill for a new test.
8. Record the verified working fill.
9. Dry the assembly before electrical tests.

The reported physical brim capacity is approximately 100 µL. The CAD estimate of 140 µL is not an operating limit. Historical simulations retain 100 µL. They do not validate 80 µL operation.

Failure action: If leakage persists, correct or replace the defective part. Do not put leaking wells above a powered PCB. Stop gas tests for wet filters, rising liquid, or unstable flow.

The 3 mL/min candidate comes from the historical model. Measure flow through all installed tubes and filters. The reader does not regulate flow, temperature, CO2, or humidity. [Gas-operation reference](../02_simulation/airflow/README.md).

![Gas shelf and tube tails](../09_engineering_sources/CAD/drawings/lid_gas_shelf.png)

## 7 Connect the programming interface

Preparation: Use a USB data cable and USB–UART with verified 3.3 V TX logic. J2 USB-C supplies power and charging. Programming uses J3.

| J3 pin | Signal | Adapter connection |
|---|---|---|
| 1 | 3V3_DIG | Leave disconnected |
| 2 | TXD0, GPIO1 | RX |
| 3 | RXD0, GPIO3 | TX |
| 4 | GND | GND |

Steps:

1. Switch off PCB power.
2. Disconnect the adapter USB cable.
3. Identify J3 pin 1 from the board markings.
4. Confirm the adapter TX logic level.
5. Connect J3 pin 2 to adapter RX.
6. Connect J3 pin 3 to adapter TX.
7. Connect J3 pin 4 to adapter GND.
8. Check that J3 pin 1 is disconnected.
9. Connect the adapter to the computer.
10. Apply PCB power through its vendor-confirmed input.

Check: TX and RX cross. Grounds connect. Adapter VCC stays disconnected. A jumper can change VCC without changing TX voltage. RS-232 and 5 V TX are unsuitable.

Failure action: If the signal level or pin order is uncertain, disconnect power. Confirm the connection before continuing. See the [J3 schematic detail](../03_software/evidence/uart_schematic_crop.png).

## 8 Configure and build

Preparation: Install the official PlatformIO IDE extension in VS Code. SW1 is power. SW2 is EN / Reset. SW3 is BOOT.

Steps:

1. Open 03_software/firmware in PlatformIO.
2. If private configuration is absent, copy src/config.example.h to src/aerosense_config.h.
3. Set AP_PASSWORD to at least eight ASCII characters.
4. Set API_KEY to a separate private random value.
5. Keep WIFI_SSID empty for initial direct control.
6. Keep CLOUD_URL empty.
7. Keep BOARD_VALIDATED=false.
8. Save the configuration.
9. Open the PlatformIO terminal.
10. Run the firmware build command.

```text
pio run -e esp32dev
```

11. After SUCCESS, run the filesystem build command.

```text
pio run -e esp32dev -t buildfs
```

Check: Both builds show SUCCESS. Firmware and LittleFS are separate outputs. AP_PASSWORD controls Wi-Fi access. API_KEY authorizes webpage commands. Preserve existing private settings.

Failure action: If either build fails, save its first error. Correct that error before upload. Do not publish src/aerosense_config.h or private keys.

## 9 Upload firmware and the webpage

Preparation: Find the adapter COM port in Device Manager. COM7 below is an example. Close the serial monitor before upload.

Firmware steps:

1. Type this command without pressing Enter.

```text
pio run -e esp32dev -t upload --upload-port COM7
```

2. Hold SW3.
3. Press and release SW2.
4. Keep SW3 held.
5. Press Enter in the terminal.
6. After ESP32 detection or Writing starts, release SW3.
7. Wait for SUCCESS.

Filesystem steps:

1. Type this command without pressing Enter.

```text
pio run -e esp32dev -t uploadfs --upload-port COM7
```

2. Hold SW3.
3. Press and release SW2.
4. Keep SW3 held.
5. Press Enter in the terminal.
6. After ESP32 detection or Writing starts, release SW3.
7. Wait for SUCCESS.
8. Check that SW3 is released.
9. Press and release SW2.

Check: Both uploads succeed. Firmware upload alone does not install the webpage. Use this command when boot output is required:

```text
pio device monitor --port COM7 --baud 115200
```

The fixed boot reminder says “upload filesystem before opening UI.” This message can appear after successful upload. It does not prove a filesystem fault. Press Ctrl+C before the next upload.

Failure action: If Connecting persists, check COM, ground, TX/RX, logic level, and BOOT timing. If the webpage shows 404, check buildfs and uploadfs.

## 10 Verify electronics and release the LED lock

Preparation: Use the schematic and suitable instruments. An electronics collaborator must approve the measurements. Use cell-free samples.

Steps:

1. Measure the supply rails.
2. Measure the 3.3 V rail.
3. Measure the 2.5 V reference.
4. Measure the ADC operating point.
5. Record instruments and readings.
6. Connect the phone to AeroSense Wi-Fi.
7. Open http://192.168.4.1/.
8. Enter API_KEY.
9. Press Connect.
10. Confirm HARDWARE mode.
11. Select Dark / all off.
12. Set Blocks to 1.
13. Set Interval to 3 seconds.
14. Press Start session.
15. Save the latest raw ADC block.
16. Check sample count, rail limits, and timing.

Check: One block contains nominally 8,000 samples at 4 ksample/s over two seconds. The sample interval is nominally 250 µs. The UI defaults to four LEDs and 25% duty. These are not initial-test settings.

Failure action: If clipping, timing failure, or heating occurs, stop testing. Correct the fault before calibration. Background subtraction cannot repair clipping.

LED-release steps:

1. After documented electrical checks pass, set BOARD_VALIDATED=true.
2. Rebuild firmware.
3. Upload firmware.
4. Select one LED.
5. Set PWM duty to 5%.
6. Record one block.
7. Check saturation and timing.
8. Record the observed LED direction.
9. Repeat the test for the other LEDs.
10. Test Stop / LEDs off.
11. Enter measured directions in [led_mapping.csv](../07_validation/templates/led_mapping.csv).
12. After individual tests pass, test all four LEDs.

BOARD_VALIDATED is an operator setting. It is not validation evidence. D1–D4 frequencies are 41, 67, 89, and 113 Hz. Blue leakage at these frequencies remains in their channels.

## 11 Compare filters with measured data

Preparation: Use the same board, well set, working fill, duty, and room lighting. Start with one LEE 101 layer. Compare the four configurations in Section 4.

Steps:

1. Assign a Condition ID to the configuration.
2. Record LED-off dark data.
3. Record the illuminated blank.
4. Record an independent blank check.
5. Record the fluorescence standard.
6. Save raw ADC headroom and channel means.
7. Save block SDs and corrected standard signals.
8. Repeat the checks after reassembly.
9. For another filter, start a new calibration and complete series.

Check: Compare clipping, signal size, noise, and repeatability separately. Use measured SNR and the smallest detectable change. A corrected blank near zero does not prove absent interference.

Failure action: If unfiltered light clips the ADC, stop that exposure. Resolve leakage or reduce duty in a separate pilot. If settings change, restart the comparison series. Different settings do not give a filter-only comparison.

Extra layers reduce green signal. Their benefit depends on the noise source. Edge leakage and the LED spectral tail can limit rejection. OD4 testing remains pending until its mounting is resolved.

## 12 Complete the cell-free acceptance series

Preparation: Follow the [validation plan](../07_validation/Validation_Plan_EN.pdf). Prepare 0, 50, and 100 nM fluorescein with the [sample guide](../07_validation/Fluorescence_and_Cell_Test_EN.pdf). Use the verified working fill.

| Tag | Contents | Record |
|---|---|---|
| DARK | Four blanks; LEDs off | Separate dark QC |
| B_CAL | Four blanks; LEDs on | Five valid calibration blocks |
| B_CHECK | Four blanks | Five new valid blocks |
| NE_C, NW_C, SW_C, SE_C | C in named well; blank elsewhere | Five valid blocks per tag |
| ALL_HALF | 0.5C in all wells | Five valid blocks |
| ALL_C | C in all wells | Five valid blocks; offline phase reference |
| ALL_HALF_REPEAT | Fresh 0.5C in all wells | Five valid blocks |

The formal illuminated series has 45 valid blocks. DARK is separate. Optional PHASE_REF records do not count toward these 45 blocks.

Steps:

1. Establish spill-free solution exchange before the series.
2. Keep one boot and optical configuration during the series.
3. Before solution exchange, stop the schedule.
4. Confirm that LEDs are off.
5. Stop external gas flow.
6. Exchange solution with the established method.
7. Close the light shield.
8. Set the next sample tag.
9. Acquire the required blocks.
10. Immediately after B_CAL, download its latest raw ADC block.
11. Immediately after ALL_C, download its latest raw ADC block.
12. At the end, export the complete session JSON.
13. Check exported tags and block identifiers.

Check: B_CHECK stays independent of calibration. Retain invalid records and exclusion reasons. The device keeps only its latest raw waveform. The browser keeps at most 1,000 observed blocks.

Failure action: If safe exchange requires reboot or optical disassembly, stop the series. Improve the method before a new complete series. Do not combine partial series from different boots.

Run analysis from 07_validation:

```text
python -m pip install -r requirements.txt
python quick_check.py --input my_session.json --mapping SW,SE,NE,NW
```

Replace the example mapping with measured D1–D4 directions. Analysis rejects DEMO, duplicate records, mixed settings, and insufficient blocks. It also checks clipping, timing, and phase-reference strength.

Report each provisional engineering target separately:

- All formal blocks pass clipping and timing QC.
- The half-concentration detection margin exceeds five times the independent blank SD in every channel.
- Mean response increases from blank to 0.5C to C.
- The half/full ratio is 0.35–0.65.
- Technical CV is at most 10% at both fluorescent levels.
- Repeated-half mean drift is at most 10%.
- Each expected well gives its LED's largest response.
- Each row-normalized diagonal exceeds 0.60.

Use the validation plan for exact calculations. These criteria are not biological detection limits. Near-zero CV is unstable. Preserve absolute SDs. Five blocks are technical repeats.

## 13 Hand over and maintain the reader

Preparation: Complete the acceptance record. Identify unresolved limitations.

Steps:

1. Record board and firmware identifiers.
2. Attach electrical checks and LED-release evidence.
3. Record the well set and working fill.
4. Record filter identity, layers, batch, and mounting.
5. Record duty and measured LED directions.
6. Attach JSON and both required raw ADC exports.
7. Record calibration dates and stop procedures.
8. Give the operator the User Manual.

Check: Without passed culture-compatibility checks, handover permits only cell-free standards. The current samples are GCaMP6f-expressing HEK293. Their Gibco DMEM preparation follows the updated sample guide. This reader does not maintain a culture environment.

Failure action: If evidence is missing, restrict use to completed checks. Do not mark an unperformed task complete.

For well replacement, stop acquisition and gas flow first. Equalize pressure through the open outlet. Disconnect power before disassembly. Remove the lid, upper seal, plate, and lower seal in that order. Lift wells by their flanges. Repeat calibration after reassembly.

## 14 Use optional modes and correct faults

Preparation: Complete direct phone control first. Demo is synthetic practice. A private LAN server needs separate phone and device keys.

For Demo, run this command from 03_software:

```text
python server/server.py --demo
```

Open http://127.0.0.1:8765/ on that computer. Confirm DEMO DATA. Use Ctrl+C to stop the server.

For private LAN operation, follow the [detailed setup guide](../03_software/guides/Operation_and_Setup_EN.md). Use one PCB per server instance. Separate instances need separate ports, databases, and keys. Do not use 127.0.0.1 as the ESP32 server address. Public deployment is not supplied.

| Symptom | Action | Required result |
|---|---|---|
| J2 gives no programming COM | Use J3 with USB–UART | Adapter appears in Device Manager |
| Connecting persists | Check wiring and BOOT sequence | Upload SUCCESS |
| Webpage 404 | Check LittleFS build and upload | Homepage opens |
| 401 | Enter the current API key | Connection succeeds |
| board_not_validated | Complete electrical checks | Approval before LED release |
| ADC_rail or timing error | Stop acquisition | Fault corrected before calibration |
| Wet wells, filters, or PCB | Disconnect power and stop gas flow | Cleanup and repeat checks |
| Weak reference | Check standard and optical path | Adequate measured reference |
| upload_queue_full | Restore server connection | Queue clears before more acquisition |
| no_trained_model_installed | Use acquisition and export | No fabricated classification |

Markdown is the editable source. PDF is the reading edition. This manual includes the assembly illustrations and supplier checklist.

Keep English BOM costs in USD. Keep source currency and conversion data as provenance. After changes, synchronize languages, rebuild PDFs, verify links, and refresh hashes. Keep simulation, software, physical, cell, and questionnaire evidence separate.

## 15 Confirm supplier interfaces and measurement range

Use this checklist with the supplier or electronics lead. It is prepared material, not a message sent externally.

| Interface | Current assumption | Required confirmation |
|---|---|---|
| Optical orientation | BOTTOM drawing; USB front; SW1 right | Mirroring, physical D1–D4 positions, and PD-offset direction |
| Mechanical source | Board 100 × 90 × 1.6 mm; hole pitch 90 × 80 mm | Populated STEP, hole diameter, thickness, and tolerances |
| Tall components | PCB underside Z38; floor Z6; fan top Z16 | Battery holder with battery, inductors, J3, and solder envelopes |
| Optical region | Well floor Z42.5; local C21 filter-seat relief | Actual LED, PD, C21, R27, and U8 heights and XY tolerances |
| Power and fan | Candidate 5 V, 40 × 40 × 10 mm fan | Supply connection, available current, battery, and charging specifications |
| UART | J3: 1=3V3, 2=TX, 3=RX, 4=GND | Pin-1 marking, 3.3 V adapter compatibility, and SW2/SW3 sequence |
| Dark ADC range | Single-supply TIA; ADC AINN grounded | Photocurrent polarity, dark-output margin, and maximum-light headroom |
| LED modulation | GPIO25/26/27/32; 41/67/89/113 Hz | Driver polarity, resistors, current, optical power, and thermal limits |
| High-impedance front end | Nominal 100 MΩ feedback | Guarding, cleanliness, feedback capacitance, ADC drive, and stability |
| Reproducible manufacture | C1–C11, R1–R14, L1, U3, and connectors lack complete source specifications | Values, full part numbers, packages, tolerances, ratings, heights, and unpopulated parts |
| Power circuit and release files | Settings and publication scope require confirmation | Boost setting, charge/current limits, USB-C CC circuit, Gerbers, and permission to publish |

Compilation does not replace analog verification. A low dark output can approach an ADC limit. Physical behavior requires measurement or circuit review. Do not declare a failed circuit from that possibility alone. If circuit changes are required, update the schematic, BOM, and models before fabrication.

## 16 Design basis and limits

The eight-part enclosure measures nominally 108 × 108 × 66 mm. Tubes, cables, and external filters are excluded. Its bounding volume is 31.9% below the earlier 114 × 109 × 91 mm envelope. This comparison does not establish measured mass or battery endurance.

Four black structures support four separate clear wells. Integrated sleeves provide a minimum 1.2 mm shared wall. The open optical band is Z42.5–44.2 mm. The sleeve slot is nominally 5.3 × 4.1 mm. Sliding clearance is 0.15 mm per side. It is not a printer-accuracy specification.

The fan support has nominal clearance of 0.3 mm per side. The well-flange top is Z55.5. The gas chamber plan is 14.8 × 12 mm. Its vertical range is Z57.3–62.5. The selected shelf measures 7.2 × 8 × 1.2 mm. The C21 relief assumes a 1.2 mm component envelope with 0.5 mm nominal vertical clearance. Confirm actual components.

The current SW1 opening bottom is 5.5 mm below the earlier design. Its center is 3 mm lower. Each side wall moved inward by 3 mm. These differences do not prove physical fit.

The compression plate distributes force to all well rims. The accessible shelf replaces a separate deflector. A hinge, separate fan bracket, four-valve system, and status LED are not part of the selected design. Phone status does not add missing physical sensors.

The seal target is 25% nominal compression, from 0.8 to 0.6 mm. It is not a pressure rating. Hardness, warping, tolerances, and screw forces determine contact. No tightening torque is validated. Do not clamp both gas ports while closing the lid.

For an early fit check, print shield 02 and well 04 first. Use the specified materials and current files. Measure their fit before printing the other six parts. No measured shrinkage correction is supplied.

All eight selected STLs passed closed-mesh, connected-body, and positive-volume checks. Specified component proxies had no positive-volume interference. These checks do not represent every populated component. See [CAD checks](../09_engineering_sources/CAD/checks). Resin strength, fatigue, barb durability, and drop performance remain untested.

The historical gas model selected 3 mL/min against a provisional 60-second t90 target. Nominal worst gas t90 was 50.00 seconds. The finer-grid result was 50.98 seconds. The half-timestep result was 49.85 seconds. These are simulated gas results, not a known biological threshold. See the [airflow model](../02_simulation/airflow/README.md).

Historical transport assumes 100 µL and an approximately 8.93 mm liquid column. Current provisional 80 µL operation requires physical verification. It has not replaced the historical model volume. With stagnant liquid and assumed diffusivity of 10^-9 m²/s, modeled bottom t90 was approximately 22.83 hours. That estimate assumes an immediately fixed surface concentration. It is a conditional transport warning, not measured cell response.

PDMS is not part of the selected assembly. Hydrophobicity does not establish a water-vapor barrier. Target-specific membrane properties and protein-assisted capture remain unvalidated. Gas arrival at the well mouth does not establish exposure at bottom cells. See the [membrane model](../02_simulation/membrane/README.md).

The chamber model excludes fan cooling, heat generation, battery temperature, and 37°C regulation. The simulated internal pressure drop of approximately 0.009 Pa excludes external filters. External resistance can dominate. Seals do not establish sterile separation of the shared gas path.

Optical models omit some material tint, autofluorescence, roughness, and manufacturing variation. Polishing cannot remove intrinsic absorption. Measure actual hood transmission and seam leakage. See the [optical model](../02_simulation/optics/README.md).

Keep costs in the current BOM. Its quote provenance, allocations, and currency conversion remain part of the workbook. Do not add PCB component costs again to an assembled-board quote. Required missing evidence includes actual board geometry, blank leakage, fluorescence response, and repeatable reassembly.
