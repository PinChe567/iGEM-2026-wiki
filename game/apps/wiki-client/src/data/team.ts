/**
 * Team roster — data-driven only.
 * Do NOT invent names, photos, or roles. Leave `members` empty until the team supplies records.
 * Proposal authors are not automatically the final roster.
 */

export type TeamSubteam =
  | 'wet-lab'
  | 'dry-lab'
  | 'hardware'
  | 'human-practices'
  | 'wiki'
  | 'advisors'
  | 'other';

export type TeamMemberRecord = {
  id: string;
  name: { 'zh-Hant': string; en: string };
  /** Primary display role. */
  role: { 'zh-Hant': string; en: string };
  /** One person may appear in multiple subteams. */
  subteams: TeamSubteam[];
  contributionSummary: { 'zh-Hant': string; en: string };
  pronouns?: { 'zh-Hant': string; en: string };
  portraitAsset?: string;
  portraitCredit?: { 'zh-Hant': string; en: string };
  altText: { 'zh-Hant': string; en: string };
  socialLink?: string;
};

export type TeamCatalog = {
  schemaVersion: '1';
  /** Empty until team provides verified roster. */
  members: TeamMemberRecord[];
};

export const TEAM_SUBTEAM_ORDER: TeamSubteam[] = [
  'wet-lab',
  'dry-lab',
  'hardware',
  'human-practices',
  'wiki',
  'advisors',
  'other',
];

export const teamCatalog: TeamCatalog = {
  schemaVersion: '1',
  members: [],
};

export function membersBySubteam(subteam: TeamSubteam): TeamMemberRecord[] {
  return teamCatalog.members.filter((m) => m.subteams.includes(subteam));
}

export function assertTeamMember(record: TeamMemberRecord): void {
  if (!record.id.trim()) throw new Error('team member id required');
  if (!record.name.en.trim() && !record.name['zh-Hant'].trim()) {
    throw new Error(`team member ${record.id}: name required`);
  }
  if (!record.altText.en.trim() && !record.altText['zh-Hant'].trim()) {
    throw new Error(`team member ${record.id}: altText required`);
  }
  if (record.subteams.length === 0) {
    throw new Error(`team member ${record.id}: at least one subteam`);
  }
}
