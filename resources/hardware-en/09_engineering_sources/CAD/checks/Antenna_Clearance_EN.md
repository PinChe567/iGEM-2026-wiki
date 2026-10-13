# ESP32 antenna opening and assembly-clearance audit

Audit date: 2026-10-06. Scope: the delivered base STL, CAD and vendor TOP drawing. This is a nominal geometry check, not certification of populated-board fit or an RF simulation.

**The existing base already has a through-wall antenna opening. Seeing an antenna overhang in a photograph does not by itself establish that the enclosure needs changing. The more restrictive issue is vertical insertion: the vendor-drawn antenna area leaves approximately 0.66 mm nominal clearance to the upper tongue.** No CAD or STL geometry was changed in this audit. All eight STL SHA-256 hashes match the preserved delivery, including the four wells already being printed; their centers, shapes and interfaces remain unchanged.

## 1. Opening and antenna coordinates

The existing provisional optical-face-up datum places the PCB front edge at Y = −45 mm, underside at Z = 38 mm and optical face at Z = 39.6 mm. Vendor TOP coordinates are mirrored in X to map into this datum; the physical board orientation still requires confirmation. All table values are in mm.

| Feature | Current geometry or source | Meaning |
|---|---|---|
| Antenna opening | X −8 to 15; Y −56 to −44; Z 27 to 39.6 | Width 23, height 12.6; cut passes through the front wall |
| Front wall | Outside Y −56; inside Y −53.6 | Thickness 2.4; PCB edge to inner wall 8.6 |
| Upper tongue | Front inner edge Y −52.2; Z 41.8 to 43.3 | Vertical insertion encounters this first; nominal overhang limit 7.2 |
| Vendor pink Antenna Area | X −6.649 to 13.151; Y −51.540 to −45.000 | PDF vector region approximately 19.80 × 6.54; not a physical tolerance certificate |
| Drawn area to final inner front wall | Approximately 2.06 | Nominal plan-view clearance at final placement |
| Drawn area to tongue inner edge | Approximately 0.66 | Nominal plan-view clearance during vertical insertion; the tighter limit |

Vendor BOM U4 is ESP32-WROOM-32E. The official module dimensions are 18 × 25.5 × 3.1 mm and this variant uses a PCB antenna. The 19.80 mm width belongs to the vendor-drawn region; it is not the same quantity as the 18 mm physical module width. Mixing these dimensions would invalidate a fit claim. [Espressif module datasheet](https://documentation.espressif.com/esp32-wroom-32e_esp32-wroom-32ue_datasheet_en.pdf)

The drawing assumes the module lies beneath the PCB at Z = 34.9 to 38 mm. Solder standoff, actual board thickness, component orientation and mounted height have not been measured. Photographs confirm qualitative overhang but do not establish dimensions suitable for tolerance approval.

## 2. Final placement and vertical insertion are different checks

The current cut ends at Z = 39.6 mm, leaving the tongue at Z = 41.8 to 43.3 mm. Before reaching its final height, the protruding antenna therefore passes a narrower opening. A vertical ray at the approximately 6.54 mm vendor-drawn overhang clears the selected STL. A comparison ray at 7.4 mm overhang intersects the tongue.

The 0.66 mm value is an ideal drawing difference. **It does not include print shrinkage, warpage, solder placement or mounting errors.** It cannot support a guarantee of collision-free assembly. Using at least 0.5 mm actual component clearance as this project's provisional mechanical acceptance target leaves only about 0.16 mm nominal error allowance. That 0.5 mm target is an engineering fit criterion, not an Espressif RF requirement.

When the board is available:

1. Measure overhang from the PCB front edge to the antenna tip with calipers, together with actual module/antenna width and lateral position. Use the PCB edge as the datum; do not scale a photograph.
2. Measure board thickness and the module's lowest point after mounting. Confirm whether it occupies the illustrated underside and check board orientation.
3. With power disconnected, trial-fit without force and inspect both the upper-tongue passage and final position. Do not bend or trim the antenna. An angled insertion path has not been verified and can collide with other components.
4. If measured clearance is inadequate, assess a local base opening/tongue adjustment and recheck strength and the assembly path. No such modification was made here; there is no reason to change the four wells before this measurement.

## 3. Mechanical clearance does not establish radio performance

Espressif recommends placing the module PCB antenna outside the host-board edge and notes that the housing affects antenna performance. Its housing guidance recommends at least 15 mm clearance in all directions around the antenna, followed by throughput and communication-range tests of the final product. Antenna overhang is consistent with this placement approach; do not cut it off. [Espressif module-placement and housing guidance](https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32/pcb-layout-design.html#general-principles-of-pcb-layout-for-modules-positioning-a-module-on-a-base-board)

The compact tongue/front-wall distances are far below 15 mm, so **this enclosure does not meet that housing-clearance recommendation; the through-hole is not RF qualification**. This also does not prove that radio communication will fail. The resin's permittivity, loss and printed condition are unknown; its black color alone does not establish electrical conductivity or RF shielding.

Keep nearby metal and wiring away from the antenna. At fixed phone/router positions, orientation and firmware settings, compare bare-board and fully enclosed connection success, disconnects/data loss and transfer performance. Record RSSI as supporting information, not as the sole reliability criterion. Any stated communication range requires measurements.

## 4. Drawing and evidence

![Antenna opening and vertical assembly path](../../../../../hardware%20information/AeroSense%20v2/09_engineering_sources/CAD/drawings/Antenna_Clearance_EN.png)

Panel A projects the selected base STL front surface, with X horizontal and Z vertical. Panel B is a nominal center Y–Z section. Gray denotes the base, green the PCB, amber an assumed module envelope and cyan the existing cut and insertion direction. Coordinates are in mm. This is not a 1:1 printable gauge; the amber mounted height is not measured.

The [evidence JSON](../../../../../hardware%20information/AeroSense%20v2/09_engineering_sources/CAD/checks/Antenna_Clearance_Evidence.json) records 336 forward rays through the aperture interior with no STL intersection, five positive wall/tongue controls that intersect solid material, two vertical-insertion checks and all eight STL hashes. These sampled rays do not establish continuous volume clearance, every insertion angle, all components or a complete tolerance stack.

## 5. Reproduction

From the complete delivery folder, use Python with numpy, Pillow, pypdf and a font supporting Chinese and English:

```text
python 09_engineering_sources/CAD/checks/Antenna_Clearance_Check.py
```

The [checker](../../../../../hardware%20information/AeroSense%20v2/09_engineering_sources/CAD/checks/Antenna_Clearance_Check.py) reads the selected base STL, [parameters](../../../../../hardware%20information/AeroSense%20v2/09_engineering_sources/CAD/design_parameters.json), [CAD source](../../../../../hardware%20information/AeroSense%20v2/09_engineering_sources/CAD/aerosense.scad), [preservation record](../../../../../hardware%20information/AeroSense%20v2/09_engineering_sources/CAD/checks/current_preservation.json) and original vendor TOP PDF. It extracts the antenna region from PDF vector paths and writes only its own evidence JSON and two drawings. It does not export or alter an STL. A changed source or hash stops the check and requires a fresh audit; do not update the preservation record merely to bypass a failure.

If using a public reduced appendix without the original vendor PDF, obtain an authorized copy of `08_reference/NTHU-TEST_BOARD_V1-TOP-0911.pdf` before reproducing vector extraction. Photo-based estimates are not equivalent input.

