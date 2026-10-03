/**
 * Shared Science / Model Limits / Media Credits / Privacy dialog content.
 * Pure markup helpers — callers open <dialog> or route pages.
 */

import type { Locale } from '../i18n/locale';
import type { MessageTree } from '../i18n/messages';
import { ASSET_CREDIT_MANIFEST, contentCatalog } from '@suite/content';

export type LegalTab = 'science' | 'limits' | 'credits' | 'privacy';

export function legalDialogMarkup(copy: MessageTree, locale: Locale): string {
  const c = copy.legal;
  const credits = ASSET_CREDIT_MANIFEST.map(
    (a) =>
      `<li><strong>${a.title}</strong> — <code>${a.path}</code><br/>${a.creditText[locale]} <em>(${a.creditStatus})</em></li>`,
  ).join('');

  return `
    <div class="legal-tabs" role="tablist" aria-label="${c.tabsAria}">
      <button type="button" role="tab" data-legal-tab="science" aria-selected="true">${c.tabScience}</button>
      <button type="button" role="tab" data-legal-tab="limits">${c.tabLimits}</button>
      <button type="button" role="tab" data-legal-tab="credits">${c.tabCredits}</button>
      <button type="button" role="tab" data-legal-tab="privacy">${c.tabPrivacy}</button>
    </div>
    <div class="legal-panels">
      <section data-legal-panel="science" role="tabpanel">
        <h3>${c.scienceTitle}</h3>
        <p>${c.scienceBody}</p>
        <p>${contentCatalog.modelDisclaimer[locale]}</p>
      </section>
      <section data-legal-panel="limits" role="tabpanel" hidden>
        <h3>${c.limitsTitle}</h3>
        <p>${c.limitsBody}</p>
      </section>
      <section data-legal-panel="credits" role="tabpanel" hidden>
        <h3>${c.creditsTitle}</h3>
        <ul class="legal-credits">${credits || `<li>${c.creditsEmpty}</li>`}</ul>
      </section>
      <section data-legal-panel="privacy" role="tabpanel" hidden>
        <h3>${c.privacyTitle}</h3>
        <p>${c.privacyBody}</p>
      </section>
    </div>
  `;
}

export function wireLegalDialog(dialog: HTMLDialogElement): void {
  const tabs = dialog.querySelectorAll<HTMLButtonElement>('[data-legal-tab]');
  const panels = dialog.querySelectorAll<HTMLElement>('[data-legal-panel]');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.legalTab as LegalTab;
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      panels.forEach((p) => {
        p.hidden = p.dataset.legalPanel !== id;
      });
    });
  });
  dialog.querySelectorAll('[data-close-legal]').forEach((btn) => {
    btn.addEventListener('click', () => dialog.close());
  });
}
