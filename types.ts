/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface WardrobeItem {
  id: string;
  name: string;
  url: string;
  category?: 'baggy' | 'tees' | 'bottoms' | 'outerwear' | 'streetwear';
  price?: string;
  brand?: string;
  searchQuery?: string;
  customAffiliateUrl?: string;
  isFavorite?: boolean;
}

export interface OutfitLayer {
  garment: WardrobeItem | null; // null represents the base model layer
  poseImages: Record<string, string>; // Maps pose instruction to image URL
}

export interface UserMeasurements {
  height: string; // e.g. "5'9" (175 cm)"
  weight: string; // e.g. "155 lbs (70 kg)"
  bodyType: 'Slim' | 'Athletic' | 'Average' | 'Curvy' | 'Plus';
  gender: "Women's" | "Men's" | 'Unisex';
  styleVibe?: string; // e.g. "Streetwear", "Minimalist", "Business Casual"
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  measurements: UserMeasurements;
  savedLooks: SavedLook[];
  favoriteGarmentIds: string[];
  createdAt: string;
}

export interface SavedLook {
  id: string;
  title: string;
  date: string;
  previewUrl: string;
  baseModelUrl: string;
  layers: OutfitLayer[];
  poseInstruction: string;
  measurements?: UserMeasurements;
  aiNotes?: string;
}

export interface AIStyleAdvice {
  headline: string;
  fitAssessment: string;
  colorScore: number; // 0 - 100
  occasionSuggestions: string[];
  stylingTips: string[];
}
