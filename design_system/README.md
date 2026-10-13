# AeroSense — Signal Atlas v15

12 October 2026. Watercolor editorial illustrations, clear 2D science and restrained pixel details now share the existing page palettes and open reading layout. The original Claude PNG is preserved; active heroes use its [watercolor derivative](../assets/editorial/watercolor-v15/hero-watercolor-atlas.png), containing 27 topics in a 6 × 5 grid. Established proportional crop viewports remain.

## Current references

- [Visual strategy](strategy.md)
- [Component specifications](component-spec.md)
- [Implementation handoff](handoff.md)
- [Revision audit](audit.md)
- [Base page palettes](palettes-v14.json)
- [Watercolor manifest](../assets/editorial/watercolor-v15/manifest.json)
- [Original Claude crop manifest](../assets/editorial/claude-v13/manifest.json)
- [v15 integration report](../../reports/2026-10-12-visual-evidence-v15.md)

[guide.html](guide.html) remains a **historical v11 specimen**. The v12 two-ink heroes and v13 original-sheet presentation are historical references, not the current acceptance baseline.

## Active implementation

The 12 shared layers, in order, are `tokens`, `claude-crops`, `compatibility`, `foundation`, `components`, `home`, `illustration-palette`, `palette-components`, `content-alignment`, `watercolor-pixel-v15`, `learning-color-v15` and `evidence-caption-v15`.

From the workspace root (`wiki/`):

```text
python scripts/build-illustration-palettes-v14.py
node aerosense-wiki/scripts/build-design-system.mjs
node aerosense-wiki/scripts/build-home-bundles.mjs
```

Edit sources rather than generated CSS or bundles. The palette generator still owns the 27 base page palettes. The three v15 layers add the illustration treatment, Learning companions and evidence-caption layout. Learning crop geometry remains in `css/learning-wiki-v12.css`; dynamic lesson heroes are in `js/learning-module.js`.

The 25 illustrated heroes (19 principal pages and six Learning pages) use the watercolor atlas. Scientific plots, genuine microscopy, photographs and explanatory 2D diagrams retain their own media and encodings. Editorial crops are excluded from scientific numbering. Section-title fields have stepped pixel edges. Existing cards use near-square corners and short hard shadows; ordinary prose does not gain enclosing cards. Text and scientific media remain at full resolution.

## Reading, color and evidence

The v14 base families remain: Project sage/forest, Team ochre, Wet Lab lavender, Hardware/Model/Measurement slate blue and HP clay/terracotta. Learning retains warm hero bases and adds five lesson keys—sage, sky, lavender, gold and coral—with two or three companions in activities and progress. This supersedes v14's brown-only Learning component mapping.

Heading text, prose and figure/table outer bounds share each authored reading column. Heading fields bleed 16 px desktop / 8 px mobile without shifting text. **V15 captions add internal padding:** 24 px at the checked desktop width and 16 px on mobile. Native `table > caption` uses the visible wrapper width (`100cqw`) and remains horizontally stationary while wide data rows scroll.

Body justification, natural last lines, the independent 56 px reference-number column, inline citations, deliberate grids and Engineering reader behavior remain. Engineering now separates nine media-free evidence-status asides from five actual figures. Its archived V1 PDF is a circuit schematic, with a preview linking to the original.

The [v14 report](../../reports/2026-10-12-palette-notebook-v14.md) preserves palette/alignment history and Notebook's 87 records after the 24 Wet Lab and five Hardware updates. Scoped v15 results: [Learning](../../reports/learning-colors-v15.md), 14 desktop/mobile cases; [captions](../../reports/model-parts-captions-v15.md), 205 checks across 38 page/width/study cases. Final integration results and hashes belong in the v15 report.
