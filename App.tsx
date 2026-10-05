/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StartScreen from './components/StartScreen';
import Header from './components/Header';
import Canvas from './components/Canvas';
import WardrobePanel from './components/WardrobeModal';
import OutfitStack from './components/OutfitStack';
import ShareModal from './components/ShareModal';
import AuthModal from './components/AuthModal';
import SavedLooksModal from './components/SavedLooksModal';
import AIStylistPanel from './components/AIStylistPanel';
import { generateVirtualTryOnImage, generatePoseVariation } from './services/geminiService';
import { OutfitLayer, WardrobeItem, UserMeasurements, UserProfile, SavedLook } from './types';
import { ChevronDownIcon, ChevronUpIcon } from './components/icons';
import { defaultWardrobe } from './wardrobe';
import Footer from './components/Footer';
import ContactUsModal from './components/ContactUsModal';
import ApiDiagnosticModal, { ApiDiagnosticData } from './components/ApiDiagnosticModal';
import { getFriendlyErrorMessage } from './lib/utils';
import Spinner from './components/Spinner';

const POSE_INSTRUCTIONS = [
  "Full frontal view, hands on hips",
  "Slightly turned, 3/4 view",
  "Side profile view",
  "Jumping in the air, mid-action shot",
  "Walking towards camera",
  "Leaning against a wall",
];

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQueryList.addEventListener('change', listener);
    
    if (mediaQueryList.matches !== matches) {
      setMatches(mediaQueryList.matches);
    }

    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query, matches]);

  return matches;
};

