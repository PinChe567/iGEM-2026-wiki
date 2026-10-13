# Signal Atlas · v15 component specification

12 October 2026. These contracts describe production sources. [guide.html](guide.html) remains a **historical v11 specimen**.

| Component | Current contract |
| --- | --- |
| Hero | Breadcrumb, one h1, short purpose and page illustration. Keep the v14 page base palette and readable wrapping, including Learning's bright layout. |
| Hero artwork | Use `assets/editorial/watercolor-v15/hero-watercolor-atlas.png`: a 6 × 5, 27-topic derivative of the preserved Claude sheet. Reuse proportional crop viewports and paper treatment. Editorial art stays outside scientific numbering and may be aria-hidden. |
| Shared build | Twelve ordered layers. `watercolor-pixel-v15`, `learning-color-v15` and `evidence-caption-v15` follow the nine v14 layers; see [handoff](handoff.md). |
| Chapter title | Stable ID and h2 aligned with the reading column. Pale illustrated fields bleed 16 px desktop / 8 px mobile and have stepped pixel edges. |
| Chapter body | Open article surface. Preserve deliberate grids and useful activity/evidence boundaries without enclosing ordinary prose in new cards. |
| Existing card | Near-square corners, short hard offset shadow and restrained pixel accents. Do not clip menus, focus rings or viewers, or pixelate text/media. |
| Scientific figure | Preserve source image, proportions, encodings, full-size access and numbered explanatory caption. Outer bounds align with the reading column; caption contents use 24 px desktop / 16 px mobile padding. |
| Explanatory 2D diagram | Readable relationships, concise labels and explicit schematic scope. Keep separate from measured evidence and compatible with genuine neural imagery. |
| Table | Retain values, units and native `table > caption`. Direct wrapper supplies an inline-size container; caption width is `100cqw` with horizontal sticky positioning while wide rows scroll. Caption padding is 24 px desktop / 16 px mobile. |
| Viewer / activity | Preserve scientific colors, interactions, keyboard operation and mobile access. Decoration must not replace selected, correct, incorrect or progress cues. |
| Model | Three accessible studies: Hardware simulations, Odor decoding and Receptor engineering. Preserve matching TOCs, deep links, history and no-JavaScript/print reading. |
| Engineering | Keep guided/expanded modes, Skip and small in-flow Expand all. Nine media-free status blocks use evidence asides; five media-bearing figures remain. V1 preview links to the original circuit-schematic PDF. |
| Learning | Normal wiki navigation and warm watercolor hero bases. Lessons 01–05 use sage, sky, lavender, gold and coral across course/rail/dashboard, with two or three companions within activities. Preserve the original landing teaching diagram, questions, browser-local progress and green/red feedback. |
| References | Independent 56 px number column. Inline citations stay in sentence flow without button-sized spacing. Preserve source/return IDs, Source highlights and Back to citation. |
| Homepage | Preserve the authored sky/odor experience and five linked book chapters. Reduced-motion readers retain usable content. |
| People / controls | Keep genuine photos, dialogs, attribution content, visible focus, state beyond color and approximately 44 px touch targets. |

## Reading and evidence

Use local Fraunces for hero/story titles, system sans for body/controls and local IBM Plex Mono for short metadata. Body justification and common reading-column bounds come from v14. V15 caption padding stays inside evidence panels and must not shift their outer alignment. Preserve deliberate grids, scientific aspect ratios, CAD and Engineering sticky geometry.

Captions explain what is shown, how comparisons or units should be read and which conclusions are supported. Model tables distinguish simulation settings and proxy datasets from biological measurements. Parts maps describe construct architecture without claiming functional receptor validation. A visual change cannot strengthen a scientific claim or alter an experimental encoding.

Preserve Parts 2D/3D selection, Description journey/text fallback, Hardware CAD/PCB, Model widgets, Engineering modes, homepage interactions, member focus and Learning progress.

## Checked scope

- [Learning v15](../../reports/learning-colors-v15.md): 14 desktop/mobile cases, including real pre/post quiz flow, feedback colors, focus and touch targets.
- [Caption v15](../../reports/model-parts-captions-v15.md): Model/Parts at 1440/390 px and 205 native table-caption checks across 38 page/width/study cases, including visible wrapper width and horizontal scrolling.
- [V14 history](../../reports/2026-10-12-palette-notebook-v14.md): base palettes, reading alignment and Notebook.

These scoped results do not certify a later whole-site build. Final combined results belong in [the v15 integration report](../../reports/2026-10-12-visual-evidence-v15.md).
