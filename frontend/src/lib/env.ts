/**
 * Typed access to Vite environment variables.
 *
 * In local dev, use Vite proxy (same-origin) — see vite.config.ts:
 *   VITE_API_URL=/api/v1
 *   VITE_BACKEND_URL=   (empty → relative /sanctum/csrf-cookie)
 */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? '/api/v1',
  backendUrl: import.meta.env.VITE_BACKEND_URL ?? '',
  /** In-app React admin SPA route (same origin as marketplace). */
  adminPanelUrl: import.meta.env.VITE_ADMIN_PANEL_URL ?? '/admin',
  appName: import.meta.env.VITE_APP_NAME ?? 'DIYAR',
  isDev: import.meta.env.DEV,
  reverb: {
    key: import.meta.env.VITE_REVERB_APP_KEY ?? '',
    host: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
    port: Number(import.meta.env.VITE_REVERB_PORT ?? 8090),
    scheme: import.meta.env.VITE_REVERB_SCHEME ?? 'http',
  },
} as const;

export function isRealtimeEnabled(): boolean {
  return env.reverb.key !== '';
}
