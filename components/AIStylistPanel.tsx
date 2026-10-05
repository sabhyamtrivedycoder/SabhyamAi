/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIStyleAdvice, OutfitLayer, UserMeasurements, WardrobeItem, SavedLook } from '../types';
import {
  generateAIStyleAdvice,
  generateBaggyAccessoryTips,
  generateStyleMoodboard,
  BaggyAccessoryAdvice,
  StyleMoodboard,
} from '../services/geminiService';
import { SparklesIcon, XIcon, CheckIcon, RulerIcon, SlidersIcon } from './icons';
import Spinner from './Spinner';
import { calculateBaggyFit, SizeRecommendation } from '../lib/fitCalculator';
import { defaultWardrobe } from '../wardrobe';
import FitSilhouetteTooltip from './FitSilhouetteTooltip';
import VisualSizeComparison from './VisualSizeComparison';
import StyleMoodboardView from './StyleMoodboardView';
import SavedLookComparisonView from './SavedLookComparisonView';

interface AIStylistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageUrl: string;
  activeLayers: OutfitLayer[];
  measurements?: UserMeasurements;
  onUpdateMeasurements?: (newMeasurements: UserMeasurements) => void;
  savedLooks?: SavedLook[];
  onSelectSavedLook?: (look: SavedLook) => void;
}

