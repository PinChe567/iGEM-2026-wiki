/**
 * Online companion API client — same-origin / Vite proxy only.
 * No secrets in Vite env. Session cookie is HttpOnly (browser-managed).
 */

import { CONTENT_VERSION, SPECTRUM_CONTENT_VERSION } from '@suite/content';
import { PIXEL_GAME_VERSION } from '@suite/core/pixel';
import { SPECTRUM_RULE_VERSION } from '@suite/core/spectrum';

export const PROTOCOL_VERSION = '1.0.0';

export type GuestSession = {
  publicId: string;
  nickname: string;
  isGuest: boolean;
  csrfToken: string;
  guestDisclaimer: string;
  protocolVersion: string;
};

export type VersionFields = {
  protocolVersion: string;
  gameVersion: string;
  contentVersion: string;
};

export function pixelVersions(): VersionFields {
  return {
    protocolVersion: PROTOCOL_VERSION,
    gameVersion: PIXEL_GAME_VERSION,
    contentVersion: CONTENT_VERSION,
  };
}

export function spectrumVersions(): VersionFields {
  return {
    protocolVersion: PROTOCOL_VERSION,
    gameVersion: SPECTRUM_RULE_VERSION,
    contentVersion: SPECTRUM_CONTENT_VERSION,
  };
}

const CSRF_KEY = 'suite.online.csrf';

export function loadCsrf(): string | null {
  try {
    return sessionStorage.getItem(CSRF_KEY);
  } catch {
    return null;
  }
}

