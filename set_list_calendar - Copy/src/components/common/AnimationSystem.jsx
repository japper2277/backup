/**
 * Animation System - Delightful Micro-Interactions
 * Hardware-accelerated animations with accessibility support
 */

import React from 'react';
import { css, keyframes } from '@emotion/react';
import { useAccessibility } from './AccessibilityProvider';

// Base Animation Keyframes
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const bounceIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
`;

// Animation Components
export const FadeIn = ({ 
  children, 
  delay = 0, 
  duration = 0.3,
  className = '',
  ...props 
}) => {
  const { reducedMotion } = useAccessibility();
  
  const animationStyle = css`
    animation: ${reducedMotion ? 'none' : `${fadeIn} ${duration}s ease-out ${delay}s both`};
  `;

  return (
    <div css={animationStyle} className={className} {...props}>
      {children}
    </div>
  );
};

export const SlideIn = ({ 
  children, 
  direction = 'left',
  delay = 0, 
  duration = 0.3,
  className = '',
  ...props 
}) => {
  const { reducedMotion } = useAccessibility();
  const animation = direction === 'left' ? slideInLeft : slideInRight;
  
  const animationStyle = css`
    animation: ${reducedMotion ? 'none' : `${animation} ${duration}s ease-out ${delay}s both`};
  `;

  return (
    <div css={animationStyle} className={className} {...props}>
      {children}
    </div>
  );
};

export const ScaleIn = ({ 
  children, 
  delay = 0, 
  duration = 0.2,
  className = '',
  ...props 
}) => {
  const { reducedMotion } = useAccessibility();
  
  const animationStyle = css`
    animation: ${reducedMotion ? 'none' : `${scaleIn} ${duration}s ease-out ${delay}s both`};
  `;

  return (
    <div css={animationStyle} className={className} {...props}>
      {children}
    </div>
  );
};

export const BounceIn = ({ 
  children, 
  delay = 0, 
  duration = 0.6,
  className = '',
  ...props 
}) => {
  const { reducedMotion } = useAccessibility();
  
  const animationStyle = css`
    animation: ${reducedMotion ? 'none' : `${bounceIn} ${duration}s ease-out ${delay}s both`};
  `;

  return (
    <div css={animationStyle} className={className} {...props}>
      {children}
    </div>
  );
};

// Staggered Animation Container
export const StaggeredContainer = ({ 
  children, 
  staggerDelay = 0.1,
  animation = 'fadeIn'
}) => {
  const animationMap = {
    fadeIn: FadeIn,
    slideLeft: (props) => <SlideIn direction="left" {...props} />,
    slideRight: (props) => <SlideIn direction="right" {...props} />,
    scaleIn: ScaleIn,
    bounceIn: BounceIn
  };
  
  const AnimationComponent = animationMap[animation] || FadeIn;
  
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <AnimationComponent delay={index * staggerDelay} key={index}>
          {child}
        </AnimationComponent>
      ))}
    </>
  );
};

// Interactive Button Animations
export const AnimatedButton = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  ...props 
}) => {
  const { reducedMotion } = useAccessibility();
  const [isPressed, setIsPressed] = React.useState(false);
  
  const buttonStyle = css`
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    border: none;
    cursor: ${disabled ? 'not-allowed' : 'pointer'};
    transition: ${reducedMotion ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'};
    transform: ${isPressed && !reducedMotion ? 'translateY(1px)' : 'translateY(0)'};
    box-shadow: ${isPressed ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'};
    
    ${!reducedMotion && `
      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }
      
      &:active {
        transform: translateY(0);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
    `}
    
    &:focus-visible {
      outline: 2px solid #45a3ff;
      outline-offset: 2px;
    }
    
    &:disabled {
      opacity: 0.5;
      transform: none !important;
      box-shadow: none !important;
    }
  `;
  
  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);
  
  return (
    <button
      css={buttonStyle}
      className={className}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
      {!reducedMotion && <ButtonRipple />}
    </button>
  );
};

// Ripple Effect Component
const ButtonRipple = () => {
  const [ripples, setRipples] = React.useState([]);
  
  const createRipple = React.useCallback((event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    const newRipple = { x, y, size, id: Date.now() };
    
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  }, []);
  
  React.useEffect(() => {
    const button = document.querySelector('[data-ripple]');
    if (button) {
      button.addEventListener('click', createRipple);
      return () => button.removeEventListener('click', createRipple);
    }
  }, [createRipple]);
  
  const rippleKeyframes = keyframes`
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(4);
      opacity: 0;
    }
  `;
  
  return (
    <>
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          css={css`
            position: absolute;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.3);
            width: ${ripple.size}px;
            height: ${ripple.size}px;
            left: ${ripple.x}px;
            top: ${ripple.y}px;
            animation: ${rippleKeyframes} 0.6s linear;
            pointer-events: none;
          `}
        />
      ))}
    </>
  );
};

// Loading Spinner
export const LoadingSpinner = ({ 
  size = 'md', 
  color = '#45a3ff',
  className = '' 
}) => {
  const { reducedMotion } = useAccessibility();
  
  const sizes = {
    sm: '16px',
    md: '24px',
    lg: '32px'
  };
  
  const spinKeyframes = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  `;
  
  const spinnerStyle = css`
    width: ${sizes[size]};
    height: ${sizes[size]};
    border: 2px solid transparent;
    border-top: 2px solid ${color};
    border-radius: 50%;
    animation: ${reducedMotion ? 'none' : `${spinKeyframes} 1s linear infinite`};
  `;
  
  return <div css={spinnerStyle} className={className} aria-label="Loading..." />;
};

