/**
 * Design Token System - Amy Park's Design Systems Foundation
 * 
 * Semantic, accessible design tokens for the Setlist Builder
 * Optimized for dark theme comedy app with WCAG AA compliance
 */

// Base primitive tokens (raw values)
const primitives = {
  // Color primitives (HSL for better manipulation)
  colors: {
    // Neutral grays (main UI backbone)
    neutral: {
      50: 'hsl(210, 20%, 98%)',   // Near white
      100: 'hsl(210, 20%, 95%)',  // Light gray
      200: 'hsl(210, 16%, 90%)',  // 
      300: 'hsl(210, 14%, 83%)',  // 
      400: 'hsl(210, 14%, 71%)',  // Mid gray
      500: 'hsl(210, 12%, 56%)',  // True neutral
      600: 'hsl(210, 13%, 45%)',  // 
      700: 'hsl(210, 15%, 35%)',  // 
      800: 'hsl(210, 18%, 22%)',  // Dark surfaces
      900: 'hsl(210, 20%, 14%)',  // Darker
      950: 'hsl(210, 24%, 10%)',  // Darkest backgrounds
    },
    
    // Brand colors (comedy-themed warm palette)
    primary: {
      50: 'hsl(45, 100%, 96%)',   // Light cream
      100: 'hsl(45, 95%, 90%)',   // 
      200: 'hsl(45, 90%, 80%)',   // 
      300: 'hsl(45, 85%, 65%)',   // Light gold
      400: 'hsl(45, 80%, 50%)',   // 
      500: 'hsl(45, 75%, 42%)',   // Primary gold
      600: 'hsl(42, 70%, 38%)',   // 
      700: 'hsl(39, 65%, 32%)',   // 
      800: 'hsl(36, 60%, 26%)',   // 
      900: 'hsl(33, 55%, 20%)',   // Dark gold
      950: 'hsl(30, 50%, 15%)',   // Darkest
    },
    
    // Accent colors
    accent: {
      // Success (performance ready)
      success: {
        50: 'hsl(142, 76%, 96%)',
        100: 'hsl(142, 71%, 91%)', 
        200: 'hsl(142, 69%, 82%)',
        300: 'hsl(142, 69%, 70%)',
        400: 'hsl(142, 69%, 58%)',
        500: 'hsl(142, 69%, 45%)',  // Main success
        600: 'hsl(142, 69%, 38%)',
        700: 'hsl(142, 69%, 32%)',
        800: 'hsl(142, 69%, 26%)',
        900: 'hsl(142, 69%, 20%)',
        950: 'hsl(142, 69%, 14%)',
      },
      
      // Warning (workshopping)
      warning: {
        50: 'hsl(48, 100%, 96%)',
        100: 'hsl(48, 95%, 90%)',
        200: 'hsl(48, 90%, 80%)',
        300: 'hsl(48, 85%, 65%)',
        400: 'hsl(48, 80%, 50%)',
        500: 'hsl(48, 75%, 42%)',  // Main warning
        600: 'hsl(45, 70%, 38%)',
        700: 'hsl(42, 65%, 32%)',
        800: 'hsl(39, 60%, 26%)',
        900: 'hsl(36, 55%, 20%)',
        950: 'hsl(33, 50%, 15%)',
      },
      
      // Error/Danger
      error: {
        50: 'hsl(0, 86%, 97%)',
        100: 'hsl(0, 93%, 94%)',
        200: 'hsl(0, 96%, 89%)',
        300: 'hsl(0, 94%, 82%)',
        400: 'hsl(0, 91%, 71%)',
        500: 'hsl(0, 84%, 60%)',    // Main error
        600: 'hsl(0, 72%, 51%)',
        700: 'hsl(0, 74%, 42%)',
        800: 'hsl(0, 70%, 35%)',
        900: 'hsl(0, 63%, 31%)',
        950: 'hsl(0, 75%, 15%)',
      },
      
      // Info (clean content)
      info: {
        50: 'hsl(204, 100%, 97%)',
        100: 'hsl(204, 94%, 94%)',
        200: 'hsl(204, 96%, 86%)',
        300: 'hsl(204, 93%, 78%)',
        400: 'hsl(204, 91%, 68%)',
        500: 'hsl(204, 86%, 53%)',  // Main info
        600: 'hsl(204, 80%, 44%)',
        700: 'hsl(204, 77%, 37%)',
        800: 'hsl(204, 74%, 31%)',
        900: 'hsl(204, 71%, 26%)',
        950: 'hsl(204, 80%, 16%)',
      }
    }
  },
  
  // Typography primitives
  typography: {
    // Font families
    fontFamily: {
      sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
      display: ['SF Pro Display', 'Inter', 'system-ui', 'sans-serif'] // For headers
    },
    
    // Font sizes (fluid scale)
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px  
      base: '1rem',     // 16px (base)
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
    },
    
    // Font weights
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800'
    },
    
    // Line heights (readable for comedy content)
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',     // Default
      relaxed: '1.625',  // For joke text
      loose: '2'
    },
    
    // Letter spacing
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em', 
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em'
    }
  },
  
  // Spacing primitives (8px base grid)
  spacing: {
    px: '1px',
    0: '0px',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px  
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px (base)
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    11: '2.75rem',    // 44px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
  },
  
  // Border radius (smooth, modern)
  borderRadius: {
    none: '0px',
    xs: '0.125rem',   // 2px
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px (default)
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px'    // Pills/circles
  },
  
  // Shadows (subtle, performance-optimized)
  boxShadow: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: '0 0 #0000'
  },
  
  // Animation timings (60fps optimized)
  transitionDuration: {
    instant: '0ms',
    fast: '150ms',
    normal: '200ms',  // Default
    slow: '300ms',
    slower: '500ms'
  },
  
  // Easing functions
  transitionTimingFunction: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',    // Preferred
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)' // Default
  },
  
  // Z-index layers
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,      // Sticky headers
    dropdown: 1000,  // Dropdowns, selects
    sticky: 1020,    // Sticky elements  
    banner: 1030,    // Banners, alerts
    overlay: 1040,   // Modals, overlays
    modal: 1050,     // Modal dialogs
    popover: 1060,   // Popovers, tooltips
    tooltip: 1070,   // Tooltips
    toast: 1080,     // Toast notifications
    debug: 9000      // Debug overlays
  }
};

