# Interfaces and measurement range to confirm before fabrication

Prepared for the supplier/electronics lead. This document has not been sent externally.

| Interface | Current assumption | Requested confirmation |
|---|---|---|
| Optical orientation | BOTTOM reference; USB front, SW1 right | Mirroring, D1-D4 physical locations, PD offset sign |
| Mechanical source | 100x90x1.6 mm board,90x80 mm hole pitch | Populated STEP, hole diameter, thickness/tolerances |
| Tall parts | Board undersideZ38; floorZ6; fan topZ16 | Battery holder plus battery, inductors, J3 and solder envelopes |
| Optical region | Well floorZ42.5, local C21 filter-tray relief | LED/PD/C21/R27/U8 actual maxima and XY tolerances |
| Power and fan | Candidate5 V,40x40x10 mm fan | Supply point, spare current, battery/charging specifications |
| UART | J3:1=3V3,2=TX,3=RX,4=GND | Pin1 marking,3.3 V USB-UART,SW2/SW3 sequence |
| Dark ADC range | Single-supply TIA; ADC AINN grounded | Photocurrent polarity, dark-output margin and maximum-light headroom |
| LED modulation | GPIO25/26/27/32;41/67/89/113 Hz | Driver polarity, resistor/current, optical output and thermal limits |
| High-impedance front end | Nominal100 Mohm feedback | Guard/cleanliness, feedback capacitor, ADC drive and stability |
| Reproduction | C1–C11, R1–R14, L1 and U3 lack values or part identities; connectors also lack full mechanical part numbers | Supply each value/full MPN, package, tolerance, rating, height and DNP state; confirm the 5-V boost setting, charging/current limits and USB-C CC configuration, plus Gerbers and publication permissions |

A successful firmware compilation does not replace analog verification. A low dark output may approach the ADC rail, but no physical board exists yet; this is a question for measurement/design review, not proof of a failed circuit. Update schematic, BOM and models before fabrication if an electrical change is required.
