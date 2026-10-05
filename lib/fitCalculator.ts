/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { UserMeasurements, WardrobeItem } from '../types';

export interface SizeRecommendation {
  recommendedSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  fitStyle: 'Structured Relaxed' | 'Signature Baggy' | 'Hyper Oversized';
  garmentName: string;
  garmentCategory: string;
  userStats: {
    heightFormatted: string;
    weightFormatted: string;
    build: string;
  };
  chestEaseInches: number;
  shoulderDropInches: number;
  lengthDescription: string;
  fitImpact: {
    summary: string;
    shoulders: string;
    torsoAndDrape: string;
    lengthAndProportions: string;
    stylingTip: string;
  };
  alternativeSizes: {
    sizeDown: {
      size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
      label: string;
      effect: string;
    };
    sizeUp: {
      size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
      label: string;
      effect: string;
    };
  };
}

// Helper to extract height in inches or cm
export const parseHeightToCm = (heightStr: string): number => {
  if (!heightStr) return 175;
  // Match cm
  const cmMatch = heightStr.match(/(\d+)\s*cm/i);
  if (cmMatch) return parseInt(cmMatch[1], 10);

  // Match feet and inches e.g. 5'10" or 5ft 10in
  const ftInMatch = heightStr.match(/(\d+)['’ft\s]+(\d+)?/i);
  if (ftInMatch) {
    const feet = parseInt(ftInMatch[1], 10);
    const inches = ftInMatch[2] ? parseInt(ftInMatch[2], 10) : 0;
    return Math.round((feet * 12 + inches) * 2.54);
  }

  const numOnly = parseInt(heightStr, 10);
  if (!isNaN(numOnly)) {
    return numOnly > 100 ? numOnly : Math.round(numOnly * 2.54);
  }

  return 175; // default 5'9"
};

// Helper to extract weight in kg
export const parseWeightToKg = (weightStr: string): number => {
  if (!weightStr) return 70;
  // Match kg
  const kgMatch = weightStr.match(/(\d+)\s*kg/i);
  if (kgMatch) return parseInt(kgMatch[1], 10);

  // Match lbs
  const lbsMatch = weightStr.match(/(\d+)\s*lbs?/i);
  if (lbsMatch) return Math.round(parseInt(lbsMatch[1], 10) * 0.453592);

  const numOnly = parseInt(weightStr, 10);
  if (!isNaN(numOnly)) {
    return numOnly < 120 ? numOnly : Math.round(numOnly * 0.453592);
  }

  return 70; // default 154 lbs
};

const SIZES: Array<'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'> = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/**
 * Calculates optimal sizing for baggy / oversized items based on user biometric proportions
 */
export const calculateBaggyFit = (
  heightInput: string,
  weightInput: string,
  build: 'Slim' | 'Athletic' | 'Average' | 'Curvy' | 'Plus',
  garment?: WardrobeItem | null,
  fitPreference: 'tailored' | 'signature' | 'extreme' = 'signature'
): SizeRecommendation => {
  const heightCm = parseHeightToCm(heightInput);
  const weightKg = parseWeightToKg(weightInput);

  // Height in feet/inches display
  const totalInches = Math.round(heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  const heightFormatted = `${feet}'${inches}" (${heightCm} cm)`;
  const weightLbs = Math.round(weightKg * 2.20462);
  const weightFormatted = `${weightLbs} lbs (${weightKg} kg)`;

  // Baseline sizing calculation using BMI & Build weighting
  let baseIndex = 2; // Default 'M' (0=XS, 1=S, 2=M, 3=L, 4=XL, 5=XXL)

  // Height brackets
  if (heightCm < 162) baseIndex = 0; // XS/S
  else if (heightCm < 172) baseIndex = 1; // S
  else if (heightCm < 182) baseIndex = 2; // M
  else if (heightCm < 190) baseIndex = 3; // L
  else baseIndex = 4; // XL

  // Weight / BMI modifier
  const bmi = weightKg / ((heightCm / 100) ** 2);
  if (bmi > 28) baseIndex += 1;
  else if (bmi < 19.5 && baseIndex > 0) baseIndex -= 1;

  // Build modifier
  if (build === 'Plus') baseIndex += 1;
  else if (build === 'Athletic' && baseIndex < 4) {
    // Broad shoulders/lats need room in boxy cuts
    baseIndex += 1;
  } else if (build === 'Slim' && baseIndex > 0 && fitPreference === 'tailored') {
    baseIndex -= 1;
  }

  // Preference adjustment
  if (fitPreference === 'tailored') {
    baseIndex = Math.max(0, baseIndex - 1);
  } else if (fitPreference === 'extreme') {
    baseIndex = Math.min(5, baseIndex + 1);
  }

  // Clamp within bounds
  baseIndex = Math.max(0, Math.min(5, baseIndex));
  const recommendedSize = SIZES[baseIndex];

  const sizeDown = SIZES[Math.max(0, baseIndex - 1)];
  const sizeUp = SIZES[Math.min(5, baseIndex + 1)];

  const garmentName = garment?.name || 'Baggy Streetwear Staple';
  const garmentCategory = garment?.category || 'baggy';

  const isBottom =
    garmentCategory === 'bottoms' ||
    garmentName.toLowerCase().includes('cargo') ||
    garmentName.toLowerCase().includes('jean') ||
    garmentName.toLowerCase().includes('pant');

  // Fit physics metrics
  const shoulderDrop = baseIndex * 0.7 + 1.8; // 1.8 to 4.5 inches
  const chestEase = baseIndex * 1.5 + 4.5; // 4.5 to 11 inches of relaxed ease

  let summary = '';
  let shoulders = '';
  let torsoAndDrape = '';
  let lengthAndProportions = '';
  let stylingTip = '';

  if (isBottom) {
    summary = `Size ${recommendedSize} delivers effortless street drape with an adjustable cinched waist and relaxed knee volume.`;
    shoulders = `Waistband engineered with comfortable ease; designed to sit comfortably mid-rise without restrictive tension.`;
    torsoAndDrape = `Features wide balloon/pleat taper from thigh to knee, ensuring authentic streetwear silhouette without pooling into excess fabric.`;
    lengthAndProportions = `Inseam allows a clean double-break over chunky sneakers or skate shoes, keeping hemlines off the ground.`;
    stylingTip = `Pair with a cropped boxy tee or fitted top to balance the voluminous lower proportions.`;
  } else {
    summary = `Size ${recommendedSize} achieves the authentic oversized drop-shoulder cut without overwhelming your ${build.toLowerCase()} frame.`;
    shoulders = `Shoulder seams drop approximately ${shoulderDrop.toFixed(1)}" past your collarbone, creating a relaxed, non-constrictive upper silhouette.`;
    torsoAndDrape = `Offers ~${chestEase.toFixed(1)}" of chest ease, allowing the heavyweight fabric to drape straight down rather than cling to curves or muscle.`;
    lengthAndProportions = `Hemline rests right at mid-fly, creating the trending modern boxy proportion that elongates your leg line.`;
    stylingTip = `Layer with a slim contrasting base tee or tuck the front hem slightly to showcase belt hardware.`;
  }

  return {
    recommendedSize,
    fitStyle:
      fitPreference === 'tailored'
        ? 'Structured Relaxed'
        : fitPreference === 'extreme'
        ? 'Hyper Oversized'
        : 'Signature Baggy',
    garmentName,
    garmentCategory,
    userStats: {
      heightFormatted,
      weightFormatted,
      build,
    },
    chestEaseInches: Math.round(chestEase),
    shoulderDropInches: Math.round(shoulderDrop * 10) / 10,
    lengthDescription: isBottom ? 'Clean Sneaker Break' : 'Upper Hip Boxy Crop',
    fitImpact: {
      summary,
      shoulders,
      torsoAndDrape,
      lengthAndProportions,
      stylingTip,
    },
    alternativeSizes: {
      sizeDown: {
        size: sizeDown,
        label: 'Tidy Boxy',
        effect: isBottom
          ? 'Sharper straight-leg drape with less stack volume at the hem.'
          : 'Shorter sleeve cuffs and closer torso drape with subtle boxiness.',
      },
      sizeUp: {
        size: sizeUp,
        label: 'Maximum Skate',
        effect: isBottom
          ? 'Heavy fabric pooling over sneakers with wide Japanese street volume.'
          : 'Deep drop shoulders, knuckle-length sleeves, and breezy tunic-like drape.',
      },
    },
  };
};
