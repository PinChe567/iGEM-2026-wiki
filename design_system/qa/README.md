# Design-guide verification

Preview: `http://127.0.0.1:8011/design_system/guide.html`.

Revision: **illustrated-card restoration / meaningful dark-cover artwork**, 11 October 2026. `checks.json` records the current passing run of `check-guide.cjs` on Chrome at 1440 × 900 and 390 × 900. It verifies no page-wide horizontal overflow, JavaScript/HTTP errors, missing local links/images, duplicate IDs, broken citation return, or diagram text past its SVG canvas. All six category covers retain white Fraunces titles. The native Source highlights disclosure opens, keyboard focus has a visible 3 px outline, and reduced-motion feedback duration is 0 seconds.

`palette-contrast.json` records explicit text/background calculations for all six category palettes. The minimum accent-on-white ratio is 5.13:1; pigment-on-cover 7.93:1; secondary copy on cover 9.77:1; and white title on cover 11.21:1. All checked pairs exceed 4.5:1. This does not certify untested combinations elsewhere in the website.

Seventeen regenerated PNGs show the hero, palette, guidance, cards, evidence, references and controls at both widths plus the three existing standalone SVG diagrams. Desktop palette/card and mobile hero/card images were visually inspected. Existing illustrations remain visible, their paper edges blend into the framed reading surface, and the titles occupy separate quiet zones. Scientific diagram labels and scope notes remain unchanged; only Wet Lab semantic accents changed to turquoise.

These checks cover the standalone design guide and its reused schematic assets. They do not certify production scientific viewers, team dialogs, every browser or the entire wiki. Production integration and regression checks are recorded separately by the root implementation. Earlier report screenshots are historical baselines.
