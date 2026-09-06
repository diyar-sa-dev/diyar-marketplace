import { useEffect, type ReactNode } from 'react';
import { useLocale } from '../../hooks/useLocale.ts';
import { usePlatformThemeQuery } from '../../hooks/usePlatformTheme.ts';
import { applyPlatformTheme } from '../../lib/theme/applyPlatformTheme.ts';

export function PlatformThemeProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const { data } = usePlatformThemeQuery();

  useEffect(() => {
    applyPlatformTheme(data ?? {}, locale);
  }, [data, locale]);

  return children;
}
