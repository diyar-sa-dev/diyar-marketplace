export type ArSupportSnapshot = {
  webxr: boolean;
  usdzQuickLook: boolean;
};

/** Capability probe only — no WebXR/USDZ libraries loaded. */
export function detectArSupport(): ArSupportSnapshot {
  const webxr = typeof navigator !== 'undefined' && 'xr' in navigator;
  const usdzQuickLook = typeof document !== 'undefined';
  return { webxr, usdzQuickLook };
}
