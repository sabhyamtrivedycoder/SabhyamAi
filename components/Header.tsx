/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import Logo from './Logo';

interface HeaderProps {
  onOpenContact?: () => void;
  onOpenAuth?: () => void;
  onStartOver?: () => void;
  isOnDressingScreen?: boolean;
  isConfigError?: boolean;
  onOpenDiagnostic?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenContact,
  onOpenAuth,
  onStartOver,
  isOnDressingScreen = false,
  isConfigError = false,
  onOpenDiagnostic,
}) => {
  return (
    <header className="w-full fixed top-4 left-0 right-0 z-40 px-3 sm:px-6 pointer-events-none">
      <div className="max-w-4xl mx-auto bg-white/92 backdrop-blur-md rounded-2xl sm:rounded-full border border-black/[0.06] shadow-[0_6px_24px_rgba(0,0,0,0.04)] py-2.5 px-4 sm:px-6 flex items-center justify-between pointer-events-auto transition-all">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onStartOver}
            className="hover:opacity-90 transition-opacity flex items-center text-left"
          >
            <Logo size="sm" showText={true} />
          </button>

          {/* Diagnostic Error Badge if API is unreachable */}
          {isConfigError && onOpenDiagnostic && (
            <button
              type="button"
              onClick={onOpenDiagnostic}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold transition-all ml-2"
              title="Click to view Gemini API Diagnostics"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              <span>Configuration Error</span>
            </button>
          )}
        </div>

        {/* Right side controls matching Neurapex */}
        <div className="flex items-center gap-2.5 sm:gap-4 text-xs font-medium text-[#4b5563]">
          {onOpenDiagnostic && (
            <button
              type="button"
              onClick={onOpenDiagnostic}
              className={`hover:text-[#111827] transition-colors flex items-center gap-1 ${
                isConfigError ? 'text-amber-800 font-semibold sm:hidden' : 'text-gray-500'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isConfigError ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              <span>{isConfigError ? 'Config Error' : 'Diagnostics'}</span>
            </button>
          )}

          {onOpenContact && (
            <button
              type="button"
              onClick={onOpenContact}
              className="hover:text-[#111827] transition-colors"
            >
              Contact
            </button>
          )}

          {/* Elevated Pill Button matching Neurapex's "Try Sentis" */}
          {isOnDressingScreen ? (
            onStartOver && (
              <button
                type="button"
                onClick={onStartOver}
                className="px-4 py-1.5 rounded-full bg-white text-[#374151] hover:text-[#111827] border border-black/[0.08] shadow-[0_3px_14px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-all active:scale-98"
              >
                New Model
              </button>
            )
          ) : (
            <label
              htmlFor="image-upload-start"
              className="px-4 py-1.5 rounded-full bg-white text-[#374151] hover:text-[#111827] border border-black/[0.08] shadow-[0_3px_14px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-all cursor-pointer active:scale-98"
            >
              Try Fitting
            </label>
          )}

          {/* Minimal 3-line hamburger menu icon */}
          {onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="p-1 text-[#6b7280] hover:text-[#111827] transition-colors"
              title="Account & Profile"
            >
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="1" y1="2" x2="17" y2="2" />
                <line x1="1" y1="7" x2="17" y2="7" />
                <line x1="1" y1="12" x2="17" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;