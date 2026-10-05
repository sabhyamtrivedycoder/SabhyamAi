/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SavedLook, WardrobeItem } from '../types';
import { XIcon, Trash2Icon, Share2Icon, SparklesIcon, HeartIcon } from './icons';
import { defaultWardrobe, suggestGarmentsMatchingSavedLook, WardrobeSimilarityMatch } from '../wardrobe';

interface SavedLooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedLooks: SavedLook[];
  onSelectLook: (look: SavedLook) => void;
  onDeleteLook: (lookId: string) => void;
  onShareLook?: (look: SavedLook) => void;
  wardrobe?: WardrobeItem[];
  onTryOnGarment?: (item: WardrobeItem) => void;
  onOpenComparison?: () => void;
}

export const SavedLooksModal: React.FC<SavedLooksModalProps> = ({
  isOpen,
  onClose,
  savedLooks,
  onSelectLook,
  onDeleteLook,
  onShareLook,
  wardrobe = defaultWardrobe,
  onTryOnGarment,
  onOpenComparison,
}) => {
  const [similarityTargetLook, setSimilarityTargetLook] = useState<SavedLook | null>(null);
  const [similarityMatches, setSimilarityMatches] = useState<WardrobeSimilarityMatch[]>([]);
  const [isCalculatingMatches, setIsCalculatingMatches] = useState(false);

  const handleSuggestGarments = async (look: SavedLook) => {
    setSimilarityTargetLook(look);
    setIsCalculatingMatches(true);
    try {
      const matches = await suggestGarmentsMatchingSavedLook(look, wardrobe, 6);
      setSimilarityMatches(matches);
    } catch (e) {
      console.warn('Similarity calculation error:', e);
    } finally {
      setIsCalculatingMatches(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-auto max-h-[88vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                <HeartIcon filled className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-gray-900">
                  Favorites & Saved Looks
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {savedLooks.length} saved outfit{savedLooks.length === 1 ? '' : 's'} in your personal lookbook
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {savedLooks.length >= 2 && onOpenComparison && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenComparison();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <SparklesIcon className="w-3.5 h-3.5 text-purple-600" />
                  <span>Compare Looks</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Similarity Matches Drawer/Modal (if active) */}
          {similarityTargetLook && (
            <div className="p-4 bg-gradient-to-r from-purple-50 via-pink-50/40 to-white border-b border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950">
                    Aesthetic Match Suggestions for &quot;{similarityTargetLook.title}&quot;
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSimilarityTargetLook(null)}
                  className="text-xs text-gray-500 hover:text-gray-800 underline"
                >
                  Close Suggestions
                </button>
              </div>

              {isCalculatingMatches ? (
                <p className="text-xs text-purple-800">
                  Analyzing visual color signatures and silhouette affinities...
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {similarityMatches.map(({ item, similarityScore, matchReason }) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-xl bg-white border border-purple-200 shadow-2xs flex flex-col justify-between"
                    >
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-1.5 relative">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/75 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                          {similarityScore}%
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-gray-900 truncate" title={item.name}>
                        {item.name}
                      </p>
                      <p className="text-[9px] text-purple-800 line-clamp-2 mt-0.5" title={matchReason}>
                        {matchReason}
                      </p>
                      {onTryOnGarment && (
                        <button
                          type="button"
                          onClick={() => {
                            onTryOnGarment(item);
                            onClose();
                          }}
                          className="mt-2 w-full py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-md text-[10px] font-bold"
                        >
                          Try On
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-grow">
            {savedLooks.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                  <HeartIcon className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-serif font-semibold text-gray-800">
                  No Saved Outfits Yet
                </h4>
                <p className="text-xs text-gray-500 max-w-sm mt-1 mb-6">
                  When styling your model, click the &quot;Favorite&quot; heart button on the canvas to save complete outfits here.
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-xs"
                >
                  Return to Dressing Room
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {savedLooks.map((look) => {
                  const garmentCount = look.layers.filter((l) => l.garment).length;
                  return (
                    <div
                      key={look.id}
                      className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                    >
                      {/* Image Preview */}
                      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                        <img
                          src={look.previewUrl}
                          alt={look.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteLook(look.id);
                            }}
                            className="p-1.5 bg-white/90 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-full shadow-xs transition-colors backdrop-blur-xs"
                            title="Remove from favorites"
                          >
                            <Trash2Icon className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md">
                          <span>{look.date}</span>
                          <span>{garmentCount} item{garmentCount === 1 ? '' : 's'}</span>
                        </div>
                      </div>

                      {/* Details & Actions */}
                      <div className="p-3.5 flex flex-col justify-between flex-grow space-y-2.5">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 truncate" title={look.title}>
                            {look.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">
                            {look.poseInstruction}
                          </p>
                        </div>

                        {/* Suggest Matching Wardrobe Garments (Requested Feature) */}
                        <button
                          type="button"
                          onClick={() => handleSuggestGarments(look)}
                          className="w-full py-1.5 px-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-purple-200"
                        >
                          <SparklesIcon className="w-3.5 h-3.5 text-purple-600" />
                          <span>Suggest Matching Garments</span>
                        </button>

                        <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectLook(look);
                              onClose();
                            }}
                            className="flex-1 py-1.5 px-3 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors text-center"
                          >
                            Load Outfit
                          </button>

                          {onShareLook && (
                            <button
                              type="button"
                              onClick={() => {
                                onShareLook(look);
                                onClose();
                              }}
                              className="p-2 border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Share this saved look"
                            >
                              <Share2Icon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SavedLooksModal;
