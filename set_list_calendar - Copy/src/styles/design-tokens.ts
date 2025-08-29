/**
 * Design Tokens - Google Material Design 3 Inspired
 * Consistent, scalable design system for Setlist Builder
 */

// Color System - Semantic color tokens
export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe', 
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main brand color
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49'
  },

  // Success/Performance Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'
  },

  // Warning/Attention Colors  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f'
  },

  // Error/Critical Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'
  },

  // Neutral/Gray Scale
  neutral: {
    0: '#ffffff',
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712'
  },

  // Dark Theme Colors
  dark: {
    bg: {
      primary: '#0f0f0f',    // Main background
      secondary: '#1a1a1a',  // Cards/surfaces
      tertiary: '#262626',   // Elevated elements
      quaternary: '#333333'  // Highest elevation
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
      tertiary: '#737373',
      disabled: '#525252'
    },
    border: {
      primary: '#333333',
      secondary: '#404040',
      accent: '#525252'
    }
  },

  // Semantic Colors (Context-aware)
  semantic: {
    background: {
      primary: '#0f0f0f',
      surface: '#1a1a1a',
      elevated: '#262626',
      overlay: 'rgba(0, 0, 0, 0.8)'
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
      accent: '#0ea5e9',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    interactive: {
      primary: '#0ea5e9',
      primaryHover: '#0284c7',
      secondary: '#374151',
      secondaryHover: '#4b5563',
      disabled: '#525252'
    }
  }
} as const

// Typography System
export const typography = {
  fontFamily: {
    sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
    display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif']
  },

  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px  
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem'   // 72px
  },

  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },

  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em', 
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em'
  }
} as const

// Spacing System (8px grid)
export const spacing = {
  0: '0px',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  7: '1.75rem',  // 28px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
  32: '8rem',    // 128px
  40: '10rem',   // 160px
  48: '12rem',   // 192px
  56: '14rem',   // 224px
  64: '16rem'    // 256px
} as const

// Border Radius
export const borderRadius = {
  none: '0px',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px'
} as const

// Shadows (Elevation)
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  
  // Dark theme shadows
  dark: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)'
  }
} as const

// Animation & Transitions
export const animation = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms'
  },
  
  easing: {
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)', 
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },

  transitions: {
    all: 'all 200ms cubic-bezier(0, 0, 0.2, 1)',
    colors: 'color 200ms cubic-bezier(0, 0, 0.2, 1), background-color 200ms cubic-bezier(0, 0, 0.2, 1), border-color 200ms cubic-bezier(0, 0, 0.2, 1)',
    opacity: 'opacity 200ms cubic-bezier(0, 0, 0.2, 1)',
    shadow: 'box-shadow 200ms cubic-bezier(0, 0, 0.2, 1)',
    transform: 'transform 200ms cubic-bezier(0, 0, 0.2, 1)'
  }
} as const

// Breakpoints
export const breakpoints = {
  xs: '475px',
  sm: '640px', 
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const

// Z-Index Scale
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800
} as const

// Component-Specific Tokens
export const components = {
  button: {
    height: {
      sm: '2rem',    // 32px
      md: '2.5rem',  // 40px  
      lg: '3rem'     // 48px
    },
    padding: {
      sm: '0.5rem 0.75rem',
      md: '0.625rem 1rem',
      lg: '0.75rem 1.5rem'
    }
  },

  card: {
    padding: {
      sm: spacing[4],
      md: spacing[6], 
      lg: spacing[8]
    },
    borderRadius: borderRadius.lg
  },

  input: {
    height: {
      sm: '2rem',
      md: '2.5rem', 
      lg: '3rem'
    },
    borderRadius: borderRadius.md
  },

  modal: {
    maxWidth: {
      sm: '28rem',   // 448px
      md: '32rem',   // 512px
      lg: '42rem',   // 672px
      xl: '48rem'    // 768px
    }
  }
} as const

// Export all design tokens as a unified theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  breakpoints,
  zIndex,
  components
} as const

// Type definitions for TypeScript
export type Theme = typeof theme
export type Colors = typeof colors
export type Spacing = typeof spacing
export type Typography = typeof typography

// Helper function to create consistent component variants
export const createVariant = (baseStyles: any, variants: Record<string, any>) => {
  return (variant: string = 'default') => ({
    ...baseStyles,
    ...variants[variant]
  })
}

// Utility functions for common operations
export const rgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const getContrastColor = (backgroundColor: string): string => {
  // Simple contrast calculation - would be more sophisticated in production
  return backgroundColor === colors.neutral[0] ? colors.neutral[900] : colors.neutral[0]
}