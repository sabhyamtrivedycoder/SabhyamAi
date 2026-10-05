/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import Logo from './Logo';

interface FooterProps {
  isOnDressingScreen?: boolean;
  onOpenContact?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ isOnDressingScreen = false, onOpenContact }) => {
  // If on virtual dressing studio screen, render compact bottom bar
  if (isOnDressingScreen) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 bg-white/92 backdrop-blur-md border-t border-black/[0.06] py-2 px-4 z-40 hidden sm:block">
        <div className="mx-auto flex items-center justify-between text-xs text-[#6b7280] max-w-6xl">
          <div className="flex items-center gap-2">
            <Logo size="xs" showText={true} />
            <span aria-hidden="true" className="text-gray-300">·</span>
            <span>Virtual Fitting Studio</span>
            <span aria-hidden="true" className="text-gray-300">·</span>
            {onOpenContact ? (
              <button
                type="button"
                onClick={onOpenContact}
                className="text-[#4b5563] hover:text-[#111827] underline transition-colors"
              >
                Contact: sabhyamtrivedy@gmail.com
              </button>
            ) : (
              <a
                href="mailto:sabhyamtrivedy@gmail.com"
                className="text-[#4b5563] hover:text-[#111827] underline transition-colors"
              >
                Contact: sabhyamtrivedy@gmail.com
              </a>
            )}
          </div>
          <span className="text-[11px] text-[#9ca3af]">
            © 2026 Sabhyam AI Solutions Pvt Ltd.
          </span>
        </div>
      </footer>
    );
  }

  // On Landing / Start Screen: Full Editorial Neurapex-Style Footer
  return (
    <footer className="w-full border-t border-black/[0.06] bg-[#fafaf9] pt-16 pb-12 px-6 sm:px-12 text-[#111827]">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Top Company Mission matching Neurapex */}
        <div className="max-w-xl">
          <h3 className="font-serif text-2xl sm:text-3xl text-[#111827] font-normal mb-3">
            Company
          </h3>
          <p className="text-sm text-[#4b5563] leading-relaxed font-sans">
            We&apos;re a company focused on creating generative AI systems aimed at understanding maximum aspects of human proportions, anatomical drape physics, and personal style.
          </p>
        </div>

        {/* Editorial Navigation Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-4 text-sm font-sans">
          {/* Pages */}
          <div className="space-y-3">
            <h4 className="font-serif text-lg text-[#111827] font-normal mb-3">
              Pages
            </h4>
            <ul className="space-y-2.5 text-[#4b5563]">
              <li>
                <span className="hover:text-[#111827] transition-colors cursor-pointer">
                  About
                </span>
              </li>
              <li>
                <span className="hover:text-[#111827] transition-colors cursor-pointer">
                  How it Works
                </span>
              </li>
              <li>
                {onOpenContact ? (
                  <button
                    type="button"
                    onClick={onOpenContact}
                    className="hover:text-[#111827] transition-colors text-left"
                  >
                    Contact
                  </button>
                ) : (
                  <a
                    href="mailto:sabhyamtrivedy@gmail.com"
                    className="hover:text-[#111827] transition-colors"
                  >
                    Contact
                  </a>
                )}
              </li>
            </ul>
          </div>

          {/* Studio Suite */}
          <div className="space-y-3">
            <h4 className="font-serif text-lg text-[#111827] font-normal mb-3">
              Studio
            </h4>
            <ul className="space-y-2.5 text-[#4b5563]">
              <li>
                <label
                  htmlFor="image-upload-start"
                  className="hover:text-[#111827] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Virtual Fitting</span>
                  <span className="text-xs">↗</span>
                </label>
              </li>
              <li>
                <span className="hover:text-[#111827] transition-colors cursor-pointer">
                  Fit & Sizing Calculator
                </span>
              </li>
              <li>
                <span className="hover:text-[#111827] transition-colors cursor-pointer">
                  AI Style Moodboard
                </span>
              </li>
            </ul>
          </div>

          {/* Get in Touch */}
          <div className="space-y-3 col-span-2 sm:col-span-1">
            <h4 className="font-serif text-lg text-[#111827] font-normal mb-3">
              Get in Touch
            </h4>
            <ul className="space-y-2.5 text-[#4b5563]">
              <li>
                <a
                  href="mailto:sabhyamtrivedy@gmail.com"
                  className="hover:text-[#111827] transition-colors underline underline-offset-2"
                >
                  sabhyamtrivedy@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#111827] transition-colors"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Hairline Divider & Centered Copyright matching Neurapex */}
        <div className="pt-8 border-t border-black/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6b7280]">
          <Logo size="xs" showText={true} />
          <p className="tracking-wide">
            © 2026 Sabhyam AI Solutions Pvt Ltd.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;