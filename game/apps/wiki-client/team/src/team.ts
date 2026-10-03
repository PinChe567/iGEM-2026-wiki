import '@suite/ui/tokens.css';
import '@suite/ui/shell.css';
import '@suite/ui/components.css';
import '../../src/pages/pages.css';
import { mountShell, shellMain } from '../../src/shell/mount';
import {
  TEAM_SUBTEAM_ORDER,
  membersBySubteam,
  teamCatalog,
} from '../../src/data/team';
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
  const p = copy.pages.team;
  document.title = `${p.title} · Odor Pixel Suite`;
  const main = shellMain(app);

  const groups = TEAM_SUBTEAM_ORDER.map((sub) => {
    const members = membersBySubteam(sub);
    if (!members.length && teamCatalog.members.length === 0) return '';
    if (!members.length) return '';
    const cards = members
      .map((m) => {
        const name = escapeHtml(loc(m.name, locale) || m.id);
        const role = escapeHtml(loc(m.role, locale));
        const summary = escapeHtml(loc(m.contributionSummary, locale));
        const pronouns = m.pronouns ? escapeHtml(loc(m.pronouns, locale)) : '';
        const alt = escapeHtml(loc(m.altText, locale) || name);
        const credit = m.portraitCredit ? escapeHtml(loc(m.portraitCredit, locale)) : '';
        const portrait = m.portraitAsset
          ? `<img class="wiki-portrait" src="${escapeHtml(m.portraitAsset)}" alt="${alt}" loading="lazy" width="88" height="88" />`
          : `<div class="wiki-portrait-pending" role="img" aria-label="${alt}">${escapeHtml(p.portraitPending)}</div>`;
        const social = m.socialLink
          ? `<p><a href="${escapeHtml(m.socialLink)}" rel="noopener noreferrer" target="_blank">${escapeHtml(m.socialLink)}</a></p>`
          : '';
        return `
          <article class="wiki-member" data-testid="team-member" data-member-id="${escapeHtml(m.id)}">
            <div class="wiki-member-row">
              ${portrait}
              <div>
                <h3>${name}${pronouns ? ` <span class="sp-muted">(${pronouns})</span>` : ''}</h3>
                <p>${role}</p>
                <p><strong>${escapeHtml(p.contribution)}</strong> — ${summary || '—'}</p>
                ${credit ? `<p class="sp-muted">${credit}</p>` : ''}
                ${social}
              </div>
            </div>
          </article>
        `;
      })
      .join('');
    return `
      <section class="wiki-section" data-testid="subteam-${sub}">
        <h2>${escapeHtml(p.subteams[sub] ?? sub)}</h2>
        <div class="wiki-card-list">${cards}</div>
      </section>
    `;
  }).join('');

  const empty =
    teamCatalog.members.length === 0
      ? `<div class="wiki-empty" data-testid="team-empty">
           <p><strong>${escapeHtml(p.empty)}</strong></p>
           <p>${escapeHtml(p.emptyHint)}</p>
         </div>`
      : '';

  main.innerHTML = `
    ${wikiNavMarkup(copy, 1)}
    <section class="hub-intro">
      <div class="eyebrow"><span></span> ${escapeHtml(p.title)}</div>
      <h1>${escapeHtml(p.title)}</h1>
      <p>${escapeHtml(p.lead)}</p>
    </section>
    ${empty}
    ${groups}
  `;
}

paint();
