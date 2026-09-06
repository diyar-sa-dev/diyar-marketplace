const THEME_FONT_LINK_ID = 'diyar-theme-google-fonts';

/** Admin-selectable fonts not bundled via @fontsource — loaded on demand only. */
const GOOGLE_FONT_SPECS: Record<string, string> = {
  Cairo: 'Cairo:wght@400;600;700',
  'IBM Plex Sans Arabic': 'IBM+Plex+Sans+Arabic:wght@400;600;700',
  'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@400;600;700',
};

const SELF_HOSTED_FAMILIES = new Set([
  'Alexandria',
  'Outfit',
  'Tajawal',
  'Inter',
  'system-ui',
  'sans-serif',
]);

function extractPrimaryFamilies(fontStack: string): string[] {
  return fontStack
    .split(',')
    .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

function familiesNeedingGoogle(fontStack: string): string[] {
  const needed = new Set<string>();

  for (const family of extractPrimaryFamilies(fontStack)) {
    if (SELF_HOSTED_FAMILIES.has(family)) {
      continue;
    }
    if (GOOGLE_FONT_SPECS[family]) {
      needed.add(family);
    }
  }

  return [...needed];
}

/** Inject (or remove) a Google Fonts stylesheet when admin theme picks non-bundled families. */
export function ensureThemeFontsLoaded(fontStack: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const families = familiesNeedingGoogle(fontStack);
  const existing = document.getElementById(THEME_FONT_LINK_ID) as HTMLLinkElement | null;

  if (families.length === 0) {
    existing?.remove();
    return;
  }

  const familiesParam = families.map((name) => GOOGLE_FONT_SPECS[name]).join('&family=');
  const href = `https://fonts.googleapis.com/css2?family=${familiesParam}&display=swap`;

  if (existing) {
    if (existing.href === href) {
      return;
    }
    existing.href = href;
    return;
  }

  const link = document.createElement('link');
  link.id = THEME_FONT_LINK_ID;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}
