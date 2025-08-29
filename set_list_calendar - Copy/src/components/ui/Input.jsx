/**
 * Input Component - Design System
 * Accessible, performant form inputs with Amy Park's design tokens
 */

import React, { forwardRef, useState, useCallback, memo } from 'react';
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

// Input styles using CSS-in-JS with design tokens
const inputStyles = {
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
    color: '#f3f4f6',
    backgroundColor: '#1f2937',
    borderColor: '#4b5563',
    
    // Border
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '0.375rem',
    
    // Spacing
    padding: tokens.space.component.md,
    minHeight: '2.5rem',
    
    // Interactions
    transition: 'all 200ms ease-out',
    outline: 'none',
    
    // States
    '&:hover': {
      borderColor: '#6b7280',
    },
    
    '&:focus': {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)',
      backgroundColor: '#374151',
    },
    
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
      backgroundColor: '#374151',
    },
    
    '&::placeholder': {
      color: '#9ca3af',
    }
  },
  
  sizes: {
    sm: {
      minHeight: '2rem',
      fontSize: tokens.typography.size.sm,
      padding: `${tokens.space.component.sm} ${tokens.space.component.md}`,
    },
    md: {
      minHeight: '2.5rem',
      fontSize: tokens.typography.size.base,
      padding: '0.75rem',
    },
    lg: {
      minHeight: '3rem', 
      fontSize: tokens.typography.size.lg,
      padding: `${tokens.space.component.md} ${tokens.space.component.lg}`,
    }
  },
  
  variants: {
    default: {},
    error: {
      borderColor: '#ef4444',
      '&:focus': {
        borderColor: '#ef4444',
        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.3)',
      }
    },
    success: {
      borderColor: '#22c55e',
      '&:focus': {
        borderColor: '#22c55e',
        boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.3)',
      }
    }
  }
};

// Input component with performance optimizations
export const Input = memo(forwardRef(({
  className,
  type = 'text',
  size = 'md',
  variant = 'default',
  error,
  success,
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
  onChange,
  placeholder,
  disabled,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  
  // Handle focus with callback memoization
  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    onFocus?.(e);
  }, [onFocus]);
  
  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    onBlur?.(e);
  }, [onBlur]);
  
  // Determine variant based on props
  const currentVariant = error ? 'error' : success ? 'success' : variant;
  
  // Generate styles
  const baseStyle = {
    ...inputStyles.base,
    ...inputStyles.sizes[size],
    ...inputStyles.variants[currentVariant]
  };
  
  // Handle change with performance optimization
  const handleChange = useCallback((e) => {
    onChange?.(e);
  }, [onChange]);
  
  const inputElement = (
    <input
      ref={ref}
      type={type}
      style={baseStyle}
      className={clsx('design-system-input', className)}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-invalid={error ? 'true' : undefined}
      {...props}
    />
  );
  
  // If no icons, return simple input
  if (!leftIcon && !rightIcon) {
    return inputElement;
  }
  
  // Return input with icon wrapper
  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      width: '100%'
    }}>
      {leftIcon && (
        <div style={{
          position: 'absolute',
          left: tokens.space.component.md,
          zIndex: 1,
          color: isFocused ? '#3b82f6' : '#9ca3af',
          transition: 'color 150ms ease-out',
          pointerEvents: 'none'
        }}>
          {leftIcon}
        </div>
      )}
      
      <input
        ref={ref}
        type={type}
        style={{
          ...baseStyle,
          paddingLeft: leftIcon ? `calc(${tokens.space.component.lg} + 20px)` : baseStyle.paddingLeft,
          paddingRight: rightIcon ? `calc(${tokens.space.component.lg} + 20px)` : baseStyle.paddingRight,
        }}
        className={clsx('design-system-input', className)}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      
      {rightIcon && (
        <div style={{
          position: 'absolute',
          right: tokens.space.component.md,
          zIndex: 1,
          color: isFocused ? '#3b82f6' : '#9ca3af',
          transition: 'color 150ms ease-out',
          pointerEvents: 'none'
        }}>
          {rightIcon}
        </div>
      )}
    </div>
  );
}));

Input.displayName = 'Input';

// Search input variant with built-in search icon
export const SearchInput = memo(forwardRef((props, ref) => {
  const searchIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  );
  
  return (
    <Input
      ref={ref}
      type="search"
      leftIcon={searchIcon}
      placeholder="Search..."
      {...props}
    />
  );
}));

SearchInput.displayName = 'SearchInput';

// Textarea component with design system styles
export const Textarea = memo(forwardRef(({
  className,
  size = 'md', 
  variant = 'default',
  error,
  success,
  rows = 3,
  ...props
}, ref) => {
  const currentVariant = error ? 'error' : success ? 'success' : variant;
  
  const textareaStyle = {
    ...inputStyles.base,
    ...inputStyles.sizes[size],
    ...inputStyles.variants[currentVariant],
    minHeight: 'auto',
    resize: 'vertical',
    fontFamily: tokens.typography.text.body.fontFamily,
  };
  
  return (
    <textarea
      ref={ref}
      rows={rows}
      style={textareaStyle}
      className={clsx('design-system-textarea', className)}
      aria-invalid={error ? 'true' : undefined}
      {...props}
    />
  );
}));

Textarea.displayName = 'Textarea';

export default Input;