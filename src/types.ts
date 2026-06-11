export interface Backdrop {
  id: string;
  name: string;
  category: 'solids' | 'gradients' | 'presets';
  value: string; // Hex color, CSS gradient, or SVG texture representation
  spotlight?: boolean; // If true, overlay a soft radial spotlight
  textColor: 'light' | 'dark';
}

export interface ShadowOverlay {
  id: string;
  name: string;
  svgPath: string; // SVG path or pattern string
  intensity: number; // Default opacity (0 to 1)
  blur: number; // Shadow blur
}

export interface SubjectPlacement {
  x: number; // percentage from center (0 = center)
  y: number; // percentage from center (0 = center)
  scale: number; // multiplier (e.g. 1.0)
  rotation: number; // in degrees (0 to 360)
  flipX: boolean;
  aspectRatio: number;
  borderRadius: number; // corner roundedness in pixels
}

export interface SubjectEnhancement {
  brightness: number; // 0.5 to 1.5, default 1
  contrast: number; // 0.5 to 1.5, default 1
  saturation: number; // 0 to 2, default 1
  temperature: number; // warm/cool shift (-100 to 100)
  exposure: number; // -100 to 100, default 0
}

export interface SubjectShadow {
  enabled: boolean;
  color: string;
  offsetX: number; // in px
  offsetY: number; // in px
  blur: number; // in px
  opacity: number; // 0 to 1
}

export interface CanvasDimensions {
  width: number;
  height: number;
}
