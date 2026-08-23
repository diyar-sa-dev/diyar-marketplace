import { apiClient } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export type PlatformThemeTokens = {
  primary_color?: string;
  primary_dark?: string;
  surface_color?: string;
  font_family_ar?: string;
  font_family_en?: string;
  vendor_accent_color?: string;
  provider_accent_color?: string;
  affiliate_accent_color?: string;
};

export async function fetchPlatformTheme(): Promise<PlatformThemeTokens> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ theme: PlatformThemeTokens }>>(
    '/platform/theme',
  );

  return data.data.theme ?? {};
}
