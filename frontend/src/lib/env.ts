/**
 * Typed access to Vite environment variables.
 *
 * Local dev: Vite proxy (same-origin) — see vite.config.ts:
 *   VITE_API_URL=/api/v1
 *   VITE_BACKEND_URL=
 *
 * Vercel + Render: always use same-origin `/api/v1` (vercel.json proxies to Render).
 * Cross-origin direct Render URLs break Sanctum session/CSRF cookies (419).
 */

function configuredBackendUrl(): string {
  return import.meta.env.VITE_BACKEND_URL ?? '';
}

function configuredApiUrl(): string {
  return import.meta.env.VITE_API_URL ?? '/api/v1';
}

/** Use Vercel/nginx same-origin proxy instead of cross-origin Render URL. */
export function shouldUseSameOriginApiProxy(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.location.hostname.endsWith('.vercel.app')) {
    return true;
  }

  const backend = configuredBackendUrl();
  if (backend === '') {
    return false;
  }

  try {
    return new URL(backend).hostname !== window.location.hostname;
  } catch {
    return false;
  }
}

export function apiBaseUrl(): string {
  return shouldUseSameOriginApiProxy() ? '/api/v1' : configuredApiUrl();
}

export function backendBaseUrl(): string {
  return shouldUseSameOriginApiProxy() ? '' : configuredBackendUrl();
}

export const env = {
  get apiUrl() {
    return apiBaseUrl();
  },
  get backendUrl() {
    return backendBaseUrl();
  },
  adminPanelUrl: import.meta.env.VITE_ADMIN_PANEL_URL ?? '/admin',
  appName: import.meta.env.VITE_APP_NAME ?? 'DIYAR',
  isDev: import.meta.env.DEV,
  reverb: {
    key: import.meta.env.VITE_REVERB_APP_KEY ?? '',
    host: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
    port: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    scheme: import.meta.env.VITE_REVERB_SCHEME ?? 'http',
  },
} as const;

export function isRealtimeEnabled(): boolean {
  return env.reverb.key !== '';
}
