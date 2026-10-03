import { getSpectrumOdor } from '@suite/content';
import { io, type Socket } from 'socket.io-client';
import {
  createSpectrumRaceRoom,
  fetchDaily,
  fetchLeaderboard,
  fetchWsTicket,
  finishSpectrumDailyRun,
  guessSpectrumDailyRun,
  joinSpectrumRaceRoom,
  spectrumVersions,
  startSpectrumDailyRun,
  submitReport,
  type SpectrumComponent,
  type SpectrumStartRun,
} from './api';

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function odorName(id: string): string {
  return getSpectrumOdor(id)?.name.en ?? id;
}

function signalBars(signal: number[]): string {
  return `<div class="signal-bars" aria-label="12-channel target signal">${signal
    .map(
      (v, i) =>
        `<span title="ch${i + 1}: ${v.toFixed(3)}" style="height:${Math.max(4, Math.round(v * 100))}%"></span>`,
    )
    .join('')}</div>`;
}

let spectrumRun: SpectrumStartRun | null = null;
let busy = false;
let raceSocket: Socket | null = null;

export async function paintSpectrumDaily(
  root: HTMLElement,
  renderShell: (body: string) => void,
): Promise<void> {
  const daily = await fetchDaily('spectrum');
  if (!daily.ok) {
    renderShell(`<p class="warn">Spectrum daily unavailable: ${escape(daily.error)}</p>`);
    return;
  }
  const d = daily.data as {
    challengeId: string;
    date: string;
    protocolVersion: string;
    gameVersion: string;
    contentVersion: string;
    observedSignal?: number[];
    poolIds?: string[];
    maxGuesses?: number;
    rankedPolicy?: string;
    metadata?: { rankedPolicyNote?: string };
  };
  const board = await fetchLeaderboard(d.challengeId);

  if (spectrumRun && !spectrumRun.solved) {
    paintSpectrumPlay(root, renderShell, spectrumRun);
    return;
  }

  const entries = board.ok ? ((board.data as { entries?: unknown[]; participation?: unknown[] }).entries ?? []) : [];
  const participation =
    board.ok ? ((board.data as { participation?: Array<{ nickname: string }> }).participation ?? []) : [];

  renderShell(`
    <section class="card-block" data-testid="spectrum-daily-hub">
      <h2>Daily Challenge · Scent Spectrum</h2>
      <p class="badge verified" data-testid="spectrum-verified">Server verified</p>
      <p>UTC date: <strong>${escape(d.date)}</strong></p>
      <p>Versions: ${escape(d.protocolVersion)} / ${escape(d.gameVersion)} / ${escape(d.contentVersion)}</p>
      <p class="disclaimer">${escape(
        d.metadata?.rankedPolicyNote ??
          'First completed run per guest is ranked. Unsolved participation never ranks above solvers.',
      )}</p>
      ${d.observedSignal ? signalBars(d.observedSignal) : ''}
      <div class="actions">
        <button type="button" class="primary-button" data-testid="start-spectrum">Start / resume</button>
      </div>
      <h3>Solved leaderboard</h3>
      <ol data-testid="spectrum-lb">
        ${(entries as Array<{ nickname: string; guessesUsed?: number; durationMs?: number }>)
          .map(
            (e) =>
              `<li>${escape(e.nickname)} — ${e.guessesUsed ?? '?'} guesses · ${e.durationMs ?? '?'} ms</li>`,
          )
          .join('') || '<li class="muted">No solved ranked entries</li>'}
      </ol>
      <h3>Participation (unsolved)</h3>
      <ul data-testid="spectrum-participation">
        ${participation.map((e) => `<li>${escape(e.nickname)}</li>`).join('') ||
          '<li class="muted">None</li>'}
      </ul>
    </section>
  `);

  root.querySelector('[data-testid="start-spectrum"]')?.addEventListener('click', async () => {
    const res = await startSpectrumDailyRun();
    if (!res.ok) {
      alert(res.error);
      return;
    }
    spectrumRun = res.data;
    paintSpectrumPlay(root, renderShell, res.data);
  });
}