const App: React.FC = () => {
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<UserMeasurements | undefined>(() => {
    try {
      const saved = localStorage.getItem('sabhyam_measurements');
      return saved ? JSON.parse(saved) : undefined;
    } catch {
      return undefined;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const savedUser = localStorage.getItem('sabhyam_active_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [savedLooks, setSavedLooks] = useState<SavedLook[]>(() => {
    try {
      const saved = localStorage.getItem('sabhyam_saved_looks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favoriteGarmentIds, setFavoriteGarmentIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sabhyam_fav_garments');
      return saved ? JSON.parse(saved) : ['baggy-acid-wash-tee', 'baggy-cargo-parachute'];
    } catch {
      return ['baggy-acid-wash-tee', 'baggy-cargo-parachute'];
    }
  });

  const [outfitHistory, setOutfitHistory] = useState<OutfitLayer[]>([]);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(defaultWardrobe);
  const [lastSelectedGarment, setLastSelectedGarment] = useState<{ garment: WardrobeItem; input: File | string } | null>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Modals state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSavedLooksModalOpen, setIsSavedLooksModalOpen] = useState(false);
  const [isStylistPanelOpen, setIsStylistPanelOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Gemini API Diagnostic Tool state
  const [diagnosticData, setDiagnosticData] = useState<ApiDiagnosticData | null>(null);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isCheckingDiagnostic, setIsCheckingDiagnostic] = useState(false);

  const runApiDiagnostics = useCallback(async () => {
    setIsCheckingDiagnostic(true);
    try {
      const res = await fetch('/api/diagnostic');
      if (res.ok) {
        const data = await res.json();
        setDiagnosticData(data);
      } else {
        setDiagnosticData({
          status: 'error',
          code: 'SERVER_HTTP_ERROR',
          message: `Diagnostic endpoint responded with HTTP ${res.status}`,
          isReachable: false,
          hasApiKey: false,
        });
      }
    } catch (err: any) {
      setDiagnosticData({
        status: 'error',
        code: 'FETCH_FAILED',
        message: `Could not reach server diagnostic endpoint: ${err?.message || 'Network error'}`,
        isReachable: false,
        hasApiKey: false,
      });
    } finally {
      setIsCheckingDiagnostic(false);
    }
  }, []);

  useEffect(() => {
    runApiDiagnostics();
  }, [runApiDiagnostics]);

  // Sync favorites & saved looks to localStorage
  useEffect(() => {
    localStorage.setItem('sabhyam_saved_looks', JSON.stringify(savedLooks));
  }, [savedLooks]);

  useEffect(() => {
    localStorage.setItem('sabhyam_fav_garments', JSON.stringify(favoriteGarmentIds));
  }, [favoriteGarmentIds]);

  useEffect(() => {
    if (measurements) {
      localStorage.setItem('sabhyam_measurements', JSON.stringify(measurements));
    }
  }, [measurements]);

  const activeOutfitLayers = useMemo(() => 
    outfitHistory.slice(0, currentOutfitIndex + 1), 
    [outfitHistory, currentOutfitIndex]
  );
  
  const activeGarmentIds = useMemo(() => 
    activeOutfitLayers.map(layer => layer.garment?.id).filter(Boolean) as string[], 
    [activeOutfitLayers]
  );
  
  const displayImageUrl = useMemo(() => {
    if (outfitHistory.length === 0) return modelImageUrl;
    const currentLayer = outfitHistory[currentOutfitIndex];
    if (!currentLayer) return modelImageUrl;

    const poseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
    return currentLayer.poseImages[poseInstruction] ?? Object.values(currentLayer.poseImages)[0];
  }, [outfitHistory, currentOutfitIndex, currentPoseIndex, modelImageUrl]);

  const availablePoseKeys = useMemo(() => {
    if (outfitHistory.length === 0) return [];
    const currentLayer = outfitHistory[currentOutfitIndex];
    return currentLayer ? Object.keys(currentLayer.poseImages) : [];
  }, [outfitHistory, currentOutfitIndex]);

  // Check if currently active outfit is already bookmarked
  const isCurrentLookFavorited = useMemo(() => {
    if (!displayImageUrl) return false;
    return savedLooks.some(look => look.previewUrl === displayImageUrl);
  }, [savedLooks, displayImageUrl]);

  const handleModelFinalized = (url: string, fitData?: UserMeasurements) => {
    setModelImageUrl(url);
    if (fitData) {
      setMeasurements(fitData);
    }
    setOutfitHistory([{
      garment: null,
      poseImages: { [POSE_INSTRUCTIONS[0]]: url }
    }]);
    setCurrentOutfitIndex(0);
  };

  const handleStartOver = () => {
    setModelImageUrl(null);
    setOutfitHistory([]);
    setCurrentOutfitIndex(0);
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
    setCurrentPoseIndex(0);
    setIsSheetCollapsed(false);
    setWardrobe(defaultWardrobe);
  };

  // Garment selection & Virtual Try-on
  const handleGarmentSelect = useCallback(async (garmentInput: File | string, garmentInfo: WardrobeItem) => {
    if (!displayImageUrl || isLoading) return;

    // Check if re-applying a previously generated layer
    const nextLayer = outfitHistory[currentOutfitIndex + 1];
    if (nextLayer && nextLayer.garment?.id === garmentInfo.id) {
        setCurrentOutfitIndex(prev => prev + 1);
        setCurrentPoseIndex(0);
        return;
    }

    setLastSelectedGarment({ garment: garmentInfo, input: garmentInput });
    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Trying on ${garmentInfo.name}...`);

    try {
      const newImageUrl = await generateVirtualTryOnImage(
        displayImageUrl,
        garmentInput,
        garmentInfo.category,
        {
          onProgressUpdate: (msg) => setLoadingMessage(msg),
        }
      );
      const currentPoseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
      
      const newLayer: OutfitLayer = { 
        garment: garmentInfo, 
        poseImages: { [currentPoseInstruction]: newImageUrl } 
      };

      setOutfitHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, currentOutfitIndex + 1);
        return [...newHistory, newLayer];
      });
      setCurrentOutfitIndex(prev => prev + 1);
      
      // Add to personal wardrobe if not already present
      setWardrobe(prev => {
        if (prev.find(item => item.id === garmentInfo.id)) {
            return prev;
        }
        return [...prev, garmentInfo];
      });
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to apply garment'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [displayImageUrl, isLoading, currentPoseIndex, outfitHistory, currentOutfitIndex]);

  // Retry try-on with automatic or specific model endpoint selection
  const handleRetryWithModel = useCallback(async (preferredModel: string = 'gemini-3.1-flash-lite-image') => {
    if (!lastSelectedGarment || !displayImageUrl || isLoading) return;

    setError(null);
    setIsLoading(true);
    const targetLabel = preferredModel === 'local_smart_engine' ? 'Local Smart Fitting Engine' : preferredModel;
    setLoadingMessage(`Retrying ${lastSelectedGarment.garment.name} via ${targetLabel}...`);

    try {
      let newImageUrl: string;
      if (preferredModel === 'local_smart_engine') {
        const { compositeTryOn } = await import('./lib/fittingEngine');
        newImageUrl = await compositeTryOn(
          displayImageUrl,
          lastSelectedGarment.input,
          lastSelectedGarment.garment.category
        );
      } else {
        newImageUrl = await generateVirtualTryOnImage(
          displayImageUrl,
          lastSelectedGarment.input,
          lastSelectedGarment.garment.category,
          {
            preferredModel,
            onProgressUpdate: (msg) => setLoadingMessage(msg),
          }
        );
      }

      const currentPoseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
      const newLayer: OutfitLayer = {
        garment: lastSelectedGarment.garment,
        poseImages: { [currentPoseInstruction]: newImageUrl },
      };

      setOutfitHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, currentOutfitIndex + 1);
        return [...newHistory, newLayer];
      });
      setCurrentOutfitIndex(prev => prev + 1);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Retry attempt failed'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [lastSelectedGarment, displayImageUrl, isLoading, currentOutfitIndex, currentPoseIndex]);

  // Undo & Redo Navigation
  const canUndo = currentOutfitIndex > 0;
  const canRedo = currentOutfitIndex < outfitHistory.length - 1;

  const handleUndo = useCallback(() => {
    if (currentOutfitIndex > 0 && !isLoading) {
      setCurrentOutfitIndex(prevIndex => prevIndex - 1);
      setCurrentPoseIndex(0);
    }
  }, [currentOutfitIndex, isLoading]);

  const handleRedo = useCallback(() => {
    if (currentOutfitIndex < outfitHistory.length - 1 && !isLoading) {
      setCurrentOutfitIndex(prevIndex => prevIndex + 1);
      setCurrentPoseIndex(0);
    }
  }, [currentOutfitIndex, outfitHistory.length, isLoading]);

  const handleSelectLayer = useCallback((index: number) => {
    if (index >= 0 && index < outfitHistory.length && index !== currentOutfitIndex && !isLoading) {
      setCurrentOutfitIndex(index);
      setCurrentPoseIndex(0);
    }
  }, [currentOutfitIndex, outfitHistory.length, isLoading]);

  const handleRemoveLastGarment = () => {
    handleUndo();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && !e.altKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Pose variation
  const handlePoseSelect = useCallback(async (newIndex: number) => {
    if (isLoading || outfitHistory.length === 0 || newIndex === currentPoseIndex) return;
    
    const poseInstruction = POSE_INSTRUCTIONS[newIndex];
    const currentLayer = outfitHistory[currentOutfitIndex];

    if (currentLayer.poseImages[poseInstruction]) {
      setCurrentPoseIndex(newIndex);
      return;
    }

    const baseImageForPoseChange = Object.values(currentLayer.poseImages)[0] as string | undefined;
    if (!baseImageForPoseChange) return;

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Adjusting pose...`);
    
    const prevPoseIndex = currentPoseIndex;
    setCurrentPoseIndex(newIndex);

    try {
      const newImageUrl = await generatePoseVariation(baseImageForPoseChange, poseInstruction);
      setOutfitHistory(prevHistory => {
        const newHistory = [...prevHistory];
        const updatedLayer = newHistory[currentOutfitIndex];
        updatedLayer.poseImages[poseInstruction] = newImageUrl;
        return newHistory;
      });
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to change pose'));
      setCurrentPoseIndex(prevPoseIndex);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentPoseIndex, outfitHistory, isLoading, currentOutfitIndex]);

  // Favorites management
  const handleToggleFavoriteLook = () => {
    if (!displayImageUrl) return;

    if (isCurrentLookFavorited) {
      // Remove from favorites
      setSavedLooks(prev => prev.filter(look => look.previewUrl !== displayImageUrl));
    } else {
      // Add to favorites
      const garmentNames = activeOutfitLayers
        .slice(1)
        .map(l => l.garment?.name)
        .filter(Boolean)
        .join(' + ');

      const newLook: SavedLook = {
        id: `look-${Date.now()}`,
        title: garmentNames || 'Streetwear Styled Look',
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        previewUrl: displayImageUrl,
        baseModelUrl: modelImageUrl || displayImageUrl,
        layers: [...activeOutfitLayers],
        poseInstruction: POSE_INSTRUCTIONS[currentPoseIndex],
        measurements,
      };
      setSavedLooks(prev => [newLook, ...prev]);
    }
  };

  const handleToggleFavoriteGarment = (id: string) => {
    setFavoriteGarmentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectSavedLook = (look: SavedLook) => {
    if (look.baseModelUrl && look.baseModelUrl !== modelImageUrl) {
      setModelImageUrl(look.baseModelUrl);
    }
    setOutfitHistory(look.layers);
    setCurrentOutfitIndex(look.layers.length - 1);
    const poseIdx = POSE_INSTRUCTIONS.indexOf(look.poseInstruction);
    if (poseIdx !== -1) {
      setCurrentPoseIndex(poseIdx);
    }
    if (look.measurements) {
      setMeasurements(look.measurements);
    }
  };

  const handleDeleteSavedLook = (lookId: string) => {
    setSavedLooks(prev => prev.filter(l => l.id !== lookId));
  };

  const handleAuthSuccess = (profile: UserProfile) => {
    setCurrentUser(profile);
    if (profile.measurements) {
      setMeasurements(profile.measurements);
    }
    if (profile.savedLooks && profile.savedLooks.length > 0) {
      setSavedLooks(profile.savedLooks);
    }
  };

  const viewVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  return (
    <div className="font-sans antialiased text-[#111827] bg-[#fafaf9] min-h-screen flex flex-col justify-between selection:bg-[#111827] selection:text-[#fafaf9]">
      <Header
        onOpenContact={() => setIsContactModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onStartOver={handleStartOver}
        isOnDressingScreen={!!modelImageUrl}
        isConfigError={diagnosticData?.status === 'error' || diagnosticData?.isReachable === false}
        onOpenDiagnostic={() => setIsDiagnosticOpen(true)}
      />

      {/* Prominent Configuration Error Banner if API is unreachable */}
      {(diagnosticData?.status === 'error' || diagnosticData?.isReachable === false) && (
        <div className="w-full fixed top-18 left-0 right-0 z-30 px-3 sm:px-6 pointer-events-none">
          <div className="max-w-4xl mx-auto bg-amber-50/95 backdrop-blur-md border border-amber-300 rounded-2xl p-2.5 sm:px-4 sm:py-2 flex items-center justify-between text-xs text-amber-950 shadow-md pointer-events-auto">
            <div className="flex items-center gap-2 truncate mr-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-ping" />
              <span className="font-semibold text-amber-900 shrink-0">Configuration Error:</span>
              <span className="truncate text-amber-800">
                {diagnosticData?.message || 'Gemini API is unreachable. Virtual try-ons are running on local Smart Fitting failover.'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsDiagnosticOpen(true)}
              className="shrink-0 px-2.5 py-1 rounded-xl bg-amber-900 text-white hover:bg-black font-medium text-[11px] transition-all shadow-2xs cursor-pointer active:scale-98"
            >
              View Diagnostics &rarr;
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!modelImageUrl ? (
          <motion.div
            key="start-screen"
            className="w-full flex-grow flex flex-col justify-between pt-10 px-4"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <StartScreen 
              onModelFinalized={handleModelFinalized}
              onPromptAuth={() => setIsAuthModalOpen(true)}
              currentUser={currentUser}
              savedMeasurements={measurements}
              onOpenContact={() => setIsContactModalOpen(true)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            className="relative flex flex-col h-screen bg-white overflow-hidden"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <main className="flex-grow relative flex flex-col md:flex-row overflow-hidden">
              <div className="w-full h-full flex-grow flex items-center justify-center bg-white pb-16 relative">
                <Canvas 
                  displayImageUrl={displayImageUrl}
                  onStartOver={handleStartOver}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  onSelectPose={handlePoseSelect}
                  poseInstructions={POSE_INSTRUCTIONS}
                  currentPoseIndex={currentPoseIndex}
                  availablePoseKeys={availablePoseKeys}
                  onOpenShare={() => setIsShareModalOpen(true)}
                  onOpenStylist={() => setIsStylistPanelOpen(true)}
                  onOpenFavorites={() => setIsSavedLooksModalOpen(true)}
                  onToggleFavoriteLook={handleToggleFavoriteLook}
                  isCurrentLookFavorited={isCurrentLookFavorited}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  currentUser={currentUser}
                  onOpenContact={() => setIsContactModalOpen(true)}
                  error={error}
                  onClearError={() => setError(null)}
                  onRetryTryOn={handleRetryWithModel}
                  lastGarmentName={lastSelectedGarment?.garment?.name}
                />
              </div>

              <aside 
                className={`absolute md:relative md:flex-shrink-0 bottom-0 right-0 h-auto md:h-full w-full md:w-1/3 md:max-w-sm bg-white/85 backdrop-blur-md flex flex-col border-t md:border-t-0 md:border-l border-gray-200/80 transition-transform duration-500 ease-in-out ${isSheetCollapsed ? 'translate-y-[calc(100%-4.5rem)]' : 'translate-y-0'} md:translate-y-0`}
                style={{ transitionProperty: 'transform' }}
              >
                  <button 
                    onClick={() => setIsSheetCollapsed(!isSheetCollapsed)} 
                    className="md:hidden w-full h-8 flex items-center justify-center bg-gray-100/50"
                    aria-label={isSheetCollapsed ? 'Expand panel' : 'Collapse panel'}
                  >
                    {isSheetCollapsed ? <ChevronUpIcon className="w-6 h-6 text-gray-500" /> : <ChevronDownIcon className="w-6 h-6 text-gray-500" />}
                  </button>
                  <div className="p-4 md:p-6 pb-20 overflow-y-auto flex-grow flex flex-col gap-6">
                    {error && (
                      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                        <p className="font-bold text-xs uppercase tracking-wider">Notice</p>
                        <p className="text-sm mt-1">{error}</p>
                      </div>
                    )}
                    <OutfitStack 
                      outfitHistory={outfitHistory}
                      currentOutfitIndex={currentOutfitIndex}
                      canUndo={canUndo}
                      canRedo={canRedo}
                      onUndo={handleUndo}
                      onRedo={handleRedo}
                      onSelectLayer={handleSelectLayer}
                      onRemoveLastGarment={handleRemoveLastGarment}
                      isLoading={isLoading}
                      onOpenShare={() => setIsShareModalOpen(true)}
                    />
                    <WardrobePanel
                      onGarmentSelect={handleGarmentSelect}
                      activeGarmentIds={activeGarmentIds}
                      isLoading={isLoading}
                      wardrobe={wardrobe}
                      favoriteGarmentIds={favoriteGarmentIds}
                      onToggleFavoriteGarment={handleToggleFavoriteGarment}
                    />
                  </div>
              </aside>
            </main>

            {/* Share & PDF Lookbook Export Modal */}
            {modelImageUrl && (
              <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                baseModelUrl={modelImageUrl}
                currentImageUrl={displayImageUrl || modelImageUrl}
                activeLayers={activeOutfitLayers}
                currentPoseName={POSE_INSTRUCTIONS[currentPoseIndex] || 'Default pose'}
                measurements={measurements}
              />
            )}

            {/* AI Style Consultant & Fit Advice Panel */}
            {modelImageUrl && (
              <AIStylistPanel
                isOpen={isStylistPanelOpen}
                onClose={() => setIsStylistPanelOpen(false)}
                currentImageUrl={displayImageUrl || modelImageUrl}
                activeLayers={activeOutfitLayers}
                measurements={measurements}
                onUpdateMeasurements={setMeasurements}
                savedLooks={savedLooks}
                onSelectSavedLook={handleSelectSavedLook}
              />
            )}

            {/* Favorites & Saved Looks Modal */}
            <SavedLooksModal
              isOpen={isSavedLooksModalOpen}
              onClose={() => setIsSavedLooksModalOpen(false)}
              savedLooks={savedLooks}
              onSelectLook={handleSelectSavedLook}
              onDeleteLook={handleDeleteSavedLook}
              onShareLook={() => setIsShareModalOpen(true)}
              wardrobe={wardrobe}
              onTryOnGarment={(item) => handleGarmentSelect(item.url, item)}
              onOpenComparison={() => setIsStylistPanelOpen(true)}
            />

            {/* Auth / Account Profile Modal */}
            <AuthModal
              isOpen={isAuthModalOpen}
              onClose={() => setIsAuthModalOpen(false)}
              onAuthSuccess={handleAuthSuccess}
              currentMeasurements={measurements}
            />

            <AnimatePresence>
              {isLoading && isMobile && (
                <motion.div
                  className="fixed inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Spinner />
                  {loadingMessage && (
                    <p className="text-lg font-serif text-gray-700 mt-4 text-center px-4">{loadingMessage}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer 
        isOnDressingScreen={!!modelImageUrl} 
        onOpenContact={() => setIsContactModalOpen(true)} 
      />

      {/* Contact Us Modal */}
      <ContactUsModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      {/* Gemini API Diagnostic Tool Modal */}
      <ApiDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        diagnosticData={diagnosticData}
        onRecheck={runApiDiagnostics}
        isChecking={isCheckingDiagnostic}
      />
    </div>
  );
};

export default App;