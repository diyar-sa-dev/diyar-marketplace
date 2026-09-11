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
  ip_address: string | null;
  is_local_ip: boolean;
  is_current: boolean;
  first_seen_at: string;
  last_activity_at: string;
}

export interface SecurityDevice {
  fingerprint: string;
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
  ip_address: string | null;
  is_local_ip: boolean;
  is_current: boolean;
  session_count: number;
  first_seen_at: string;
  last_activity_at: string;
  sessions: SecuritySession[];
}

export interface SecuritySessionsActionResult {
  message?: string;
  revokedCount?: number;
}

export interface TwoFactorStatus {
  enabled: boolean;
  confirmed_at: string | null;
  phone_masked: string | null;
  apiUnavailable?: boolean;
}

export interface TwoFactorActionResult {
  message?: string;
  two_factor?: TwoFactorStatus;
}
