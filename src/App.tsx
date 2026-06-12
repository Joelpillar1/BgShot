import React, { useState, useEffect, useRef } from 'react';
import { Backdrop, ShadowOverlay, SubjectPlacement, SubjectEnhancement, SubjectShadow, HistoryItem, BlurArea } from './types';
import { BACKDROPS, SHADOW_OVERLAYS } from './data/backdrops';
import ImageUploader from './components/ImageUploader';
import WorkspaceCanvas from './components/WorkspaceCanvas';
import ControlPanel from './components/ControlPanel';
import { initMaskFromTransparentImage } from './utils/mask-utils';
import { Sparkles, Sliders, Layers, RefreshCw, Smartphone, Monitor, ChevronRight, X, Share2, Plus, ArrowUpRight, History, Trash2, AlertTriangle, Download, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { saveHistoryItem, deleteHistoryItem, clearAllHistory, getAllHistoryItems } from './utils/historyDb';

const INITIAL_PLACEMENT: SubjectPlacement = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  flipX: false,
  aspectRatio: 1,
  borderRadius: 12,
};

const INITIAL_ENHANCEMENT: SubjectEnhancement = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  temperature: 0,
  exposure: 0,
};

const INITIAL_SHADOW_SETTINGS: SubjectShadow = {
  enabled: true,
  color: 'rgba(0, 0, 0, 0.4)',
  offsetX: 0,
  offsetY: 20,
  blur: 25,
  opacity: 0.35,
};

const SHIPOS_SLIDES = [
  {
    line1: "Still copy-pasting to 5 apps?",
    line2: "ShipOS publishes everywhere in one click.",
    cta: "Try Free →"
  },
  {
    line1: "Creators waste 3 hours/week on formatting.",
    line2: "ShipOS gives them back in minutes.",
    cta: "Start Free →"
  },
  {
    line1: "One dashboard. Every platform. Total control.",
    line2: "Write once. Ship everywhere with ShipOS.",
    cta: "Get Started Free →"
  }
];

