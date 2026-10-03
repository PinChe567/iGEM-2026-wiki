import { brandMarkup, footerMarkup } from '@suite/ui';
import '@suite/ui/tokens.css';
import '@suite/ui/shell.css';
import '@suite/ui/components.css';
import { getOdorById } from '@suite/content';
import { io, type Socket } from 'socket.io-client';
import {
  answerPixelDailyRun,
  clearCsrf,
  createGuest,
  createSyncRoom,
  fetchDaily,
  fetchHealth,
  fetchLeaderboard,
  fetchMe,
  fetchWsTicket,
  finishPixelDailyRun,
  joinSyncRoom,
  logout,
  patchNickname,
  pixelVersions,
  saveCsrf,
  startPixelDailyRun,
  submitReport,
  type PublicQuestion,
  type StartRunResponse,
} from './api';
import { paintSpectrumDaily, paintSpectrumRace } from './spectrum-play';
import './styles.css';

const rootEl = document.querySelector('#app');
if (!rootEl) throw new Error('#app missing');
const root: HTMLElement = rootEl as HTMLElement;

const strings = {
  brand: 'Odor Pixel Suite',
  tagline: 'Online · Pixel Lab & Spectrum',
  footer: 'Server-verified companion. Independent of iGEM Wiki static build.',
};

type View = 'home' | 'daily' | 'sync' | 'spectrum-daily' | 'spectrum-race';

let socket: Socket | null = null;
let view: View = 'home';
let dailyRun: StartRunResponse | null = null;
let dailyBusy = false;
let syncMatchId: string | null = null;

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function odorName(id: string): string {
  return getOdorById(id)?.name.en ?? id;
}

function matrixHtml(q: PublicQuestion, size: number): string {
  return `<div class="led-matrix" style="--size:${size}" role="img" aria-label="Pattern">${q.displayCells
    .map((c) => `<i class="led-cell ${c === 'on' ? 'on' : c === 'noise' ? 'noise-cell' : ''}"></i>`)
    .join('')}</div>`;
}

function renderShell(body: string): void {
  root.innerHTML = `
    <header class="shell-header">
      ${brandMarkup({
        title: strings.brand,
        subtitle: strings.tagline,
        homeHref: '/',
        homeAriaLabel: strings.brand,
      })}
      <nav class="online-nav" aria-label="Modes">
        <button type="button" data-nav="home" class="${view === 'home' ? 'active' : ''}">Home</button>
        <button type="button" data-nav="daily" class="${view === 'daily' ? 'active' : ''}">Pixel Daily</button>
        <button type="button" data-nav="sync" class="${view === 'sync' ? 'active' : ''}">Pixel Sync</button>
        <button type="button" data-nav="spectrum-daily" class="${view === 'spectrum-daily' ? 'active' : ''}">Spectrum Daily</button>
        <button type="button" data-nav="spectrum-race" class="${view === 'spectrum-race' ? 'active' : ''}">Spectrum Race</button>
      </nav>
    </header>
    <main class="online-main">${body}</main>
    ${footerMarkup({
      footerMark: strings.brand,
      footerTagline: strings.footer,
    })}
  `;
  root.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      view = (btn.getAttribute('data-nav') as View) || 'home';
      void paint();
    });
  });
}

async function ensureGuest(): Promise<boolean> {
  const me = await fetchMe();
  if (me.ok) return true;
  const created = await createGuest();
  if (!created.ok) return false;
  saveCsrf(created.data.csrfToken);
  return true;
}

