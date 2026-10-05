/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon,
  DownloadIcon,
  Share2Icon,
  CopyIcon,
  CheckIcon,
  TwitterIcon,
  PinterestIcon,
  WhatsAppIcon,
  FacebookIcon,
  FileTextIcon,
} from './icons';
import { OutfitLayer, UserMeasurements } from '../types';
import Spinner from './Spinner';
import { generateHeadlessComposition, exportHeadlessPdfDossier } from '../lib/headlessExport';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseModelUrl: string | null;
  currentImageUrl: string;
  activeLayers: OutfitLayer[];
  currentPoseName: string;
  measurements?: UserMeasurements;
}

type CardTemplate = 'editorial' | 'clean' | 'before_after';
type AspectRatio = '4:5' | '9:16' | '1:1';

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  baseModelUrl,
  currentImageUrl,
  activeLayers,
  currentPoseName,
  measurements,
}) => {
  const [template, setTemplate] = useState<CardTemplate>('editorial');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:5');
  const [lookTitle, setLookTitle] = useState('My Virtual Style Look');
  const [isGeneratingCanvas, setIsGeneratingCanvas] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Extract garments worn (excluding base model layer 0)
  const garmentsWorn = activeLayers
    .slice(1)
    .map((layer) => layer.garment)
    .filter(Boolean);

  // Generate high-resolution preview canvas using headless engine
  const renderShareCard = useCallback(async () => {
    if (!currentImageUrl) return;

    setIsGeneratingCanvas(true);
    try {
      const composition = await generateHeadlessComposition({
        mainImageUrl: currentImageUrl,
        garments: garmentsWorn as any,
        lookTitle,
        poseName: currentPoseName,
        measurements,
        template,
        aspectRatio,
        scaleFactor: 1.5,
        baseModelUrl,
      });

      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
      const url = URL.createObjectURL(composition.blob);
      setPreviewBlobUrl(url);
      setIsGeneratingCanvas(false);
    } catch (err) {
      console.error('Error generating headless share preview card:', err);
      // Fallback: use direct image URL
      setPreviewBlobUrl(currentImageUrl);
      setIsGeneratingCanvas(false);
    }
  }, [currentImageUrl, baseModelUrl, template, aspectRatio, lookTitle, currentPoseName, garmentsWorn, measurements]);

  // Re-generate preview when options change
  useEffect(() => {
    if (isOpen) {
      renderShareCard();
    }
  }, [isOpen, template, aspectRatio, lookTitle, renderShareCard]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  // Download High-Resolution Render Handler
  const handleDownload = async () => {
    try {
      setShareFeedback('Compositing ultra-crisp print render...');
      const composition = await generateHeadlessComposition({
        mainImageUrl: currentImageUrl,
        garments: garmentsWorn as any,
        lookTitle,
        poseName: currentPoseName,
        measurements,
        template,
        aspectRatio,
        scaleFactor: 2.5, // 300 DPI print quality
        baseModelUrl,
      });

      const link = document.createElement('a');
      link.href = composition.dataUrl;
      const sanitizedTitle = lookTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      link.download = `sabhyam-lookbook-${sanitizedTitle}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShareFeedback('High-resolution lookbook downloaded successfully!');
      setTimeout(() => setShareFeedback(null), 3500);
    } catch (err: any) {
      console.error('Headless download fallback:', err);
      const link = document.createElement('a');
      link.href = previewBlobUrl || currentImageUrl;
      link.download = `sabhyam-look-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShareFeedback('Lookbook downloaded.');
      setTimeout(() => setShareFeedback(null), 3000);
    }
  };

  // Export as High-Resolution PDF Lookbook Dossier using headless canvas engine
  const handleExportPDF = async () => {
    try {
      setShareFeedback('Generating High-Resolution PDF Lookbook Dossier...');
      await exportHeadlessPdfDossier(
        {
          mainImageUrl: currentImageUrl,
          garments: garmentsWorn as any,
          lookTitle,
          poseName: currentPoseName,
          measurements,
          template,
          aspectRatio,
          baseModelUrl,
        },
        (msg) => setShareFeedback(msg)
      );

      setShareFeedback('PDF Lookbook Dossier downloaded successfully!');
      setTimeout(() => setShareFeedback(null), 3500);
    } catch (err: any) {
      console.error('PDF export error:', err);
      setShareFeedback('PDF export failed: ' + (err?.message || 'Failed'));
      setTimeout(() => setShareFeedback(null), 4000);
    }
  };

  // Native Web Share API Handler
  const handleNativeShare = async () => {
    setShareFeedback(null);
    try {
      const shareDataText = `Check out my outfit created with Sabhyam Ai! Worn: ${
        garmentsWorn.map((g) => g?.name).join(', ') || 'Custom styling'
      }`;

      if (navigator.share) {
        await navigator.share({
          title: lookTitle,
          text: shareDataText,
          url: window.location.href,
        });
        setShareFeedback('Shared successfully!');
        setTimeout(() => setShareFeedback(null), 3000);
      } else {
        await navigator.clipboard.writeText(
          `${shareDataText} — Create your own at ${window.location.href}`
        );
        setShareFeedback('Share link and description copied to clipboard!');
        setTimeout(() => setShareFeedback(null), 3500);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share error:', err);
        setShareFeedback('Unable to open share sheet on this browser.');
        setTimeout(() => setShareFeedback(null), 3000);
      }
    }
  };

  // Copy to Clipboard Handler
  const handleCopyImage = async () => {
    try {
      if (previewBlobUrl) {
        const response = await fetch(previewBlobUrl);
        const blob = await response.blob();
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
          setCopySuccess(true);
          setShareFeedback('Image copied to clipboard!');
          setTimeout(() => {
            setCopySuccess(false);
            setShareFeedback(null);
          }, 3500);
          return;
        } catch {
          // Fallback if browser forbids image write
        }
      }

      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setShareFeedback('Link copied to clipboard!');
      setTimeout(() => {
        setCopySuccess(false);
        setShareFeedback(null);
      }, 3000);
    } catch {
      setShareFeedback('Could not copy image directly.');
      setTimeout(() => setShareFeedback(null), 3000);
    }
  };

  // Social Quick Links
  const shareText = encodeURIComponent(
    `Check out my virtual try-on look created with Sabhyam Ai! 👗✨ #SabhyamAi #VirtualTryOn #OOTD`
  );
  const currentUrlEncoded = encodeURIComponent(window.location.href);

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${currentUrlEncoded}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${shareText}%20${currentUrlEncoded}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${currentUrlEncoded}`;
  const pinterestShareUrl = `https://pinterest.com/pin/create/button/?url=${currentUrlEncoded}&description=${shareText}`;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col md:flex-row max-h-[92vh]"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 text-gray-500 hover:text-gray-900 bg-white/80 hover:bg-gray-100 rounded-full transition-colors backdrop-blur-xs cursor-pointer"
            aria-label="Close share dialog"
          >
            <XIcon className="w-5 h-5" />
          </button>

          {/* Left Column: Real-time Headless Preview */}
          <div className="md:w-1/2 bg-gray-50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-200 min-h-[360px] md:min-h-[520px]">
            <div className="w-full max-w-sm flex flex-col items-center">
              <span className="text-xs font-semibold text-gray-600 mb-2">Live Headless Composition</span>
              <div className="relative w-full aspect-[4/5] bg-gray-200 rounded-xl overflow-hidden shadow-md flex items-center justify-center border border-gray-300/80">
                {isGeneratingCanvas ? (
                  <div className="flex flex-col items-center gap-2">
                    <Spinner />
                    <span className="text-xs text-gray-600">Compositing headless canvas...</span>
                  </div>
                ) : previewBlobUrl ? (
                  <img
                    src={previewBlobUrl}
                    alt="Generated look preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={currentImageUrl}
                    alt="Current model preview"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {shareFeedback && (
                <div className="mt-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-full shadow-sm animate-fade-in text-center">
                  {shareFeedback}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Customization Controls & Share Actions */}
          <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="border-b border-gray-200 pb-3 mb-5">
                <h3 className="text-2xl font-serif font-bold text-gray-900">
                  Share Your Look
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Export an editorial dossier or high-res photo with 100% taint-free headless rendering.
                </p>
              </div>

              {/* Template Selector */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Preview Card Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplate('editorial')}
                    className={`py-2 px-2.5 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      template === 'editorial'
                        ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Editorial Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplate('clean')}
                    className={`py-2 px-2.5 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      template === 'clean'
                        ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Clean Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplate('before_after')}
                    disabled={!baseModelUrl}
                    className={`py-2 px-2.5 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      template === 'before_after'
                        ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                  >
                    Before / After
                  </button>
                </div>
              </div>

              {/* Aspect Ratio Selector */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Format / Ratio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['4:5', '9:16', '1:1'] as AspectRatio[]).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer ${
                        aspectRatio === ratio
                          ? 'bg-gray-800 text-white border-gray-800'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {ratio === '4:5' ? '4:5 (Portrait)' : ratio === '9:16' ? '9:16 (Story)' : '1:1 (Square)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Customization */}
              {template !== 'clean' && (
                <div className="mb-5">
                  <label htmlFor="look-title" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Look Title
                  </label>
                  <input
                    id="look-title"
                    type="text"
                    value={lookTitle}
                    onChange={(e) => setLookTitle(e.target.value)}
                    maxLength={36}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="E.g., Casual Spring Fit"
                  />
                </div>
              )}

              {/* Primary Download & Share Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isGeneratingCanvas}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold rounded-xl bg-gray-900 text-white hover:bg-gray-800 active:scale-98 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <DownloadIcon className="w-4 h-4" />
                  <span>Download High-Resolution Image</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-xl bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300 transition-all shadow-xs cursor-pointer"
                >
                  <FileTextIcon className="w-4 h-4 text-red-600" />
                  <span>Export Styling Lookbook as PDF</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    disabled={isGeneratingCanvas}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 active:scale-98 transition-all border border-gray-300/70 cursor-pointer"
                  >
                    <Share2Icon className="w-4 h-4" />
                    <span>Share Look</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyImage}
                    disabled={isGeneratingCanvas}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 active:scale-98 transition-all border border-gray-300/70 cursor-pointer"
                  >
                    {copySuccess ? (
                      <>
                        <CheckIcon className="w-4 h-4 text-green-600" />
                        <span className="text-green-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon className="w-4 h-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Social Quick Share Links */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                Share directly to social media
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={twitterShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 text-gray-700 hover:text-black bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Share to X (Twitter)"
                  aria-label="Share to X (Twitter)"
                >
                  <TwitterIcon className="w-4 h-4" />
                </a>

                <a
                  href={pinterestShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  title="Pin to Pinterest"
                  aria-label="Pin to Pinterest"
                >
                  <PinterestIcon className="w-4 h-4" />
                </a>

                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                  title="Share via WhatsApp"
                  aria-label="Share via WhatsApp"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                </a>

                <a
                  href={facebookShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Share to Facebook"
                  aria-label="Share to Facebook"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShareModal;
