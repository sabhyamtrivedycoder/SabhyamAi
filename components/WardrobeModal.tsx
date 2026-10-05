/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import type { WardrobeItem } from '../types';
import { UploadCloudIcon, CheckCircleIcon, HeartIcon } from './icons';
import { getShoppingUrl } from '../lib/affiliate';

interface WardrobePanelProps {
  onGarmentSelect: (garmentInput: File | string, garmentInfo: WardrobeItem) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
  wardrobe: WardrobeItem[];
  favoriteGarmentIds?: string[];
  onToggleFavoriteGarment?: (id: string) => void;
}

type CategoryFilter = 'all' | 'baggy' | 'tees' | 'bottoms' | 'outerwear' | 'favorites';

const WardrobePanel: React.FC<WardrobePanelProps> = ({
  onGarmentSelect,
  activeGarmentIds,
  isLoading,
  wardrobe,
  favoriteGarmentIds = [],
  onToggleFavoriteGarment,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [openShopItemId, setOpenShopItemId] = useState<string | null>(null);

  const handleGarmentClick = (item: WardrobeItem) => {
    if (isLoading || activeGarmentIds.includes(item.id)) return;
    setError(null);
    onGarmentSelect(item.url, item);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
      }
      const customGarmentInfo: WardrobeItem = {
        id: `custom-${Date.now()}`,
        name: file.name,
        url: URL.createObjectURL(file),
        category: 'tees',
      };
      onGarmentSelect(file, customGarmentInfo);
    }
  };

  const displayedWardrobe = wardrobe.filter((item) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'favorites') return favoriteGarmentIds.includes(item.id);
    return item.category === categoryFilter;
  });

  return (
    <div className="pt-6 border-t border-gray-300/80">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-serif tracking-wider text-gray-800">
            Wardrobe & Styles
          </h2>
          <p className="text-[11px] text-gray-500">
            {displayedWardrobe.length} items in collection · Try on or shop
          </p>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none text-xs font-medium">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            categoryFilter === 'all'
              ? 'bg-gray-900 text-white font-semibold shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter('baggy')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1 ${
            categoryFilter === 'baggy'
              ? 'bg-amber-500 text-white font-semibold shadow-xs'
              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <span>🔥 Baggy & Street</span>
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter('tees')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            categoryFilter === 'tees'
              ? 'bg-gray-900 text-white font-semibold shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tees & Tops
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter('bottoms')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            categoryFilter === 'bottoms'
              ? 'bg-gray-900 text-white font-semibold shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Pants & Cargos
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter('outerwear')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            categoryFilter === 'outerwear'
              ? 'bg-gray-900 text-white font-semibold shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Jackets
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter('favorites')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1 ${
            categoryFilter === 'favorites'
              ? 'bg-red-500 text-white font-semibold shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <HeartIcon filled={categoryFilter === 'favorites'} className="w-3.5 h-3.5" />
          <span>Favorites ({favoriteGarmentIds.length})</span>
        </button>
      </div>

      {/* Garments Grid */}
      <div className="grid grid-cols-3 gap-3">
        {displayedWardrobe.map((item) => {
          const isActive = activeGarmentIds.includes(item.id);
          const isFav = favoriteGarmentIds.includes(item.id);
          const isShopOpen = openShopItemId === item.id;

          return (
            <div
              key={item.id}
              className="relative aspect-square border border-gray-200 rounded-lg overflow-hidden group focus-within:ring-2 focus-within:ring-gray-800"
            >
              <button
                type="button"
                onClick={() => handleGarmentClick(item)}
                disabled={isLoading || isActive}
                className="w-full h-full text-left relative focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label={`Select ${item.name}`}
              >
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                />
                
                {/* Price tag badge */}
                {item.price && (
                  <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-xs rounded text-[10px] font-semibold text-white">
                    {item.price}
                  </div>
                )}

                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-bold text-center p-1 leading-tight">
                    {item.name}
                  </p>
                </div>

                {isActive && (
                  <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center">
                    <CheckCircleIcon className="w-8 h-8 text-white" />
                  </div>
                )}
              </button>

              {/* Bookmark / Favorite Heart Button */}
              {onToggleFavoriteGarment && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavoriteGarment(item.id);
                  }}
                  className={`absolute top-1.5 right-1.5 p-1.5 rounded-full z-10 transition-all ${
                    isFav
                      ? 'bg-white/95 text-red-500 shadow-xs'
                      : 'bg-black/30 hover:bg-white text-white hover:text-red-500 opacity-0 group-hover:opacity-100'
                  }`}
                  title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <HeartIcon filled={isFav} className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Secret Shopping Redirect Button (Amazon / Flipkart / Myntra) */}
              <div className="absolute top-1.5 left-1.5 z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenShopItemId(isShopOpen ? null : item.id);
                  }}
                  className="px-1.5 py-0.5 bg-white/90 hover:bg-white text-gray-800 text-[10px] font-bold rounded shadow-xs opacity-0 group-hover:opacity-100 transition-all"
                  title="Shop this style on Amazon, Flipkart, or Myntra"
                >
                  Shop ▾
                </button>

                {isShopOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-30 animate-fade-in text-left"
                  >
                    <a
                      href={getShoppingUrl(item, 'amazon')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-amber-50 hover:text-amber-900"
                    >
                      Amazon &rarr;
                    </a>
                    <a
                      href={getShoppingUrl(item, 'flipkart')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-900"
                    >
                      Flipkart &rarr;
                    </a>
                    <a
                      href={getShoppingUrl(item, 'myntra')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-pink-50 hover:text-pink-900"
                    >
                      Myntra &rarr;
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Custom Garment Upload Slot */}
        <label
          htmlFor="custom-garment-upload"
          className={`relative aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-500 transition-colors ${
            isLoading
              ? 'cursor-not-allowed bg-gray-100'
              : 'hover:border-gray-400 hover:text-gray-600 cursor-pointer bg-gray-50/50'
          }`}
        >
          <UploadCloudIcon className="w-6 h-6 mb-1" />
          <span className="text-xs font-semibold">Upload</span>
          <input
            id="custom-garment-upload"
            type="file"
            className="hidden"
            accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </label>
      </div>

      {displayedWardrobe.length === 0 && categoryFilter === 'favorites' && (
        <p className="text-center text-xs text-gray-500 mt-4">
          No favorite garments yet. Click the heart on any item to save it here.
        </p>
      )}

      {displayedWardrobe.length === 0 && categoryFilter !== 'favorites' && (
        <p className="text-center text-xs text-gray-500 mt-4">
          No garments found in this category.
        </p>
      )}

      {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
    </div>
  );
};

export default WardrobePanel;