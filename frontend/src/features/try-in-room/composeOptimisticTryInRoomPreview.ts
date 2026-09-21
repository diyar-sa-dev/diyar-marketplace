function loadImage(src: string, cors = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (cors) {
      image.crossOrigin = 'anonymous';
    }
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image_load_failed'));
    image.src = src;
  });
}

function overlayProduct(
  ctx: CanvasRenderingContext2D,
  product: HTMLImageElement,
  roomW: number,
  roomH: number,
): void {
  const srcW = product.naturalWidth;
  const srcH = product.naturalHeight;
  if (srcW < 1 || srcH < 1 || roomW < 8 || roomH < 8) {
    return;
  }

  let targetW = Math.max(16, Math.round(roomW * 0.32));
  let targetH = Math.round(srcH * (targetW / srcW));
  const maxH = Math.round(roomH * 0.55);
  if (targetH > maxH) {
    targetH = Math.max(16, maxH);
    targetW = Math.round(srcW * (targetH / srcH));
  }

  const dstX = Math.max(0, Math.round((roomW - targetW) / 2));
  const dstY = Math.max(0, Math.round(roomH - targetH - roomH * 0.08));
  ctx.drawImage(product, dstX, dstY, targetW, targetH);
}

function canvasPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error('canvas_blob_failed'));
    }, 'image/png');
  });
}

/** Instant local composite so the dialog never sits on a spinner. */
export async function composeOptimisticTryInRoomPreview(
  room: Blob,
  productImageUrl: string | undefined,
): Promise<string> {
  const roomUrl = URL.createObjectURL(room);
  try {
    const roomImage = await loadImage(roomUrl);
    const width = Math.max(1, roomImage.naturalWidth);
    const height = Math.max(1, roomImage.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('canvas_unavailable');
    }
    ctx.drawImage(roomImage, 0, 0, width, height);
    if (productImageUrl) {
      try {
        const product = await loadImage(productImageUrl, true);
        overlayProduct(ctx, product, width, height);
      } catch {
        // Room-only still reads as an instant preview.
      }
    }
    const blob = await canvasPng(canvas);
    return URL.createObjectURL(blob);
  } finally {
    URL.revokeObjectURL(roomUrl);
  }
}