async function paintHome(): Promise<void> {
  const health = await fetchHealth();
  const healthLine = health.ok
    ? `<p class="ok" data-testid="health-ok">Server health: OK · ${escape(health.data.api ?? '')}</p>`
    : `<p class="warn" data-testid="health-down">Online server unavailable. Wiki offline games are unaffected.</p>`;

  let sessionBlock = '';
  const me = health.ok ? await fetchMe() : ({ ok: false as const, status: 0, error: 'skip' });

  if (me.ok) {
    sessionBlock = `
      <section class="card-block" data-testid="session">
        <h2>Session</h2>
        <p>Public id: <code data-testid="public-id">${escape(me.data.publicId)}</code></p>
        <p>Nickname: <strong data-testid="nickname">${escape(me.data.nickname)}</strong></p>
        <p class="disclaimer" data-testid="guest-disclaimer">${escape(me.data.guestDisclaimer)}</p>
        <label>Update nickname
          <input data-testid="nick-input" type="text" maxlength="24" value="${escape(me.data.nickname)}" />
        </label>
        <div class="actions">
          <button type="button" class="primary-button" data-testid="save-nick">Save</button>
          <button type="button" class="ghost-button" data-testid="logout">Log out guest</button>
        </div>
      </section>
    `;
  } else {
    sessionBlock = `
      <section class="card-block" data-testid="guest-start">
        <h2>Continue as guest</h2>
        <p class="disclaimer">Guest sessions are device-local. Without account recovery, changing browser or device will not restore this guest profile.</p>
        <label>Nickname (optional)
          <input data-testid="nick-input" type="text" maxlength="24" placeholder="Guest ####" />
        </label>
        <button type="button" class="primary-button" data-testid="start-guest" ${health.ok ? '' : 'disabled'}>Start guest session</button>
      </section>
    `;
  }

  renderShell(`
    ${healthLine}
    ${sessionBlock}
    <section class="card-block">
      <h2>Server-verified modes</h2>
      <p>Pixel Lab and Scent Spectrum scores are computed on the server. Clients never submit score, fit, or A/B as authority.</p>
      <div class="actions">
        <button type="button" class="primary-button" data-nav-go="daily">Pixel Daily</button>
        <button type="button" class="ghost-button" data-nav-go="sync">Pixel Sync</button>
        <button type="button" class="primary-button" data-nav-go="spectrum-daily">Spectrum Daily</button>
        <button type="button" class="ghost-button" data-nav-go="spectrum-race">Spectrum Race</button>
      </div>
    </section>
  `);

  bindSessionHandlers();
  root.querySelectorAll('[data-nav-go]').forEach((btn) => {
    btn.addEventListener('click', () => {
      view = (btn.getAttribute('data-nav-go') as View) || 'home';
      void paint();
    });
  });
}

function bindSessionHandlers(): void {
  root.querySelector('[data-testid="start-guest"]')?.addEventListener('click', async () => {
    const input = root.querySelector<HTMLInputElement>('[data-testid="nick-input"]');
    const nick = input?.value.trim();
    const res = await createGuest(nick || undefined);
    if (!res.ok) {
      alert(`Guest failed: ${res.error}`);
      return;
    }
    saveCsrf(res.data.csrfToken);
    await paint();
  });

  root.querySelector('[data-testid="save-nick"]')?.addEventListener('click', async () => {
    const input = root.querySelector<HTMLInputElement>('[data-testid="nick-input"]');
    if (!input) return;
    const res = await patchNickname(input.value);
    if (!res.ok) {
      alert(`Update failed: ${res.error}`);
      return;
    }
    await paint();
  });

  root.querySelector('[data-testid="logout"]')?.addEventListener('click', async () => {
    await logout();
    clearCsrf();
    socket?.close();
    socket = null;
    dailyRun = null;
    syncMatchId = null;
    await paint();
  });
}

async function paintDaily(): Promise<void> {
  if (!(await ensureGuest())) {
    renderShell(`<p class="warn">Could not create guest session.</p>`);
    return;
  }

  const daily = await fetchDaily('pixel');
  if (!daily.ok) {
    renderShell(`<p class="warn">Daily unavailable: ${escape(daily.error)}</p>`);
    return;
  }

  const board = await fetchLeaderboard(daily.data.challengeId);
  const meta = daily.data.metadata as { rankedPolicyNote?: string; questionCount?: number };

  if (dailyRun && dailyRun.status === 'in_progress' && dailyRun.currentQuestion) {
    paintDailyQuestion(dailyRun);
    return;
  }

  renderShell(`
    <section class="card-block" data-testid="daily-hub">
      <h2>Daily Challenge · Odor Pixel Lab</h2>
      <p class="badge verified" data-testid="server-verified">Server verified</p>
      <p>UTC date: <strong data-testid="daily-date">${escape(daily.data.date)}</strong></p>
      <p>Versions: ${escape(daily.data.protocolVersion)} / ${escape(daily.data.gameVersion)} / ${escape(daily.data.contentVersion)}</p>
      <p class="disclaimer" data-testid="ranked-policy">${escape(
        meta.rankedPolicyNote ??
          'Each guest’s first completed run each UTC day is ranked. Later runs are practice (unranked).',
      )}</p>
      <div class="actions">
        <button type="button" class="primary-button" data-testid="start-daily">Start / resume run</button>
      </div>
      <h3>Leaderboard (ranked only)</h3>
      <p class="muted">Sort: correctCount ↓ · durationMs ↑ · completedAt ↑ · same version only</p>
      <ol data-testid="leaderboard">
        ${(board.ok ? board.data.entries : [])
          .map(
            (e) =>
              `<li>${escape(e.nickname)} — ${e.correctCount ?? '?'} correct · ${e.durationMs ?? '?'} ms</li>`,
          )
          .join('') || '<li class="muted">No ranked entries yet</li>'}
      </ol>
    </section>
  `);

  root.querySelector('[data-testid="start-daily"]')?.addEventListener('click', async () => {
    const res = await startPixelDailyRun();
    if (!res.ok) {
      alert(`Start failed: ${res.error}`);
      return;
    }
    dailyRun = res.data;
    try {
      sessionStorage.setItem('suite.pixel.runId', res.data.runId);
    } catch {
      /* ignore */
    }
    paintDailyQuestion(res.data);
  });
}

