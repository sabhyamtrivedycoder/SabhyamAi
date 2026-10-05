/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Extract garments worn (excluding base model layer 0)
  const garmentsWorn = activeLayers
    .slice(1)
    .map((layer) => layer.garment)
    .filter(Boolean);

  // Helper to load an image safely into an HTMLImageElement
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // Only set crossOrigin if not a data URL or blob URL to avoid taint issues
      if (!url.startsWith('data:') && !url.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = url;
    });
  };

  // Generate high-resolution preview canvas
  const renderShareCard = useCallback(async () => {
    if (!currentImageUrl) return;

    setIsGeneratingCanvas(true);
    try {
      let width = 1080;
      let height = 1350; // default 4:5
      if (aspectRatio === '9:16') {
        width = 1080;
        height = 1920;
      } else if (aspectRatio === '1:1') {
        width = 1080;
        height = 1080;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw background
      ctx.fillStyle = '#f8f8f9';
      ctx.fillRect(0, 0, width, height);

      const mainImg = await loadImage(currentImageUrl);

      if (template === 'clean') {
        // Full bleed clean image with aspect ratio fit
        const scale = Math.max(width / mainImg.width, height / mainImg.height);
        const nw = mainImg.width * scale;
        const nh = mainImg.height * scale;
        const ox = (width - nw) / 2;
        const oy = (height - nh) / 2;

        ctx.drawImage(mainImg, ox, oy, nw, nh);

        // Subtle watermark badge in bottom-right
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        const badgeWidth = 240;
        const badgeHeight = 44;
        const badgeX = width - badgeWidth - 40;
        const badgeY = height - badgeHeight - 40;
        ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 22);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 18px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Styled with Sabhyam Ai', badgeX + badgeWidth / 2, badgeY + 28);
      } else if (template === 'before_after' && baseModelUrl) {
        // Split comparison before & after
        const baseImg = await loadImage(baseModelUrl);

        // Header
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 36px "Instrument Serif", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('SABHYAM AI · STYLE TRANSFORMATION', width / 2, 70);

        ctx.fillStyle = '#6b7280';
        ctx.font = '500 18px Inter, sans-serif';
        ctx.fillText(lookTitle, width / 2, 105);

        // Two columns
        const pad = 40;
        const topGap = 130;
        const bottomGap = 100;
        const availH = height - topGap - bottomGap;
        const colW = (width - pad * 3) / 2;

        // Draw Before (Left)
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(pad, topGap, colW, availH, 16);
        ctx.clip();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(pad, topGap, colW, availH);

        const s1 = Math.max(colW / baseImg.width, availH / baseImg.height);
        const w1 = baseImg.width * s1;
        const h1 = baseImg.height * s1;
        ctx.drawImage(baseImg, pad + (colW - w1) / 2, topGap + (availH - h1) / 2, w1, h1);
        ctx.restore();

        // Left Label
        ctx.fillStyle = 'rgba(17, 24, 39, 0.8)';
        ctx.beginPath();
        ctx.roundRect(pad + 16, topGap + 16, 120, 36, 18);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BEFORE', pad + 16 + 60, topGap + 16 + 23);

        // Draw After (Right)
        const col2X = pad * 2 + colW;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(col2X, topGap, colW, availH, 16);
        ctx.clip();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(col2X, topGap, colW, availH);

        const s2 = Math.max(colW / mainImg.width, availH / mainImg.height);
        const w2 = mainImg.width * s2;
        const h2 = mainImg.height * s2;
        ctx.drawImage(mainImg, col2X + (colW - w2) / 2, topGap + (availH - h2) / 2, w2, h2);
        ctx.restore();

        // Right Label
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.roundRect(col2X + 16, topGap + 16, 120, 36, 18);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('STYLED', col2X + 16 + 60, topGap + 16 + 23);

        // Footer
        ctx.fillStyle = '#9ca3af';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Virtual Try-On Experience · Sabhyam Ai', width / 2, height - 40);
      } else {
        // Editorial Lookbook Card Template
        // Outer card frame
        const margin = 48;
        const cardX = margin;
        const cardY = margin;
        const cardW = width - margin * 2;
        const cardH = height - margin * 2;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 24);
        ctx.fill();

        // Subtle hairline border
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Header Section
        const contentX = cardX + 44;
        const contentW = cardW - 88;
        let curY = cardY + 56;

        ctx.fillStyle = '#111827';
        ctx.font = 'bold 42px "Instrument Serif", Georgia, serif';
        ctx.textAlign = 'left';
        ctx.fillText('SABHYAM AI', contentX, curY);

        ctx.fillStyle = '#9ca3af';
        ctx.font = '500 15px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }), cardX + cardW - 44, curY - 10);

        curY += 28;
        ctx.fillStyle = '#4b5563';
        ctx.font = '500 16px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`LOOKBOOK · ${lookTitle.toUpperCase()}`, contentX, curY);

        curY += 24;
        // Divider
        ctx.strokeStyle = '#f3f4f6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(contentX, curY);
        ctx.lineTo(cardX + cardW - 44, curY);
        ctx.stroke();

        curY += 24;

        // Image container box
        const footerHeight = garmentsWorn.length > 0 ? 160 : 80;
        const imgBoxH = cardY + cardH - curY - footerHeight;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(contentX, curY, contentW, imgBoxH, 16);
        ctx.clip();
        ctx.fillStyle = '#f9fafb';
        ctx.fillRect(contentX, curY, contentW, imgBoxH);

        const imgScale = Math.min(contentW / mainImg.width, imgBoxH / mainImg.height);
        const dw = mainImg.width * imgScale;
        const dh = mainImg.height * imgScale;
        const dx = contentX + (contentW - dw) / 2;
        const dy = curY + (imgBoxH - dh) / 2;
        ctx.drawImage(mainImg, dx, dy, dw, dh);
        ctx.restore();

        // Pose tag badge on image
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        const poseText = `Pose: ${currentPoseName}`;
        ctx.font = '500 13px Inter, sans-serif';
        const poseMeasure = ctx.measureText(poseText);
        const poseW = poseMeasure.width + 24;
        ctx.roundRect(contentX + 16, curY + 16, poseW, 28, 14);
        ctx.fill();
        ctx.fillStyle = '#1f2937';
        ctx.fillText(poseText, contentX + 28, curY + 35);

        curY += imgBoxH + 24;

        // Garments Worn Section
        if (garmentsWorn.length > 0) {
          ctx.fillStyle = '#6b7280';
          ctx.font = 'bold 12px Inter, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('GARMENTS IN THIS LOOK', contentX, curY);
          curY += 16;

          // Render garments horizontally
          let gx = contentX;
          for (let i = 0; i < Math.min(garmentsWorn.length, 3); i++) {
            const item = garmentsWorn[i];
            if (!item) continue;
            try {
              const gImg = await loadImage(item.url);
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(gx, curY, 44, 44, 8);
              ctx.clip();
              ctx.drawImage(gImg, gx, curY, 44, 44);
              ctx.restore();

              ctx.strokeStyle = '#e5e7eb';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(gx, curY, 44, 44, 8);
              ctx.stroke();

              ctx.fillStyle = '#1f2937';
              ctx.font = '600 14px Inter, sans-serif';
              ctx.fillText(item.name, gx + 54, curY + 22);

              ctx.fillStyle = '#9ca3af';
              ctx.font = '12px Inter, sans-serif';
              ctx.fillText('Virtual Try-On', gx + 54, curY + 38);

              gx += 250;
            } catch {
              // Ignore garment load error
            }
          }
        } else {
          ctx.fillStyle = '#9ca3af';
          ctx.font = '14px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('AI Fashion Model · Virtual Studio fitting', width / 2, curY + 20);
        }
      }

      // Convert canvas to Blob URL for real-time preview
      canvas.toBlob((blob) => {
        if (blob) {
          if (previewBlobUrl) {
            URL.revokeObjectURL(previewBlobUrl);
          }
          const url = URL.createObjectURL(blob);
          setPreviewBlobUrl(url);
        }
        setIsGeneratingCanvas(false);
      }, 'image/png');

      canvasRef.current = canvas;
    } catch (err) {
      console.error('Error generating share preview card:', err);
      // Fallback: use direct image URL
      setPreviewBlobUrl(currentImageUrl);
      setIsGeneratingCanvas(false);
    }
  }, [currentImageUrl, baseModelUrl, template, aspectRatio, lookTitle, currentPoseName, garmentsWorn]);

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

  // Download Handler
  const handleDownload = () => {
    if (!previewBlobUrl && !currentImageUrl) return;

    const link = document.createElement('a');
    link.href = previewBlobUrl || currentImageUrl;
    const sanitizedTitle = lookTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.download = `sabhyam-ai-${sanitizedTitle}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShareFeedback('Image downloaded successfully!');
    setTimeout(() => setShareFeedback(null), 3500);
  };

  // Export as PDF Lookbook Dossier
  const handleExportPDF = () => {
    const printableWindow = window.open('', '_blank');
    if (!printableWindow) {
      setShareFeedback('Please allow popups to export PDF lookbook.');
      setTimeout(() => setShareFeedback(null), 3000);
      return;
    }

    const garmentCardsHtml = garmentsWorn
      .map(
        (g) => `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px; background: #fafafa; padding: 10px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <img src="${g?.url}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px;" />
          <div>
            <div style="font-weight: 600; font-size: 13px; color: #111;">${g?.name}</div>
            <div style="font-size: 11px; color: #6b7280;">Virtual Try-On Layer</div>
          </div>
        </div>
      `
      )
      .join('');

    printableWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${lookTitle} - Sabhyam Ai Lookbook Dossier</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1f2937; margin: 0; padding: 24px; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #111827; padding-bottom: 16px; margin-bottom: 24px; }
            .brand { font-size: 30px; font-weight: 800; font-family: Georgia, serif; letter-spacing: 2px; color: #111827; }
            .sub { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
            .image-box { border-radius: 14px; overflow: hidden; background: #f3f4f6; text-align: center; border: 1px solid #e5e7eb; padding: 12px; }
            .image-box img { max-width: 100%; max-height: 480px; object-fit: contain; border-radius: 8px; }
            .details { display: flex; flex-direction: column; justify-content: space-between; }
            .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4b5563; letter-spacing: 1.2px; margin-bottom: 8px; }
            .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; background: #f9fafb; padding: 14px; border-radius: 10px; font-size: 12px; border: 1px solid #e5e7eb; }
            .stat-val { font-weight: 600; color: #111827; }
            .footer { margin-top: 36px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">SABHYAM AI</div>
              <div class="sub">Personal Virtual Fitting & Styling Dossier</div>
            </div>
            <div style="font-size: 12px; color: #6b7280; text-align: right;">
              <div>Date: ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
              <div style="font-weight: 600; color: #111827; margin-top: 2px;">Sabhyam Virtual Studio</div>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 24px; color: #111827; font-family: Georgia, serif;">${lookTitle}</h2>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Pose: ${currentPoseName} · 1:1 Accurate Face & Silhouette</div>
          </div>

          <div class="grid">
            <div class="image-box">
              <img src="${previewBlobUrl || currentImageUrl}" alt="Styled Look" />
            </div>

            <div class="details">
              <div>
                ${
                  measurements
                    ? `
                  <div class="section-title">Client Fit Proportions</div>
                  <div class="stats">
                    <div>Height: <span class="stat-val">${measurements.height}</span></div>
                    <div>Weight: <span class="stat-val">${measurements.weight}</span></div>
                    <div>Build: <span class="stat-val">${measurements.bodyType}</span></div>
                    <div>Silhouette: <span class="stat-val">${measurements.gender}</span></div>
                  </div>
                `
                    : ''
                }

                <div class="section-title">Ensemble Components</div>
                ${garmentCardsHtml || '<div style="font-size: 12px; color: #6b7280;">Base model layer active.</div>'}
              </div>

              <div class="footer">
                <span>Sabhyam Ai · Photorealistic Face Fidelity Guaranteed</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printableWindow.document.close();
    setShareFeedback('Lookbook opened for printing / PDF saving!');
    setTimeout(() => setShareFeedback(null), 3500);
  };

  // Native Web Share API Handler
  const handleNativeShare = async () => {
    setShareFeedback(null);
    try {
      const shareDataText = `Check out my outfit created with Sabhyam Ai! Worn: ${
        garmentsWorn.map((g) => g?.name).join(', ') || 'Custom styling'
      }`;

      // Try file sharing if canvas is available
      if (canvasRef.current && navigator.canShare) {
        canvasRef.current.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'sabhyam-ai-look.png', { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              try {
                await navigator.share({
                  title: lookTitle,
                  text: shareDataText,
                  files: [file],
                });
                setShareFeedback('Shared successfully!');
                setTimeout(() => setShareFeedback(null), 3000);
                return;
              } catch (e) {
                if ((e as Error).name !== 'AbortError') {
                  console.error('Native file share failed, falling back:', e);
                }
              }
            }
          }

          // Fallback to text/url sharing
          if (navigator.share) {
            await navigator.share({
              title: lookTitle,
              text: shareDataText,
              url: window.location.href,
            });
            setShareFeedback('Shared successfully!');
            setTimeout(() => setShareFeedback(null), 3000);
          }
        }, 'image/png');
      } else if (navigator.share) {
        await navigator.share({
          title: lookTitle,
          text: shareDataText,
          url: window.location.href,
        });
        setShareFeedback('Shared successfully!');
        setTimeout(() => setShareFeedback(null), 3000);
      } else {
        // Fallback: copy link
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
    if (!canvasRef.current) {
      // Fallback: copy link
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
      return;
    }

    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        try {
          // Write PNG blob directly to clipboard
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
          setCopySuccess(true);
          setShareFeedback('Image copied to clipboard! Paste it into messages or documents.');
          setTimeout(() => {
            setCopySuccess(false);
            setShareFeedback(null);
          }, 3500);
        } catch {
          // Fallback if browser forbids image write
          await navigator.clipboard.writeText(window.location.href);
          setCopySuccess(true);
          setShareFeedback('Link copied to clipboard!');
          setTimeout(() => {
            setCopySuccess(false);
            setShareFeedback(null);
          }, 3000);
        }
      }, 'image/png');
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
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
            className="absolute top-4 right-4 z-20 p-2 text-gray-500 hover:text-gray-900 bg-white/80 hover:bg-gray-100 rounded-full transition-colors backdrop-blur-xs"
            aria-label="Close share dialog"
          >
            <XIcon className="w-5 h-5" />
          </button>

          {/* Left Column: Real-time Preview */}
          <div className="md:w-1/2 bg-gray-50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-200 min-h-[360px] md:min-h-[520px]">
            <div className="w-full max-w-sm flex flex-col items-center">
              <span className="text-xs font-semibold text-gray-600 mb-2">Live Preview Card</span>
              <div className="relative w-full aspect-[4/5] bg-gray-200 rounded-xl overflow-hidden shadow-md flex items-center justify-center border border-gray-300/80">
                {isGeneratingCanvas ? (
                  <div className="flex flex-col items-center gap-2">
                    <Spinner />
                    <span className="text-xs text-gray-600">Generating preview card...</span>
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
                  Export an editorial card or high-res photo to share with friends and social media.
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
                    className={`py-2 px-2.5 text-xs font-semibold rounded-lg border text-center transition-all ${
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
                    className={`py-2 px-2.5 text-xs font-semibold rounded-lg border text-center transition-all ${
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
                    className={`py-2 px-2.5 text-xs font-semibold rounded-lg border text-center transition-all ${
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
                      className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
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
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold rounded-xl bg-gray-900 text-white hover:bg-gray-800 active:scale-98 transition-all shadow-md disabled:opacity-50"
                >
                  <DownloadIcon className="w-4 h-4" />
                  <span>Download High-Resolution Image</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-xl bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300 transition-all shadow-xs"
                >
                  <FileTextIcon className="w-4 h-4 text-red-600" />
                  <span>Export Styling Lookbook as PDF</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    disabled={isGeneratingCanvas}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 active:scale-98 transition-all border border-gray-300/70"
                  >
                    <Share2Icon className="w-4 h-4" />
                    <span>Share Look</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyImage}
                    disabled={isGeneratingCanvas}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 active:scale-98 transition-all border border-gray-300/70"
                  >
                    {copySuccess ? (
                      <>
                        <CheckIcon className="w-4 h-4 text-green-600" />
                        <span className="text-green-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon className="w-4 h-4" />
                        <span>Copy Image</span>
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
