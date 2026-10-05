/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { StyleMoodboard, StyleMoodboardPrompt } from '../services/geminiService';
import { SparklesIcon, CheckIcon } from './icons';
import Spinner from './Spinner';

interface StyleMoodboardViewProps {
  moodboard: StyleMoodboard | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const StyleMoodboardView: React.FC<StyleMoodboardViewProps> = ({
  moodboard,
  isLoading,
  onRefresh,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div className="space-y-5 text-gray-900">
      {/* Moodboard Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-900 via-purple-950 to-gray-900 text-white rounded-2xl border border-purple-800/40 shadow-md">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-pink-300">
            AI Lifestyle Moodboard
          </span>
          <h4 className="text-base font-serif font-bold text-white mt-0.5">
            {moodboard?.aestheticTitle || 'Streetwear Editorial Aesthetics'}
          </h4>
          <p className="text-xs text-purple-200 mt-0.5 line-clamp-2">
            {moodboard?.vibeSummary ||
              'Four AI lifestyle scene prompts capturing your outfit in cinematic photography environments.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/35 border border-pink-400/40 text-pink-200 hover:text-white text-xs font-semibold shrink-0 transition-all disabled:opacity-50 flex items-center gap-1.5 ml-3"
        >
          <SparklesIcon className="w-3.5 h-3.5 text-pink-300" />
          <span>{isLoading ? 'Generating...' : 'Refresh'}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-14 flex flex-col items-center justify-center text-center">
          <Spinner />
          <p className="text-sm font-serif text-gray-800 mt-4">
            Curating 4 AI lifestyle image prompts for your aesthetic...
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Analyzing lighting physics, architectural textures, and outfit draping.
          </p>
        </div>
      ) : moodboard && moodboard.prompts?.length > 0 ? (
        <div className="grid grid-cols-1 gap-3.5">
          {moodboard.prompts.map((item: StyleMoodboardPrompt, idx: number) => {
            const isCopied = copiedIndex === idx;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl border border-gray-200 bg-white hover:border-purple-300 transition-all shadow-xs space-y-3"
              >
                {/* Scene title & color chips */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                        0{idx + 1}
                      </span>
                      <h5 className="text-xs font-bold text-gray-900 tracking-tight">
                        {item.sceneTitle}
                      </h5>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 ml-7">
                      {item.settingVibe}
                    </p>
                  </div>

                  {/* Palette swatches */}
                  {item.colorPalette && item.colorPalette.length > 0 && (
                    <div className="flex items-center gap-1 shrink-0">
                      {item.colorPalette.map((c, i) => (
                        <span
                          key={i}
                          style={{ backgroundColor: c }}
                          className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block shadow-2xs"
                          title={c}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Styling Focus Pill */}
                <div className="bg-purple-50/70 p-2 rounded-lg border border-purple-100 text-[11px] text-purple-900 flex items-center gap-1.5">
                  <span className="font-bold shrink-0">Focus:</span>
                  <span className="truncate">{item.stylingFocus}</span>
                </div>

                {/* The Photographic AI Prompt */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200/80 text-[11px] text-gray-700 font-mono leading-relaxed relative group">
                  <p className="line-clamp-4">{item.prompt}</p>
                </div>

                {/* Copy button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleCopy(item.prompt, idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isCopied
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <CheckIcon className="w-3.5 h-3.5" />
                        <span>Prompt Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-3.5 h-3.5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" strokeWidth="2" />
                          <path
                            d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
                            strokeWidth="2"
                          />
                        </svg>
                        <span>Copy AI Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default StyleMoodboardView;
