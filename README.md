# AeroSense Wiki

The workspace intentionally keeps two website directories. Edit and preview in `aerosense-wiki/`. At a chosen milestone, copy the website contents into `github/iGEM-2026-wiki/`, preserving that repository's `.git` directory. Commit and push from the GitHub copy, which connects to `https://github.com/PinChe567/iGEM-2026-wiki.git` on branch `main`. These two directories are required working copies; do not remove either during duplicate-file cleanup or synchronize them automatically. The separate workspace-level `zenodo-release/` contains research documents, code and original data and is not part of the website copy.

## Preview and editable sources

This GitHub copy supports English and Traditional Chinese. Run `node scripts/preview-server.mjs 8017` here; `preview.ps1` is also available. Every main Wiki page, learning dashboard, parameter viewer and current educational game has a language control. English remains the default. Selecting a language is remembered across navigation, reloads and the games; switching still works when browser storage is unavailable. The separate daily-editing and official GitLab copies remain unchanged and English-only.

English HTML remains the authoritative content. The local translation runtime changes display text without replacing scientific data, links or page state. Bibliographic records, identifiers and original image/PDF/download contents retain their recorded language. Chinese text for current scientific updates is editable in `locales/github-updates.zh-Hant.json`; retained page catalogs live under `locales/`.

After editing translations run `python scripts/build-locales.py`, then `python scripts/build-locales.py --check` and `node scripts/build-home-bundles.mjs`. After game changes run `npm --prefix game run build:wiki`. Do not copy this bilingual interface back into `aerosense-wiki/` or `gitlab/nthu/`. A future authorized source sync must preserve or deliberately reapply this GitHub-only localization. This copy was updated on 2026-11-03 without committing, pushing or deploying.

Run `node scripts/build-home-bundles.mjs` after editing homepage sources listed in `home-bundle-sources.json`. Keep the source inputs and their browser bundles.

Keep `game/apps/wiki-client/dist/`: the website uses this playable build. Reinstall game dependencies from its package manifests and lockfile only when rebuilding; do not commit `node_modules`.

## Media and research availability

Verified images, fonts, models, documents and microscopy frame data load from official iGEM URLs. The canonical records are `igem-upload/verified-official-urls.json` and `igem-upload/official-upload-receipt.json`. No local video file is a website runtime dependency. Scientific originals and publication video exports remain in the research package.

The Education and Sustainability pages retain the supplied source content, numerical results, tables and references. Education images and documents use official iGEM hosting. All five files from the linked Google Drive teacher toolkit were downloaded, retained in the local GitLab documentation package and linked through the official CDN. The resource upload receipt records 31 documents and figures with matching local and remote SHA-256 values. Notion and Google Drive were read only.

The Education Figure 1 is an original inline SVG activity map with eight linked regions, English labels and keyboard navigation. Edit it in `education.html` and `css/education.css`; the original Notion teaching image remains linked in the caption. No additional image build is required.

The three light-sheet recordings and the trypsin/benzamidine animation are publicly available on Video Universe. Anonymous readback also verified the other linked videos as Public and Published. The verification receipt is `audit/final-publication-20261021/video-readback.json`. Verified duplicate display copies have been removed; original AVI acquisitions and unique scientific outputs remain in the research package. Video playback time is not the acquisition clock.

The full research package remains unpublished in the separate `zenodo-release` directory. Selected code, documents and small supporting datasets are published through the official GitLab repository; eligible attachments use the official CDN. The previously supplied Zenodo DOI returned HTTP 404 and is being replaced by specific available files or the explicit archive-status document. Add a Zenodo DOI only after public publication and verification. Do not recreate research-download copies inside this website.

The two interactive parameter viewers remain local because they run on the website. Original CAD/STL files are in the research package. `node scripts/build_hardware_web_model.mjs` finds the workspace-level `zenodo-release/aerosense-wiki` from either website directory, or reads `AEROSENSE_RESEARCH_ROOT` when set.

## Publication

The official publication checkout is `../gitlab/nthu/`, separate from the intentionally preserved GitHub staging copy. Its CI builds the editable English website, shared design system and educational game from source; compiled deployment output is not committed. Synchronization and publication require the user's instruction. Never copy or remove its `.git` directory. The local site remains the daily editing source.

Run these commands from this directory:

1. `node scripts/audit-publish-assets-v7.cjs`
2. `python scripts/prepare_publication_manifest_v7.py`
3. Only when a deployment output is actually needed: `python scripts/build-publication.py`

The first two update existing metadata without copying the website. The third creates a `public` deployment directory. These commands do not upload HTML or push a repository. Keep only one current deployment output when needed.

`publication-files.json` lists website dependencies. See `scripts/PUBLICATION.txt` for preparation details. Root and site ignore rules exclude research packages, dependency caches and temporary outputs from website commits.
