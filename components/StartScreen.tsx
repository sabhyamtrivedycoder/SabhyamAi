/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloudIcon, SlidersIcon, UserIcon } from './icons';
import { Compare } from './ui/compare';
import { generateModelImage } from '../services/geminiService';
import Spinner from './Spinner';
import { getFriendlyErrorMessage } from '../lib/utils';
import { UserMeasurements, UserProfile } from '../types';
import FitQuestionsModal from './FitQuestionsModal';

import Logo from './Logo';

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
      // Open questions modal to collect height, weight, body type
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
      // 100% Real Face Guarantee - use exact uploaded photo directly!
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
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {!userImageUrl ? (
          <motion.div
            key="uploader"
            className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <div className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="max-w-lg">
                <div className="flex items-center justify-between w-full mb-5">
                  <Logo size="md" />
                  {currentUser ? (
                    <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2.5 py-1 rounded-full">
                      {currentUser.name}
                    </span>
                  ) : onPromptAuth ? (
                    <button
                      type="button"
                      onClick={onPromptAuth}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Sign In / Sign Up</span>
                    </button>
                  ) : null}
                </div>

                <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 leading-tight">
                  Your Exact Face. Your Perfect Fit.
                </h1>
                <p className="mt-4 text-lg text-gray-600">
                  Upload a photo to see baggy streetwear, oversized tees, and designer styles on your personal AI model. 100% facial accuracy guaranteed.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="px-2 py-0.5 rounded bg-gray-100 font-medium">✓ 1:1 Face Preservation</span>
                  <span className="px-2 py-0.5 rounded bg-gray-100 font-medium">✓ Height & Weight Calibration</span>
                  <span className="px-2 py-0.5 rounded bg-gray-100 font-medium">✓ Baggy & Streetwear Fitting</span>
                </div>

                <hr className="my-7 border-gray-200" />

                <div className="flex flex-col items-center lg:items-start w-full gap-3">
                  <label
                    htmlFor="image-upload-start"
                    className="w-full relative flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-gray-900 rounded-xl cursor-pointer group hover:bg-gray-800 active:scale-98 transition-all shadow-md"
                  >
                    <UploadCloudIcon className="w-5 h-5 mr-3" />
                    Upload Photo & Start Fitting
                  </label>
                  <input
                    id="image-upload-start"
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif"
                    onChange={handleFileChange}
                  />
                  <p className="text-gray-500 text-xs">
                    Full-body or portrait photo. We will ask a few fit questions (height & weight) to calibrate your virtual proportions.
                  </p>

                  <div className="pt-2 flex items-center gap-1.5 text-xs text-gray-500">
                    <span>Need support or have feedback?</span>
                    {onOpenContact ? (
                      <button
                        type="button"
                        onClick={onOpenContact}
                        className="text-purple-700 hover:text-purple-950 font-semibold underline"
                      >
                        Contact Us (sabhyamtrivedy@gmail.com)
                      </button>
                    ) : (
                      <a
                        href="mailto:sabhyamtrivedy@gmail.com"
                        className="text-purple-700 hover:text-purple-950 font-semibold underline"
                      >
                        Contact Us: sabhyamtrivedy@gmail.com
                      </a>
                    )}
                  </div>
                  {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
              <Compare
                firstImage="https://storage.googleapis.com/gemini-95-icons/asr-tryon.jpg"
                secondImage="https://storage.googleapis.com/gemini-95-icons/asr-tryon-model.png"
                slideMode="drag"
                className="w-full max-w-sm aspect-[2/3] rounded-2xl bg-gray-200 shadow-xl border border-gray-200"
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="compare"
            className="w-full max-w-6xl mx-auto h-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <div className="md:w-1/2 flex-shrink-0 flex flex-col items-center md:items-start">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 text-[11px] font-semibold mb-2">
                  <span>Height: {measurements.height}</span>
                  <span>·</span>
                  <span>Build: {measurements.bodyType}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 leading-tight">
                  Your Personal Model
                </h1>
                <p className="mt-2 text-md text-gray-600">
                  Calibrated to your exact face and measurements. Drag the slider to review.
                </p>
              </div>

              {isGenerating && (
                <div className="flex items-center gap-3 text-lg text-gray-700 font-serif mt-6">
                  <Spinner />
                  <span>Synthesizing your model with 100% facial accuracy...</span>
                </div>
              )}

              {error && (
                <div className="text-center md:text-left text-red-600 max-w-md mt-6">
                  <p className="font-semibold">Generation Notice</p>
                  <p className="text-sm mb-4">{error}</p>
                  <button
                    onClick={reset}
                    className="text-sm font-semibold text-gray-700 hover:underline"
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
                    transition={{ duration: 0.5 }}
                    className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto"
                  >
                    <button
                      onClick={reset}
                      className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors border border-gray-300"
                    >
                      Different Photo
                    </button>
                    {userImageUrl && (
                      <button
                        onClick={() => onModelFinalized(userImageUrl, measurements)}
                        className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors border border-amber-300 flex items-center justify-center gap-1.5"
                        title="Proceed with your original uploaded photo for 100% genuine face fidelity"
                      >
                        <span>⭐ Use My Original Photo (100% Real Face)</span>
                      </button>
                    )}
                    <button
                      onClick={() => onModelFinalized(generatedModelUrl, measurements)}
                      className="w-full sm:w-auto relative inline-flex items-center justify-center px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gray-900 rounded-xl cursor-pointer group hover:bg-gray-800 active:scale-98 transition-all shadow-md"
                    >
                      Use Studio Model &rarr;
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="md:w-1/2 w-full flex items-center justify-center">
              <div
                className={`relative rounded-[1.25rem] transition-all duration-700 ease-in-out ${
                  isGenerating ? 'border border-gray-300 animate-pulse' : 'border border-transparent'
                }`}
              >
                <Compare
                  firstImage={userImageUrl}
                  secondImage={generatedModelUrl ?? userImageUrl}
                  slideMode="drag"
                  className="w-[280px] h-[420px] sm:w-[320px] sm:h-[480px] lg:w-[400px] lg:h-[600px] rounded-2xl bg-gray-200 shadow-xl"
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
