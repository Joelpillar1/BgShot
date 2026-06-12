import React, { useRef, useState, useEffect } from 'react';
import { Move, RotateCw, Maximize2, AlertCircle, ArrowUpRight, ZoomIn, ZoomOut, RotateCcw, Hand, EyeOff, X } from 'lucide-react';
import { Backdrop, ShadowOverlay, SubjectPlacement, SubjectEnhancement, SubjectShadow, BlurArea } from '../types';

interface WorkspaceCanvasProps {
  originalImg: HTMLImageElement | null;
  maskCanvas: HTMLCanvasElement | null;
  backdrop: Backdrop;
  shadowOverlay: ShadowOverlay;
  placement: SubjectPlacement;
  setPlacement: React.Dispatch<React.SetStateAction<SubjectPlacement>>;
  enhancement: SubjectEnhancement;
  shadowSettings: SubjectShadow;
  aspectRatio: string; // '1:1' | '4:5' | '16:9' | '9:16'
  onSelectSubject: () => void;
  isProcessing: boolean;
  maskTrigger?: number;
  blurAreas: BlurArea[];
  setBlurAreas: React.Dispatch<React.SetStateAction<BlurArea[]>>;
  activeBlurId: string | null;
  setActiveBlurId: (id: string | null) => void;
}

