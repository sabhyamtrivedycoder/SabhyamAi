/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { SavedLook } from '../types';
import { compareSavedLooksWithAI, LookComparisonResult } from '../services/geminiService';
import { SparklesIcon, CheckIcon } from './icons';
import Spinner from './Spinner';

interface SavedLookComparisonViewProps {
  savedLooks: SavedLook[];
  onSelectLookToWear?: (look: SavedLook) => void;
}

export const SavedLookComparisonView: React.FC<SavedLookComparisonViewProps> = ({
  savedLooks,
  onSelectLookToWear,
}) => {
  // Fallback demo looks if user hasn't saved 2 looks yet
  const fallbackLooks: SavedLook[] = [
    {
      id: 'demo-look-1',
      title: 'Dark Utility Baggy Look',
      date: 'Today',
      previewUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
      baseModelUrl: '',
      poseInstruction: 'Relaxed front model standing in neutral studio',
      layers: [
        {
          garment: {
            id: 'g-1',
            name: 'Baggy Acid-Wash Boxy Tee',
            url: '',
            category: 'baggy',
          },
          poseImages: {},
        },
        {
          garment: {
            id: 'g-2',
            name: 'Baggy Parachute Cargo Pants',
            url: '',
            category: 'baggy',
          },
          poseImages: {},
        },
      ],
    },
    {
      id: 'demo-look-2',
      title: 'Minimalist Clean Street Look',
      date: 'Yesterday',
      previewUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80',
      baseModelUrl: '',
      poseInstruction: 'Side profile standing pose',
      layers: [
        {
          garment: {
            id: 'g-3',
            name: 'Classic Boxy Minimalist Tee',
            url: '',
            category: 'tees',
          },
          poseImages: {},
        },
        {
          garment: {
            id: 'g-4',
            name: 'Wide-Leg Baggy Carpenter Jeans',
            url: '',
            category: 'baggy',
          },
          poseImages: {},
        },
      ],
    },
  ];

  const pool = savedLooks.length >= 2 ? savedLooks : [...savedLooks, ...fallbackLooks].slice(0, 4);

  const [lookAId, setLookAId] = useState<string>(pool[0]?.id || '');
  const [lookBId, setLookBId] = useState<string>(pool[1]?.id || '');
  const [comparison, setComparison] = useState<LookComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const lookA = pool.find((l) => l.id === lookAId) || pool[0];
  const lookB = pool.find((l) => l.id === lookBId) || pool[1];

  const runComparison = async () => {
    if (!lookA || !lookB) return;
    setIsLoading(true);
    try {
      const res = await compareSavedLooksWithAI(lookA, lookB);
      setComparison(res);
    } catch (e) {
      console.warn('Comparison error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (lookA && lookB && lookA.id !== lookB.id) {
      runComparison();
    }
  }, [lookAId, lookBId]);

  return (
    <div className="space-y-6 text-gray-900">
      {/* Header Banner */}
      <div className="p-4 bg-gradient-to-r from-gray-950 via-purple-950 to-gray-900 text-white rounded-2xl border border-purple-800/40 shadow-md flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-pink-300">
            Side-by-Side Wardrobe Comparison
          </span>
          <h4 className="text-base font-serif font-bold text-white mt-0.5">
            Compare Saved Looks
          </h4>
          <p className="text-xs text-purple-200 mt-0.5">
            Select two saved looks to analyze styling, volume, and occasion differences with Gemini.
          </p>
        </div>

        <button
          type="button"
          onClick={runComparison}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/35 border border-pink-400/40 text-pink-200 hover:text-white text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ml-3 disabled:opacity-50"
        >
          <SparklesIcon className="w-3.5 h-3.5 text-pink-300" />
          <span>{isLoading ? 'Analyzing...' : 'Re-Compare'}</span>
        </button>
      </div>

      {/* Selectors and Side-by-Side Visual Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* LOOK A */}
        <div className="p-4 bg-white rounded-2xl border-2 border-purple-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-bold text-[10px] uppercase tracking-wider">
              Look A
            </span>
            <select
              value={lookAId}
              onChange={(e) => setLookAId(e.target.value)}
              className="text-xs font-medium p-1.5 bg-gray-50 border border-gray-300 rounded-lg max-w-[170px] truncate focus:ring-1 focus:ring-purple-500"
            >
              {pool.map((l) => (
                <option key={l.id} value={l.id} disabled={l.id === lookBId}>
                  {l.title}
                </option>
              ))}
            </select>
          </div>

          {lookA && (
            <div className="space-y-2.5">
              <div className="relative aspect-3/4 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-inner">
                <img
                  src={lookA.previewUrl}
                  alt={lookA.title}
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <div>
                <h5 className="font-serif font-bold text-sm text-gray-900 truncate">
                  {lookA.title}
                </h5>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  {lookA.layers
                    .map((l) => l.garment?.name)
                    .filter(Boolean)
                    .join(' · ') || 'Base Minimalist'}
                </p>
              </div>

              {onSelectLookToWear && (
                <button
                  type="button"
                  onClick={() => onSelectLookToWear(lookA)}
                  className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition-all"
                >
                  Load this Look in Studio
                </button>
              )}
            </div>
          )}
        </div>

        {/* LOOK B */}
        <div className="p-4 bg-white rounded-2xl border-2 border-pink-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md bg-pink-100 text-pink-900 font-bold text-[10px] uppercase tracking-wider">
              Look B
            </span>
            <select
              value={lookBId}
              onChange={(e) => setLookBId(e.target.value)}
              className="text-xs font-medium p-1.5 bg-gray-50 border border-gray-300 rounded-lg max-w-[170px] truncate focus:ring-1 focus:ring-pink-500"
            >
              {pool.map((l) => (
                <option key={l.id} value={l.id} disabled={l.id === lookAId}>
                  {l.title}
                </option>
              ))}
            </select>
          </div>

          {lookB && (
            <div className="space-y-2.5">
              <div className="relative aspect-3/4 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-inner">
                <img
                  src={lookB.previewUrl}
                  alt={lookB.title}
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <div>
                <h5 className="font-serif font-bold text-sm text-gray-900 truncate">
                  {lookB.title}
                </h5>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  {lookB.layers
                    .map((l) => l.garment?.name)
                    .filter(Boolean)
                    .join(' · ') || 'Base Minimalist'}
                </p>
              </div>

              {onSelectLookToWear && (
                <button
                  type="button"
                  onClick={() => onSelectLookToWear(lookB)}
                  className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition-all"
                >
                  Load this Look in Studio
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Gemini AI Styling Differences Analysis */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-center bg-gray-50 rounded-2xl border border-gray-200">
          <Spinner />
          <p className="text-sm font-serif text-gray-800 mt-4">
            Gemini is analyzing styling, proportion, and color differences...
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Evaluating volume contrast and occasion versatility.
          </p>
        </div>
      ) : comparison ? (
        <div className="p-5 bg-gradient-to-br from-purple-50/80 via-white to-pink-50/50 rounded-2xl border border-purple-200 space-y-4 shadow-xs">
          {/* Headline */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
              Gemini Styling Contrast Verdict
            </span>
            <h4 className="text-lg font-serif font-bold text-purple-950 mt-0.5">
              {comparison.headline}
            </h4>
          </div>

          {/* Silhouette & Palette Contrast Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-2xs">
              <span className="font-bold text-gray-900 block mb-1">
                📐 Silhouette & Proportions
              </span>
              <p className="text-gray-700 leading-relaxed">
                {comparison.silhouetteContrast}
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-2xs">
              <span className="font-bold text-gray-900 block mb-1">
                🎨 Palette & Visual Weight
              </span>
              <p className="text-gray-700 leading-relaxed">
                {comparison.paletteContrast}
              </p>
            </div>
          </div>

          {/* Occasion Verdict */}
          <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-2xs text-xs">
            <span className="font-bold text-gray-900 block mb-1">
              ✨ Occasion & Setting Match
            </span>
            <p className="text-gray-700 leading-relaxed">
              {comparison.occasionVerdict}
            </p>
          </div>

          {/* Key Differences Bullet List */}
          {comparison.keyDifferences?.length > 0 && (
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-gray-800 block text-[11px] uppercase tracking-wider">
                Key Styling Differences
              </span>
              <ul className="space-y-1.5">
                {comparison.keyDifferences.map((diff, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 p-2 bg-white rounded-lg border border-purple-100 text-gray-700"
                  >
                    <CheckIcon className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <span>{diff}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Stylist Pro Tip */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900">
            <strong className="block mb-0.5">Stylist Rotation Recommendation:</strong>
            <p>{comparison.stylistRecommendation}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SavedLookComparisonView;
