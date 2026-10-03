type SfxKind = 'scan' | 'pickup' | 'chest' | 'hit' | 'secret' | 'seal' | 'miss' | 'open';

export function createLabyrinthSfx() {
  let ctx: AudioContext | null = null;
  let lastAt = 0;
  let lastKind: SfxKind | '' = '';

  const ensure = () => {
    if (ctx) return ctx;
    const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  };

  const tone = (freq: number, dur: number, type: OscillatorType, gain = 0.04, slide = 0) => {
    const ac = ensure();
    if (!ac) return;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), ac.currentTime + dur);
    g.gain.setValueAtTime(gain, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur);
  };

  const play = (kind: SfxKind, muted: boolean) => {
    if (muted) return;
    const now = performance.now();
    if (kind === lastKind && now - lastAt < 80) return;
    lastAt = now;
    lastKind = kind;
    if (kind === 'scan') {
      tone(420, 0.18, 'sine', 0.03, 280);
      tone(640, 0.22, 'triangle', 0.018, 120);
    } else if (kind === 'pickup') {
      tone(520, 0.12, 'sine', 0.04, 260);
    } else if (kind === 'chest') {
      tone(180, 0.1, 'square', 0.03);
      tone(420, 0.16, 'triangle', 0.03, 180);
    } else if (kind === 'hit') {
      tone(160, 0.08, 'sawtooth', 0.035, -40);
    } else if (kind === 'secret') {
      tone(360, 0.2, 'sine', 0.03, 400);
    } else if (kind === 'seal') {
      tone(300, 0.16, 'triangle', 0.035);
      tone(480, 0.22, 'sine', 0.03, 200);
    } else if (kind === 'miss') {
      tone(140, 0.1, 'square', 0.02, -50);
    } else {
      tone(240, 0.12, 'sine', 0.03, 80);
    }
  };

  return { play, unlock: ensure };
}