function paintDailyQuestion(run: StartRunResponse): void {
  const q = run.currentQuestion;
  if (!q) {
    void completeDaily(run.runId);
    return;
  }

  const elapsedSec = Math.floor(run.elapsedMs / 1000);
  renderShell(`
    <section class="card-block" data-testid="daily-play">
      <p class="badge verified">Server verified · timer ${elapsedSec}s (server clock)</p>
      <p class="ranked-flag" data-testid="ranked-flag">${
        run.rankedEligible
          ? 'Ranked run (first completion today)'
          : 'Practice / unranked (you already have a ranked finish today)'
      }</p>
      <p>Question ${q.round + 1} / ${run.questionCount} · score ${run.score}</p>
      ${matrixHtml(q, run.settings.matrixSize)}
      <div class="option-grid" data-testid="options">
        ${q.optionIds
          .map(
            (id) =>
              `<button type="button" class="option-button" data-option="${escape(id)}">${escape(
                odorName(id),
              )}</button>`,
          )
          .join('')}
      </div>
      <p class="muted" data-testid="feedback"></p>
    </section>
  `);

  root.querySelectorAll<HTMLButtonElement>('[data-option]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (dailyBusy) return;
      dailyBusy = true;
      const selected = btn.getAttribute('data-option')!;
      const res = await answerPixelDailyRun(run.runId, q.questionId, selected);
      const feedback = root.querySelector('[data-testid="feedback"]');
      if (!res.ok) {
        if (feedback) feedback.textContent = res.error;
        dailyBusy = false;
        return;
      }
      if (feedback) feedback.textContent = res.data.correct ? 'Correct' : 'Incorrect';
      dailyRun = {
        ...run,
        score: res.data.score,
        nextRound: res.data.nextRound,
        elapsedMs: res.data.elapsedMs,
        remainingMs: res.data.remainingMs,
        currentQuestion: res.data.nextQuestion,
      };
      dailyBusy = false;
      if (res.data.complete || !res.data.nextQuestion) {
        await completeDaily(run.runId);
        return;
      }
      paintDailyQuestion(dailyRun);
    });
  });
}

async function completeDaily(runId: string): Promise<void> {
  const res = await finishPixelDailyRun(runId);
  dailyRun = null;
  if (!res.ok) {
    renderShell(`<p class="warn">Finish failed: ${escape(res.error)}</p>`);
    return;
  }
  const r = res.data;
  renderShell(`
    <section class="card-block" data-testid="daily-result">
      <p class="badge verified" data-testid="result-verified">Server verified</p>
      <h2>Result</h2>
      <p>Challenge ${escape(r.challengeDate)} · v${escape(r.gameVersion)} / content ${escape(r.contentVersion)}</p>
      <p data-testid="result-ranked">${r.ranked ? 'Ranked finish' : 'Unranked practice finish'}</p>
      <p>Correct: <strong data-testid="result-correct">${r.correctCount}</strong> · Score ${r.score}/${r.maxScore}</p>
      <p>Duration (server): ${r.durationMs} ms</p>
      <h3>Per-question log</h3>
      <ol data-testid="question-log">
        ${r.questionLog
          .map(
            (q) =>
              `<li>${escape(q.questionId)}: ${q.correct ? '✓' : '✗'} ${
                q.selectedOptionId ? escape(odorName(q.selectedOptionId)) : 'unanswered'
              }</li>`,
          )
          .join('')}
      </ol>
      <div class="actions">
        <button type="button" class="ghost-button" data-testid="report-issue">Report a problem</button>
        <button type="button" class="primary-button" data-testid="back-daily">Back</button>
      </div>
    </section>
  `);

  root.querySelector('[data-testid="back-daily"]')?.addEventListener('click', () => {
    void paintDaily();
  });
  root.querySelector('[data-testid="report-issue"]')?.addEventListener('click', async () => {
    const note = prompt('Describe the issue (no personal data):') ?? '';
    if (!note.trim()) return;
    const rep = await submitReport({
      reason: 'challenge_issue',
      challengeId: r.challengeId,
      runId,
      note: note.slice(0, 500),
    });
    alert(rep.ok ? 'Report queued' : `Report failed: ${rep.error}`);
  });
}

