# AeroSense Wiki

This is the website repository at `github/iGEM-2026-wiki`, connected to `https://github.com/PinChe567/iGEM-2026-wiki.git` on branch `main`. Commit and push website changes from this directory. The separate `../../zenodo-release` directory contains research documents, code and original data; do not push that research directory as part of the website.

## Preview and editable sources

Run `node scripts/preview-server.mjs 8011` here. `preview.ps1` is also available. Keep the HTML, CSS, JavaScript, translations, templates and editable design sources.

Run `node scripts/build-home-bundles.mjs` after editing homepage sources listed in `home-bundle-sources.json`. Keep the source inputs and their browser bundles.

Keep `game/apps/wiki-client/dist/`: the website uses this playable build. Reinstall game dependencies from its package manifests and lockfile only when rebuilding; do not commit `node_modules`.

## Media and research availability

Verified migrated images and microscopy data load from official iGEM URLs. The canonical records are `igem-upload/verified-official-urls.json` and `igem-upload/official-upload-receipt.json`. Local video sources that still supply the page remain until their official playback replacements are verified. The Apple touch PNG remains for iOS compatibility.

Research downloads are marked **Zenodo (publication pending)** with no link. The unpublished research package is kept once in the separate `zenodo-release` directory. Add the final Zenodo URL after publication; do not recreate research-download copies inside this website.

The two interactive parameter viewers remain local because they run on the website. Original CAD/STL files are in the research package. `node scripts/build_hardware_web_model.mjs` reads them from `../../zenodo-release/aerosense-wiki`, or from `AEROSENSE_RESEARCH_ROOT` when set.

## Publication

Run these commands from this directory:

1. `node scripts/audit-publish-assets-v7.cjs`
2. `python scripts/prepare_publication_manifest_v7.py`
3. Only when a deployment output is actually needed: `python scripts/build-publication.py`

The first two update existing metadata without copying the website. The third creates a `public` deployment directory. These commands do not upload HTML or push a repository. Keep only one current deployment output when needed.

`publication-files.json` lists website dependencies. See `scripts/PUBLICATION.txt` for preparation details. Root and site ignore rules exclude research packages, dependency caches and temporary outputs from website commits.
