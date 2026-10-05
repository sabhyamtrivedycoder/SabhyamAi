/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { SizeRecommendation } from '../lib/fitCalculator';

interface VisualSizeComparisonProps {
  recommendation: SizeRecommendation;
  onSelectPreference?: (pref: 'tailored' | 'signature' | 'extreme') => void;
}

export const VisualSizeComparison: React.FC<VisualSizeComparisonProps> = ({
  recommendation,
  onSelectPreference,
}) => {
  const [comparedOption, setComparedOption] = useState<'down' | 'up'>('up');

  const {
    recommendedSize,
    fitStyle,
    alternativeSizes,
    garmentCategory,
    garmentName,
    shoulderDropInches,
    chestEaseInches,
  } = recommendation;

  const isBottom =
    garmentCategory === 'bottoms' ||
    garmentName.toLowerCase().includes('cargo') ||
    garmentName.toLowerCase().includes('jean') ||
    garmentName.toLowerCase().includes('pant');

  const downSize = alternativeSizes.sizeDown.size;
  const upSize = alternativeSizes.sizeUp.size;

  // Scale factors for visual representation
  const currentScale = 1.0;
  const targetScale = comparedOption === 'down' ? 0.91 : 1.12;

  // Silhouette comparison analysis texts
  const changeSummary =
    comparedOption === 'down'
      ? isBottom
        ? `Downsizing to ${downSize} narrows the thigh circumference by ~1.5" and shortens the inseam, producing a clean single-break over your sneakers with minimal puddle stack.`
        : `Downsizing to ${downSize} lifts the hem ~1.2" higher toward the beltline and reduces chest ease to +${Math.max(2, chestEaseInches - 3)}", creating a structured, tidy boxy crop with closer shoulder seams.`
      : isBottom
      ? `Upsizing to ${upSize} widens the balloon leg taper by +2.0", creating authentic Tokyo skater stack volume that pools heavily over chunky sneakers and skate shoes.`
      : `Upsizing to ${upSize} extends the shoulder drop to +${(shoulderDropInches + 0.8).toFixed(1)}" past your collarbone, letting sleeve cuffs stack at the knuckles and giving you a breezy, hyper-oversized drape.`;

  return (
    <div className="p-4 bg-gray-900 text-white rounded-2xl border border-gray-800 shadow-lg space-y-4">
      {/* Header with Switcher Tabs */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
            Interactive Silhouette Comparison
          </span>
          <h5 className="text-sm font-bold text-white">
            Current: Size {recommendedSize} vs. Alternatives
          </h5>
        </div>

        <div className="flex items-center bg-gray-800 p-0.5 rounded-lg border border-gray-700 text-xs">
          <button
            type="button"
            onClick={() => setComparedOption('down')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              comparedOption === 'down'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Size Down ({downSize})
          </button>
          <button
            type="button"
            onClick={() => setComparedOption('up')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              comparedOption === 'up'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Size Up ({upSize})
          </button>
        </div>
      </div>

      {/* Visual Wireframe Comparison Canvas */}
      <div className="relative bg-gray-950 rounded-xl p-3 border border-gray-800 flex items-center justify-center overflow-hidden">
        {/* Comparison Legend */}
        <div className="absolute top-2.5 left-3 flex flex-col gap-1 text-[10px]">
          <span className="flex items-center gap-1.5 text-gray-300 font-mono">
            <span className="w-3 h-0.5 bg-gray-400 inline-block" /> Current: Size {recommendedSize}
          </span>
          <span className="flex items-center gap-1.5 text-pink-400 font-mono font-bold">
            <span className="w-3 h-0.5 bg-pink-500 border-b border-dashed border-pink-400 inline-block" />
            {comparedOption === 'down' ? `Smaller: Size ${downSize}` : `Larger: Size ${upSize}`}
          </span>
        </div>

        {/* SVG Comparative Silhouette */}
        <svg viewBox="0 0 200 160" className="w-48 h-40 select-none">
          {/* Baseline Neutral Grid */}
          <line x1="100" y1="10" x2="100" y2="150" stroke="#27272a" strokeDasharray="2 3" strokeWidth="0.8" />
          <line x1="20" y1="40" x2="180" y2="40" stroke="#27272a" strokeDasharray="2 3" strokeWidth="0.8" />
          <line x1="20" y1="110" x2="180" y2="110" stroke="#27272a" strokeDasharray="2 3" strokeWidth="0.8" />

          {/* Current Size Wireframe (Solid Gray/Purple) */}
          <g opacity="0.6">
            <path
              d={`
                M 92 20
                Q 100 24 108 20
                L ${100 + 46 * currentScale} 32
                L ${100 + 42 * currentScale} 70
                L ${100 + 36 * currentScale} 65
                L ${100 + 34 * currentScale} 105
                L ${100 - 34 * currentScale} 105
                L ${100 - 36 * currentScale} 65
                L ${100 - 42 * currentScale} 70
                L ${100 - 46 * currentScale} 32
                Z
              `}
              fill="none"
              stroke="#a1a1aa"
              strokeWidth="1.5"
            />
          </g>

          {/* Target Comparison Size Wireframe (Animated Pink/Neon) */}
          <g>
            <path
              d={`
                M 92 20
                Q 100 24 108 20
                L ${100 + 46 * targetScale} ${32 + (targetScale - 1) * 6}
                L ${100 + 42 * targetScale} ${70 * targetScale}
                L ${100 + 36 * targetScale} ${65 * targetScale}
                L ${100 + 34 * targetScale} ${105 * targetScale}
                L ${100 - 34 * targetScale} ${105 * targetScale}
                L ${100 - 36 * targetScale} ${65 * targetScale}
                L ${100 - 42 * targetScale} ${70 * targetScale}
                L ${100 - 46 * targetScale} ${32 + (targetScale - 1) * 6}
                Z
              `}
              fill="none"
              stroke="#ec4899"
              strokeWidth="2"
              strokeDasharray={comparedOption === 'down' ? '3 2' : '0'}
            />

            {/* Differential Callout Indicators */}
            {comparedOption === 'up' ? (
              <>
                <line x1={100 + 46 * currentScale} y1="32" x2={100 + 46 * targetScale} y2="32" stroke="#f43f5e" strokeWidth="1.5" />
                <text x="160" y="28" fill="#fb7185" fontSize="7" fontFamily="monospace">
                  +0.8&quot; Drop
                </text>
                <line x1="50" y1="112" x2="150" y2="112" stroke="#fbbf24" strokeWidth="1" strokeDasharray="2 2" />
                <text x="100" y="122" fill="#fbbf24" fontSize="7" textAnchor="middle">
                  +1.5&quot; Longer Hem
                </text>
              </>
            ) : (
              <>
                <line x1={100 + 46 * currentScale} y1="32" x2={100 + 46 * targetScale} y2="32" stroke="#c084fc" strokeWidth="1.5" />
                <text x="156" y="28" fill="#c084fc" fontSize="7" fontFamily="monospace">
                  -0.7&quot; Shorter
                </text>
                <line x1="55" y1="96" x2="145" y2="96" stroke="#fbbf24" strokeWidth="1" strokeDasharray="2 2" />
                <text x="100" y="93" fill="#fbbf24" fontSize="7" textAnchor="middle">
                  -1.2&quot; Cropped Hem
                </text>
              </>
            )}
          </g>
        </svg>

        {/* Delta Badges */}
        <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5 text-[10px]">
          <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 font-mono border border-gray-700">
            {comparedOption === 'down' ? 'Chest: -2.5"' : 'Chest: +3.0"'}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 font-mono border border-pink-500/30">
            {comparedOption === 'down' ? 'Hem: -1.2"' : 'Hem: +1.5"'}
          </span>
        </div>
      </div>

      {/* Brief Text Summary of Silhouette Change */}
      <div className="p-3 bg-gray-950/80 rounded-xl border border-gray-800 text-xs">
        <p className="text-gray-200 leading-relaxed">
          <strong className="text-pink-300 font-semibold block mb-0.5">
            {comparedOption === 'down'
              ? `Switching to Size ${downSize} (${alternativeSizes.sizeDown.label}):`
              : `Switching to Size ${upSize} (${alternativeSizes.sizeUp.label}):`}
          </strong>
          {changeSummary}
        </p>
      </div>

      {/* Action to switch size */}
      {onSelectPreference && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() =>
              onSelectPreference(comparedOption === 'down' ? 'tailored' : 'extreme')
            }
            className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/20 transition-all active:scale-95"
          >
            {comparedOption === 'down'
              ? `Select Size ${downSize} (Tidy Boxy)`
              : `Select Size ${upSize} (Hyper Skate)`}
          </button>
        </div>
      )}
    </div>
  );
};

export default VisualSizeComparison;
