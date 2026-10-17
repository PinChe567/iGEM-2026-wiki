# Signal Atlas · v15 visual strategy

Historical verification reports referenced in this document are not included in the final release. Current editable website sources remain available.
12 October 2026. Watercolor entrances introduce the topic; clear scientific figures carry the evidence. Stepped title edges, small color blocks and quiet hard shadows supply a playful interface while the article retains an open, aligned reading surface.

## Illustration and rhythm

Preserve the original Claude PNG. Active artwork comes from `assets/editorial/watercolor-v15/hero-watercolor-atlas.png`, a watercolor-on-paper derivative with 27 topics in a 6 × 5 grid. Reuse established crop proportions and exclude filename labels. The [watercolor manifest](../assets/editorial/watercolor-v15/manifest.json) records the derivative; the [original manifest](../assets/editorial/claude-v13/manifest.json) preserves crop provenance. The 25 illustrated heroes cover 19 principal pages and six Learning pages.

Section titles combine a pale page-colored field, translucent illustration detail and stepped pixel edges. Existing cards may use near-square corners and short hard shadows. Do not introduce a new card around each paragraph or section. Keep text at full resolution and leave room for focus outlines, menus and scientific viewers.

Preserve real microscopy, photographs and scientific 2D plots. Textbook diagrams may accompany neural imagery when they explain a different part of the story. Labels identify the essentials; captions carry interpretation and evidence limits. New conceptual 3D artwork uses low-poly styling without changing scientific geometry or claiming experimental measurement.

## Base palettes and Learning companions

[palettes-v14.json](palettes-v14.json) continues to define 27 base page palettes:

| Pages | Base family |
| --- | --- |
| Project | Sage and forest green |
| Team | Ochre |
| Wet Lab | Lavender |
| Hardware, Model and Measurement | Slate blue |
| Human Practices | Clay and terracotta |
| Learning hero and page base | Warm copper, ochre and terracotta from each illustration |

Learning adds a repeated lesson key across the landing sequence, module rail/drawer and dashboard: **01 sage, 02 sky, 03 lavender, 04 gold, 05 coral**. Each lesson keeps its hero base and uses two or three companions for activities and headings. `learning-color-v15.css` supersedes v14's brown-only component accents. Color accompanies lesson labels and progress text; correct/incorrect feedback retains green/red cues.

The v14 base-palette check recorded a minimum 4.51:1 across tested body/interface pairs. Added Learning accent-on-soft pairs range from 4.94:1 to 5.67:1. These scoped checks do not certify every rendered state. Scientific plot colors, fluorescence channels and CAD materials remain independent of interface themes.

## Reading and evidence boundaries

Local Fraunces carries hero/story titles, system sans carries scientific prose and controls, and local IBM Plex Mono is reserved for short metadata. Preserve the 17 px desktop / 16 px mobile body targets. Paragraphs remain justified with a natural last line and automatic hyphenation; short hero copy, controls, labels and references retain natural alignment.

Keep h2 text, prose and principal figure/table outer bounds aligned within each authored column. Heading fields extend 16 px desktop / 8 px mobile. V15 adds caption padding inside those bounds—24 px desktop / 16 px mobile. Native table captions wrap to the visible container width and stay in place during horizontal data scrolling. Captions explain subjects, comparisons, quantities and necessary limitations.

Engineering's nine status-only evidence blocks are asides, preserving anchors without presenting them as figures. Five media-bearing figures remain. The V1 preview identifies its PDF as a circuit schematic. Keep stable source IDs, numbering, full-size access, Model's three studies, deliberate grids and Engineering's guided/expanded behavior.

The homepage Learning entrance remains a book with five real chapter links. Preserve keyboard, mobile, reduced-motion and no-JavaScript access. The v14 report (historical record) retains palette/alignment and Notebook history; v15 integration (historical record) records the current revision. The v11 guide is historical.
