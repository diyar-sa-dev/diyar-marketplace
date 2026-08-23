export type SettingFontOption = {
  value: string;
  labelKey: string;
};

export const ARABIC_FONT_OPTIONS: SettingFontOption[] = [
  {
    value: 'Alexandria, Tajawal, sans-serif',
    labelKey: 'admin.settings.fonts.arAlexandriaTajawal',
  },
  {
    value: 'Tajawal, Alexandria, sans-serif',
    labelKey: 'admin.settings.fonts.arTajawalAlexandria',
  },
  { value: 'Cairo, Tajawal, sans-serif', labelKey: 'admin.settings.fonts.arCairoTajawal' },
  {
    value: 'IBM Plex Sans Arabic, Tajawal, sans-serif',
    labelKey: 'admin.settings.fonts.arIbmPlexTajawal',
  },
];

export const ENGLISH_FONT_OPTIONS: SettingFontOption[] = [
  { value: 'Outfit, Inter, sans-serif', labelKey: 'admin.settings.fonts.enOutfitInter' },
  { value: 'Inter, system-ui, sans-serif', labelKey: 'admin.settings.fonts.enInterSystem' },
  { value: 'Outfit, system-ui, sans-serif', labelKey: 'admin.settings.fonts.enOutfitSystem' },
  {
    value: 'Plus Jakarta Sans, Inter, sans-serif',
    labelKey: 'admin.settings.fonts.enPlusJakartaInter',
  },
];

export function fontOptionsForSetting(fullKey: string): SettingFontOption[] | null {
  if (fullKey === 'theme.font_family_ar') return ARABIC_FONT_OPTIONS;
  if (fullKey === 'theme.font_family_en') return ENGLISH_FONT_OPTIONS;
  return null;
}
