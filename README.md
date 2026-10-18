# AeroSense Wiki

The workspace intentionally keeps two website directories. Edit and preview in `aerosense-wiki/`. At a chosen milestone, copy the website contents into `github/iGEM-2026-wiki/`, preserving that repository's `.git` directory. Commit and push from the GitHub copy, which connects to `https://github.com/PinChe567/iGEM-2026-wiki.git` on branch `main`. These two directories are required working copies; do not remove either during duplicate-file cleanup or synchronize them automatically. The separate workspace-level `zenodo-release/` contains research documents, code and original data and is not part of the website copy.

## Preview and editable sources

Run `node scripts/preview-server.mjs 8011` here. `preview.ps1` is also available. Keep the HTML, CSS, JavaScript, translations, templates and editable design sources.

Run `node scripts/build-home-bundles.mjs` after editing homepage sources listed in `home-bundle-sources.json`. Keep the source inputs and their browser bundles.

Keep `game/apps/wiki-client/dist/`: the website uses this playable build. Reinstall game dependencies from its package manifests and lockfile only when rebuilding; do not commit `node_modules`.

## Media and research availability

Verified migrated images and microscopy data load from official iGEM URLs. The canonical records are `igem-upload/verified-official-urls.json` and `igem-upload/official-upload-receipt.json`. Local video sources that still supply the page remain until their official playback replacements are verified. The Apple touch PNG remains for iOS compatibility.

The Education and Sustainability pages now retain the full Notion source content read on 18 October 2026, including all supplied numerical results, three Sustainability tables and their references. Education media are mapped to their original sections; `assets/notion/education/` contains 34 images and seven PDFs with descriptive English filenames. Duplicate downloads reuse existing assets. These files are included in the website dependency inventory but have not been uploaded to official iGEM hosting in this update. Notion was read only. Source placeholders remain explicitly pending; no missing results were invented.

The Education Figure 1 is an original inline SVG activity map with eight linked regions, English/Traditional Chinese labels and keyboard navigation. Edit it in `education.html` and `css/education.css`; the original Notion teaching image remains linked in the caption. No additional image build is required.

The three light-sheet AVI recordings were uploaded directly from the Zenodo preparation folder to Video Universe on 18 October 2026. All three currently require moderator review and are not publicly playable. Description and Results expose the official watch links while keeping the existing `static.igem.wiki` frame players active. `data-video-universe-ready="false"` must remain false until public playback is verified; then switch the matching players to true. The original AVI files remain only in the research package within this workspace. Video playback time is not the acquisition clock.

Research downloads are marked **Zenodo (publication pending)** with no link. The unpublished research package is kept once in the separate `zenodo-release` directory. Add the final Zenodo URL after publication; do not recreate research-download copies inside this website.

The two interactive parameter viewers remain local because they run on the website. Original CAD/STL files are in the research package. `node scripts/build_hardware_web_model.mjs` finds the workspace-level `zenodo-release/aerosense-wiki` from either website directory, or reads `AEROSENSE_RESEARCH_ROOT` when set.

## Publication

Run these commands from this directory:

1. `node scripts/audit-publish-assets-v7.cjs`
2. `python scripts/prepare_publication_manifest_v7.py`
3. Only when a deployment output is actually needed: `python scripts/build-publication.py`

The first two update existing metadata without copying the website. The third creates a `public` deployment directory. These commands do not upload HTML or push a repository. Keep only one current deployment output when needed.

`publication-files.json` lists website dependencies. See `scripts/PUBLICATION.txt` for preparation details. Root and site ignore rules exclude research packages, dependency caches and temporary outputs from website commits.
