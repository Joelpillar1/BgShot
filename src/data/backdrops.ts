import { Backdrop, ShadowOverlay } from '../types';

export const BACKDROPS: Backdrop[] = [
  // Matte & Minimalist Solids
  {
    id: 'studio-white',
    name: 'Matt Off-White',
    category: 'solids',
    value: '#F4F4F7',
    spotlight: true,
    textColor: 'dark'
  },
  {
    id: 'studio-slate',
    name: 'Aluminium Gray',
    category: 'solids',
    value: '#E3E4E6',
    spotlight: true,
    textColor: 'dark'
  },
  {
    id: 'studio-dark',
    name: 'Midnight Ash',
    category: 'solids',
    value: '#121214',
    spotlight: true,
    textColor: 'light'
  },
  {
    id: 'studio-sand',
    name: 'Travertine Sand',
    category: 'solids',
    value: '#EFECE6',
    spotlight: true,
    textColor: 'dark'
  },
  {
    id: 'studio-sage',
    name: 'Eucalyptus Sage',
    category: 'solids',
    value: '#E2E7E2',
    spotlight: true,
    textColor: 'dark'
  },
  {
    id: 'studio-blush',
    name: 'Blush Velvet',
    category: 'solids',
    value: '#F3EBE9',
    spotlight: true,
    textColor: 'dark'
  },
  {
    id: 'studio-terracotta',
    name: 'Studio Clay Orange',
    category: 'solids',
    value: '#D46038', // Pure clay orange extracted from user's OS image
    spotlight: true,
    textColor: 'light'
  },
  // Studio Gradient Spotlight Ranges
  {
    id: 'grad-azure-violet',
    name: 'Azure Violet Glow',
    category: 'gradients',
    value: 'linear-gradient(135deg, #4ca0ff 0%, #5E5DF0 45%, #7F00FF 100%)', // Elegant Indigo-Blue like Sample 2
    spotlight: true,
    textColor: 'light'
  },
  {
    id: 'grad-saas-mrr',
    name: 'Neon MRR Velvet',
    category: 'gradients',
    value: 'linear-gradient(135deg, #1e40af 0%, #6d28d9 45%, #be185d 80%, #f43f5e 100%)', // Deep Violet-Blue to Magenta like Sample 3
    spotlight: true,
    textColor: 'light'
  },
  {
    id: 'grad-quartz-dusk',
    name: 'Quartz Dusk',
    category: 'gradients',
    value: 'linear-gradient(135deg, #E2DFFF 0%, #FFE9EC 100%)',
    spotlight: true,
    textColor: 'dark'
  },
  {
    id: 'grad-nordic-day',
    name: 'Nordic Daylight',
    category: 'gradients',
    value: 'linear-gradient(180deg, #E2F1F6 0%, #ECCAD9 100%)',
    spotlight: true,
    textColor: 'dark'
  },
  {
    id: 'grad-editorial',
    name: 'Northern Sky',
    category: 'gradients',
    value: 'linear-gradient(135deg, #DCE6F1 0%, #F5EFEB 100%)',
    spotlight: true,
    textColor: 'dark'
  },
  {
    id: 'grad-warm-glow',
    name: 'Sunset Dust',
    category: 'gradients',
    value: 'linear-gradient(135deg, #F3D9C9 0%, #E3C1B4 100%)',
    spotlight: true,
    textColor: 'dark'
  },
  {
    id: 'grad-terracotta-sunset',
    name: 'Clay Orange Sunset',
    category: 'gradients',
    value: 'linear-gradient(135deg, #F5F2EB 0%, #E2906E 50%, #D46038 100%)', // Cream to Terracotta Clay Amber gradient
    spotlight: true,
    textColor: 'dark'
  },
  {
    id: 'grad-burnt-clay',
    name: 'Vibrant Terracotta Glow',
    category: 'gradients',
    value: 'linear-gradient(135deg, #E47D54 0%, #D46038 60%, #9E3D1C 100%)', // Absolute high-contrast deep burnt orange clay to dark clay
    spotlight: true,
    textColor: 'light'
  },
  {
    id: 'grad-champagne',
    name: 'Golden Hour',
    category: 'gradients',
    value: 'linear-gradient(135deg, #F3ECD8 0%, #DFD0BD 100%)',
    spotlight: true,
    textColor: 'dark'
  },
  {
    id: 'grad-deep-indigo',
    name: 'Cosmic Indigo',
    category: 'gradients',
    value: 'linear-gradient(135deg, #181926 0%, #2B1C33 100%)',
    spotlight: true,
    textColor: 'light'
  },
  {
    id: 'grad-moss',
    name: 'Forest Mist',
    category: 'gradients',
    value: 'linear-gradient(135deg, #1C261D 0%, #0F1410 100%)',
    spotlight: true,
    textColor: 'light'
  },
  // Textured Organic Presets (Sample 1 Alarm Clock Sand & Clay Styles)
  {
    id: 'texture-sea-sand',
    name: 'Teal Shoreline Sand',
    category: 'presets',
    value: 'linear-gradient(135deg, #7ec4bf 0%, #4da39a 50%, #2f736a 100%)', // Coastal granular look (Sample 1)
    spotlight: true,
    textColor: 'light'
  },
  {
    id: 'texture-warm-plaster',
    name: 'Clay Stucco Plaster',
    category: 'presets',
    value: 'linear-gradient(135deg, #f7f4ed 0%, #eae3d2 50%, #dcd1ba 100%)', // Warm rustic concrete/clay floor (Sample 1)
    spotlight: true,
    textColor: 'dark'
  },
  {
    id: 'texture-slate-stone',
    name: 'Matt Industrial Slate',
    category: 'presets',
    value: 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)', // Slate textured mockup background
    spotlight: true,
    textColor: 'light'
  }
];

export const SHADOW_OVERLAYS: ShadowOverlay[] = [
  {
    id: 'none',
    name: 'Direct Softlight',
    svgPath: '',
    intensity: 0,
    blur: 0
  },
  {
    id: 'palm-leaf',
    name: 'Palm Leaf Shadow',
    // Realistic cast of a palm leaf frond we can draw on Canvas
    svgPath: 'M-50,0 Q20,100 120,400 Q80,240 10,120 Q50,200 150,420 Q100,280 30,150 Q120,240 240,400 Q150,280 80,180 Q220,180 320,380 Q210,240 150,190 Q300,100 400,200 Q280,120 180,150',
    intensity: 0.12,
    blur: 15
  },
  {
    id: 'window-blinds',
    name: 'Studio Louvers',
    // High-contrast clean window blind slats
    svgPath: 'M0,50 L800,50 M0,200 L800,200 M0,350 L800,350 M0,500 L800,500 M0,650 L800,650 M0,800 L800,800',
    intensity: 0.15,
    blur: 24
  },
  {
    id: 'square-panes',
    name: 'French Window',
    // Square grid window reflection
    svgPath: 'M100,0 L100,800 M300,0 L300,800 M500,0 L500,800 M0,200 L800,200 M0,450 L800,450 M0,700 L800,700',
    intensity: 0.08,
    blur: 40
  },
  {
    id: 'monstera-leaf',
    name: 'Tropical Monstera',
    svgPath: 'M-50,-50 C0,150 150,200 300,300 C250,150 150,50 50,-50 C100,50 200,100 320,180 C220,50 120,0 20,-30 C150,-10 250,50 350,100 C200,10 120,-30 40,-40',
    intensity: 0.14,
    blur: 30
  }
];
