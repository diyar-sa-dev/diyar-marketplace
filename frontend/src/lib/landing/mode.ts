/** When true, Vercel serves the temporary public landing page only (no marketplace shell). */
export function isLandingMode(): boolean {
  return import.meta.env.VITE_LANDING_MODE === 'true';
}
