/**
 * Human Practices — Integration Loop records.
 * Only verified notes / consented quotes. No fabricated interviews or outcomes.
 */

export type Localized = { 'zh-Hant': string; en: string };

export type ConsentAttributionStatus =
  | 'named-consent'
  | 'anonymous-approved'
  | 'pending'
  | 'not-for-publication';

export type EngagementMethod =
  | 'interview'
  | 'workshop'
  | 'survey'
  | 'observation'
  | 'expert-consult'
  | 'other';

export type StakeholderRecord = {
  id: string;
  label: Localized;
  /** Public description of the group / role — not a private name unless consented. */
  context: Localized;
  anonymized: boolean;
  anonymizationReason?: Localized;
};

export type EngagementRecord = {
  id: string;
  date: string;
  method: EngagementMethod;
  stakeholderIds: string[];
  teamMemberIds: string[];
  consentAttributionStatus: ConsentAttributionStatus;
  questionAsked: Localized;
  /** Verified notes or consented quotes only. */
  whatWeHeard: Localized;
  insight: Localized;
  projectDecision: Localized;
  concreteChange: Localized;
  evidenceOfChange: Localized;
  followUpEvaluation: Localized;
  sourceNotes: Localized;
  projectImpact: Localized;
};

export type DecisionTimelineEntry = {
  id: string;
  date: string;
  title: Localized;
  summary: Localized;
  relatedEngagementIds: string[];
  affectedAreas: Array<'wet-lab' | 'model' | 'hardware' | 'software' | 'education' | 'other'>;
};

export type HumanPracticesCatalog = {
  schemaVersion: '1';
  approach: Localized;
  ethicsAndResponsibility: Localized;
  limitationsAndMissingVoices: Localized;
  nextSteps: Localized;
  howHpChanged: {
    wetLab: Localized;
    model: Localized;
    hardware: Localized;
  };
  stakeholders: StakeholderRecord[];
  engagements: EngagementRecord[];
  decisionTimeline: DecisionTimelineEntry[];
};

const emptyLoc = (): Localized => ({ 'zh-Hant': '', en: '' });

export const humanPracticesCatalog: HumanPracticesCatalog = {
  schemaVersion: '1',
  approach: emptyLoc(),
  ethicsAndResponsibility: emptyLoc(),
  limitationsAndMissingVoices: emptyLoc(),
  nextSteps: emptyLoc(),
  howHpChanged: {
    wetLab: emptyLoc(),
    model: emptyLoc(),
    hardware: emptyLoc(),
  },
  stakeholders: [],
  engagements: [],
  decisionTimeline: [],
};

export function assertEngagement(record: EngagementRecord): void {
  if (!record.id.trim()) throw new Error('engagement id required');
  if (!/^\d{4}-\d{2}-\d{2}/.test(record.date)) {
    throw new Error(`engagement ${record.id}: date must be YYYY-MM-DD`);
  }
  if (record.consentAttributionStatus === 'anonymous-approved' && !record.stakeholderIds.length) {
    /* stakeholders may still be anonymized group ids */
  }
}