export const AIStylistPanel: React.FC<AIStylistPanelProps> = ({
  isOpen,
  onClose,
  currentImageUrl,
  activeLayers,
  measurements,
  onUpdateMeasurements,
  savedLooks = [],
  onSelectSavedLook,
}) => {
  // Navigation Tabs: 'fit_calculator' | 'moodboard' | 'compare_looks' | 'style_critique'
  const [activeTab, setActiveTab] = useState<'fit_calculator' | 'moodboard' | 'compare_looks' | 'style_critique'>('fit_calculator');

  // AI Style Advice state
  const [advice, setAdvice] = useState<AIStyleAdvice | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);

  // Style Moodboard state
  const [moodboard, setMoodboard] = useState<StyleMoodboard | null>(null);
  const [isLoadingMoodboard, setIsLoadingMoodboard] = useState(false);

  // Fit Calculator interactive states
  const [heightValue, setHeightValue] = useState<string>(measurements?.height || "5'10\" (178 cm)");
  const [weightValue, setWeightValue] = useState<string>(measurements?.weight || "160 lbs (72 kg)");
  const [buildType, setBuildType] = useState<'Slim' | 'Athletic' | 'Average' | 'Curvy' | 'Plus'>(
    measurements?.bodyType || 'Average'
  );
  const [fitPreference, setFitPreference] = useState<'tailored' | 'signature' | 'extreme'>('signature');
  const [selectedGarmentId, setSelectedGarmentId] = useState<string>('');
  const [hasSavedNotice, setHasSavedNotice] = useState<boolean>(false);

  // Tooltip & Accessory state
  const [isSilhouetteTooltipOpen, setIsSilhouetteTooltipOpen] = useState(false);
  const [accessoryTips, setAccessoryTips] = useState<BaggyAccessoryAdvice | null>(null);
  const [isLoadingAccessoryTips, setIsLoadingAccessoryTips] = useState(false);

  // Garments worn in active layers
  const garmentsWorn = useMemo(() => {
    return activeLayers
      .slice(1)
      .map((l) => l.garment)
      .filter(Boolean) as WardrobeItem[];
  }, [activeLayers]);

  // Available garments for calculation: worn garments first, or fallback to default baggy garments
  const availableGarments = useMemo(() => {
    if (garmentsWorn.length > 0) return garmentsWorn;
    return defaultWardrobe.filter((item) => item.category === 'baggy').slice(0, 4);
  }, [garmentsWorn]);

  // Selected item
  const activeGarment = useMemo(() => {
    if (selectedGarmentId) {
      const found = availableGarments.find((g) => g.id === selectedGarmentId);
      if (found) return found;
    }
    return availableGarments[0] || null;
  }, [availableGarments, selectedGarmentId]);

  // Real-time Fit Calculator Result
  const fitRecommendation: SizeRecommendation = useMemo(() => {
    return calculateBaggyFit(
      heightValue,
      weightValue,
      buildType,
      activeGarment,
      fitPreference
    );
  }, [heightValue, weightValue, buildType, activeGarment, fitPreference]);

  // Personalized Gemini Accessory Tip generator
  const fetchAccessoryTips = useCallback(async () => {
    setIsLoadingAccessoryTips(true);
    try {
      const tips = await generateBaggyAccessoryTips(
        fitRecommendation.recommendedSize,
        fitRecommendation.fitStyle,
        fitRecommendation.garmentName,
        {
          height: heightValue,
          weight: weightValue,
          bodyType: buildType,
        }
      );
      setAccessoryTips(tips);
    } catch (e) {
      console.warn('Could not generate accessory tips:', e);
    } finally {
      setIsLoadingAccessoryTips(false);
    }
  }, [
    fitRecommendation.recommendedSize,
    fitRecommendation.fitStyle,
    fitRecommendation.garmentName,
    heightValue,
    weightValue,
    buildType,
  ]);

  // Gemini Style Moodboard generator
  const fetchMoodboard = useCallback(async () => {
    setIsLoadingMoodboard(true);
    try {
      const board = await generateStyleMoodboard(
        garmentsWorn.length > 0 ? garmentsWorn : [activeGarment!].filter(Boolean),
        {
          height: heightValue,
          weight: weightValue,
          bodyType: buildType,
          gender: measurements?.gender || 'Unisex',
          styleVibe: measurements?.styleVibe || 'Streetwear',
        }
      );
      setMoodboard(board);
    } catch (e) {
      console.warn('Could not generate style moodboard:', e);
    } finally {
      setIsLoadingMoodboard(false);
    }
  }, [garmentsWorn, activeGarment, heightValue, weightValue, buildType, measurements]);

  // Auto-fetch accessory tips whenever recommended size or garment changes
  useEffect(() => {
    if (isOpen && activeTab === 'fit_calculator') {
      fetchAccessoryTips();
    }
  }, [fitRecommendation.recommendedSize, activeGarment?.id, buildType, fitPreference, isOpen]);

  // Auto-fetch moodboard when tab opened if not yet generated
  useEffect(() => {
    if (isOpen && activeTab === 'moodboard' && !moodboard && !isLoadingMoodboard) {
      fetchMoodboard();
    }
  }, [isOpen, activeTab, moodboard]);

  // Fetch AI Style Advice
  const fetchAdvice = async () => {
    if (!currentImageUrl) return;
    setIsLoadingAdvice(true);
    setAdviceError(null);
    try {
      const result = await generateAIStyleAdvice(
        currentImageUrl,
        garmentsWorn,
        {
          height: heightValue,
          weight: weightValue,
          bodyType: buildType,
          gender: measurements?.gender || "Men's",
          styleVibe: measurements?.styleVibe || 'Streetwear',
        }
      );
      setAdvice(result);
    } catch (err: any) {
      setAdviceError(err?.message || 'Could not analyze style.');
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  // Sync measurements if changed
  const handleSaveMeasurements = () => {
    if (onUpdateMeasurements) {
      onUpdateMeasurements({
        height: heightValue,
        weight: weightValue,
        bodyType: buildType,
        gender: measurements?.gender || 'Unisex',
        styleVibe: measurements?.styleVibe || 'Baggy Streetwear',
      });
      setHasSavedNotice(true);
      setTimeout(() => setHasSavedNotice(false), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <>
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
            <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-800 text-white flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 shadow-inner">
                    {activeTab === 'fit_calculator' ? (
                      <RulerIcon className="w-5 h-5 text-pink-400" />
                    ) : activeTab === 'moodboard' ? (
                      <span className="text-xl">📸</span>
                    ) : activeTab === 'compare_looks' ? (
                      <span className="text-xl">⚖️</span>
                    ) : (
                      <SparklesIcon className="w-5 h-5 text-amber-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-white tracking-tight">
                      {activeTab === 'fit_calculator'
                        ? 'AI Fit & Sizing Calculator'
                        : activeTab === 'moodboard'
                        ? 'Style Moodboard Prompts'
                        : activeTab === 'compare_looks'
                        ? 'Side-by-Side Look Comparison'
                        : 'Sabhyamai AI Style Consultant'}
                    </h3>
                    <p className="text-xs text-gray-300 mt-0.5">
                      {activeTab === 'fit_calculator'
                        ? 'Optimal baggy sizing & drape physics for your exact build'
                        : activeTab === 'moodboard'
                        ? 'Four curated AI lifestyle photography prompts for this aesthetic'
                        : activeTab === 'compare_looks'
                        ? 'Gemini analysis of proportions, palette, and occasion differences'
                        : 'Color harmony, silhouette drape, and styling tips'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs (4 Options) */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-black/40 rounded-xl border border-white/10 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('fit_calculator')}
                  className={`py-2 px-1.5 rounded-lg flex items-center justify-center gap-1 transition-all truncate ${
                    activeTab === 'fit_calculator'
                      ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-md font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Fit & Size Calculator"
                >
                  <RulerIcon className="w-3 h-3 shrink-0" />
                  <span className="truncate">Fit Calc</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('moodboard');
                    if (!moodboard && !isLoadingMoodboard) fetchMoodboard();
                  }}
                  className={`py-2 px-1.5 rounded-lg flex items-center justify-center gap-1 transition-all truncate ${
                    activeTab === 'moodboard'
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Style Moodboard"
                >
                  <span className="text-xs">📸</span>
                  <span className="truncate">Moodboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('compare_looks')}
                  className={`py-2 px-1.5 rounded-lg flex items-center justify-center gap-1 transition-all truncate ${
                    activeTab === 'compare_looks'
                      ? 'bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-md font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Compare Two Saved Looks"
                >
                  <span className="text-xs">⚖️</span>
                  <span className="truncate">Compare</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('style_critique');
                    if (!advice && !isLoadingAdvice) fetchAdvice();
                  }}
                  className={`py-2 px-1.5 rounded-lg flex items-center justify-center gap-1 transition-all truncate ${
                    activeTab === 'style_critique'
                      ? 'bg-white text-gray-900 shadow-md font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="AI Style Critique"
                >
                  <SparklesIcon className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate">Critique</span>
                </button>
              </div>
            </div>

            {/* Body Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-grow text-gray-900">
              {activeTab === 'fit_calculator' ? (
                <div className="space-y-6">
                  {/* Garment Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Garment to Size
                      </label>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {garmentsWorn.length > 0 ? 'Selected from outfit' : 'Popular Streetwear'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {availableGarments.map((g) => {
                        const isSelected = activeGarment?.id === g.id;
                        return (
                          <button
                            key={g.id}
                            onClick={() => setSelectedGarmentId(g.id)}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all text-xs ${
                              isSelected
                                ? 'border-purple-600 bg-purple-50/70 text-purple-950 font-semibold shadow-xs ring-1 ring-purple-500'
                                : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                            }`}
                          >
                            <img
                              src={g.url}
                              alt={g.name}
                              className="w-9 h-9 rounded-lg object-cover bg-gray-100 shrink-0"
                            />
                            <div className="truncate">
                              <p className="truncate font-medium">{g.name}</p>
                              <p className="text-[10px] text-gray-600 capitalize">
                                {g.category || 'Streetwear'}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Biometrics Input Section */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                        <SlidersIcon className="w-3.5 h-3.5 text-gray-600" />
                        <span>Your Physical Proportions</span>
                      </span>
                      {onUpdateMeasurements && (
                        <button
                          onClick={handleSaveMeasurements}
                          className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 underline"
                        >
                          {hasSavedNotice ? 'Saved to Profile!' : 'Save as default'}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Height */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Height
                        </label>
                        <select
                          value={heightValue}
                          onChange={(e) => setHeightValue(e.target.value)}
                          className="w-full text-xs font-medium p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                        >
                          <option value="5'4&quot; (163 cm)">5&apos;4&quot; (163 cm)</option>
                          <option value="5'6&quot; (168 cm)">5&apos;6&quot; (168 cm)</option>
                          <option value="5'8&quot; (173 cm)">5&apos;8&quot; (173 cm)</option>
                          <option value="5'10&quot; (178 cm)">5&apos;10&quot; (178 cm) - Average</option>
                          <option value="6'0&quot; (183 cm)">6&apos;0&quot; (183 cm)</option>
                          <option value="6'2&quot; (188 cm)">6&apos;2&quot; (188 cm)</option>
                          <option value="6'4&quot; (193 cm)">6&apos;4&quot; (193 cm)</option>
                        </select>
                      </div>

                      {/* Weight */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Weight
                        </label>
                        <select
                          value={weightValue}
                          onChange={(e) => setWeightValue(e.target.value)}
                          className="w-full text-xs font-medium p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                        >
                          <option value="125 lbs (57 kg)">125 lbs (57 kg)</option>
                          <option value="140 lbs (64 kg)">140 lbs (64 kg)</option>
                          <option value="155 lbs (70 kg)">155 lbs (70 kg)</option>
                          <option value="170 lbs (77 kg)">170 lbs (77 kg)</option>
                          <option value="185 lbs (84 kg)">185 lbs (84 kg)</option>
                          <option value="205 lbs (93 kg)">205 lbs (93 kg)</option>
                          <option value="225 lbs (102 kg)">225 lbs (102 kg)</option>
                        </select>
                      </div>
                    </div>

                    {/* Build Type Pills */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">
                        Body Build / Silhouette
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {(['Slim', 'Athletic', 'Average', 'Curvy', 'Plus'] as const).map((b) => (
                          <button
                            key={b}
                            onClick={() => setBuildType(b)}
                            className={`py-1.5 text-center text-xs font-medium rounded-lg border transition-all ${
                              buildType === b
                                ? 'bg-gray-900 border-gray-900 text-white font-bold shadow-xs'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fit Style Preference */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">
                        Desired Drape Preference
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 text-xs">
                        {[
                          { key: 'tailored', label: 'Tidy Boxy', sub: '-1 size' },
                          { key: 'signature', label: 'Signature Baggy', sub: 'Recommended' },
                          { key: 'extreme', label: 'Hyper Skate', sub: '+1 size' },
                        ].map((pref) => (
                          <button
                            key={pref.key}
                            onClick={() => setFitPreference(pref.key as any)}
                            className={`py-2 px-2 text-center rounded-xl border transition-all ${
                              fitPreference === pref.key
                                ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white border-transparent font-bold shadow-xs'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            <span className="block leading-tight">{pref.label}</span>
                            <span
                              className={`text-[9px] block mt-0.5 ${
                                fitPreference === pref.key ? 'text-pink-100' : 'text-gray-600'
                              }`}
                            >
                              {pref.sub}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Hero Recommendation Card */}
                  <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 text-white border border-purple-800/40 shadow-xl">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-pink-300 border border-white/15">
                            Calculated Optimal Size
                          </span>
                          <h4 className="text-3xl font-serif font-bold text-white mt-1">
                            Size {fitRecommendation.recommendedSize}
                          </h4>
                          <p className="text-xs text-purple-200 mt-0.5">
                            {fitRecommendation.fitStyle} · {fitRecommendation.garmentName}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-2xl font-mono font-bold text-pink-400">
                            +{fitRecommendation.chestEaseInches}&quot;
                          </span>
                          <span className="block text-[10px] uppercase tracking-wider text-gray-300">
                            Chest Ease
                          </span>
                        </div>
                      </div>

                      {/* Proportions Metrics Bar */}
                      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                          <span className="text-[10px] text-gray-300 block uppercase">
                            Shoulder Drop
                          </span>
                          <span className="font-semibold text-white font-mono">
                            {fitRecommendation.shoulderDropInches}&quot; past seam
                          </span>
                        </div>

                        <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                          <span className="text-[10px] text-gray-300 block uppercase">
                            Hem Silhouette
                          </span>
                          <span className="font-semibold text-white">
                            {fitRecommendation.lengthDescription}
                          </span>
                        </div>

                        <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                          <span className="text-[10px] text-gray-300 block uppercase">
                            Silhouette Drape
                          </span>
                          <span className="font-semibold text-pink-300">
                            No Body Cling
                          </span>
                        </div>
                      </div>

                      {/* Visual Silhouette Drape Blueprint Tooltip Trigger */}
                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                        <span className="text-[11px] text-purple-200">
                          Visual drape mapped to your {fitRecommendation.userStats.build} body
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsSilhouetteTooltipOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/35 text-pink-200 hover:text-white border border-pink-400/40 text-xs font-semibold transition-all shadow-xs backdrop-blur-xs active:scale-95"
                          title="Open visual silhouette overlay blueprint"
                        >
                          <RulerIcon className="w-3.5 h-3.5 text-pink-300" />
                          <span>View Silhouette Drape Map</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* VISUAL SIZE COMPARISON FEATURE */}
                  <VisualSizeComparison
                    recommendation={fitRecommendation}
                    onSelectPreference={setFitPreference}
                  />

                  {/* In-Depth Fit Impact Explanation */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <span>How Size {fitRecommendation.recommendedSize} Impacts Your Final Fit</span>
                    </h5>

                    {/* Summary Box */}
                    <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-950 leading-relaxed font-medium">
                      {fitRecommendation.fitImpact.summary}
                    </div>

                    {/* Detailed Impact Points */}
                    <div className="grid grid-cols-1 gap-2.5 text-xs">
                      <div className="p-3 bg-white border border-gray-200 rounded-xl">
                        <p className="font-bold text-gray-900 mb-0.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                          Shoulders & Armhole Drop
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                          {fitRecommendation.fitImpact.shoulders}
                        </p>
                      </div>

                      <div className="p-3 bg-white border border-gray-200 rounded-xl">
                        <p className="font-bold text-gray-900 mb-0.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-600" />
                          Torso Drape & Fabric Physics
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                          {fitRecommendation.fitImpact.torsoAndDrape}
                        </p>
                      </div>

                      <div className="p-3 bg-white border border-gray-200 rounded-xl">
                        <p className="font-bold text-gray-900 mb-0.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                          Hemline & Stature Proportions
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                          {fitRecommendation.fitImpact.lengthAndProportions}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Gemini AI Personalized Accessorizing Guide */}
                  <div className="p-4 bg-gradient-to-br from-purple-50 via-pink-50/40 to-white rounded-2xl border border-purple-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center text-xs shadow-xs">
                          ✨
                        </div>
                        <div>
                          <h5 className="text-xs font-bold uppercase tracking-wider text-purple-950">
                            AI Accessorizing Blueprint
                          </h5>
                          <p className="text-[10px] text-purple-700 font-medium">
                            Personalized pairings for Size {fitRecommendation.recommendedSize}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={fetchAccessoryTips}
                        disabled={isLoadingAccessoryTips}
                        className="text-[11px] font-semibold text-purple-700 hover:text-purple-950 underline flex items-center gap-1 disabled:opacity-50"
                      >
                        {isLoadingAccessoryTips ? 'Styling...' : 'Refresh AI Tips'}
                      </button>
                    </div>

                    {isLoadingAccessoryTips ? (
                      <div className="py-6 flex flex-col items-center justify-center text-center">
                        <Spinner />
                        <p className="text-xs text-purple-900 font-medium mt-2">
                          Generating jewelry, footwear & layering suggestions for Size {fitRecommendation.recommendedSize}...
                        </p>
                      </div>
                    ) : accessoryTips ? (
                      <div className="space-y-2 text-xs">
                        <p className="font-serif font-bold text-purple-900 text-sm">
                          {accessoryTips.headline}
                        </p>

                        <div className="p-2.5 bg-white/95 rounded-xl border border-purple-100 shadow-2xs">
                          <span className="font-bold text-purple-950 block mb-0.5">
                            💍 Jewelry & Chains
                          </span>
                          <p className="text-gray-700 leading-relaxed">
                            {accessoryTips.jewelryTip}
                          </p>
                        </div>

                        <div className="p-2.5 bg-white/95 rounded-xl border border-purple-100 shadow-2xs">
                          <span className="font-bold text-purple-950 block mb-0.5">
                            👟 Footwear Anchors
                          </span>
                          <p className="text-gray-700 leading-relaxed">
                            {accessoryTips.footwearTip}
                          </p>
                        </div>

                        <div className="p-2.5 bg-white/95 rounded-xl border border-purple-100 shadow-2xs">
                          <span className="font-bold text-purple-950 block mb-0.5">
                            🎒 Bags & Tactical Accents
                          </span>
                          <p className="text-gray-700 leading-relaxed">
                            {accessoryTips.bagTip}
                          </p>
                        </div>

                        <div className="p-2.5 bg-white/95 rounded-xl border border-purple-100 shadow-2xs">
                          <span className="font-bold text-purple-950 block mb-0.5">
                            🧥 Layering Physics
                          </span>
                          <p className="text-gray-700 leading-relaxed">
                            {accessoryTips.layeringTip}
                          </p>
                        </div>

                        <p className="text-[11px] italic text-purple-900 pt-1 font-medium">
                          &quot;{accessoryTips.silhouetteBalanceSummary}&quot;
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : activeTab === 'moodboard' ? (
                /* Style Moodboard Tab */
                <StyleMoodboardView
                  moodboard={moodboard}
                  isLoading={isLoadingMoodboard}
                  onRefresh={fetchMoodboard}
                />
              ) : activeTab === 'compare_looks' ? (
                /* Side-by-Side Look Comparison Tab (Requested) */
                <SavedLookComparisonView
                  savedLooks={savedLooks}
                  onSelectLookToWear={(look) => {
                    if (onSelectSavedLook) {
                      onSelectSavedLook(look);
                      onClose();
                    }
                  }}
                />
              ) : (
                /* AI Style Critique Tab */
                <div className="space-y-5">
                  {isLoadingAdvice ? (
                    <div className="py-14 flex flex-col items-center justify-center text-center">
                      <Spinner />
                      <p className="text-sm font-serif text-gray-800 mt-4">
                        Evaluating silhouette drape and color harmony...
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Analyzing height, proportions, and garment physics.
                      </p>
                    </div>
                  ) : adviceError ? (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                      <p className="font-semibold mb-1">Analysis Notice</p>
                      <p>{adviceError}</p>
                      <button
                        onClick={fetchAdvice}
                        className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-semibold"
                      >
                        Retry Analysis
                      </button>
                    </div>
                  ) : advice ? (
                    <div className="space-y-5">
                      {/* Headline & Color Score */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200/80">
                        <div>
                          <span className="text-[10px] font-bold tracking-wider uppercase text-gray-500">
                            Silhouette Vibe
                          </span>
                          <h4 className="text-base font-serif font-bold text-gray-900 mt-0.5">
                            {advice.headline}
                          </h4>
                        </div>
                        <div className="text-center pl-3 border-l border-gray-200">
                          <span className="text-2xl font-bold font-mono text-gray-900">
                            {advice.colorScore}%
                          </span>
                          <span className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                            Harmony
                          </span>
                        </div>
                      </div>

                      {/* Fit Assessment */}
                      <div>
                        <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                          Proportion & Fit Analysis
                        </h5>
                        <p className="text-xs leading-relaxed text-gray-600 bg-white p-3.5 rounded-xl border border-gray-200">
                          {advice.fitAssessment}
                        </p>
                      </div>

                      {/* Occasion Suggestions */}
                      {advice.occasionSuggestions && advice.occasionSuggestions.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                            Recommended Occasions
                          </h5>
                          <div className="flex flex-wrap gap-1.5">
                            {advice.occasionSuggestions.map((occ) => (
                              <span
                                key={occ}
                                className="px-2.5 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium border border-gray-200"
                              >
                                {occ}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Styling Tips */}
                      {advice.stylingTips && advice.stylingTips.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                            Curated Styling Tips
                          </h5>
                          <ul className="space-y-2">
                            {advice.stylingTips.map((tip, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-xs text-gray-700 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/50"
                              >
                                <CheckIcon className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              {activeTab === 'style_critique' ? (
                <button
                  onClick={fetchAdvice}
                  disabled={isLoadingAdvice}
                  className="text-xs font-semibold text-gray-700 hover:text-black flex items-center gap-1.5"
                >
                  <SparklesIcon className="w-3.5 h-3.5" />
                  <span>Re-analyze Look</span>
                </button>
              ) : activeTab === 'moodboard' ? (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  <span>4 Editorial Lifestyle Prompts Ready</span>
                </div>
              ) : activeTab === 'compare_looks' ? (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  <span>Gemini Contrast Engine Active</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Optimal Baggy Algorithm Active</span>
                </div>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors shadow-xs"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Visual Silhouette Overlay Tooltip Modal */}
      <FitSilhouetteTooltip
        recommendation={fitRecommendation}
        isOpen={isSilhouetteTooltipOpen}
        onClose={() => setIsSilhouetteTooltipOpen(false)}
      />
    </>
  );
};

export default AIStylistPanel;
