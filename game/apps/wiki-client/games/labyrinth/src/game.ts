/**
 * Fixed-timestep exploration shell. UI only samples input intents;
 * position updates happen exclusively via tickExploration / tryContinuousMove.
 */

import {
  MAP_V1,
  createExplorationSession,
  tickExploration,
  currentRoomId,
  findNearbyInteractables,
  canPassGate,
  permissionsFor,
  parseLabyrinthStoredJson,
  LABYRINTH_STORAGE_KEY,
  DEFAULT_LABYRINTH_STORED_STATE,
  type ExplorationSession,
  type LabyrinthStoredState,
  type NearbyInteractable,
} from '@suite/core/labyrinth';
import { createInputController } from './input';
import { TILE_SIZE, createRenderer, type CameraState, type RenderPrefs } from './render';

const FIXED_DT = 1 / 60;
const RESUME_COUNTDOWN_SEC = 3;

export type LabyrinthCopy = {
  title: string;
  lead: string;
  pause: string;
  resume: string;
  resumeHint: string;
  landscapeHint: string;
  interact: string;
  interactDoor: string;
  interactTask: string;
  interactGateOk: string;
  interactGateBlocked: string;
  interactScanner: string;
  interactReview: string;
  interactNone?: string;
  interactGotEvidence?: string;
  aimPad?: string;
  room: string;
  exits: string;
  nearby: string;
  settings: string;
  lowDarkness: string;
  highContrast: string;
  reducedMotion: string;
  soundOn: string;
  soundOff: string;
  back: string;
  roleLabel: string;
};

export type StartOptions = {
  root: HTMLElement;
  getCopy: () => LabyrinthCopy;
  getLocale: () => 'zh-Hant' | 'en';
  onLocalePersist?: (locale: 'zh-Hant' | 'en') => void;
};

function loadSettings(): LabyrinthStoredState {
  try {
    return parseLabyrinthStoredJson(localStorage.getItem(LABYRINTH_STORAGE_KEY));
  } catch {
    return { ...DEFAULT_LABYRINTH_STORED_STATE };
  }
}

