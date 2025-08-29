/**
 * Card Component - Design System
 * Flexible content containers with Amy Park's design tokens
 */

import React, { forwardRef, memo } from 'react';
import { clsx } from 'clsx';
// Temporary fallback design tokens
const tokens = {
  typography: {
    text: {
      display: {
        fontWeight: 600,
        lineHeight: 1.25
      }
    },
    size: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem'
    },
    lineHeight: {
      relaxed: 1.625
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

// Card styles using design tokens
const cardStyles = {
  base: {
    // Layout
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    
    // Colors
    backgroundColor: 'var(--color-bg-tertiary)',
    borderColor: 'var(--color-border-primary)',
    
    // Border
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: 'var(--radius-lg)',
    
    // Shadow
    boxShadow: 'var(--shadow-sm)',
    
    // Interactions
    transition: `all var(--duration-normal) var(--easing-default)`,
    
    // Performance optimizations
    contain: 'layout',
    willChange: 'transform'
  },
  
  sizes: {
    sm: {
      padding: 'var(--card-padding-sm)',
      gap: tokens.space.component.sm,
    },
    md: {
      padding: 'var(--card-padding-md)',
      gap: 'var(--card-gap)',
    },
    lg: {
      padding: 'var(--card-padding-lg)',
      gap: tokens.space.component.lg,
    }
  },
  
  variants: {
    default: {},
    elevated: {
      boxShadow: 'var(--shadow-md)',
      backgroundColor: 'var(--color-bg-elevated)',
      
      '&:hover': {
        boxShadow: 'var(--shadow-lg)',
        transform: 'translateY(-2px)',
      }
    },
    interactive: {
      cursor: 'pointer',
      
      '&:hover': {
        borderColor: 'var(--color-border-accent)',
        boxShadow: 'var(--shadow-md)',
        transform: 'translateY(-1px)',
      },
      
      '&:active': {
        transform: 'translateY(0px)',
        boxShadow: 'var(--shadow-sm)',
      }
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: 'var(--color-border-accent)',
      boxShadow: 'none',
    }
  }
};

// Main Card component
export const Card = memo(forwardRef(({
  className,
  size = 'md',
  variant = 'default',
  padding,
  children,
  onClick,
  ...props
}, ref) => {
  const isInteractive = onClick || variant === 'interactive';
  const currentVariant = isInteractive && variant === 'default' ? 'interactive' : variant;
  
  const cardStyle = {
    ...cardStyles.base,
    ...cardStyles.sizes[size],
    ...cardStyles.variants[currentVariant],
    ...(padding && { padding })
  };
  
  const Element = onClick ? 'button' : 'div';
  
  return (
    <Element
      ref={ref}
      style={cardStyle}
      className={clsx('design-system-card', className)}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      {...props}
    >
      {children}
    </Element>
  );
}));

Card.displayName = 'Card';

// Card Header component
export const CardHeader = memo(({ className, children, ...props }) => (
  <div
    className={clsx('design-system-card-header', className)}
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: tokens.space.component.xs,
      marginBottom: tokens.space.component.sm,
    }}
    {...props}
  >
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

// Card Title component
export const CardTitle = memo(({ className, children, ...props }) => (
  <h3
    className={clsx('design-system-card-title', className)}
    style={{
      margin: 0,
      fontSize: tokens.typography.size.lg,
      fontWeight: tokens.typography.text.display.fontWeight,
      lineHeight: tokens.typography.text.display.lineHeight,
      color: 'var(--color-text-primary)',
    }}
    {...props}
  >
    {children}
  </h3>
));

CardTitle.displayName = 'CardTitle';

// Card Description component
export const CardDescription = memo(({ className, children, ...props }) => (
  <p
    className={clsx('design-system-card-description', className)}
    style={{
      margin: 0,
      fontSize: tokens.typography.size.sm,
      lineHeight: tokens.typography.lineHeight.relaxed,
      color: 'var(--color-text-secondary)',
    }}
    {...props}
  >
    {children}
  </p>
));

CardDescription.displayName = 'CardDescription';

// Card Content component
export const CardContent = memo(({ className, children, ...props }) => (
  <div
    className={clsx('design-system-card-content', className)}
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: tokens.space.component.sm,
    }}
    {...props}
  >
    {children}
  </div>
));

CardContent.displayName = 'CardContent';

// Card Footer component
export const CardFooter = memo(({ className, children, ...props }) => (
  <div
    className={clsx('design-system-card-footer', className)}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: tokens.space.component.sm,
      marginTop: tokens.space.component.sm,
      paddingTop: tokens.space.component.sm,
      borderTopWidth: '1px',
      borderTopStyle: 'solid',
      borderTopColor: 'var(--color-border-secondary)',
    }}
    {...props}
  >
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';

export default Card;