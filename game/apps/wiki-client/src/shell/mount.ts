import { brandMarkup, footerMarkup, langSwitchMarkup } from '@suite/ui';
import { t } from '../i18n/messages';
import {
  readStoredLocale,
  storeLocale,
  type Locale,
} from '../i18n/locale';
import { legalDialogMarkup, wireLegalDialog } from '../legal/content';
import {
  loadSuiteExplorer,
  markScienceCard,
  saveSuiteExplorer,
} from '../progress/explorer';

export type ShellOptions = {
  homeHref: string;
  actionsHtml?: string;
  onLocaleChange?: (locale: Locale, copy: ReturnType<typeof t>) => void;
  /** When true, show shared legal / a11y controls in the top bar. */
  showSuiteControls?: boolean;
};

const A11Y_KEY = 'suite.a11y.v1';

type A11yPrefs = {
  highContrast: boolean;
  reducedMotion: boolean;
};

function loadA11y(): A11yPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(A11Y_KEY) ?? 'null') as A11yPrefs | null;
    return {
      highContrast: Boolean(raw?.highContrast),
      reducedMotion: Boolean(raw?.reducedMotion),
    };
  } catch {
    return { highContrast: false, reducedMotion: false };
  }
}

function saveA11y(prefs: A11yPrefs): void {
  try {
    localStorage.setItem(A11Y_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

function applyA11y(prefs: A11yPrefs): void {
  document.documentElement.classList.toggle('high-contrast', prefs.highContrast);
  document.documentElement.classList.toggle('reduced-motion', prefs.reducedMotion);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('reduced-motion');
  }
}

export function mountShell(
  root: HTMLElement,
  options: ShellOptions,
): { getLocale: () => Locale; getCopy: () => ReturnType<typeof t> } {
  let locale = readStoredLocale();
  let a11y = loadA11y();
  applyA11y(a11y);

  const suiteControls = options.showSuiteControls !== false
    ? `<button type="button" class="ghost-button compact-label" data-shell-legal></button>
       <button type="button" class="ghost-button compact-label" data-shell-a11y></button>`
    : '';

  root.innerHTML = `
    <a class="skip-link" href="#suite-main">${t(locale).shell.skipToMain}</a>
    <div class="noise" aria-hidden="true"></div>
    <div class="page-shell">
      <header class="topbar" role="banner">
        <div data-shell-brand></div>
        <nav class="top-actions" aria-label="${t(locale).shell.navAria}">
          <div data-shell-lang></div>
          ${suiteControls}
          ${options.actionsHtml ?? ''}
        </nav>
      </header>
      <main class="page-main" id="suite-main" data-shell-main tabindex="-1"></main>
      <div data-shell-footer></div>
    </div>
    <dialog id="suiteLegalDialog" class="modal guide-modal legal-modal">
      <div class="modal-header">
        <div>
          <span class="section-label">SUITE</span>
          <h2 data-legal-heading></h2>
        </div>
        <button class="close-button" data-close-legal type="button" aria-label="Close">\u00d7</button>
      </div>
      <div data-legal-body></div>
      <button class="primary-button full-button" data-close-legal type="button" data-legal-close-label></button>
    </dialog>
    <dialog id="suiteA11yDialog" class="modal guide-modal">
      <div class="modal-header">
        <div>
          <span class="section-label">A11Y</span>
          <h2 data-a11y-heading></h2>
        </div>
        <button class="close-button" data-close-a11y type="button" aria-label="Close">\u00d7</button>
      </div>
      <div data-a11y-body></div>
      <button class="primary-button full-button" data-close-a11y type="button" data-a11y-close-label></button>
    </dialog>
  `;

  const brandHost = root.querySelector<HTMLElement>('[data-shell-brand]')!;
  const langHost = root.querySelector<HTMLElement>('[data-shell-lang]')!;
  const footerHost = root.querySelector<HTMLElement>('[data-shell-footer]')!;
  const legalDialog = root.querySelector<HTMLDialogElement>('#suiteLegalDialog')!;
  const a11yDialog = root.querySelector<HTMLDialogElement>('#suiteA11yDialog')!;

  const paintLegal = () => {
    const copy = t(locale);
    const heading = legalDialog.querySelector('[data-legal-heading]');
    const body = legalDialog.querySelector('[data-legal-body]');
    const closeLabel = legalDialog.querySelector('[data-legal-close-label]');
    if (heading) heading.textContent = copy.legal.title;
    if (body) body.innerHTML = legalDialogMarkup(copy, locale);
    if (closeLabel) closeLabel.textContent = copy.legal.close;
    wireLegalDialog(legalDialog);
  };

  const paintA11y = () => {
    const copy = t(locale);
    const heading = a11yDialog.querySelector('[data-a11y-heading]');
    const body = a11yDialog.querySelector('[data-a11y-body]');
    const closeLabel = a11yDialog.querySelector('[data-a11y-close-label]');
    if (heading) heading.textContent = copy.shell.a11yTitle;
    if (closeLabel) closeLabel.textContent = copy.legal.close;
    if (body) {
      body.innerHTML = `
        <label class="sp-check"><input type="checkbox" data-a11y-contrast ${a11y.highContrast ? 'checked' : ''}/> ${copy.shell.highContrast}</label>
        <label class="sp-check"><input type="checkbox" data-a11y-motion ${a11y.reducedMotion ? 'checked' : ''}/> ${copy.shell.reducedMotion}</label>
        <p class="sp-muted">${copy.shell.a11yNote}</p>
      `;
      body.querySelector('[data-a11y-contrast]')?.addEventListener('change', (e) => {
        a11y = { ...a11y, highContrast: (e.target as HTMLInputElement).checked };
        saveA11y(a11y);
        applyA11y(a11y);
      });
      body.querySelector('[data-a11y-motion]')?.addEventListener('change', (e) => {
        a11y = { ...a11y, reducedMotion: (e.target as HTMLInputElement).checked };
        saveA11y(a11y);
        applyA11y(a11y);
      });
    }
  };

  const applyLocale = () => {
    const copy = t(locale);
    document.documentElement.lang = locale;
    brandHost.innerHTML = brandMarkup({
      title: copy.shell.brandTitle,
      subtitle: copy.shell.brandSubtitle,
      homeHref: options.homeHref,
      homeAriaLabel: copy.shell.homeAria,
    });
    langHost.innerHTML = langSwitchMarkup(locale, {
      langZh: copy.shell.langZh,
      langEn: copy.shell.langEn,
      langSwitchAria: copy.shell.langSwitchAria,
    });
    footerHost.innerHTML = footerMarkup({
      footerMark: copy.shell.footerMark,
      footerTagline: copy.shell.footerTagline,
    });

    const legalBtn = root.querySelector('[data-shell-legal]');
    const a11yBtn = root.querySelector('[data-shell-a11y]');
    if (legalBtn) legalBtn.textContent = copy.shell.legal;
    if (a11yBtn) a11yBtn.textContent = copy.shell.a11y;

    const skip = root.querySelector('.skip-link');
    if (skip) skip.textContent = copy.shell.skipToMain;

    langHost.querySelectorAll<HTMLButtonElement>('[data-locale]').forEach((button) => {
      button.addEventListener('click', () => {
        const next = button.dataset.locale as Locale;
        if (next === locale) return;
        locale = next;
        storeLocale(next);
        applyLocale();
        options.onLocaleChange?.(locale, t(locale));
      });
    });
  };

  root.querySelector('[data-shell-legal]')?.addEventListener('click', () => {
    paintLegal();
    const explorer = markScienceCard(loadSuiteExplorer(), 'suite');
    saveSuiteExplorer(explorer);
    legalDialog.showModal();
  });
  root.querySelector('[data-shell-a11y]')?.addEventListener('click', () => {
    paintA11y();
    a11yDialog.showModal();
  });
  root.querySelectorAll('[data-close-a11y]').forEach((btn) => {
    btn.addEventListener('click', () => a11yDialog.close());
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      legalDialog.close();
      a11yDialog.close();
    }
  });

  applyLocale();

  return {
    getLocale: () => locale,
    getCopy: () => t(locale),
  };
}

export function shellMain(root: HTMLElement): HTMLElement {
  const main = root.querySelector<HTMLElement>('[data-shell-main]');
  if (!main) throw new Error('Shell main missing');
  return main;
}
