/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import {
  RotateCcwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Share2Icon,
  HeartIcon,
  SparklesIcon,
  BookmarkIcon,
  UserIcon,
  MailIcon,
  XIcon,
} from './icons';
import Spinner from './Spinner';
import { AnimatePresence, motion } from 'framer-motion';
import { UserProfile } from '../types';
import Logo from './Logo';

interface CanvasProps {
  displayImageUrl: string | null;
  onStartOver: () => void;
  isLoading: boolean;
  loadingMessage: string;
  onSelectPose: (index: number) => void;
  poseInstructions: string[];
  currentPoseIndex: number;
  availablePoseKeys: string[];
  onOpenShare?: () => void;
  onOpenStylist?: () => void;
  onOpenFavorites?: () => void;
  onToggleFavoriteLook?: () => void;
  isCurrentLookFavorited?: boolean;
  onOpenAuth?: () => void;
  currentUser?: UserProfile | null;
  onOpenContact?: () => void;
  error?: string | null;
  onClearError?: () => void;
  onRetryTryOn?: (modelEndpoint?: string) => void;
  lastGarmentName?: string;
}

const Canvas: React.FC<CanvasProps> = ({
  displayImageUrl,
  onStartOver,
  isLoading,
  loadingMessage,
  onSelectPose,
  poseInstructions,
  currentPoseIndex,
  availablePoseKeys,
  onOpenShare,
  onOpenStylist,
  onOpenFavorites,
  onToggleFavoriteLook,
  isCurrentLookFavorited = false,
  onOpenAuth,
  currentUser,
  onOpenContact,
  error,
  onClearError,
  onRetryTryOn,
  lastGarmentName,
}) => {
  const [isPoseMenuOpen, setIsPoseMenuOpen] = useState(false);

  const handlePreviousPose = () => {
    if (isLoading || availablePoseKeys.length <= 1) return;

    const currentPoseInstruction = poseInstructions[currentPoseIndex];
    const currentIndexInAvailable = availablePoseKeys.indexOf(currentPoseInstruction);

    if (currentIndexInAvailable === -1) {
      onSelectPose((currentPoseIndex - 1 + poseInstructions.length) % poseInstructions.length);
      return;
    }

    const prevIndexInAvailable =
      (currentIndexInAvailable - 1 + availablePoseKeys.length) % availablePoseKeys.length;
    const prevPoseInstruction = availablePoseKeys[prevIndexInAvailable];
    const newGlobalPoseIndex = poseInstructions.indexOf(prevPoseInstruction);

    if (newGlobalPoseIndex !== -1) {
      onSelectPose(newGlobalPoseIndex);
    }
  };

  const handleNextPose = () => {
    if (isLoading) return;

    const currentPoseInstruction = poseInstructions[currentPoseIndex];
    const currentIndexInAvailable = availablePoseKeys.indexOf(currentPoseInstruction);

    if (currentIndexInAvailable === -1 || availablePoseKeys.length === 0) {
      onSelectPose((currentPoseIndex + 1) % poseInstructions.length);
      return;
    }

    const nextIndexInAvailable = currentIndexInAvailable + 1;
    if (nextIndexInAvailable < availablePoseKeys.length) {
      const nextPoseInstruction = availablePoseKeys[nextIndexInAvailable];
      const newGlobalPoseIndex = poseInstructions.indexOf(nextPoseInstruction);
      if (newGlobalPoseIndex !== -1) {
        onSelectPose(newGlobalPoseIndex);
      }
    } else {
      const newGlobalPoseIndex = (currentPoseIndex + 1) % poseInstructions.length;
      onSelectPose(newGlobalPoseIndex);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative animate-zoom-in group">
      {/* Top Left: Start Over Button */}
      <button
        onClick={onStartOver}
        className="absolute top-4 left-4 z-30 flex items-center justify-center text-center bg-white/80 border border-gray-300 text-gray-700 font-semibold py-2 px-3.5 rounded-full transition-all duration-200 ease-in-out hover:bg-white hover:border-gray-400 active:scale-95 text-xs sm:text-sm backdrop-blur-sm shadow-xs"
      >
        <RotateCcwIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
        <span>Start Over</span>
      </button>

      {/* Top Center: Brand Logo */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden sm:flex items-center gap-2 select-none bg-white/80 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-gray-200/80 shadow-xs">
        <Logo size="xs" />
      </div>

      {/* Top Right: Actions Group */}
      {displayImageUrl && (
        <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 sm:gap-2">
          {/* Favorite Look Button */}
          {onToggleFavoriteLook && (
            <button
              onClick={onToggleFavoriteLook}
              disabled={isLoading}
              className={`flex items-center justify-center p-2 rounded-full border transition-all backdrop-blur-sm shadow-xs ${
                isCurrentLookFavorited
                  ? 'bg-red-50 border-red-300 text-red-600'
                  : 'bg-white/80 border-gray-300 text-gray-700 hover:bg-white hover:text-red-500'
              }`}
              title={isCurrentLookFavorited ? 'Saved in favorites' : 'Save look to favorites'}
              aria-label="Save look to favorites"
            >
              <HeartIcon filled={isCurrentLookFavorited} className="w-4 h-4" />
            </button>
          )}

          {/* Fit Calculator & AI Stylist Button */}
          {onOpenStylist && (
            <button
              onClick={onOpenStylist}
              disabled={isLoading}
              className="flex items-center gap-1.5 bg-white/90 hover:bg-white border border-gray-300 text-gray-800 font-semibold py-2 px-3 rounded-full transition-all text-xs sm:text-sm backdrop-blur-sm shadow-xs"
              title="Fit Calculator (Size recommendations) & AI styling critique"
            >
              <SparklesIcon className="w-3.5 h-3.5 text-pink-600" />
              <span className="hidden sm:inline">Fit & Style</span>
            </button>
          )}

          {/* Saved Looks Drawer / Gallery */}
          {onOpenFavorites && (
            <button
              onClick={onOpenFavorites}
              disabled={isLoading}
              className="flex items-center gap-1 bg-white/80 hover:bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-3 rounded-full transition-all text-xs sm:text-sm backdrop-blur-sm shadow-xs"
              title="View all saved favorite looks"
            >
              <BookmarkIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Saved</span>
            </button>
          )}

          {/* Share Look Button */}
          {onOpenShare && (
            <button
              onClick={onOpenShare}
              disabled={isLoading}
              className="flex items-center justify-center bg-gray-900 border border-gray-900 text-white font-semibold py-2 px-3 sm:px-4 rounded-full transition-all hover:bg-gray-800 active:scale-95 text-xs sm:text-sm backdrop-blur-sm shadow-md disabled:opacity-50"
              title="Share, download PNG or export PDF dossier"
            >
              <Share2Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
              <span>Share</span>
            </button>
          )}

          {/* User Account / Profile */}
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="flex items-center justify-center p-2 rounded-full border border-gray-300 bg-white/80 hover:bg-white text-gray-700 shadow-xs"
              title={currentUser ? `Account: ${currentUser.name}` : 'Sign In / Sign Up'}
            >
              <UserIcon className="w-4 h-4" />
            </button>
          )}

          {/* Contact Us Button */}
          {onOpenContact && (
            <button
              onClick={onOpenContact}
              className="flex items-center justify-center p-2 rounded-full border border-gray-300 bg-white/80 hover:bg-white text-gray-700 hover:text-purple-700 shadow-xs"
              title="Contact Us (sabhyamtrivedy@gmail.com)"
            >
              <MailIcon className="w-4 h-4 text-purple-600" />
            </button>
          )}
        </div>
      )}

      {/* Image Display or Placeholder */}
      <div className="relative w-full h-full flex items-center justify-center">
        {displayImageUrl ? (
          <img
            key={displayImageUrl}
            src={displayImageUrl}
            alt="Virtual try-on model"
            className="max-w-full max-h-full object-contain transition-opacity duration-500 animate-fade-in rounded-lg shadow-md"
          />
        ) : (
          <div className="w-[400px] h-[600px] bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center">
            <Spinner />
            <p className="text-md font-serif text-gray-600 mt-4">Loading Model...</p>
          </div>
        )}

        <AnimatePresence>
          {isLoading && (
            <motion.div
              className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-20 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Spinner />
              {loadingMessage && (
                <p className="text-lg font-serif text-gray-700 mt-4 text-center px-4">
                  {loadingMessage}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive Retry Banner when try-on fails or times out */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[92%] bg-white/95 backdrop-blur-md rounded-2xl border border-red-200 shadow-xl p-3.5 text-xs text-gray-900"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-ping" />
                <span className="font-semibold text-red-950">Virtual Try-On Notice</span>
                {lastGarmentName && (
                  <span className="text-[11px] text-gray-500 truncate max-w-[180px]">({lastGarmentName})</span>
                )}
              </div>
              {onClearError && (
                <button
                  type="button"
                  onClick={onClearError}
                  className="p-1 text-gray-400 hover:text-black rounded-full"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-gray-600 mb-3 text-[11px] leading-relaxed">
              {error}
            </p>
            {onRetryTryOn && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onRetryTryOn('gemini-3.1-flash-lite-image')}
                  className="px-3 py-1.5 rounded-xl bg-[#111827] text-white hover:bg-black font-semibold text-[11px] transition-all shadow-xs active:scale-98"
                >
                  ↻ Auto-Retry with Flash Lite Endpoint
                </button>
                <button
                  type="button"
                  onClick={() => onRetryTryOn('gemini-3.1-flash-image')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-semibold text-[11px] transition-all active:scale-98"
                >
                  ↻ Retry Primary Endpoint
                </button>
                <button
                  type="button"
                  onClick={() => onRetryTryOn('local_smart_engine')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold text-[11px] transition-all active:scale-98"
                >
                  ⚡ Instant Local Fit
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pose Controls */}
      {displayImageUrl && !isLoading && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          onMouseEnter={() => setIsPoseMenuOpen(true)}
          onMouseLeave={() => setIsPoseMenuOpen(false)}
        >
          {/* Pose popover menu */}
          <AnimatePresence>
            {isPoseMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute bottom-full mb-3 w-64 bg-white/85 backdrop-blur-lg rounded-xl p-2 border border-gray-200/80 shadow-lg"
              >
                <div className="grid grid-cols-2 gap-2">
                  {poseInstructions.map((pose, index) => (
                    <button
                      key={pose}
                      onClick={() => onSelectPose(index)}
                      disabled={isLoading || index === currentPoseIndex}
                      className="w-full text-left text-xs font-medium text-gray-800 p-2 rounded-md hover:bg-gray-200/70 disabled:opacity-50 disabled:bg-gray-200/70 disabled:font-bold disabled:cursor-not-allowed"
                    >
                      {pose}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-center gap-2 bg-white/70 backdrop-blur-md rounded-full p-2 border border-gray-300/60 shadow-md">
            <button
              onClick={handlePreviousPose}
              aria-label="Previous pose"
              className="p-2 rounded-full hover:bg-white/80 active:scale-90 transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-800" />
            </button>
            <span
              className="text-xs sm:text-sm font-semibold text-gray-800 w-40 sm:w-48 text-center truncate"
              title={poseInstructions[currentPoseIndex]}
            >
              {poseInstructions[currentPoseIndex]}
            </span>
            <button
              onClick={handleNextPose}
              aria-label="Next pose"
              className="p-2 rounded-full hover:bg-white/80 active:scale-90 transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-800" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;