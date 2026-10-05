/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { WardrobeItem } from './types';

export const defaultWardrobe: WardrobeItem[] = [
  // 1. BAGGY & STREETWEAR
  {
    id: 'baggy-acid-wash-tee',
    name: 'Baggy Acid-Wash Boxy Tee',
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    category: 'baggy',
    price: '₹1,299',
    brand: 'StreetLab',
    searchQuery: 'oversized acid wash heavy cotton boxy t shirt',
  },
  {
    id: 'baggy-cargo-parachute',
    name: 'Baggy Parachute Cargo Pants',
    url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80',
    category: 'baggy',
    price: '₹2,199',
    brand: 'TechWave',
    searchQuery: 'baggy parachute cargo pants wide leg streetwear',
  },
  {
    id: 'oversized-drop-hoodie',
    name: 'Oversized Drop-Shoulder Hoodie',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/gemini-sweat-2.png',
    category: 'baggy',
    price: '₹2,499',
    brand: 'Sabhyam Street',
    searchQuery: 'oversized drop shoulder heavyweight hoodie',
  },
  {
    id: 'baggy-carpenter-denim',
    name: 'Wide-Leg Baggy Carpenter Jeans',
    url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80',
    category: 'baggy',
    price: '₹2,799',
    brand: 'DenimCo',
    searchQuery: 'baggy wide leg carpenter denim jeans streetwear',
  },
  {
    id: 'cyberpunk-oversized-tee',
    name: 'Baggy Cyber Graphic Street Tee',
    url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80',
    category: 'baggy',
    price: '₹1,499',
    brand: 'NeoTokyo',
    searchQuery: 'baggy graphic printed aesthetic oversized t-shirt',
  },

  // 2. TEES & TOPS
  {
    id: 'gemini-tee-clean',
    name: 'Classic Boxy Minimalist Tee',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/refs/heads/main/Gemini-tee.png',
    category: 'tees',
    price: '₹999',
    brand: 'Sabhyam Basics',
    searchQuery: 'boxy crewneck plain solid cotton t shirt',
  },
  {
    id: 'vintage-band-tee',
    name: 'Vintage Distressed Rock Tee',
    url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80',
    category: 'tees',
    price: '₹1,199',
    brand: 'RetroSound',
    searchQuery: 'vintage washed rock band graphic oversized tee',
  },
  {
    id: 'striped-boxy-skate-tee',
    name: 'Striped Boxy Skate Tee',
    url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80',
    category: 'tees',
    price: '₹1,399',
    brand: 'SkateClub',
    searchQuery: 'horizontal striped oversized skater t shirt',
  },
  {
    id: 'oversized-heavy-linen-shirt',
    name: 'Relaxed Linen Camp Collar Shirt',
    url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80',
    category: 'tees',
    price: '₹1,899',
    brand: 'BreezeStudio',
    searchQuery: 'relaxed fit cuban collar linen shirt men women',
  },

  // 3. BOTTOMS & CARGOS
  {
    id: 'pleated-wide-trousers',
    name: 'Wide-Leg Pleated Trousers',
    url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&auto=format&fit=crop&q=80',
    category: 'bottoms',
    price: '₹2,699',
    brand: 'Sartorial Edge',
    searchQuery: 'wide leg relaxed pleated dress trousers streetwear',
  },
  {
    id: 'tactical-multi-pocket-cargo',
    name: 'Tactical Multi-Pocket Cargo',
    url: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=600&auto=format&fit=crop&q=80',
    category: 'bottoms',
    price: '₹2,399',
    brand: 'SpecOps Wear',
    searchQuery: 'tactical techwear cargo pants relaxed fit',
  },
  {
    id: 'baggy-relaxed-sweatpants',
    name: 'Baggy Heavy Fleece Joggers',
    url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&auto=format&fit=crop&q=80',
    category: 'bottoms',
    price: '₹1,799',
    brand: 'CloudComfort',
    searchQuery: 'baggy wide leg fleece sweatpants track pants',
  },

  // 4. OUTERWEAR & JACKETS
  {
    id: 'oversized-leather-biker',
    name: 'Oversized Leather Biker Jacket',
    url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
    category: 'outerwear',
    price: '₹4,999',
    brand: 'RebelRider',
    searchQuery: 'oversized faux leather moto biker jacket',
  },
  {
    id: 'vintage-bomber-jacket',
    name: 'Vintage Varsity Bomber Jacket',
    url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&auto=format&fit=crop&q=80',
    category: 'outerwear',
    price: '₹3,499',
    brand: 'Letterman Club',
    searchQuery: 'vintage oversized varsity bomber jacket streetwear',
  },
  {
    id: 'boxy-denim-trucker',
    name: 'Boxy Washed Denim Jacket',
    url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80',
    category: 'outerwear',
    price: '₹3,199',
    brand: 'Heritage Indigo',
    searchQuery: 'boxy fit distressed washed blue denim jacket',
  },
];

export { suggestGarmentsMatchingSavedLook, type WardrobeSimilarityMatch } from './lib/wardrobeSimilarity';