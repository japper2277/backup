/**
 * Design System - Apple-Level Polish
 * Comprehensive design tokens and component system
 */

// Color Palette - Carefully crafted for accessibility and emotion
export const colors = {
  // Primary Brand Colors
  brand: {
    primary: '#1DB954',      // Spotify green - energy, creativity
    secondary: '#45a3ff',    // Sky blue - trust, reliability
    accent: '#f5c518',       // Golden yellow - premium, highlight
    danger: '#ef4444',       // Red - warnings, destructive actions
    success: '#10b981',      // Emerald - success states
    warning: '#f59e0b',      // Amber - caution states
    info: '#3b82f6'          // Blue - information
  },

  // Neutral Grays - Perfect contrast ratios
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a'
  },

  // Dark Theme (Primary)
  dark: {
    background: '#0a0a0a',     // Deep black
    surface: '#121212',        // Card backgrounds
    surface2: '#1e1e1e',       // Interactive surfaces
    surface3: '#2d2d2d',       // Hover states
    border: '#3e3e3e',         // Subtle borders
    text: {
      primary: '#ffffff',       // Main text
      secondary: '#b3b3b3',     // Secondary text
      tertiary: '#8a8a8a',      // Disabled text
      inverse: '#0a0a0a'        // Text on light backgrounds
    }
  },

  // Light Theme (Secondary)
  light: {
    background: '#ffffff',
    surface: '#f8f9fa',
    surface2: '#f1f3f4',
    surface3: '#e8eaed',
    border: '#dadce0',
    text: {
      primary: '#202124',
      secondary: '#5f6368',
      tertiary: '#9aa0a6',
      inverse: '#ffffff'
    }
  },

  // Status Colors - Semantic meaning
  status: {
    'Idea': '#8a8a8a',              // Gray - just an idea
    'Workshopping': '#f59e0b',      // Amber - in development
    'Tight-5-Ready': '#3b82f6',     // Blue - ready for short sets
    'Show-Ready': '#10b981'         // Green - performance ready
  },

  // Interaction States
  interaction: {
    hover: 'rgba(255, 255, 255, 0.05)',
    active: 'rgba(255, 255, 255, 0.1)',
    focus: 'rgba(69, 163, 255, 0.15)',
    selected: 'rgba(29, 185, 84, 0.1)',
    disabled: 'rgba(255, 255, 255, 0.3)'
  }
};

// Typography Scale - Modular scale for perfect hierarchy
export const typography = {
  fonts: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
    serif: "'Crimson Text', Georgia, 'Times New Roman', serif"
  },

  // Font Sizes - Modular scale (1.25 ratio)
  sizes: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem'    // 60px
  },

  // Font Weights - Semantic naming
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900
  },

  // Line Heights - Optimized for readability
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2
  },

  // Letter Spacing
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em'
  }
};

// Spacing Scale - 8px base unit
export const spacing = {
  0: '0',
  1: '0.25rem',    // 4px
  2: '0.5rem',     // 8px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  32: '8rem',      // 128px
  40: '10rem',     // 160px
  48: '12rem',     // 192px
  56: '14rem',     // 224px
  64: '16rem'      // 256px
};

// Border Radius - Consistent rounding
export const borderRadius = {
  none: '0',
  sm: '0.125rem',    // 2px
  base: '0.25rem',   // 4px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px'
};

// Box Shadows - Layered elevation system
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  outline: '0 0 0 3px rgba(69, 163, 255, 0.15)',
  none: 'none'
};

// Z-Index Scale - Layering system
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1020,
  banner: 1030,
  overlay: 1040,
  modal: 1050,
  popover: 1060,
  skipLink: 1070,
  toast: 1080,
  tooltip: 1090
};

// Breakpoints - Mobile-first responsive design
export const breakpoints = {
  xs: '320px',     // Small phones
  sm: '640px',     // Large phones
  md: '768px',     // Tablets
  lg: '1024px',    // Small laptops
  xl: '1280px',    // Large laptops
  '2xl': '1536px'  // Desktops
};

// Animation & Transitions
export const animations = {
  // Duration
  duration: {
    fastest: '0.1s',
    fast: '0.2s',
    normal: '0.3s',
    slow: '0.5s',
    slowest: '0.8s'
  },

  // Easing Functions - Natural motion
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },

  // Common Transitions
  transitions: {
    all: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  }
};

// Component Specifications
export const components = {
  // Button System
  button: {
    sizes: {
      sm: {
        fontSize: typography.sizes.sm,
        padding: `${spacing[2]} ${spacing[3]}`,
        borderRadius: borderRadius.md,
        minHeight: '2rem'
      },
      md: {
        fontSize: typography.sizes.base,
        padding: `${spacing[3]} ${spacing[4]}`,
        borderRadius: borderRadius.md,
        minHeight: '2.5rem'
      },
      lg: {
        fontSize: typography.sizes.lg,
        padding: `${spacing[4]} ${spacing[6]}`,
        borderRadius: borderRadius.lg,
        minHeight: '3rem'
      }
    },
    variants: {
      primary: {
        backgroundColor: colors.brand.primary,
        color: colors.dark.text.inverse,
        border: 'none'
      },
      secondary: {
        backgroundColor: colors.dark.surface2,
        color: colors.dark.text.primary,
        border: `1px solid ${colors.dark.border}`
      },
      ghost: {
        backgroundColor: 'transparent',
        color: colors.dark.text.secondary,
        border: 'none'
      },
      danger: {
        backgroundColor: colors.brand.danger,
        color: colors.dark.text.inverse,
        border: 'none'
      }
    }
  },

  // Input System
  input: {
    base: {
      fontSize: typography.sizes.base,
      padding: `${spacing[3]} ${spacing[4]}`,
      borderRadius: borderRadius.md,
      border: `1px solid ${colors.dark.border}`,
      backgroundColor: colors.dark.surface2,
      color: colors.dark.text.primary,
      minHeight: '2.5rem'
    },
    states: {
      focus: {
        borderColor: colors.brand.secondary,
        boxShadow: shadows.outline
      },
      error: {
        borderColor: colors.brand.danger,
        boxShadow: `0 0 0 3px ${colors.brand.danger}15`
      }
    }
  },

  // Card System
  card: {
    base: {
      backgroundColor: colors.dark.surface,
      borderRadius: borderRadius.lg,
      border: `1px solid ${colors.dark.border}`,
      padding: spacing[6],
      boxShadow: shadows.md
    },
    interactive: {
      cursor: 'pointer',
      transition: animations.transitions.all,
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: shadows.lg
      }
    }
  },

  // Modal System
  modal: {
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)'
    },
    content: {
      backgroundColor: colors.dark.surface,
      borderRadius: borderRadius.xl,
      boxShadow: shadows['2xl'],
      border: `1px solid ${colors.dark.border}`
    }
  }
};

// Accessibility Features
export const accessibility = {
  // Focus Indicators
  focusRing: {
    outline: `2px solid ${colors.brand.secondary}`,
    outlineOffset: '2px'
  },

  // Screen Reader Classes
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0'
  },

  // High Contrast Mode Support
  highContrast: {
    '@media (prefers-contrast: high)': {
      borderWidth: '2px',
      borderColor: 'currentColor'
    }
  },

  // Reduced Motion Support
  reducedMotion: {
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
      transition: 'none'
    }
  }
};

// Design Tokens Export
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
  breakpoints,
  animations,
  components,
  accessibility
};

export default designTokens;