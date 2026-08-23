export type ThemeColorValues = {
  primary_color: string;
  primary_dark: string;
  surface_color: string;
  vendor_accent_color: string;
  provider_accent_color: string;
  affiliate_accent_color: string;
};

export type ThemeColorTemplate = {
  id: string;
  labelKey: string;
  descriptionKey: string;
  gradient: string;
  colors: ThemeColorValues;
};

export const THEME_COLOR_TEMPLATES: ThemeColorTemplate[] = [
  {
    id: 'diyar',
    labelKey: 'admin.settings.templates.diyar',
    descriptionKey: 'admin.settings.templates.diyarHint',
    gradient: 'linear-gradient(135deg, #1f3d3a 0%, #947961 45%, #f3ecdb 100%)',
    colors: {
      primary_color: '#947961',
      primary_dark: '#1f3d3a',
      surface_color: '#f3ecdb',
      vendor_accent_color: '#947961',
      provider_accent_color: '#2563eb',
      affiliate_accent_color: '#16a34a',
    },
  },
  {
    id: 'desert',
    labelKey: 'admin.settings.templates.desert',
    descriptionKey: 'admin.settings.templates.desertHint',
    gradient: 'linear-gradient(135deg, #5c4033 0%, #a57a55 50%, #faf6f0 100%)',
    colors: {
      primary_color: '#a57a55',
      primary_dark: '#5c4033',
      surface_color: '#faf6f0',
      vendor_accent_color: '#b8956a',
      provider_accent_color: '#c27803',
      affiliate_accent_color: '#15803d',
    },
  },
  {
    id: 'ocean',
    labelKey: 'admin.settings.templates.ocean',
    descriptionKey: 'admin.settings.templates.oceanHint',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #2563eb 55%, #e0f2fe 100%)',
    colors: {
      primary_color: '#3b82f6',
      primary_dark: '#0f172a',
      surface_color: '#f1f5f9',
      vendor_accent_color: '#6366f1',
      provider_accent_color: '#0ea5e9',
      affiliate_accent_color: '#22c55e',
    },
  },
  {
    id: 'emerald',
    labelKey: 'admin.settings.templates.emerald',
    descriptionKey: 'admin.settings.templates.emeraldHint',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #ecfdf5 100%)',
    colors: {
      primary_color: '#059669',
      primary_dark: '#064e3b',
      surface_color: '#ecfdf5',
      vendor_accent_color: '#10b981',
      provider_accent_color: '#0284c7',
      affiliate_accent_color: '#84cc16',
    },
  },
  {
    id: 'royal',
    labelKey: 'admin.settings.templates.royal',
    descriptionKey: 'admin.settings.templates.royalHint',
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #f5f3ff 100%)',
    colors: {
      primary_color: '#7c3aed',
      primary_dark: '#4c1d95',
      surface_color: '#f5f3ff',
      vendor_accent_color: '#8b5cf6',
      provider_accent_color: '#db2777',
      affiliate_accent_color: '#f59e0b',
    },
  },
  {
    id: 'slate',
    labelKey: 'admin.settings.templates.slate',
    descriptionKey: 'admin.settings.templates.slateHint',
    gradient: 'linear-gradient(135deg, #1e293b 0%, #64748b 50%, #f8fafc 100%)',
    colors: {
      primary_color: '#64748b',
      primary_dark: '#1e293b',
      surface_color: '#f8fafc',
      vendor_accent_color: '#475569',
      provider_accent_color: '#0369a1',
      affiliate_accent_color: '#059669',
    },
  },
];

export const THEME_COLOR_KEYS = [
  'primary_color',
  'primary_dark',
  'surface_color',
  'vendor_accent_color',
  'provider_accent_color',
  'affiliate_accent_color',
] as const;

export function detectActiveTemplate(settings: Map<string, string>): ThemeColorTemplate | null {
  for (const template of THEME_COLOR_TEMPLATES) {
    const matches = THEME_COLOR_KEYS.every(
      (key) => settings.get(key)?.toLowerCase() === template.colors[key].toLowerCase(),
    );
    if (matches) return template;
  }
  return null;
}
