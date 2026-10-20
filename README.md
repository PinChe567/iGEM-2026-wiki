# AeroSense Wiki

The workspace intentionally keeps two website directories. Edit and preview in `aerosense-wiki/`. At a chosen milestone, copy the website contents into `github/iGEM-2026-wiki/`, preserving that repository's `.git` directory. Commit and push from the GitHub copy, which connects to `https://github.com/PinChe567/iGEM-2026-wiki.git` on branch `main`. These two directories are required working copies; do not remove either during duplicate-file cleanup or synchronize them automatically. The separate workspace-level `zenodo-release/` contains research documents, code and original data and is not part of the website copy.

## Preview and editable sources

Run `node scripts/preview-server.mjs 8011` here. `preview.ps1` is also available. Keep the HTML, CSS, JavaScript, translations, templates and editable design sources.

Run `node scripts/build-home-bundles.mjs` after editing homepage sources listed in `home-bundle-sources.json`. Keep the source inputs and their browser bundles.

Keep `game/apps/wiki-client/dist/`: the website uses this playable build. Reinstall game dependencies from its package manifests and lockfile only when rebuilding; do not commit `node_modules`.

## Media and research availability

Verified images, fonts, models, documents and microscopy frame data load from official iGEM URLs. The canonical records are `igem-upload/verified-official-urls.json` and `igem-upload/official-upload-receipt.json`. No local video file is a website runtime dependency. Scientific originals and publication video exports remain in the research package.

The Education and Sustainability pages retain the supplied source content, numerical results, tables and references. Education images and documents use official iGEM hosting. All five files from the linked Google Drive teacher toolkit were downloaded, retained in the local GitLab documentation package and linked through the official CDN. The resource upload receipt records 31 documents and figures with matching local and remote SHA-256 values. Notion and Google Drive were read only.

The Education Figure 1 is an original inline SVG activity map with eight linked regions, English/Traditional Chinese labels and keyboard navigation. Edit it in `education.html` and `css/education.css`; the original Notion teaching image remains linked in the caption. No additional image build is required.

The three light-sheet recordings were reuploaded as the existing verified MP4 exports from the Zenodo preparation folder. The trypsin/benzamidine animation was also uploaded. All four use Science & Technology, No linguistic content, Attribution and the team wiki link, and currently await moderator review. Description and Results expose the new watch links while keeping the existing `static.igem.wiki` frame players active. `data-video-universe-ready="false"` must remain false until public playback is verified; then switch the matching players to true. The original AVI files and web exports remain in the research package. Video playback time is not the acquisition clock.

Research downloads are marked **Zenodo (publication pending)** with no link. The unpublished research package is kept once in the separate `zenodo-release` directory. Add the final Zenodo URL after publication; do not recreate research-download copies inside this website.

The two interactive parameter viewers remain local because they run on the website. Original CAD/STL files are in the research package. `node scripts/build_hardware_web_model.mjs` finds the workspace-level `zenodo-release/aerosense-wiki` from either website directory, or reads `AEROSENSE_RESEARCH_ROOT` when set.

## Publication

Run these commands from this directory:

1. `node scripts/audit-publish-assets-v7.cjs`
2. `python scripts/prepare_publication_manifest_v7.py`
3. Only when a deployment output is actually needed: `python scripts/build-publication.py`

The first two update existing metadata without copying the website. The third creates a `public` deployment directory. These commands do not upload HTML or push a repository. Keep only one current deployment output when needed.

`publication-files.json` lists website dependencies. See `scripts/PUBLICATION.txt` for preparation details. Root and site ignore rules exclude research packages, dependency caches and temporary outputs from website commits.
