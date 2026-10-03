/**
 * Wiki solo campaign UI — tutorial → briefing → explore/review ×2 → verdict → debrief.
 * Exploration movement still goes only through core tickExploration / tryContinuousMove.
 */

import {
  MAP_V1,
  createExplorationSession,
  tickExploration,
  currentRoomId,
  findNearbyInteractables,
  parseLabyrinthStoredJson,
  LABYRINTH_STORAGE_KEY,
  recordSoloBest,
  generateSoloOfficialCaseOrThrow,
  solutionStatusForEvidence,
  scoreSoloRound,
  buildDebriefRows,
  createSoloTask,
  applyTaskInput,
  tickSoloTask,
  createNpcRuntimes,
  tickNpcs,
  shortestPath,
  actorPerms,
  tryMove,
  SOLO_HUMAN_ID,
  ROLE_GATE_TABLE,
  LABYRINTH_ODOR_IDS,
  defaultDoorState,
  type ExplorationSession,
  type LabyrinthStoredState,
  type SoloCase,
  type SoloTaskSession,
  type NpcRuntime,
  type VerdictSubmission,
  type LabyrinthOdorId,
} from '@suite/core/labyrinth';
import {
  loadSuiteExplorer,
  markScienceCard,
  saveSuiteExplorer,
} from '../../../src/progress/explorer';
import { createInputController } from './input';
import { createRenderer, TILE_SIZE, type CameraState, type RenderPrefs } from './render';
import { promptFor, type LabyrinthCopy } from './game';

export type CampaignCopy = Record<string, string>;

type Phase =
  | 'menu'
  | 'tutorial'
  | 'briefing'
  | 'explore1'
  | 'review1'
  | 'explore2'
  | 'review2'
  | 'verdict'
  | 'debrief';

const FIXED_DT = 1 / 60;
const TUTORIAL_STEPS = [
  'move',
  'flashlight',
  'gates',
  'artifact',
  'doorLog',
  'board',
] as const;

function loadSettings(): LabyrinthStoredState {
  try {
    return parseLabyrinthStoredJson(localStorage.getItem(LABYRINTH_STORAGE_KEY));
  } catch {
    return parseLabyrinthStoredJson(null);
  }
}

