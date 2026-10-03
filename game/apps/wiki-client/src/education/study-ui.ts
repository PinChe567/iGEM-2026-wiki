import {
  itemsForGame,
  recordEducationAnswer,
  type EducationGameId,
  type EducationItem,
  type EducationLocale,
  type EducationPhase,
  type EducationStudySession,
} from '@suite/core/education';
import type { MessageTree } from '../i18n/messages';
import { downloadEducationCsv, downloadEducationJson } from './persist';

export type StudyCopy = MessageTree['study'];

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    if (ch === '&') return '&amp;';
    if (ch === '<') return '&lt;';
    if (ch === '>') return '&gt;';
    if (ch === '"') return '&quot;';
    return '&#39;';
  });
}

export function studyBannerHtml(copy: StudyCopy): string {
  return `<aside class="edu-banner" data-testid="study-banner">
    <strong>${escapeHtml(copy.banner)}</strong>
    <p>${escapeHtml(copy.bannerNote)}</p>
  </aside>`;
}

export function studyExportBarHtml(copy: StudyCopy): string {
  return `<div class="edu-export" data-testid="study-export">
    <p>${escapeHtml(copy.exportHint)}</p>
    <div class="edu-export-actions">
      <button type="button" class="ghost-button" data-edu-json data-testid="export-study-json">${escapeHtml(copy.exportJson)}</button>
      <button type="button" class="ghost-button" data-edu-csv data-testid="export-study-csv">${escapeHtml(copy.exportCsv)}</button>
    </div>
    <p class="edu-privacy">${escapeHtml(copy.privacy)}</p>
  </div>`;
}

export function bindStudyExport(root: ParentNode): void {
  root.querySelector('[data-edu-json]')?.addEventListener('click', () => downloadEducationJson());
  root.querySelector('[data-edu-csv]')?.addEventListener('click', () => downloadEducationCsv());
}

function itemCard(item: EducationItem, locale: EducationLocale, required: boolean): string {
  const options = item.options
    .map(
      (opt) => `<label class="edu-option">
        <input type="radio" name="${escapeHtml(item.id)}" value="${escapeHtml(opt.id)}" ${required ? 'required' : ''} />
        <span>${escapeHtml(opt.label[locale])}</span>
      </label>`,
    )
    .join('');
  return `<fieldset class="edu-item" data-item="${escapeHtml(item.id)}">
    <legend>${escapeHtml(item.prompt[locale])}</legend>
    ${options}
  </fieldset>`;
}

export function studyQuestionsHtml(args: {
  title: string;
  lead: string;
  items: readonly EducationItem[];
  locale: EducationLocale;
  copy: StudyCopy;
  submitLabel: string;
  allowSkip?: boolean;
}): string {
  const fields = args.items.map((item) => itemCard(item, args.locale, !item.optional)).join('');
  const skip = args.allowSkip
    ? `<button type="button" class="text-button" data-edu-skip data-testid="study-skip">${escapeHtml(args.copy.skipOptional)}</button>`
    : '';
  return `<form class="edu-form" data-testid="study-form">
    <h3>${escapeHtml(args.title)}</h3>
    <p>${escapeHtml(args.lead)}</p>
    ${fields}
    <div class="edu-form-actions">
      <button type="submit" class="primary-button" data-testid="study-continue">${escapeHtml(args.submitLabel)}</button>
      ${skip}
    </div>
  </form>`;
}

export function bindStudyQuestions(
  root: ParentNode,
  args: {
    items: readonly EducationItem[];
    session: EducationStudySession;
    phaseFor: (item: EducationItem) => EducationPhase;
    onDone: (session: EducationStudySession) => void;
  },
): void {
  const form = root.querySelector<HTMLFormElement>('[data-testid="study-form"]');
  const finish = (requireRequired: boolean) => {
    let next = args.session;
    for (const item of args.items) {
      const picked = form?.querySelector<HTMLInputElement>(`input[name="${item.id}"]:checked`);
      if (!picked) {
        if (requireRequired && !item.optional) return false;
        continue;
      }
      next = recordEducationAnswer(next, {
        studyItemId: item.id,
        phase: args.phaseFor(item),
        answer: picked.value,
      });
    }
    args.onDone(next);
    return true;
  };
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    finish(true);
  });
  root.querySelector('[data-edu-skip]')?.addEventListener('click', () => {
    finish(false);
  });
}

export function preItems(gameId: EducationGameId): EducationItem[] {
  return itemsForGame(gameId, 'pre');
}

export function postItems(gameId: EducationGameId): EducationItem[] {
  return [...itemsForGame(gameId, 'pre'), ...itemsForGame(gameId, 'transfer'), ...itemsForGame(gameId, 'feedback')];
}
