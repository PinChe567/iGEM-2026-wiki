AeroSense local publication preparation
=====================================

The live working site is this aerosense-wiki directory. Nothing in this workflow
uploads a file, changes the official form, or verifies the authenticated portal.

1. From the workspace root, run:
   node scripts/audit-publish-assets-v7.cjs
   python scripts/prepare_publication_manifest_v7.py

2. Inspect igem-upload/publication/all-assets-inventory.csv. Each source path is
   relative to aerosense-wiki. The SHA-256 column identifies exact file contents;
   official_url remains blank until an actual URL is supplied. The web-images
   and full-resolution folders contain the organized image copies. Other source
   media and documents stay at their listed paths, avoiding another full copy.

3. To create a local static release directory:
   python scripts/build-publication.py
   (Run this command from aerosense-wiki, or use its full path.)
   This copies the manifest files into public/ and creates a directory-index
   route for each top-level page, with the /nthu/ team base. Existing .html
   links are retained. --routes-only produces the HTML route files for review
   without copying approximately a gigabyte of media.

4. Deployment remains a team action. Verify the official host's team base,
   the extensionless standard URLs and every downloaded resource after upload.
   The local preview accepting /nthu/description is not evidence that the
   official host has the same routing configuration.

5. Arrange the required official media destinations. The publication folder
   lists local video files separately. The opening and microscopy players also
   use local frame data; their final hosting/embed arrangement needs review.
   No conversion or local preview format establishes rule compliance by itself.

6. Keep the original media. Populate the URL mappings after official uploads,
   then replace site references and rerun link/visual checks. Do not replace
   local paths with guessed official URLs. Review unfilled mappings, third-party
   terms and any portal file-size/type limits before the final submission.
