/**
 * Select Component - Design System
 * Accessible dropdown select with Amy Park's design tokens
 */

import React, { forwardRef, memo } from 'react';
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

// Select styles using design tokens
const selectStyles = {
  base: {
    // Layout
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    
    // Typography  
    fontFamily: tokens.typography.text.body.fontFamily,
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.text.body.fontWeight,
    lineHeight: tokens.typography.text.body.lineHeight,
    
    // Colors
    color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-bg-tertiary)',
    borderColor: 'var(--color-border-primary)',
    
    // Border
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: 'var(--radius-md)',
    
    // Spacing
    padding: 'var(--input-padding)',
    paddingRight: `calc(${tokens.space.component.lg} + 16px)`, // Space for chevron
    minHeight: 'var(--input-height-md)',
    
    // Interactions
    transition: `all var(--duration-normal) var(--easing-default)`,
    outline: 'none',
    cursor: 'pointer',
    
    // Remove default appearance
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    
    // States
    '&:hover': {
      borderColor: 'var(--color-border-accent)',
    },
    
    '&:focus': {
      borderColor: 'var(--color-border-focus)',
      boxShadow: `0 0 0 3px var(--color-border-focus)`,
      backgroundColor: 'var(--color-bg-elevated)',
    },
    
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
      backgroundColor: 'var(--color-bg-secondary)',
    }
  },
  
  sizes: {
    sm: {
      minHeight: 'var(--input-height-sm)',
      fontSize: tokens.typography.size.sm,
      padding: `${tokens.space.component.sm} ${tokens.space.component.md}`,
      paddingRight: `calc(${tokens.space.component.md} + 16px)`,
    },
    md: {
      minHeight: 'var(--input-height-md)',
      fontSize: tokens.typography.size.base,
      padding: 'var(--input-padding)',
      paddingRight: `calc(${tokens.space.component.lg} + 16px)`,
    },
    lg: {
      minHeight: 'var(--input-height-lg)',
      fontSize: tokens.typography.size.lg,
      padding: `${tokens.space.component.md} ${tokens.space.component.lg}`,
      paddingRight: `calc(${tokens.space.component.xl} + 16px)`,
    }
  },
  
  variants: {
    default: {},
    error: {
      borderColor: 'var(--color-status-error)',
      '&:focus': {
        borderColor: 'var(--color-status-error)',
        boxShadow: `0 0 0 3px var(--color-status-error-border)`,
      }
    }
  }
};

// Chevron icon component
const ChevronIcon = memo(() => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    style={{
      position: 'absolute',
      right: tokens.space.component.md,
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      color: 'var(--color-text-secondary)',
      transition: `color var(--duration-fast) var(--easing-default)`
    }}
  >
    <polyline points="6,9 12,15 18,9" />
  </svg>
));

ChevronIcon.displayName = 'ChevronIcon';

// Select component
export const Select = memo(forwardRef(({
  className,
  size = 'md',
  variant = 'default',
  error,
  children,
  placeholder,
  ...props
}, ref) => {
  const currentVariant = error ? 'error' : variant;
  
  const selectStyle = {
    ...selectStyles.base,
    ...selectStyles.sizes[size],
    ...selectStyles.variants[currentVariant]
  };
  
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <select
        ref={ref}
        style={selectStyle}
        className={clsx('design-system-select', className)}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronIcon />
    </div>
  );
}));

Select.displayName = 'Select';

// Option component for consistent styling
export const Option = memo(({ value, children, disabled, ...props }) => (
  <option 
    value={value} 
    disabled={disabled}
    style={{
      backgroundColor: 'var(--color-bg-tertiary)',
      color: 'var(--color-text-primary)',
      padding: tokens.space.component.sm,
    }}
    {...props}
  >
    {children}
  </option>
));

Option.displayName = 'Option';

export default Select;