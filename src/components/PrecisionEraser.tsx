import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Paintbrush, Sparkles, RotateCcw, Check, X, ShieldAlert, Sliders } from 'lucide-react';
import { applyChromaKey } from '../utils/mask-utils';

interface PrecisionEraserProps {
  isOpen: boolean;
  onClose: () => void;
  originalImg: HTMLImageElement | null;
  maskCanvas: HTMLCanvasElement | null;
  onMaskUpdated: () => void;
}

export default function PrecisionEraser({
  isOpen,
  onClose,
  originalImg,
  maskCanvas,
  onMaskUpdated,
}: PrecisionEraserProps) {
  if (!isOpen || !originalImg || !maskCanvas) return null;

  const containerRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [brushMode, setBrushMode] = useState<'erase' | 'restore' | 'wand'>('erase');
  const [brushSize, setBrushSize] = useState<number>(30);
  const [wandTolerance, setWandTolerance] = useState<number>(40);
  const [isDrawing, setIsDrawing] = useState(false);
  const [maskOverlay, setMaskOverlay] = useState<boolean>(true); // red highlight overlay
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);

  // Layout measurements
  const [scale, setScale] = useState<number>(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Save initial state for undo
    saveHistoryState();
    calculateBestFit();
    window.addEventListener('resize', calculateBestFit);
    return () => {
      window.removeEventListener('resize', calculateBestFit);
    };
  }, [originalImg]);

  const calculateBestFit = () => {
    if (!containerRef.current || !originalImg) return;
    const contWidth = containerRef.current.clientWidth - 40;
    const contHeight = containerRef.current.clientHeight - 120;
    const imgWidth = originalImg.naturalWidth;
    const imgHeight = originalImg.naturalHeight;

    const scaleX = contWidth / imgWidth;
    const scaleY = contHeight / imgHeight;
    const finalScale = Math.min(scaleX, scaleY, 1); // don't scale up past original size

    setScale(finalScale);
    setOffset({
      x: (containerRef.current.clientWidth - imgWidth * finalScale) / 2,
      y: (containerRef.current.clientHeight - 80 - imgHeight * finalScale) / 2 + 60,
    });
  };

  const saveHistoryState = () => {
    if (!maskCanvas) return;
    const dataUrl = maskCanvas.toDataURL();
    setUndoStack((prev) => [...prev, dataUrl]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length <= 1 || !maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    const previousStateString = undoStack[undoStack.length - 2];
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      ctx.drawImage(img, 0, 0);
      onMaskUpdated();
      redrawWorkspace();
    };
    img.src = previousStateString;

    setRedoStack((prev) => [...prev, undoStack[undoStack.length - 1]]);
    setUndoStack((prev) => prev.slice(0, -1));
  };

  // Re-draw workspace on changes
  const redrawWorkspace = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas || !originalImg || !maskCanvas) return;

    canvas.width = originalImg.naturalWidth;
    canvas.height = originalImg.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw opaque original image
    ctx.drawImage(originalImg, 0, 0);

    // Draw transparent overlay depending on mode
    ctx.save();
    if (maskOverlay) {
      // Red overlay for invisible regions
      const maskCtx = maskCanvas.getContext('2d');
      if (maskCtx) {
        const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        const data = maskData.data;

        const overlayCanvas = document.createElement('canvas');
        overlayCanvas.width = canvas.width;
        overlayCanvas.height = canvas.height;
        const oCtx = overlayCanvas.getContext('2d');
        if (oCtx) {
          const oData = oCtx.createImageData(canvas.width, canvas.height);
          const oPixels = oData.data;

          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha < 128) {
              // Red overlay for masked (deleted) areas
              oPixels[i] = 239;     // R
              oPixels[i + 1] = 68;   // G
              oPixels[i + 2] = 68;   // B
              oPixels[i + 3] = 140;  // A (semi-transparent)
            }
          }
          oCtx.putImageData(oData, 0, 0);
          ctx.drawImage(overlayCanvas, 0, 0);
        }
      }
    } else {
      // Show checkboard representation
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(maskCanvas, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  };

  // Trigger redraw whenever scale, mode, or mask updates
  useEffect(() => {
    redrawWorkspace();
  }, [originalImg, scale, offset, maskOverlay, brushMode]);

  // Handle pointer coordinate mapping
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords || !maskCanvas || !originalImg) return;

    if (brushMode === 'wand') {
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) return;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = originalImg.naturalWidth;
      tempCanvas.height = originalImg.naturalHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;
      tempCtx.drawImage(originalImg, 0, 0);

      const xPixel = Math.floor(coords.x);
      const yPixel = Math.floor(coords.y);
      const pixel = tempCtx.getImageData(xPixel, yPixel, 1, 1).data;

      applyChromaKey(
        originalImg,
        maskCanvas,
        coords.x,
        coords.y,
        pixel[0],
        pixel[1],
        pixel[2],
        wandTolerance,
        2
      );

      saveHistoryState();
      onMaskUpdated();
      redrawWorkspace();
      return;
    }

    setIsDrawing(true);
    draw(coords.x, coords.y, true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;

    draw(coords.x, coords.y, false);
  };

  const handlePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistoryState();
      onMaskUpdated();
      redrawWorkspace();
    }
  };

  const draw = (x: number, y: number, isStart: boolean) => {
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;

    if (brushMode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out'; // clear to transparent
    } else {
      ctx.globalCompositeOperation = 'source-over'; // draw solid white
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#FFFFFF';
    }

    if (isStart) {
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Connect stroke with lines for smooth brushing
      ctx.beginPath();
      // We start slightly behind, but browser events are fast enough
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Redraw onscreen canvas
    redrawWorkspace();
  };

  const handleFillAll = () => {
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    saveHistoryState();
    onMaskUpdated();
    redrawWorkspace();
  };

  const handleClearAll = () => {
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    saveHistoryState();
    onMaskUpdated();
    redrawWorkspace();
  };

  return (
    <div id="precision-eraser-modal" className="fixed inset-0 z-50 flex flex-col bg-[#0d0d0f] font-sans antialiased text-white">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-white/5 bg-[#121214] px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-medium tracking-wide text-white">Mask Fine-Tuning</h2>
            <p className="text-xs text-neutral-400">Perfect your cutout edges with high precision brushes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo Button */}
          <button
            onClick={handleUndo}
            disabled={undoStack.length <= 1}
            className="flex h-9 items-center justify-center gap-1 rounded-full px-4 text-xs font-medium text-neutral-300 transition hover:bg-white/5 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Undo
          </button>

          <button
            onClick={onClose}
            className="flex h-9 items-center gap-1 rounded-full bg-white px-5 text-xs font-semibold text-black transition hover:bg-white/90 active:scale-95"
          >
            <Check className="h-4 w-4" />
            Apply Changes
          </button>
        </div>
      </header>

      {/* Workspace Area */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Main Canvas Container */}
        <div
          ref={containerRef}
          className="relative flex-1 overflow-hidden"
          style={{
            backgroundImage: 'radial-gradient(ellipse at center, #1b1b1f 0%, #0d0d0f 100%)',
          }}
        >
          {/* Transparency grid background (simulated in CSS underneath) */}
          <div
            className="absolute shadow-2xl transition-transform duration-75"
            style={{
              width: originalImg.naturalWidth * scale,
              height: originalImg.naturalHeight * scale,
              left: offset.x,
              top: offset.y,
              backgroundImage: !maskOverlay
                ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 8 8\'%3E%3Crect fill=\'%231f1f23\' width=\'8\' height=\'8\'/%3E%3Cpath d=\'M0,0H4V4H0ZM4,4H8V8H4Z\' fill=\'%2329292e\'/%3E%3C/svg%3E")'
                : 'none',
              backgroundColor: maskOverlay ? '#16161a' : 'transparent',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <canvas
              ref={drawingCanvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="h-full w-full cursor-crosshair touch-none"
            />
          </div>

          {/* Quick Info Card */}
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/5 bg-black/60 px-4 py-2 text-[11px] text-neutral-400 backdrop-blur-md">
            <span>Drag mouse/finger to brush. Change modes in the toolkit on the right.</span>
          </div>
        </div>

        {/* Toolbar panel */}
        <aside className="w-full border-t border-white/5 bg-[#121214] p-6 lg:w-80 lg:border-t-0 lg:border-l">
          <div className="flex flex-col gap-6">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Brush Settings</span>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  onClick={() => setBrushMode('erase')}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 border transition active:scale-95 ${
                    brushMode === 'erase'
                      ? 'border-white bg-white/5 text-white font-medium'
                      : 'border-white/5 bg-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  <Eraser className="h-4.5 w-4.5" />
                  <span className="text-[11px]">Erase Mask</span>
                </button>

                <button
                  onClick={() => setBrushMode('restore')}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 border transition active:scale-95 ${
                    brushMode === 'restore'
                      ? 'border-white bg-white/5 text-white font-medium'
                      : 'border-white/5 bg-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  <Paintbrush className="h-4.5 w-4.5" />
                  <span className="text-[11px]">Restore Part</span>
                </button>

                <button
                  onClick={() => setBrushMode('wand')}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 border transition active:scale-95 ${
                    brushMode === 'wand'
                      ? 'border-white bg-white/5 text-white font-medium'
                      : 'border-white/5 bg-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-4.5 w-4.5 text-amber-400" />
                  <span className="text-[11px]">Color Key</span>
                </button>
              </div>
            </div>

            {/* Slider depends on brush vs wand */}
            {brushMode !== 'wand' ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Brush Size</span>
                  <span className="font-mono text-white">{brushSize}px</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-white"
                />
                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>Fine</span>
                  <span>Coarse</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Chroma Tolerance</span>
                  <span className="font-mono text-white">{wandTolerance}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="150"
                  value={wandTolerance}
                  onChange={(e) => setWandTolerance(parseInt(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-white"
                />
                <div className="text-[10px] text-neutral-500">
                  Click a solid background color on the image to wipe it out.
                </div>
              </div>
            )}

            {/* View overlays */}
            <div className="border-t border-white/5 pt-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Viewer Mode</span>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-white/5 p-3">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-white">Red Rubylith Overlay</span>
                  <span className="text-[10px] text-neutral-400">Highlights transparent regions in bold red</span>
                </div>
                <button
                  onClick={() => setMaskOverlay(!maskOverlay)}
                  className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    maskOverlay ? 'bg-white' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                      maskOverlay ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Quick Bulk Operations */}
            <div className="border-t border-white/5 pt-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Quick Tools</span>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleFillAll}
                  className="flex-1 rounded-lg border border-white/5 bg-white/5 py-2 text-[11px] font-medium text-neutral-300 transition hover:bg-white/10 active:scale-95"
                >
                  Unhide Entire Image
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 rounded-lg border border-red-500/10 bg-red-500/5 py-2 text-[11px] font-medium text-red-400 transition hover:bg-red-500/10 active:scale-95"
                >
                  Erase Entire Image
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
