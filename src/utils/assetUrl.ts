/** Resolve a public asset path for the current Vite base URL (GitHub Pages subpath). */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${normalized}`;
}

/** React Router basename derived from Vite base (no trailing slash). */
export const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '');
