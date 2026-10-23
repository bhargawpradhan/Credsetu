/**
 * MiniLedger 3D Palette:
 * - Deep Aubergine (Cosmic Velvet Midnight)
 * - Ice Silver (Frost Metallic Platinum)
 * - Marigold (Radiant Amber Gold)
 */

export const THEME = {
  // Deep Aubergine
  aubergine: {
    darkest: '#0A0310',
    dark: '#13061C',
    primary: '#1E0B2B',
    surface: '#2A0E3D',
    light: '#3D1557',
    glass: 'rgba(30, 11, 43, 0.55)',
    glassDark: 'rgba(19, 6, 28, 0.75)',
    glassLight: 'rgba(42, 14, 61, 0.40)',
    glow: 'rgba(61, 21, 87, 0.5)',
  },

  // Ice Silver
  iceSilver: {
    pure: '#FFFFFF',
    light: '#F8FAFC',
    main: '#E2E8F0',
    metallic: '#CBD5E1',
    muted: '#94A3B8',
    dark: '#64748B',
    border: 'rgba(226, 232, 240, 0.20)',
    borderStrong: 'rgba(226, 232, 240, 0.45)',
    glass: 'rgba(226, 232, 240, 0.08)',
    specular: 'rgba(255, 255, 255, 0.45)',
    glow: 'rgba(226, 232, 240, 0.25)',
  },

  // Marigold
  marigold: {
    light: '#FEF08A',
    main: '#F59E0B', // Primary vivid marigold
    bright: '#FBBF24',
    amber: '#D97706',
    flame: '#B45309',
    glass: 'rgba(245, 158, 11, 0.16)',
    glassBorder: 'rgba(245, 158, 11, 0.35)',
    glow: 'rgba(245, 158, 11, 0.45)',
    glowStrong: 'rgba(251, 191, 36, 0.75)',
  },

  // Overdue / Warning (blended with Marigold flame)
  overdue: {
    main: '#EF4444',
    bright: '#F87171',
    dark: '#991B1B',
    glass: 'rgba(239, 68, 68, 0.18)',
    glassBorder: 'rgba(239, 68, 68, 0.45)',
    glow: 'rgba(239, 68, 68, 0.5)',
  },

  // Repaid / Success (Emerald frost)
  repaid: {
    main: '#10B981',
    light: '#34D399',
    glass: 'rgba(16, 185, 129, 0.18)',
    border: 'rgba(16, 185, 129, 0.35)',
    glow: 'rgba(16, 185, 129, 0.4)',
  },
};
