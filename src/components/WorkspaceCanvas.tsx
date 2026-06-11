import React, { useRef, useState, useEffect } from 'react';
import { Move, RotateCw, Maximize2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Backdrop, ShadowOverlay, SubjectPlacement, SubjectEnhancement, SubjectShadow } from '../types';

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
}: WorkspaceCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const subjectCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isScaling, setIsScaling] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [placementStart, setPlacementStart] = useState<SubjectPlacement>({ ...placement });

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

      const pctX = (deltaX / containerWidth) * 100;
      const pctY = (deltaY / containerHeight) * 100;

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
    <div className="flex flex-1 flex-col items-center justify-center p-3 sm:p-4 lg:p-8">
      {/* Aspect Wrapper Box */}
      <div className="w-full max-w-lg md:max-w-xl">
        <div
          ref={containerRef}
          id="workspace-compositor-frame"
          className={`relative w-full overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl transition-all duration-300 ${getAspectRatioClass()}`}
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
                className="pointer-events-auto relative cursor-grab select-none active:cursor-grabbing"
                onClick={onSelectSubject}
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
    </div>
  );
}