async function connectSocket(): Promise<Socket | null> {
  const ticketRes = await fetchWsTicket();
  if (!ticketRes.ok) return null;
  socket?.close();
  socket = io({
    path: '/socket.io',
    auth: { ticket: ticketRes.data.ticket },
    transports: ['websocket'],
  });
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('ws timeout')), 8000);
    socket!.on('hello', () => {
      clearTimeout(t);
      resolve();
    });
    socket!.on('connect_error', (err) => {
      clearTimeout(t);
      reject(err);
    });
  });
  return socket;
}

async function paintSync(): Promise<void> {
  if (!(await ensureGuest())) {
    renderShell(`<p class="warn">Could not create guest session.</p>`);
    return;
  }

  renderShell(`
    <section class="card-block" data-testid="sync-hub">
      <h2>Sync Race · 2–4 players</h2>
      <p class="badge verified">Server verified · shared questions & timing</p>
      <p>No free chat — only ready, good luck, and reaction icons (cooldown).</p>
      <div class="actions">
        <button type="button" class="primary-button" data-testid="create-room">Create room</button>
      </div>
      <label>Join code
        <input data-testid="join-code" type="text" maxlength="8" autocomplete="off" />
      </label>
      <button type="button" class="ghost-button" data-testid="join-room">Join</button>
      <div data-testid="sync-stage" class="sync-stage"></div>
    </section>
  `);

  const stage = root.querySelector<HTMLElement>('[data-testid="sync-stage"]')!;

  const wireMatch = async (matchId: string, code: string) => {
    syncMatchId = matchId;
    stage.innerHTML = `<p>Room <strong data-testid="room-code">${escape(code)}</strong> · connecting…</p>`;
    try {
      const s = await connectSocket();
      if (!s) {
        stage.innerHTML = `<p class="warn">WS ticket failed</p>`;
        return;
      }
      s.emit('sync_join_match', { matchId });
      s.on('sync_reconnected', (payload: Record<string, unknown>) => renderSyncState(stage, payload));
      s.on('sync_phase', (payload: Record<string, unknown>) => renderSyncState(stage, payload));
      s.on('sync_player_update', (payload: { players: unknown }) => {
        const list = stage.querySelector('[data-testid="player-list"]');
        if (list) list.innerHTML = playerListHtml(payload.players as SyncPlayer[]);
      });
      s.on('sync_answer_feedback', (payload: { correct: boolean }) => {
        const fb = stage.querySelector('[data-testid="sync-feedback"]');
        if (fb) fb.textContent = payload.correct ? 'Correct' : 'Incorrect';
      });
      s.on('sync_reaction', (payload: { publicId: string; kind: string }) => {
        const bar = stage.querySelector('[data-testid="reaction-feed"]');
        if (bar) bar.textContent = `${payload.publicId}: ${payload.kind}`;
      });
      s.on('sync_error', (payload: { error: string }) => {
        const fb = stage.querySelector('[data-testid="sync-feedback"]');
        if (fb) fb.textContent = payload.error;
      });
    } catch (e) {
      stage.innerHTML = `<p class="warn">WS error: ${escape(String(e))}</p>`;
    }
  };

  root.querySelector('[data-testid="create-room"]')?.addEventListener('click', async () => {
    const res = await createSyncRoom();
    if (!res.ok) {
      alert(res.error);
      return;
    }
    await wireMatch(res.data.matchId, res.data.code);
    renderSyncState(stage, { ...res.data, phase: 'lobby' });
  });

  root.querySelector('[data-testid="join-room"]')?.addEventListener('click', async () => {
    const code = root.querySelector<HTMLInputElement>('[data-testid="join-code"]')?.value ?? '';
    const res = await joinSyncRoom(code);
    if (!res.ok) {
      alert(res.error);
      return;
    }
    await wireMatch(res.data.matchId, res.data.code);
    renderSyncState(stage, { ...res.data, phase: 'lobby' });
  });
}

type SyncPlayer = {
  publicId: string;
  nickname: string;
  ready: boolean;
  connected: boolean;
  score: number;
  correctCount: number;
  answered: boolean;
  isHost?: boolean;
};

function playerListHtml(players: SyncPlayer[]): string {
  return `<ul data-testid="player-list">${players
    .map(
      (p) =>
        `<li>${escape(p.nickname)}${p.isHost ? ' (host)' : ''} · ${p.ready ? 'ready' : 'not ready'} · ${
          p.connected ? 'online' : 'offline'
        } · ${p.answered ? 'answered' : 'waiting'} · ${p.correctCount} correct</li>`,
    )
    .join('')}</ul>`;
}

