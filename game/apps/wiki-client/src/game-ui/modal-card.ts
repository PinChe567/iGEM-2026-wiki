import { escapeHtml } from './escape';

export type GuideStep = {
  title: string;
  body: string;
};

export function modalCardHtml(args: {
  id: string;
  label: string;
  title: string;
  bodyHtml: string;
  closeLabel: string;
  closeAria?: string;
  testId?: string;
}): string {
  const testAttr = args.testId ? ` data-testid="${escapeHtml(args.testId)}"` : '';
  const closeAria = args.closeAria ?? args.closeLabel;
  return `<dialog id="${escapeHtml(args.id)}" class="modal guide-modal"${testAttr}>
    <div class="modal-header">
      <div>
        <span class="section-label">${escapeHtml(args.label)}</span>
        <h2>${escapeHtml(args.title)}</h2>
      </div>
      <button class="close-button" data-close="${escapeHtml(args.id)}" type="button" aria-label="${escapeHtml(closeAria)}">\u00d7</button>
    </div>
    ${args.bodyHtml}
    <button class="primary-button full-button" data-close="${escapeHtml(args.id)}" type="button">${escapeHtml(args.closeLabel)}</button>
  </dialog>`;
}

export function guideListHtml(steps: readonly GuideStep[]): string {
  return `<ol class="guide-list">${steps
    .map((step) => `<li><b>${escapeHtml(step.title)}</b><span>${escapeHtml(step.body)}</span></li>`)
    .join('')}</ol>`;
}

export function openModal(id: string, root: ParentNode = document): void {
  root.querySelector<HTMLDialogElement>(`#${id}`)?.showModal();
}

export function closeModal(id: string, root: ParentNode = document): void {
  root.querySelector<HTMLDialogElement>(`#${id}`)?.close();
}

export function bindModalCloses(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-close]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.close;
      if (!id) return;
      root.querySelector<HTMLDialogElement>(`#${id}`)?.close();
    });
  });
}
