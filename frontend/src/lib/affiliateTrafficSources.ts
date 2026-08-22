export type AffiliateTrafficSource =
  | 'instagram'
  | 'youtube'
  | 'facebook'
  | 'x'
  | 'messenger'
  | 'whatsapp'
  | 'telegram'
  | 'tiktok'
  | 'snapchat'
  | 'ai'
  | 'email'
  | 'sms'
  | 'website'
  | 'direct'
  | 'other';

export const AFFILIATE_TRAFFIC_SOURCES: AffiliateTrafficSource[] = [
  'instagram',
  'youtube',
  'facebook',
  'x',
  'messenger',
  'whatsapp',
  'telegram',
  'tiktok',
  'snapchat',
  'ai',
  'email',
  'sms',
  'website',
  'direct',
  'other',
];

export function normalizeAffiliateTrafficSource(value?: string | null): AffiliateTrafficSource | null {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');

  if ((AFFILIATE_TRAFFIC_SOURCES as string[]).includes(normalized)) {
    return normalized as AffiliateTrafficSource;
  }

  const aliases: Record<string, AffiliateTrafficSource> = {
    insta: 'instagram',
    ig: 'instagram',
    yt: 'youtube',
    fb: 'facebook',
    twitter: 'x',
    wa: 'whatsapp',
    tg: 'telegram',
    tt: 'tiktok',
    snap: 'snapchat',
    chatgpt: 'ai',
    openai: 'ai',
    web: 'website',
  };

  return aliases[normalized] ?? null;
}

export function resolveTrafficSourceFromReferrer(referrerUrl?: string | null): AffiliateTrafficSource | null {
  if (!referrerUrl?.trim()) {
    return null;
  }

  try {
    const host = new URL(referrerUrl).hostname.replace(/^www\./, '').toLowerCase();

    if (host.includes('instagram.com')) return 'instagram';
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
    if (host.includes('facebook.com') || host.includes('fb.com')) return 'facebook';
    if (host.includes('twitter.com') || host.includes('x.com') || host.includes('t.co')) return 'x';
    if (host.includes('messenger.com') || host.includes('m.me')) return 'messenger';
    if (host.includes('whatsapp.com') || host.includes('wa.me')) return 'whatsapp';
    if (host.includes('telegram.org') || host.includes('t.me')) return 'telegram';
    if (host.includes('tiktok.com')) return 'tiktok';
    if (host.includes('snapchat.com')) return 'snapchat';
    if (
      host.includes('chatgpt.com') ||
      host.includes('openai.com') ||
      host.includes('perplexity.ai') ||
      host.includes('claude.ai') ||
      host.includes('gemini.google.com') ||
      host.includes('copilot.microsoft.com')
    ) {
      return 'ai';
    }
    if (host.includes('mail.')) return 'email';

    return 'website';
  } catch {
    return null;
  }
}
