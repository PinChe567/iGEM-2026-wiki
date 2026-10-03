import type { AdventureIntent } from '@suite/core/labyrinth';

export type AdventureInputSnapshot = AdventureIntent & {
  hintPressed: boolean;
  libraryPressed: boolean;
};

export type AdventureInput = {
  attach: (root: HTMLElement) => void;
  detach: () => void;
  sample: () => AdventureInputSnapshot;
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

export function createAdventureInput(): AdventureInput {
  const keys = new Set<string>();
  let attackEdge = false;
  let scanEdge = false;
  let interactEdge = false;
  let pauseEdge = false;
  let hintEdge = false;
  let libraryEdge = false;
  let selectScentIndex: number | null = null;
  let joyActive = false;
  let joyVec = { x: 0, y: 0 };

  const onKeyDown = (e: KeyboardEvent) => {
    const target = e.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
    if (e.code === 'Space') {
      if (!e.repeat) attackEdge = true;
      e.preventDefault();
    }
    if (e.code === 'KeyQ') {
      if (!e.repeat) scanEdge = true;
      e.preventDefault();
    }
    if (e.code === 'KeyE') {
      if (!e.repeat) interactEdge = true;
      e.preventDefault();
    }
    if (e.code === 'Escape') {
      if (!e.repeat) pauseEdge = true;
      e.preventDefault();
    }
    if (e.code === 'KeyH') {
      if (!e.repeat) hintEdge = true;
      e.preventDefault();
    }
    if (e.code === 'Tab') {
      if (!e.repeat) libraryEdge = true;
      e.preventDefault();
    }
    if (e.code.startsWith('Digit') && !e.repeat) {
      const n = Number(e.code.slice(5));
      if (n >= 1 && n <= 7) selectScentIndex = n - 1;
    }
    keys.add(e.code);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    keys.delete(e.code);
  };

  const attachJoystick = (root: HTMLElement) => {
    const stick = root.querySelector<HTMLElement>('[data-joystick]');
    const knob = root.querySelector<HTMLElement>('[data-joystick-knob]');
    const attack = root.querySelector<HTMLElement>('[data-attack-btn]');
    const scan = root.querySelector<HTMLElement>('[data-scan-btn]');
    const interact = root.querySelector<HTMLElement>('[data-interact-btn]');
    if (stick && knob) {
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
        knob.style.transform = `translate(${dx * 26}px, ${dy * 26}px)`;
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
        if (joyActive) setJoy(e.clientX, e.clientY);
      });
      stick.addEventListener('pointerup', clearJoy);
      stick.addEventListener('pointercancel', clearJoy);
    }
    attack?.addEventListener('pointerdown', (e) => {
      attackEdge = true;
      e.preventDefault();
    });
    scan?.addEventListener('pointerdown', (e) => {
      scanEdge = true;
      e.preventDefault();
    });
    interact?.addEventListener('pointerdown', (e) => {
      interactEdge = true;
      e.preventDefault();
    });
  };

  return {
    attach(root) {
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      attachJoystick(root);
    },
    detach() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      keys.clear();
    },
    sample() {
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
      const snap: AdventureInputSnapshot = {
        moveX,
        moveY,
        attackPressed: attackEdge,
        scanPressed: scanEdge,
        interactPressed: interactEdge,
        pausePressed: pauseEdge,
        selectScentId: null,
        selectScentIndex,
        hintPressed: hintEdge,
        libraryPressed: libraryEdge,
      };
      attackEdge = scanEdge = interactEdge = pauseEdge = hintEdge = libraryEdge = false;
      selectScentIndex = null;
      return snap;
    },
  };
}