// Card Hover Animation
export const AnimatedCard = ({ 
  children, 
  className = '',
  onClick,
  ...props 
}) => {
  const { reducedMotion } = useAccessibility();
  const [isHovered, setIsHovered] = React.useState(false);
  
  const cardStyle = css`
    transition: ${reducedMotion ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'};
    cursor: ${onClick ? 'pointer' : 'default'};
    
    ${!reducedMotion && `
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      }
    `}
  `;
  
  return (
    <div
      css={cardStyle}
      className={className}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
    </div>
  );
};

// Drag Animation Hook
export const useDragAnimation = () => {
  const { reducedMotion } = useAccessibility();
  
  const dragStyle = React.useMemo(() => css`
    cursor: grab;
    transition: ${reducedMotion ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease'};
    
    &:active {
      cursor: grabbing;
      ${!reducedMotion && `
        transform: rotate(2deg) scale(1.02);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        z-index: 1000;
      `}
    }
    
    &.dragging {
      opacity: 0.8;
      ${!reducedMotion && `
        transform: rotate(5deg);
        transition: none;
      `}
    }
  `, [reducedMotion]);
  
  return { dragStyle };
};

// Status Change Animation
export const StatusTransition = ({ 
  children, 
  status, 
  previousStatus,
  className = '' 
}) => {
  const { reducedMotion } = useAccessibility();
  const [isAnimating, setIsAnimating] = React.useState(false);
  
  React.useEffect(() => {
    if (status !== previousStatus && previousStatus) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [status, previousStatus]);
  
  const statusStyle = css`
    ${isAnimating && !reducedMotion && `
      animation: ${bounceIn} 0.6s ease-out;
    `}
  `;
  
  return (
    <div css={statusStyle} className={className}>
      {children}
    </div>
  );
};

// Success/Error Toast Animations
export const ToastAnimation = ({ 
  children, 
  type = 'info',
  isVisible,
  onClose 
}) => {
  const { reducedMotion } = useAccessibility();
  
  const slideInDown = keyframes`
    from {
      opacity: 0;
      transform: translateY(-100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  
  const slideOutUp = keyframes`
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-100%);
    }
  `;
  
  const toastStyle = css`
    animation: ${reducedMotion ? 'none' : 
      isVisible ? `${slideInDown} 0.3s ease-out` : `${slideOutUp} 0.3s ease-in`
    };
  `;
  
  if (!isVisible && !reducedMotion) {
    setTimeout(onClose, 300);
  }
  
  return (
    <div css={toastStyle}>
      {children}
    </div>
  );
};