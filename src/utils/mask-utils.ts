/**
 * Utility functions for operating on the subject's transparency mask.
 */

/**
 * Initializes a mask canvas based on transparency of an AI-processed image.
 * This reads the alpha channel of the AI output and writes it as a binary/grayscale mask.
 */
export function initMaskFromTransparentImage(
  originalImg: HTMLImageElement,
  transparentImg: HTMLImageElement,
  maskCanvas: HTMLCanvasElement
) {
  const width = originalImg.naturalWidth;
  const height = originalImg.naturalHeight;

  maskCanvas.width = width;
  maskCanvas.height = height;

  const ctx = maskCanvas.getContext('2d');
  if (!ctx) return;

  // Clear to black (hidden)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Draw the transparent image. Anywhere there are non-transparent pixels, we'll draw white.
  // To do this simply: we draw the transparent image and then use globalCompositeOperation
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  tempCtx.drawImage(transparentImg, 0, 0, width, height);
  const imgData = tempCtx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Create mask data: if pixel alpha is greater than zero, it is visible (white in mask)
  const maskData = ctx.createImageData(width, height);
  const maskPixels = maskData.data;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 10) {
      maskPixels[i] = 255;     // R
      maskPixels[i + 1] = 255; // G
      maskPixels[i + 2] = 255; // B
      maskPixels[i + 3] = 255; // A (fully opaque visible mask)
    } else {
      maskPixels[i] = 0;
      maskPixels[i + 1] = 0;
      maskPixels[i + 2] = 0;
      maskPixels[i + 3] = 0;   // A (transparent black mask)
    }
  }

  ctx.putImageData(maskData, 0, 0);
}

/**
 * Applies a clicked color key (chroma-key) to the mask canvas with a tolerance.
 * Marks clicked pixels and neighboring pixels within tolerance as transparent.
 */
export function applyChromaKey(
  originalImg: HTMLImageElement,
  maskCanvas: HTMLCanvasElement,
  clickX: number, // percentage or direct pixel coordinates
  clickY: number,
  targetR: number,
  targetG: number,
  targetB: number,
  tolerance: number, // 0 to 255
  feather: number // blur radius for edges
) {
  const width = originalImg.naturalWidth;
  const height = originalImg.naturalHeight;

  // Make a temporary canvas to read original pixel data
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  tempCtx.drawImage(originalImg, 0, 0, width, height);
  const imgData = tempCtx.getImageData(0, 0, width, height);
  const originalPixels = imgData.data;

  // Gain access to the mask canvas
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) return;
  const maskData = maskCtx.getImageData(0, 0, width, height);
  const maskPixels = maskData.data;

  // Calculate Euclidean color distance or simple delta
  // Let's use simple weighted Manhattan distance for better human color similarity
  for (let i = 0; i < originalPixels.length; i += 4) {
    const r = originalPixels[i];
    const g = originalPixels[i + 1];
    const b = originalPixels[i + 2];

    const dr = r - targetR;
    const dg = g - targetG;
    const db = b - targetB;

    const distance = Math.sqrt(dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114);

    if (distance <= tolerance) {
      // It matches the color to remove! Draw black (hidden/transparent) in mask
      maskPixels[i] = 0;
      maskPixels[i + 1] = 0;
      maskPixels[i + 2] = 0;
      maskPixels[i + 3] = 0;
    }
  }

  maskCtx.putImageData(maskData, 0, 0);

  // Apply feather edge if specified
  if (feather > 0) {
    maskCtx.filter = `blur(${feather}px)`;
    const copy = document.createElement('canvas');
    copy.width = width;
    copy.height = height;
    const copyCtx = copy.getContext('2d');
    if (copyCtx) {
      copyCtx.drawImage(maskCanvas, 0, 0);
      maskCtx.clearRect(0, 0, width, height);
      maskCtx.drawImage(copy, 0, 0);
    }
    maskCtx.filter = 'none';
  }
}

/**
 * Creates a composite transparent image from an original image plus an alpha mask canvas.
 */
export function createCompositeImage(
  originalImg: HTMLImageElement,
  maskCanvas: HTMLCanvasElement
): string {
  const width = originalImg.naturalWidth;
  const height = originalImg.naturalHeight;

  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = width;
  resultCanvas.height = height;
  const resultCtx = resultCanvas.getContext('2d');
  if (!resultCtx) return '';

  // Draw original image
  resultCtx.drawImage(originalImg, 0, 0, width, height);

  // Apply the mask as a destination-in composite operation
  resultCtx.globalCompositeOperation = 'destination-in';
  resultCtx.drawImage(maskCanvas, 0, 0, width, height);
  resultCtx.globalCompositeOperation = 'source-over';

  return resultCanvas.toDataURL('image/png');
}
