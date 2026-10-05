/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import Logo from './Logo';

const REMIX_SUGGESTIONS = [
  "Photorealistic 1:1 Face Preservation Guaranteed",
  "Try on Baggy Streetwear, Oversized Tees & Cargos",
  "Export Branded Lookbook PDF Dossiers",
  "AI Silhouette & Drape Styling Assessment",
  "Shop with secret Amazon, Flipkart, and Myntra redirects",
];

interface FooterProps {
  isOnDressingScreen?: boolean;
  onOpenContact?: () => void;
}

const Footer: React.FC<FooterProps> = ({ isOnDressingScreen = false, onOpenContact }) => {
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestionIndex((prevIndex) => (prevIndex + 1) % REMIX_SUGGESTIONS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <footer className={`fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200/80 py-2.5 px-4 z-50 ${isOnDressingScreen ? 'hidden sm:block' : ''}`}>
      <div className="mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 max-w-7xl gap-2">
        <div className="flex items-center gap-2">
          <Logo size="xs" showText={true} />
          <span className="text-gray-400">·</span>
          <span className="text-[11px] text-gray-500 font-medium">Virtual Studio</span>
          <span className="text-gray-400">·</span>
          {onOpenContact ? (
            <button
              type="button"
              onClick={onOpenContact}
              className="text-[11px] text-purple-700 hover:text-purple-950 font-semibold underline"
            >
              Contact Us: sabhyamtrivedy@gmail.com
            </button>
          ) : (
            <a
              href="mailto:sabhyamtrivedy@gmail.com"
              className="text-[11px] text-purple-700 hover:text-purple-950 font-semibold underline"
            >
              Contact: sabhyamtrivedy@gmail.com
            </a>
          )}
        </div>
        <div className="h-4 mt-1 sm:mt-0 flex items-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={suggestionIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="text-center sm:text-right"
              >
                {REMIX_SUGGESTIONS[suggestionIndex]}
              </motion.p>
            </AnimatePresence>
        </div>
      </div>
    </footer>
  );
};

export default Footer;