export default function App() {
  const [originalImg, setOriginalImg] = useState<HTMLImageElement | null>(null);
  const [maskCanvas, setMaskCanvas] = useState<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // ShipOS Promo Slider State
  const [currentPromoSlide, setCurrentPromoSlide] = useState<number>(0);

  useEffect(() => {
    const promoTimer = setInterval(() => {
      setCurrentPromoSlide((prev) => (prev + 1) % 3);
    }, 5500);
    return () => clearInterval(promoTimer);
  }, []);

  // History state list backed by IndexedDB storage sandbox (to avoid localStorage 5MB quota limits)
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Load history from DB on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const items = await getAllHistoryItems();
        setHistoryItems(items);
      } catch (err) {
        console.error('Failed to load creation history from IndexedDB', err);
      }
    };
    loadHistory();
  }, []);

  // This state is just a trigger to force compositing components to re-render
  // when drawing on the canvas occurs in the child modal.
  const [maskTrigger, setMaskTrigger] = useState<number>(0);

  // Studio Staging State
  const [selectedBackdrop, setSelectedBackdrop] = useState<Backdrop>(BACKDROPS.find(b => b.id === 'grad-burnt-clay') || BACKDROPS[0]);
  const [selectedShadow, setSelectedShadow] = useState<ShadowOverlay>(SHADOW_OVERLAYS[0]);
  const [placement, setPlacement] = useState<SubjectPlacement>(INITIAL_PLACEMENT);
  const [enhancement, setEnhancement] = useState<SubjectEnhancement>(INITIAL_ENHANCEMENT);
  const [shadowSettings, setShadowSettings] = useState<SubjectShadow>(INITIAL_SHADOW_SETTINGS);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [blurAreas, setBlurAreas] = useState<BlurArea[]>([]);
  const [activeBlurId, setActiveBlurId] = useState<string | null>(null);

  const handleExportSuccess = (dataUrl: string) => {
    let originalImgDataUrl = '';
    if (originalImg) {
      try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = originalImg.naturalWidth;
        tempCanvas.height = originalImg.naturalHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(originalImg, 0, 0);
          originalImgDataUrl = tempCanvas.toDataURL('image/jpeg', 0.85);
        }
      } catch (err) {
        console.error('Failed to extract original image data url', err);
        originalImgDataUrl = originalImg.src;
      }
    }

    let maskCanvasDataUrl = '';
    if (maskCanvas) {
      try {
        maskCanvasDataUrl = maskCanvas.toDataURL('image/png');
      } catch (err) {
        console.error('Failed to extract mask canvas data url', err);
      }
    }

    const newItem: HistoryItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      dataUrl,
      timestamp: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      backdropName: selectedBackdrop.name,
      aspectRatio: aspectRatio,
      state: {
        selectedBackdropId: selectedBackdrop.id,
        selectedShadowId: selectedShadow.id,
        placement: { ...placement },
        enhancement: { ...enhancement },
        shadowSettings: { ...shadowSettings },
        aspectRatio: aspectRatio,
        originalImgDataUrl,
        maskCanvasDataUrl,
        blurAreas: [...blurAreas],
      }
    };
    
    // Optimistic UI update
    setHistoryItems((prev) => [newItem, ...prev]);

    // Save to database asynchronously
    saveHistoryItem(newItem).catch((err) => {
      console.error('Failed to write history composition to IndexedDB storage', err);
    });
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic UI update
    setHistoryItems((prev) => prev.filter(item => item.id !== id));

    // Delete from database asynchronously
    deleteHistoryItem(id).catch((err) => {
      console.error('Failed to delete history composition from IndexedDB', err);
    });
  };

  const handleClearAllHistory = () => {
    // Optimistic UI update
    setHistoryItems([]);
    setShowClearConfirm(false);

    // Clear from database asynchronously
    clearAllHistory().catch((err) => {
      console.error('Failed to wipe composition data from IndexedDB', err);
    });
  };

  const handleRestoreHistoryState = (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProcessing(true);
    setErrorMessage(null);

    // Close the history modal
    setIsHistoryOpen(false);

    if (item.state) {
      // Restore full compositional state
      const { 
        selectedBackdropId, 
        selectedShadowId, 
        placement: savedPlacement, 
        enhancement: savedEnhancement, 
        shadowSettings: savedShadowSettings, 
        aspectRatio: savedAspectRatio, 
        originalImgDataUrl, 
        maskCanvasDataUrl,
        blurAreas: savedBlurAreas
      } = item.state;

      // 1. Rebuild and mount HTMLImageElement
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setOriginalImg(img);
        
        // 2. Map and set states
        setPlacement(savedPlacement);
        setEnhancement(savedEnhancement);
        setShadowSettings(savedShadowSettings);
        setAspectRatio(savedAspectRatio);
        setBlurAreas(savedBlurAreas || []);
        setActiveBlurId(null);

        // Map backdrops
        const backdropMatch = BACKDROPS.find(b => b.id === selectedBackdropId);
        if (backdropMatch) {
          setSelectedBackdrop(backdropMatch);
        }

        // Map shadows
        const shadowMatch = SHADOW_OVERLAYS.find(s => s.id === selectedShadowId);
        if (shadowMatch) {
          setSelectedShadow(shadowMatch);
        }

        // 3. Rebuild and mount Mask Canvas
        if (maskCanvasDataUrl) {
          const mImg = new Image();
          mImg.crossOrigin = 'anonymous';
          mImg.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(mImg, 0, 0, canvas.width, canvas.height);
            }
            setMaskCanvas(canvas);
            setMaskTrigger((prev) => prev + 1);
            setIsProcessing(false);
          };
          mImg.onerror = () => {
            console.error('Failed to load mask image from history state, resetting mask to full image');
            // If mask image loading fail, fallback to clear/full mask initialization
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            setMaskCanvas(canvas);
            setMaskTrigger((prev) => prev + 1);
            setIsProcessing(false);
          };
          mImg.src = maskCanvasDataUrl;
        } else {
          // No mask, initialize to solid white
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          setMaskCanvas(canvas);
          setMaskTrigger((prev) => prev + 1);
          setIsProcessing(false);
        }
      };

      img.onerror = (err) => {
        console.error('Failed to restore main image from history state', err);
        setErrorMessage('Failed to reload original source image for editing');
        setIsProcessing(false);
      };

      img.src = originalImgDataUrl;

    } else {
      // Fallback: load final composite data Url as a generic flat image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setOriginalImg(img);
        setPlacement({
          ...INITIAL_PLACEMENT,
          aspectRatio: img.naturalWidth / img.naturalHeight,
        });
        setEnhancement(INITIAL_ENHANCEMENT);
        setShadowSettings(INITIAL_SHADOW_SETTINGS);
        setAspectRatio('1:1');

        // Reset layer mask to full canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        setMaskCanvas(canvas);
        setMaskTrigger((prev) => prev + 1);
        setIsProcessing(false);
      };

      img.onerror = () => {
        setErrorMessage('Failed to parse and load this design image back into studio');
        setIsProcessing(false);
      };

      img.src = item.dataUrl;
    }
  };

  // PWA Support States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [activeInstallTab, setActiveInstallTab] = useState<'ios' | 'android' | 'desktop'>('ios');

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    // Auto-select PWA installation tab helper based on platform agent
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setActiveInstallTab('ios');
    } else if (/android/.test(ua)) {
      setActiveInstallTab('android');
    } else {
      setActiveInstallTab('desktop');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };
  
  // Operational states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const handleImageUploaded = (file: File) => {
    // Reset layout on fresh image
    setPlacement({
      ...INITIAL_PLACEMENT,
    });
    setEnhancement(INITIAL_ENHANCEMENT);
    setShadowSettings(INITIAL_SHADOW_SETTINGS);
    setErrorMessage(null);

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setOriginalImg(img);
      setPlacement((prev) => ({
        ...prev,
        aspectRatio: img.naturalWidth / img.naturalHeight,
      }));

      // Initialize mask to fully opaque white (keeps entire image)
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      setMaskCanvas(canvas);
      setMaskTrigger((prev) => prev + 1);
      
      // Instantly ready
      setIsProcessing(false);
    };
    img.src = objectUrl;
  };

  const handleResetLayout = () => {
    if (!originalImg) return;
    setPlacement({
      ...INITIAL_PLACEMENT,
      aspectRatio: originalImg.naturalWidth / originalImg.naturalHeight,
    });
    setEnhancement(INITIAL_ENHANCEMENT);
    setShadowSettings(INITIAL_SHADOW_SETTINGS);
  };

  const handleClearImage = () => {
    setOriginalImg(null);
    setMaskCanvas(null);
    setPlacement(INITIAL_PLACEMENT);
    setBlurAreas([]);
    setActiveBlurId(null);
    setErrorMessage(null);
  };

  return (
    <div id="app-root-container" className="flex min-h-screen lg:h-screen lg:overflow-hidden flex-col bg-[#0d0d0f] font-sans antialiased text-white select-none">
      {/* ShipOS Ads Promo Banner Slider */}
      <div id="shipos-promo-banner" className="sticky top-0 z-[60] bg-[#C4622D] border-b border-[#ab4f20] overflow-hidden h-10 sm:h-12 flex items-center select-none shadow-sm w-full">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 flex items-center justify-between gap-4 h-full">
          {/* Logo brand box */}
          <div className="flex items-center gap-2 shrink-0">
            <a 
              href="https://www.myshipos.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-0.5 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-white shadow-sm transition-all duration-200"
            >
              <span className="font-sans font-black tracking-tight text-[11px] sm:text-[12px] text-white flex items-center gap-0.5" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
                Ship
                <span className="inline-flex items-center justify-center bg-white text-[8px] font-bold text-[#C4622D] px-0.5 rounded-[2.5px] h-[13px] min-w-[17px] leading-none ml-0.5 shadow-sm">
                  OS
                </span>
              </span>
            </a>
          </div>

          {/* Sliding feature text */}
          <div className="flex-1 min-w-0 relative h-full flex items-center">
            {SHIPOS_SLIDES.map((slide, idx) => {
              const isActive = idx === currentPromoSlide;
              return (
                <div
                  key={idx}
                  className={`transition-all duration-500 transform w-full flex flex-col sm:flex-row sm:items-center sm:gap-1 text-left ${
                    isActive
                      ? "opacity-100 translate-y-0 scale-100 relative z-10"
                      : "opacity-0 absolute -translate-y-2 scale-95 pointer-events-none hidden"
                  }`}
                >
                  <span className="text-[10px] sm:text-[12.5px] font-bold text-white tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                    {slide.line1}
                  </span>
                  <span className="text-[9.5px] sm:text-[12px] font-normal text-white/90 tracking-normal leading-tight hidden md:inline ml-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                    {slide.line2}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Indicator slider dots & CTA action button */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Indicator Dots - tiny custom slider styling */}
            <div id="slider-indicator-dots" className="hidden sm:flex items-center gap-1 shrink-0">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  id={`promo-dot-${i}`}
                  onClick={() => setCurrentPromoSlide(i)}
                  className={`h-0.5 cursor-pointer transition-all duration-300 rounded ${
                    i === currentPromoSlide 
                      ? "w-3 bg-white" 
                      : "w-1 bg-white/40 hover:bg-white/70"
                  }`}
                  title={`Navigate to Feature ${i + 1}`}
                />
              ))}
            </div>

            {/* CTA button: White background, dark text */}
            <a 
              href="https://www.myshipos.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              id="shipos-cta-button"
              className="inline-flex items-center justify-center bg-white hover:bg-neutral-50 active:scale-95 text-[10.5px] sm:text-[11.5px] font-bold text-[#C4622D] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded shadow-sm transition-all duration-200 shrink-0"
            >
              <span>{SHIPOS_SLIDES[currentPromoSlide].cta}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Dynamic Header */}
      <header className="sticky top-10 sm:top-12 z-[50] flex h-16 items-center justify-between border-b border-zinc-900 bg-[#121214]/90 px-6 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          {/* Custom bigshort vector logo */}
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#E2906E] to-[#D46038] shadow-lg border border-zinc-700/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-[22px] w-[22px] text-white">
              <rect x="128" y="128" width="256" height="256" rx="42" fill="none" stroke="#F5F2EB" strokeWidth="32"/>
              <circle cx="256" cy="256" r="64" fill="none" stroke="#F5F2EB" strokeWidth="24" strokeDasharray="16 8"/>
              <circle cx="256" cy="256" r="26" fill="#F5F2EB"/>
            </svg>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black tracking-tight text-white font-display md:text-base">
                BigShort <span className="text-[#E2906E]">Studio</span>
              </h1>
              {!originalImg && (
                <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[8px] font-bold text-zinc-400 uppercase tracking-widest">v1.1</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">


          {/* Save to Home Screen Button */}
          {!originalImg && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 rounded-full border border-[#D46038]/20 bg-[#D46038]/5 px-3.5 py-1.5 text-xs font-semibold text-[#E2906E] transition hover:border-[#D46038]/60 hover:bg-[#D46038]/15 active:scale-95 cursor-pointer shadow-sm"
              title="Save BigShort Studio to your device Home Screen"
            >
              <Smartphone className="h-3.5 w-3.5 text-[#E2906E]" />
              <span className="hidden sm:inline">Save to Home Screen</span>
              <span className="sm:hidden">Install</span>
            </button>
          )}

          {originalImg && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-full border border-[#D46038]/30 bg-[#D46038]/10 px-3.5 py-1.5 text-xs font-semibold text-[#E2906E] transition hover:border-[#D46038]/60 hover:bg-[#D46038]/20 hover:text-white active:scale-95 cursor-pointer"
                title="Upload another subject image directly inside the active layout"
              >
                <UploadCloud className="h-3.5 w-3.5 text-[#E2906E]" />
                <span className="hidden sm:inline">Upload New Image</span>
                <span className="sm:hidden">Upload New</span>
              </button>
              <button
                onClick={handleClearImage}
                className="rounded-full border border-zinc-800 bg-zinc-900/40 px-3.5 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-zinc-700 hover:text-white active:scale-95 cursor-pointer"
              >
                Clear/Reset
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* Left Side: Upload Zone / Live Canvas Compositor Preview */}
        <main className="sticky top-[104px] sm:top-[112px] lg:static z-20 flex flex-col justify-between bg-zinc-950 lg:bg-zinc-950/30 border-b border-zinc-900 lg:border-b-0 shrink-0 lg:shrink lg:flex-1 lg:h-full lg:overflow-hidden">
          {!originalImg ? (
            <div className="flex flex-1 items-center justify-center p-6 md:p-12">
              <div className="w-full max-w-sm rounded-[28px] border border-zinc-900 bg-[#121214] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-[#D46038]/5 rounded-full blur-3xl" />
                <div className="flex flex-col items-center text-center">
                  <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#E2906E] to-[#D46038] shadow-lg border border-zinc-800">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-9 w-9 text-white">
                      <rect x="128" y="128" width="256" height="256" rx="42" fill="none" stroke="#F5F2EB" strokeWidth="32"/>
                      <circle cx="256" cy="256" r="64" fill="none" stroke="#F5F2EB" strokeWidth="24" strokeDasharray="16 8"/>
                      <circle cx="256" cy="256" r="26" fill="#F5F2EB"/>
                    </svg>
                  </div>
                  <h2 className="mt-5 text-xl font-bold font-display text-white tracking-tight">BigShort Studio</h2>
                  <p className="mt-2 text-xs text-zinc-450 leading-relaxed">
                    Instantly turn flat PNG/JPG subjects into premium 4K product photos with studio-grade backdrops, textures, and louvers.
                  </p>
                </div>
                <div className="mt-8">
                  <ImageUploader onImageSelected={handleImageUploaded} />
                </div>
              </div>
            </div>
          ) : (
            <div 
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  const file = e.dataTransfer.files[0];
                  if (file.type.startsWith('image/')) {
                    handleImageUploaded(file);
                  } else {
                    setErrorMessage('Please upload a valid image file (PNG, JPG, WebP)');
                  }
                }
              }}
              className="relative flex flex-1 flex-col justify-center lg:h-full lg:overflow-hidden"
            >
              {/* Drag over overlay visual */}
              {isDraggingOver && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0d0d0f]/85 backdrop-blur-sm p-6 pointer-events-none transition-all duration-300">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#D46038] rounded-3xl p-8 max-w-sm text-center bg-zinc-950/95 shadow-2xl">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D46038]/10 text-[#E2906E] mb-4">
                      <UploadCloud className="h-7 w-7 animate-bounce" />
                    </div>
                    <h3 className="text-xs font-bold text-white tracking-widest uppercase">Drop Image Here</h3>
                    <p className="text-[11px] text-zinc-400 mt-1">Release to instantly swap and edit this subject in the studio!</p>
                  </div>
                </div>
              )}

              {/* Skip warnings toast if error occurred */}
              {errorMessage && (
                <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between rounded-xl bg-amber-950/40 border border-amber-500/10 p-3 text-xs text-amber-500 backdrop-blur-md">
                  <span>{errorMessage}</span>
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="rounded px-2.5 py-1 hover:bg-white/5 font-semibold text-[11px]"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <WorkspaceCanvas
                originalImg={originalImg}
                maskCanvas={maskCanvas}
                backdrop={selectedBackdrop}
                shadowOverlay={selectedShadow}
                placement={placement}
                setPlacement={setPlacement}
                enhancement={enhancement}
                shadowSettings={shadowSettings}
                aspectRatio={aspectRatio}
                onSelectSubject={() => {}}
                isProcessing={isProcessing}
                maskTrigger={maskTrigger}
                blurAreas={blurAreas}
                setBlurAreas={setBlurAreas}
                activeBlurId={activeBlurId}
                setActiveBlurId={setActiveBlurId}
              />
            </div>
          )}
        </main>
 
        {/* Right Side: Studio adjustments controls */}
        {originalImg && (
          <aside className="w-full lg:w-96 select-none border-t border-zinc-900 lg:border-t-0 shadow-2xl bg-[#121214] lg:h-full shrink-0 lg:overflow-hidden">
            <ControlPanel
              selectedBackdrop={selectedBackdrop}
              onSelectBackdrop={setSelectedBackdrop}
              selectedShadow={selectedShadow}
              onSelectShadow={setSelectedShadow}
              placement={placement}
              setPlacement={setPlacement}
              enhancement={enhancement}
              setEnhancement={setEnhancement}
              shadowSettings={shadowSettings}
              setShadowSettings={setShadowSettings}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              onResetLayout={handleResetLayout}
              originalImg={originalImg}
              maskCanvas={maskCanvas}
              onExportSuccess={handleExportSuccess}
              blurAreas={blurAreas}
              setBlurAreas={setBlurAreas}
              activeBlurId={activeBlurId}
              setActiveBlurId={setActiveBlurId}
            />
          </aside>
        )}
      </div>



      {/* PWA Save to Home Screen Modal Assistant */}
      {isInstallModalOpen && (
        <div id="pwa-install-lightbox" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-[#121214] p-6 shadow-2xl overflow-hidden">
            {/* Background ambient lighting */}
            <div className="absolute -top-12 -right-12 h-32 w-32 bg-[#D46038]/10 rounded-full blur-2xl pointer-events-none" />
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-zinc-850">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E2906E] to-[#D46038] text-white">
                  <Smartphone className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-tight">Save BigShort to Home Screen</h3>
                  <p className="text-[10px] text-zinc-400">Launch from your dock with a neat standalone workspace</p>
                </div>
              </div>
              <button 
                onClick={() => setIsInstallModalOpen(false)}
                className="rounded-full bg-zinc-900 p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Platform Selector Tabs */}
            <div className="grid grid-cols-3 mt-4 gap-1 p-1 bg-zinc-900/60 rounded-xl border border-zinc-850/50">
              <button
                onClick={() => setActiveInstallTab('ios')}
                className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  activeInstallTab === 'ios'
                    ? 'bg-[#D46038] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                }`}
              >
                Apple iOS
              </button>
              <button
                onClick={() => setActiveInstallTab('android')}
                className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  activeInstallTab === 'android'
                    ? 'bg-[#D46038] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                }`}
              >
                Android
              </button>
              <button
                onClick={() => setActiveInstallTab('desktop')}
                className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  activeInstallTab === 'desktop'
                    ? 'bg-[#D46038] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                }`}
              >
                Desktop
              </button>
            </div>

            {/* Dynamic Interactive Steps */}
            <div className="mt-5 space-y-4 text-xs">
              {activeInstallTab === 'ios' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300">
                      1
                    </div>
                    <p className="text-zinc-300 leading-relaxed pt-0.5">
                      Open <strong className="text-white">Safari Browser</strong> on your Apple device and navigate to BigShort Studio.
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300">
                      2
                    </div>
                    <p className="text-zinc-300 leading-relaxed pt-0.5 flex items-center flex-wrap gap-1">
                      Tap the <strong className="text-white inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-[11px]"><Share2 className="h-3 w-3 text-sky-450 inline" /> Share button</strong> in Safari's lower toolbar.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300">
                      3
                    </div>
                    <p className="text-zinc-300 leading-relaxed pt-0.5 flex items-center flex-wrap gap-1">
                      Scroll down and select <strong className="text-white inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-[11px]"><Plus className="h-3 w-3 text-[#E2906E] inline" /> Add to Home Screen</strong>.
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#D46038]/5 border border-[#D46038]/10 p-3 mt-2">
                    <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                      💡 Once added, BigShort launches like a real full-screen native system app with maximum viewport dimensions.
                    </p>
                  </div>
                </div>
              )}

              {activeInstallTab === 'android' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300">
                      1
                    </div>
                    <p className="text-zinc-300 leading-relaxed pt-0.5">
                      Navigate to BigShort Studio using Google Chrome or your default Android browser.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300">
                      2
                    </div>
                    <p className="text-zinc-300 leading-relaxed pt-0.5 flex items-center flex-wrap gap-1">
                      Tap the <strong className="text-white bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">More Menu (⋮)</strong> right of the web address bar.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300">
                      3
                    </div>
                    <p className="text-zinc-300 leading-relaxed pt-0.5">
                      Select <strong className="text-white font-semibold">Install App</strong> or <strong className="text-white">Add to Home Screen</strong>, confirm, and enjoy.
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#D46038]/5 border border-[#D46038]/10 p-3 mt-2">
                    <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                      💡 Pro Tip: Android handles automatic push integration & offline caching natively once stored in the app catalog.
                    </p>
                  </div>
                </div>
              )}

              {activeInstallTab === 'desktop' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300">
                      1
                    </div>
                    <p className="text-zinc-300 leading-relaxed pt-0.5">
                      Using Chrome, Safari, or Microsoft Edge on your computer, click the installation icon in your address bar:
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300">
                      2
                    </div>
                    <p className="text-zinc-300 leading-relaxed pt-0.5">
                      Look for a <strong className="text-white">monitor icon with a down arrow</strong> or open the browser menu and select <strong className="text-white">App &rarr; Install BigShort</strong>.
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-900/40 p-3.5 border border-zinc-850 font-sans text-[11px] text-zinc-400">
                    <span className="font-semibold text-[#E2906E] mb-1 block">💻 Shortcut Tip:</span>
                    Hit <kbd className="bg-zinc-800 text-white px-1.5 py-0.5 rounded text-[10px] border border-zinc-700">Cmd/Ctrl + D</kbd> to bookmark if you just want to keep it readily pinned to your browser quicktabs!
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="mt-6 pt-4 border-t border-zinc-850 flex gap-2">
              <button
                onClick={() => setIsInstallModalOpen(false)}
                className="flex-1 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 py-3 text-center text-xs font-semibold text-zinc-400 transition cursor-pointer"
              >
                Close Assistant
              </button>
              {deferredPrompt && (
                <button
                  onClick={() => {
                    handleInstallClick();
                    setIsInstallModalOpen(false);
                  }}
                  className="flex-1 rounded-xl bg-[#D46038] hover:bg-[#BE512B] py-3 text-center text-xs font-bold text-white transition shadow-lg shadow-[#D46038]/10 cursor-pointer animate-pulse"
                >
                  Prompt Install
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Creation History Modal Sandbox */}
      {isHistoryOpen && (
        <div id="history-lightbox" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-zinc-800 bg-[#121214] p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Background ambient lighting */}
            <div className="absolute -top-12 -right-12 h-32 w-32 bg-[#D46038]/10 rounded-full blur-2xl pointer-events-none" />
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-zinc-850 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E2906E] to-[#D46038] text-white">
                  <History className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-tight">Saved Creation History</h3>
                  <p className="text-[10px] text-zinc-400">Review, re-download, or manage your locally preserved composite designs</p>
                </div>
              </div>
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-full bg-zinc-900 p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Main Content wrapper */}
            <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1">
              {/* Disclaimer - Warm terracotta / amber alert box warning readers about local retention safety */}
              <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4 text-xs">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-amber-500 tracking-tight text-[12px] sm:text-[12.5px]">Local Sandbox Storage Disclaimer</h4>
                    <p className="text-zinc-400 leading-relaxed font-normal text-[11px] sm:text-[11.5px]">
                      To prioritize privacy, all compositions are cached completely inside your private browser sandbox database database (<code className="bg-zinc-900 px-1 py-0.5 rounded text-[10px] text-zinc-350">IndexedDB</code>). Clearing browser cache, scrubbing website data, or starting private browser tabs <strong>will instantly delete your saved history</strong>. Let this serve as a warning that we do not store backups of your files or assets on our servers.
                    </p>
                  </div>
                </div>
              </div>

              {/* History list container */}
              {historyItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900/80 border border-zinc-800 text-zinc-500 mb-4 animate-pulse">
                    <History className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-tight">Your History is Empty</h4>
                  <p className="mt-1 text-xs text-zinc-400 max-w-xs leading-relaxed">
                    Upload a portrait or merchandise asset, design a tailored aesthetic backdrop, and export a PNG. High-resolution composites will populate right here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {historyItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="group relative flex flex-col rounded-2xl border border-zinc-850 bg-zinc-900/40 p-3 hover:border-zinc-750 transition-all duration-300"
                    >
                      {/* Interactive Visual Preview Box */}
                      <div className="relative aspect-video w-full rounded-xl bg-zinc-950 border border-zinc-850/60 overflow-hidden group/thumb flex items-center justify-center shadow-inner">
                        <img
                          src={item.dataUrl}
                          alt={`Design from ${item.timestamp}`}
                          className="h-full w-full object-contain transition-transform duration-500 group-hover/thumb:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        {/* Hover Overlay triggers high-resolution manual download or design load */}
                        <div className="absolute inset-0 bg-black/85 opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 px-4 text-center">
                          <button
                            onClick={(e) => handleRestoreHistoryState(item, e)}
                            className="w-full max-w-[140px] inline-flex items-center justify-center gap-1.5 bg-[#D46038] hover:bg-[#E2906E] text-[11px] font-bold text-white px-3.5 py-2 rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
                          >
                            <Sliders className="h-3.5 w-3.5" />
                            Edit Design
                          </button>
                          <a
                            href={item.dataUrl}
                            download={`bigshort_composition_${Date.now()}.png`}
                            className="w-full max-w-[140px] inline-flex items-center justify-center gap-1.5 bg-white hover:bg-zinc-100 text-[11px] font-bold text-zinc-950 px-3.5 py-2 rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </a>
                        </div>
                      </div>

                      {/* Info & Delete Section */}
                      <div className="mt-2.5 flex items-start justify-between gap-2.5">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#E2906E] bg-[#D46038]/10 px-1.5 py-0.5 rounded border border-[#D46038]/20 inline-block mb-1">
                            {item.backdropName}
                          </span>
                          <div className="text-[11.5px] font-bold text-white tracking-tight truncate">
                            Ratio: {item.aspectRatio}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            {item.timestamp}
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                          className="rounded-xl p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 active:scale-95 transition-all cursor-pointer inline-flex items-center"
                          title="Permanently remove creation"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky/Footer summary wrapper controls */}
            <div className="pt-4 border-t border-zinc-850 flex items-center justify-between gap-4 shrink-0">
              {historyItems.length > 0 && (
                <div className="flex items-center">
                  {!showClearConfirm ? (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="rounded-xl bg-red-950/20 hover:bg-red-950/45 text-red-405 py-2 px-3 text-xs font-semibold transition cursor-pointer"
                    >
                      Delete All History
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-red-950/15 border border-red-500/10 p-1 px-2.5 rounded-xl">
                      <span className="text-[10px] font-semibold text-red-400">Clear {historyItems.length} items?</span>
                      <button
                        onClick={handleClearAllHistory}
                        className="rounded bg-red-500 hover:bg-red-650 text-white font-bold py-1 px-2.5 text-[9.5px] transition cursor-pointer"
                      >
                        Yes, Wipe
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-1 px-2 text-[9.5px] transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-xl bg-zinc-900 border border-zinc-800 w-full sm:w-28 py-2.5 text-center text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer ml-auto"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Standalone hidden native file input hook */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleImageUploaded(e.target.files[0]);
          }
        }}
      />
    </div>
  );
}
