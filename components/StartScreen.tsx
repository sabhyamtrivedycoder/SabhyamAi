/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compare } from './ui/compare';
import { generateModelImage } from '../services/geminiService';
import Spinner from './Spinner';
import { getFriendlyErrorMessage } from '../lib/utils';
import { UserMeasurements, UserProfile } from '../types';
import FitQuestionsModal from './FitQuestionsModal';

interface StartScreenProps {
  onModelFinalized: (modelUrl: string, measurements?: UserMeasurements) => void;
  onPromptAuth?: () => void;
  currentUser?: UserProfile | null;
  savedMeasurements?: UserMeasurements;
  onOpenContact?: () => void;
}

const DEFAULT_MEASUREMENTS: UserMeasurements = {
  height: "5'8\" (173 cm)",
  weight: "155 lbs (70 kg)",
  bodyType: "Average",
  gender: "Unisex",
  styleVibe: "Classic Minimalist",
};

export const StartScreen: React.FC<StartScreenProps> = ({
  onModelFinalized,
  onPromptAuth,
  currentUser,
  savedMeasurements,
  onOpenContact,
}) => {
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
  const [measurements, setMeasurements] = useState<UserMeasurements>(
    savedMeasurements || currentUser?.measurements || DEFAULT_MEASUREMENTS
  );
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGenerationWithMeasurements = async (file: File, fitData: UserMeasurements) => {
    setIsGenerating(true);
    setGeneratedModelUrl(null);
    setError(null);
    try {
      const result = await generateModelImage(file, fitData);
      setGeneratedModelUrl(result);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to create model'));
      setUserImageUrl(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUserImageUrl(dataUrl);
      setIsQuestionsModalOpen(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleQuestionsSubmit = (fitData: UserMeasurements, mode: 'exact_photo' | 'ai_studio' = 'exact_photo') => {
    setMeasurements(fitData);
    setIsQuestionsModalOpen(false);

    if (mode === 'exact_photo' && userImageUrl) {
      onModelFinalized(userImageUrl, fitData);
      return;
    }

    if (pendingFile) {
      startGenerationWithMeasurements(pendingFile, fitData);
    }
  };

  const handleQuestionsSkip = () => {
    setIsQuestionsModalOpen(false);
    if (pendingFile) {
      startGenerationWithMeasurements(pendingFile, measurements);
    }
  };

  const reset = () => {
    setUserImageUrl(null);
    setPendingFile(null);
    setGeneratedModelUrl(null);
    setIsGenerating(false);
    setError(null);
    setIsQuestionsModalOpen(false);
  };

  const screenVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {!userImageUrl ? (
          <motion.div
            key="uploader"
            className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 pt-16 sm:pt-20 pb-12"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Left Column: Neurapex Typographic Hero */}
            <div className="lg:w-1/2 flex flex-col items-start text-left">
              <div className="max-w-xl">
                {/* Main Hero Headline matching Neurapex exact serif & italic style */}
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif text-[#111827] tracking-tight leading-[1.08] select-none">
                  <span className="block font-normal">Unifying</span>
                  <span className="block font-normal italic text-[#111827]">Fashion Intelligence</span>
                </h1>

                {/* Subtitle matching Neurapex quiet slate prose with highlighted anchor */}
                <p className="mt-8 text-base sm:text-lg text-[#4b5563] leading-relaxed font-sans font-normal">
                  We&apos;re building generative fashion AI that can reason across your exact face, physical measurements, and garment drape physics. Instead of a patchwork of siloed sizing charts and guesswork, now ask{' '}
                  <strong className="font-semibold text-[#111827]">one model</strong> to make sense of oversized streetwear, boxy cuts, and tailored layers on your real body.
                </p>

                {/* Neurapex Action Row: Soft elevated pill + Underline text link */}
                <div className="mt-9 flex items-center gap-6">
                  <label
                    htmlFor="image-upload-start"
                    className="inline-flex items-center justify-center px-7 py-3 rounded-2xl bg-white text-[#374151] hover:text-[#111827] border border-black/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] transition-all font-medium text-sm cursor-pointer active:scale-98 select-none"
                  >
                    Try Fitting
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('interactive-preview');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-sm text-[#4b5563] underline underline-offset-4 hover:text-[#111827] transition-colors"
                  >
                    See how it works
                  </button>
                </div>

                <input
                  id="image-upload-start"
                  type="file"
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif"
                  onChange={handleFileChange}
                />

                {/* Micro metadata row */}
                <div className="mt-8 pt-6 border-t border-black/[0.06] flex items-center gap-2 text-xs text-[#6b7280]">
                  <span>100% Real Face Preservation</span>
                  <span aria-hidden="true">·</span>
                  <span>Biometric Proportion Calibration</span>
                  <span aria-hidden="true">·</span>
                  {onOpenContact ? (
                    <button
                      type="button"
                      onClick={onOpenContact}
                      className="underline hover:text-[#111827]"
                    >
                      sabhyamtrivedy@gmail.com
                    </button>
                  ) : (
                    <span>sabhyamtrivedy@gmail.com</span>
                  )}
                </div>

                {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
              </div>
            </div>

            {/* Right Column: Floating Soft Card with Interactive Compare */}
            <div id="interactive-preview" className="w-full lg:w-1/2 flex items-center justify-center">
              <div className="relative rounded-[2.5rem] p-3 sm:p-4 bg-white border border-black/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.06)] transition-all max-w-sm sm:max-w-md w-full">
                <Compare
                  firstImage="https://storage.googleapis.com/gemini-95-icons/asr-tryon.jpg"
                  secondImage="https://storage.googleapis.com/gemini-95-icons/asr-tryon-model.png"
                  slideMode="drag"
                  className="w-full aspect-[2/3] rounded-[1.75rem] bg-gray-100 overflow-hidden shadow-inner"
                />
                <div className="mt-3 px-2 flex items-center justify-between text-[11px] text-[#6b7280] font-medium">
                  <span>Uploaded Portrait</span>
                  <span className="italic">Drag slider to compare</span>
                  <span>Calibrated AI Model</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Step 2: Model Review / Generation Screen */
          <motion.div
            key="compare"
            className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-14 pt-16 sm:pt-20 pb-12"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <div className="md:w-1/2 flex-shrink-0 flex flex-col items-center md:items-start text-center md:text-left">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs text-[#6b7280] font-medium mb-3">
                  <span>Height: {measurements.height}</span>
                  <span aria-hidden="true">·</span>
                  <span>Build: {measurements.bodyType}</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-serif text-[#111827] tracking-tight leading-[1.1]">
                  <span className="block font-normal">Your Personal</span>
                  <span className="block font-normal italic text-[#111827]">Model Calibration</span>
                </h2>
                <p className="mt-4 text-sm sm:text-base text-[#4b5563] leading-relaxed">
                  Calibrated to your exact facial features and anatomical proportions. Review the model before entering the virtual studio.
                </p>
              </div>

              {isGenerating && (
                <div className="flex items-center gap-3 text-sm text-[#4b5563] mt-8 bg-white px-5 py-3 rounded-2xl border border-black/[0.06] shadow-sm">
                  <Spinner />
                  <span>Synthesizing your model with 100% facial accuracy...</span>
                </div>
              )}

              {error && (
                <div className="text-center md:text-left text-red-600 max-w-md mt-6">
                  <p className="font-semibold text-xs uppercase tracking-wider">Notice</p>
                  <p className="text-sm mt-1 mb-4">{error}</p>
                  <button
                    onClick={reset}
                    className="text-sm font-medium text-gray-900 underline"
                  >
                    Try Again
                  </button>
                </div>
              )}

              <AnimatePresence>
                {generatedModelUrl && !isGenerating && !error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col sm:flex-row items-center gap-3.5 mt-8 w-full sm:w-auto"
                  >
                    <button
                      onClick={reset}
                      className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-[#4b5563] hover:text-[#111827] bg-white rounded-xl border border-black/[0.08] shadow-sm hover:shadow transition-all"
                    >
                      Different Photo
                    </button>

                    {userImageUrl && (
                      <button
                        onClick={() => onModelFinalized(userImageUrl, measurements)}
                        className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-[#111827] bg-amber-50 hover:bg-amber-100 rounded-xl transition-all border border-amber-200"
                        title="Proceed with your original uploaded photo for 100% genuine face fidelity"
                      >
                        ⭐ Use Original Photo (Real Face)
                      </button>
                    )}

                    <button
                      onClick={() => onModelFinalized(generatedModelUrl, measurements)}
                      className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-[#111827] hover:bg-black rounded-xl transition-all shadow-md active:scale-98"
                    >
                      Enter Virtual Studio &rarr;
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="md:w-1/2 w-full flex items-center justify-center">
              <div className="relative rounded-[2.5rem] p-3 sm:p-4 bg-white border border-black/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.06)] max-w-sm sm:max-w-md w-full">
                <Compare
                  firstImage={userImageUrl}
                  secondImage={generatedModelUrl ?? userImageUrl}
                  slideMode="drag"
                  className="w-full aspect-[2/3] rounded-[1.75rem] bg-gray-100 overflow-hidden shadow-inner"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fit & Proportion Questions Modal */}
      <FitQuestionsModal
        isOpen={isQuestionsModalOpen}
        onClose={() => setIsQuestionsModalOpen(false)}
        onSubmit={handleQuestionsSubmit}
        onSkip={handleQuestionsSkip}
        initialMeasurements={measurements}
        onPromptSignIn={onPromptAuth}
        isLoggedIn={!!currentUser}
      />
    </>
  );
};

export default StartScreen;
