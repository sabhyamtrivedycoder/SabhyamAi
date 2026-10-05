/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { SavedLook, WardrobeItem } from '../types';

export interface WardrobeSimilarityMatch {
  item: WardrobeItem;
  similarityScore: number; // 0 - 100%
  matchReason: string;
  aestheticCategory: string;
}

interface ImageColorProfile {
  r: number;
  g: number;
  b: number;
  luminance: number;
  warmth: number; // -1 (cool) to +1 (warm)
  saturation: number;
}

/**
 * Extracts average color and stylistic profile from an image URL using canvas
 */
const extractColorProfile = async (imageUrl: string): Promise<ImageColorProfile> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ r: 128, g: 128, b: 128, luminance: 128, warmth: 0, saturation: 0.1 });
          return;
        }

        ctx.drawImage(img, 0, 0, 32, 32);
        const data = ctx.getImageData(0, 0, 32, 32).data;

        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 4) {
          // Ignore near white background borders
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (r > 240 && g > 240 && b > 240) continue;

          totalR += r;
          totalG += g;
          totalB += b;
          count++;
        }

        if (count === 0) count = 1;
        const avgR = totalR / count;
        const avgG = totalG / count;
        const avgB = totalB / count;
        const luminance = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
        const warmth = (avgR - avgB) / 255;
        const max = Math.max(avgR, avgG, avgB);
        const min = Math.min(avgR, avgG, avgB);
        const saturation = max === 0 ? 0 : (max - min) / max;

        resolve({ r: avgR, g: avgG, b: avgB, luminance, warmth, saturation });
      } catch {
        resolve({ r: 128, g: 128, b: 128, luminance: 128, warmth: 0, saturation: 0.1 });
      }
    };
    img.onerror = () => {
      resolve({ r: 128, g: 128, b: 128, luminance: 128, warmth: 0, saturation: 0.1 });
    };
    img.src = imageUrl;
  });
};

/**
 * Calculates aesthetic similarity between a favorited SavedLook and all wardrobe items.
 * Uses image color histogram & luminance profiles combined with category aesthetic affinity.
 */
export const suggestGarmentsMatchingSavedLook = async (
  favoritedLook: SavedLook,
  wardrobe: WardrobeItem[],
  maxSuggestions: number = 6
): Promise<WardrobeSimilarityMatch[]> => {
  if (!favoritedLook || !wardrobe || wardrobe.length === 0) return [];

  const lookImageUrl = favoritedLook.previewUrl || favoritedLook.baseModelUrl;
  const lookProfile = await extractColorProfile(lookImageUrl);

  // Garment names in the look
  const existingGarmentIds = new Set(
    favoritedLook.layers
      .map((l) => l.garment?.id)
      .filter(Boolean) as string[]
  );

  const lookTitleLower = (favoritedLook.title || '').toLowerCase();
  const isDarkAesthetic = lookProfile.luminance < 110;
  const isMinimalNeutral = lookProfile.saturation < 0.25;

  const scoredItems = await Promise.all(
    wardrobe.map(async (item) => {
      // Don't suggest the exact same item already worn in this look
      if (existingGarmentIds.has(item.id)) {
        return null;
      }

      const itemProfile = await extractColorProfile(item.url);

      // Color distance (Euclidean in RGB space, normalized to 0 - 1)
      const colorDist = Math.sqrt(
        (lookProfile.r - itemProfile.r) ** 2 +
        (lookProfile.g - itemProfile.g) ** 2 +
        (lookProfile.b - itemProfile.b) ** 2
      ) / 441.67; // max distance sqrt(255^2 * 3)

      let score = (1 - colorDist) * 60; // 0 - 60 points from visual palette

      // Warmth & Luminance affinity
      const warmthDiff = Math.abs(lookProfile.warmth - itemProfile.warmth);
      score += Math.max(0, (1 - warmthDiff) * 15);

      const lumDiff = Math.abs(lookProfile.luminance - itemProfile.luminance) / 255;
      score += Math.max(0, (1 - lumDiff) * 15);

      // Category and Streetwear affinity bonus
      const itemNameLower = item.name.toLowerCase();
      const itemCategory = item.category || 'baggy';

      let reason = 'Harmonious color palette and tonal contrast';
      let aesthetic = 'Modern Streetwear';

      if (itemCategory === 'baggy' || itemNameLower.includes('oversized') || itemNameLower.includes('parachute') || itemNameLower.includes('boxy')) {
        score += 10;
        reason = 'Matching oversized drop-shoulder silhouette and tonal mood';
        aesthetic = 'Urban Baggy';
      }

      if (isDarkAesthetic && (itemNameLower.includes('acid') || itemNameLower.includes('black') || itemNameLower.includes('charcoal') || itemProfile.luminance < 110)) {
        score += 8;
        reason = 'Deep moody tones matching your favorited look palette';
        aesthetic = 'Dark Minimalist';
      } else if (isMinimalNeutral && itemProfile.saturation < 0.3) {
        score += 6;
        reason = 'Clean desaturated palette complementing the quiet luxury aesthetic';
        aesthetic = 'Contemporary Neutral';
      }

      const finalScore = Math.min(99, Math.max(55, Math.round(score)));

      return {
        item,
        similarityScore: finalScore,
        matchReason: reason,
        aestheticCategory: aesthetic,
      };
    })
  );

  const filtered = scoredItems.filter(Boolean) as WardrobeSimilarityMatch[];
  filtered.sort((a, b) => b.similarityScore - a.similarityScore);

  return filtered.slice(0, maxSuggestions);
};
