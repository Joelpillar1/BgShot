import React, { useState, useEffect } from 'react';
import { Backdrop, ShadowOverlay, SubjectPlacement, SubjectEnhancement, SubjectShadow } from './types';
import { BACKDROPS, SHADOW_OVERLAYS } from './data/backdrops';
import ImageUploader from './components/ImageUploader';
import WorkspaceCanvas from './components/WorkspaceCanvas';
import ControlPanel from './components/ControlPanel';
import { initMaskFromTransparentImage } from './utils/mask-utils';
import { Sparkles, Sliders, Layers, RefreshCw, Smartphone, Monitor, ChevronRight, X, Share2, Plus, ArrowUpRight } from 'lucide-react';

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

export default function App() {
  const [originalImg, setOriginalImg] = useState<HTMLImageElement | null>(null);
  const [maskCanvas, setMaskCanvas] = useState<HTMLCanvasElement | null>(null);
  
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

  // Operational states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    setErrorMessage(null);
  };

  return (
    <div id="app-root-container" className="flex min-h-screen flex-col bg-[#0d0d0f] font-sans antialiased text-white select-none">
      {/* Shipos Promo Banner */}
      <div className="relative bg-[#09090b] border-b border-zinc-900 px-4 py-2.5 sm:py-2 text-center text-xs text-zinc-300 flex items-center justify-center gap-2 z-50 overflow-hidden">
        {/* Ambient premium aura */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-[#d26e46]/5 to-zinc-950 opacity-90 pointer-events-none" />
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-20 bg-[#d26e46]/10 rounded-full blur-2xl pointer-events-none" />
        
        <a 
          href="https://www.myshipos.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="relative group flex flex-col sm:flex-row items-center justify-center gap-x-3 gap-y-1.5 text-zinc-300 hover:text-white transition duration-200 w-full max-w-5xl"
        >
          {/* Authentic ShipOS Brand Badge */}
          <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800/80 px-2.5 py-0.5 rounded-lg text-white shadow-sm transition group-hover:bg-zinc-800/90 group-hover:border-zinc-700/80 shrink-0">
            <span className="font-sans font-bold tracking-tight text-[11px] sm:text-[12px] text-white flex items-center gap-0.5" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
              Ship
              <span className="inline-flex items-center justify-center bg-[#d26e46] text-[9px] font-medium text-white px-1 rounded-[5px] h-[14px] min-w-[18px] leading-none ml-0.5">
                OS
              </span>
            </span>
          </div>

          <span className="text-[11px] sm:text-xs text-zinc-400 font-normal text-center sm:text-left">
            Automate social posting: schedule content, generate with AI, and bulk-import posts effortlessly.
          </span>

          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#d26e46] group-hover:text-[#e4835a] transition-colors ml-1 uppercase tracking-wider shrink-0 bg-[#d26e46]/10 px-2 py-0.5 rounded border border-[#d26e46]/20 group-hover:border-[#d26e46]/40">
            Automate Now
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </a>
      </div>

      {/* Dynamic Header */}
      <header className="flex h-16 items-center justify-between border-b border-zinc-900 bg-[#121214]/60 px-6 backdrop-blur-xl shrink-0">
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
            <p className="hidden text-[10px] text-zinc-400 font-medium md:block">
              Photorealistic subject segmentation, dynamic lighting, and soft shadows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save to Home Screen Button */}
          {!originalImg && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 rounded-full border border-[#D46038]/30 bg-[#D46038]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#E2906E] transition hover:border-[#D46038]/60 hover:bg-[#D46038]/20 active:scale-95 cursor-pointer shadow-sm"
              title="Save BigShort Studio to your device Home Screen"
            >
              <Smartphone className="h-3.5 w-3.5 text-[#E2906E]" />
              <span className="hidden sm:inline">Save to Home Screen</span>
              <span className="sm:hidden">Install</span>
            </button>
          )}

          {originalImg && (
            <button
              onClick={handleClearImage}
              className="rounded-full border border-zinc-800 bg-zinc-900/40 px-3.5 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-zinc-700 hover:text-white active:scale-95"
            >
              Clear Scene
            </button>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* Left Side: Upload Zone / Live Canvas Compositor Preview */}
        <main className="sticky top-0 lg:static z-20 flex flex-col justify-between bg-zinc-950 lg:bg-zinc-950/30 border-b border-zinc-900 lg:border-b-0 shrink-0 lg:shrink lg:flex-1">
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
            <div className="relative flex flex-1 flex-col justify-center">
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
              />
            </div>
          )}
        </main>

        {/* Right Side: Studio adjustments controls */}
        {originalImg && (
          <aside className="w-full lg:w-96 select-none border-t border-zinc-900 lg:border-t-0 shadow-2xl bg-[#121214] lg:h-[calc(100vh-64px)] shrink-0">
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
    </div>
  );
}
