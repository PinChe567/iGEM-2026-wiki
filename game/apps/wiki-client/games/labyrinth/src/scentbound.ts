import {
  ADVENTURE_GAME_VERSION,
  ADVENTURE_MODULE_IDS,
  ADVENTURE_PRESETS,
  ADVENTURE_SEAL_IDS,
  compassAngle,
  computeAdventureScore,
  createAdventureSession,
  currentObjective,
  emptyAdventureIntent,
  findInteractionTarget,
  LABYRINTH_STORAGE_KEY,
  nearAnyCore,
  roomIdAt,
  parseLabyrinthStoredJson,
  recordSoloBest,
  requiredOdorIds,
  secretCount,
  setActiveScentProfile,
  solveAdventurePuzzle,
  tickAdventure,
  type AdventureDifficulty,
  type AdventureModuleId,
  type AdventureSession,
} from '@suite/core/labyrinth';
import { getOdorById } from '@suite/content';
import type { Locale } from '../../../src/i18n/locale';
import type { MessageTree } from '../../../src/i18n/messages';
import {
  advancedSettingsHtml,
  bindLevelCards,
  bindModalCloses,
  gameHeaderKicker,
  levelCardsHtml,
  openModal,
  readyCopyHtml,
  resultLayoutHtml,
} from '../../../src/game-ui';
import {
  loadSuiteExplorer,
  markScienceCard,
  saveSuiteExplorer,
} from '../../../src/progress/explorer';
import { consumeScienceHash } from '../../../src/science-hash';
import { createAdventureInput } from './input-adventure';
import { createMazeRenderer, type MazeRenderOpts } from './render-maze';
import { compactClueKey, hintIdleMs, majorWing } from './nav-presentation';
import { createMazeFx, ingestMazeFx, triggerSlash } from './fx';
import { createLabyrinthSfx } from './sfx';

type Copy = MessageTree['scentbound'];

type Options = {
  root: HTMLElement;
  getCopy: () => Copy;
  getUi: () => MessageTree['gameUi'];
  getLocale: () => Locale;
};

const MODULE_LABEL: Record<AdventureModuleId, { en: string; zh: string }> = {
  'receptor-cartridge': { en: 'Receptor', zh: '受體匣' },
  'optical-reader': { en: 'Optical Reader', zh: '光學讀取' },
  'signal-filter': { en: 'Signal Filter', zh: '訊號濾波' },
  'pattern-decoder': { en: 'Pattern Decoder', zh: '圖樣解碼' },
};

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function odorIcon(id: string, locale: Locale): string {
  const odor = getOdorById(id);
  const index = ['banana', 'lemon', 'rose', 'coffee', 'mint', 'strawberry', 'chocolate', 'lavender', 'orange', 'cinnamon', 'apple', 'vanilla', 'bread', 'pine', 'popcorn', 'peach'].indexOf(id);
  const pos = index >= 0 ? `${(index % 5) * 25}% ${Math.floor(index / 5) * (100 / 3)}%` : '0 0';
  const name = odor?.name[locale] ?? id;
  return `<span class="sb-odor" style="background-position:${pos}" role="img" aria-label="${escape(name)}"></span>`;
}

