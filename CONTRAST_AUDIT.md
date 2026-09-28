# Contrast and visibility audit

Target: WCAG AA — normal text ≥ 4.5:1, large text ≥ 3:1.  
Surfaces used in ratios: warm white `#FFFDF7`, cream `#F7F2E8`, white `#FFFFFF`, ink `#11261F`.

Bright palette colors (`#57F287`, `#2ED3E8`, `#FFBE3B`, `#FF7177`, `#7868F2`) are kept for borders, dots, and short marks. They are not used as paragraph or label text on light surfaces.

Readable on-light text tokens added in `css/styles.css`:

| Token | Hex | On `#FFFDF7` |
| --- | --- | ---: |
| `--aero-signal-on-light` | `#1A6B3E` | 6.42:1 |
| `--aero-cyan-on-light` | `#0E6B76` | 6.10:1 |
| `--aero-violet-on-light` | `#4A3DB8` | 7.79:1 |
| `--aero-mango-on-light` | `#8A5A12` | 5.81:1 |
| `--aero-coral-on-light` | `#A33A40` | 6.38:1 |

`--color-cyan-text`, `--color-coral-text`, `--color-violet-text`, `--color-gold-text`, `--color-amber-text` now point at those on-light values instead of raw ink or raw neon.

---

## Confirmed errors (fixed)

| selector | foreground | background | problem | fix |
| --- | --- | --- | --- | --- |
| `.desc-tagline span[data-layer="sense"]` | `#148A3C` | `#FFFDF7` | 4.36:1 — below 4.5 for normal tagline type | `--aero-signal-on-light` `#1A6B3E` (6.42:1) |
| `.desc-tagline span[data-layer="read"]` | `#2ED3E8` | `#FFFDF7` | 1.78:1 — cyan on cream unreadable | `--aero-cyan-on-light` `#0E6B76` (6.10:1) |
| `.desc-tagline span[data-layer="decode"]` | `#7868F2` | `#FFFDF7` | 4.08:1 — large-only, fails normal text | `--aero-violet-on-light` `#4A3DB8` (7.79:1) |
| `.desc-tagline span[data-layer="act"]` | `#FF7177` | `#FFFDF7` | 2.62:1 — coral on cream unreadable | `--aero-coral-on-light` `#A33A40` (6.38:1) |
| `.desc-strip li[data-layer="read"\|decode\|act] .desc-strip__layer` | `#2ED3E8` / `#7868F2` / `#FF7177` | `#FFFFFF` | 1.8–4.2:1 on 12–13px uppercase labels | same on-light tokens |
| `.layer-detail[data-layer="sense"] .section-eyebrow` | `#57F287` (`--accent-sense`) | `#FFFDF7` | 1.43:1 — neon green as label text | `--aero-signal-on-light` |
| `.layer-detail[data-layer="read"\|decode\|act] .section-eyebrow` | cyan / violet / coral | `#FFFDF7` | same AA fails as tagline | on-light tokens |
| `.hp-road-phase__num` | `#FFBE3B` | `#FFFDF7` | 1.63:1 — mango phase labels | `--aero-mango-on-light` `#8A5A12` (5.81:1) |
| `.page-contribution .contrib-hero__eyebrow` | `#57F287` | `#FFFDF7` | 1.43:1 | `--aero-signal-on-light` |
| `.page-contribution .contrib-hero__wave` | `#57F287` | `#FFFDF7` | 1.43:1 (currentColor on cream) | `--aero-signal-on-light` |
| `.page-contribution .contrib-pkg__index` | `--pkg-accent` (`#57F287` / cyan / mango / coral) | `#FFFFFF` | 1.4–2.7:1 on small mono labels | `color-mix(38% accent, ink)` ≥ 5.0:1 |
| `.page-contribution .contrib-pkg__cat` | `--pkg-accent` | `#FFFFFF` | same | same mix |
| `.page-contribution .contrib-package__num` | `--pkg-accent` | `#FFFDF7` | neon category numbers | same mix |
| `.page-contribution .contrib-package__body .contrib-panel h4` | `--pkg-accent` | `#FFFDF7` | neon panel headings | same mix |
| `.page-contribution .contrib-chain__transform` | `--pkg-accent` | `#FFFDF7` | neon uppercase labels | same mix |
| `.page-contribution .contrib-library__num` | `--pkg-accent` | `--color-paper` | neon library numerals | same mix |
| `.page-hardware .hw-layers__item--read .hw-layers__index` | `#2ED3E8` | `#FFFFFF` | 1.81:1 | `--aero-cyan-on-light` |
| `.btn--primary` | `#57F287` | `#11261F` | ratio 10.94:1 but green-on-black control text | `#FFFFFF` (`--aero-on-dark`) |
| `.surface-dark a` | `#73F59A` | `#11261F` | ratio passes; green-on-black body/link pattern | `--aero-on-dark-cyan` `#60E1F0` (10.24:1) |
| `.home-film__pipeline` | `#57F287` | film ink `#0a0a0a` | green-on-black body/caption | `--aero-on-dark-cyan` |
| `.home-film__links a:hover` | `#57F287` | film ink | green hover on black | `--aero-on-dark` `#FFFFFF` |
| `.page-engineering .eng-hp-card` | inherited / mixed | cyan-soft wash then white override | HP-boundary cards could inherit weak cyan text | explicit ink `#11261F` / body `#20332C` on white |
| `.desc-hero` / `.desc-hero__descriptor` | `#11261F` | `#FFFDF7` | contrast OK (15.63:1); overflow/clip risk from parent `overflow-wrap: anywhere` | `overflow: visible`; descriptor `overflow-wrap: break-word`; h1 `word-break: keep-all` |

