/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserMeasurements } from '../types';
import { SlidersIcon, CheckIcon, XIcon, UserIcon } from './icons';

interface FitQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (measurements: UserMeasurements, mode?: 'exact_photo' | 'ai_studio') => void;
  onSkip: () => void;
  initialMeasurements?: Partial<UserMeasurements>;
  onPromptSignIn?: () => void;
  isLoggedIn?: boolean;
}

const HEIGHT_OPTIONS = [
  "5'2\" (158 cm)",
  "5'5\" (165 cm)",
  "5'8\" (173 cm)",
  "5'10\" (178 cm)",
  "6'0\" (183 cm)",
  "6'2\" (188 cm)",
];

const BODY_TYPES: Array<UserMeasurements['bodyType']> = [
  'Slim',
  'Athletic',
  'Average',
  'Curvy',
  'Plus',
];

const GENDER_OPTIONS: Array<UserMeasurements['gender']> = [
  "Women's",
  "Men's",
  'Unisex',
];

const STYLE_VIBES = [
  'Classic Minimalist',
  'Urban Streetwear',
  'Smart Casual',
  'Quiet Luxury',
  'Evening Chic',
  'Athleisure',
];

export const FitQuestionsModal: React.FC<FitQuestionsModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSkip,
  initialMeasurements,
  onPromptSignIn,
  isLoggedIn = false,
}) => {
  const [height, setHeight] = useState<string>(initialMeasurements?.height || "5'8\" (173 cm)");
  const [customHeight, setCustomHeight] = useState('');
  const [isCustomHeight, setIsCustomHeight] = useState(false);
  const [weight, setWeight] = useState<string>(initialMeasurements?.weight || '155 lbs (70 kg)');
  const [bodyType, setBodyType] = useState<UserMeasurements['bodyType']>(
    initialMeasurements?.bodyType || 'Average'
  );
  const [gender, setGender] = useState<UserMeasurements['gender']>(
    initialMeasurements?.gender || 'Unisex'
  );
  const [styleVibe, setStyleVibe] = useState<string>(
    initialMeasurements?.styleVibe || 'Classic Minimalist'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalHeight = isCustomHeight && customHeight.trim() ? customHeight.trim() : height;
    onSubmit({
      height: finalHeight,
      weight,
      bodyType,
      gender,
      styleVibe,
    }, 'ai_studio');
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
          className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-2 rounded-full bg-gray-900 text-white text-[11px] font-semibold tracking-wider uppercase">
                <SlidersIcon className="w-3 h-3" />
                Step 1: Fit & Proportions
              </div>
              <h3 className="text-2xl font-serif font-bold text-gray-900">
                Personalize Your Fit
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Your face will be preserved with 100% accuracy. Set your height and build so garments drape naturally.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-grow">
            {/* Gender / Silhouette */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Silhouette Styling
              </label>
              <div className="grid grid-cols-3 gap-2">
                {GENDER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setGender(opt)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                      gender === opt
                        ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Height */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Height
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomHeight(!isCustomHeight)}
                  className="text-[11px] font-semibold text-gray-600 hover:text-gray-900 underline"
                >
                  {isCustomHeight ? 'Pick preset' : 'Custom height'}
                </button>
              </div>

              {isCustomHeight ? (
                <input
                  type="text"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  placeholder="e.g., 5 ft 10 in or 178 cm"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {HEIGHT_OPTIONS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHeight(h)}
                      className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                        height === h
                          ? 'bg-gray-900 text-white border-gray-900 shadow-xs font-semibold'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Body Type & Weight */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Body Build
              </label>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {BODY_TYPES.map((bt) => (
                  <button
                    key={bt}
                    type="button"
                    onClick={() => setBodyType(bt)}
                    className={`py-2 px-1 sm:px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      bodyType === bt
                        ? 'bg-gray-900 text-white border-gray-900 shadow-xs font-semibold'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {bt}
                  </button>
                ))}
              </div>

              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Approximate Weight (optional)
                </label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 150 lbs (68 kg)"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            {/* Style Aesthetic */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Preferred Style Aesthetic
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STYLE_VIBES.map((sv) => (
                  <button
                    key={sv}
                    type="button"
                    onClick={() => setStyleVibe(sv)}
                    className={`py-2 px-2.5 text-xs rounded-lg border text-left flex items-center justify-between transition-all ${
                      styleVibe === sv
                        ? 'bg-gray-900 text-white border-gray-900 font-semibold'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">{sv}</span>
                    {styleVibe === sv && <CheckIcon className="w-3.5 h-3.5 shrink-0 ml-1" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Sign in / Sign up callout */}
            {!isLoggedIn && onPromptSignIn && (
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">
                      Save your profile & measurements
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Sign in or create an account to bookmark outfits & access them anytime.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onPromptSignIn}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                >
                  Sign In / Sign Up
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const finalHeight = isCustomHeight && customHeight.trim() ? customHeight.trim() : height;
                  onSubmit({
                    height: finalHeight,
                    weight,
                    bodyType,
                    gender,
                    styleVibe,
                  }, 'exact_photo');
                }}
                className="w-full py-3 px-4 text-xs sm:text-sm font-semibold rounded-xl bg-gray-900 text-white hover:bg-gray-800 active:scale-98 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>⭐ Use My Exact Photo (100% Real Face Guarantee)</span>
                <span>&rarr;</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 text-xs font-semibold rounded-xl bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300 transition-all text-center"
                >
                  Generate AI Studio Backdrop
                </button>
                <button
                  type="button"
                  onClick={onSkip}
                  className="py-2.5 px-3 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Defaults
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FitQuestionsModal;
