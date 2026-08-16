/**
 * Typed access to Vite environment variables.
 *
 * In local dev, use Vite proxy (same-origin) — see vite.config.ts:
 *   VITE_API_URL=/api/v1
 *   VITE_BACKEND_URL=   (empty → relative /sanctum/csrf-cookie)
 */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '/api/v1' : 'http://localhost:8000/api/v1'),
  backendUrl: import.meta.env.VITE_BACKEND_URL ?? '',
  appName: import.meta.env.VITE_APP_NAME ?? 'DIYAR',
  isDev: import.meta.env.DEV,
} as const;
