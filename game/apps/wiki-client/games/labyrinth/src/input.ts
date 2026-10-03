/**
 * Desktop + mobile input → ExplorationIntent.
 * Never writes player position; the sim loop consumes intents only.
 */

import type { ExplorationIntent } from '@suite/core/labyrinth';

export type InputSnapshot = ExplorationIntent & {
  pausePressed: boolean;
  aimFromPointer: boolean;
};

export type InputController = {
  attach: (root: HTMLElement, canvas: HTMLCanvasElement) => void;
  detach: () => void;
  /** Consume one-frame edge triggers (interact / pause). */
  sample: (facingFallback: number) => InputSnapshot;
  setCanvasToWorld: (fn: (clientX: number, clientY: number) => { x: number; y: number } | null) => void;
};

const KEY_MOVE: Record<string, { x: number; y: number }> = {
  KeyW: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

export function createInputController(): InputController {
  const keys = new Set<string>();
  let interactEdge = false;
  let pauseEdge = false;
  let pointerAim: { x: number; y: number } | null = null;
  let keyboardAimDelta = 0;
  let canvasToWorld: ((clientX: number, clientY: number) => { x: number; y: number } | null) | null =
    null;

  // Mobile joystick
  let joyActive = false;
  let joyVec = { x: 0, y: 0 };
  let aimDragActive = false;
  let aimAngleMobile: number | null = null;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'KeyE') {
      if (!e.repeat) interactEdge = true;
      e.preventDefault();
    }
    if (e.code === 'Escape') {
      if (!e.repeat) pauseEdge = true;
      e.preventDefault();
    }
    if (e.code === 'KeyQ') keyboardAimDelta -= 1;
    if (e.code === 'KeyR' || e.code === 'KeyE') {
      /* E handled as interact; R also rotates right as alt */
    }
    if (e.code === 'KeyR') keyboardAimDelta += 1;
    keys.add(e.code);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    keys.delete(e.code);
  };

  let rootEl: HTMLElement | null = null;
  let canvasEl: HTMLCanvasElement | null = null;

  const onPointerMove = (e: PointerEvent) => {
    if (!canvasEl || aimDragActive) return;
    if (e.pointerType === 'touch') return;
    pointerAim = { x: e.clientX, y: e.clientY };
  };

  const attachJoystick = (root: HTMLElement) => {
    const stick = root.querySelector<HTMLElement>('[data-joystick]');
    const knob = root.querySelector<HTMLElement>('[data-joystick-knob]');
    const aimPad = root.querySelector<HTMLElement>('[data-aim-pad]');
    const interactBtn = root.querySelector<HTMLElement>('[data-interact-btn]');
    if (!stick || !knob || !aimPad || !interactBtn) return;

    const setJoy = (clientX: number, clientY: number) => {
      const rect = stick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = (clientX - cx) / (rect.width / 2);
      let dy = (clientY - cy) / (rect.height / 2);
      const mag = Math.hypot(dx, dy);
      if (mag > 1) {
        dx /= mag;
        dy /= mag;
      }
      joyVec = { x: dx, y: dy };
      knob.style.transform = `translate(${dx * 28}px, ${dy * 28}px)`;
    };

    const clearJoy = () => {
      joyActive = false;
      joyVec = { x: 0, y: 0 };
      knob.style.transform = 'translate(0,0)';
    };

    stick.addEventListener('pointerdown', (e) => {
      joyActive = true;
      stick.setPointerCapture(e.pointerId);
      setJoy(e.clientX, e.clientY);
      e.preventDefault();
    });
    stick.addEventListener('pointermove', (e) => {
      if (!joyActive) return;
      setJoy(e.clientX, e.clientY);
    });
    stick.addEventListener('pointerup', clearJoy);
    stick.addEventListener('pointercancel', clearJoy);

    aimPad.addEventListener('pointerdown', (e) => {
      aimDragActive = true;
      aimPad.setPointerCapture(e.pointerId);
      const rect = aimPad.getBoundingClientRect();
      aimAngleMobile = Math.atan2(
        e.clientY - (rect.top + rect.height / 2),
        e.clientX - (rect.left + rect.width / 2),
      );
      e.preventDefault();
    });
    aimPad.addEventListener('pointermove', (e) => {
      if (!aimDragActive) return;
      const rect = aimPad.getBoundingClientRect();
      aimAngleMobile = Math.atan2(
        e.clientY - (rect.top + rect.height / 2),
        e.clientX - (rect.left + rect.width / 2),
      );
    });
    aimPad.addEventListener('pointerup', () => {
      aimDragActive = false;
    });
    aimPad.addEventListener('pointercancel', () => {
      aimDragActive = false;
    });

    interactBtn.addEventListener('pointerdown', (e) => {
      interactEdge = true;
      e.preventDefault();
    });
  };

  return {
    attach(root, canvas) {
      rootEl = root;
      canvasEl = canvas;
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('pointermove', onPointerMove);
      attachJoystick(root);
    },
    detach() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      rootEl = null;
      canvasEl = null;
      void rootEl;
    },
    setCanvasToWorld(fn) {
      canvasToWorld = fn;
    },
    sample(facingFallback) {
      let moveX = 0;
      let moveY = 0;
      for (const code of keys) {
        const m = KEY_MOVE[code];
        if (m) {
          moveX += m.x;
          moveY += m.y;
        }
      }
      if (joyActive) {
        moveX += joyVec.x;
        moveY += joyVec.y;
      }

      let aimAngle = facingFallback;
      if (aimAngleMobile != null && (aimDragActive || aimAngleMobile !== null)) {
        if (aimDragActive || aimAngleMobile !== null) {
          // Prefer mobile aim while dragging; keep last mobile angle briefly
          if (aimDragActive && aimAngleMobile != null) aimAngle = aimAngleMobile;
          else if (aimAngleMobile != null && !pointerAim) aimAngle = aimAngleMobile;
        }
      }
      if (pointerAim && canvasToWorld && !aimDragActive) {
        const world = canvasToWorld(pointerAim.x, pointerAim.y);
        if (world) {
          // Caller supplies player pos via closure in setCanvasToWorld typically;
          // here world is absolute — game.ts passes a fn that returns aim point relative.
          aimAngle = Math.atan2(world.y, world.x);
        }
      }
      if (keyboardAimDelta !== 0) {
        aimAngle = facingFallback + keyboardAimDelta * 0.08;
        keyboardAimDelta = 0;
      }
      // Q / . rotate while held
      if (keys.has('KeyQ') || keys.has('Comma')) aimAngle = facingFallback - 0.06;
      if (keys.has('KeyR') || keys.has('Period')) aimAngle = facingFallback + 0.06;

      const snap: InputSnapshot = {
        moveX,
        moveY,
        aimAngle,
        interactPressed: interactEdge,
        pausePressed: pauseEdge,
        aimFromPointer: Boolean(pointerAim) && !aimDragActive,
      };
      interactEdge = false;
      pauseEdge = false;
      return snap;
    },
  };
}
