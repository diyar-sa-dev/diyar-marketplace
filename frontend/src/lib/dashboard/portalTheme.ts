import { useLocation } from 'react-router-dom';
import { getPortalFromPath, type DashboardPortalKey } from '../auth/roles.ts';

export type PortalThemeKey = DashboardPortalKey;

export type PortalTheme = {
  key: PortalThemeKey;
  /** Primary accent text */
  text: string;
  /** Primary filled button */
  button: string;
  /** Soft filled / secondary button */
  buttonSoft: string;
  /** Badge on images / commission chips */
  badge: string;
  /** Expected earnings / highlighted amounts */
  amount: string;
  /** Active tab pill */
  tabActive: string;
  /** Text input focus */
  inputFocus: string;
  /** Icon accent */
  icon: string;
  /** Soft icon background */
  iconBg: string;
  /** Card hover border */
  cardHover: string;
  /** Toggle switch checked */
  toggle: string;
  /** Link / text button */
  link: string;
  /** Outline button */
  outline: string;
  /** Info notice box (bank tab) */
  notice: string;
  /** Header avatar ring */
  avatarRing: string;
  /** Active nav (sidebar uses separate map in layout) */
  navActive: string;
};

const VENDOR_THEME: PortalTheme = {
  key: 'vendor',
  text: 'text-diyar-brown',
  button: 'bg-diyar-brown text-white hover:bg-[#856b54]',
  buttonSoft: 'bg-amber-50 hover:bg-amber-100 text-diyar-brown',
  badge: 'bg-diyar-brown text-white',
  amount: 'text-diyar-brown font-bold',
  tabActive: 'bg-white text-diyar-brown shadow-sm ring-1 ring-gray-200/80',
  inputFocus: 'focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown',
  icon: 'text-diyar-brown',
  iconBg: 'bg-amber-50 text-diyar-brown',
  cardHover: 'hover:border-diyar-brown/20 focus:ring-diyar-brown',
  toggle: 'peer-checked:bg-diyar-brown',
  link: 'text-diyar-brown hover:text-diyar-dark',
  outline: 'text-diyar-brown border border-diyar-brown hover:bg-amber-50',
  notice: 'bg-amber-50 border border-amber-200 text-amber-800',
  avatarRing: 'hover:ring-diyar-brown/30',
  navActive: 'bg-diyar-brown text-white shadow-md shadow-diyar-brown/20',
};

const SERVICE_THEME: PortalTheme = {
  key: 'service',
  text: 'text-blue-600',
  button: 'bg-blue-600 text-white hover:bg-blue-700',
  buttonSoft: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
  badge: 'bg-blue-600 text-white',
  amount: 'text-blue-600 font-bold',
  tabActive: 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200/80',
  inputFocus: 'focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600',
  icon: 'text-blue-600',
  iconBg: 'bg-blue-50 text-blue-600',
  cardHover: 'hover:border-blue-500/20 focus:ring-blue-600',
  toggle: 'peer-checked:bg-blue-600',
  link: 'text-blue-600 hover:text-blue-800',
  outline: 'text-blue-600 border border-blue-600 hover:bg-blue-50',
  notice: 'bg-blue-50 border border-blue-200 text-blue-900',
  avatarRing: 'hover:ring-blue-500/30',
  navActive: 'bg-blue-600 text-white shadow-md shadow-blue-600/20',
};

const AFFILIATE_THEME: PortalTheme = {
  key: 'affiliate',
  text: 'text-green-600',
  button: 'bg-green-600 text-white hover:bg-green-700',
  buttonSoft: 'bg-green-50 hover:bg-green-100 text-green-700',
  badge: 'bg-green-600 text-white',
  amount: 'text-green-600 font-bold',
  tabActive: 'bg-white text-green-600 shadow-sm ring-1 ring-gray-200/80',
  inputFocus: 'focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600',
  icon: 'text-green-600',
  iconBg: 'bg-green-50 text-green-600',
  cardHover: 'hover:border-green-500/20 focus:ring-green-600',
  toggle: 'peer-checked:bg-green-600',
  link: 'text-green-600 hover:text-green-800',
  outline: 'text-green-600 border border-green-600 hover:bg-green-50',
  notice: 'bg-green-50 border border-green-200 text-green-900',
  avatarRing: 'hover:ring-green-500/30',
  navActive: 'bg-green-600 text-white shadow-md shadow-green-600/20',
};

export const PORTAL_THEMES: Record<PortalThemeKey, PortalTheme> = {
  vendor: VENDOR_THEME,
  service: SERVICE_THEME,
  affiliate: AFFILIATE_THEME,
};

export function getPortalTheme(key: PortalThemeKey | null | undefined): PortalTheme {
  if (key && key in PORTAL_THEMES) {
    return PORTAL_THEMES[key];
  }

  return VENDOR_THEME;
}

/** Shared input class with portal-colored focus ring */
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