---

## Special checks

| area | result |
| --- | --- |
| Human Practices body | No green-on-black body. Hero, cards, and roadmap copy are `#11261F` / `#20332C` on white/cream. Phase numbers were mango-on-cream (fixed). |
| Engineering HP-boundary cards | `.eng-hp-card` now white, ink heading/body, mango top rule only. |
| Description hero descriptor | Ink on warm white; not hidden; overflow visible; wraps inside 18ch instead of clipping. |
| TOC | `.page-toc a` `#11261F` on transparent over `#FFFDF7` (15.63:1). Current item is bold + 3px `#57F287` rule, not neon text. Labels `.tech-label` `#66736D` (4.87:1). |
| Buttons | `.btn:hover` ink on `#57F287` (10.94:1). `.btn--primary` white on ink (15.90:1); hover ink on signal (10.94:1). Search / nav-toggle hover keep ink. |
| Details / summaries | TOC, contribution packages, engineering accordions inherit ink on cream/white. `color: inherit` on `.ev-status__label`, `.contrib-package__summary`, `.eng-glance__row` is safe because parents are light + ink. |
| Evidence labels | `.evidence-status` and `.ev-status` keep a visible text label plus a mark. Status is not color-only. |
| Dark surfaces | `.surface-dark` forces white headings/body, `#C8D3CE` secondary, cyan links. No muted green on ink. |

---

## Red-flag scan (not errors)

| flag | where | verdict |
| --- | --- | --- |
| `color: inherit` | `.ev-status__label`, `.construct-map__block a`, `.eng-glance__row`, contribution cards/summaries, parts/experiments/education | Parent is light + ink (or explicit card ink). No inherit into `.surface-dark`. |
| `opacity` &lt; 0.6 | decorative bars, map pulses, planned calendar marks (`font-size: 0`), HP placeholders | Not body text. `[data-reveal]` forced `opacity: 1 !important` in `styles.css`. |
| `background: var(--aero-ink)` / `#11261F` | skip-link, primary button, nav-toggle open, search submit, `.surface-dark` | Descendants set to paper/white. Skip-link `#FFFDF7` on ink = 15.63:1. |
| Pseudo-element cover | H2 aperture and figcaption dots disabled. Remaining `::before` marks are 0.35–0.45rem status dots, not overlays. | No text covered. |
| z-index | header 1000, skip-link 10000, TOC 3, HP chapternav 900 | No background layer stacked over article text. |

---

## Checked passing pairs (unchanged)

| selector | foreground | background | ratio |
| --- | --- | --- | ---: |
| `body` | `#20332C` | `#FFFDF7` | 13.14:1 |
| `h1–h4` | `#11261F` | `#FFFDF7` | 15.63:1 |
| `.page-kicker` / `.section-eyebrow` (global) | `#1A6B3E` | `#FFFDF7` | 6.42:1 |
| `.color-ink-muted` | `#66736D` | `#FFFDF7` | 4.87:1 |
| `.desc-bound` | `#5F6D66` | `#FFFDF7` | 5.34:1 |
| `.btn:hover` | `#11261F` | `#57F287` | 10.94:1 |
| `.skip-link` | `#FFFDF7` | `#11261F` | 15.63:1 |
| `.surface-dark` body | `#FFFFFF` | `#11261F` | 15.90:1 |
| `.surface-dark .muted` | `#C8D3CE` | `#11261F` | 10.35:1 |
