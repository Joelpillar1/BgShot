import React, { useState } from 'react';
import { Backdrop, ShadowOverlay, SubjectPlacement, SubjectEnhancement, SubjectShadow, BlurArea } from '../types';
import { SHADOW_OVERLAYS } from '../data/backdrops';
import { Sliders, Sun, Palette, Sparkles, Download, Layers, FlipHorizontal, Eye, RefreshCw, X, ChevronDown, ChevronUp, Rocket, ExternalLink, EyeOff, Plus, Trash2, ShieldAlert } from 'lucide-react';
import BackdropSelector from './BackdropSelector';
import { motion, AnimatePresence } from 'motion/react';

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
  onExportSuccess?: (dataUrl: string) => void;
  blurAreas: BlurArea[];
  setBlurAreas: React.Dispatch<React.SetStateAction<BlurArea[]>>;
  activeBlurId: string | null;
  setActiveBlurId: (id: string | null) => void;
}

const SHIPOS_PLATFORMS = [
  { 
    name: 'Instagram', 
    color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
    icon: (
      <svg className="w-2.2 h-2.2 stroke-white fill-none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
      </svg>
    )
  },
  { 
    name: 'Twitter / X', 
    color: 'bg-black border border-white/5',
    icon: (
      <svg className="w-1.8 h-1.8 fill-white" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    )
  },
  { 
    name: 'Facebook', 
    color: 'bg-[#1877f2]',
    icon: (
      <svg className="w-2.2 h-2.2 fill-white" viewBox="0 0 24 24">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.8z"/>
      </svg>
    )
  },
  { 
    name: 'TikTok', 
    color: 'bg-[#010101] border border-white/5',
    icon: (
      <svg className="w-2.2 h-2.2 fill-white" viewBox="0 0 24 24">
        <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12.94 2.58 1.34 3.96 1.45v3.11c-1.25-.07-2.52-.45-3.51-1.25-.56-.42-1.02-.95-1.38-1.55v6.52c-.08 2.03-1.01 3.99-2.73 5.06-1.57.99-3.66 1.11-5.32.33-1.72-.77-2.94-2.53-3.07-4.43-.22-2.31 1.25-4.63 3.39-5.49.53-.21 1.1-.34 1.67-.38v3.13c-.98.11-1.92.68-2.34 1.58-.5 1.05-.22 2.41.67 3.17.94.81 2.45.69 3.22-.32.48-.62.59-1.42.59-2.19V.02z"/>
      </svg>
    )
  },
  { 
    name: 'YouTube', 
    color: 'bg-[#ff0000]',
    icon: (
      <svg className="w-2.2 h-2.2 fill-white" viewBox="0 0 24 24">
        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.553a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11C6.482 20.5 12 20.5 12 20.5s7.518 0 9.388-.553a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  },
  { 
    name: 'BlueSky', 
    color: 'bg-[#0560ff]',
    icon: (
      <svg className="w-2.2 h-2.2 fill-white" viewBox="0 0 24 24">
        <path d="M12 10.8c-1.2-2-4.1-5.6-7.8-6.5-1.9-.5-4.2-.2-4.2 2.7 0 1.2.5 4.6 1.7 6.3 1.9 2.7 5.2 3.8 6.6 4-.8.7-2 1.8-3.4 1.8-3 0-4.1-2-4.5-3.3-.4-1.2-.4-1.2-.4-1.2s0 0 0 0C0 14.6 0 14.6 0 14.6c.1.9.4 1.8.9 2.6 1 1.7 3 2.8 5.6 2.8 4 0 5-2.2 5.5-3.5.5 1.3 1.5 3.5 5.5 3.5 2.6 0 4.6-1.1 5.6-2.8.5-.8.8-1.7.9-2.6 0 0 0 0 0 0c0 0 0 0-.4 1.2-.4 1.3-1.5 3.3-4.5 3.3-1.4 0-2.6-1.1-3.4-1.8 1.4-.2 4.7-1.3 6.6-4 1.2-1.7 1.7-5.1 1.7-6.3 0-2.9-2.3-3.2-4.2-2.7-3.7.9-6.6 4.5-7.8 6.5z"/>
      </svg>
    )
  },
  { 
    name: 'Pinterest', 
    color: 'bg-[#bd081c]',
    icon: (
      <svg className="w-2.2 h-2.2 fill-white" viewBox="0 0 24 24">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.946-.199-2.385.041-3.412.219-.937 1.409-5.977 1.409-5.977s-.359-.72-.359-1.781c0-1.663.967-2.909 2.17-2.909 1.023 0 1.517.769 1.517 1.686 0 1.03-.653 2.567-.989 3.993-.283 1.196.593 2.167 1.775 2.167 2.13 0 3.761-2.245 3.761-5.482 0-2.861-2.062-4.868-5.005-4.868-3.414 0-5.418 2.561-5.418 5.204 0 1.03.399 2.13.896 2.73.098.12.113.223.083.339-.09.375-.291 1.178-.33 1.348-.053.223-.172.27-.397.166-1.484-.69-2.409-2.859-2.409-4.6 0-3.743 2.722-7.182 7.842-7.182 4.117 0 7.317 2.933 7.317 6.85 0 4.09-2.576 7.38-6.151 7.38-1.202 0-2.333-.625-2.719-1.362l-.74 2.818c-.267 1.019-.99 2.294-1.474 3.084 1.12.346 2.3.535 3.526.535 6.623 0 11.993-5.372 11.993-12.002C24 5.37 18.638 0 12.017 0z"/>
      </svg>
    )
  },
  { 
    name: 'Threads', 
    color: 'bg-black border border-white/5',
    icon: (
      <svg className="w-1.8 h-1.8 stroke-white fill-none" viewBox="0 0 24 24" strokeWidth="2.5">
        <path d="M12 18.25a6.25 6.25 0 1 1 6.25-6.25c0 1.84-1.5 3.25-3 3.25s-2.5-1.18-2.5-2.5V10c0-1.1-.9-2-2-2s-2 .9-2 2v2.5c0 1.1.9 2 2 2s2-.9 2-2V10a4.5 4.5 0 1 0-.75 2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  { 
    name: 'LinkedIn', 
    color: 'bg-[#0077b5]',
    icon: (
      <svg className="w-2.2 h-2.2 fill-white" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    )
  }
];

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
  onExportSuccess,
  blurAreas,
  setBlurAreas,
  activeBlurId,
  setActiveBlurId,
}: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState<'backdrop' | 'filters' | 'shadow' | 'blur'>('backdrop');
  const [isExporting, setIsExporting] = useState(false);
  const [exportedImageUrl, setExportedImageUrl] = useState<string | null>(null);
  const [showPosition, setShowPosition] = useState(false);
  const [showColorAdjustments, setShowColorAdjustments] = useState(false);
  const [activeAdSlide, setActiveAdSlide] = useState(0);

  // ShipOS sponsored banner slideshow interval
  React.useEffect(() => {
    const adInterval = setInterval(() => {
      setActiveAdSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(adInterval);
  }, []);

  // States to facilitate manual & dynamic typed custom aspect ratios
  const [customWStr, setCustomWStr] = useState('1');
  const [customHStr, setCustomHStr] = useState('1');

  // Sync inputs with outer master aspectRatio changes (for presets and history restoration)
  React.useEffect(() => {
    if (aspectRatio && aspectRatio.includes(':')) {
      const [w, h] = aspectRatio.split(':');
      setCustomWStr(w);
      setCustomHStr(h);
    }
  }, [aspectRatio]);

  const handleCustomAspectChange = (wValStr: string, hValStr: string) => {
    setCustomWStr(wValStr);
    setCustomHStr(hValStr);
    
    const wNum = parseFloat(wValStr);
    const hNum = parseFloat(hValStr);
    if (!isNaN(wNum) && !isNaN(hNum) && wNum > 0 && hNum > 0) {
      setAspectRatio(`${wValStr}:${hValStr}`);
    }
  };

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

        if (aspectRatio && aspectRatio.includes(':')) {
          const [wStr, hStr] = aspectRatio.split(':');
          const w = parseFloat(wStr || '1');
          const h = parseFloat(hStr || '1');
          if (!isNaN(w) && !isNaN(h) && h !== 0) {
            const aspect = w / h;
            if (aspect > 1) {
              // landscape: keep width max, scale height down
              exportW = exportMaxEdge;
              exportH = Math.round(exportMaxEdge / aspect);
            } else {
              // portrait or square: keep height max, scale width down
              exportW = Math.round(exportMaxEdge * aspect);
              exportH = exportMaxEdge;
            }
          }
        } else {
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

        // 5. Draw and bake active Blur/Redaction filter regions onto high-res canvas
        if (blurAreas && blurAreas.length > 0) {
          blurAreas.forEach((area) => {
            const rx = (area.x / 100) * exportW;
            const ry = (area.y / 100) * exportH;
            const rw = (area.width / 100) * exportW;
            const rh = (area.height / 100) * exportH;
            
            const scaleFactor = exportW / 800;
            const blurVal = area.blur * scaleFactor;

            if (rw > 0 && rh > 0) {
              ctx.save();
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = rw;
              tempCanvas.height = rh;
              const tempCtx = tempCanvas.getContext('2d');
              
              if (tempCtx) {
                tempCtx.drawImage(exportCanvas, rx, ry, rw, rh, 0, 0, rw, rh);
                ctx.save();
                ctx.filter = `blur(${Math.max(blurVal, 1)}px)`;
                ctx.drawImage(tempCanvas, rx, ry, rw, rh);
                ctx.restore();
              }
              ctx.restore();
            }
          });
        }

        // Download PNG safely
        const dataUrl = exportCanvas.toDataURL('image/png');
        setExportedImageUrl(dataUrl);

        if (onExportSuccess) {
          onExportSuccess(dataUrl);
        }

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
    <div className="flex flex-col h-full bg-[#121214] border-t lg:border-t-0 lg:border-l border-zinc-900 overflow-y-auto">
      {/* Tab Switcher Headers */}
      <div className="sticky top-0 z-30 bg-[#121214] grid grid-cols-4 border-b border-zinc-900 text-[10px] sm:text-xs font-sans">
        <button
          onClick={() => setActiveTab('backdrop')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-3 border-b-2 transition ${currentTabClass('backdrop')}`}
        >
          <Palette className="h-3.5 w-3.5" />
          <span>Backdrop</span>
        </button>
        <button
          onClick={() => setActiveTab('filters')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-3 border-b-2 transition ${currentTabClass('filters')}`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Color Grade</span>
        </button>
        <button
          onClick={() => setActiveTab('shadow')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-3 border-b-2 transition ${currentTabClass('shadow')}`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Shadows</span>
        </button>
        <button
          onClick={() => setActiveTab('blur')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-3 border-b-2 transition ${currentTabClass('blur')}`}
        >
          <EyeOff className="h-3.5 w-3.5 text-[#E2906E]" />
          <span className="truncate">Blur / Redact</span>
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

              {/* Custom Manual & Dynamic Ratio Input */}
              <div className="mt-3.5 rounded-2xl border border-zinc-900 bg-zinc-950/65 p-3.5 shadow-inner">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Manual Resizing Inputs</span>
                
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Width</span>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={customWStr}
                      onChange={(e) => handleCustomAspectChange(e.target.value, customHStr)}
                      className="w-full text-center rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold text-white focus:border-[#D46038] focus:outline-none transition-colors"
                      placeholder="W"
                    />
                  </div>
                  <div className="text-zinc-600 font-mono text-xs font-bold pt-4">:</div>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Height</span>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={customHStr}
                      onChange={(e) => handleCustomAspectChange(customWStr, e.target.value)}
                      className="w-full text-center rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold text-white focus:border-[#D46038] focus:outline-none transition-colors"
                      placeholder="H"
                    />
                  </div>
                </div>

                {/* Popular ratio shortcuts */}
                <div className="mt-3 flex items-center justify-between gap-1 border-t border-zinc-900/60 pt-2.5">
                  <span className="text-[9px] font-semibold text-zinc-500">Quick Custom:</span>
                  <div className="flex gap-1.5">
                    {['4:3', '3:2', '3:4', '21:9'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleCustomAspectChange(r.split(':')[0], r.split(':')[1])}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-mono border transition ${
                          aspectRatio === r
                            ? 'border-[#D46038] text-[#E2906E] bg-[#D46038]/10'
                            : 'border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
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

        {activeTab === 'blur' && (
          <div className="flex flex-col gap-5 animate-slide-down">
            {/* Descriptive guidance card */}
            <div className="flex flex-col gap-2 rounded-xl bg-zinc-900/60 border border-zinc-800 p-3.5">
              <div className="flex items-start gap-2.5">
                <div className="bg-[#E2906E]/10 p-2 rounded-lg text-[#E2906E] shrink-0">
                  <EyeOff className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Sensitive Segment Masking</h4>
                  <p className="text-[10.5px] text-zinc-400 mt-0.5 leading-relaxed">
                    Draw translucent blur zones to mask private text, credentials, keys, barcodes, or prices on receipts. You can drag and position them live on the canvas.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA action button */}
            <button
              type="button"
              onClick={() => {
                const id = `blur_${Date.now()}`;
                const newArea: BlurArea = {
                  id,
                  x: 35,
                  y: 35,
                  width: 30,
                  height: 15,
                  blur: 15,
                };
                setBlurAreas(prev => [...prev, newArea]);
                setActiveBlurId(id);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#E2906E]/40 bg-[#E2906E]/5 p-3 text-xs font-semibold text-white transition hover:bg-[#E2906E]/10 hover:border-[#E2906E]/60 active:scale-98"
            >
              <Plus className="h-4 w-4 text-[#E2906E]" />
              <span>Add Blur Mask</span>
            </button>

            {/* List labels */}
            {blurAreas.length > 0 && (
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mt-1">
                Active Masks ({blurAreas.length})
              </div>
            )}

            {/* Empty state overlay container */}
            {blurAreas.length === 0 && (
              <div className="flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl p-6 text-center select-none">
                <ShieldAlert className="h-8 w-8 text-zinc-700 mb-2" />
                <span className="text-xs text-zinc-500 font-medium">No active blur overlays</span>
                <p className="text-[10.5px] text-zinc-600 mt-0.5">
                  Click 'Add Blur Mask' to redact sensitive fields.
                </p>
              </div>
            )}

            {/* Active blur boxes list */}
            {blurAreas.length > 0 && (
              <div className="flex flex-col gap-3">
                {blurAreas.map((area, idx) => {
                  const isSelected = activeBlurId === area.id;
                  return (
                    <div
                      key={area.id}
                      onClick={() => setActiveBlurId(area.id)}
                      className={`group flex flex-col rounded-xl border p-3.5 transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-[#E2906E] bg-[#E2906E]/5 shadow-md'
                          : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80'
                      }`}
                    >
                      {/* Header row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] h-4.5 w-4.5 flex items-center justify-center rounded font-semibold font-mono ${
                            isSelected ? 'bg-[#E2906E] text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-300'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-white">Mask Region</span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBlurAreas(prev => prev.filter(a => a.id !== area.id));
                            if (activeBlurId === area.id) setActiveBlurId(null);
                          }}
                          className="p-1 text-zinc-500 hover:text-red-500 rounded transition hover:bg-white/5"
                          title="Delete this Mask"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Controls panel if selected */}
                      {isSelected && (
                        <div className="flex flex-col gap-4 mt-3.5 border-t border-dashed border-zinc-800 pt-3.5 animate-slide-down overflow-visible">
                          {/* Width range */}
                          <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between text-[11px] text-zinc-400">
                              <span>Width</span>
                              <span className="font-mono text-white">{Math.round(area.width)}%</span>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="100"
                              step="1"
                              value={area.width}
                              onChange={(e) => {
                                const nextVal = parseInt(e.target.value);
                                setBlurAreas(prev => prev.map(a => a.id === area.id ? { ...a, width: nextVal, x: Math.min(a.x, 100 - nextVal) } : a));
                              }}
                              className="h-1.5 w-full cursor-pointer appearance-none rounded bg-[#18181b] border border-zinc-800 accent-[#E2906E]"
                            />
                          </div>

                          {/* Height range */}
                          <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between text-[11px] text-zinc-400">
                              <span>Height</span>
                              <span className="font-mono text-white">{Math.round(area.height)}%</span>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="100"
                              step="1"
                              value={area.height}
                              onChange={(e) => {
                                const nextVal = parseInt(e.target.value);
                                setBlurAreas(prev => prev.map(a => a.id === area.id ? { ...a, height: nextVal, y: Math.min(a.y, 100 - nextVal) } : a));
                              }}
                              className="h-1.5 w-full cursor-pointer appearance-none rounded bg-[#18181b] border border-zinc-800 accent-[#E2906E]"
                            />
                          </div>

                          {/* Blur amount */}
                          <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between text-[11px] text-zinc-400">
                              <span>Blur Intensity</span>
                              <span className="font-mono text-white">{area.blur}px</span>
                            </div>
                            <input
                              type="range"
                              min="2"
                              max="80"
                              step="1"
                              value={area.blur}
                              onChange={(e) => {
                                const nextVal = parseInt(e.target.value);
                                setBlurAreas(prev => prev.map(a => a.id === area.id ? { ...a, blur: nextVal } : a));
                              }}
                              className="h-1.5 w-full cursor-pointer appearance-none rounded bg-[#18181b] border border-zinc-800 accent-[#E2906E]"
                            />
                          </div>

                          {/* Live drag indicator tip */}
                          <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800 flex items-start gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-[#E2906E] translate-y-1.5 shrink-0" />
                            <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                              Tip: You can drag this redact box directly on the live image canvas to place it over any sensitive text.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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

              {/* ShipOS Sponsored Visual Ad Card (Modern Slideshow / Rolling Carousels) */}
              <div className="mt-3 rounded-xl bg-[#D46038] p-3 border border-white/10 font-sans text-white overflow-hidden relative shadow-md flex flex-col items-center text-center select-none min-h-[235px] justify-between">
                
                {/* Decorative background ambient glows */}
                <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-white/5 rounded-full filter blur-lg pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-white/10 rounded-full filter blur-lg pointer-events-none" />
                <div className="absolute -top-8 -right-8 w-20 h-20 bg-white/10 rounded-full filter blur-lg pointer-events-none" />

                <div className="w-full flex flex-col items-center z-10">
                  <AnimatePresence mode="wait">
                    {activeAdSlide === 0 && (
                      <motion.div
                        key="ad-slide-1"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col items-center w-full"
                      >
                        {/* Pill Title Badge */}
                        <div className="relative inline-flex items-center justify-center bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white rounded-md border border-white/10 shadow-sm backdrop-blur-md select-none tracking-wide gap-1 mb-1.5">
                          <Rocket className="h-2.5 w-2.5 text-white fill-white/10" />
                          <span>ShipOS</span>
                        </div>

                        {/* Heading */}
                        <h4 className="relative text-xs font-black text-white leading-tight tracking-tight select-none mb-0.5">
                          Write once. Ship everywhere.
                        </h4>

                        {/* Description */}
                        <p className="relative text-[9.5px] text-white/85 font-medium select-none mb-2 leading-relaxed max-w-[210px]">
                          One dashboard. Every platform. Total control.
                        </p>

                        {/* Social / Messaging Icons */}
                        <div className="relative flex items-center justify-center gap-0.5 max-w-[220px] mb-2.5 select-none">
                          {SHIPOS_PLATFORMS.map((p, idx) => (
                            <div
                              key={p.name + idx}
                              className={`w-4.5 h-4.5 flex items-center justify-center rounded transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm select-none ${p.color}`}
                              title={`${p.name} integration`}
                            >
                              {p.icon}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {activeAdSlide === 1 && (
                      <motion.div
                        key="ad-slide-2"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col items-center w-full"
                      >
                        {/* Pill Title Badge */}
                        <div className="relative inline-flex items-center justify-center bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white rounded-md border border-white/10 shadow-sm backdrop-blur-md select-none tracking-wide gap-1 mb-2">
                          <Sparkles className="h-2.5 w-2.5 text-white" />
                          <span>ShipOS</span>
                        </div>

                        {/* Heading */}
                        <h4 className="relative text-xs sm:text-sm font-black text-white leading-tight tracking-tight select-none mb-1.5 max-w-[210px]">
                          5 platforms. 1 dashboard.<br />0 excuses.
                        </h4>

                        {/* Description */}
                        <p className="relative text-[9.5px] text-white/85 font-medium select-none mb-2 leading-relaxed max-w-[200px]">
                          Stop switching apps. Start shipping content.
                        </p>

                        {/* Social / Messaging Icons */}
                        <div className="relative flex items-center justify-center gap-0.5 max-w-[220px] mb-2.5 select-none">
                          {SHIPOS_PLATFORMS.map((p, idx) => (
                            <div
                              key={p.name + idx}
                              className={`w-4.5 h-4.5 flex items-center justify-center rounded transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm select-none ${p.color}`}
                              title={`${p.name} integration`}
                            >
                              {p.icon}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {activeAdSlide === 2 && (
                      <motion.div
                        key="ad-slide-3"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col items-center w-full"
                      >
                        {/* Pill Title Badge */}
                        <div className="relative inline-flex items-center justify-center bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white rounded-md border border-white/10 shadow-sm backdrop-blur-md select-none tracking-wide gap-1 mb-2">
                          <Rocket className="h-2.5 w-2.5 text-white fill-white/10" />
                          <span>ShipOS</span>
                        </div>

                        {/* Heading */}
                        <h4 className="relative text-xs sm:text-sm font-black text-white leading-tight tracking-tight select-none mb-1.5 max-w-[220px]">
                          Creators waste 3 hours a week on formatting.
                        </h4>

                        {/* Description */}
                        <p className="relative text-[9.5px] text-white/85 font-medium select-none mb-2 leading-relaxed max-w-[200px]">
                          ShipOS gives those hours back. Every week.
                        </p>

                        {/* Social / Messaging Icons */}
                        <div className="relative flex items-center justify-center gap-0.5 max-w-[220px] mb-2.5 select-none">
                          {SHIPOS_PLATFORMS.map((p, idx) => (
                            <div
                              key={p.name + idx}
                              className={`w-4.5 h-4.5 flex items-center justify-center rounded transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm select-none ${p.color}`}
                              title={`${p.name} integration`}
                            >
                              {p.icon}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Shared controls footer: Button + Dots Indicator */}
                <div className="w-full flex flex-col items-center z-10">
                  {/* Call To Action Button (Decreased vertical padding & Dynamic CTA Text) */}
                  <a
                    href="https://shipospro.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full max-w-[190px] bg-white text-[#D46038] font-black text-[10.5px] py-1.5 px-3 rounded-lg shadow hover:bg-zinc-50 hover:scale-[1.02] active:scale-98 transition duration-200 text-center cursor-pointer select-none"
                  >
                    {activeAdSlide === 0 ? "Try it for $0 (7 days)" :
                     activeAdSlide === 1 ? "Try Free for 7 Days" :
                     "Get Started Free"}
                  </a>

                  {/* Manual pagination dots indicator */}
                  <div className="flex items-center justify-center gap-1.5 mt-2.5 select-none">
                    {[0, 1, 2].map((idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveAdSlide(idx)}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                          activeAdSlide === idx ? 'bg-white w-3' : 'bg-white/40 hover:bg-white/60'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
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