function saveSettings(state: LabyrinthStoredState): void {
  try {
    localStorage.setItem(LABYRINTH_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage optional */
  }
}

function summarizeExits(session: ExplorationSession, locale: 'zh-Hant' | 'en'): string {
  const roomId = currentRoomId(session);
  if (!roomId) return '—';
  const gates = session.map.gates.filter(
    (g) => g.fromRoomId === roomId || g.toRoomId === roomId,
  );
  if (gates.length === 0) {
    return locale === 'en' ? 'corridor / open floor' : '\u5eca\u9053\uff0f\u958b\u653e\u5730\u677f';
  }
  return gates.map((g) => `Gate ${g.id}`).join(', ');
}

function promptFor(
  item: NearbyInteractable | undefined,
  session: ExplorationSession,
  copy: LabyrinthCopy,
): string {
  if (!item) return '';
  if (item.kind === 'door') return copy.interactDoor;
  if (item.kind === 'task') return copy.interactTask;
  if (item.kind === 'scanner') return copy.interactScanner;
  if (item.kind === 'review') return copy.interactReview;
  if (item.kind === 'gate' && item.gateId) {
    const decision = canPassGate(permissionsFor(session.player), item.gateId);
    return decision.allowed ? copy.interactGateOk : copy.interactGateBlocked;
  }
  return copy.interact;
}

export { promptFor };

export function startLabyrinthExploration(options: StartOptions): { destroy: () => void } {
  let settings = loadSettings();
  let session = createExplorationSession(MAP_V1, {
    odorId: 'banana',
    spawnIndex: 0,
    isPhantom: false,
  });

  let paused = false;
  let resumeCountdown: number | null = null;
  let running = true;
  let acc = 0;
  let last = performance.now();
  let fpsFrames = 0;
  let fpsTimer = 0;
  let fps = 60;
  let lastVisionRays = 0;

  const input = createInputController();
  let renderer: ReturnType<typeof createRenderer> | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let raf = 0;

  const camera: CameraState = {
    x: session.player.position.x,
    y: session.player.position.y,
    zoom: 1,
  };

  const paintChrome = () => {
    const copy = options.getCopy();
    const room = session.map.rooms.find((r) => r.id === currentRoomId(session));
    const roomName =
      room?.name[options.getLocale()] ?? room?.name.en ?? '—';
    const nearby = findNearbyInteractables(session.map, session.player.position)[0];
    const prompt = promptFor(nearby, session, copy);

    options.root.innerHTML = `
      <section class="lx-shell">
        <header class="lx-header">
          <div>
            <p class="lx-eyebrow">GAME 02 · EXPLORATION SHELL</p>
            <h1>${copy.title}</h1>
            <p class="lx-lead">${copy.lead}</p>
          </div>
          <div class="lx-header-actions">
            <button type="button" class="ghost-button" data-settings>${copy.settings}</button>
            <button type="button" class="ghost-button" data-sound>${settings.muted ? copy.soundOff : copy.soundOn}</button>
          </div>
        </header>
        <p class="lx-landscape" data-landscape-hint>${copy.landscapeHint}</p>
        <div class="lx-stage" data-lx-stage data-paused="false">
          <canvas data-lx-canvas aria-label="${copy.title}" tabindex="0"></canvas>
          <div class="lx-prompt" data-prompt>${prompt}</div>
          <div class="lx-mobile" aria-hidden="false">
            <div class="lx-joystick" data-joystick>
              <div class="lx-joystick-knob" data-joystick-knob></div>
            </div>
            <div class="lx-aim-pad" data-aim-pad>
              <span>${copy.aimPad ?? 'AIM'}</span>
            </div>
            <button type="button" class="lx-interact-btn" data-interact-btn>${copy.interact}</button>
          </div>
          <div class="lx-pause" data-pause-overlay hidden>
            <h2 data-pause-title>${copy.pause}</h2>
            <p data-pause-body>${copy.resumeHint}</p>
            <button type="button" class="primary-button" data-resume>${copy.resume}</button>
          </div>
        </div>
        <aside class="lx-a11y" aria-live="polite" data-a11y-summary data-room="" data-gate-block="">
          <p><strong>${copy.room}:</strong> <span data-sum-room>${roomName}</span></p>
          <p><strong>${copy.exits}:</strong> <span data-sum-exits>${summarizeExits(session, options.getLocale())}</span></p>
          <p><strong>${copy.nearby}:</strong> <span data-sum-near>${prompt || '—'}</span></p>
          <p><strong>${copy.roleLabel}:</strong> ${session.player.odorId.toUpperCase()} · gates ${[...permissionsFor(session.player).authorizedGates].join('')}</p>
        </aside>
        <dialog class="modal" data-settings-dialog>
          <div class="modal-header">
            <h2>${copy.settings}</h2>
            <button type="button" class="close-button" data-close-settings aria-label="Close">\u00d7</button>
          </div>
          <label class="lx-toggle"><input type="checkbox" data-opt-low-dark ${settings.lowDarkness ? 'checked' : ''}/> ${copy.lowDarkness}</label>
          <label class="lx-toggle"><input type="checkbox" data-opt-contrast ${settings.highContrast ? 'checked' : ''}/> ${copy.highContrast}</label>
          <label class="lx-toggle"><input type="checkbox" data-opt-motion ${settings.reducedMotion ? 'checked' : ''}/> ${copy.reducedMotion}</label>
          <button type="button" class="primary-button full-button" data-close-settings>OK</button>
        </dialog>
      </section>
    `;

    document.documentElement.classList.toggle('high-contrast', settings.highContrast);
    document.documentElement.classList.toggle('reduced-effects', settings.reducedMotion);

    canvas = options.root.querySelector<HTMLCanvasElement>('[data-lx-canvas]');
    if (!canvas) throw new Error('canvas missing');
    renderer = createRenderer(canvas);
    fitCanvas();
    input.detach();
    input.attach(options.root, canvas);
    input.setCanvasToWorld((clientX, clientY) => {
      if (!renderer || !canvas) return null;
      const world = renderer.clientToWorld(camera, clientX, clientY);
      return {
        x: world.x - session.player.position.x,
        y: world.y - session.player.position.y,
      };
    });

    options.root.querySelector('[data-settings]')?.addEventListener('click', () => {
      options.root.querySelector<HTMLDialogElement>('[data-settings-dialog]')?.showModal();
      setPaused(true, 'settings');
    });
    options.root.querySelectorAll('[data-close-settings]').forEach((el) => {
      el.addEventListener('click', () => {
        const dialog = options.root.querySelector<HTMLDialogElement>('[data-settings-dialog]');
        dialog?.close();
        applySettingsFromDialog();
        beginResumeCountdown();
      });
    });
    options.root.querySelector('[data-sound]')?.addEventListener('click', () => {
      settings = { ...settings, muted: !settings.muted };
      saveSettings(settings);
      const btn = options.root.querySelector('[data-sound]');
      const copy = options.getCopy();
      if (btn) btn.textContent = settings.muted ? copy.soundOff : copy.soundOn;
    });
    options.root.querySelector('[data-resume]')?.addEventListener('click', () => {
      beginResumeCountdown();
    });

    canvas.focus();
  };

  const applySettingsFromDialog = () => {
    const low = options.root.querySelector<HTMLInputElement>('[data-opt-low-dark]');
    const contrast = options.root.querySelector<HTMLInputElement>('[data-opt-contrast]');
    const motion = options.root.querySelector<HTMLInputElement>('[data-opt-motion]');
    settings = {
      ...settings,
      lowDarkness: Boolean(low?.checked),
      highContrast: Boolean(contrast?.checked),
      reducedMotion: Boolean(motion?.checked),
      locale: options.getLocale(),
    };
    saveSettings(settings);
    document.documentElement.classList.toggle('high-contrast', settings.highContrast);
    document.documentElement.classList.toggle('reduced-effects', settings.reducedMotion);
  };

  const fitCanvas = () => {
    if (!canvas || !renderer) return;
    const stage = options.root.querySelector<HTMLElement>('.lx-stage');
    const w = stage?.clientWidth ?? window.innerWidth;
    const h = Math.max(280, stage?.clientHeight ?? Math.floor(window.innerHeight * 0.55));
    renderer.resize(w, h);
    const fitZoomX = w / (MAP_V1.width * TILE_SIZE);
    const fitZoomY = h / (MAP_V1.height * TILE_SIZE);
    camera.zoom = Math.min(0.92, Math.max(0.4, Math.max(fitZoomX, fitZoomY) * 1.45));
  };

  const setPaused = (value: boolean, _reason?: string) => {
    paused = value;
    session = { ...session, paused: value };
    const overlay = options.root.querySelector<HTMLElement>('[data-pause-overlay]');
    const stage = options.root.querySelector<HTMLElement>('[data-lx-stage]');
    if (stage) stage.dataset.paused = value || resumeCountdown != null ? 'true' : 'false';
    if (!overlay) return;
    overlay.hidden = !value && resumeCountdown == null;
    if (value) {
      overlay.hidden = false;
      const title = options.root.querySelector('[data-pause-title]');
      const body = options.root.querySelector('[data-pause-body]');
      const copy = options.getCopy();
      if (title) title.textContent = copy.pause;
      if (body) body.textContent = copy.resumeHint;
      resumeCountdown = null;
    }
  };

  const beginResumeCountdown = () => {
    resumeCountdown = RESUME_COUNTDOWN_SEC;
    const overlay = options.root.querySelector<HTMLElement>('[data-pause-overlay]');
    if (overlay) overlay.hidden = false;
  };

  const updateA11y = () => {
    const copy = options.getCopy();
    const room = session.map.rooms.find((r) => r.id === currentRoomId(session));
    const roomName = room?.name[options.getLocale()] ?? room?.name.en ?? '—';
    const nearby = findNearbyInteractables(session.map, session.player.position)[0];
    const prompt = promptFor(nearby, session, copy);
    const roomEl = options.root.querySelector('[data-sum-room]');
    const exitsEl = options.root.querySelector('[data-sum-exits]');
    const nearEl = options.root.querySelector('[data-sum-near]');
    const promptEl = options.root.querySelector('[data-prompt]');
    const summary = options.root.querySelector<HTMLElement>('[data-a11y-summary]');
    if (roomEl) roomEl.textContent = roomName;
    if (exitsEl) exitsEl.textContent = summarizeExits(session, options.getLocale());
    if (nearEl) nearEl.textContent = prompt || '—';
    if (promptEl) promptEl.textContent = prompt;
    if (summary) {
      summary.dataset.room = currentRoomId(session) ?? '';
      summary.dataset.gateBlock = session.lastGateBlockReason ?? '';
    }
  };

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') setPaused(true, 'visibility');
  };
  const onBlur = () => setPaused(true, 'blur');
  const onResize = () => fitCanvas();

  paintChrome();
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('blur', onBlur);

  const prefs = (): RenderPrefs => ({
    lowDarkness: settings.lowDarkness,
    highContrast: settings.highContrast,
    reducedMotion: settings.reducedMotion,
    showDevOverlay: import.meta.env.DEV,
  });

  const frame = (now: number) => {
    if (!running) return;
    let frameSec = (now - last) / 1000;
    last = now;
    if (frameSec > 0.25) frameSec = 0.25;

    fpsFrames += 1;
    fpsTimer += frameSec;
    if (fpsTimer >= 0.5) {
      fps = fpsFrames / fpsTimer;
      fpsFrames = 0;
      fpsTimer = 0;
    }

    if (resumeCountdown != null) {
      resumeCountdown -= frameSec;
      const body = options.root.querySelector('[data-pause-body]');
      if (body) {
        body.textContent = String(Math.max(1, Math.ceil(resumeCountdown)));
      }
      if (resumeCountdown <= 0) {
        resumeCountdown = null;
        paused = false;
        session = { ...session, paused: false };
        const overlay = options.root.querySelector<HTMLElement>('[data-pause-overlay]');
        if (overlay) overlay.hidden = true;
        const stage = options.root.querySelector<HTMLElement>('[data-lx-stage]');
        if (stage) stage.dataset.paused = 'false';
      }
    } else if (!paused) {
      const snap = input.sample(session.player.facing);
      if (snap.pausePressed) {
        setPaused(true, 'esc');
      } else {
        acc += frameSec;
        const intent = {
          moveX: snap.moveX,
          moveY: snap.moveY,
          aimAngle: snap.aimAngle,
          interactPressed: snap.interactPressed,
        };
        while (acc >= FIXED_DT) {
          session = tickExploration(session, intent, FIXED_DT);
          // consume interact only once
          intent.interactPressed = false;
          acc -= FIXED_DT;
        }
      }
    } else {
      const snap = input.sample(session.player.facing);
      if (snap.pausePressed) beginResumeCountdown();
    }

    camera.x += (session.player.position.x - camera.x) * Math.min(1, frameSec * 8);
    camera.y += (session.player.position.y - camera.y) * Math.min(1, frameSec * 8);

    const alpha = paused || resumeCountdown != null ? 1 : acc / FIXED_DT;
    if (renderer) {
      const gatePerm =
        session.lastGateBlockReason ??
        (session.lastCrossedGateId ? `ok:${session.lastCrossedGateId}` : '—');
      const vision = renderer.render(
        session,
        camera,
        alpha,
        prefs(),
        {
          fps,
          rayCount: lastVisionRays,
          roomId: currentRoomId(session),
          gatePermission: String(gatePerm),
        },
      );
      lastVisionRays = vision.rayCount;
    }

    updateA11y();
    raf = requestAnimationFrame(frame);
  };

  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      input.detach();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
    },
  };
}
