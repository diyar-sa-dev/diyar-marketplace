export interface SecuritySession {
  id: string;
  device_type: 'desktop' | 'mobile' | 'tablet' | null;
  browser: string | null;
  browser_version: string | null;
  platform: string | null;
  platform_version: string | null;
  device_name: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  location_source: string | null;
  is_current: boolean;
  first_seen_at: string;
  last_activity_at: string;
}

export interface SecuritySessionsActionResult {
  message?: string;
  revokedCount?: number;
}
