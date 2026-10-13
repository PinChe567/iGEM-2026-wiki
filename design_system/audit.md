# Signal Atlas · v15 revision audit

12 October 2026. This reconciliation updates active contracts while preserving earlier decisions and test boundaries. It does not itself certify a final whole-site build.

## V15 changes

| Area | Current resolution |
| --- | --- |
| Hero source | Original Claude PNG preserved. Active heroes use `watercolor-v15/hero-watercolor-atlas.png`, a 27-topic, 6 × 5 derivative with established proportional crops. |
| Editorial treatment | Watercolor paper, stepped pixel headings, small blocks and short hard shadows on existing near-square cards. No new enclosing cards around ordinary body sections. |
| Scientific media | Genuine images and scientific 2D diagrams stay separate from decoration. Text, plots and scientific geometry are not pixelated. |
| Learning | Warm hero bases remain; sage, sky, lavender, gold and coral distinguish lessons across course/rail/dashboard, with two or three activity companions. This supersedes the v14 brown-only component mapping. |
| Captions | Evidence outer bounds remain aligned; contents gain 24 px desktop / 16 px mobile insets and explanations of comparison, quantity and limits. |
| Wide tables | Keep native `table > caption`. Wrapper inline containment supplies `100cqw`; horizontal sticky positioning keeps captions in place while rows scroll. |
| Engineering | Nine status-only figures become evidence asides with anchors retained; five media-bearing figures remain. The V1 archive PDF and preview are identified as a circuit schematic. |
| Shared build | Three new layers follow the nine v14 layers: `watercolor-pixel-v15`, `learning-color-v15`, `evidence-caption-v15`. Total: 12. |

Model's 32 table captions and Parts' 11 plasmid-map captions were expanded from existing rows and prose. Their [before/after record](../../reports/captions-v15/model-parts-caption-changes.json) is retained. The edit check confirmed byte-identical markup outside captions for that pass. The two module-map captions and Parts tables remained with the parent integration task.

The parent integration record adds 46 further caption revisions, for 89 in total. Its static inventory distinguishes 170 content figures from seven homepage sponsor marks (177 figure elements overall), alongside 105 tables. These are inventory/content counts, not a claim that the final runtime audit has passed.

## Retained v14 decisions and history

[palettes-v14.json](palettes-v14.json) remains the 27-page base-palette source: Project sage/forest, Team ochre, Wet Lab lavender, Hardware/Model/Measurement slate blue and HP clay/terracotta. Its tested body/interface pairs had a minimum 4.51:1 against a 4.5:1 threshold; that check does not certify every rendered state.

The v14 alignment layer still aligns h2 text, prose and principal evidence outer bounds, removes competing paragraph-width caps and preserves deliberate grids. Heading fields bleed 16 px desktop / 8 px mobile. Justified prose, natural last lines, inline citation flow and the separate 56 px reference-number column remain. V15's internal caption padding explicitly revises the former zero-inset caption rule.

Notebook's v14 update integrated 24 Wet Lab and five Hardware entries, retaining exact times, the failed dense-cell cotransfection, G418 status and future planned work. Three supplied items matched existing events; the resulting Notebook has 87 records. The [v14 report](../../reports/2026-10-12-palette-notebook-v14.md) preserves its source and verification history.

Model's three studies, Engineering reader behavior, genuine photos, scientific encodings and Learning browser-local progress remain. The original v13 crop source, v12 two-ink heroes and v11 guide remain historical assets rather than current visual acceptance evidence.

## Verified v15 scope

| Check | Observed result | Evidence |
| --- | --- | --- |
| Learning at 1440/390 px | 14 cases passed; no page overflow, companion colors present, activity targets at least 44 px, focus retained, real pre/post flow and semantic feedback checked | [JSON](../../reports/learning-v15/compiled/checks.json), [report](../../reports/learning-colors-v15.md) |
| Learning contrast | Accent-on-soft pairs 4.94–5.67; large index numerals at least 3.0 on the darkest paint endpoint | [Report](../../reports/learning-colors-v15.md) |
| Model/Parts caption views | Both pages passed at 1440/390 px; inset and visible-width checks passed and representative screenshots were inspected | [JSON](../../reports/captions-v15/model-parts-checks.json), [report](../../reports/model-parts-captions-v15.md) |
| Native table-caption sweep | 205 checks across 38 page/width/study cases passed; no page overflow, caption clipping or horizontal drift; native display retained | [JSON](../../reports/captions-v15/site-caption-widths.json) |

Initial inspection found zero inline padding on Parts and clipped mobile Model captions. Both were corrected in the evidence-caption layer and checks rerun. These records describe actual scoped runs; they do not claim a final 60-case audit, deployment or official submission. Final combined results and hashes belong in [the v15 report](../../reports/2026-10-12-visual-evidence-v15.md).

This reconciliation pass edits Markdown documentation only, without changing HTML, CSS, JavaScript, data or artwork.
