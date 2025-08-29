/**
 * Pill Component - Design System
 * Status indicators, tags, and badges with Amy Park's design tokens
 */

import React, { memo } from 'react';
import { clsx } from 'clsx';
// Temporary fallback design tokens
const tokens = {
  typography: {
    text: {
      body: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
        lineHeight: 1.5
      }
    },
    size: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem'
    },
    fontWeight: {
      medium: 500
    },
    lineHeight: {
      none: 1
    }
  },
  space: {
    component: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem'
    }
  }
};

// Pill styles using design tokens
const pillStyles = {
  base: {
    // Layout
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space.component.xs,
    
    // Typography
    fontFamily: tokens.typography.text.body.fontFamily,
    fontWeight: tokens.typography.fontWeight.medium,
    lineHeight: tokens.typography.lineHeight.none,
    whiteSpace: 'nowrap',
    
    // Border
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: 'var(--radius-full)',
    
    // Interactions
    transition: `all var(--duration-fast) var(--easing-default)`,
    
    // Performance
    contain: 'layout style',
  },
  
  sizes: {
    xs: {
      fontSize: tokens.typography.size.xs,
      padding: `2px ${tokens.space.component.xs}`,
      height: '20px',
    },
    sm: {
      fontSize: tokens.typography.size.xs,
      padding: `4px ${tokens.space.component.sm}`,
      height: '24px',
    },
    md: {
      fontSize: tokens.typography.size.sm,
      padding: `6px ${tokens.space.component.md}`,
      height: '28px',
    },
    lg: {
      fontSize: tokens.typography.size.base,
      padding: `8px ${tokens.space.component.lg}`,
      height: '32px',
    }
  },
  
  variants: {
    // Default neutral variant
    default: {
      backgroundColor: 'var(--color-bg-secondary)',
      borderColor: 'var(--color-border-primary)',
      color: 'var(--color-text-secondary)',
    },
    
    // Primary brand variant
    primary: {
      backgroundColor: 'var(--color-interactive-primary)',
      borderColor: 'var(--color-interactive-primary)',
      color: 'var(--color-text-inverse)',
    },
    
    // Success status (Show Ready, etc.)
    success: {
      backgroundColor: 'var(--color-status-success-bg)',
      borderColor: 'var(--color-status-success-border)',
      color: 'var(--color-status-success)',
    },
    
    // Warning status (Workshopping, etc.)
    warning: {
      backgroundColor: 'var(--color-status-warning-bg)',
      borderColor: 'var(--color-status-warning-border)',
      color: 'var(--color-status-warning)',
    },
    
    // Error/danger status
    error: {
      backgroundColor: 'var(--color-status-error-bg)',
      borderColor: 'var(--color-status-error-border)',
      color: 'var(--color-status-error)',
    },
    
    // Info status (Clean content, etc.)
    info: {
      backgroundColor: 'var(--color-status-info-bg)',
      borderColor: 'var(--color-status-info-border)',
      color: 'var(--color-status-info)',
    },
    
    // Outline variants
    outline: {
      backgroundColor: 'transparent',
      borderColor: 'var(--color-border-primary)',
      color: 'var(--color-text-secondary)',
    },
    
    outlinePrimary: {
      backgroundColor: 'transparent',
      borderColor: 'var(--color-interactive-primary)',
      color: 'var(--color-interactive-primary)',
    }
  }
};

// Main Pill component
export const Pill = memo(({
  className,
  size = 'sm',
  variant = 'default',
  leftIcon,
  rightIcon,
  removable,
  onRemove,
  children,
  ...props
}) => {
  const pillStyle = {
    ...pillStyles.base,
    ...pillStyles.sizes[size],
    ...pillStyles.variants[variant]
  };
  
  return (
    <span
      className={clsx('design-system-pill', className)}
      style={pillStyle}
      {...props}
    >
      {leftIcon && (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {leftIcon}
        </span>
      )}
      
      <span style={{ 
        overflow: 'hidden', 
        textOverflow: 'ellipsis',
        maxWidth: '200px' // Prevent very long pills
      }}>
        {children}
      </span>
      
      {rightIcon && (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {rightIcon}
        </span>
      )}
      
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            width: '16px',
            height: '16px',
            border: 'none',
            background: 'none',
            borderRadius: 'var(--radius-full)',
            color: 'inherit',
            cursor: 'pointer',
            opacity: 0.7,
            transition: `all var(--duration-fast) var(--easing-default)`,
            marginLeft: tokens.space.component.xs,
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = '0.7'}
          aria-label="Remove"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </span>
  );
});

Pill.displayName = 'Pill';

// Pre-built status pill variants for comedy app
export const StatusPill = memo(({ status, ...props }) => {
  const statusConfig = {
    'Idea': { variant: 'default', children: 'Idea' },
    'Workshopping': { variant: 'warning', children: 'Workshopping' },
    'Tight 5 Ready': { variant: 'info', children: 'Tight 5 Ready' },
    'Show Ready': { variant: 'success', children: 'Show Ready' }
  };
  
  const config = statusConfig[status] || { variant: 'default', children: status };
  
  return <Pill size="xs" {...config} {...props} />;
});

StatusPill.displayName = 'StatusPill';

// Joke type pill
export const JokeTypePill = memo(({ type, ...props }) => (
  <Pill 
    size="xs" 
    variant="outline"
    {...props}
  >
    {type}
  </Pill>
));

JokeTypePill.displayName = 'JokeTypePill';

// Clean content indicator pill
export const CleanPill = memo((props) => (
  <Pill 
    size="xs" 
    variant="info"
    leftIcon={
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg>
    }
    {...props}
  >
    Clean
  </Pill>
));

CleanPill.displayName = 'CleanPill';

// Tag pill for joke tags
export const TagPill = memo(({ tag, onRemove, ...props }) => (
  <Pill
    size="xs"
    variant="outlinePrimary"
    removable={!!onRemove}
    onRemove={onRemove}
    {...props}
  >
    #{tag}
  </Pill>
));

TagPill.displayName = 'TagPill';

export default Pill;