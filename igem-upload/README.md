# Official iGEM media and publication records

This directory retains the canonical official upload receipt, verified URL mapping and current website publication inventory. Obsolete upload queues, copied pages, staged images and draft maps have been removed.

- `official-upload-receipt.json`: URLs returned by the official services.
- `verified-official-urls.json`: original paths and SHA-256 values, official URLs, verified response hashes and lossless conversion records.
- `publication/all-assets-inventory.json`: the single current inventory, including external sources and local videos; regenerate with the website scripts. The scripts no longer produce duplicate CSV exports or a copied publication guide.
- `../publication-files.json`: local files needed by the deployment builder.

Migrated images, fonts, models and microscopy playback data load from official iGEM URLs. Original research data and documents are retained in the separate, unpublished Zenodo package. Website research availability entries have no URL until that release is published.

Remaining local videos still supply the live page. An upload receipt does not establish playable official video availability; retain those files until official playback is verified and the page is updated. The Apple touch PNG is retained for iOS compatibility.

Run `node scripts/audit-publish-assets-v7.cjs` and then `python scripts/prepare_publication_manifest_v7.py` from the website directory. These refresh metadata without copying assets or uploading HTML.
