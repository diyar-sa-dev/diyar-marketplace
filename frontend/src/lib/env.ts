/**
 * Typed access to Vite environment variables.
 */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  appName: import.meta.env.VITE_APP_NAME ?? 'DIYAR',
  isDev: import.meta.env.DEV,
} as const;
