import {
  LABYRINTH_CASE_SCHEMA_VERSION,
  LABYRINTH_GAME_VERSION,
  LABYRINTH_MAP_VERSION,
  MAX_PLAYERS,
  MIN_PLAYERS,
} from '../constants';
import { LABYRINTH_ODOR_IDS } from '../role-gates';
import type { EvidenceEvent, OfflineCase } from '../types';

const EVIDENCE_TYPES = new Set([
  'observedGateUse',
  'doorLog',
  'positiveChannel',
  'negativeChannel',
  'artifactTrace',
  'taskPresence',
]);

export type CaseValidationIssue = { code: string; message: string };

export function validateOfflineCase(caseData: OfflineCase): CaseValidationIssue[] {
  const issues: CaseValidationIssue[] = [];
  if (caseData.schemaVersion !== LABYRINTH_CASE_SCHEMA_VERSION) {
    issues.push({
      code: 'schema',
      message: `Unexpected schemaVersion ${caseData.schemaVersion}`,
    });
  }
  if (caseData.gameVersion !== LABYRINTH_GAME_VERSION) {
    issues.push({
      code: 'game_version',
      message: `Unexpected gameVersion ${caseData.gameVersion}`,
    });
  }
  if (caseData.mapVersion !== LABYRINTH_MAP_VERSION) {
    issues.push({
      code: 'map_version',
      message: `Unexpected mapVersion ${caseData.mapVersion}`,
    });
  }
  if (
    caseData.playerCount < MIN_PLAYERS ||
    caseData.playerCount > MAX_PLAYERS
  ) {
    issues.push({
      code: 'player_count',
      message: `playerCount ${caseData.playerCount} out of range`,
    });
  }
  if (caseData.playerRoles.length !== caseData.playerCount) {
    issues.push({
      code: 'roles',
      message: 'playerRoles length must equal playerCount',
    });
  }
  const odors = new Set(caseData.playerRoles.map((r) => r.odorId));
  if (odors.size !== caseData.playerRoles.length) {
    issues.push({ code: 'roles', message: 'Odor identities must be unique' });
  }
  for (const odor of odors) {
    if (!LABYRINTH_ODOR_IDS.includes(odor)) {
      issues.push({ code: 'roles', message: `Unknown odor ${odor}` });
    }
  }
  const phantoms = caseData.playerRoles.filter((r) => r.isPhantom);
  if (phantoms.length !== 1 || phantoms[0]!.playerId !== caseData.phantomPlayerId) {
    issues.push({
      code: 'phantom',
      message: 'Exactly one phantom must match phantomPlayerId',
    });
  }
  if (!caseData.seed) {
    issues.push({ code: 'seed', message: 'seed is required' });
  }
  if (!caseData.contentVersion) {
    issues.push({ code: 'content', message: 'contentVersion is required' });
  }
  for (const ev of caseData.evidenceEvents) {
    assertEvidenceShape(ev, issues);
  }
  return issues;
}

function assertEvidenceShape(
  ev: EvidenceEvent,
  issues: CaseValidationIssue[],
): void {
  if (!EVIDENCE_TYPES.has(ev.type)) {
    issues.push({ code: 'evidence', message: `Unknown evidence type` });
  }
  if (!ev.id || !ev.source || !ev.timeWindow || !ev.reliability) {
    issues.push({
      code: 'evidence',
      message: `Evidence ${ev.id ?? '?'} missing source/timeWindow/reliability`,
    });
  }
}

export function assertValidOfflineCase(caseData: OfflineCase): void {
  const issues = validateOfflineCase(caseData);
  if (issues.length > 0) {
    throw new Error(issues.map((i) => `${i.code}: ${i.message}`).join('; '));
  }
}
