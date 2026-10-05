/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { OutfitLayer } from '../types';
import { Trash2Icon, Undo2Icon, Redo2Icon, Share2Icon, CheckIcon } from './icons';

interface OutfitStackProps {
  outfitHistory: OutfitLayer[];
  currentOutfitIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSelectLayer: (index: number) => void;
  onRemoveLastGarment: () => void;
  isLoading?: boolean;
  onOpenShare?: () => void;
}

const OutfitStack: React.FC<OutfitStackProps> = ({
  outfitHistory,
  currentOutfitIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSelectLayer,
  onRemoveLastGarment,
  isLoading = false,
  onOpenShare,
}) => {
  const activeGarmentsCount = currentOutfitIndex; // index 0 is base model

  return (
    <div className="flex flex-col">
      {/* Header with Title and explicit Undo / Redo controls */}
      <div className="flex items-center justify-between border-b border-gray-300/80 pb-3 mb-3">
        <div>
          <h2 className="text-xl font-serif tracking-wider text-gray-800">
            Outfit Stack
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {activeGarmentsCount === 0
              ? 'Base model active'
              : `${activeGarmentsCount} garment${activeGarmentsCount > 1 ? 's' : ''} applied · Step ${currentOutfitIndex + 1} of ${outfitHistory.length}`}
          </p>
        </div>

        {/* Explicit Undo & Redo Navigation Buttons */}
        <div className="flex items-center gap-1.5" role="group" aria-label="History navigation">
          <button
            onClick={onUndo}
            disabled={!canUndo || isLoading}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-all duration-150 ${
              canUndo && !isLoading
                ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 active:scale-95 shadow-xs'
                : 'bg-gray-100/70 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title="Undo garment change (Ctrl+Z / ⌘Z)"
            aria-label="Undo garment change"
          >
            <Undo2Icon className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo || isLoading}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-all duration-150 ${
              canRedo && !isLoading
                ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 active:scale-95 shadow-xs'
                : 'bg-gray-100/70 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title="Redo garment change (Ctrl+Shift+Z / ⌘⇧Z / Ctrl+Y)"
            aria-label="Redo garment change"
          >
            <span>Redo</span>
            <Redo2Icon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Layer history items */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-0.5">
        {outfitHistory.map((layer, index) => {
          const isActive = index === currentOutfitIndex;
          const isUndone = index > currentOutfitIndex;
          const isBase = index === 0;

          return (
            <div
              key={layer.garment?.id || `layer-${index}`}
              onClick={() => {
                if (!isLoading && index !== currentOutfitIndex) {
                  onSelectLayer(index);
                }
              }}
              className={`flex items-center justify-between p-2 rounded-lg transition-all duration-150 border cursor-pointer select-none ${
                isActive
                  ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                  : isUndone
                  ? 'bg-gray-50/80 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:bg-gray-100/70'
                  : 'bg-white border-gray-200/90 text-gray-800 hover:border-gray-300 hover:bg-gray-50'
              }`}
              title={
                isActive
                  ? 'Currently displayed layer'
                  : isUndone
                  ? 'Click to redo up to this garment'
                  : 'Click to return to this layer'
              }
            >
              <div className="flex items-center overflow-hidden min-w-0 pr-2">
                {/* Index Indicator */}
                <span
                  className={`flex-shrink-0 flex items-center justify-center w-6 h-6 mr-2.5 text-xs font-bold rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isUndone
                      ? 'bg-gray-200 text-gray-500'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {index === 0 ? '0' : index}
                </span>

                {/* Garment Image or Base Icon */}
                {layer.garment ? (
                  <img
                    src={layer.garment.url}
                    alt={layer.garment.name}
                    className={`flex-shrink-0 w-11 h-11 object-cover rounded-md mr-2.5 border ${
                      isActive ? 'border-white/20' : 'border-gray-200'
                    }`}
                  />
                ) : (
                  <div
                    className={`flex-shrink-0 w-11 h-11 rounded-md mr-2.5 flex items-center justify-center text-xs font-medium border ${
                      isActive
                        ? 'bg-white/10 text-white border-white/20'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    Base
                  </div>
                )}

                {/* Garment Name and Status */}
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isActive
                          ? 'text-white'
                          : isUndone
                          ? 'text-gray-500 line-through'
                          : 'text-gray-800'
                      }`}
                    >
                      {layer.garment ? layer.garment.name : 'Original Model'}
                    </p>
                  </div>
                  <p
                    className={`text-[11px] truncate ${
                      isActive
                        ? 'text-gray-300'
                        : isUndone
                        ? 'text-gray-400 italic'
                        : 'text-gray-500'
                    }`}
                  >
                    {isActive
                      ? '● Currently Active'
                      : isUndone
                      ? 'Undone (Click to restore)'
                      : isBase
                      ? 'Starting baseline'
                      : 'Applied earlier'}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Remove current or Status Badge */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {isActive && index > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveLastGarment();
                    }}
                    disabled={isLoading}
                    className="p-1.5 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                    title={`Remove ${layer.garment?.name || 'garment'}`}
                    aria-label={`Remove ${layer.garment?.name || 'garment'}`}
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                )}

                {isActive && index === 0 && (
                  <span className="p-1 text-gray-300" title="Base layer active">
                    <CheckIcon className="w-4 h-4" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Helpful Hint & Share Action */}
      <div className="mt-3 pt-2 border-t border-gray-200/70 flex flex-col gap-2">
        {onOpenShare && (
          <button
            type="button"
            onClick={onOpenShare}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800 active:scale-98 transition-all shadow-xs disabled:opacity-50"
          >
            <Share2Icon className="w-3.5 h-3.5" />
            <span>Share & Export Look</span>
          </button>
        )}

        <p className="text-[11px] text-gray-500 text-center">
          Keyboard shortcuts: <kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-300 font-mono text-[10px]">⌘Z</kbd> to undo, <kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-300 font-mono text-[10px]">⌘⇧Z</kbd> to redo
        </p>
      </div>
    </div>
  );
};

export default OutfitStack;