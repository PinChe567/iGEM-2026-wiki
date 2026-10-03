import {
  EDUCATION_STORAGE_KEY,
  buildEducationExport,
  educationSessionsToCsv,
  parseEducationStoredJson,
  upsertEducationSession,
  type EducationStoredState,
  type EducationStudySession,
} from '@suite/core/education';

export function loadEducationStore(): EducationStoredState {
  try {
    return parseEducationStoredJson(localStorage.getItem(EDUCATION_STORAGE_KEY));
  } catch {
    return parseEducationStoredJson(null);
  }
}

export function saveEducationStore(state: EducationStoredState): void {
  try {
    localStorage.setItem(EDUCATION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* localStorage optional */
  }
}

export function persistEducationSession(session: EducationStudySession): void {
  saveEducationStore(upsertEducationSession(loadEducationStore(), session));
}

export function downloadEducationJson(): void {
  const payload = buildEducationExport(loadEducationStore().sessions);
  downloadBlob(
    `education-study-${stamp()}.json`,
    JSON.stringify(payload, null, 2),
    'application/json',
  );
}

export function downloadEducationCsv(): void {
  downloadBlob(
    `education-study-${stamp()}.csv`,
    educationSessionsToCsv(loadEducationStore().sessions),
    'text/csv',
  );
}

function stamp(): string {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '');
}

function downloadBlob(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
