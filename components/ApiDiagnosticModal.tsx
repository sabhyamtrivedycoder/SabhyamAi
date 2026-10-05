/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, CheckIcon } from './icons';

export interface ApiDiagnosticData {
  status: 'checking' | 'ok' | 'error';
  code?: string;
  message?: string;
  rawError?: string;
  isReachable?: boolean;
  hasApiKey?: boolean;
  maskedKey?: string;
  pingResponse?: string;
  imageModel?: string;
  textModel?: string;
  timestamp?: string;
}

interface ApiDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnosticData: ApiDiagnosticData | null;
  onRecheck: () => Promise<void>;
  isChecking: boolean;
}

export const ApiDiagnosticModal: React.FC<ApiDiagnosticModalProps> = ({
  isOpen,
  onClose,
  diagnosticData,
  onRecheck,
  isChecking,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    const report = JSON.stringify(diagnosticData, null, 2);
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConfigError = diagnosticData?.status === 'error' || diagnosticData?.isReachable === false;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-black/[0.08] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-black/[0.06] bg-[#fafaf9] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  isConfigError ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                }`}
              />
              <div>
                <h3 className="text-xl font-serif text-[#111827] font-semibold flex items-center gap-2">
                  <span>Gemini API Diagnostics</span>
                  {isConfigError && (
                    <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold border border-red-200">
                      Configuration Error
                    </span>
                  )}
                </h3>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  Real-time status check for Google GenAI runtime and virtual try-on engine
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Diagnostic Body */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#374151]">
            {/* Status Summary Banner */}
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                isConfigError
                  ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="text-xl shrink-0 mt-0.5">
                {isConfigError ? '⚠️' : '✅'}
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm">
                  {isConfigError ? 'Configuration Error Detected' : 'Gemini API Connected'}
                </p>
                <p className="text-xs leading-relaxed opacity-90">
                  {diagnosticData?.message || (isChecking ? 'Running live connectivity diagnostics...' : 'No diagnostic data available.')}
                </p>
              </div>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#fafaf9] rounded-2xl border border-black/[0.06]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">
                  GEMINI_API_KEY
                </span>
                <span className="font-mono font-medium text-xs text-gray-900 block">
                  {diagnosticData?.hasApiKey
                    ? `Initialized (${diagnosticData.maskedKey || 'Valid'})`
                    : 'Missing / Not Configured'}
                </span>
              </div>

              <div className="p-3.5 bg-[#fafaf9] rounded-2xl border border-black/[0.06]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">
                  API Reachability
                </span>
                <span className={`font-medium text-xs block ${diagnosticData?.isReachable ? 'text-emerald-700' : 'text-red-600'}`}>
                  {diagnosticData?.isReachable ? 'Reachable & Online' : 'Unreachable / Rate Limited'}
                </span>
              </div>

              <div className="p-3.5 bg-[#fafaf9] rounded-2xl border border-black/[0.06]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">
                  Image Try-On Model
                </span>
                <span className="font-mono text-xs text-gray-800 block">
                  gemini-3.1-flash-image
                </span>
              </div>

              <div className="p-3.5 bg-[#fafaf9] rounded-2xl border border-black/[0.06]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">
                  Smart Canvas Engine
                </span>
                <span className="text-xs font-semibold text-emerald-700 block">
                  Active (Zero-Cost Failover)
                </span>
              </div>
            </div>

            {/* Technical Error Details (if present) */}
            {diagnosticData?.rawError && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                  Diagnostic Log Details:
                </label>
                <div className="p-3 rounded-xl bg-gray-900 text-gray-200 font-mono text-[11px] overflow-x-auto max-h-40 leading-relaxed border border-gray-800">
                  <pre className="whitespace-pre-wrap break-all">{diagnosticData.rawError}</pre>
                </div>
              </div>
            )}

            {/* Explanation & Remediation Guide */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-black/[0.06] space-y-2 text-gray-600 text-xs">
              <p className="font-semibold text-gray-900">How the pipeline works:</p>
              <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                <li>
                  <strong>Primary Engine (Gemini 3.1 Flash Image)</strong>: Generates photorealistic AI try-on images using your Google GenAI key.
                </li>
                <li>
                  <strong>Quota / API Error Failover</strong>: If Google reports <em>429 RESOURCE_EXHAUSTED</em> or if the API key is unreachable, the studio automatically switches to the <strong>Zero-Cost Smart Fitting Engine</strong> so virtual try-ons remain responsive without breaking.
                </li>
                <li>
                  <strong>DevTools Console</strong>: Open your browser Developer Tools Console (`F12` or `Cmd+Option+I`) to view the interactive 6-step breakdown of every try-on execution.
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="p-4 bg-[#fafaf9] border-t border-black/[0.06] flex items-center justify-between">
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 font-medium transition-colors"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied Report</span>
                </>
              ) : (
                <span>Copy Diagnostic Report</span>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRecheck}
                disabled={isChecking}
                className="px-4 py-2 bg-white text-gray-800 hover:text-black border border-black/[0.1] rounded-xl text-xs font-semibold shadow-2xs transition-all active:scale-98 disabled:opacity-50"
              >
                {isChecking ? 'Checking...' : 'Re-test API'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#111827] hover:bg-black text-white rounded-xl text-xs font-semibold transition-all active:scale-98"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ApiDiagnosticModal;