function saveSettings(state: LabyrinthStoredState): void {
  try {
    localStorage.setItem(LABYRINTH_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* optional */
  }
}

function randomSeed(): string {
  return `solo-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;
}

export function startLabyrinthCampaign(options: {
  root: HTMLElement;
  getCopy: () => CampaignCopy;
  getLocale: () => 'zh-Hant' | 'en';
}): { destroy: () => void } {
  let settings = loadSettings();
  let phase: Phase = settings.tutorialCompleted ? 'menu' : 'tutorial';
  let tutorialStep = 0;
  let solo: SoloCase | null = null;
  let session: ExplorationSession | null = null;
  let npcs: NpcRuntime[] = [];
  let discovered = new Set<string>();
  let activeTask: SoloTaskSession | null = null;
  let taskIndex = 0;
  let roundElapsedMs = 0;
  let exploreDeadlineMs = 0;
  let verdict: VerdictSubmission = {
    accusedPhantomPlayerId: '',
    accusedAssignments: [],
  };
  let boardOdors: Record<string, LabyrinthOdorId | ''> = {};
  let boardPhantom = '';
  let paused = false;
  let resumeCountdown: number | null = null;
  let running = true;
  let acc = 0;
  let last = performance.now();
  let npcAcc = 0;
  const evidenceSeq = { n: 0 };
  /** Smooth NPC render positions between discrete AI steps. */
  const npcVisual = new Map<
    string,
    { fromX: number; fromY: number; toX: number; toY: number; t: number }
  >();
  const NPC_STEP_MS = 140;
  /** Walkable mid-map tiles so NPCs are visible early (corner spawns are too far). */
  const NPC_STAGING = [
    { x: 10, y: 6 },
    { x: 12, y: 6 },
    { x: 15, y: 6 },
    { x: 6, y: 4 },
  ] as const;
  const HUNT_RANGE = 8.5;
  const CATCH_RANGE = 1.05;

  let stunUntilMs = 0;
  let huntCooldownUntilMs = 0;
  let chasePromptUntilMs = 0;
  let lastRoomId: string | null = null;
  let roomBannerUntilMs = 0;
  let threatNear = false;

  const input = createInputController();
  let renderer: ReturnType<typeof createRenderer> | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let raf = 0;
  const camera: CameraState = { x: 8, y: 6, zoom: 1 };

  const c = () => options.getCopy();

  const paint = () => {
    const copy = c();
    if (phase === 'menu') return paintMenu(copy);
    if (phase === 'tutorial') return paintTutorial(copy);
    if (phase === 'briefing') return paintBriefing(copy);
    if (phase === 'review1' || phase === 'review2' || phase === 'verdict') {
      return paintReview(copy, phase === 'verdict');
    }
    if (phase === 'debrief') return paintDebrief(copy);
    return paintExplore(copy);
  };

  const paintMenu = (copy: CampaignCopy) => {
    options.root.innerHTML = `
      <section class="lx-shell" data-phase="menu">
        <header class="lx-header">
          <div>
            <p class="lx-eyebrow">GAME 02 · WIKI SOLO</p>
            <h1>${copy.title}</h1>
            <p class="lx-lead">${copy.lead}</p>
          </div>
        </header>
        <aside class="lx-objective" aria-label="${copy.objectiveTitle}">
          <h2>${copy.objectiveTitle}</h2>
          <pre class="lx-objective-body">${copy.objectiveBody}</pre>
          <p class="lx-muted">${copy.controlsHint}</p>
        </aside>
        <div class="lx-menu">
          <label>${copy.seedLabel}<input data-seed value="${settings.lastSeed || randomSeed()}"/></label>
          <div class="lx-menu-actions">
            <button type="button" class="primary-button" data-start>${copy.start}</button>
            <button type="button" class="ghost-button" data-replay>${copy.replay}</button>
            <button type="button" class="ghost-button" data-tutorial>${copy.tutorial}</button>
            <button type="button" class="ghost-button" data-science>${copy.science}</button>
          </div>
          <p class="lx-muted">${copy.bestLabel}: ${settings.bestTotal}</p>
        </div>
        <dialog class="modal" data-science-dialog>
          <div class="modal-header"><h2>${copy.scienceTitle}</h2>
            <button type="button" class="close-button" data-close-science>\u00d7</button></div>
          <p>${copy.scienceBody}</p>
          <button type="button" class="primary-button full-button" data-close-science>OK</button>
        </dialog>
      </section>`;
    options.root.querySelector('[data-start]')?.addEventListener('click', () => {
      const seed =
        options.root.querySelector<HTMLInputElement>('[data-seed]')?.value.trim() ||
        randomSeed();
      beginCase(seed);
    });
    options.root.querySelector('[data-replay]')?.addEventListener('click', () => {
      beginCase(settings.lastSeed || randomSeed());
    });
    options.root.querySelector('[data-tutorial]')?.addEventListener('click', () => {
      phase = 'tutorial';
      tutorialStep = 0;
      paint();
    });
    options.root.querySelector('[data-science]')?.addEventListener('click', () => {
      saveSuiteExplorer(markScienceCard(loadSuiteExplorer(), 'labyrinth'));
      options.root.querySelector<HTMLDialogElement>('[data-science-dialog]')?.showModal();
    });
    options.root.querySelectorAll('[data-close-science]').forEach((el) => {
      el.addEventListener('click', () =>
        options.root.querySelector<HTMLDialogElement>('[data-science-dialog]')?.close(),
      );
    });
  };

  const paintTutorial = (copy: CampaignCopy) => {
    const step = TUTORIAL_STEPS[tutorialStep] ?? 'move';
    options.root.innerHTML = `
      <section class="lx-shell" data-phase="tutorial" data-tutorial-step="${step}">
        <h1>${copy.tutorial}</h1>
        <p class="lx-lead">${copy[`tutorial_${step}`] ?? ''}</p>
        <p class="lx-muted">${tutorialStep + 1} / ${TUTORIAL_STEPS.length}</p>
        <div class="lx-menu-actions">
          <button type="button" class="primary-button" data-next>${copy.next}</button>
          <button type="button" class="ghost-button" data-skip>${copy.skipTutorial}</button>
        </div>
      </section>`;
    options.root.querySelector('[data-next]')?.addEventListener('click', () => {
      if (tutorialStep >= TUTORIAL_STEPS.length - 1) {
        settings = { ...settings, tutorialCompleted: true };
        saveSettings(settings);
        phase = 'menu';
      } else tutorialStep += 1;
      paint();
    });
    options.root.querySelector('[data-skip]')?.addEventListener('click', () => {
      settings = { ...settings, tutorialCompleted: true };
      saveSettings(settings);
      phase = 'menu';
      paint();
    });
  };

  const beginCase = (seed: string) => {
    solo = generateSoloOfficialCaseOrThrow(seed);
    settings = { ...settings, lastSeed: seed };
    saveSettings(settings);
    const human = solo.playerRoles.find((r) => r.playerId === SOLO_HUMAN_ID)!;
    session = createExplorationSession(MAP_V1, {
      odorId: human.odorId,
      spawnIndex: 0,
      isPhantom: false,
    });
    session.doors = defaultDoorState(MAP_V1);
    npcs = createNpcRuntimes(solo).map((n, i) => ({
      ...n,
      tile: { ...NPC_STAGING[i % NPC_STAGING.length]! },
    }));
    npcVisual.clear();
    stunUntilMs = 0;
    huntCooldownUntilMs = 0;
    chasePromptUntilMs = 0;
    lastRoomId = null;
    roomBannerUntilMs = 0;
    threatNear = false;
    session.debugActors = npcs.map((n) => {
      const x = n.tile.x + 0.5;
      const y = n.tile.y + 0.5;
      npcVisual.set(n.id, { fromX: x, fromY: y, toX: x, toY: y, t: 1 });
      return {
        id: n.id,
        label: n.id.replace(/^npc_?/i, 'NPC '),
        x,
        y,
        odorId: n.odorId,
        isPhantom: n.isPhantom,
        threat: false,
      };
    });
    discovered = new Set();
    for (const ev of solo.evidenceEvents) {
      if (
        ev.playerId === SOLO_HUMAN_ID &&
        (ev.type === 'positiveChannel' || ev.type === 'negativeChannel')
      ) {
        discovered.add(ev.id);
      }
    }
    activeTask = null;
    taskIndex = 0;
    roundElapsedMs = 0;
    boardOdors = Object.fromEntries(solo.npcIds.map((id) => [id, '' as const]));
    boardPhantom = '';
    phase = 'briefing';
    paint();
  };

  const paintBriefing = (copy: CampaignCopy) => {
    if (!solo || !session) return;
    const human = solo.playerRoles.find((r) => r.playerId === SOLO_HUMAN_ID)!;
    const gates = ROLE_GATE_TABLE[human.odorId].join(', ');
    options.root.innerHTML = `
      <section class="lx-shell" data-phase="briefing">
        <h1>${copy.briefing}</h1>
        <p>${copy.briefingLead}</p>
        <p><strong>${copy.roleLabel}:</strong> ${human.odorId.toUpperCase()} · gates ${gates}</p>
        <p class="lx-muted">${copy.briefingPhantomHint}</p>
        <aside class="lx-objective">
          <h2>${copy.objectiveTitle}</h2>
          <pre class="lx-objective-body">${copy.objectiveBody}</pre>
          <p class="lx-muted">${copy.controlsHint}</p>
        </aside>
        <button type="button" class="primary-button" data-go>${copy.beginExplore}</button>
      </section>`;
    options.root.querySelector('[data-go]')?.addEventListener('click', () => {
      phase = 'explore1';
      exploreDeadlineMs = 150_000;
      paint();
      bootExplore();
    });
  };

  const bootExplore = () => {
    canvas = options.root.querySelector<HTMLCanvasElement>('[data-lx-canvas]');
    if (!canvas || !session) return;
    renderer = createRenderer(canvas);
    fitCanvas();
    input.detach();
    input.attach(options.root, canvas);
    input.setCanvasToWorld((cx, cy) => {
      if (!renderer || !session) return null;
      const w = renderer.clientToWorld(camera, cx, cy);
      return { x: w.x - session.player.position.x, y: w.y - session.player.position.y };
    });
    canvas.focus();
  };

  const fitCanvas = () => {
    if (!canvas || !renderer) return;
    const stage = options.root.querySelector<HTMLElement>('.lx-stage');
    const w = stage?.clientWidth ?? 640;
    const h = Math.max(280, stage?.clientHeight ?? 360);
    renderer.resize(w, h);
    camera.zoom = Math.min(0.92, Math.max(0.4, (w / (MAP_V1.width * TILE_SIZE)) * 1.45));
  };

  const nextStepHint = (copy: CampaignCopy): string => {
    if (!solo) return copy.exploreGoal;
    let scannerDone = 0;
    let doorDone = 0;
    let gateDone = 0;
    for (const ev of solo.evidenceEvents) {
      if (!discovered.has(ev.id)) continue;
      if (ev.type === 'positiveChannel' || ev.type === 'negativeChannel') scannerDone += 1;
      if (ev.type === 'doorLog') doorDone += 1;
      if (ev.type === 'artifactTrace' || ev.type === 'observedGateUse') gateDone += 1;
    }
    if (scannerDone < 2) return copy.nextHintScanner || copy.exploreGoal;
    if (doorDone < 1) return copy.nextHintDoor || copy.exploreGoal;
    if (gateDone < 1 || discovered.size < 6) return copy.nextHintExplore || copy.exploreGoal;
    return copy.nextHintReview || copy.exploreGoal;
  };

  const syncNpcActors = (alphaInterp = true) => {
    if (!session) return;
    const px = session.player.position.x;
    const py = session.player.position.y;
    session = {
      ...session,
      debugActors: npcs.map((n) => {
        const tx = n.tile.x + 0.5;
        const ty = n.tile.y + 0.5;
        let vis = npcVisual.get(n.id);
        if (!vis) {
          vis = { fromX: tx, fromY: ty, toX: tx, toY: ty, t: 1 };
          npcVisual.set(n.id, vis);
        }
        const t = alphaInterp ? Math.min(1, vis.t) : 1;
        const ease = t * t * (3 - 2 * t);
        const x = vis.fromX + (vis.toX - vis.fromX) * ease;
        const y = vis.fromY + (vis.toY - vis.fromY) * ease;
        const dist = Math.hypot(px - x, py - y);
        const hunting =
          n.isPhantom &&
          dist < HUNT_RANGE &&
          roundElapsedMs >= huntCooldownUntilMs &&
          roundElapsedMs >= stunUntilMs;
        return {
          id: n.id,
          label: n.id.replace(/^npc_?/i, 'NPC '),
          x,
          y,
          odorId: n.odorId,
          isPhantom: n.isPhantom,
          threat: hunting,
        };
      }),
    };
  };

  const paintExplore = (copy: CampaignCopy) => {
    if (!solo || !session) return;
    const status = solutionStatusForEvidence(solo, discovered);
    const room = session.map.rooms.find((r) => r.id === currentRoomId(session!));
    options.root.innerHTML = `
      <section class="lx-shell" data-phase="${phase}">
        <header class="lx-header">
          <div>
            <p class="lx-eyebrow">${phase.toUpperCase()}</p>
            <h1>${copy.title}</h1>
          </div>
          <div class="lx-header-actions">
            <button type="button" class="ghost-button" data-task>${copy.startTask}</button>
            <button type="button" class="ghost-button" data-advance>${copy.advancePhase}</button>
          </div>
        </header>
        <p class="lx-landscape">${copy.landscapeHint}</p>
        <div class="lx-stage" data-lx-stage data-paused="false" data-threat="0">
          <canvas data-lx-canvas tabindex="0" aria-label="${copy.title}"></canvas>
          <div class="lx-room-banner" data-room-banner hidden></div>
          <div class="lx-prompt" data-prompt></div>
          <div class="lx-mobile">
            <div class="lx-joystick" data-joystick><div class="lx-joystick-knob" data-joystick-knob></div></div>
            <div class="lx-aim-pad" data-aim-pad><span>${copy.aimPad ?? 'AIM'}</span></div>
            <button type="button" class="lx-interact-btn" data-interact-btn>${copy.interact}</button>
          </div>
          <div class="lx-pause" data-pause-overlay hidden>
            <h2>${copy.pause}</h2>
            <p data-pause-body>${copy.resumeHint}</p>
            <button type="button" class="primary-button" data-resume>${copy.resume}</button>
          </div>
          <div class="lx-task" data-task-panel hidden></div>
        </div>
        <aside class="lx-a11y" data-a11y-summary aria-live="polite">
          <p class="lx-explore-goal"><strong>${copy.exploreGoal}</strong></p>
          <p class="lx-next-hint" data-next-hint><strong>${copy.nextStep ?? 'Next'}:</strong> ${nextStepHint(copy)}</p>
          <ol class="lx-steps">
            <li>${copy.step1 ?? ''}</li>
            <li>${copy.step2 ?? ''}</li>
            <li>${copy.step3 ?? ''}</li>
            <li>${copy.step4 ?? ''}</li>
          </ol>
          <p><strong>${copy.room}:</strong> <span data-sum-room>${room?.name[options.getLocale()] ?? '—'}</span></p>
          <p><strong>${copy.evidenceCount}:</strong> <span data-ev-count>${discovered.size}</span></p>
          <p data-solution-hint>${
            status.unique
              ? copy.solutionUnique
              : copy.solutionMultiple.replace('{n}', String(status.count))
          }</p>
          <p class="lx-muted">${copy.controlsHint}</p>
          <p class="lx-legend">${copy.mapLegend ?? ''}</p>
        </aside>
      </section>`;
    options.root.querySelector('[data-advance]')?.addEventListener('click', () => advanceFromExplore());
    options.root.querySelector('[data-task]')?.addEventListener('click', () => openTask());
    options.root.querySelector('[data-resume]')?.addEventListener('click', () => {
      resumeCountdown = 3;
    });
    bootExplore();
  };

  const taskMeta = (copy: CampaignCopy, kind: SoloTaskSession['kind']) => {
    if (kind === 'patternPair') {
      return {
        title: copy.taskPatternTitle || copy.taskPattern,
        how: copy.taskPatternHow || '',
      };
    }
    if (kind === 'signalRouting') {
      return {
        title: copy.taskRoutingTitle || copy.taskRouting,
        how: copy.taskRoutingHow || '',
      };
    }
    if (kind === 'calibrationHold') {
      return {
        title: copy.taskHoldTitle || copy.taskHold,
        how: copy.taskHoldHow || '',
      };
    }
    return {
      title: copy.taskMemoryTitle || copy.taskMemory,
      how: copy.taskMemoryHow || '',
    };
  };

  const openTask = () => {
    if (!solo || activeTask) return;
    const kind = solo.humanTaskKinds[taskIndex % solo.humanTaskKinds.length]!;
    activeTask = createSoloTask(kind, `${solo.seed}:task:${taskIndex}`);
    taskIndex += 1;
    renderTaskPanel();
  };

  const refreshTaskChrome = () => {
    const panel = options.root.querySelector<HTMLElement>('[data-task-panel]');
    if (!panel || !activeTask || panel.hidden) return;
    const copy = c();
    const remain = Math.max(0, activeTask.durationMs - activeTask.elapsedMs);
    const timer = panel.querySelector('[data-task-timer]');
    const bar = panel.querySelector<HTMLElement>('[data-task-bar]');
    const progress = panel.querySelector('[data-task-progress]');
    const feedback = panel.querySelector<HTMLElement>('[data-task-feedback]');
    if (timer) {
      timer.textContent = (copy.taskTimer || '{s}s').replace(
        '{s}',
        (remain / 1000).toFixed(1),
      );
    }
    if (bar) {
      const pct = Math.max(0, Math.min(1, 1 - activeTask.elapsedMs / activeTask.durationMs));
      bar.style.width = `${pct * 100}%`;
    }
    if (progress) {
      if (activeTask.kind === 'signalRouting') {
        progress.textContent = (copy.taskRoutingProgress || '{cur}/{total}')
          .replace('{cur}', String(activeTask.cursor + 1))
          .replace('{total}', String(activeTask.path.length));
      } else if (activeTask.kind === 'calibrationHold') {
        const holdPct = Math.min(100, Math.round((activeTask.heldMs / activeTask.holdMs) * 100));
        progress.textContent = (copy.taskHoldProgress || '{pct}%').replace(
          '{pct}',
          String(holdPct),
        );
      } else if (activeTask.kind === 'memoryOrder') {
        const showing = activeTask.elapsedMs < activeTask.revealMs;
        progress.textContent = showing
          ? copy.taskMemoryWatch || ''
          : (copy.taskMemoryInput || '{n}/{total}')
              .replace('{n}', String(activeTask.input.length))
              .replace('{total}', String(activeTask.sequence.length));
      } else {
        progress.textContent = copy.taskPatternHint || '';
      }
    }
    if (feedback) {
      const miss =
        (activeTask.kind === 'patternPair' || activeTask.kind === 'signalRouting') &&
        activeTask.lastMiss;
      feedback.textContent = miss ? copy.taskWrong || '' : '';
      feedback.hidden = !miss;
    }
    if (activeTask.kind === 'memoryOrder') {
      const seqEl = panel.querySelector('[data-mem-seq]');
      if (seqEl) {
        seqEl.textContent =
          activeTask.elapsedMs < activeTask.revealMs
            ? activeTask.sequence.join(' · ')
            : '· · · ·';
      }
    }
  };

  const renderTaskPanel = () => {
    const panel = options.root.querySelector<HTMLElement>('[data-task-panel]');
    const copy = c();
    if (!panel || !activeTask) return;
    panel.hidden = false;
    const meta = taskMeta(copy, activeTask.kind);
    const shell = (body: string) => `
      <header class="lx-task-head">
        <h3>${meta.title}</h3>
        <p class="lx-task-how">${meta.how}</p>
        <div class="lx-task-timer-row">
          <span data-task-timer></span>
          <div class="lx-task-bar-track"><div class="lx-task-bar" data-task-bar></div></div>
        </div>
        <p class="lx-task-progress" data-task-progress></p>
        <p class="lx-task-feedback" data-task-feedback hidden></p>
      </header>
      <div class="lx-task-body">${body}</div>
      <button type="button" class="ghost-button" data-abort>${copy.taskAbort}</button>`;

    if (activeTask.kind === 'patternPair') {
      panel.innerHTML = shell(`
        <p class="lx-task-target">${copy.taskPatternTarget || 'Target'}: <strong>${activeTask.left}</strong></p>
        <div class="lx-task-options">
          ${activeTask.options
            .map(
              (o, i) =>
                `<button type="button" class="primary-button" data-opt="${i}">${i + 1}. ${o}</button>`,
            )
            .join('')}
        </div>`);
      panel.querySelectorAll('[data-opt]').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeTask = applyTaskInput(activeTask!, {
            type: 'select',
            index: Number((btn as HTMLElement).dataset.opt),
          });
          finishTaskIfDone();
        });
      });
    } else if (activeTask.kind === 'signalRouting') {
      panel.innerHTML = shell(`
        <p class="lx-muted">${copy.taskRoutingOrder || ''}</p>
        <div class="lx-task-options">
          ${[0, 1, 2, 3]
            .map(
              (n) =>
                `<button type="button" class="primary-button" data-node="${n}">${n + 1}</button>`,
            )
            .join('')}
        </div>`);
      panel.querySelectorAll('[data-node]').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeTask = applyTaskInput(activeTask!, {
            type: 'route',
            node: Number((btn as HTMLElement).dataset.node),
          });
          finishTaskIfDone();
        });
      });
    } else if (activeTask.kind === 'calibrationHold') {
      panel.innerHTML = shell(`
        <button type="button" class="primary-button lx-hold-btn" data-hold>${copy.taskHoldBtn}</button>
        <p class="lx-muted">${copy.taskHoldTip || ''}</p>`);
      const holdBtn = panel.querySelector('[data-hold]');
      holdBtn?.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).code === 'Space') {
          e.preventDefault();
          activeTask = applyTaskInput(activeTask!, { type: 'hold', down: true });
        }
      });
      holdBtn?.addEventListener('keyup', (e) => {
        if ((e as KeyboardEvent).code === 'Space') {
          activeTask = applyTaskInput(activeTask!, { type: 'hold', down: false });
        }
      });
      holdBtn?.addEventListener('pointerdown', () => {
        activeTask = applyTaskInput(activeTask!, { type: 'hold', down: true });
      });
      holdBtn?.addEventListener('pointerup', () => {
        activeTask = applyTaskInput(activeTask!, { type: 'hold', down: false });
      });
      holdBtn?.addEventListener('pointerleave', () => {
        activeTask = applyTaskInput(activeTask!, { type: 'hold', down: false });
      });
    } else {
      panel.innerHTML = shell(`
        <p class="lx-task-target" data-mem-seq></p>
        <div class="lx-task-options">
          ${[1, 2, 3, 4]
            .map(
              (n) =>
                `<button type="button" class="primary-button" data-mem="${n}">${n}</button>`,
            )
            .join('')}
        </div>`);
      panel.querySelectorAll('[data-mem]').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeTask = applyTaskInput(activeTask!, {
            type: 'memory',
            value: Number((btn as HTMLElement).dataset.mem),
          });
          finishTaskIfDone();
        });
      });
    }
    panel.querySelector('[data-abort]')?.addEventListener('click', () => {
      activeTask = applyTaskInput(activeTask!, { type: 'abort' });
      panel.hidden = true;
      activeTask = null;
    });
    refreshTaskChrome();
  };

  const finishTaskIfDone = () => {
    const panel = options.root.querySelector<HTMLElement>('[data-task-panel]');
    if (!activeTask || !solo) return;
    if (activeTask.completed) {
      const next = solo.evidenceEvents.find((e) => !discovered.has(e.id));
      if (next) discovered.add(next.id);
      flashPrompt(c().taskOk || c().interactGotEvidence || '');
      if (panel) panel.hidden = true;
      activeTask = null;
      updateHud();
    } else if (activeTask.aborted) {
      if (panel) panel.hidden = true;
      activeTask = null;
    } else {
      refreshTaskChrome();
    }
  };

  const advanceFromExplore = () => {
    if (phase === 'explore1') phase = 'review1';
    else if (phase === 'explore2') phase = 'review2';
    paint();
  };

  const paintReview = (copy: CampaignCopy, isVerdict: boolean) => {
    if (!solo) return;
    const status = solutionStatusForEvidence(solo, discovered);
    const statements = solo.statements
      .map((s) => {
        const text = (copy[`stmt_${s.templateId}`] ?? s.templateId)
          .replace('{npc}', s.npcId)
          .replace('{gate}', s.facts.gateId ?? '')
          .replace('{task}', s.facts.taskId ?? '');
        return `<li><strong>${s.npcId}</strong>: ${text}</li>`;
      })
      .join('');
    const evidenceLis = solo.evidenceEvents
      .filter((e) => discovered.has(e.id))
      .map(
        (e) =>
          `<li><code>${e.type}</code> ${e.playerId}${
            'gateId' in e && e.gateId ? ` · ${e.gateId}` : ''
          } <span class="lx-muted">(${e.source})</span></li>`,
      )
      .join('');
    const board = solo.npcIds
      .map((id) => {
        const selected = boardOdors[id] ?? '';
        return `<label class="lx-board-row">${id}
          <select data-board-odor="${id}">
            <option value="">—</option>
            ${LABYRINTH_ODOR_IDS.map(
              (oid) =>
                `<option value="${oid}" ${oid === selected ? 'selected' : ''}>${oid}</option>`,
            ).join('')}
          </select>
        </label>`;
      })
      .join('');

    options.root.innerHTML = `
      <section class="lx-shell" data-phase="${phase}">
        <h1>${isVerdict ? copy.verdict : copy.review}</h1>
        <p data-solution-hint>${
          status.unique
            ? copy.solutionUnique
            : copy.solutionMultiple.replace('{n}', String(status.count))
        }</p>
        <div class="lx-columns">
          <div>
            <h2>${copy.evidence}</h2>
            <ul>${evidenceLis || `<li>${copy.noEvidence}</li>`}</ul>
            <h2>${copy.statements}</h2>
            <ul>${statements}</ul>
          </div>
          <div>
            <h2>${copy.board}</h2>
            <p class="lx-muted">${copy.boardHint}</p>
            ${board}
            <label>${copy.pickPhantom}
              <select data-board-phantom>
                <option value="">—</option>
                ${solo.npcIds
                  .map(
                    (id) =>
                      `<option value="${id}" ${boardPhantom === id ? 'selected' : ''}>${id}</option>`,
                  )
                  .join('')}
              </select>
            </label>
          </div>
        </div>
        <div class="lx-menu-actions">
          <button type="button" class="primary-button" data-continue>${
            isVerdict ? copy.submitVerdict : copy.continue
          }</button>
        </div>
      </section>`;
    options.root.querySelectorAll('[data-board-odor]').forEach((el) => {
      el.addEventListener('change', () => {
        const id = (el as HTMLSelectElement).dataset.boardOdor!;
        boardOdors[id] = (el as HTMLSelectElement).value as LabyrinthOdorId | '';
      });
    });
    options.root.querySelector('[data-board-phantom]')?.addEventListener('change', (e) => {
      boardPhantom = (e.target as HTMLSelectElement).value;
    });
    options.root.querySelector('[data-continue]')?.addEventListener('click', () => {
      if (isVerdict) {
        verdict = {
          accusedPhantomPlayerId: boardPhantom,
          accusedAssignments: Object.entries(boardOdors)
            .filter(([, odor]) => odor)
            .map(([playerId, odorId]) => ({
              playerId,
              odorId: odorId as LabyrinthOdorId,
            })),
        };
        for (const id of solo!.requiredEvidenceIds) discovered.add(id);
        phase = 'debrief';
      } else if (phase === 'review1') {
        phase = 'explore2';
        exploreDeadlineMs = 150_000;
        paint();
        bootExplore();
        return;
      } else {
        phase = 'verdict';
      }
      paint();
    });
  };

  const paintDebrief = (copy: CampaignCopy) => {
    if (!solo) return;
    const score = scoreSoloRound({
      solo,
      verdict,
      discoveredIds: discovered,
      elapsedMs: roundElapsedMs,
    });
    settings = recordSoloBest(settings, solo.seed, score.total);
    saveSettings(settings);
    const rows = buildDebriefRows(solo, verdict, discovered);
    const rowHtml = rows
      .map((r) => {
        const ev = solo!.evidenceEvents.filter(
          (e) => discovered.has(e.id) && e.playerId === r.playerId,
        );
        return `<article class="lx-debrief-row">
          <h3>${r.playerId} ${r.isPhantomTruth ? `(${copy.phantom})` : ''}</h3>
          <p>${copy.truth}: ${r.truthOdorId} · ${copy.guess}: ${r.guessedOdorId ?? '—'}
             · phantom guess: ${r.isPhantomGuess}</p>
          <ul>${ev
            .map(
              (e) =>
                `<li>${e.type} @ ${e.source} [${e.timeWindow.startMs}–${e.timeWindow.endMs}]</li>`,
            )
            .join('')}</ul>
        </article>`;
      })
      .join('');
    options.root.innerHTML = `
      <section class="lx-shell" data-phase="debrief">
        <h1>${copy.debrief}</h1>
        <div class="lx-score">
          <div>${copy.scoreCase}: <strong>${score.caseSolved}</strong></div>
          <div>${copy.scoreOdor}: <strong>${score.odorAssignments}</strong></div>
          <div>${copy.scoreEvidence}: <strong>${score.evidenceFound}</strong></div>
          <div>${copy.scoreTime}: <strong>${score.time}</strong></div>
          <div>${copy.scoreTotal}: <strong>${score.total}</strong></div>
        </div>
        ${rowHtml}
        <button type="button" class="primary-button" data-menu>${copy.backMenu}</button>
      </section>`;
    options.root.querySelector('[data-menu]')?.addEventListener('click', () => {
      phase = 'menu';
      paint();
    });
  };

  const updateHud = () => {
    const s = session;
    if (!solo || !s) return;
    const status = solutionStatusForEvidence(solo, discovered);
    const hint = options.root.querySelector('[data-solution-hint]');
    const count = options.root.querySelector('[data-ev-count]');
    const roomEl = options.root.querySelector('[data-sum-room]');
    const promptEl = options.root.querySelector<HTMLElement>('[data-prompt]');
    const nextEl = options.root.querySelector('[data-next-hint]');
    const copy = c();
    if (count) count.textContent = String(discovered.size);
    if (hint) {
      hint.textContent = status.unique
        ? copy.solutionUnique
        : copy.solutionMultiple.replace('{n}', String(status.count));
    }
    if (nextEl) {
      nextEl.innerHTML = `<strong>${copy.nextStep ?? 'Next'}:</strong> ${nextStepHint(copy)}`;
    }
    const room = s.map.rooms.find((r) => r.id === currentRoomId(s));
    if (roomEl) {
      roomEl.textContent = room?.name[options.getLocale()] ?? room?.name.en ?? '—';
    }
    const nearby = findNearbyInteractables(s.map, s.player.position, 1.8)[0];
    if (promptEl && !promptEl.dataset.lock) {
      const prompt = promptFor(nearby, s, copy as LabyrinthCopy);
      promptEl.textContent = prompt || copy.interactNone || '';
      (promptEl as HTMLElement).dataset.near = nearby ? '1' : '0';
    }

    const rid = currentRoomId(s);
    const banner = options.root.querySelector<HTMLElement>('[data-room-banner]');
    if (rid && rid !== lastRoomId) {
      lastRoomId = rid;
      roomBannerUntilMs = roundElapsedMs + 1_800;
      const room = s.map.rooms.find((r) => r.id === rid);
      const name = room?.name[options.getLocale()] ?? room?.name.en ?? rid;
      if (banner) {
        banner.hidden = false;
        banner.textContent = (copy.roomEnter || '{room}').replace('{room}', name);
      }
    } else if (banner && roundElapsedMs >= roomBannerUntilMs) {
      banner.hidden = true;
    }

    const stage = options.root.querySelector<HTMLElement>('[data-lx-stage]');
    if (stage) stage.dataset.threat = threatNear ? '1' : '0';
  };

  const flashPrompt = (text: string, near = true) => {
    const promptEl = options.root.querySelector<HTMLElement>('[data-prompt]');
    if (!promptEl) return;
    promptEl.textContent = text;
    promptEl.dataset.near = near ? '1' : '0';
    promptEl.dataset.lock = '1';
    window.setTimeout(() => {
      delete promptEl.dataset.lock;
      updateHud();
    }, 1400);
  };

  const tryDiscoverNearby = () => {
    const s = session;
    if (!s || !solo) return;
    const copy = c();
    const nearby = findNearbyInteractables(s.map, s.player.position, 1.8)[0];
    if (!nearby) {
      flashPrompt(copy.interactNone || '', false);
      return;
    }

    const beforeDoors = new Map(s.doors);
    let gotCount = 0;
    if (nearby.kind === 'scanner') {
      for (const ev of solo.evidenceEvents) {
        if (discovered.has(ev.id)) continue;
        if (ev.type === 'positiveChannel' || ev.type === 'negativeChannel') {
          discovered.add(ev.id);
          gotCount += 1;
          if (gotCount >= 3) break;
        }
      }
    }
    if (nearby.kind === 'door') {
      const ev = solo.evidenceEvents.find((e) => e.type === 'doorLog' && !discovered.has(e.id));
      if (ev) {
        discovered.add(ev.id);
        gotCount += 1;
      }
    }
    if (nearby.kind === 'gate') {
      const ev = solo.evidenceEvents.find(
        (e) =>
          (e.type === 'artifactTrace' || e.type === 'observedGateUse') &&
          !discovered.has(e.id),
      );
      if (ev) {
        discovered.add(ev.id);
        gotCount += 1;
      }
    }

    // Door toggle happens in tickExploration on the same press — compare after next tick in frame.
    // Here we report based on discover result + kind.
    if (gotCount > 0) {
      flashPrompt(
        (copy.interactGotEvidenceCount || copy.interactGotEvidence || '').replace(
          '{n}',
          String(gotCount),
        ),
      );
    } else if (nearby.kind === 'door') {
      const open = s.doors.get(nearby.doorId ?? '') !== false;
      // After tickExploration in the same frame, door state may have flipped already.
      // Prefer a generic door feedback.
      void beforeDoors;
      flashPrompt(open ? copy.interactDoorOpened || copy.interactDoor : copy.interactDoorClosed || copy.interactDoor);
    } else if (nearby.kind === 'scanner') {
      flashPrompt(copy.interactNoNewEvidence || copy.interactScanner);
    } else if (nearby.kind === 'gate') {
      flashPrompt(promptFor(nearby, s, copy as LabyrinthCopy) || copy.interact);
    } else if (nearby.kind === 'task') {
      if (!activeTask) {
        openTask();
        flashPrompt(copy.interactTaskStart || copy.interactTaskHint || copy.interactTask);
      } else {
        flashPrompt(copy.interactTaskHint || copy.interactTask);
      }
    } else if (nearby.kind === 'review') {
      flashPrompt(copy.interactReviewHint || copy.interactReview);
    } else {
      flashPrompt(copy.interactNoNewEvidence || copy.interact);
    }
    updateHud();
  };

  const prefs = (): RenderPrefs => ({
    lowDarkness: settings.lowDarkness,
    highContrast: settings.highContrast,
    reducedMotion: settings.reducedMotion,
    showDevOverlay: import.meta.env.DEV,
  });

  const onResize = () => fitCanvas();
  const onVis = () => {
    if (
      document.visibilityState === 'hidden' &&
      (phase === 'explore1' || phase === 'explore2')
    ) {
      paused = true;
      const overlay = options.root.querySelector<HTMLElement>('[data-pause-overlay]');
      const stage = options.root.querySelector<HTMLElement>('[data-lx-stage]');
      if (overlay) overlay.hidden = false;
      if (stage) stage.dataset.paused = 'true';
    }
  };

  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVis);

  const frame = (now: number) => {
    if (!running) return;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;

    if (phase === 'explore1' || phase === 'explore2') {
      if (resumeCountdown != null) {
        resumeCountdown -= dt;
        const body = options.root.querySelector('[data-pause-body]');
        if (body) body.textContent = String(Math.max(1, Math.ceil(resumeCountdown)));
        if (resumeCountdown <= 0) {
          resumeCountdown = null;
          paused = false;
          const overlay = options.root.querySelector<HTMLElement>('[data-pause-overlay]');
          const stage = options.root.querySelector<HTMLElement>('[data-lx-stage]');
          if (overlay) overlay.hidden = true;
          if (stage) stage.dataset.paused = 'false';
        }
      } else if (!paused && session) {
        const snap = input.sample(session.player.facing);
        if (snap.pausePressed) {
          paused = true;
          const overlay = options.root.querySelector<HTMLElement>('[data-pause-overlay]');
          const stage = options.root.querySelector<HTMLElement>('[data-lx-stage]');
          if (overlay) overlay.hidden = false;
          if (stage) stage.dataset.paused = 'true';
        } else {
          if (activeTask?.kind === 'patternPair') {
            for (let i = 0; i < 3; i += 1) {
              /* 1-3 handled via focusable buttons */
            }
          }
          acc += dt;
          roundElapsedMs += dt * 1000;
          exploreDeadlineMs -= dt * 1000;
          const stunned = roundElapsedMs < stunUntilMs;
          const intent = {
            moveX: stunned || activeTask ? 0 : snap.moveX,
            moveY: stunned || activeTask ? 0 : snap.moveY,
            aimAngle: snap.aimAngle,
            interactPressed: activeTask ? false : snap.interactPressed,
          };
          while (acc >= FIXED_DT) {
            session = tickExploration(session, intent, FIXED_DT);
            // Consume interact once; suppress canvas flash (feedback is DOM prompt).
            if (session.interactFlashId) {
              session = { ...session, interactFlashId: null };
            }
            intent.interactPressed = false;
            acc -= FIXED_DT;
          }
          if (snap.interactPressed && !activeTask) tryDiscoverNearby();

          if (activeTask) {
            activeTask = tickSoloTask(activeTask, dt * 1000);
            refreshTaskChrome();
            if (activeTask.completed || activeTask.aborted) finishTaskIfDone();
          }

          // Advance NPC visual tweens every frame.
          for (const vis of npcVisual.values()) {
            if (vis.t < 1) vis.t = Math.min(1, vis.t + (dt * 1000) / NPC_STEP_MS);
          }

          npcAcc += dt * 1000;
          if (npcAcc >= NPC_STEP_MS && solo) {
            npcAcc = 0;
            const stepped = tickNpcs(
              npcs,
              session.doors as Map<string, boolean>,
              roundElapsedMs,
              evidenceSeq,
            );
            npcs = stepped.npcs;
            session = { ...session, doors: stepped.doors };

            // Phantom hunt / dodge: chase player when close; catch = brief stun (not kill).
            const phantomIdx = npcs.findIndex((n) => n.isPhantom);
            if (phantomIdx >= 0 && roundElapsedMs >= huntCooldownUntilMs) {
              const phantom = { ...npcs[phantomIdx]! };
              const dist = Math.hypot(
                session.player.position.x - (phantom.tile.x + 0.5),
                session.player.position.y - (phantom.tile.y + 0.5),
              );
              threatNear = dist < HUNT_RANGE;
              if (dist < CATCH_RANGE && !activeTask) {
                stunUntilMs = roundElapsedMs + 1_600;
                huntCooldownUntilMs = roundElapsedMs + 4_500;
                threatNear = false;
                flashPrompt(c().threatCaught || '');
                // Nudge phantom away after catch.
                const away = {
                  x: Math.max(
                    1,
                    Math.min(
                      MAP_V1.width - 2,
                      phantom.tile.x + (phantom.tile.x < session.player.position.x ? -2 : 2),
                    ),
                  ),
                  y: phantom.tile.y,
                };
                const perms = actorPerms(phantom.odorId, true, true);
                const flee = shortestPath(
                  MAP_V1,
                  phantom.tile,
                  away,
                  perms,
                  session.doors as Map<string, boolean>,
                );
                if (flee && flee.length > 1) {
                  const to = flee[1]!;
                  const move = tryMove(
                    MAP_V1,
                    phantom.tile,
                    to,
                    perms,
                    session.doors as Map<string, boolean>,
                  );
                  if (move.ok) {
                    phantom.tile = to;
                    phantom.facing = Math.atan2(to.y - flee[0]!.y, to.x - flee[0]!.x);
                  }
                }
                npcs = npcs.map((n, i) => (i === phantomIdx ? phantom : n));
              } else if (dist < HUNT_RANGE && !activeTask && !stunned) {
                const target = {
                  x: Math.floor(session.player.position.x),
                  y: Math.floor(session.player.position.y),
                };
                const perms = actorPerms(phantom.odorId, true, true);
                const path = shortestPath(
                  MAP_V1,
                  phantom.tile,
                  target,
                  perms,
                  session.doors as Map<string, boolean>,
                );
                if (path && path.length > 1) {
                  const to = path[1]!;
                  const move = tryMove(
                    MAP_V1,
                    phantom.tile,
                    to,
                    perms,
                    session.doors as Map<string, boolean>,
                  );
                  if (move.ok) {
                    phantom.tile = to;
                    phantom.path = path;
                    phantom.pathIndex = 1;
                    phantom.facing = Math.atan2(to.y - path[0]!.y, to.x - path[0]!.x);
                    npcs = npcs.map((n, i) => (i === phantomIdx ? phantom : n));
                    if (dist < 3.2 && roundElapsedMs >= chasePromptUntilMs) {
                      chasePromptUntilMs = roundElapsedMs + 2_400;
                      flashPrompt(c().threatChase || '', true);
                    }
                  }
                }
              }
            } else {
              threatNear = false;
            }

            for (const n of npcs) {
              const tx = n.tile.x + 0.5;
              const ty = n.tile.y + 0.5;
              const prev = npcVisual.get(n.id);
              if (!prev) {
                npcVisual.set(n.id, { fromX: tx, fromY: ty, toX: tx, toY: ty, t: 1 });
              } else if (Math.hypot(prev.toX - tx, prev.toY - ty) > 0.01) {
                const ease = Math.min(1, prev.t);
                const e = ease * ease * (3 - 2 * ease);
                const curX = prev.fromX + (prev.toX - prev.fromX) * e;
                const curY = prev.fromY + (prev.toY - prev.fromY) * e;
                npcVisual.set(n.id, {
                  fromX: curX,
                  fromY: curY,
                  toX: tx,
                  toY: ty,
                  t: 0,
                });
              }
            }
            for (const ev of stepped.events) {
              if (ev.type === 'evidence') {
                const npc = npcs.find((n) => n.id === ev.evidence.playerId);
                if (npc) {
                  const dist = Math.hypot(
                    session.player.position.x - (npc.tile.x + 0.5),
                    session.player.position.y - (npc.tile.y + 0.5),
                  );
                  if (dist < 5) discovered.add(ev.evidence.id);
                }
              }
            }
          }
          syncNpcActors();
          updateHud();

          if (exploreDeadlineMs <= 0) advanceFromExplore();
        }
      } else if (paused) {
        const snap = input.sample(session?.player.facing ?? 0);
        if (snap.pausePressed) resumeCountdown = 3;
      }

      if (session && renderer) {
        camera.x += (session.player.position.x - camera.x) * Math.min(1, dt * 8);
        camera.y += (session.player.position.y - camera.y) * Math.min(1, dt * 8);
        renderer.render(session, camera, paused ? 1 : acc / FIXED_DT, prefs(), {
          fps: 1 / Math.max(dt, 0.001),
          rayCount: 0,
          roomId: currentRoomId(session),
          gatePermission: session.lastGateBlockReason ?? '—',
        });
      }
    }

    raf = requestAnimationFrame(frame);
  };

  paint();
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      input.detach();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    },
  };
}
