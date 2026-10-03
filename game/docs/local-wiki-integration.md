# Local AeroSense wiki integration

The active static entry is `apps/wiki-client/dist/index.html`, served by the main wiki at `game/apps/wiki-client/dist/index.html`. The homepage and Education page use this local release, including the Pixel, Labyrinth, Spectrum, educator, science-note, and education-document subroutes.

The language fallback is English in both `apps/wiki-client/src/i18n/locale.ts` and the supplied production release's shared locale module. An explicit saved `suite.locale` preference (`en` or `zh-Hant`) takes priority. Invalid or unavailable storage falls back to English. Both languages and their language switch remain available.

## Release provenance and validation

This integration uses the supplied prebuilt static release, with only its language fallback and initial HTML language changed. It does not claim a successful new build of all current TypeScript source. The supplied `node_modules/@suite/*` workspace junctions point to the game's former folder; therefore the full source build cannot resolve the local packages. An offline dependency repair also requires package metadata that is not in the local npm cache. Source packages and assets have been preserved.

Checks completed:

- Seven source language-preference tests passed.
- `node scripts/check-wiki-integration.mjs` validates 111 static references, 19 local wiki links, and five compiled locale-reader cases.
- `node apps/wiki-client/scripts/check-external-assets.mjs` passed for 35 runtime text files: no external script, image, font, stylesheet, or module dependency was introduced.
- The static release is approximately 3.28 MiB across 46 files before the generated bundle-size report.

`scripts/integrate-wiki.mjs` records the narrowly guarded release patch and link mapping. It deliberately stops if the compiled locale module differs from the inspected form. A future full source build already gets the English fallback from `locale.ts`; the release patch is not required for a rebuilt release.

Existing asset credit notices are retained, including the source's unresolved odor-atlas attribution notice. This integration makes no new claim about that asset's licensing.

The game-local `.gitignore` excludes installed dependencies and test output, while keeping the active static release available for static hosting. No source folders were deleted.