// Semantic tokens (what components actually use)
export const tokens = {
  // Color semantic tokens
  color: {
    // Text colors
    text: {
      primary: primitives.colors.neutral[100],        // Main text
      secondary: primitives.colors.neutral[400],      // Secondary text
      tertiary: primitives.colors.neutral[500],       // Disabled text
      inverse: primitives.colors.neutral[900],        // Text on light bg
      accent: primitives.colors.primary[400],         // Brand text
      link: primitives.colors.primary[300],           // Links
      linkHover: primitives.colors.primary[200],      // Link hover
    },
    
    // Background colors
    bg: {
      primary: primitives.colors.neutral[950],        // Main background
      secondary: primitives.colors.neutral[900],      // Secondary bg
      tertiary: primitives.colors.neutral[800],       // Cards, panels
      elevated: primitives.colors.neutral[850],       // Elevated surfaces
      overlay: 'hsla(210, 20%, 10%, 0.8)',           // Modal overlays
      inverse: primitives.colors.neutral[50],         // Light mode bg
    },
    
    // Border colors
    border: {
      primary: primitives.colors.neutral[700],        // Main borders
      secondary: primitives.colors.neutral[800],      // Subtle borders
      accent: primitives.colors.primary[600],         // Brand borders
      focus: primitives.colors.primary[400],          // Focus rings
    },
    
    // Interactive colors
    interactive: {
      primary: primitives.colors.primary[500],        // Primary buttons
      primaryHover: primitives.colors.primary[400],   // Primary hover
      primaryActive: primitives.colors.primary[600],  // Primary active
      
      secondary: primitives.colors.neutral[700],      // Secondary buttons
      secondaryHover: primitives.colors.neutral[600], // Secondary hover
      secondaryActive: primitives.colors.neutral[800], // Secondary active
      
      ghost: 'transparent',                           // Ghost buttons
      ghostHover: primitives.colors.neutral[800],     // Ghost hover
      ghostActive: primitives.colors.neutral[700],    // Ghost active
    },
    
    // Status colors
    status: {
      success: primitives.colors.accent.success[500],
      successBg: primitives.colors.accent.success[950],
      successBorder: primitives.colors.accent.success[700],
      
      warning: primitives.colors.accent.warning[500],
      warningBg: primitives.colors.accent.warning[950],
      warningBorder: primitives.colors.accent.warning[700],
      
      error: primitives.colors.accent.error[500],
      errorBg: primitives.colors.accent.error[950],
      errorBorder: primitives.colors.accent.error[700],
      
      info: primitives.colors.accent.info[500],
      infoBg: primitives.colors.accent.info[950],
      infoBorder: primitives.colors.accent.info[700],
    }
  },
  
  // Typography semantic tokens
  typography: {
    // Text styles
    text: {
      // Display text (headers, titles)
      display: {
        fontFamily: primitives.typography.fontFamily.display,
        fontWeight: primitives.typography.fontWeight.bold,
        lineHeight: primitives.typography.lineHeight.tight,
        letterSpacing: primitives.typography.letterSpacing.tight
      },
      
      // Body text (paragraphs, content)
      body: {
        fontFamily: primitives.typography.fontFamily.sans,
        fontWeight: primitives.typography.fontWeight.normal,
        lineHeight: primitives.typography.lineHeight.normal,
        letterSpacing: primitives.typography.letterSpacing.normal
      },
      
      // Code/monospace text
      code: {
        fontFamily: primitives.typography.fontFamily.mono,
        fontWeight: primitives.typography.fontWeight.normal,
        lineHeight: primitives.typography.lineHeight.snug,
        letterSpacing: primitives.typography.letterSpacing.normal
      }
    },
    
    // Size scales
    size: primitives.typography.fontSize
  },
  
  // Spacing semantic tokens
  space: {
    // Component spacing
    component: {
      xs: primitives.spacing[1],      // 4px - tight spacing
      sm: primitives.spacing[2],      // 8px - small spacing  
      md: primitives.spacing[4],      // 16px - default spacing
      lg: primitives.spacing[6],      // 24px - large spacing
      xl: primitives.spacing[8],      // 32px - extra large spacing
    },
    
    // Layout spacing
    layout: {
      xs: primitives.spacing[4],      // 16px
      sm: primitives.spacing[6],      // 24px
      md: primitives.spacing[8],      // 32px
      lg: primitives.spacing[12],     // 48px
      xl: primitives.spacing[16],     // 64px
    }
  },
  
  // Border radius semantic tokens
  radius: {
    none: primitives.borderRadius.none,
    xs: primitives.borderRadius.xs,
    sm: primitives.borderRadius.sm,
    md: primitives.borderRadius.md,       // Default
    lg: primitives.borderRadius.lg,
    xl: primitives.borderRadius.xl,
    full: primitives.borderRadius.full
  },
  
  // Shadow semantic tokens
  shadow: {
    none: primitives.boxShadow.none,
    sm: primitives.boxShadow.sm,          // Subtle elevation
    md: primitives.boxShadow.md,          // Default elevation
    lg: primitives.boxShadow.lg,          // Prominent elevation
    xl: primitives.boxShadow.xl           // High elevation
  },
  
  // Animation semantic tokens
  animation: {
    duration: {
      fast: primitives.transitionDuration.fast,
      normal: primitives.transitionDuration.normal,    // Default
      slow: primitives.transitionDuration.slow
    },
    easing: {
      default: primitives.transitionTimingFunction.out,
      inOut: primitives.transitionTimingFunction.inOut
    }
  },
  
  // Z-index semantic tokens
  layer: primitives.zIndex
};

// Component-specific tokens
export const componentTokens = {
  // Button tokens
  button: {
    height: {
      xs: '28px',
      sm: '32px', 
      md: '40px',     // Default
      lg: '44px',
      xl: '48px'
    },
    padding: {
      xs: `${primitives.spacing[2]} ${primitives.spacing[3]}`,
      sm: `${primitives.spacing[2]} ${primitives.spacing[4]}`,
      md: `${primitives.spacing[3]} ${primitives.spacing[6]}`,    // Default
      lg: `${primitives.spacing[3.5]} ${primitives.spacing[8]}`,
      xl: `${primitives.spacing[4]} ${primitives.spacing[10]}`
    }
  },
  
  // Input tokens
  input: {
    height: {
      sm: '32px',
      md: '40px',     // Default
      lg: '48px'
    },
    padding: `${primitives.spacing[2.5]} ${primitives.spacing[3.5]}`
  },
  
  // Card tokens
  card: {
    padding: {
      sm: primitives.spacing[4],
      md: primitives.spacing[6],    // Default
      lg: primitives.spacing[8]
    },
    gap: primitives.spacing[4]      // Internal element spacing
  }
};

export default tokens;