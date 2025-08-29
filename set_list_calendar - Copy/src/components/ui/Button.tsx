/**
 * High-Performance Button Component
 * Google Material Design 3 + Custom Setlist Builder styling
 */

import React, { forwardRef, memo } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'
import { theme } from '../../styles/design-tokens.ts'

// Button variants using CVA (Class Variance Authority)
const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium text-sm leading-none',
    'border border-transparent',
    'transition-all duration-200 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    'relative overflow-hidden',
    'select-none touch-manipulation' // Performance optimizations
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-500 text-white border-primary-500',
          'hover:bg-primary-600 hover:border-primary-600',
          'focus:ring-primary-500',
          'active:bg-primary-700 active:scale-95'
        ],
        secondary: [
          'bg-neutral-800 text-neutral-100 border-neutral-700',
          'hover:bg-neutral-700 hover:border-neutral-600',
          'focus:ring-neutral-600',
          'active:bg-neutral-600 active:scale-95'
        ],
        outline: [
          'bg-transparent text-neutral-100 border-neutral-600',
          'hover:bg-neutral-800 hover:border-neutral-500',
          'focus:ring-neutral-600',
          'active:bg-neutral-700 active:scale-95'
        ],
        ghost: [
          'bg-transparent text-neutral-300 border-transparent',
          'hover:bg-neutral-800 hover:text-neutral-100',
          'focus:ring-neutral-600',
          'active:bg-neutral-700 active:scale-95'
        ],
        danger: [
          'bg-error-500 text-white border-error-500',
          'hover:bg-error-600 hover:border-error-600',
          'focus:ring-error-500',
          'active:bg-error-700 active:scale-95'
        ],
        success: [
          'bg-success-500 text-white border-success-500',
          'hover:bg-success-600 hover:border-success-600',
          'focus:ring-success-500',
          'active:bg-success-700 active:scale-95'
        ]
      },
      size: {
        xs: 'h-7 px-2 text-xs rounded-md',
        sm: 'h-8 px-3 text-sm rounded-md',
        md: 'h-10 px-4 text-sm rounded-lg',
        lg: 'h-11 px-6 text-base rounded-lg',
        xl: 'h-12 px-8 text-base rounded-xl'
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto'
      },
      loading: {
        true: 'cursor-wait',
        false: 'cursor-pointer'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      loading: false
    }
  }
)

// Loading spinner component
const LoadingSpinner = memo(() => (
  <svg 
    className="animate-spin h-4 w-4" 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
    role="img"
    aria-label="Loading"
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4"
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
))

LoadingSpinner.displayName = 'LoadingSpinner'

// Button Props Interface
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Loading state - shows spinner and disables interaction */
  loading?: boolean
  /** Icon to display before text */
  leftIcon?: React.ReactNode
  /** Icon to display after text */
  rightIcon?: React.ReactNode
  /** Custom class name */
  className?: string
  /** Children content */
  children?: React.ReactNode
  /** Tooltip text */
  tooltip?: string
}

// High-performance button component with memo
export const Button = memo(forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    fullWidth,
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    tooltip,
    onClick,
    ...props
  }, ref) => {
    
    // Handle click with loading state
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) {
        e.preventDefault()
        return
      }
      onClick?.(e)
    }, [loading, disabled, onClick])

    // Memoize button content to prevent unnecessary re-renders
    const buttonContent = React.useMemo(() => (
      <>
        {loading && <LoadingSpinner />}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children && <span className="truncate">{children}</span>}
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </>
    ), [loading, leftIcon, rightIcon, children])

    const buttonElement = (
      <button
        className={clsx(
          buttonVariants({ variant, size, fullWidth, loading }),
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {buttonContent}
      </button>
    )

    // Add tooltip if provided
    if (tooltip) {
      return (
        <div className="relative group">
          {buttonElement}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-neutral-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-tooltip">
            {tooltip}
          </div>
        </div>
      )
    }

    return buttonElement
  }
))

Button.displayName = 'Button'

// Pre-built button variants for common use cases
export const PrimaryButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="primary" {...props} />
))

export const SecondaryButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="secondary" {...props} />
))

export const DangerButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="danger" {...props} />
))

export const GhostButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="ghost" {...props} />
))

// Button group component for related actions
export interface ButtonGroupProps {
  children: React.ReactNode
  className?: string
  orientation?: 'horizontal' | 'vertical'
  spacing?: 'none' | 'sm' | 'md' | 'lg'
}

export const ButtonGroup = memo<ButtonGroupProps>(({
  children,
  className,
  orientation = 'horizontal',
  spacing = 'sm'
}) => {
  const spacingClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-3', 
    lg: 'gap-4'
  }

  return (
    <div
      className={clsx(
        'flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        spacingClasses[spacing],
        className
      )}
      role="group"
    >
      {children}
    </div>
  )
})

ButtonGroup.displayName = 'ButtonGroup'

export default Button