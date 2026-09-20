import { resolveArAssetUrl } from '../adapters/resolveArAssetUrl.ts';
import { detectArSupport } from './detectArSupport.ts';

export type OpenArPreviewResult = { ok: true } | { ok: false; reason: string };

/**
 * Lazy AR entry — separate module so V1 bundles stay free of AR-specific deps.
 */
export async function openArPreviewForAssetRef(assetRef: string): Promise<OpenArPreviewResult> {
  const url = resolveArAssetUrl(assetRef);
  if (!url) {
    return { ok: false, reason: 'invalid_ar_asset' };
  }

  const support = detectArSupport();
  if (!support.usdzQuickLook && !support.webxr) {
    return { ok: false, reason: 'ar_unsupported' };
  }

  if (url.toLowerCase().endsWith('.usdz') || url.toLowerCase().includes('.usdz?')) {
    const anchor = document.createElement('a');
    anchor.rel = 'ar';
    anchor.href = url;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return { ok: true };
  }

  if (support.webxr) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return { ok: true };
  }

  return { ok: false, reason: 'ar_format_unsupported' };
}