function renderSyncState(stage: HTMLElement, payload: Record<string, unknown>): void {
  const phase = String(payload.phase ?? 'lobby');
  const players = (payload.players as SyncPlayer[]) ?? [];
  const v = pixelVersions();

  if (phase === 'lobby' || phase === undefined) {
    stage.innerHTML = `
      <p>Phase: lobby · code <strong data-testid="room-code">${escape(String(payload.code ?? ''))}</strong></p>
      ${playerListHtml(players)}
      <div class="actions">
        <button type="button" class="primary-button" data-testid="sync-ready">Ready</button>
        <button type="button" class="ghost-button" data-reaction="good_luck">Good luck</button>
        <button type="button" class="ghost-button" data-reaction="👍">👍</button>
        <button type="button" class="ghost-button" data-reaction="😮">😮</button>
      </div>
      <p data-testid="reaction-feed" class="muted"></p>
      <p data-testid="sync-feedback" class="muted"></p>
    `;
  } else if (phase === 'countdown') {
    stage.innerHTML = `
      <p data-testid="sync-countdown">Countdown…</p>
      ${playerListHtml(players)}
    `;
  } else if (phase === 'question') {
    const q = payload.question as PublicQuestion;
    const settings = payload.settings as { matrixSize: number };
    stage.innerHTML = `
      <p>Question ${(q.round ?? 0) + 1} · ends at ${payload.endsAtMs}</p>
      ${matrixHtml(q, settings.matrixSize)}
      ${playerListHtml(players)}
      <div class="option-grid">
        ${q.optionIds
          .map(
            (id) =>
              `<button type="button" class="option-button" data-sync-option="${escape(id)}">${escape(
                odorName(id),
              )}</button>`,
          )
          .join('')}
      </div>
      <p data-testid="sync-feedback" class="muted"></p>
      <p data-testid="reaction-feed" class="muted"></p>
      <div class="actions">
        <button type="button" class="ghost-button" data-reaction="👍">👍</button>
        <button type="button" class="ghost-button" data-reaction="🔥">🔥</button>
      </div>
    `;
    stage.querySelectorAll<HTMLButtonElement>('[data-sync-option]').forEach((btn) => {
      btn.addEventListener('click', () => {
        socket?.emit('sync_answer', {
          ...v,
          questionId: q.questionId,
          selectedOptionId: btn.getAttribute('data-sync-option'),
        });
      });
    });
  } else if (phase === 'between') {
    stage.innerHTML = `
      <p>Between questions · correct option: ${escape(String(payload.correctOptionId ?? ''))}</p>
      ${playerListHtml(players)}
    `;
  } else if (phase === 'finished') {
    const result = payload.result as {
      serverVerified?: boolean;
      standings?: SyncPlayer[];
      matchId?: string;
      gameVersion?: string;
      contentVersion?: string;
    };
    stage.innerHTML = `
      <p class="badge verified" data-testid="sync-result-verified">Server verified</p>
      <h3>Race result</h3>
      <p>Match ${escape(String(result.matchId ?? syncMatchId ?? ''))} · v${escape(
        String(result.gameVersion ?? ''),
      )} / ${escape(String(result.contentVersion ?? ''))}</p>
      ${playerListHtml(result.standings ?? players)}
      <button type="button" class="ghost-button" data-testid="sync-report">Report a problem</button>
    `;
    stage.querySelector('[data-testid="sync-report"]')?.addEventListener('click', async () => {
      const note = prompt('Describe the issue:') ?? '';
      if (!note.trim()) return;
      await submitReport({
        reason: 'sync_race_issue',
        matchId: result.matchId ?? syncMatchId ?? undefined,
        note,
      });
      alert('Report queued');
    });
  }

  stage.querySelector('[data-testid="sync-ready"]')?.addEventListener('click', () => {
    socket?.emit('sync_ready', { ready: true });
  });
  stage.querySelectorAll('[data-reaction]').forEach((btn) => {
    btn.addEventListener('click', () => {
      socket?.emit('sync_reaction', { kind: btn.getAttribute('data-reaction') });
    });
  });
}

async function paint(): Promise<void> {
  if (view === 'daily') await paintDaily();
  else if (view === 'sync') await paintSync();
  else if (view === 'spectrum-daily') await paintSpectrumDaily(root, renderShell);
  else if (view === 'spectrum-race') await paintSpectrumRace(root, renderShell);
  else await paintHome();
}

void paint();
