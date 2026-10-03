import '@suite/ui/tokens.css';
import '@suite/ui/shell.css';
import '@suite/ui/components.css';
import '../../src/pages/pages.css';
import { mountShell, shellMain } from '../../src/shell/mount';
import { humanPracticesCatalog } from '../../src/data/human-practices';
import { escapeHtml, loc, wikiNavMarkup } from '../../src/pages/shared';
import type { Locale } from '../../src/i18n/locale';

const appNode = document.querySelector<HTMLElement>('#app');
if (!appNode) throw new Error('#app missing');
const app = appNode;

const shell = mountShell(app, {
  homeHref: '../index.html',
  onLocaleChange: () => paint(),
});

function para(label: string, text: string): string {
  if (!text.trim()) return '';
  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(text)}</dd></div>`;
}

function sectionBlock(id: string, title: string, bodyHtml: string): string {
  return `
    <section class="wiki-section" data-testid="hp-${id}">
      <h2>${escapeHtml(title)}</h2>
      ${bodyHtml}
    </section>
  `;
}

function paint(): void {
  const locale = shell.getLocale() as Locale;
  const copy = shell.getCopy();
  const p = copy.pages.humanPractices;
  const cat = humanPracticesCatalog;
  document.title = `${p.title} · Odor Pixel Suite`;
  const main = shellMain(app);

  const approachText = loc(cat.approach, locale);
  const ethicsText = loc(cat.ethicsAndResponsibility, locale);
  const limitsText = loc(cat.limitationsAndMissingVoices, locale);
  const nextText = loc(cat.nextSteps, locale);

  const stakeholders =
    cat.stakeholders.length === 0
      ? `<p class="sp-muted">${escapeHtml(p.noStakeholders)}</p>`
      : `<ul>${cat.stakeholders
          .map((s) => {
            const label = escapeHtml(loc(s.label, locale));
            const ctx = escapeHtml(loc(s.context, locale));
            const anon = s.anonymized
              ? ` <em>(${escapeHtml(p.anonymized)}${
                  s.anonymizationReason ? `: ${escapeHtml(loc(s.anonymizationReason, locale))}` : ''
                })</em>`
              : '';
            return `<li><strong>${label}</strong>${anon}<br/>${ctx}</li>`;
          })
          .join('')}</ul>`;

  const engagements =
    cat.engagements.length === 0
      ? `<p class="sp-muted">${escapeHtml(p.noEngagements)}</p>`
      : cat.engagements
          .map((e) => {
            const L = p.loopLabels;
            return `
              <article class="wiki-loop" data-testid="hp-engagement" data-engagement-id="${escapeHtml(e.id)}">
                <p class="wiki-status">${escapeHtml(e.date)} · ${escapeHtml(e.method)} · ${escapeHtml(e.consentAttributionStatus)}</p>
                <dl class="wiki-dl">
                  ${para(L.question, loc(e.questionAsked, locale))}
                  ${para(L.heard, loc(e.whatWeHeard, locale))}
                  ${para(L.insight, loc(e.insight, locale))}
                  ${para(L.decision, loc(e.projectDecision, locale))}
                  ${para(L.change, loc(e.concreteChange, locale))}
                  ${para(L.evidence, loc(e.evidenceOfChange, locale))}
                  ${para(L.followUp, loc(e.followUpEvaluation, locale))}
                  ${para(L.impact, loc(e.projectImpact, locale))}
                </dl>
              </article>
            `;
          })
          .join('');

  const decisions =
    cat.decisionTimeline.length === 0
      ? `<p class="sp-muted">${escapeHtml(p.noDecisions)}</p>`
      : `<ol>${cat.decisionTimeline
          .map((d) => {
            const title = escapeHtml(loc(d.title, locale));
            const summary = escapeHtml(loc(d.summary, locale));
            return `<li><strong>${escapeHtml(d.date)}</strong> — ${title}<br/>${summary}</li>`;
          })
          .join('')}</ol>`;

  const changed = `
    <ul>
      <li><strong>Wet Lab:</strong> ${escapeHtml(loc(cat.howHpChanged.wetLab, locale) || '—')}</li>
      <li><strong>Model:</strong> ${escapeHtml(loc(cat.howHpChanged.model, locale) || '—')}</li>
      <li><strong>Hardware:</strong> ${escapeHtml(loc(cat.howHpChanged.hardware, locale) || '—')}</li>
    </ul>
  `;

  const emptyBanner =
    cat.stakeholders.length === 0 && cat.engagements.length === 0
      ? `<div class="wiki-empty" data-testid="hp-empty"><p><strong>${escapeHtml(p.empty)}</strong></p></div>`
      : '';

  main.innerHTML = `
    ${wikiNavMarkup(copy, 1)}
    <section class="hub-intro">
      <div class="eyebrow"><span></span> WIKI</div>
      <h1>${escapeHtml(p.title)}</h1>
      <p>${escapeHtml(p.lead)}</p>
    </section>
    ${emptyBanner}
    ${sectionBlock('approach', p.sections.approach, approachText ? `<p>${escapeHtml(approachText)}</p>` : `<p class="sp-muted">—</p>`)}
    ${sectionBlock('landscape', p.sections.landscape, stakeholders)}
    ${sectionBlock('needFinding', p.sections.needFinding, engagements)}
    ${sectionBlock('decisions', p.sections.decisions, decisions)}
    ${sectionBlock('ethics', p.sections.ethics, ethicsText ? `<p>${escapeHtml(ethicsText)}</p>` : `<p class="sp-muted">—</p>`)}
    ${sectionBlock('changed', p.sections.changed, changed)}
    ${sectionBlock('limitations', p.sections.limitations, limitsText ? `<p>${escapeHtml(limitsText)}</p>` : `<p class="sp-muted">—</p>`)}
    ${sectionBlock('next', p.sections.next, nextText ? `<p>${escapeHtml(nextText)}</p>` : `<p class="sp-muted">—</p>`)}
  `;
}

paint();
