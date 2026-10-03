import siteJson from '../../site.json';

export type SiteConfig = {
  teamName: string;
  attributionsEmbedUrl: string;
  attributionsOpenUrl: string;
  supportAcknowledgement: { 'zh-Hant': string; en: string };
  social: {
    linkedin: string;
    instagram: string;
    email: string;
  };
  attributionsAllowlistHosts: string[];
};

export const siteConfig = siteJson as SiteConfig;

const ALLOWED_PROTOCOLS = new Set(['https:']);

/**
 * Returns an allowlisted official attributions URL, or null if unset / invalid.
 * Never invents a URL. Empty string → no network request.
 */
export function resolveAttributionsEmbedUrl(
  raw: string = siteConfig.attributionsEmbedUrl,
): { ok: true; url: string } | { ok: false; reason: 'empty' | 'invalid' | 'not_allowlisted' } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: 'empty' };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, reason: 'invalid' };
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return { ok: false, reason: 'invalid' };
  }

  const host = parsed.hostname.toLowerCase();
  const allowed = siteConfig.attributionsAllowlistHosts.map((h) => h.toLowerCase());
  const hostOk = allowed.some((h) => host === h || host.endsWith(`.${h}`));
  if (!hostOk) return { ok: false, reason: 'not_allowlisted' };

  return { ok: true, url: parsed.toString() };
}

export function attributionsFallbackOpenUrl(): string | null {
  const open = siteConfig.attributionsOpenUrl.trim();
  if (open) {
    const r = resolveAttributionsEmbedUrl(open);
    return r.ok ? r.url : null;
  }
  const embed = resolveAttributionsEmbedUrl();
  return embed.ok ? embed.url : null;
}

export function socialLinks(): Array<{ id: string; href: string; label: string }> {
  const { linkedin, instagram, email } = siteConfig.social;
  return [
    { id: 'linkedin', href: linkedin, label: 'LinkedIn' },
    { id: 'instagram', href: instagram, label: 'Instagram' },
    { id: 'email', href: email, label: 'Email' },
  ].filter((l) => Boolean(l.href.trim()));
}
