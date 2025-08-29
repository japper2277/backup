/**
 * Async Boundary - React 19 Concurrent Features
 * Optimized error boundaries with Suspense integration
 */

import React, { Suspense } from 'react';
import { AppSkeleton } from './SkeletonLoader';
import { css } from '@emotion/react';
import { theme } from '../../styles/theme';

// Error Boundary with React 19 features
class AsyncErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Report to analytics in production
    if (import.meta.env.PROD) {
      this.reportError(error, errorInfo);
    }
    
    // Safe error logging to prevent object-to-primitive conversion errors
    const errorMessage = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    const componentStack = errorInfo?.componentStack || 'No component stack available';
    console.error('AsyncBoundary caught error:', errorMessage, componentStack);
  }

  reportError = (error, errorInfo) => {
    // Analytics reporting would go here
    console.log('Reporting error:', { error: error.message, stack: errorInfo.componentStack });
  };

  retry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          retry={this.retry}
          retryCount={this.state.retryCount}
        />
      );
    }

    return this.props.children;
  }
}

// Modern error fallback UI
const ErrorFallback = ({ error, errorInfo, retry, retryCount }) => (
  <div css={css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: 2rem;
    text-align: center;
    background: ${theme.colors.surface};
    border-radius: 12px;
    border: 1px solid ${theme.colors.border};
  `}>
    {/* Error Icon */}
    <div css={css`
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.7;
    `}>
      ⚠️
    </div>
    
    {/* Error Message */}
    <h2 css={css`
      color: ${theme.colors.accent};
      margin: 0 0 1rem 0;
      font-size: 1.25rem;
    `}>
      Something went wrong
    </h2>
    
    <p css={css`
      color: ${theme.colors.text.secondary};
      margin-bottom: 2rem;
      max-width: 500px;
      line-height: 1.5;
    `}>
      {retryCount > 2 
        ? "The application is having persistent issues. Please refresh the page or try again later."
        : "An unexpected error occurred. This has been automatically reported."
      }
    </p>
    
    {/* Error Details (Development only) */}
    {import.meta.env.DEV && (
      <details css={css`
        margin-bottom: 2rem;
        text-align: left;
        max-width: 600px;
        width: 100%;
      `}>
        <summary css={css`
          cursor: pointer;
          color: ${theme.colors.accent};
          margin-bottom: 1rem;
        `}>
          Show Error Details
        </summary>
        <pre css={css`
          background: ${theme.colors.background};
          padding: 1rem;
          border-radius: 6px;
          overflow: auto;
          font-size: 0.8rem;
          color: ${theme.colors.text.secondary};
          border: 1px solid ${theme.colors.border};
        `}>
          {error?.stack || error?.message}
          {errorInfo?.componentStack}
        </pre>
      </details>
    )}
    
    {/* Action Buttons */}
    <div css={css`
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
    `}>
      {retryCount < 3 && (
        <button
          onClick={retry}
          css={css`
            background: ${theme.colors.accent};
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.2s;
            
            &:hover {
              background: ${theme.colors.accentDark};
            }
          `}
        >
          Try Again {retryCount > 0 && `(${retryCount}/3)`}
        </button>
      )}
      
      <button
        onClick={() => window.location.reload()}
        css={css`
          background: transparent;
          color: ${theme.colors.text.secondary};
          border: 1px solid ${theme.colors.border};
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          
          &:hover {
            border-color: ${theme.colors.accent};
            color: ${theme.colors.accent};
          }
        `}
      >
        Refresh Page
      </button>
    </div>
  </div>
);

// Suspense wrapper with loading states
export const AsyncBoundary = ({ 
  children, 
  fallback = <AppSkeleton />,
  errorFallback,
  name = "Component"
}) => (
  <AsyncErrorBoundary>
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  </AsyncErrorBoundary>
);

// HOC for wrapping components with async boundaries
export const withAsyncBoundary = (Component, options = {}) => {
  const WrappedComponent = React.forwardRef((props, ref) => (
    <AsyncBoundary {...options}>
      <Component {...props} ref={ref} />
    </AsyncBoundary>
  ));
  
  WrappedComponent.displayName = `withAsyncBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Resource preloader for React 19
export const ResourcePreloader = ({ resources = [] }) => {
  React.useEffect(() => {
    // Preload critical resources
    resources.forEach(resource => {
      if (resource.type === 'script') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.href = resource.url;
        document.head.appendChild(link);
      } else if (resource.type === 'style') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = resource.url;
        document.head.appendChild(link);
      }
    });
  }, [resources]);
  
  return null;
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 16) { // Longer than 1 frame at 60fps
        console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`);
      }
    };
  });
};