export function startScentbound(options: Options): { destroy: () => void } {
  const root = options.root;
  let stored = parseLabyrinthStoredJson(localStorage.getItem(LABYRINTH_STORAGE_KEY));
  let difficulty: AdventureDifficulty = 'junior';
  let seed = `sb-${Date.now().toString(36)}`;
  let advancedOpen = false;
  let session: AdventureSession | undefined;
  let raf = 0;
  let lastTs = 0;
  let hintLevel = 0;
  let lastProgressKey = '';
  let lastProgressAt = 0;
  let showHintPrompt = false;
  let libraryId: string | null = null;
  let lastPuzzlePaint = '';
  let scannedOnce = false;
  let feedback: { key: string; title: string; body: string; until: number; odorId?: string } | null = null;
  let lastWheelPaint = '';
  let lastLatchStamp = '';
  let lastCueStamp = '';
  let lastWing = '';
  let sealBanner: { title: string; marks: string; until: number } | null = null;
  const fx = createMazeFx();
  const sfx = createLabyrinthSfx();
  const input = createAdventureInput();
  let view: {
    resize: (w: number, h: number) => void;
    draw: (session: AdventureSession, opts: MazeRenderOpts) => void;
    dispose?: () => void;
  } | null = null;
  let onWinResize: (() => void) | null = null;

  const text = () => options.getCopy();
  const ui = () => options.getUi();
  const locale = () => options.getLocale();

  const save = () => {
    try {
      localStorage.setItem(LABYRINTH_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      /* optional */
    }
  };

  const applyA11y = () => {
    document.documentElement.classList.toggle('high-contrast', stored.highContrast);
    document.documentElement.classList.toggle('reduced-effects', stored.reducedMotion);
    document.documentElement.classList.toggle('low-darkness', stored.lowDarkness);
  };

  function paintChrome(): void {
    const c = text();
    const eyebrow = document.querySelector('#introEyebrow');
    const title = document.querySelector('#introTitle');
    const lead = document.querySelector('#introLead');
    const heading = document.querySelector('#chooseRun');
    if (eyebrow) eyebrow.innerHTML = `<span></span> ${gameHeaderKicker('02')}`;
    if (title) title.innerHTML = locale() === 'en' ? 'Scentbound <em>Labyrinth</em>' : '<em>氣味迷宮</em>';
    if (lead) lead.textContent = c.lead;
    if (heading) heading.textContent = c.chooseLevel;
    const chips = document.querySelector('#introChips');
    if (chips) chips.innerHTML = `<span><b>${c.junior}</b></span><span><b>${c.standard}</b></span><span><b>${c.challenge}</b></span>`;
  }

  function setup(): void {
    stopLoop();
    if (onWinResize) {
      window.removeEventListener('resize', onWinResize);
      onWinResize = null;
    }
    view?.dispose?.();
    view = null;
    session = undefined;
    hintLevel = 0;
    showHintPrompt = false;
    const c = text();
    const g = ui();
    paintChrome();
    const settings = root.querySelector('#settingsPanel');
    const play = root.querySelector('#playArea');
    const card = root.querySelector('.game-card');
    if (!(settings instanceof HTMLElement) || !(play instanceof HTMLElement)) return;
    card?.classList.remove('maze-live');
    settings.innerHTML = `<h3>${escape(c.chooseLevel)}</h3>
      ${levelCardsHtml({
        label: c.chooseLevel,
        selectedId: difficulty,
        cards: [
          { id: 'junior', index: '01', label: c.junior, blurb: c.juniorBlurb },
          { id: 'standard', index: '02', label: c.standard, blurb: c.standardBlurb },
          { id: 'challenge', index: '03', label: c.challenge, blurb: c.challengeBlurb },
        ],
      })}
      ${advancedSettingsHtml({
        summary: g.advanced,
        open: advancedOpen,
        body: `
          <div class="seed-row"><label>${escape(c.seed)} <input id="seed-input" data-testid="seed-input" type="text" value="${escape(seed)}" spellcheck="false" autocomplete="off" /></label>
          <button class="secondary-button" id="newSeed" type="button">${escape(c.randomize)}</button></div>
          <div class="preference-row">
            <label><input id="reduced" type="checkbox" ${stored.reducedMotion ? 'checked' : ''}/> ${escape(c.reducedMotion)}</label>
            <label><input id="contrast" type="checkbox" ${stored.highContrast ? 'checked' : ''}/> ${escape(c.highContrast)}</label>
            <label><input id="lowDark" type="checkbox" ${stored.lowDarkness ? 'checked' : ''}/> ${escape(c.lowDarkness)}</label>
            <label><input id="muted" type="checkbox" ${stored.muted ? 'checked' : ''}/> ${escape(c.muteSfx)}</label>
          </div>`,
      })}`;
    play.innerHTML = readyCopyHtml({
      kicker: `GAME 02 · ${difficultyLabel()}`,
      title: c.title,
      lead: c.readyLead,
      startId: 'start-adventure',
      startTestId: 'start-adventure',
      startLabel: g.startGame,
      stateTestId: 'ready',
    });
    bindLevelCards(settings, (id) => {
      difficulty = id as AdventureDifficulty;
      setup();
    });
    settings.querySelector<HTMLDetailsElement>('#advanced')?.addEventListener('toggle', (e) => {
      advancedOpen = (e.target as HTMLDetailsElement).open;
    });
    settings.querySelector('#newSeed')?.addEventListener('click', () => {
      seed = `sb-${Date.now().toString(36)}`;
      setup();
    });
    settings.querySelector('#seed-input')?.addEventListener('change', (e) => {
      const v = (e.target as HTMLInputElement).value.trim();
      if (v) seed = v;
    });
    settings.querySelector('#reduced')?.addEventListener('change', (e) => {
      stored = { ...stored, reducedMotion: (e.target as HTMLInputElement).checked };
      save();
      applyA11y();
    });
    settings.querySelector('#contrast')?.addEventListener('change', (e) => {
      stored = { ...stored, highContrast: (e.target as HTMLInputElement).checked };
      save();
      applyA11y();
    });
    settings.querySelector('#lowDark')?.addEventListener('change', (e) => {
      stored = { ...stored, lowDarkness: (e.target as HTMLInputElement).checked };
      save();
      applyA11y();
    });
    settings.querySelector('#muted')?.addEventListener('change', (e) => {
      stored = { ...stored, muted: (e.target as HTMLInputElement).checked };
      save();
    });
    play.querySelector('#start-adventure')?.addEventListener('click', () => {
      sfx.unlock();
      startRun();
    });
    fillModals();
  }

  function difficultyLabel(): string {
    const c = text();
    if (difficulty === 'junior') return c.junior;
    if (difficulty === 'challenge') return c.challenge;
    return c.standard;
  }

  function fillModals(): void {
    const c = text();
    const how = root.querySelector('#howBody');
    const science = root.querySelector('#scienceBody');
    if (how) {
      how.innerHTML = `<div class="sb-how" data-testid="how-cards">
        <article><b>${escape(c.move)}</b><span>WASD</span></article>
        <article><b>${escape(c.attack)}</b><span>SPACE</span></article>
        <article><b>${escape(c.scan)}</b><span>Q</span></article>
        <article><b>${escape(c.interact)}</b><span>E</span></article>
      </div>`;
    }
    if (science) science.innerHTML = `<p>${escape(c.scienceBody)}</p>`;
  }

  function progressKey(s: AdventureSession): string {
    return [
      s.player.collectedModules.join(','),
      s.player.learnedOdorIds.join(','),
      s.unlockedPassageIds.join(','),
      s.player.solvedPuzzleIds.join(','),
      s.player.restoredSealIds.join(','),
      String(s.player.exitPatternSolved),
      String(s.player.inspectedExit),
    ].join('|');
  }

  function startRun(): void {
    stopLoop();
    if (onWinResize) {
      window.removeEventListener('resize', onWinResize);
      onWinResize = null;
    }
    view?.dispose?.();
    view = null;
    const play = root.querySelector('#playArea');
    const card = root.querySelector('.game-card');
    if (!(play instanceof HTMLElement)) return;
    card?.classList.add('maze-live');
    session = createAdventureSession({ seed, difficulty });
    lastProgressKey = progressKey(session);
    lastProgressAt = 0;
    hintLevel = 0;
    showHintPrompt = false;
    lastPuzzlePaint = '';
    scannedOnce = false;
    feedback = null;
    lastWheelPaint = '';
    sealBanner = null;
    lastLatchStamp = '';
    lastCueStamp = '';
    lastWing = '';
    play.innerHTML = playHtml();
    const canvas = play.querySelector<HTMLCanvasElement>('#maze');
    if (!canvas) return;
    view = createMazeRenderer(canvas, play.querySelector<HTMLCanvasElement>('#minimap'));
    const fit = () => {
      const box = canvas.getBoundingClientRect();
      view?.resize(Math.max(1, play.clientWidth), Math.max(420, Math.round(box.height)));
    };
    fit();
    onWinResize = fit;
    window.addEventListener('resize', onWinResize);
    input.attach(play);
    lastTs = performance.now();
    const loop = (now: number) => {
      if (!session || !view) return;
      const dt = Math.min(50, now - lastTs);
      lastTs = now;
      const snap = input.sample();
      if (snap.hintPressed) bumpHint();
      if (snap.libraryPressed) toggleLibrary();
      session = tickAdventure(session, snap, dt);
      if (session.player.scan.active) scannedOnce = true;
      const reduced = stored.reducedMotion || document.documentElement.classList.contains('reduced-motion');
      ingestMazeFx(fx, session, now, reduced);
      if (snap.attackPressed && session.phase === 'playing') triggerSlash(fx, session.player.facing, now, reduced);
      playCue(session);
      latchFeedback(session);
      if (session.phase === 'victory') {
        finish(session);
        return;
      }
      const key = progressKey(session);
      if (key !== lastProgressKey) {
        lastProgressKey = key;
        lastProgressAt = session.elapsedMs;
        hintLevel = 0;
        showHintPrompt = false;
      } else if (session.elapsedMs - lastProgressAt > hintIdleMs(difficulty, ADVENTURE_PRESETS[difficulty].hintIdleMs)) {
        showHintPrompt = true;
      }
      const nudgeScan = !scannedOnce && session.elapsedMs > 8000 && session.elapsedMs < 45000;
      view.draw(session, {
        lowDarkness: stored.lowDarkness,
        highContrast: stored.highContrast,
        reducedMotion: reduced,
        hintLevel,
        pulseMs: now,
        nudgeScan,
        fx,
      });
      paintHud(play, session);
      if (session.phase === 'puzzle' && session.activePuzzle) paintPuzzle(play, session);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    play.querySelector('#pauseBtn')?.addEventListener('click', () => {
      session = tickAdventure(session!, { ...emptyAdventureIntent(), pausePressed: true }, 0);
    });
    play.querySelector('#libraryBtn')?.addEventListener('click', () => toggleLibrary());
    play.querySelector('#hintBtn')?.addEventListener('click', () => bumpHint());
    bindScentWheel(play);
  }

  function playHtml(): string {
    const c = text();
    return `<div class="sb-play${difficulty === 'junior' ? ' is-junior' : ''}" data-testid="maze-play">
      <div class="sb-hud">
        <div class="sb-objective" data-testid="objective">
          <div class="sb-goal-title">${escape(c.goalTitle)}</div>
          <div class="sb-seals" data-testid="seal-slots" data-tools="true"></div>
          <div class="sb-clue-label">${escape(c.currentClue)}</div>
          <div class="sb-obj-row"><strong data-testid="current-clue"></strong></div>
          <div class="sr-only" data-testid="current-wing"></div>
        </div>
        <div class="sb-status">
          <div class="sb-hearts" data-testid="hearts"></div>
          <div class="sb-scan" data-testid="scan-status"></div>
          <div class="sb-active-scent" data-testid="active-scent"></div>
          <button class="text-button" id="libraryBtn" type="button" aria-label="${escape(c.library)}">${escape(c.library)}</button>
          <button class="text-button" id="hintBtn" type="button" aria-label="${escape(c.hint)}">H</button>
        </div>
      </div>
      <canvas id="maze" data-testid="maze-canvas" aria-label="${escape(c.title)}"></canvas>
      ${
        difficulty === 'junior'
          ? '<canvas class="sb-minimap" id="minimap" data-testid="minimap" width="220" height="132" aria-hidden="true"></canvas>'
          : ''
      }
      <div class="sb-wing-title" data-testid="wing-title" hidden>
        <strong></strong>
        <span></span>
      </div>
      <div class="sb-scent-wheel" data-testid="scent-wheel"></div>
      <div class="sb-feedback" data-testid="game-feedback" hidden></div>
      <div class="sb-seal-banner" data-testid="seal-banner" hidden></div>
      <div class="sb-prompt" data-testid="context-prompt"></div>
      <p class="sb-hint-prompt" data-testid="hint-prompt" hidden>${escape(c.needHint)}</p>
      <div class="sb-mobile" aria-label="${escape(c.mobileControls)}">
        <div class="sb-joy" data-joystick aria-label="${escape(c.move)}"><i data-joystick-knob></i><span>${escape(c.move)}</span></div>
        <div class="sb-btns">
          <button type="button" data-attack-btn aria-label="${escape(c.attack)}">${escape(c.attack)}</button>
          <button type="button" data-scan-btn aria-label="${escape(c.scan)}">${escape(c.scan)}</button>
          <button type="button" data-interact-btn aria-label="${escape(c.interact)}">${escape(c.interact)}</button>
        </div>
      </div>
      <div class="sb-overlay" id="pauseOverlay" hidden role="dialog" aria-label="${escape(c.pause)}">
        <div>
          <strong>${escape(c.pause)}</strong>
          <button class="primary-button" id="pauseBtn" type="button">${escape(c.resume)}</button>
        </div>
      </div>
      <div class="sb-overlay sb-puzzle" id="puzzleOverlay" hidden></div>
      <dialog class="modal guide-modal" id="libraryDialog"></dialog>
    </div>`;
  }

  function paintHud(play: HTMLElement, s: AdventureSession): void {
    const c = text();
    const obj = currentObjective(s);
    const copy = c as Record<string, string>;
    const seals = play.querySelector('[data-testid="seal-slots"]');
    if (seals) {
      const tools: Array<(typeof ADVENTURE_MODULE_IDS)[number]> = [
        'receptor-cartridge',
        'optical-reader',
        'signal-filter',
      ];
      seals.innerHTML = tools
        .map((id) => {
          const on = s.player.collectedModules.includes(id);
          const label = locale() === 'en' ? MODULE_LABEL[id].en : MODULE_LABEL[id].zh;
          return `<span class="${on ? 'on' : ''}" title="${escape(label)}">${on ? '◆' : '◇'}</span>`;
        })
        .join('');
    }
    const wing = play.querySelector('[data-testid="current-wing"]');
    if (wing) {
      const room = roomIdAt(Math.floor(s.player.position.x), Math.floor(s.player.position.y));
      const key = room === 'storage' ? 'wingStorage' : room === 'greenhouse' ? 'wingGreenhouse' : room === 'signal' ? 'wingSignal' : 'wingAtrium';
      wing.textContent = copy[key] ?? key;
    }
    const clue = play.querySelector('[data-testid="current-clue"]');
    if (clue) {
      const compact = compactClueKey(obj.id);
      clue.textContent = (compact && copy[compact]) || copy[obj.labelKey] || obj.labelKey;
    }
    const activeScent = play.querySelector<HTMLElement>('[data-testid="active-scent"]');
    if (activeScent) {
      const id = s.player.activeScentProfileId;
      activeScent.innerHTML = id ? odorIcon(id, locale()) : '';
      activeScent.hidden = !id;
    }
    const wheel = play.querySelector('[data-testid="scent-wheel"]');
    const wheelKey = `${s.player.learnedOdorIds.join(',')}|${s.player.activeScentProfileId ?? ''}`;
    if (wheel && wheelKey !== lastWheelPaint) {
      lastWheelPaint = wheelKey;
      wheel.innerHTML = s.player.learnedOdorIds
        .map((id, i) => {
          const active = s.player.activeScentProfileId === id ? ' is-active' : '';
          return `<button type="button" class="sb-scent-btn${active}" data-scent="${escape(id)}" aria-pressed="${s.player.activeScentProfileId === id}">${odorIcon(id, locale())}<em>${i + 1}</em></button>`;
        })
        .join('');
    }
    const hearts = play.querySelector('[data-testid="hearts"]');
    if (hearts) {
      hearts.innerHTML = Array.from({ length: s.player.maxHealth }, (_, i) =>
        `<i class="${i < s.player.health ? 'on' : ''}" aria-hidden="true"></i>`,
      ).join('');
      hearts.setAttribute('aria-label', `${s.player.health}/${s.player.maxHealth}`);
    }
    const scan = play.querySelector('[data-testid="scan-status"]');
    if (scan) {
      const charges = s.player.inventory.scanCharge;
      const cool = s.player.scan.cooldownRemainingMs;
      const nudge = !scannedOnce && s.elapsedMs > 8000 && s.elapsedMs < 45000;
      scan.classList.toggle('is-nudge', nudge);
      scan.textContent = s.player.scan.active
        ? c.scentVision
        : cool > 0
          ? `${c.scan} ${Math.ceil(cool / 1000)}s`
          : charges === null
            ? c.scanReady
            : `${c.scan} ${charges}`;
    }
    const mods = play.querySelector('[data-testid="modules"]');
    if (mods) {
      const got = s.player.collectedModules.length;
      const names = ADVENTURE_MODULE_IDS.filter((id) => s.player.collectedModules.includes(id))
        .map((id) => (locale() === 'en' ? MODULE_LABEL[id].en : MODULE_LABEL[id].zh))
        .join(', ');
      mods.innerHTML = `<span class="on" title="${escape(names)}">${got}/${ADVENTURE_MODULE_IDS.length}</span>`;
      mods.setAttribute(
        'aria-label',
        `${c.modulesAssembled} ${got}/${ADVENTURE_MODULE_IDS.length}`,
      );
    }
    const prompt = play.querySelector('[data-testid="context-prompt"]');
    const aff = findInteractionTarget(s);
    let promptText = '';
    if (aff.disabledReason && (!aff.enabled || aff.input === 'Q')) {
      promptText = feedbackCopy(s, aff.disabledReason).body || copyPrompt(c as Record<string, string>, aff.labelKey);
    }
    const bloom = nearbyBloom(s);
    if (!promptText && bloom) {
      promptText =
        s.difficulty === 'junior'
          ? c.promptBloomJunior
          : bloom.revealed || s.player.scan.active
            ? c.promptBloomAttack
            : c.promptBloomScan;
    }
    if (prompt) prompt.textContent = promptText;
    paintFeedback(play);
    paintSealBanner(play);
    const title = play.querySelector<HTMLElement>('[data-testid="wing-title"]');
    const room = roomIdAt(Math.floor(s.player.position.x), Math.floor(s.player.position.y));
    const major = majorWing(room);
    if (title && major && major !== lastWing) {
      const names: Record<string, { title: string; seal: string }> = {
        storage: { title: copy.wingTitleStorage ?? 'COFFEE STORAGE', seal: copy.wingSealStorage ?? 'Storage Seal' },
        greenhouse: { title: copy.wingTitleGreenhouse ?? 'GREENHOUSE', seal: copy.wingSealGarden ?? 'Garden Seal' },
        signal: { title: copy.wingTitleSignal ?? 'SIGNAL LAB', seal: copy.wingSealSignal ?? 'Signal Seal' },
      };
      const pack = names[major]!;
      const strong = title.querySelector('strong');
      const span = title.querySelector('span');
      if (strong) strong.textContent = pack.title;
      if (span) span.textContent = pack.seal;
      title.hidden = false;
      title.classList.remove('is-out');
      window.setTimeout(() => {
        title.classList.add('is-out');
        window.setTimeout(() => {
          title.hidden = true;
        }, 280);
      }, stored.reducedMotion ? 200 : 1000);
    }
    if (major) lastWing = major;
    else if (room === 'atrium') lastWing = 'atrium';
    const hint = play.querySelector<HTMLElement>('[data-testid="hint-prompt"]');
    if (hint) {
      const obj = currentObjective(s);
      hint.dataset.hintLevel = String(hintLevel);
      hint.dataset.hintObjective = obj.id;
      hint.classList.toggle('is-direct', hintLevel >= 3 || Boolean(bloom));
      if (hintLevel >= 1 || bloom) {
        hint.hidden = false;
        hint.textContent = hintMessage(s, Math.max(hintLevel, bloom ? 3 : 0));
      } else if (promptText && !bloom) {
        hint.hidden = true;
      } else {
        hint.hidden = !showHintPrompt;
        hint.textContent = c.needHint;
        hint.classList.remove('is-direct');
      }
    }
    const pause = play.querySelector<HTMLElement>('#pauseOverlay');
    if (pause) pause.hidden = s.phase !== 'paused';
    const puzzle = play.querySelector<HTMLElement>('#puzzleOverlay');
    if (puzzle && s.phase !== 'puzzle') {
      puzzle.hidden = true;
      lastPuzzlePaint = '';
      puzzle.dataset.lock = '';
    }
  }

  function copyPrompt(c: Record<string, string>, key: string): string {
    return c[key] ?? c.promptInteract ?? '';
  }

  function feedbackCopy(s: AdventureSession, key: string | null): { title: string; body: string } {
    const c = text() as Record<string, string>;
    if (!key) return { title: '', body: '' };
    const odor = (id: string) => getOdorById(id)?.name[locale()] ?? id.toUpperCase();
    if (key === 'learned') {
      const id = s.lastFeedback.learnedOdorId ?? s.player.activeScentProfileId ?? '';
      return { title: odor(id).toUpperCase(), body: c.fbLearned };
    }
    if (key === 'module-online') {
      const last = s.player.collectedModules[s.player.collectedModules.length - 1];
      const label = last ? (locale() === 'en' ? MODULE_LABEL[last].en : MODULE_LABEL[last].zh) : c.fbModule;
      return { title: label.toUpperCase(), body: c.fbModule };
    }
    if (key === 'seal-restored') {
      const id = s.lastFeedback.sealId ?? s.player.restoredSealIds[s.player.restoredSealIds.length - 1] ?? 'storage';
      const titles: Record<string, string> = {
        storage: c.sealStorage,
        garden: c.sealGarden,
        signal: c.sealSignal,
      };
      const restored = ADVENTURE_SEAL_IDS.map((sid) => (s.player.restoredSealIds.includes(sid) ? '◆' : '◇')).join(' ');
      return { title: titles[id] ?? c.fbSealRestored, body: restored };
    }
    if (key.endsWith('-profile-required')) {
      const id = key.replace(/-profile-required$/, '');
      const named: Record<string, string> = {
        coffee: c.fbCoffeeRequired,
        rose: c.fbRoseRequired,
        mint: c.fbMintRequired,
        lemon: c.fbLemonRequired,
        pine: c.fbPineRequired,
        banana: c.fbBananaRequired,
      };
      return { title: '', body: named[id] ?? `${id.toUpperCase()} profile required` };
    }
    const map: Record<string, { title?: string; body: string }> = {
      'nothing-nearby': { body: c.fbNothing },
      'scan-surface-first': { body: c.fbScanFirst },
      'coffee-profile-required': { body: c.fbCoffeeRequired },
      'rose-profile-required': { body: c.fbRoseRequired },
      'mint-profile-required': { body: c.fbMintRequired },
      'lemon-profile-required': { body: c.fbLemonRequired },
      'pine-profile-required': { body: c.fbPineRequired },
      'banana-profile-required': { body: c.fbBananaRequired },
      'already-searched': { body: c.fbAlreadySearched },
      'already-learned': { body: c.fbAlreadyLearned },
      'already-open': { body: c.fbAlreadyOpen },
      'no-matching-pattern': { body: c.fbNoMatch },
      opened: { body: c.fbOpened },
      locked: { body: c.fbLocked },
      checkpoint: { body: c.fbCheckpoint },
      mimic: { body: c.fbMimic },
      'decay-reveal': { body: c.fbDecay },
      'secret-found': { title: c.fbSecret, body: c.fbSecret },
      'pile-clue': { body: c.fbPileClue },
      'restore-seals': { title: c.restoreSeals, body: '◆ ◇ ◇' },
      'seal-restored': { body: c.fbSealRestored },
      'thorn-open': { body: c.fbThornOpen },
      'decoder-offline': { body: c.fbDecoderOffline },
      'need-receptor': { body: c.fbNeedReceptor },
      'need-optical': { body: c.fbNeedOptical },
      'need-filter': { body: c.fbNeedFilter },
      'profile-selected': { body: c.fbProfileSelected },
      'no-scan-charge': { body: c.fbNoScan },
      'signal-seal-locked': { body: c.fbSignalLocked },
      'bloom-wrong-core': { body: c.fbBloomWrongCore },
      'seal-already': { body: c.fbSealAlready },
      'lock-open': { body: c.fbLockOpen },
      'skill-miss': { body: c.skillMiss },
      'pattern-miss': { body: c.patternMiss },
      'skill-hit': { body: c.skillHit },
      'pattern-hit': { body: c.patternHit },
    };
    const row = map[key];
    if (!row) return { title: '', body: c[key] ?? key };
    return { title: row.title ?? '', body: row.body };
  }

  function latchFeedback(s: AdventureSession): void {
    const key = s.lastFeedback.message;
    if (!key) return;
    if (key === 'scan' && !s.lastFeedback.learnedOdorId && !s.lastFeedback.openedId) return;
    if (key === 'skill-hit' || key === 'pattern-hit' || key === 'puzzle') return;
    const stamp = `${key}|${s.lastFeedback.openedId ?? ''}|${s.lastFeedback.learnedOdorId ?? ''}|${s.lastFeedback.sealId ?? ''}|${s.lastFeedback.unlockedPassageId ?? ''}`;
    if (stamp === lastLatchStamp) return;
    lastLatchStamp = stamp;
    const view = feedbackCopy(s, key);
    if (!view.body && !view.title) return;
    feedback = {
      key,
      title: view.title,
      body: view.body,
      until: performance.now() + (key === 'learned' || key === 'seal-restored' ? 2000 : 1600),
      odorId: s.lastFeedback.learnedOdorId ?? undefined,
    };
    if (key === 'seal-restored') {
      sealBanner = { title: view.title, marks: view.body, until: performance.now() + 2200 };
    }
  }

  function playCue(s: AdventureSession): void {
    const fb = s.lastFeedback;
    const stamp = `${fb.message ?? ''}|${fb.openedId ?? ''}|${fb.learnedOdorId ?? ''}|${fb.sealId ?? ''}|${fb.unlockedPassageId ?? ''}|${fb.playerDamaged}|${fb.hitEnemyIds.join(',')}`;
    if (!fb.message && !fb.playerDamaged && fb.hitEnemyIds.length === 0) return;
    if (stamp === lastCueStamp) return;
    lastCueStamp = stamp;
    const m = fb.message;
    if (m === 'scan') sfx.play('scan', stored.muted);
    else if (m === 'learned') sfx.play('pickup', stored.muted);
    else if (m === 'opened' || m === 'module-online') sfx.play('chest', stored.muted);
    else if (m === 'secret-found' || m === 'thorn-open' || m === 'decay-reveal') sfx.play('secret', stored.muted);
    else if (m === 'seal-restored') sfx.play('seal', stored.muted);
    else if (m === 'skill-miss' || m === 'pattern-miss') sfx.play('miss', stored.muted);
    else if (m === 'skill-hit' || m === 'pattern-hit') sfx.play('open', stored.muted);
    if (fb.playerDamaged || fb.hitEnemyIds.length) sfx.play('hit', stored.muted);
  }

  function paintSealBanner(play: HTMLElement): void {
    const el = play.querySelector<HTMLElement>('[data-testid="seal-banner"]');
    if (!el) return;
    if (!sealBanner || performance.now() > sealBanner.until) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }
    el.hidden = false;
    el.innerHTML = `<strong>${escape(sealBanner.title)}</strong><span>${escape(sealBanner.marks)}</span>`;
  }

  function paintFeedback(play: HTMLElement): void {
    const el = play.querySelector<HTMLElement>('[data-testid="game-feedback"]');
    if (!el) return;
    if (!feedback || performance.now() > feedback.until) {
      el.hidden = true;
      el.innerHTML = '';
      el.classList.remove('sb-learn-card');
      return;
    }
    el.hidden = false;
    if (feedback.key === 'learned') {
      const id = feedback.odorId ?? '';
      el.classList.add('sb-learn-card');
      el.innerHTML = `${id ? odorIcon(id, locale()) : ''}<div><b>${escape(feedback.body)}</b><span>${escape(feedback.title)}</span></div>`;
      return;
    }
    el.classList.remove('sb-learn-card');
    el.innerHTML = `${feedback.title ? `<b>${escape(feedback.title)}</b>` : ''}<span>${escape(feedback.body)}</span><i class="sb-pattern-flash" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></i>`;
  }

  function bindScentWheel(play: HTMLElement): void {
    play.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-scent]');
      if (!btn || !session) return;
      session = setActiveScentProfile(session, btn.dataset.scent ?? null);
      latchFeedback(session);
    });
  }

  function nearbyBloom(s: AdventureSession) {
    const bloom = s.enemies.find((e) => e.kind === 'noiseBloom' && !e.defeated);
    if (!bloom) return null;
    return nearAnyCore(s.player.position, bloom, 2.2) ? bloom : null;
  }

  function directionHint(s: AdventureSession): string {
    const c = text();
    const a = compassAngle(s);
    const tau = Math.PI * 2;
    const q = Math.round((((a % tau) + tau) % tau) / (Math.PI / 2)) % 4;
    const keys = ['hintEast', 'hintSouth', 'hintWest', 'hintNorth'] as const;
    return c[keys[q]!] ?? keys[q]!;
  }

  const HOW_HINT_BY_OBJECTIVE: Record<string, string> = {
    cartridge: 'howHintCartridge',
    lemon: 'howHintLemonGate',
    vines: 'howHintVines',
    optical: 'howHintOptical',
    filter: 'howHintFilter',
    secret: 'howHintSecret',
    leave: 'howHintLeave',
  };

  function hintMessage(s: AdventureSession, level: number): string {
    const c = text();
    const copy = c as Record<string, string>;
    const obj = currentObjective(s);
    const clue = copy[obj.labelKey] ?? obj.labelKey;
    if (obj.id === 'boss') {
      const bloom = s.enemies.find((e) => e.kind === 'noiseBloom' && !e.defeated);
      const near = bloom ? nearAnyCore(s.player.position, bloom, 2.2) : false;
      if (s.difficulty === 'junior' && (level >= 2 || near)) {
        return `${c.hintDoThis} ${copy.howHintBloomJunior ?? c.howHintBloom}`;
      }
      if ((bloom?.revealed || s.player.scan.active) && (level >= 2 || near)) {
        return `${c.hintDoThis} ${copy.howHintBloomAttack ?? c.howHintBloom}`;
      }
      if (level >= 2 || near) {
        return `${c.hintDoThis} ${copy.howHintBloomScan ?? c.howHintBloom}`;
      }
    }
    const howKey = HOW_HINT_BY_OBJECTIVE[obj.id];
    const how = (howKey && copy[howKey]) || `${c.hintMarker} ${clue}`;
    if (level >= 3) return `${c.hintDoThis} ${how}`;
    if (level >= 2) {
      return `${c.hintTrail} ${c.hintDoThis} ${how}`;
    }
    return `${directionHint(s)} ${clue}`;
  }

  function paintPuzzle(play: HTMLElement, s: AdventureSession): void {
    const puzzle = s.activePuzzle;
    const overlay = play.querySelector<HTMLElement>('#puzzleOverlay');
    if (!puzzle || !overlay) return;
    overlay.hidden = false;
    const c = text();
    if (puzzle.kind === 'skillCheck') {
      const indicator = puzzle.indicator ?? 0;
      const start = (puzzle.zoneStart ?? 0.4) * 100;
      const width = (puzzle.zoneWidth ?? 0.2) * 100;
      const fb =
        s.lastFeedback.message === 'skill-miss'
          ? c.skillMiss
          : s.lastFeedback.message === 'skill-hit'
            ? `${c.skillHits}!`
            : '';
      if (overlay.dataset.lock !== `skill:${puzzle.id}`) {
        overlay.dataset.lock = `skill:${puzzle.id}`;
        overlay.innerHTML = `<div class="sb-puzzle-card" data-testid="scent-puzzle">
          <strong>${escape(c.skillCheckTitle)}</strong>
          <p>${escape(c.skillCheckHint)}</p>
          <div class="sb-skill" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(indicator * 100)}">
            <span class="sb-skill-zone" style="left:${start}%;width:${width}%">${escape(c.skillHits)}</span>
            <span class="sb-skill-needle" style="left:${indicator * 100}%"></span>
          </div>
          <p class="sb-skill-hits">${escape(c.skillHits)} ${puzzle.hits ?? 0}/${puzzle.needed ?? 2}</p>
          <p class="sb-skill-fb" data-testid="skill-feedback">${escape(fb)}</p>
        </div>`;
      } else {
        const needle = overlay.querySelector<HTMLElement>('.sb-skill-needle');
        const hits = overlay.querySelector('.sb-skill-hits');
        const note = overlay.querySelector('.sb-skill-fb');
        const meter = overlay.querySelector<HTMLElement>('.sb-skill');
        if (needle) needle.style.left = `${indicator * 100}%`;
        if (hits) hits.textContent = `${c.skillHits} ${puzzle.hits ?? 0}/${puzzle.needed ?? 2}`;
        if (note) note.textContent = fb;
        if (meter) meter.setAttribute('aria-valuenow', String(Math.round(indicator * 100)));
      }
      return;
    }
    if (puzzle.kind === 'patternMemory') {
      const revealing = s.elapsedMs < (puzzle.revealUntilMs ?? 0);
      const paintKey = `pattern:${puzzle.id}:${revealing}:${puzzle.input?.length ?? 0}:${s.lastFeedback.message}`;
      if (paintKey === lastPuzzlePaint && !overlay.hidden) return;
      lastPuzzlePaint = paintKey;
      const seq = puzzle.sequence ?? [];
      const shown = revealing
        ? seq.map((id) => `<span class="sb-seq">${odorIcon(id, locale())}</span>`).join('')
        : seq.map((_, i) => `<span class="sb-seq ${(puzzle.input?.length ?? 0) > i ? 'on' : ''}">◆</span>`).join('');
      overlay.innerHTML = `<div class="sb-puzzle-card" data-testid="scent-puzzle">
        <strong>${escape(c.patternTitle)}</strong>
        <p>${escape(revealing ? c.patternWatch : c.patternRepeat)}</p>
        <div class="sb-seq-row">${shown}</div>
        ${
          revealing
            ? ''
            : `<div class="sb-choices">${puzzle.choices
                .map((id) => `<button type="button" data-choice="${escape(id)}">${odorIcon(id, locale())}<span>${escape(getOdorById(id)?.name[locale()] ?? id)}</span></button>`)
                .join('')}</div>`
        }
        <p class="sb-wrong" data-testid="puzzle-feedback">${s.lastFeedback.message === 'pattern-miss' ? escape(c.patternMiss) : ''}</p>
      </div>`;
      overlay.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((btn) => {
        btn.onclick = () => {
          if (!session) return;
          session = solveAdventurePuzzle(session, btn.dataset.choice ?? '');
          if (session.phase === 'puzzle') paintPuzzle(play, session);
        };
      });
      return;
    }
    const paintKey = `${puzzle.id}:${s.lastFeedback.message}:${puzzle.kind}`;
    if (paintKey === lastPuzzlePaint && !overlay.hidden) return;
    lastPuzzlePaint = paintKey;
    const isExit = puzzle.kind === 'exit';
    const checks = ADVENTURE_MODULE_IDS.map((id) => {
      const on = s.player.collectedModules.includes(id);
      const label = locale() === 'en' ? MODULE_LABEL[id].en : MODULE_LABEL[id].zh;
      return `<li class="${on ? 'on' : ''}">${escape(label)} ${on ? '✓' : '○'}</li>`;
    }).join('');
    overlay.innerHTML = `<div class="sb-puzzle-card" data-testid="scent-puzzle">
      ${isExit ? `<ul class="sb-module-check">${checks}</ul>` : ''}
      <strong>${escape(isExit ? c.exitPuzzle : c.lockPuzzle)}</strong>
      <p>${escape(c.puzzleHint)}</p>
      <div class="sb-choices">${puzzle.choices
        .map((id) => `<button type="button" data-choice="${escape(id)}">${odorIcon(id, locale())}<span>${escape(getOdorById(id)?.name[locale()] ?? id)}</span></button>`)
        .join('')}</div>
      <p class="sb-wrong" data-testid="puzzle-feedback">${s.lastFeedback.message === 'wrong-scent' ? escape(c.wrongScent) : ''}</p>
    </div>`;
    overlay.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((btn) => {
      btn.onclick = () => {
        if (!session) return;
        session = solveAdventurePuzzle(session, btn.dataset.choice ?? '');
        if (session.phase === 'puzzle') paintPuzzle(play, session);
      };
    });
  }

  function bumpHint(): void {
    hintLevel = Math.min(3, hintLevel + 1);
    showHintPrompt = false;
    lastProgressAt = session?.elapsedMs ?? 0;
    if (session && hintLevel >= 2) {
      session = {
        ...session,
        enemies: session.enemies.map((e) =>
          e.kind === 'noiseBloom' && !e.defeated ? { ...e, revealed: true } : e,
        ),
      };
    }
  }

  function toggleLibrary(): void {
    const s = session;
    if (!s) return;
    const c = text();
    const dialog = document.querySelector<HTMLDialogElement>('#libraryDialog') ?? root.querySelector('#libraryDialog');
    const host = root.querySelector('#libraryDialog');
    const el = (dialog ?? host) as HTMLDialogElement | null;
    if (!el) return;
    const ids = s.player.learnedOdorIds;
    el.innerHTML = `<div class="modal-header"><div><span class="section-label">${escape(c.library)}</span><h2>${escape(c.libraryTitle)}</h2></div>
      <button class="close-button" type="button" data-close-lib aria-label="${escape(ui().close)}">×</button></div>
      <div class="sb-lib">${ids.length === 0 ? `<p>${escape(c.libraryEmpty)}</p>` : ids
        .map((id) => {
          const odor = getOdorById(id);
          return `<button type="button" data-lib="${escape(id)}">${odorIcon(id, locale())}<strong>${escape(odor?.name[locale()] ?? id)}</strong></button>`;
        })
        .join('')}</div>
      <div class="sb-lib-detail" id="libDetail"></div>
      <button class="primary-button full-button" type="button" data-close-lib>${escape(ui().close)}</button>`;
    const openDetail = (id: string) => {
      libraryId = id;
      const odor = getOdorById(id);
      const vec = odor?.featureVector ?? [];
      const bars = vec
        .map((v, i) => `<i style="height:${Math.round(v * 100)}%" title="R${i + 1}"></i>`)
        .join('');
      const detail = el.querySelector('#libDetail');
      if (detail) {
        detail.innerHTML = `${odorIcon(id, locale())}<div><h3>${escape(odor?.name[locale()] ?? id)}</h3>
          <p>${escape(c.librarySentence)}</p>
          <div class="sb-pattern" aria-hidden="true">${bars}</div>
          <p class="sb-deep">${escape(c.libraryDeeper)}</p></div>`;
      }
    };
    el.querySelectorAll<HTMLButtonElement>('[data-lib]').forEach((b) => {
      b.onclick = () => openDetail(b.dataset.lib ?? '');
    });
    el.querySelectorAll('[data-close-lib]').forEach((b) =>
      b.addEventListener('click', () => el.close()),
    );
    if (ids[0]) openDetail(libraryId && ids.includes(libraryId) ? libraryId : ids[0]);
    el.showModal();
  }

  function finish(s: AdventureSession): void {
    stopLoop();
    view?.dispose?.();
    view = null;
    const play = root.querySelector('#playArea');
    const card = root.querySelector('.game-card');
    card?.classList.remove('maze-live');
    if (!(play instanceof HTMLElement)) return;
    const c = text();
    const g = ui();
    const score = computeAdventureScore(s);
    const scents = `${s.player.learnedOdorIds.length}/${requiredOdorIds(s.difficulty).length}`;
    const secrets = secretCount(s);
    const mazeTools: Array<(typeof ADVENTURE_MODULE_IDS)[number]> = [
      'receptor-cartridge',
      'optical-reader',
      'signal-filter',
    ];
    const toolsGot = mazeTools.filter((id) => s.player.collectedModules.includes(id)).length;
    const mods = `${toolsGot}/${mazeTools.length}`;
    const time = `${Math.floor(s.elapsedMs / 60000)}:${String(Math.floor((s.elapsedMs / 1000) % 60)).padStart(2, '0')}`;
    stored = recordSoloBest(stored, s.seed, score.total);
    stored = { ...stored, tutorialCompleted: true, lastSeed: s.seed };
    save();
    play.innerHTML = resultLayoutHtml({
      testId: 'debrief',
      kicker: 'GAME 02',
      title: c.cleared,
      titleTestId: 'result-title',
      metrics: [
        { value: time, label: c.time, testId: 'stat-time' },
        { value: scents, label: c.scentsLearned, testId: 'stat-scents' },
        { value: secrets.found + '/' + secrets.total, label: c.secretsFound, testId: 'stat-secrets' },
        { value: mods, label: c.modulesAssembled, testId: 'stat-modules' },
      ],
      discoveredTitle: c.discoveredTitle,
      discoveredBody: c.discoveredBody,
      actionsHtml: `<button class="primary-button" id="replay" type="button">${escape(c.replay)}</button>
        <button class="ghost-button" id="backSetup" type="button">${escape(c.backSetup)}</button>`,
      technicalSummary: g.technicalDetails,
      technicalHtml: `<p>seed ${escape(s.seed)}</p><p>game ${ADVENTURE_GAME_VERSION}</p><p>score ${score.total}</p>`,
    });
    play.querySelector('#replay')?.addEventListener('click', startRun);
    play.querySelector('#backSetup')?.addEventListener('click', setup);
  }

  function stopLoop(): void {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    input.detach();
  }

  applyA11y();
  setup();
  bindModalCloses(root);
  document.querySelector('#guideButton')?.addEventListener('click', () => openModal('guideDialog'));
  document.querySelector('#scienceButton')?.addEventListener('click', () => {
    saveSuiteExplorer(markScienceCard(loadSuiteExplorer(), 'labyrinth'));
    openModal('scienceDialog');
  });
  const unbindScienceHash = consumeScienceHash(() => openModal('scienceDialog'));

  return {
    destroy() {
      stopLoop();
      if (onWinResize) window.removeEventListener('resize', onWinResize);
      view?.dispose?.();
      view = null;
      unbindScienceHash();
    },
  };
}
