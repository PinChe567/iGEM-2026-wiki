import '@suite/ui/tokens.css';
import '@suite/ui/shell.css';
import '@suite/ui/components.css';
import '../../src/pages/pages.css';
import { mountShell, shellMain } from '../../src/shell/mount';
import { educationCatalog } from '../../src/data/education';
import { escapeHtml, loc, wikiNavMarkup } from '../../src/pages/shared';
import type { Locale } from '../../src/i18n/locale';

const appNode = document.querySelector<HTMLElement>('#app');
if (!appNode) throw new Error('#app missing');
const app = appNode;

const shell = mountShell(app, {
  homeHref: '../index.html',
  onLocaleChange: () => paint(),
});

function field(label: string, text: string): string {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(text.trim() || '—')}</dd></div>`;
}

function paint(): void {
  const locale = shell.getLocale() as Locale;
  const copy = shell.getCopy();
  const p = copy.pages.education;
  const cat = educationCatalog;
  document.title = `${p.title} · Odor Pixel Suite`;
  const main = shellMain(app);

  const intro = loc(cat.intro, locale);
  const empty =
    cat.activities.length === 0
      ? `<div class="wiki-empty" data-testid="education-empty"><p><strong>${escapeHtml(p.empty)}</strong></p></div>`
      : '';

  const educatorLinks = [
    { href: '../education-games/README.md', label: p.reusablePack },
    { href: '../education-games/education-study-protocol.md', label: p.studyMode },
    { href: '../education-games/question-bank.md', label: p.questionBank },
    { href: '../education-games/playtest-protocol.md', label: p.playtestProtocol },
    { href: '../education-games/data-dictionary.md', label: p.dataDictionary },
  ];

  const activities = cat.activities
    .map((a) => {
      const title = escapeHtml(loc(a.title, locale) || a.id);
      const status = escapeHtml(p.status[a.status] ?? a.status);
      const resultsText = loc(a.results, locale);
      const resultsBlock =
        a.status !== 'completed' && !resultsText
          ? `<div><dt>${escapeHtml(p.fields.results)}</dt><dd class="sp-muted">${escapeHtml(p.noResultsYet)}</dd></div>`
          : field(p.fields.results, resultsText);

      const downloads =
        a.reusableDownloads.length === 0
          ? ''
          : `<div><dt>${escapeHtml(p.downloads)}</dt><dd><ul>${a.reusableDownloads
              .map((d) => {
                const label = escapeHtml(loc(d.label, locale));
                const license = escapeHtml(loc(d.license, locale));
                return `<li><a href="${escapeHtml(d.href)}" rel="noopener">${label}</a> (${license})</li>`;
              })
              .join('')}</ul></dd></div>`;

      return `
        <article class="wiki-activity" data-testid="education-activity" data-activity-id="${escapeHtml(a.id)}">
          <p class="wiki-status">${status}</p>
          <h3>${title}</h3>
          <dl class="wiki-dl">
            ${field(p.fields.audience, loc(a.audienceAndNeeds, locale))}
            ${field(p.fields.objectives, loc(a.learningObjectives, locale))}
            ${field(p.fields.codesign, loc(a.coDesignAdaptation, locale))}
            ${field(p.fields.materials, loc(a.materials, locale))}
            ${field(p.fields.activity, loc(a.activity, locale))}
            ${field(p.fields.safety, loc(a.safetyInclusivityAccessibility, locale))}
            ${field(p.fields.evaluation, `${a.evaluationMethod} — ${loc(a.evaluationNotes, locale)}`)}
            ${resultsBlock}
            ${field(p.fields.changed, loc(a.whatChangedAfterFeedback, locale))}
            ${downloads}
            ${field(p.fields.license, loc(a.license, locale))}
          </dl>
        </article>
      `;
    })
    .join('');

  main.innerHTML = `
    ${wikiNavMarkup(copy, 1)}
    <section class="hub-intro">
      <div class="eyebrow"><span></span> WIKI</div>
      <h1>${escapeHtml(p.title)}</h1>
      <p>${escapeHtml(p.lead)}</p>
      ${intro ? `<p>${escapeHtml(intro)}</p>` : ''}
      <p class="edu-model-note">${escapeHtml(p.modelDisclaimer)}</p>
    </section>
    <section class="wiki-section" id="for-educators" data-testid="for-educators">
      <h2>${escapeHtml(p.forEducators)}</h2>
      <p>${escapeHtml(p.forEducatorsLead)}</p>
      <ul class="edu-resource-list">
        ${educatorLinks
          .map(
            (item) =>
              `<li><a href="${escapeHtml(item.href)}" rel="noopener">${escapeHtml(item.label)}</a></li>`,
          )
          .join('')}
      </ul>
    </section>
    ${empty}
    <div class="wiki-card-list" data-testid="education-activity-list">${activities}</div>
  `;
}

paint();
