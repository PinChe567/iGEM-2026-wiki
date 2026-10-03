import '@suite/ui/tokens.css';
import '@suite/ui/shell.css';
import '@suite/ui/components.css';
import '../../src/pages/pages.css';
import { mountShell, shellMain } from '../../src/shell/mount';
import {
  attributionsFallbackOpenUrl,
  resolveAttributionsEmbedUrl,
  siteConfig,
} from '../../src/data/site';
import { escapeHtml, loc, wikiNavMarkup } from '../../src/pages/shared';

const appNode = document.querySelector<HTMLElement>('#app');
if (!appNode) throw new Error('#app missing');
const app = appNode;

const shell = mountShell(app, {
  homeHref: '../index.html',
  onLocaleChange: () => paint(),
});

function paint(): void {
  const locale = shell.getLocale();
  const copy = shell.getCopy();
  const p = copy.pages.attributions;
  document.title = `${p.title} · Odor Pixel Suite`;
  const main = shellMain(app);

  const resolved = resolveAttributionsEmbedUrl();
  const openUrl = attributionsFallbackOpenUrl();

  let embedBlock = '';
  if (!resolved.ok) {
    const msg =
      resolved.reason === 'empty'
        ? p.embedMissing
        : resolved.reason === 'not_allowlisted'
          ? p.embedBlocked
          : p.embedInvalid;
    embedBlock = `
      <div class="wiki-empty" data-testid="attributions-missing">
        <p><strong>${escapeHtml(msg)}</strong></p>
        <p>${escapeHtml(p.embedMissingHint)}</p>
      </div>
    `;
  } else {
    embedBlock = `
      <p>
        <a data-testid="attributions-open" href="${escapeHtml(resolved.url)}" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(p.openOfficial)}
        </a>
      </p>
      <div class="attributions-frame-wrap" data-testid="attributions-frame">
        <iframe
          title="${escapeHtml(p.iframeTitle)}"
          src="${escapeHtml(resolved.url)}"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
      <p class="sp-muted">${escapeHtml(p.iframeFallback)}</p>
    `;
  }

  // Fallback open link even when embed missing but open URL somehow set — only if allowlisted.
  if (!resolved.ok && openUrl) {
    embedBlock += `
      <p>
        <a data-testid="attributions-open" href="${escapeHtml(openUrl)}" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(p.openOfficial)}
        </a>
      </p>
    `;
  }

  const supportText = loc(siteConfig.supportAcknowledgement, locale);
  const support = `
    <section class="wiki-section" data-testid="attributions-support">
      <h2>${escapeHtml(p.supportTitle)}</h2>
      ${
        supportText
          ? `<p>${escapeHtml(supportText)}</p>`
          : `<p class="sp-muted">${escapeHtml(p.supportEmpty)}</p>`
      }
    </section>
  `;

  main.innerHTML = `
    ${wikiNavMarkup(copy, 1)}
    <section class="hub-intro">
      <div class="eyebrow"><span></span> WIKI</div>
      <h1>${escapeHtml(p.title)}</h1>
      <p>${escapeHtml(p.lead)}</p>
    </section>
    ${embedBlock}
    ${support}
  `;
}

paint();
