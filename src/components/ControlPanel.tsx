import React, { useState } from 'react';
import { Backdrop, ShadowOverlay, SubjectPlacement, SubjectEnhancement, SubjectShadow } from '../types';
import { SHADOW_OVERLAYS } from '../data/backdrops';
import { Sliders, Sun, Palette, Sparkles, Download, Layers, FlipHorizontal, Eye, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react';
import BackdropSelector from './BackdropSelector';

interface ControlPanelProps {
  selectedBackdrop: Backdrop;
  onSelectBackdrop: (backdrop: Backdrop) => void;
  selectedShadow: ShadowOverlay;
  onSelectShadow: (shadow: ShadowOverlay) => void;
  placement: SubjectPlacement;
  setPlacement: React.Dispatch<React.SetStateAction<SubjectPlacement>>;
  enhancement: SubjectEnhancement;
  setEnhancement: React.Dispatch<React.SetStateAction<SubjectEnhancement>>;
  shadowSettings: SubjectShadow;
  setShadowSettings: React.Dispatch<React.SetStateAction<SubjectShadow>>;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
  onResetLayout: () => void;
  originalImg: HTMLImageElement | null;
  maskCanvas: HTMLCanvasElement | null;
}

export default function ControlPanel({
  selectedBackdrop,
  onSelectBackdrop,
  selectedShadow,
  onSelectShadow,
  placement,
  setPlacement,
  enhancement,
  setEnhancement,
  shadowSettings,
  setShadowSettings,
  aspectRatio,
  setAspectRatio,
  onResetLayout,
  originalImg,
  maskCanvas,
}: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState<'backdrop' | 'filters' | 'shadow'>('backdrop');
  const [isExporting, setIsExporting] = useState(false);
  const [exportedImageUrl, setExportedImageUrl] = useState<string | null>(null);
  const [showPosition, setShowPosition] = useState(false);
  const [showColorAdjustments, setShowColorAdjustments] = useState(false);

  const handleExportPNG = () => {
    if (!originalImg || !maskCanvas) return;
    setIsExporting(true);

    // Run export in an animation frame so UI states can update first
    requestAnimationFrame(async () => {
      try {
        // Build the subject canvas
        const subjectCanvas = document.createElement('canvas');
        subjectCanvas.width = originalImg.naturalWidth;
        subjectCanvas.height = originalImg.naturalHeight;
        const subjCtx = subjectCanvas.getContext('2d');
        if (!subjCtx) {
          setIsExporting(false);
          return;
        }

        // Clip to the user's custom border-radius before drawing
        const borderRadiusSetting = placement.borderRadius ?? 24;
        if (borderRadiusSetting > 0) {
          subjCtx.save();
          subjCtx.beginPath();
          // Scale pixel representation proportionate to actual image dimensions
          const previewWidth = 256;
          const originalScaleFactor = originalImg.naturalWidth / previewWidth;
          const scaledRadius = Math.min(borderRadiusSetting * originalScaleFactor, Math.min(originalImg.naturalWidth, originalImg.naturalHeight) / 2);
          
          if (subjCtx.roundRect) {
            subjCtx.roundRect(0, 0, originalImg.naturalWidth, originalImg.naturalHeight, scaledRadius);
          } else {
            // Precise cross-browser path fallback
            const x = 0;
            const y = 0;
            const w = originalImg.naturalWidth;
            const h = originalImg.naturalHeight;
            const r = scaledRadius;
            subjCtx.moveTo(x + r, y);
            subjCtx.lineTo(x + w - r, y);
            subjCtx.quadraticCurveTo(x + w, y, x + w, y + r);
            subjCtx.lineTo(x + w, y + h - r);
            subjCtx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            subjCtx.lineTo(x + r, y + h);
            subjCtx.quadraticCurveTo(x, y + h, x, y + h - r);
            subjCtx.lineTo(x, y + r);
            subjCtx.quadraticCurveTo(x, y, x + r, y);
          }
          subjCtx.clip();
        }

        subjCtx.drawImage(originalImg, 0, 0);
        subjCtx.globalCompositeOperation = 'destination-in';
        subjCtx.drawImage(maskCanvas, 0, 0);
        subjCtx.globalCompositeOperation = 'source-over';

        if (borderRadiusSetting > 0) {
          subjCtx.restore();
        }

        // Choose master resolution based on aspect ratio and original image
        // To keep detail sharp, set export size around 2048px on the longest edge
        const exportMaxEdge = 2048;
        let exportW = exportMaxEdge;
        let exportH = exportMaxEdge;

        if (aspectRatio === '4:5') {
          exportW = Math.round(exportMaxEdge * 0.8);
          exportH = exportMaxEdge;
        } else if (aspectRatio === '16:9') {
          exportW = exportMaxEdge;
          exportH = Math.round(exportMaxEdge * 0.5625);
        } else if (aspectRatio === '9:16') {
          exportW = Math.round(exportMaxEdge * 0.5625);
          exportH = exportMaxEdge;
        }

        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = exportW;
        exportCanvas.height = exportH;
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) {
          setIsExporting(false);
          return;
        }

        // 1. Draw Backdrop background (image vs solid vs gradient)
        if (selectedBackdrop.category === 'images') {
          try {
            const bgImg = await new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve(img);
              img.onerror = (e) => reject(e);
              img.src = selectedBackdrop.value;
            });
            // Cover scaling calculation for export dimension
            const bgAspect = bgImg.width / bgImg.height;
            const destAspect = exportW / exportH;
            let srcX = 0, srcY = 0, srcW = bgImg.width, srcH = bgImg.height;
            if (bgAspect > destAspect) {
              srcW = bgImg.height * destAspect;
              srcX = (bgImg.width - srcW) / 2;
            } else {
              srcH = bgImg.width / destAspect;
              srcY = (bgImg.height - srcH) / 2;
            }
            ctx.drawImage(bgImg, srcX, srcY, srcW, srcH, 0, 0, exportW, exportH);
          } catch (e) {
            console.error('Failed to pre-fetch backdrop image for export', e);
            // safe fallback to terracota brand color
            const fallbackGradient = ctx.createLinearGradient(0, 0, exportW, exportH);
            fallbackGradient.addColorStop(0, '#E2906E');
            fallbackGradient.addColorStop(1, '#D46038');
            ctx.fillStyle = fallbackGradient;
            ctx.fillRect(0, 0, exportW, exportH);
          }
        } else if (selectedBackdrop.value.includes('linear-gradient')) {
          // Parse hexes
          const hexes = selectedBackdrop.value.match(/#[0-9A-Fa-f]{6}/g) || ['#F4F4F7', '#E3E4E6'];
          const gradient = ctx.createLinearGradient(0, 0, exportW, exportH);
          if (hexes.length === 2) {
            gradient.addColorStop(0, hexes[0]);
            gradient.addColorStop(1, hexes[1]);
          } else if (hexes.length > 2) {
            hexes.forEach((hex, idx) => {
              const stop = idx / (hexes.length - 1);
              gradient.addColorStop(stop, hex);
            });
          } else {
            gradient.addColorStop(0, hexes[0]);
            gradient.addColorStop(1, hexes[0]);
          }
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, exportW, exportH);
        } else {
          ctx.fillStyle = selectedBackdrop.value;
          ctx.fillRect(0, 0, exportW, exportH);
        }

        // 2. Draw spotlight overlay if active
        if (selectedBackdrop.spotlight) {
          const radial = ctx.createRadialGradient(
            exportW / 2,
            exportH / 2,
            0,
            exportW / 2,
            exportH / 2,
            Math.max(exportW, exportH) / 1.2
          );
          radial.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
          radial.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
          ctx.save();
          ctx.globalCompositeOperation = 'soft-light';
          ctx.fillStyle = radial;
          ctx.fillRect(0, 0, exportW, exportH);
          ctx.restore();
        }

        // Draw natural granular organic noise texture over background if preset or gradient is active
        if (selectedBackdrop.category === 'presets' || selectedBackdrop.category === 'gradients') {
          const noiseCanvas = document.createElement('canvas');
          noiseCanvas.width = 128;
          noiseCanvas.height = 128;
          const noiseCtx = noiseCanvas.getContext('2d');
          if (noiseCtx) {
            const noiseImgData = noiseCtx.createImageData(128, 128);
            const data = noiseImgData.data;
            const noiseOpacity = selectedBackdrop.category === 'presets' ? 45 : 18;
            for (let i = 0; i < data.length; i += 4) {
              const val = Math.floor(Math.random() * 255);
              data[i] = val;
              data[i + 1] = val;
              data[i + 2] = val;
              data[i + 3] = Math.floor(Math.random() * noiseOpacity);
            }
            noiseCtx.putImageData(noiseImgData, 0, 0);
            const pattern = ctx.createPattern(noiseCanvas, 'repeat');
            if (pattern) {
              ctx.save();
              ctx.fillStyle = pattern;
              ctx.globalCompositeOperation = 'overlay';
              ctx.fillRect(0, 0, exportW, exportH);
              ctx.restore();
            }
          }
        }

        // 3. Draw ambient shadow overlay
        if (selectedShadow.svgPath) {
          ctx.save();
          const blurVal = selectedShadow.blur * (exportW / 800);
          ctx.filter = `blur(${Math.max(blurVal, 1)}px)`;
          ctx.globalAlpha = selectedShadow.intensity;
          ctx.fillStyle = '#1c1c1f';
          ctx.beginPath();
          const path = new Path2D(selectedShadow.svgPath);
          ctx.scale(exportW / 800, exportH / 800);
          ctx.fill(path);
          ctx.restore();
        }

        // 4. Draw subject with offset, scale, rotation, flip, gradients, and contact shadow
        ctx.save();
        const cx = exportW / 2;
        const cy = exportH / 2;
        ctx.translate(cx, cy);

        // Map movement percentages
        ctx.translate((placement.x / 100) * exportW, (placement.y / 100) * exportH);

        // Apply rotation
        ctx.rotate((placement.rotation * Math.PI) / 180);

        // Subject defaults to 60% width of canvas frame in layout preview to match WorkspaceCanvas exactly
        const subjectW = exportW * 0.6 * placement.scale;
        const subjectH = (exportW * 0.6 * placement.scale) / placement.aspectRatio;

        // Apply Flip
        if (placement.flipX) {
          ctx.scale(-1, 1);
        }

        // Apply photo grade adjustments
        const b = enhancement.brightness;
        const c = enhancement.contrast;
        const s = enhancement.saturation;
        const exp = 100 + enhancement.exposure;
        ctx.filter = `brightness(${b * (exp / 100)}) contrast(${c}) saturate(${s}) hue-rotate(${enhancement.temperature * 0.15}deg)`;

        // Apply drop shadow
        if (shadowSettings.enabled) {
          ctx.shadowColor = `rgba(0, 0, 0, ${shadowSettings.opacity})`;
          ctx.shadowBlur = shadowSettings.blur * (exportW / 600);
          ctx.shadowOffsetX = shadowSettings.offsetX * (exportW / 600) * (placement.flipX ? -1 : 1);
          ctx.shadowOffsetY = shadowSettings.offsetY * (exportW / 600);
        }

        ctx.drawImage(subjectCanvas, -subjectW / 2, -subjectH / 2, subjectW, subjectH);
        ctx.restore();

        // Download PNG safely
        const dataUrl = exportCanvas.toDataURL('image/png');
        setExportedImageUrl(dataUrl);

        const link = document.createElement('a');
        link.download = `studiopro_composition_${Date.now()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Export failed', err);
      } finally {
        setIsExporting(false);
      }
    });
  };

  const currentTabClass = (tab: typeof activeTab) => {
    return activeTab === tab
      ? 'border-white text-white font-medium bg-white/5'
      : 'border-transparent text-zinc-400 hover:text-white';
  };

  return (
    <div className="flex flex-col h-auto lg:h-full bg-[#121214] border-t lg:border-t-0 lg:border-l border-zinc-900 overflow-y-visible lg:overflow-y-auto">
      {/* Tab Switcher Headers */}
      <div className="grid grid-cols-3 border-b border-zinc-900 text-xs font-sans">
        <button
          onClick={() => setActiveTab('backdrop')}
          className={`flex items-center justify-center gap-1.5 py-4 border-b-2 transition ${currentTabClass('backdrop')}`}
        >
          <Palette className="h-3.5 w-3.5" />
          <span>Stage Backdrop</span>
        </button>
        <button
          onClick={() => setActiveTab('filters')}
          className={`flex items-center justify-center gap-1.5 py-4 border-b-2 transition ${currentTabClass('filters')}`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Color Grade</span>
        </button>
        <button
          onClick={() => setActiveTab('shadow')}
          className={`flex items-center justify-center gap-1.5 py-4 border-b-2 transition ${currentTabClass('shadow')}`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Soft Shadows</span>
        </button>
      </div>

      {/* Main Controls Workspace */}
      <div className="flex-1 p-6 flex flex-col gap-6">
        {/* Core Controls depending on Tabs */}
        {activeTab === 'backdrop' && (
          <div className="flex flex-col gap-5">
            {/* Aspect Selector */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Canvas Format</span>
              <div className="mt-2.5 grid grid-cols-4 gap-2 text-xs">
                {['1:1', '4:5', '16:9', '9:16'].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`rounded-xl py-2 border text-center transition ${
                      aspectRatio === ratio
                        ? 'border-white bg-white/5 text-white font-semibold'
                        : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Backdrop scroll row selection */}
            <BackdropSelector
              selectedBackdrop={selectedBackdrop}
              onSelectBackdrop={onSelectBackdrop}
            />
          </div>
        )}

        {activeTab === 'filters' && (
          <div className="flex flex-col gap-5">
            {/* Quick action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setPlacement((prev) => ({ ...prev, flipX: !prev.flipX }))}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 py-2.5 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white active:scale-95"
              >
                <FlipHorizontal className="h-3.5 w-3.5" />
                Flip Horizontal
              </button>
              <button
                onClick={onResetLayout}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 py-2.5 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset Layout
              </button>
            </div>

            {/* Subject Size & Position Controls */}
            <div className="flex flex-col gap-4 rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4">
              <span className="text-xs font-bold text-zinc-300 tracking-wide uppercase">Image Size</span>
              
              {/* Scale / Size control */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-300">Image Size (Zoom)</span>
                  <span className="font-mono text-xs font-semibold text-white bg-zinc-800 px-2 py-0.5 rounded">
                    {Math.round(placement.scale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="8.0"
                  step="0.05"
                  value={placement.scale}
                  onChange={(e) => setPlacement((prev) => ({ ...prev, scale: parseFloat(e.target.value) }))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-white"
                />
              </div>

              {/* Advanced Presets */}
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                <button
                  onClick={() => setPlacement((prev) => ({ ...prev, scale: 1.0 }))}
                  className="rounded-lg py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-center transition"
                >
                  Medium (100%)
                </button>
                <button
                  onClick={() => setPlacement((prev) => ({ ...prev, scale: 2.0 }))}
                  className="rounded-lg py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-center transition"
                >
                  Fit Frame (200%)
                </button>
                <button
                  onClick={() => setPlacement((prev) => ({ ...prev, scale: 4.0 }))}
                  className="rounded-lg py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-center transition"
                >
                  Fill Frame (400%)
                </button>
              </div>

              {/* Collapsible Position Controls */}
              <div className="border-t border-zinc-900/60 pt-3.5 mt-1">
                <button
                  type="button"
                  onClick={() => setShowPosition(!showPosition)}
                  className="flex w-full items-center justify-between text-xs font-semibold text-zinc-400 hover:text-white transition"
                >
                  <span>Position & Rotation</span>
                  {showPosition ? (
                    <ChevronUp className="h-4 w-4 text-zinc-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                  )}
                </button>

                {showPosition && (
                  <div className="flex flex-col gap-4 mt-3 animate-slide-down">
                    {/* Horizontal Position (X) */}
                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>Horizontal Position (X)</span>
                        <span className="font-mono text-xs text-white">
                          {placement.x > 0 ? `+${Math.round(placement.x)}` : Math.round(placement.x)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-150"
                        max="150"
                        step="1"
                        value={placement.x}
                        onChange={(e) => setPlacement((prev) => ({ ...prev, x: parseInt(e.target.value) }))}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-white"
                      />
                    </div>

                    {/* Vertical Position (Y) */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>Vertical Position (Y)</span>
                        <span className="font-mono text-xs text-white">
                          {placement.y > 0 ? `+${Math.round(placement.y)}` : Math.round(placement.y)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-150"
                        max="150"
                        step="1"
                        value={placement.y}
                        onChange={(e) => setPlacement((prev) => ({ ...prev, y: parseInt(e.target.value) }))}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-white"
                      />
                    </div>

                    {/* Rotation */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>Rotation</span>
                        <span className="font-mono text-xs text-white">
                          {Math.round(placement.rotation)}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="1"
                        value={placement.rotation}
                        onChange={(e) => setPlacement((prev) => ({ ...prev, rotation: parseInt(e.target.value) }))}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-white"
                      />
                    </div>

                    {/* Centering Quick Action */}
                    <button
                      onClick={() => setPlacement((prev) => ({ ...prev, x: 0, y: 0, rotation: 0 }))}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 py-1.5 text-xs text-zinc-200 transition"
                    >
                      Reset Position & Angle
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Corner Roundedness / Border Radius Control */}
            <div className="flex flex-col gap-2 rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-semibold text-zinc-300">Image Corner Rounding</span>
                <span className="font-mono text-white bg-zinc-800 px-2 py-0.5 rounded-md text-[10px]">
                  {placement.borderRadius}px
                </span>
              </div>
              
              <input
                type="range"
                min="0"
                max="200"
                step="1"
                value={placement.borderRadius ?? 12}
                onChange={(e) => setPlacement((prev) => ({ ...prev, borderRadius: parseInt(e.target.value) }))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-white"
              />

              <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-[10px]">
                <button
                  onClick={() => setPlacement((prev) => ({ ...prev, borderRadius: 0 }))}
                  className={`rounded-lg py-1 border text-center transition ${
                    placement.borderRadius === 0
                      ? 'border-white bg-white/10 text-white font-semibold'
                      : 'border-zinc-800/60 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  Sharp (0px)
                </button>
                <button
                  onClick={() => setPlacement((prev) => ({ ...prev, borderRadius: 28 }))}
                  className={`rounded-lg py-1 border text-center transition ${
                    placement.borderRadius === 28
                      ? 'border-white bg-white/10 text-white font-semibold'
                      : 'border-zinc-800/60 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  Studio (28px)
                </button>
                <button
                  onClick={() => setPlacement((prev) => ({ ...prev, borderRadius: 120 }))}
                  className={`rounded-lg py-1 border text-center transition ${
                    placement.borderRadius >= 120
                      ? 'border-white bg-white/10 text-white font-semibold'
                      : 'border-zinc-800/60 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  Pill (Circle)
                </button>
              </div>
            </div>

            {/* Collapsible Color Grades sliders under image corner */}
            <div className="flex flex-col gap-4 rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4">
              <button
                type="button"
                onClick={() => setShowColorAdjustments(!showColorAdjustments)}
                className="flex w-full items-center justify-between text-xs font-bold text-zinc-300 tracking-wide uppercase transition"
              >
                <span>Color & Lighting Grades</span>
                {showColorAdjustments ? (
                  <ChevronUp className="h-4 w-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                )}
              </button>

              {showColorAdjustments && (
                <div className="flex flex-col gap-5 mt-2 animate-slide-down">
                  {/* Brightness Adjustment */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Exposure / Lighting</span>
                      <span className="font-mono text-white">{Math.round((enhancement.brightness - 1) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={enhancement.brightness}
                      onChange={(e) => setEnhancement((prev) => ({ ...prev, brightness: parseFloat(e.target.value) }))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-white"
                    />
                  </div>

                  {/* Contrast Adjustment */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Contrast</span>
                      <span className="font-mono text-white">{Math.round((enhancement.contrast - 1) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={enhancement.contrast}
                      onChange={(e) => setEnhancement((prev) => ({ ...prev, contrast: parseFloat(e.target.value) }))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-white"
                    />
                  </div>

                  {/* Saturation Adjustment */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Color Saturation</span>
                      <span className="font-mono text-white">{Math.round(enhancement.saturation * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={enhancement.saturation}
                      onChange={(e) => setEnhancement((prev) => ({ ...prev, saturation: parseFloat(e.target.value) }))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-white"
                    />
                  </div>

                  {/* Temperature Shift */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Color Warmth / Atmosphere</span>
                      <span className="font-mono text-white">{enhancement.temperature > 0 ? `+${enhancement.temperature}` : enhancement.temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="-60"
                      max="60"
                      step="2"
                      value={enhancement.temperature}
                      onChange={(e) => setEnhancement((prev) => ({ ...prev, temperature: parseInt(e.target.value) }))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gradient-to-r from-blue-500 via-zinc-800 to-amber-500 appearance-none accent-white"
                    />
                    <div className="flex justify-between text-[9px] text-zinc-500 font-medium">
                      <span>Studio Cool Blue</span>
                      <span>Warm Sunbeams</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'shadow' && (
          <div className="flex flex-col gap-5">
            {/* Toggle shadow casting */}
            <div className="flex items-center justify-between rounded-xl bg-zinc-900 p-3.5 border border-zinc-800">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">Render Soft Contact Shadow</span>
                <span className="text-[10px] text-zinc-500">Blends subject realistically onto physical floor</span>
              </div>
              <button
                onClick={() => setShadowSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  shadowSettings.enabled ? 'bg-white' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                    shadowSettings.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {shadowSettings.enabled && (
              <div className="flex flex-col gap-5 animate-slide-down">
                {/* Shadow Opacity */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Shadow Density</span>
                    <span className="font-mono text-white">{Math.round(shadowSettings.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={shadowSettings.opacity}
                    onChange={(e) => setShadowSettings((prev) => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-white"
                  />
                </div>

                {/* Shadow Blur */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Shadow Edge Blur</span>
                    <span className="font-mono text-white">{shadowSettings.blur}px</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="60"
                    step="1"
                    value={shadowSettings.blur}
                    onChange={(e) => setShadowSettings((prev) => ({ ...prev, blur: parseInt(e.target.value) }))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-white"
                  />
                </div>

                {/* Vertical offset (for height/placement height) */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Height / Blur Distance</span>
                    <span className="font-mono text-white">{shadowSettings.offsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="80"
                    step="1"
                    value={shadowSettings.offsetY}
                    onChange={(e) => setShadowSettings((prev) => ({ ...prev, offsetY: parseInt(e.target.value) }))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-white"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-zinc-900 bg-zinc-950 flex flex-col gap-3.5">
        <button
          onClick={handleExportPNG}
          disabled={!originalImg || isExporting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white p-3.5 text-xs font-bold uppercase tracking-wider text-black transition-all duration-300 hover:bg-neutral-200 disabled:pointer-events-none disabled:opacity-45 shadow-lg active:scale-98"
        >
          {isExporting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              Rendering 4K Canvas...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export High-Res Studio PNG
            </>
          )}
        </button>
      </div>

      {/* Lightroom Lightbox Fallback & Showroom Modal */}
      {exportedImageUrl && (
        <div id="export-lightbox-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 md:p-10 backdrop-blur-xl animate-fade-in">
          <div className="relative flex h-full max-h-[85vh] w-full max-w-4xl flex-col rounded-3xl border border-zinc-800 bg-[#121214] shadow-2xl overflow-y-auto md:overflow-hidden md:flex-row">
            {/* Visual Preview Left Section */}
            <div className="flex flex-1 items-center justify-center bg-zinc-950 p-6 relative overflow-hidden group">
              <div 
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: 'linear-gradient(45deg, #27272a 25%, transparent 25%), linear-gradient(-45deg, #27272a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #27272a 75%), linear-gradient(-45deg, transparent 75%, #27272a 75%)',
                  backgroundSize: '24px 24px',
                  backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0'
                }}
              />
              <img 
                src={exportedImageUrl} 
                alt="Studio Composition Render" 
                className="relative max-h-[45vh] md:max-h-[65vh] max-w-full rounded-2xl shadow-2xl border border-zinc-900 object-contain transition duration-500 hover:scale-[1.01]"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Action panel Right Section */}
            <div className="flex w-full flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-900 bg-[#101012] p-6 md:p-8 md:w-[320px] shrink-0">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Render Successful</span>
                    <h2 className="text-base font-bold text-white tracking-tight">Studio Composition</h2>
                  </div>
                  <button 
                    onClick={() => setExportedImageUrl(null)}
                    className="rounded-full bg-zinc-900 p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3 prose prose-invert text-xs text-zinc-400 leading-relaxed">
                  <p>
                    Your high-res composition has been processed at <strong className="text-zinc-200">2048px (4K detail level)</strong> with studio lighting, realistic shadows, and professional color adjustments.
                  </p>
                  <div className="rounded-xl bg-zinc-900/50 p-3 border border-zinc-800/60 font-sans leading-relaxed text-[11px] text-zinc-300">
                    <p className="font-semibold text-white mb-1">💡 Sandbox Tip:</p>
                    If the download did not trigger automatically: <strong className="text-white">right-click</strong> the image or <strong className="text-white">tap and hold</strong> on mobile devices to save it directly to your camera roll.
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <a
                  href={exportedImageUrl}
                  download={`studiopro_composition_${Date.now()}.png`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white hover:bg-zinc-200 p-3 text-center text-xs font-bold uppercase tracking-wider text-black transition duration-300 shadow-md active:scale-98"
                >
                  <Download className="h-4 w-4 text-black" />
                  Save / Download PNG
                </a>
                <button
                  onClick={() => setExportedImageUrl(null)}
                  className="flex w-full items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 p-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition duration-300 active:scale-98"
                >
                  Back to Studio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
