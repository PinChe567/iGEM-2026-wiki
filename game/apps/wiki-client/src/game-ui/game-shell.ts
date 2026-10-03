import { escapeHtml } from './escape';

export type GameHeader = {
  gameNumber: string;
  mode?: string;
  title: string;
  /** Raw HTML for titles that already include emphasis markup. */
  titleHtml?: string;
  titleId?: string;
  lead: string;
  leadId?: string;
  eyebrowId?: string;
  chips?: readonly string[];
};

export function gameHeaderKicker(gameNumber: string, mode?: string): string {
  return mode ? `GAME ${gameNumber} \u00b7 ${mode}` : `GAME ${gameNumber}`;
}

export function gameHeaderHtml(header: GameHeader): string {
  const kicker = gameHeaderKicker(header.gameNumber, header.mode);
  const title = header.titleHtml ?? escapeHtml(header.title);
  const titleId = header.titleId ? ` id="${escapeHtml(header.titleId)}"` : '';
  const eyebrowId = header.eyebrowId ?? 'introEyebrow';
  const leadId = header.leadId ?? 'introLead';
  const chips = header.chips?.length
    ? `<div class="intro-chips" aria-label="Game facts">${header.chips
        .map((chip) => `<span><b>${escapeHtml(chip)}</b></span>`)
        .join('')}</div>`
    : '';
  return `<section class="intro">
    <div class="eyebrow" id="${escapeHtml(eyebrowId)}"><span></span> ${escapeHtml(kicker)}</div>
    <h1${titleId}>${title}</h1>
    <p id="${escapeHtml(leadId)}">${escapeHtml(header.lead)}</p>
    ${chips}
  </section>`;
}

export type ModeTab = {
  id: string;
  label: string;
  buttonId?: string;
};

export function modeTabsHtml(args: {
  tabs: readonly ModeTab[];
  selectedId: string;
  ariaLabel: string;
  id?: string;
  /** When false, emit only the tab buttons (host already has .level-tabs). */
  wrap?: boolean;
}): string {
  const buttons = args.tabs
    .map((tab) => {
      const active = tab.id === args.selectedId;
      const id = tab.buttonId ? ` id="${escapeHtml(tab.buttonId)}"` : '';
      return `<button class="level-tab${active ? ' active' : ''}"${id} type="button" role="tab" data-mode="${escapeHtml(tab.id)}" aria-selected="${active}">${escapeHtml(tab.label)}</button>`;
    })
    .join('');
  if (args.wrap === false) return buttons;
  return `<div class="level-tabs" id="${escapeHtml(args.id ?? 'modeTabs')}" role="tablist" aria-label="${escapeHtml(args.ariaLabel)}">${buttons}</div>`;
}

export function labHeaderHtml(args: {
  gameLabel: string;
  heading: string;
  headingId?: string;
  actionsHtml: string;
}): string {
  const headingId = args.headingId ?? 'chooseRun';
  return `<div class="level-header"><div><span class="section-label">${escapeHtml(args.gameLabel)}</span><h2 id="${escapeHtml(headingId)}">${escapeHtml(args.heading)}</h2></div><div class="lab-actions">${args.actionsHtml}</div></div>`;
}

export function gameStageHtml(args?: { settingsHtml?: string; playHtml?: string }): string {
  return `<div class="game-card"><aside class="control-panel" id="settingsPanel">${args?.settingsHtml ?? ''}</aside><section class="play-area" id="playArea" aria-live="polite">${args?.playHtml ?? ''}</section></div>`;
}

export function readyCopyHtml(args: {
  kicker: string;
  title: string;
  lead?: string;
  extraHtml?: string;
  startId?: string;
  startTestId?: string;
  startLabel: string;
  stateTestId?: string;
}): string {
  const startId = args.startId ?? 'start';
  const testId = args.startTestId ?? 'start';
  const stateTestId = args.stateTestId ?? 'ready';
  return `<div class="ready-state" data-testid="${escapeHtml(stateTestId)}"><div class="ready-copy"><span class="section-label">${escapeHtml(args.kicker)}</span><h3>${escapeHtml(args.title)}</h3>${args.lead ? `<p>${escapeHtml(args.lead)}</p>` : ''}${args.extraHtml ?? ''}<button class="primary-button" id="${escapeHtml(startId)}" data-testid="${escapeHtml(testId)}" type="button">${escapeHtml(args.startLabel)} <span class="arrow" aria-hidden="true">\u2192</span></button></div></div>`;
}

export function advancedSettingsHtml(args: {
  summary: string;
  body: string;
  open?: boolean;
  id?: string;
}): string {
  return `<details class="advanced-settings" id="${escapeHtml(args.id ?? 'advanced')}"${args.open ? ' open' : ''}><summary>${escapeHtml(args.summary)}</summary>${args.body}</details>`;
}

export function howToPlayButtonHtml(label: string, id = 'guideButton'): string {
  return `<button class="ghost-button compact-label" id="${escapeHtml(id)}" type="button"><span>?</span> ${escapeHtml(label)}</button>`;
}

export function textActionButtonHtml(args: { id: string; label: string; extra?: string }): string {
  const extra = args.extra ? ` ${args.extra}` : '';
  return `<button class="text-button" id="${escapeHtml(args.id)}" type="button"${extra}>${escapeHtml(args.label)}</button>`;
}

export { escapeHtml };
