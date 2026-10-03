import { escapeHtml } from './escape';

export type LevelCardModel = {
  id: string;
  index: string;
  label: string;
  blurb: string;
  testId?: string;
};

export function levelCardsHtml(args: {
  label: string;
  cards: readonly LevelCardModel[];
  selectedId: string;
}): string {
  return `<div class="level-cards" role="radiogroup" aria-label="${escapeHtml(args.label)}">${args.cards
    .map((card) => {
      const active = card.id === args.selectedId;
      const testId = card.testId ?? `level-${card.id}`;
      return `<button class="level-card${active ? ' active' : ''}" type="button" role="radio" aria-checked="${active}" data-level="${escapeHtml(card.id)}" data-testid="${escapeHtml(testId)}"><span>${escapeHtml(card.index)}</span><strong>${escapeHtml(card.label)}</strong><small>${escapeHtml(card.blurb)}</small></button>`;
    })
    .join('')}</div>`;
}

export function bindLevelCards(root: ParentNode, onSelect: (id: string) => void): void {
  root.querySelectorAll<HTMLButtonElement>('[data-level]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.level;
      if (id) onSelect(id);
    });
  });
}