function paintSpectrumPlay(
  root: HTMLElement,
  renderShell: (body: string) => void,
  run: SpectrumStartRun,
): void {
  const step = run.ratioRules.percentStep;

  renderShell(`
    <section class="card-block" data-testid="spectrum-play">
      <p class="badge verified">Server verified · ${Math.floor(run.elapsedMs / 1000)}s</p>
      <p>${run.rankedEligible ? 'Ranked run' : 'Practice / unranked'}</p>
      <p>Guesses ${run.guessesUsed}/${run.maxGuesses}${
        run.truthComponentCount != null ? ` · truth uses ${run.truthComponentCount} odors` : ''
      }</p>
      ${signalBars(run.observedSignal)}
      <div class="pool-grid" data-testid="spectrum-pool">
        ${run.poolIds
          .map(
            (id) =>
              `<label class="pool-item"><input type="checkbox" data-odor="${escape(id)}" /> ${escape(
                odorName(id),
              )} <input type="number" data-pct="${escape(id)}" min="${run.ratioRules.minPercent}" max="100" step="${step}" value="${step}" disabled /></label>`,
          )
          .join('')}
      </div>
      <button type="button" class="primary-button" data-testid="submit-guess">Submit guess</button>
      <p class="muted" data-testid="spectrum-feedback"></p>
      <ol data-testid="spectrum-history">
        ${run.history
          .map((h) => `<li>#${h.attemptNumber} ${escape(h.abLabel)} · fit ${h.fit}</li>`)
          .join('')}
      </ol>
    </section>
  `);

  root.querySelectorAll<HTMLInputElement>('[data-odor]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const id = cb.getAttribute('data-odor')!;
      const pct = root.querySelector<HTMLInputElement>(`[data-pct="${id}"]`);
      if (pct) pct.disabled = !cb.checked;
    });
  });

  root.querySelector('[data-testid="submit-guess"]')?.addEventListener('click', async () => {
    if (busy) return;
    const components: SpectrumComponent[] = [];
    root.querySelectorAll<HTMLInputElement>('[data-odor]').forEach((cb) => {
      if (!cb.checked) return;
      const id = cb.getAttribute('data-odor')!;
      const pct = root.querySelector<HTMLInputElement>(`[data-pct="${id}"]`);
      components.push({ odorId: id, percent: Number(pct?.value ?? 0) });
    });
    busy = true;
    const res = await guessSpectrumDailyRun(run.runId, components);
    busy = false;
    const fb = root.querySelector('[data-testid="spectrum-feedback"]');
    if (!res.ok) {
      if (fb) fb.textContent = res.error;
      return;
    }
    if (fb) fb.textContent = `${res.data.abLabel} · fit ${res.data.fit}`;
    spectrumRun = {
      ...run,
      guessesUsed: res.data.guessesUsed,
      guessesRemaining: res.data.guessesRemaining,
      solved: res.data.solved,
      history: [
        ...run.history,
        {
          attemptNumber: res.data.attemptNumber,
          guess: { components },
          abLabel: res.data.abLabel,
          fit: res.data.fit,
        },
      ],
    };
    if (res.data.complete || res.data.solved) {
      await completeSpectrum(root, renderShell, run.runId);
      return;
    }
    paintSpectrumPlay(root, renderShell, spectrumRun);
  });
}

async function completeSpectrum(
  root: HTMLElement,
  renderShell: (body: string) => void,
  runId: string,
): Promise<void> {
  const res = await finishSpectrumDailyRun(runId);
  spectrumRun = null;
  if (!res.ok) {
    renderShell(`<p class="warn">Finish failed: ${escape(res.error)}</p>`);
    return;
  }
  const r = res.data;
  renderShell(`
    <section class="card-block" data-testid="spectrum-result">
      <p class="badge verified">Server verified</p>
      <h2>Result</h2>
      <p>${r.solved ? 'Solved' : 'Unsolved'} · ${r.ranked ? 'Ranked' : 'Unranked'}</p>
      <p>Guesses ${r.guessesUsed} · ${r.durationMs} ms · score ${r.totalScore} (guess ${r.guessScore} + time ${r.timeScore})</p>
      <p>Truth: ${r.truth.components.map((c) => `${escape(odorName(c.odorId))} ${c.percent}%`).join(' + ')}</p>
      <ol>${r.guessLog.map((g) => `<li>#${g.attemptNumber} ${escape(g.abLabel)} · fit ${g.fit}</li>`).join('')}</ol>
      <button type="button" class="ghost-button" data-testid="spectrum-report">Report a problem</button>
    </section>
  `);
  root.querySelector('[data-testid="spectrum-report"]')?.addEventListener('click', async () => {
    const note = prompt('Describe the issue:') ?? '';
    if (!note.trim()) return;
    await submitReport({ reason: 'spectrum_challenge_issue', challengeId: r.challengeId, runId, note });
    alert('Report queued');
  });
}

export async function paintSpectrumRace(
  root: HTMLElement,
  renderShell: (body: string) => void,
): Promise<void> {
  renderShell(`
    <section class="card-block" data-testid="spectrum-race-hub">
      <h2>Spectrum Race · 2–4 players</h2>
      <p class="badge verified">Server verified · shared signal · private guesses</p>
      <p>Grace period after first solve is fixed in mode version. No free chat.</p>
      <label><input type="checkbox" data-testid="share-history" checked /> Share my guess history in debrief</label>
      <div class="actions">
        <button type="button" class="primary-button" data-testid="create-spectrum-race">Create room</button>
      </div>
      <label>Join code <input data-testid="spectrum-join-code" type="text" maxlength="8" /></label>
      <button type="button" class="ghost-button" data-testid="join-spectrum-race">Join</button>
      <div data-testid="spectrum-race-stage" class="sync-stage"></div>
    </section>
  `);

  const stage = root.querySelector<HTMLElement>('[data-testid="spectrum-race-stage"]')!;
  const share = () =>
    root.querySelector<HTMLInputElement>('[data-testid="share-history"]')?.checked !== false;

  const wire = async (matchId: string, code: string, signal: number[]) => {
    const ticket = await fetchWsTicket();
    if (!ticket.ok) {
      stage.innerHTML = `<p class="warn">WS ticket failed</p>`;
      return;
    }
    raceSocket?.close();
    raceSocket = io({
      path: '/socket.io',
      auth: { ticket: ticket.data.ticket },
      transports: ['websocket'],
    });
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('ws timeout')), 8000);
      raceSocket!.on('hello', () => {
        clearTimeout(t);
        resolve();
      });
      raceSocket!.on('connect_error', (e) => {
        clearTimeout(t);
        reject(e);
      });
    });
    raceSocket.emit('spectrum_race_join', { matchId });
    raceSocket.on('spectrum_race_reconnected', (p) => renderRace(stage, p, signal));
    raceSocket.on('spectrum_race_phase', (p) => renderRace(stage, p, signal));
    raceSocket.on('spectrum_race_progress', (p: { players: unknown }) => {
      const list = stage.querySelector('[data-testid="race-players"]');
      if (list) list.innerHTML = playersHtml(p.players as RacePlayer[]);
    });
    raceSocket.on('spectrum_race_guess_feedback', (p: { abLabel: string; fit: number }) => {
      const fb = stage.querySelector('[data-testid="race-fb"]');
      if (fb) fb.textContent = `${p.abLabel} · fit ${p.fit}`;
    });
    raceSocket.on('spectrum_race_debrief', (p: Record<string, unknown>) => {
      stage.innerHTML = `
        <p class="badge verified" data-testid="race-debrief">Debrief · server verified</p>
        <pre>${escape(JSON.stringify(p.standings, null, 2))}</pre>
        <p class="muted">Guess histories appear only for players who opted to share.</p>
      `;
    });
    raceSocket.on('spectrum_race_error', (p: { error: string }) => {
      const fb = stage.querySelector('[data-testid="race-fb"]');
      if (fb) fb.textContent = p.error;
    });
    stage.innerHTML = `<p>Room <strong data-testid="spectrum-room-code">${escape(code)}</strong></p>
      ${signalBars(signal)}
      <div data-testid="race-players"></div>
      <button type="button" class="primary-button" data-testid="race-ready">Ready</button>
      <p data-testid="race-fb" class="muted"></p>`;
    stage.querySelector('[data-testid="race-ready"]')?.addEventListener('click', () => {
      raceSocket?.emit('spectrum_race_ready', { ready: true });
    });
  };

  root.querySelector('[data-testid="create-spectrum-race"]')?.addEventListener('click', async () => {
    const res = await createSpectrumRaceRoom(share());
    if (!res.ok) {
      alert(res.error);
      return;
    }
    await wire(res.data.matchId, res.data.code, res.data.observedSignal);
  });

  root.querySelector('[data-testid="join-spectrum-race"]')?.addEventListener('click', async () => {
    const code = root.querySelector<HTMLInputElement>('[data-testid="spectrum-join-code"]')?.value ?? '';
    const res = await joinSpectrumRaceRoom(code, share());
    if (!res.ok) {
      alert(res.error);
      return;
    }
    await wire(res.data.matchId, res.data.code, res.data.observedSignal);
  });
}

type RacePlayer = {
  nickname: string;
  guessesUsed: number;
  solved: boolean;
  connected: boolean;
  ready: boolean;
};

function playersHtml(players: RacePlayer[]): string {
  return `<ul>${players
    .map(
      (p) =>
        `<li>${escape(p.nickname)} · ${p.ready ? 'ready' : '…'} · ${p.guessesUsed} guesses · ${
          p.solved ? 'solved' : 'racing'
        } · ${p.connected ? 'online' : 'offline'}</li>`,
    )
    .join('')}</ul>`;
}

function renderRace(stage: HTMLElement, payload: Record<string, unknown>, fallbackSignal: number[]): void {
  const phase = String(payload.phase ?? '');
  const signal = (payload.observedSignal as number[] | undefined) ?? fallbackSignal;
  const players = (payload.players as RacePlayer[]) ?? [];
  if (phase === 'countdown') {
    stage.innerHTML = `<p data-testid="race-countdown">Countdown…</p>${playersHtml(players)}`;
    return;
  }
  if (phase === 'racing') {
    const pool = (payload.poolIds as string[]) ?? [];
    const v = spectrumVersions();
    stage.innerHTML = `
      <p>Racing${payload.graceEndsAtMs ? ' · grace active' : ''}</p>
      ${signalBars(signal)}
      <div data-testid="race-players">${playersHtml(players)}</div>
      <div class="pool-grid">
        ${pool
          .slice(0, 6)
          .map(
            (id) =>
              `<label class="pool-item"><input type="checkbox" data-race-odor="${escape(id)}" /> ${escape(
                odorName(id),
              )} <input type="number" data-race-pct="${escape(id)}" value="50" min="10" max="100" step="10" disabled /></label>`,
          )
          .join('')}
      </div>
      <button type="button" class="primary-button" data-testid="race-guess">Guess</button>
      <p data-testid="race-fb" class="muted"></p>
    `;
    stage.querySelectorAll<HTMLInputElement>('[data-race-odor]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const id = cb.getAttribute('data-race-odor')!;
        const pct = stage.querySelector<HTMLInputElement>(`[data-race-pct="${id}"]`);
        if (pct) pct.disabled = !cb.checked;
      });
    });
    stage.querySelector('[data-testid="race-guess"]')?.addEventListener('click', () => {
      const components: SpectrumComponent[] = [];
      stage.querySelectorAll<HTMLInputElement>('[data-race-odor]').forEach((cb) => {
        if (!cb.checked) return;
        const id = cb.getAttribute('data-race-odor')!;
        const pct = stage.querySelector<HTMLInputElement>(`[data-race-pct="${id}"]`);
        components.push({ odorId: id, percent: Number(pct?.value ?? 0) });
      });
      raceSocket?.emit('spectrum_race_guess', { ...v, components });
    });
  }
}
