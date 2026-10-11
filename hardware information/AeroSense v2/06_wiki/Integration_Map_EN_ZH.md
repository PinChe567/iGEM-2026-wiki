# Wiki integration map / Wiki 整合對照

The supplied pages are local publication drafts; nothing has been uploaded. / 本頁為本機發布草稿，沒有上傳網站。

## Hardware / 硬體頁

Reference snapshot: `08_reference/site_context/hardware_20261005.html` (SHA-256 `6d5b9bc2175c32b1812333f94d06ba5d746f782af555a3d3b1ac0dd417fe2c6f`). Line numbers refer to this snapshot and can move after editing.

The article begins at line 202. Replace its hardware content using `06_wiki/hardware_EN.html` while preserving the live site's navigation, layout, attribution and references. The standalone page has inline CSS for portable review; do not paste its outer `html/head/body` into the existing article.

| Existing section ID | Snapshot line | Action |
|---|---:|---|
| `hardware-architecture` | 209 | Replace section contents from `hardware_EN.html`; keep the ID. |
| `reader-assembly` | 213 | Replace section contents from `hardware_EN.html`; keep the ID. |
| `optical-question` | 234 | Replace section contents from `hardware_EN.html`; keep the ID. |
| `well-floor-results` | 242 | Replace section contents from `hardware_EN.html`; keep the ID. |
| `gas-path-results` | 249 | Replace section contents from `hardware_EN.html`; keep the ID. |
| `mechanical-package` | 257 | Replace section contents from `hardware_EN.html`; keep the ID. |
| `electronics-bridge` | 274 | Replace section contents from `hardware_EN.html`; keep the ID. |
| `cost-and-reproduction` | 295 | Replace section contents from `hardware_EN.html`; keep the ID. |
| `validation-boundary` | 302 | Replace section contents from `hardware_EN.html`; keep the ID. |

New sections: `multiplexing`, `gas-operation`, `measured-correction`, `assembly-usability`, `publication-drafts`, `transport-and-signal`, `glossary`, `sources`. Preserve old inbound aliases `why-hardware`, `optical-design`, `validation-evidence`, `pcb-explorer`, `tia`, `high-impedance-pcb`, `digitization`. Existing `multiplexing` was an alias: move it to the new section, do not create a duplicate ID.

The previous `data-stl-viewer` loads old meshes. Replace/remap it to the eight files under `01_print` and correct assembly transforms before enabling it. Do not leave an old assembled viewer beside the new dimensional claims. The supplied new drawings are the safe publication fallback. Keep the original schematic and PCB source explorer if its paths remain valid; retain supplier attribution.

Remove superseded 150 µL well labels, old 114 × 109 × 91 mm baseline-as-current claims, old seven/eight/nine-option print descriptions, old optical numbers, old gas-sweep rankings, and old partial BOM totals. The earlier design may remain only inside a clearly labeled historical comparison. Read the latest `numerical_sources.json`; never copy numbers from a previous image caption.

## Engineering / 工程頁

Reference snapshot: `08_reference/site_context/engineering_20261005.html` (SHA-256 `d9f1e154556ea7e8d9e0ba2c428b26d965c2945d22974aecf623b15dc76422b9`). Preserve the complete existing `hw-cycle-1`, `hw-cycle-2`, `hw-cycle-3` articles, their figures, attribution and test status.

1. At the hardware overview card (near line 266), change only the hardware count from 3 to 5; do not change other tracks.
2. At `id="group-hardware"` (line 886), update the header to “5 cycles · electronics review → instrument design → planned usability test”. Use status “PCB fabrication and physical validation pending”. Do not label all five cycles complete.
3. After button `hw-cycle-tab-3`, add buttons `hw-cycle-tab-4` and `hw-cycle-tab-5` using the existing class and `data-cycle-tab="4"/"5"`, `aria-controls="hw-cycle-4"/"hw-cycle-5"`, `aria-selected="false"`, `tabindex="-1"` conventions. Copy the live button structure rather than introducing a competing script.
4. Inside the existing `.eng-cycle-stage`, after `hw-cycle-3` and before that stage's closing `div`, insert `cycle_4_EN_fragment.html` and `cycle_5_EN_fragment.html`. The next external anchor is `id="hw-professional-review"` (line 1685); inserting after that anchor is too late. Do not alter the existing professional-review content.
5. Point fragment hardware links to the published hardware page; add relevant figure/download links using the deployed asset path. Existing cycle-viewer JavaScript must be checked with all five tabs, keyboard navigation and refresh/deep links. No live-site JS integration test has been claimed here.
6. Add two changelog rows: Cycle 4 — CAD and computational evidence complete, physical tests pending; Cycle 5 — protocol/materials prepared, participant data pending. Preserve earlier rows and every other engineering track.

Chinese counterparts are `hardware_ZH.html`, `engineering_cycles_ZH.html`, `Cycle_4_ZH.md`, `Cycle_5_ZH.md` and the ZH fragments. The EN page is the direct source for an English iGEM wiki; ZH is an equivalent review/working copy.

## Three-page content drafts / 三頁內容草稿

Use `content_plan/Description_Sections_EN.md`, `content_plan/Hardware_Sections_EN.md` and `content_plan/Model_Sections_EN.md`, with their ZH counterparts. `content_plan/Placement_Plan_EN.md` and ZH define where each belongs. These current drafts keep the one-experiment plan and measured-correction workflow; do not restore the older four-study requirement or hard-coded host-test counts.

## Paths / 連結

For the standalone pages, keep `06_wiki` beside `01_print`, `02_simulation`, `03_software`, `04_manuals`, `05_BOM`, `07_validation`. All local links intentionally use `../`. If deploying under `hardware information/chatgpt version/`, prefix links in the main site article with `hardware%20information/chatgpt%20version/` and remove the leading `../`; alternatively use official iGEM-hosted asset URLs. Uploading to a non-iGEM host does not by itself meet current competition hosting rules. Verify the applicable official rules before final submission.

## Publication checks / 發布前檢查

- Keep “PCB not yet manufactured / physical validation pending” until real evidence changes that status.
- Read final optics and airflow reports with plots. Numerical predictions are conditional; a nonzero path is not a tested instrument.
- Do not claim cell safety, sterility, a detection limit, odor classification, battery runtime or user satisfaction from this package.
- Keep the quoted two-board PCB cost distinct from scalable unit cost; unknown prices remain unknown.
- Replace every planned-test label only after collecting the actual data and linking its raw record.
- Preserve original team, manufacturer and professional-review attribution; list computational/model assistance in the team's attribution process.
- Check all eight STL downloads, PDFs, XLSX formulas, movie controls, figure alt text, table overflow and phone layout after deployment.

Best Hardware alignment follows the four official themes, paraphrased: need, user feedback, demonstrated function and reproducibility. Source: https://competition.igem.org/judging/special-prizes . There is no invented separate Overgrad score threshold in these drafts.
