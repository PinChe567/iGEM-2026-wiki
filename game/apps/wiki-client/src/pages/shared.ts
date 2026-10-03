import type { Locale } from '../i18n/locale';
import type { MessageTree } from '../i18n/messages';

/** Wiki page nav for Education / About-style pages (not the game hub). */
export function wikiNavMarkup(copy: MessageTree, depth: 0 | 1): string {
  const prefix = depth === 0 ? './' : '../';
  return `<nav class="wiki-page-nav" aria-label="${escapeHtml(copy.pages.navEducation)}">
    <a href="${prefix}index.html">${escapeHtml(copy.shell.homeAria)}</a>
    <a href="${prefix}education/index.html">${escapeHtml(copy.pages.navEducation)}</a>
    <a href="${prefix}about/index.html">${escapeHtml(copy.legal.tabScience)}</a>
  </nav>`;
}

/** Social outbound links — removed from the game UI. */
export function socialOutboundMarkup(_locale: Locale): string {
  void _locale;
  return '';
}

export function loc(
  value: { 'zh-Hant': string; en: string },
  locale: Locale,
): string {
  return (locale === 'zh-Hant' ? value['zh-Hant'] : value.en).trim();
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
