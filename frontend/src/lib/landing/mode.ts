/** When true, serve the premium Arabic coming-soon page only (no marketplace shell). */
export function isLandingMode(): boolean {
  return import.meta.env.VITE_LANDING_MODE === 'true';
}
