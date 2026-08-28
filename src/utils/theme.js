/**
 * Theme Engine Utility
 * Supports 6 curated themes inspired by modern aesthetic design systems:
 * 1. Golden Peachy Glow (Dark Default)
 * 2. Sunshine Radiance (Radiant Light)
 * 3. Sakura Blossom (Radiant Pastel Light)
 * 4. Mint Breeze (Radiant Mint Light)
 * 5. Nordic Dusk (Sapphire Dark)
 * 6. Tokyo Pastel (Cyber Synth Dark)
 */

const PRESET_KEY = 'katalyst_theme_preset';

export const THEME_PRESETS = [
  {
    id: 'peachy_glow',
    name: 'Golden Peachy Glow',
    mode: 'dark',
    category: 'GOLDEN GLOW',
    icon: '✨',
    motion: 'Smooth Lift',
    description: 'Our signature dark mode with mauve shadow foundations and peachy coral accents.',
    swatches: ['#1F1215', '#3E2428', '#723D46', '#E26D5C', '#FFE1A8', '#C9CBA3', '#261619'],
    cardStyle: {
      bg: '#1F1215',
      surface: '#3E2428',
      border: '#723D46',
      text: '#FFE1A8',
      muted: '#C9CBA3',
      accent: '#E26D5C',
      accentText: '#1F1215'
    }
  },
  {
    id: 'sunshine_radiance',
    name: 'Sunshine Radiance',
    mode: 'light',
    category: 'RADIANT',
    icon: '☀️',
    motion: 'Smooth Lift',
    description: 'A bright, energetic light mode with warm amber foundations and punchy orange accents.',
    swatches: ['#FAF4E6', '#FFFFFF', '#FFB703', '#FB8500', '#E63946', '#455E7A', '#1D2D44'],
    cardStyle: {
      bg: '#FAF4E6',
      surface: '#FFFFFF',
      border: '#FB8500',
      text: '#1D2D44',
      muted: '#455E7A',
      accent: '#FB8500',
      accentText: '#FFFFFF'
    }
  },
  {
    id: 'sakura_blossom',
    name: 'Sakura Blossom',
    mode: 'light',
    category: 'RADIANT',
    icon: '🌸',
    motion: 'Smooth Lift',
    description: 'A delicate light pastel aesthetic using soft blush tones and deep plum typography.',
    swatches: ['#FDF2F8', '#FFFFFF', '#F472B6', '#EC4899', '#C026D3', '#6B21A8', '#3B0764'],
    cardStyle: {
      bg: '#FDF2F8',
      surface: '#FFFFFF',
      border: '#F472B6',
      text: '#3B0764',
      muted: '#6B21A8',
      accent: '#EC4899',
      accentText: '#FFFFFF'
    }
  },
  {
    id: 'mint_breeze',
    name: 'Mint Breeze',
    mode: 'light',
    category: 'RADIANT',
    icon: '🍃',
    motion: 'Smooth Lift',
    description: 'A crisp, refreshing light mode featuring soft mint greens and cool teal highlights.',
    swatches: ['#F0FDF4', '#FFFFFF', '#4ADE80', '#0D9488', '#F59E0B', '#334155', '#0F172A'],
    cardStyle: {
      bg: '#F0FDF4',
      surface: '#FFFFFF',
      border: '#4ADE80',
      text: '#0F172A',
      muted: '#0D9488',
      accent: '#0D9488',
      accentText: '#FFFFFF'
    }
  },
  {
    id: 'nordic_dusk',
    name: 'Nordic Dusk',
    mode: 'dark',
    category: 'SAPPHIRE',
    icon: '❄️',
    motion: 'Smooth Lift',
    description: 'A sophisticated polar night canvas with steel grey foundations and frost blue accents.',
    swatches: ['#1B222D', '#242D3C', '#354359', '#78C4D4', '#E06D75', '#E2E8F0', '#F8FAFC'],
    cardStyle: {
      bg: '#1B222D',
      surface: '#242D3C',
      border: '#354359',
      text: '#F8FAFC',
      muted: '#E2E8F0',
      accent: '#78C4D4',
      accentText: '#1B222D'
    }
  },
  {
    id: 'tokyo_pastel',
    name: 'Tokyo Pastel',
    mode: 'dark',
    category: 'CYBER SYNTH',
    icon: '🌸',
    motion: 'Bouncy Scale',
    description: 'A soothing dark aesthetic featuring muted purple bases and pastel mauve highlights.',
    swatches: ['#181824', '#242335', '#3A3852', '#D8B4FE', '#F472B6', '#CBD5E1', '#E2E8F0'],
    cardStyle: {
      bg: '#181824',
      surface: '#242335',
      border: '#3A3852',
      text: '#E2E8F0',
      muted: '#CBD5E1',
      accent: '#F472B6',
      accentText: '#181824'
    }
  }
];

export function getStoredPreset() {
  if (typeof window === 'undefined') return 'peachy_glow';
  return localStorage.getItem(PRESET_KEY) || 'peachy_glow';
}

export function setStoredPreset(presetId) {
  const preset = THEME_PRESETS.find(p => p.id === presetId) || THEME_PRESETS[0];
  localStorage.setItem(PRESET_KEY, preset.id);
  applyPresetToDocument(preset.id);
  return preset;
}

export function applyPresetToDocument(presetId) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const preset = THEME_PRESETS.find(p => p.id === presetId) || THEME_PRESETS[0];

  // Remove existing theme classes
  THEME_PRESETS.forEach(p => {
    root.classList.remove(`theme-${p.id}`);
  });
  root.classList.remove('light', 'dark');

  // Apply new theme classes
  root.classList.add(`theme-${preset.id}`);
  root.classList.add(preset.mode);
}

export function initTheme() {
  const stored = getStoredPreset();
  applyPresetToDocument(stored);
  return stored;
}

export function toggleLightDarkMode() {
  const currentPresetId = getStoredPreset();
  const currentPreset = THEME_PRESETS.find(p => p.id === currentPresetId) || THEME_PRESETS[0];

  if (currentPreset.mode === 'dark') {
    // Switch to default light preset
    return setStoredPreset('sunshine_radiance');
  } else {
    // Switch to default dark preset
    return setStoredPreset('peachy_glow');
  }
}