export default function WorkspaceCanvas({
  originalImg,
  maskCanvas,
  backdrop,
  shadowOverlay,
  placement,
  setPlacement,
  enhancement,
  shadowSettings,
  aspectRatio,
  onSelectSubject,
  isProcessing,
  maskTrigger,
  blurAreas,
  setBlurAreas,
  activeBlurId,
  setActiveBlurId,
}: WorkspaceCanvasProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const subjectCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isScaling, setIsScaling] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [placementStart, setPlacementStart] = useState<SubjectPlacement>({ ...placement });
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 400, height: 400 });

  // Workspace Blur Dragging States
  const [activeBlurDrag, setActiveBlurDrag] = useState<string | null>(null);
  const [blurDragStart, setBlurDragStart] = useState({ x: 0, y: 0 });
  const [blurAreaStartPos, setBlurAreaStartPos] = useState({ x: 0, y: 0 });

  // Viewport Zoom & Drag-panning viewport states
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanningCanvas, setIsPanningCanvas] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanToolActive, setIsPanToolActive] = useState<boolean>(false);

  // Spacebar keybind for Pan Tool toggle (hold/release)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPanToolActive(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsPanToolActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Trackpad pinch-to-zoom / Mouse-wheel + Command/Ctrl zoom listener
  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = 0.05;
        const delta = -e.deltaY * factor;
        setZoom((prev) => {
          const next = Math.min(Math.max(prev + (delta > 0 ? 0.1 : -0.1), 0.25), 4.0);
          return Math.round(next * 100) / 100;
        });
      }
    };

    parent.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      parent.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Pointer panning canvas handlers
  const handleParentPointerDown = (e: React.PointerEvent) => {
    // Only pan if we click directly on the parent backdrop area,
    // OR if the dedicated Spacebar/button Hand/Pan tool is active.
    const isParent = e.target === e.currentTarget;
    const isCanvasCompositorClick = containerRef.current?.contains(e.target as Node);
    const hasPanAttr = (e.target as HTMLElement).getAttribute('data-pan-target') === 'true';

    const shouldPan = isParent || hasPanAttr || (isPanToolActive && isCanvasCompositorClick);
    const isInteractiveBtn = (e.target as HTMLElement).closest('a, button, select, input');

    if (!shouldPan || isInteractiveBtn) return;

    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsPanningCanvas(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleParentPointerMove = (e: React.PointerEvent) => {
    if (!isPanningCanvas) return;
    const x = e.clientX - panStart.x;
    const y = e.clientY - panStart.y;
    setPan({ x, y });
  };

  const handleParentPointerUp = (e: React.PointerEvent) => {
    if (!isPanningCanvas) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsPanningCanvas(false);
  };

  // Calculate maximum fitting dimensions based on parent container size
  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      
      let R = 1;
      if (aspectRatio && aspectRatio.includes(':')) {
        const [wStr, hStr] = aspectRatio.split(':');
        const w = parseFloat(wStr || '1');
        const h = parseFloat(hStr || '1');
        if (!isNaN(w) && !isNaN(h) && h !== 0) {
          R = w / h;
        }
      } else {
        if (aspectRatio === '4:5') R = 4 / 5;
        else if (aspectRatio === '16:9') R = 16 / 9;
        else if (aspectRatio === '9:16') R = 9 / 16;
        else R = 1; // 1:1
      }

      const paddingX = 32;
      const paddingY = 40;
      const feedbackTextBuffer = originalImg ? 36 : 0;
      
      const wAvail = Math.max(width - paddingX, 150);
      const hAvail = Math.max(height - paddingY - feedbackTextBuffer, 150);

      // Enforce elegant desktop sizing limit
      const wMaxLimit = 540;
      
      const wTargetMax = Math.min(wAvail, wMaxLimit);
      const hTargetMax = hAvail;

      // Draft a width-constrained design
      let finalW = wTargetMax;
      let finalH = finalW / R;

      // Fit inside height limit if too tall
      if (finalH > hTargetMax) {
        finalH = hTargetMax;
        finalW = finalH * R;
      }

      setDimensions({ 
        width: Math.floor(finalW), 
        height: Math.floor(finalH) 
      });
    };

    const resizeObserver = new ResizeObserver((entries) => {
      window.requestAnimationFrame(() => {
        handleResize(entries);
      });
    });

    resizeObserver.observe(parent);

    return () => {
      resizeObserver.disconnect();
    };
  }, [aspectRatio, originalImg]);

  // Update subject canvas when original image or mask updates
  useEffect(() => {
    updateSubjectCanvas();
  }, [originalImg, maskCanvas, maskTrigger]);

  const updateSubjectCanvas = () => {
    const canvas = subjectCanvasRef.current;
    if (!canvas || !originalImg || !maskCanvas) return;

    canvas.width = originalImg.naturalWidth;
    canvas.height = originalImg.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw original image
    ctx.drawImage(originalImg, 0, 0);

    // Composite mask
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  };

  // Convert aspect ratio selection to Tailwind padding percentage or styling
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '4:5': return 'aspect-[4/5]';
      case '16:9': return 'aspect-[16/9]';
      case '9:16': return 'aspect-[9/16]';
      case '1:1':
      default: return 'aspect-square';
    }
  };

  // Drag handlers for the subject
  const handlePointerDown = (e: React.PointerEvent, action: 'drag' | 'rotate' | 'scale') => {
    if (isPanToolActive && action === 'drag') {
      // Let pointer down event bubble up to trigger workspace panning!
      return;
    }
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setDragStart({ x: e.clientX, y: e.clientY });
    setPlacementStart({ ...placement });

    if (action === 'drag') setIsDragging(true);
    if (action === 'rotate') setIsRotating(true);
    if (action === 'scale') setIsScaling(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging && !isRotating && !isScaling) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    if (isDragging && containerRef.current) {
      // Map pixel delta to percentage movement
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      // Adjust coordinate mapping based on zoom level to ensure tactile alignment on-screen
      const pctX = (deltaX / (containerWidth * zoom)) * 100;
      const pctY = (deltaY / (containerHeight * zoom)) * 100;

      setPlacement((prev) => ({
        ...prev,
        x: Math.min(Math.max(placementStart.x + pctX, -150), 150),
        y: Math.min(Math.max(placementStart.y + pctY, -150), 150),
      }));
    }

    if (isScaling) {
      // Scaling slider equivalent from center drag distance
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const direction = deltaX + deltaY > 0 ? 1 : -1;
      const scaleDelta = (distance / 200) * direction;

      setPlacement((prev) => ({
        ...prev,
        scale: Math.min(Math.max(placementStart.scale + scaleDelta, 0.05), 8.0),
      }));
    }

    if (isRotating) {
      // Calculate angle from center of drag point
      const angleDelta = (deltaX + deltaY) * 0.5; // simple turn relative tracking
      setPlacement((prev) => ({
        ...prev,
        rotation: (placementStart.rotation + angleDelta) % 360,
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsDragging(false);
    setIsRotating(false);
    setIsScaling(false);
  };

  const handleBlurPointerDown = (e: React.PointerEvent, id: string) => {
    if (isPanToolActive) return;
    e.stopPropagation();
    e.preventDefault();
    setActiveBlurId(id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const area = blurAreas.find(a => a.id === id);
    if (area) {
      setBlurDragStart({ x: e.clientX, y: e.clientY });
      setBlurAreaStartPos({ x: area.x, y: area.y });
      setActiveBlurDrag(id);
    }
  };

  const handleBlurPointerMove = (e: React.PointerEvent, id: string) => {
    if (activeBlurDrag !== id || !containerRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    
    const deltaX = e.clientX - blurDragStart.x;
    const deltaY = e.clientY - blurDragStart.y;
    
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    const pctX = (deltaX / (containerWidth * zoom)) * 100;
    const pctY = (deltaY / (containerHeight * zoom)) * 100;

    const area = blurAreas.find(a => a.id === id);
    if (!area) return;

    // Boundaries: clamp value inside [0, 100 - size]
    const nextX = Math.min(Math.max(blurAreaStartPos.x + pctX, 0), 100 - area.width);
    const nextY = Math.min(Math.max(blurAreaStartPos.y + pctY, 0), 100 - area.height);

    setBlurAreas(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, x: nextX, y: nextY };
      }
      return a;
    }));
  };

  const handleBlurPointerUp = (e: React.PointerEvent, id: string) => {
    if (activeBlurDrag === id) {
      e.stopPropagation();
      e.preventDefault();
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      setActiveBlurDrag(null);
    }
  };

  // Setup visual filter adjustments
  const getFilterStyle = () => {
    const b = enhancement.brightness;
    const c = enhancement.contrast;
    const s = enhancement.saturation;
    const exp = 100 + enhancement.exposure; // percentage map approximation
    return `brightness(${b * (exp / 100)}) contrast(${c}) saturate(${s})`;
  };

  // Render direct leaf and grid casts in UI
  const renderShadowOverlay = () => {
    if (!shadowOverlay.svgPath) return null;

    return (
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        viewBox="0 0 800 800"
        preserveAspectRatio="none"
        style={{
          filter: `blur(${shadowOverlay.blur}px)`,
          opacity: shadowOverlay.intensity,
          mixBlendMode: 'multiply',
        }}
      >
        <path
          d={shadowOverlay.svgPath}
          fill="#1c1c1f"
          stroke={shadowOverlay.id.includes('window') || shadowOverlay.id.includes('pane') ? '#1c1c1f' : 'none'}
          strokeWidth={shadowOverlay.id.includes('window') || shadowOverlay.id.includes('pane') ? '35' : '0'}
        />
      </svg>
    );
  };

  return (
    <div 
      ref={parentRef} 
      className={`flex flex-1 flex-col items-center justify-center p-3 sm:p-4 lg:p-6 w-full h-full min-h-0 overflow-hidden relative select-none ${
        isPanToolActive ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
      onPointerDown={handleParentPointerDown}
      onPointerMove={handleParentPointerMove}
      onPointerUp={handleParentPointerUp}
    >
      {/* Zoom / Pan helper hint toast */}
      {originalImg && zoom > 1.0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/85 text-[10px] border border-zinc-800/60 text-zinc-350 px-3 py-1.5 rounded-full pointer-events-none backdrop-blur-md shadow-xl flex items-center gap-1">
          <Hand className="h-3 w-3 text-[#E2906E]" />
          <span>Drag backdrop or hold Space to pan composition</span>
        </div>
      )}

      {/* Aspect Wrapper Box */}
      <div 
        style={{ 
          width: `${dimensions.width}px`, 
          height: `${dimensions.height}px`,
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'center',
          transition: isPanningCanvas ? 'none' : 'transform 0.15s ease-out',
        }} 
        className="relative shrink-0 flex flex-col justify-center select-none"
      >
        <div
          ref={containerRef}
          id="workspace-compositor-frame"
          className={`relative h-full w-full overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl transition-all duration-300 ${
            isPanToolActive ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          style={{
            background: backdrop.category === 'images' 
              ? `url(${backdrop.value}) center/cover no-repeat` 
              : backdrop.value,
          }}
        >
          {/* Transparent grid backg for empty states */}
          {!originalImg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 px-6 text-center text-zinc-500">
              <svg
                className="mb-4 h-12 w-12 text-zinc-700 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-sm font-semibold text-zinc-400">Preview Studio</h3>
              <p className="mt-1 text-xs text-zinc-600 max-w-xs">
                Upload your product image to instantly start composition and backdrop staging
              </p>
            </div>
          )}

          {/* Subtle noise texture layer for natural organic feel */}
          {originalImg && (
            <div 
              className="pointer-events-none absolute inset-0 mix-blend-overlay select-none" 
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                opacity: backdrop.category === 'presets' ? 0.35 : 0.08,
              }}
            />
          )}

          {/* 1. Spotlight Overlay effect */}
          {originalImg && backdrop.spotlight && (
            <div
              className="pointer-events-none absolute inset-0 mix-blend-soft-light"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.7) 0%, rgba(0,0,0,0.15) 80%)',
              }}
            />
          )}

          {/* 2. Vector Ambient shadows (Palm leaf, grids, blinds) */}
          {originalImg && renderShadowOverlay()}

          {/* 3. Subject Canvas with Gestures */}
          {originalImg && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                // Heatmap warm/cool temperature adjustment
                filter: `hue-rotate(${enhancement.temperature * 0.15}deg)`,
              }}
            >
              {/* Position and Scale Wrapper */}
              <div
                className={`pointer-events-auto relative select-none ${
                  isPanToolActive ? 'cursor-grab' : 'cursor-grab active:cursor-grabbing'
                }`}
                onClick={(e) => {
                  if (isPanToolActive) return;
                  onSelectSubject();
                }}
                onPointerDown={(e) => handlePointerDown(e, 'drag')}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{
                  transform: `translate3d(${placement.x}%, ${placement.y}%, 0) scale(${placement.scale}) rotate(${placement.rotation}deg) scaleX(${placement.flipX ? -1 : 1})`,
                  width: '60%',
                  aspectRatio: `${placement.aspectRatio || 1}`,
                  borderRadius: `${placement.borderRadius ?? 12}px`,
                  boxShadow: shadowSettings.enabled
                    ? `${shadowSettings.offsetX}px ${shadowSettings.offsetY}px ${shadowSettings.blur}px rgba(0,0,0,${shadowSettings.opacity})`
                    : 'none',
                }}
              >
                {/* Visual Canvas Element containing the alpha-masked cut-out */}
                <canvas
                  ref={subjectCanvasRef}
                  className="pointer-events-none h-full w-full object-cover rounded-none animate-fade-in"
                  style={{
                    filter: `${getFilterStyle()}`,
                    borderRadius: `${placement.borderRadius ?? 12}px`,
                  }}
                />

                {/* No visual frame/ring active transform overlay: image stands completely alone as requested */}
              </div>
            </div>
          )}

          {/* Dynamic Interactive Blur/Redaction Overlays */}
          {originalImg && blurAreas && blurAreas.map((area) => (
            <div
              key={area.id}
              style={{
                position: 'absolute',
                left: `${area.x}%`,
                top: `${area.y}%`,
                width: `${area.width}%`,
                height: `${area.height}%`,
                backdropFilter: `blur(${area.blur}px)`,
                WebkitBackdropFilter: `blur(${area.blur}px)`,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: activeBlurId === area.id ? '2px solid #E2906E' : '1px dashed rgba(255, 255, 255, 0.45)',
                borderRadius: '6px',
                zIndex: 42,
                cursor: isPanToolActive ? 'inherit' : 'move',
              }}
              className="pointer-events-auto shadow-md overflow-visible select-none group"
              onPointerDown={(e) => handleBlurPointerDown(e, area.id)}
              onPointerMove={(e) => handleBlurPointerMove(e, area.id)}
              onPointerUp={(e) => handleBlurPointerUp(e, area.id)}
            >
              {/* Inner Label for Blur Area */}
              <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  filter: 'none',
                  backdropFilter: 'none',
                }}
              >
                <div className="bg-zinc-950/75 border border-zinc-800 rounded px-1.5 py-0.5 text-[8px] font-mono text-zinc-300 uppercase tracking-wider flex items-center gap-1 scale-90 sm:scale-100 transition duration-250 select-none">
                  <EyeOff className="h-2.5 w-2.5 text-[#E2906E]" />
                  <span>Blur</span>
                </div>
              </div>

              {/* Delete Icon Indicator floating at corner */}
              {activeBlurId === area.id && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setBlurAreas(prev => prev.filter(a => a.id !== area.id));
                    if (activeBlurId === area.id) {
                      setActiveBlurId(null);
                    }
                  }}
                  className="absolute -top-2.5 -right-2.5 h-5 w-5 rounded-full bg-red-600 hover:bg-red-500 border border-zinc-800 text-white flex items-center justify-center scale-100 hover:scale-110 active:scale-95 transition-all shadow-lg pointer-events-auto z-50 cursor-pointer"
                  title="Remove Blur Area"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {/* Post with ShipOS action overlay */}
          {originalImg && !isProcessing && (
            <a
              href="https://www.myshipos.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-3 right-3 z-30 group inline-flex items-center gap-1.5 rounded-xl bg-zinc-950/85 hover:bg-zinc-900 border border-zinc-800/80 hover:border-[#d26e46]/60 px-3 py-1.5 text-xs font-semibold text-white shadow-2xl transition-all duration-300 pointer-events-auto backdrop-blur-md active:scale-95"
            >
              <span className="flex items-center gap-0.5 text-[10px] sm:text-[11px] font-black tracking-tight text-white" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
                Ship
                <span className="inline-flex items-center justify-center bg-[#d26e46] text-[7.5px] font-bold text-white px-0.5 rounded-[3px] h-[12px] min-w-[14px] leading-none ml-0.5">
                  OS
                </span>
              </span>
              <span className="h-3 w-[1px] bg-zinc-800" />
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-300 group-hover:text-white flex items-center gap-1">
                Post with ShipOS
                <ArrowUpRight className="h-3 w-3 text-[#d26e46] group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </a>
          )}

          {/* Loading Indicator */}
          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 backdrop-blur-md text-white">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <p className="mt-4 text-xs font-semibold tracking-wide uppercase text-neutral-300">
                Segmenting Subject...
              </p>
              <p className="mt-1 text-[10px] text-neutral-500">Executing browser neural networks</p>
            </div>
          )}
        </div>

        {/* Small interaction reminder */}
        {originalImg && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
            <AlertCircle className="h-3.5 w-3.5 text-zinc-400" />
            <span>Click and drag the image to adjust its position. Use the right-hand panel sliders to control size, rotation, and corner roundedness!</span>
          </div>
        )}
      </div>

      {/* Floating Canvas Zoom and Pan Tool controls panel */}
      {originalImg && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center bg-zinc-950/90 border border-zinc-800 px-2 py-1.5 rounded-full shadow-2xl backdrop-blur-md transition-all duration-300 gap-1 select-none">
          {/* Active Hand Mode button */}
          <button
            type="button"
            onClick={() => setIsPanToolActive(!isPanToolActive)}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
              isPanToolActive 
                ? 'bg-[#D46038] text-white shadow-lg shadow-[#D46038]/25 scale-100' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
            title={isPanToolActive ? "Pan tool active (Click drag canvas to navigate)" : "Activate Navigation Pan Tool (Space or keyboard button)"}
          >
            <Hand className="h-4 w-4" />
          </button>

          <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.25))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:text-white hover:bg-zinc-900 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            title="Zoom Out"
            disabled={zoom <= 0.25}
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          {/* Current Zoom percent Indicator */}
          <button
            type="button"
            onClick={() => { setZoom(1.0); setPan({ x: 0, y: 0 }); }}
            className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold text-zinc-350 hover:text-white hover:bg-zinc-900 min-w-[54px] text-center transition"
            title="Double click or click to reset canvas zoom and view center (100%)"
          >
            {Math.round(zoom * 100)}%
          </button>

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={() => setZoom(prev => Math.min(prev + 0.25, 4.0))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:text-white hover:bg-zinc-900 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            title="Zoom In"
            disabled={zoom >= 4.0}
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

          {/* Reset Zoom / Fit To Viewport button */}
          <button
            type="button"
            onClick={() => { setZoom(1.0); setPan({ x: 0, y: 0 }); }}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition text-zinc-400 hover:text-white hover:bg-zinc-900 active:scale-95 ${
              zoom !== 1.0 || pan.x !== 0 || pan.y !== 0 ? 'text-[#E2906E]' : ''
            }`}
            title="Reset Pan and Zoom position"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
