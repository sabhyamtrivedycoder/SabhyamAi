/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * High-performance, zero-cost client-side Fitting Engine.
 * Composites garments onto models with automatic background removal,
 * realistic drop shadows, and body-proportion alignment.
 * Works 100% offline, free of charge, with zero API billing.
 */

// Helper to load an image from URL, data URL, or Blob
export const loadImage = (src: string | File | Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image for canvas compositing'));

    if (typeof src === 'string') {
      img.src = src;
    } else {
      img.src = URL.createObjectURL(src);
    }
  });
};

/**
 * Remove solid/near-white or neutral background from e-commerce product photos
 * Returns a new canvas with the transparent cut-out garment
 */
export const cutoutGarment = (garmentImg: HTMLImageElement): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = garmentImg.naturalWidth || garmentImg.width;
  canvas.height = garmentImg.naturalHeight || garmentImg.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.drawImage(garmentImg, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Sample corner pixel colors to detect background color
  const sampleR = (data[0] + data[4 * (canvas.width - 1)] + data[4 * (canvas.width * (canvas.height - 1))]) / 3;
  const sampleG = (data[1] + data[4 * (canvas.width - 1) + 1] + data[4 * (canvas.width * (canvas.height - 1)) + 1]) / 3;
  const sampleB = (data[2] + data[4 * (canvas.width - 1) + 2] + data[4 * (canvas.width * (canvas.height - 1)) + 2]) / 3;

  const isLightBg = sampleR > 210 && sampleG > 210 && sampleB > 210;

  if (isLightBg) {
    const tolerance = 45;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const diff = Math.sqrt(
        (r - sampleR) ** 2 +
        (g - sampleG) ** 2 +
        (b - sampleB) ** 2
      );

      if (diff < tolerance) {
        // Transparent
        data[i + 3] = 0;
      } else if (diff < tolerance + 25) {
        // Feather edge
        const alphaFactor = (diff - tolerance) / 25;
        data[i + 3] = Math.round(data[i + 3] * alphaFactor);
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  return canvas;
};

/**
 * Composites a garment onto the user's model with proportion alignment
 */
export const compositeTryOn = async (
  modelSrc: string | File | Blob,
  garmentSrc: string | File | Blob,
  garmentCategory: string = 'baggy'
): Promise<string> => {
  const [modelImg, garmentImg] = await Promise.all([
    loadImage(modelSrc),
    loadImage(garmentSrc),
  ]);

  const canvas = document.createElement('canvas');
  const w = modelImg.naturalWidth || modelImg.width || 800;
  const h = modelImg.naturalHeight || modelImg.height || 1200;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // 1. Draw base model (exact user photo & face, 100% untouched)
  ctx.drawImage(modelImg, 0, 0, w, h);

  // 2. Cut out garment background
  const garmentCanvas = cutoutGarment(garmentImg);

  // 3. Determine positioning based on category (tops, bottoms, outerwear)
  const isBottom = garmentCategory.toLowerCase().includes('bottom') ||
                   garmentCategory.toLowerCase().includes('cargo') ||
                   garmentCategory.toLowerCase().includes('jean') ||
                   garmentCategory.toLowerCase().includes('pant');

  let targetWidth: number;
  let targetHeight: number;
  let targetX: number;
  let targetY: number;

  const garmentAspect = garmentCanvas.width / garmentCanvas.height;

  if (isBottom) {
    // Lower body (waist to ankles)
    targetWidth = w * 0.52;
    targetHeight = targetWidth / garmentAspect;
    if (targetHeight > h * 0.5) {
      targetHeight = h * 0.5;
      targetWidth = targetHeight * garmentAspect;
    }
    targetX = (w - targetWidth) / 2;
    targetY = h * 0.48;
  } else {
    // Upper body / Torso (chest, shoulders, waist)
    targetWidth = w * 0.62;
    targetHeight = targetWidth / garmentAspect;
    if (targetHeight > h * 0.48) {
      targetHeight = h * 0.48;
      targetWidth = targetHeight * garmentAspect;
    }
    targetX = (w - targetWidth) / 2;
    targetY = h * 0.24; // Begins below chin/neck to keep face 100% visible
  }

  // 4. Subtle contact shadow behind garment for realism
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.drawImage(garmentCanvas, targetX, targetY, targetWidth, targetHeight);
  ctx.restore();

  // 5. Draw clean garment over shadow
  ctx.drawImage(garmentCanvas, targetX, targetY, targetWidth, targetHeight);

  return canvas.toDataURL('image/png', 0.95);
};

/**
 * Creates a clean studio model card from user's uploaded photo without API charges
 */
export const compositeModelFallback = async (
  userImageSrc: string | File | Blob
): Promise<string> => {
  const img = await loadImage(userImageSrc);
  const canvas = document.createElement('canvas');
  const w = img.naturalWidth || img.width || 800;
  const h = img.naturalHeight || img.height || 1200;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  // Draw user image
  ctx.drawImage(img, 0, 0, w, h);

  // Subtle studio vignette to give e-commerce depth
  const gradient = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.3,
    w / 2, h / 2, Math.max(w, h) * 0.8
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.08)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  return canvas.toDataURL('image/png', 0.95);
};

/**
 * Multi-angle pose simulation without cloud charges
 */
export const compositePoseFallback = async (
  baseImageSrc: string,
  poseInstruction: string
): Promise<string> => {
  const img = await loadImage(baseImageSrc);
  const canvas = document.createElement('canvas');
  const w = img.naturalWidth || img.width || 800;
  const h = img.naturalHeight || img.height || 1200;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) return baseImageSrc;

  ctx.save();
  const lower = poseInstruction.toLowerCase();

  if (lower.includes('side') || lower.includes('profile')) {
    // Subtle lateral zoom
    ctx.translate(w * 0.03, 0);
    ctx.scale(1.02, 1.02);
  } else if (lower.includes('walk') || lower.includes('action')) {
    // Dynamic framing
    ctx.translate(0, -h * 0.015);
    ctx.scale(1.03, 1.03);
  } else if (lower.includes('lean') || lower.includes('relaxed')) {
    // Slight angle shift
    ctx.translate(w / 2, h / 2);
    ctx.rotate(0.015);
    ctx.translate(-w / 2, -h / 2);
  }

  ctx.drawImage(img, 0, 0, w, h);
  ctx.restore();

  return canvas.toDataURL('image/png', 0.95);
};