export function saveCsrf(token: string): void {
  try {
    sessionStorage.setItem(CSRF_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearCsrf(): void {
  try {
    sessionStorage.removeItem(CSRF_KEY);
  } catch {
    /* ignore */
  }
}

async function api<T>(
  path: string,
  init: RequestInit & { csrf?: boolean } = {},
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  if (init.csrf) {
    const csrf = loadCsrf();
    if (csrf) headers.set('x-csrf-token', csrf);
  }
  const res = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const err =
      json && typeof json === 'object' && 'error' in json
        ? String((json as { error: unknown }).error)
        : `http_${res.status}`;
    return { ok: false, status: res.status, error: err };
  }
  return { ok: true, data: json as T };
}

export function createGuest(nickname?: string) {
  return api<GuestSession>('/api/v1/session/guest', {
    method: 'POST',
    body: JSON.stringify(nickname ? { nickname } : {}),
  });
}

export function fetchMe() {
  return api<{
    publicId: string;
    nickname: string;
    isGuest: boolean;
    guestDisclaimer: string;
  }>('/api/v1/session/me');
}

export function patchNickname(nickname: string) {
  return api<{ publicId: string; nickname: string }>('/api/v1/profile', {
    method: 'PATCH',
    csrf: true,
    body: JSON.stringify({ nickname }),
  });
}

export function fetchDaily(gameKey: string) {
  return api<{
    challengeId: string;
    gameKey: string;
    date: string;
    protocolVersion: string;
    gameVersion: string;
    contentVersion: string;
    metadata: unknown;
    rankedPolicy?: string;
  }>(`/api/v1/daily/${gameKey}`);
}

export function fetchLeaderboard(challengeId: string) {
  return api<{
    challengeId: string;
    sort?: string[];
    rankedPolicy?: string;
    entries: Array<{
      publicId: string;
      nickname: string;
      score: number;
      correctCount?: number | null;
      durationMs?: number | null;
      completedAt?: string | null;
      rank: number;
    }>;
  }>(`/api/v1/leaderboards/${challengeId}`);
}

export function fetchHealth() {
  return api<{ ok: boolean; api?: string }>('/health');
}

export function fetchWsTicket() {
  return api<{ ticket: string; expiresInMs: number }>('/api/v1/ws-ticket');
}

export function logout() {
  return api<{ ok: boolean }>('/api/v1/session/logout', {
    method: 'POST',
    csrf: true,
  });
}

export type PublicQuestion = {
  questionId: string;
  round: number;
  optionIds: string[];
  displayCells: Array<'off' | 'on' | 'noise'>;
};

export type StartRunResponse = {
  runId: string;
  status: string;
  challengeId: string;
  challengeDate: string;
  rankedEligible: boolean;
  rankedPolicy: string;
  rankedPolicyNote: string;
  serverStartedAtMs: number;
  serverNowMs: number;
  elapsedMs: number;
  remainingMs: number;
  nextRound: number;
  questionCount: number;
  score: number;
  currentQuestion: PublicQuestion | null;
  poolIds: string[];
  settings: {
    matrixSize: number;
    patternDisplayMs: number;
    allowStudyReview: boolean;
    noisePercentOfOff: number;
    optionsPerQuestion: number;
    passCorrect: number;
    pointsPerCorrect: number;
  };
  questions: PublicQuestion[];
};

export function startPixelDailyRun() {
  return api<StartRunResponse>('/api/v1/pixel/daily/runs/start', {
    method: 'POST',
    csrf: true,
    body: JSON.stringify(pixelVersions()),
  });
}

export function answerPixelDailyRun(runId: string, questionId: string, selectedOptionId: string) {
  return api<{
    runId: string;
    correct: boolean;
    scoreDelta: number;
    score: number;
    nextRound: number;
    complete: boolean;
    remainingMs: number;
    elapsedMs: number;
    nextQuestion: PublicQuestion | null;
  }>(`/api/v1/pixel/daily/runs/${runId}/answer`, {
    method: 'POST',
    csrf: true,
    body: JSON.stringify({
      ...pixelVersions(),
      questionId,
      selectedOptionId,
    }),
  });
}

export function finishPixelDailyRun(runId: string) {
  return api<{
    serverVerified: true;
    challengeId: string;
    challengeDate: string;
    gameVersion: string;
    contentVersion: string;
    ranked: boolean;
    rankedPolicy: string;
    correctCount: number;
    score: number;
    maxScore: number;
    durationMs: number;
    completedAt: string;
    questionLog: Array<{
      questionId: string;
      round: number;
      selectedOptionId: string | null;
      correct: boolean;
    }>;
    reportPath: string;
  }>(`/api/v1/pixel/daily/runs/${runId}/finish`, {
    method: 'POST',
    csrf: true,
    body: JSON.stringify(pixelVersions()),
  });
}

export function getPixelDailyRun(runId: string) {
  return api<StartRunResponse | { status: string; result: unknown }>(
    `/api/v1/pixel/daily/runs/${runId}`,
  );
}

export function createSyncRoom() {
  return api<{
    roomId: string;
    matchId: string;
    code: string;
    phase: string;
    players: unknown[];
    minPlayers: number;
    maxPlayers: number;
    questionCount: number;
  }>('/api/v1/pixel/sync/rooms', {
    method: 'POST',
    csrf: true,
    body: JSON.stringify(pixelVersions()),
  });
}

export function joinSyncRoom(code: string) {
  return api<{
    roomId: string;
    matchId: string;
    code: string;
    phase: string;
    players: unknown[];
    minPlayers: number;
    maxPlayers: number;
    questionCount: number;
  }>('/api/v1/pixel/sync/rooms/join', {
    method: 'POST',
    csrf: true,
    body: JSON.stringify({ ...pixelVersions(), code }),
  });
}

export function submitReport(args: {
  reason: string;
  challengeId?: string;
  matchId?: string;
  runId?: string;
  note?: string;
}) {
  return api<{ ok: boolean }>('/api/v1/reports', {
    method: 'POST',
    csrf: true,
    body: JSON.stringify({
      reason: args.reason,
      context: {
        challengeId: args.challengeId,
        matchId: args.matchId,
        runId: args.runId,
        note: args.note,
      },
    }),
  });
}

export type SpectrumComponent = { odorId: string; percent: number };

export type SpectrumStartRun = {
  runId: string;
  challengeId: string;
  challengeDate: string;
  rankedEligible: boolean;
  rankedPolicyNote: string;
  serverStartedAtMs: number;
  elapsedMs: number;
  remainingMs: number;
  guessesUsed: number;
  maxGuesses: number;
  guessesRemaining: number;
  solved: boolean;
  observedSignal: number[];
  poolIds: string[];
  difficulty: string;
  ratioRules: {
    componentCountMin: number;
    componentCountMax: number;
    percentStep: number;
    minPercent: number;
  };
  truthComponentCount: number | null;
  history: Array<{
    attemptNumber: number;
    guess: { components: SpectrumComponent[] };
    abLabel: string;
    fit: number;
  }>;
};

export function startSpectrumDailyRun() {
  return api<SpectrumStartRun>('/api/v1/spectrum/daily/runs/start', {
    method: 'POST',
    csrf: true,
    body: JSON.stringify(spectrumVersions()),
  });
}

export function guessSpectrumDailyRun(runId: string, components: SpectrumComponent[]) {
  return api<{
    attemptNumber: number;
    abLabel: string;
    fit: number;
    solved: boolean;
    complete: boolean;
    guessesUsed: number;
    guessesRemaining: number;
    curve: { observedSignal: number[]; guessSignal: number[]; fit: number };
  }>(`/api/v1/spectrum/daily/runs/${runId}/guess`, {
    method: 'POST',
    csrf: true,
    body: JSON.stringify({ ...spectrumVersions(), components }),
  });
}

export function finishSpectrumDailyRun(runId: string) {
  return api<{
    serverVerified: true;
    challengeId: string;
    challengeDate: string;
    gameVersion: string;
    contentVersion: string;
    ranked: boolean;
    solved: boolean;
    guessesUsed: number;
    durationMs: number;
    guessScore: number;
    timeScore: number;
    totalScore: number;
    guessLog: Array<{ attemptNumber: number; abLabel: string; fit: number }>;
    truth: { components: SpectrumComponent[] };
    reportPath: string;
  }>(`/api/v1/spectrum/daily/runs/${runId}/finish`, {
    method: 'POST',
    csrf: true,
    body: JSON.stringify(spectrumVersions()),
  });
}

export function createSpectrumRaceRoom(shareGuessHistory = true) {
  return api<{
    roomId: string;
    matchId: string;
    code: string;
    phase: string;
    modeVersion: string;
    observedSignal: number[];
    poolIds: string[];
    players: unknown[];
  }>('/api/v1/spectrum/race/rooms', {
    method: 'POST',
    csrf: true,
    body: JSON.stringify({ ...spectrumVersions(), shareGuessHistory }),
  });
}

export function joinSpectrumRaceRoom(code: string, shareGuessHistory = true) {
  return api<{
    roomId: string;
    matchId: string;
    code: string;
    phase: string;
    modeVersion: string;
    observedSignal: number[];
    poolIds: string[];
    players: unknown[];
  }>('/api/v1/spectrum/race/rooms/join', {
    method: 'POST',
    csrf: true,
    body: JSON.stringify({ ...spectrumVersions(), code, shareGuessHistory }),
  });
}
