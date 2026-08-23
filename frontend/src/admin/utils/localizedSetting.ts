import type { TranslateFn } from '../../lib/i18n/types.ts';

export const SETTINGS_GROUP_ORDER = [
  'platform',
  'feature',
  'commerce',
  'orders',
  'shipping',
  'payouts',
  'affiliate',
  'services',
  'notifications',
  'chat',
  'theme',
] as const;

function settingI18nKey(fullKey: string, prefix: 'keys' | 'descriptions' | 'hints'): string {
  return `admin.settings.${prefix}.${fullKey.replace(/\./g, '_')}`;
}

export function localizedSettingLabel(fullKey: string, t: TranslateFn): string {
  const key = settingI18nKey(fullKey, 'keys');
  const translated = t(key as never);
  return translated === key ? fullKey.split('.').slice(1).join(' · ') : translated;
}

export function localizedSettingDescription(fullKey: string, t: TranslateFn): string {
  const key = settingI18nKey(fullKey, 'descriptions');
  const translated = t(key as never);
  return translated === key ? '' : translated;
}

export function localizedSettingHint(fullKey: string, t: TranslateFn): string {
  const key = settingI18nKey(fullKey, 'hints');
  const translated = t(key as never);
  if (translated !== key) return translated;

  return localizedSettingDescription(fullKey, t);
}

export function localizedSettingGroup(group: string, t: TranslateFn): string {
  const key = `admin.settings.groups.${group}`;
  const translated = t(key as never);
  return translated === key ? group : translated;
}

export function sortSettingGroups<T extends { group: string }>(items: T[]): T[] {
  const order = new Map(SETTINGS_GROUP_ORDER.map((group, index) => [group, index]));

  return [...items].sort((a, b) => {
    const aIndex = order.get(a.group as (typeof SETTINGS_GROUP_ORDER)[number]) ?? 999;
    const bIndex = order.get(b.group as (typeof SETTINGS_GROUP_ORDER)[number]) ?? 999;
    return aIndex - bIndex;
  });
}
