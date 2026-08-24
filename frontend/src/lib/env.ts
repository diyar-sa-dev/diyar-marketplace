/**
 * Typed access to Vite environment variables.
 *
 * Local dev: Vite proxy (same-origin) — see vite.config.ts:
 *   VITE_API_URL=/api/v1
 *   VITE_BACKEND_URL=
 *
 * Vercel + Render (recommended): call Render directly to avoid Vercel proxy timeouts:
 *   VITE_API_URL=https://<render-service>.onrender.com/api/v1
 *   VITE_BACKEND_URL=https://<render-service>.onrender.com
 *
 * Optional same-origin proxy (vercel.json rewrites) — can hit ~60s proxy timeout on cold Render:
 *   VITE_API_URL=/api/v1
 *   VITE_BACKEND_URL=
 *   VITE_USE_API_PROXY=true
 */

function configuredBackendUrl(): string {
  return import.meta.env.VITE_BACKEND_URL ?? '';
}

function configuredApiUrl(): string {
  return import.meta.env.VITE_API_URL ?? '/api/v1';
}

function isApiProxyEnabled(): boolean {
  return import.meta.env.VITE_USE_API_PROXY === 'true';
}

/** Use same-origin `/api/v1` proxy instead of cross-origin backend URL. */
export function shouldUseSameOriginApiProxy(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  if (isApiProxyEnabled()) {
    return true;
  }

  const backend = configuredBackendUrl();
  if (backend === '') {
    return configuredApiUrl().startsWith('/');
  }

  try {
    return new URL(backend).hostname !== window.location.hostname;
  } catch {
    return configuredApiUrl().startsWith('/');
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
