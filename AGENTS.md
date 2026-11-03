# GitHub bilingual copy

This directory is the separate GitHub staging copy. It supports English and
Traditional Chinese. Keep `aerosense-wiki/` and `gitlab/nthu/` English-only unless
the user explicitly changes that requirement. Never copy Git metadata between
these directories. Commit and push only when the user asks.

The 2026-11-03 sync copied the current local wiki before adding localization.
Retain the current English scientific content, evidence, URLs, and licenses when
updating Chinese translations. The older locale catalogs remain useful translation
sources; they are not authority for reverting newer scientific results.

Run `python scripts/build-locales.py` after editing locale JSON. Shared additions
for current pages live in `locales/github-updates.zh-Hant.json`. Run
`node scripts/build-home-bundles.mjs` after shared homepage JavaScript changes.
Rebuild `game/apps/wiki-client/dist/` with `npm --prefix game run build:wiki`
after editing game sources. The game and wiki share `aerosense-language`.
