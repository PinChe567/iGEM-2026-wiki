# Engineering Cycle 4 · Enclosure and shared optical/gas cartridge

**Computational test complete; physical validation pending**

## Design

The project owner requested a smaller enclosure, real connector access, a fan below the PCB, black-sleeved flat wells, fewer parts and a readable assembly sequence. We set a nominal 108 × 108 × 66 mm envelope, eight prints, LED-based well positions and a removable seal-loading plate. These are design requirements, not tested performance.

## Build

Created editable CAD and individual STLs with an integrated fan cradle and gas deflector. The optical model contains clear flat-bottom wells, the off-center PD proxy, filter/seal and opaque carrier. The gas model represents the common plenum and compares perforated and directional features. Source, parameter sweeps, raw outputs and bilingual manuals are supplied. No physical PCB or assembled enclosure is claimed.

## Computational test

The ideal NE optical case predicts 0.593 ± 0.035 nW under stated assumptions. Intended-well fractions span 88.6–90.9%, so shared-bottom crosstalk remains. The selected gas candidate shelf_w8_e0p2 reduces the downward momentum proxy by 36.1% on the finest 0.20 mm grid. The fixed-STL Q3 candidate gives worst gas t90=50.00 s, with a selected-grid check of 50.98 s. These are conditional numerical outcomes, not physical validation.

## Learn

Flat floors do not ensure uniform excitation. The PD is not centered on its package; detector angles and optical filtering matter. Frequency separation identifies source modulation, not well identity, and retains synchronous reflections. Low-Reynolds-number flow should be redirected rather than deliberately made turbulent. Fewer parts remain useful only when sealing and replacement are still possible.

## Next physical gate

After board delivery, complete essential mechanical/electrical preflight, then the one continuous cell-free fluorescence-standard experiment. Measure actual gas flow if used; this does not validate the predicted concentration curve. Manual feedback remains a separate planned cycle. Revise CAD only from recorded discrepancies; physical performance remains pending.
