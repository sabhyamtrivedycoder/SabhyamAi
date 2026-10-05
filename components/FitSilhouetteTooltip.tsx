/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { SizeRecommendation } from '../lib/fitCalculator';
import { XIcon, SparklesIcon } from './icons';

interface FitSilhouetteTooltipProps {
  recommendation: SizeRecommendation;
  isOpen: boolean;
  onClose: () => void;
}

export const FitSilhouetteTooltip: React.FC<FitSilhouetteTooltipProps> = ({
  recommendation,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const {
    recommendedSize,
    fitStyle,
    garmentName,
    shoulderDropInches,
    chestEaseInches,
    lengthDescription,
    userStats,
  } = recommendation;

  const isBottom =
    recommendation.garmentCategory === 'bottoms' ||
    garmentName.toLowerCase().includes('cargo') ||
    garmentName.toLowerCase().includes('jean') ||
    garmentName.toLowerCase().includes('pant');

  // Multiplier for graphic scale based on size (XS=0.85 to XXL=1.2)
  const sizeScaleMap: Record<string, number> = {
    XS: 0.88,
    S: 0.94,
    M: 1.0,
    L: 1.08,
    XL: 1.15,
    XXL: 1.22,
  };
  const scale = sizeScaleMap[recommendedSize] || 1.0;

  // Garment outline coordinates calculated dynamically
  const shoulderWidth = 60 * scale;
  const torsoWidth = 46 * scale;
  const hemY = isBottom ? 220 : 138 * scale;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-gray-950 text-white rounded-2xl border border-purple-500/40 shadow-2xl p-5 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
            <h4 className="text-sm font-serif font-bold text-white tracking-wide uppercase">
              Baggy Silhouette Drape Blueprint
            </h4>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close Silhouette View"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Main Visual Blueprint */}
        <div className="relative bg-gray-900/90 rounded-xl p-4 border border-white/10 flex items-center justify-center">
          {/* Legend badge */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 text-[10px]">
            <span className="flex items-center gap-1.5 text-gray-300 font-mono">
              <span className="w-2.5 h-0.5 bg-gray-500 inline-block" /> Body Contour
            </span>
            <span className="flex items-center gap-1.5 text-pink-400 font-mono font-semibold">
              <span className="w-2.5 h-0.5 bg-pink-500 inline-block" /> Size {recommendedSize} Drape
            </span>
          </div>

          <div className="absolute top-3 right-3 text-right">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
              {fitStyle}
            </span>
          </div>

          {/* SVG Anatomical Drape Diagram */}
          <svg viewBox="0 0 240 280" className="w-56 h-64 select-none">
            <defs>
              <linearGradient id="silhouetteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.25" />
              </linearGradient>
            </defs>

            {/* Grid background lines */}
            <line x1="20" y1="70" x2="220" y2="70" stroke="#374151" strokeDasharray="3 3" strokeWidth="0.8" />
            <line x1="20" y1="130" x2="220" y2="130" stroke="#374151" strokeDasharray="3 3" strokeWidth="0.8" />
            <line x1="20" y1="190" x2="220" y2="190" stroke="#374151" strokeDasharray="3 3" strokeWidth="0.8" />
            <line x1="120" y1="10" x2="120" y2="270" stroke="#374151" strokeDasharray="2 4" strokeWidth="0.8" />

            {/* Base Body Contour (Neutral Gray) */}
            {/* Head */}
            <circle cx="120" cy="30" r="14" fill="#374151" />
            {/* Neck */}
            <rect x="115" y="42" width="10" height="12" fill="#374151" />
            {/* Natural Shoulders */}
            <path
              d="M 115 54 L 84 62 L 74 130 L 84 130 L 92 85 L 94 140 L 146 140 L 148 85 L 156 130 L 166 130 L 156 62 Z"
              fill="#1f2937"
              stroke="#4b5563"
              strokeWidth="1.2"
            />
            {/* Natural Legs */}
            <path
              d="M 94 140 L 96 240 L 114 240 L 118 165 L 122 165 L 126 240 L 144 240 L 146 140 Z"
              fill="#1f2937"
              stroke="#4b5563"
              strokeWidth="1.2"
            />

            {/* Overlay Garment Drape based on calculation */}
            {!isBottom ? (
              /* Top Drape Outline */
              <g>
                {/* Dropped Shoulders & Relaxed Torso Box */}
                <path
                  d={`
                    M 112 52
                    Q 120 58 128 52
                    L ${120 + shoulderWidth} ${62 + (scale - 1) * 8}
                    L ${120 + shoulderWidth - 4} ${110 * scale}
                    L ${120 + torsoWidth + 6} ${102 * scale}
                    L ${120 + torsoWidth} ${hemY}
                    L ${120 - torsoWidth} ${hemY}
                    L ${120 - torsoWidth - 6} ${102 * scale}
                    L ${120 - shoulderWidth + 4} ${110 * scale}
                    L ${120 - shoulderWidth} ${62 + (scale - 1) * 8}
                    Z
                  `}
                  fill="url(#silhouetteGrad)"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeDasharray="0"
                />

                {/* Shoulder Drop Indicator Arrow */}
                <line x1="145" y1="52" x2={120 + shoulderWidth} y2="52" stroke="#ec4899" strokeWidth="1.5" />
                <line x1={120 + shoulderWidth} y1="48" x2={120 + shoulderWidth} y2="60" stroke="#ec4899" strokeWidth="1.5" />
                <text x="178" y="48" fill="#f472b6" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  +{shoulderDropInches}&quot; Drop
                </text>

                {/* Chest Ease Indicator */}
                <line x1="56" y1="92" x2="88" y2="92" stroke="#a855f7" strokeWidth="1.5" />
                <text x="44" y="94" fill="#c084fc" fontSize="8" fontFamily="monospace" textAnchor="end">
                  +{chestEaseInches}&quot; Ease
                </text>

                {/* Hemline Marker */}
                <line x1="40" y1={hemY} x2="200" y2={hemY} stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 2" />
                <text x="204" y={hemY + 3} fill="#fbbf24" fontSize="8" fontFamily="sans-serif">
                  Hemline
                </text>
              </g>
            ) : (
              /* Bottom / Cargo / Denim Drape Outline */
              <g>
                <path
                  d={`
                    M 90 134
                    L 150 134
                    L 156 180
                    L 152 248
                    L 125 248
                    L 122 170
                    L 118 170
                    L 115 248
                    L 88 248
                    L 84 180
                    Z
                  `}
                  fill="url(#silhouetteGrad)"
                  stroke="#f43f5e"
                  strokeWidth="2"
                />
                {/* Ankle Stack Break Marker */}
                <line x1="75" y1="248" x2="165" y2="248" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 2" />
                <text x="170" y="250" fill="#fbbf24" fontSize="8" fontFamily="sans-serif">
                  Sneaker Stack
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Breakdown Explanations */}
        <div className="mt-4 space-y-2 text-xs">
          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 flex items-start justify-between">
            <div>
              <p className="text-gray-300 font-medium">Acromion Drop Seam</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Extended {shoulderDropInches}&quot; past shoulder point to soften the upper frame.
              </p>
            </div>
            <span className="text-pink-400 font-mono font-bold text-xs shrink-0 pl-2">
              +{shoulderDropInches}&quot;
            </span>
          </div>

          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 flex items-start justify-between">
            <div>
              <p className="text-gray-300 font-medium">Torso Ease & Drape</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                +{chestEaseInches}&quot; body clearance creates straight vertical drape without fabric cling.
              </p>
            </div>
            <span className="text-purple-400 font-mono font-bold text-xs shrink-0 pl-2">
              +{chestEaseInches}&quot;
            </span>
          </div>

          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 flex items-start justify-between">
            <div>
              <p className="text-gray-300 font-medium">Length Calibration</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {lengthDescription} designed for {userStats.heightFormatted} height.
              </p>
            </div>
            <span className="text-amber-300 font-mono text-[11px] font-semibold shrink-0 pl-2">
              Balanced
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white text-gray-950 font-bold rounded-lg text-xs hover:bg-gray-100 transition-colors"
          >
            Close Blueprint
          </button>
        </div>
      </div>
    </div>
  );
};

export default FitSilhouetteTooltip;
