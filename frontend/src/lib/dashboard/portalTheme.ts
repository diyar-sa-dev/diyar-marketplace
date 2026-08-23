import { useLocation } from 'react-router-dom';
import { getPortalFromPath, type DashboardPortalKey } from '../auth/roles.ts';

export type PortalThemeKey = DashboardPortalKey;

export type PortalTheme = {
  key: PortalThemeKey;
  text: string;
  button: string;
  buttonSoft: string;
  badge: string;
  amount: string;
  tabActive: string;
  inputFocus: string;
  icon: string;
  iconBg: string;
  cardHover: string;
  toggle: string;
  link: string;
  outline: string;
  notice: string;
  avatarRing: string;
  navActive: string;
};

function portalAccentVar(key: PortalThemeKey): string {
  const map: Record<PortalThemeKey, string> = {
    vendor: '--diyar-portal-vendor',
    service: '--diyar-portal-provider',
    affiliate: '--diyar-portal-affiliate',
  };

  return map[key];
}

function portalFallback(key: PortalThemeKey): string {
  const map: Record<PortalThemeKey, string> = {
    vendor: '#947961',
    service: '#2563eb',
    affiliate: '#16a34a',
  };

  return map[key];
}

function buildPortalTheme(key: PortalThemeKey): PortalTheme {
  const cssVar = portalAccentVar(key);
  const fallback = portalFallback(key);
  const color = `var(${cssVar}, ${fallback})`;

  return {
    key,
    text: `text-[color:${color}]`,
    button: `bg-[color:${color}] text-white hover:opacity-90`,
    buttonSoft: `bg-[color:${color}]/10 hover:bg-[color:${color}]/15 text-[color:${color}]`,
    badge: `bg-[color:${color}] text-white`,
    amount: `text-[color:${color}] font-bold`,
    tabActive: `bg-white text-[color:${color}] shadow-sm ring-1 ring-gray-200/80`,
    inputFocus: `focus:outline-none focus:border-[color:${color}] focus:ring-1 focus:ring-[color:${color}]`,
    icon: `text-[color:${color}]`,
    iconBg: `bg-[color:${color}]/10 text-[color:${color}]`,
    cardHover: `hover:border-[color:${color}]/20 focus:ring-[color:${color}]`,
    toggle: `peer-checked:bg-[color:${color}]`,
    link: `text-[color:${color}] hover:opacity-80`,
    outline: `text-[color:${color}] border border-[color:${color}] hover:bg-[color:${color}]/10`,
    notice: `bg-[color:${color}]/10 border border-[color:${color}]/20 text-[color:${color}]`,
    avatarRing: `hover:ring-[color:${color}]/30`,
    navActive: `bg-[color:${color}] text-white shadow-md shadow-[color:${color}]/20`,
  };
}

export const PORTAL_THEMES: Record<PortalThemeKey, PortalTheme> = {
  vendor: buildPortalTheme('vendor'),
  service: buildPortalTheme('service'),
  affiliate: buildPortalTheme('affiliate'),
};

export function getPortalTheme(key: PortalThemeKey | null | undefined): PortalTheme {
  if (key && key in PORTAL_THEMES) {
    return PORTAL_THEMES[key];
  }

  return PORTAL_THEMES.vendor;
}

export function portalInputClass(theme: PortalTheme): string {
  return `w-full p-3 border border-gray-200 rounded-xl bg-gray-50/50 placeholder:text-gray-400 text-start ${theme.inputFocus}`;
}

export function usePortalTheme(forced?: PortalThemeKey): PortalTheme {
  const location = useLocation();
  const key = forced ?? getPortalFromPath(location.pathname) ?? 'vendor';

  return getPortalTheme(key);
}

export function usePortalThemeKey(forced?: PortalThemeKey): PortalThemeKey {
  const location = useLocation();
  return forced ?? getPortalFromPath(location.pathname) ?? 'vendor';
}
