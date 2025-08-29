/**
 * Production-Grade Error Boundary
 * 
 * Google Team Requirements:
 * - NO DOM hijacking with innerHTML
 * - Proper React component lifecycle
 * - Integration with real monitoring service
 * - Graceful degradation without destroying app state
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Store error info for display and reporting
    this.setState({
      error,
      errorInfo
    })

    // Send to monitoring service (Sentry integration)
    this.reportErrorToService(error, errorInfo)
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Development logging - safe object logging to prevent primitive conversion errors
    if (import.meta.env.DEV) {
      console.group('🚨 React Error Boundary Caught Error')
      console.error('Error:', this.safeStringify(error))
      console.error('Error Info:', this.safeStringify(errorInfo))
      console.error('Component Stack:', errorInfo?.componentStack || 'No component stack available')
      console.groupEnd()
    }
  }

  private reportErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Import Sentry error reporting
    import('../config/sentry').then(({ reportError }) => {
      reportError(error, {
        errorBoundary: true,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getCurrentUserId(),
        buildVersion: import.meta.env.VITE_APP_VERSION || 'unknown'
      });
    }).catch(importError => {
      console.error('Failed to import Sentry error reporting:', importError);
    });
  }

  private getCurrentUserId = (): string | null => {
    // TODO: Get user ID from your auth context/store
    // For now, return null
    return null
  }

  private safeStringify = (obj: any): string => {
    try {
      if (obj === null || obj === undefined) {
        return String(obj)
      }
      
      // Handle Error objects specially
      if (obj instanceof Error) {
        return `${obj.name}: ${obj.message}`
      }
      
      // Handle objects with potential circular references
      if (typeof obj === 'object') {
        return JSON.stringify(obj, (key, value) => {
          // Prevent circular reference errors
          if (typeof value === 'object' && value !== null) {
            if (value instanceof Error) {
              return `${value.name}: ${value.message}`
            }
            // For other objects, just show the constructor name
            return `[${value.constructor.name}]`
          }
          return value
        }, 2)
      }
      
      return String(obj)
    } catch (stringifyError) {
      return `[Unable to stringify: ${typeof obj}]`
    }
  }


  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">
              <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
            </div>
            
            <h1 className="error-title">Something went wrong</h1>
            
            <p className="error-description">
              We've encountered an unexpected error. Our team has been notified and is working on a fix.
            </p>

            {/* Show error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Mode)</summary>
                <div className="error-stack">
                  <h4>Error Message:</h4>
                  <pre>{this.state.error.message}</pre>
                  
                  <h4>Stack Trace:</h4>
                  <pre>{this.state.error.stack}</pre>
                  
                  {this.state.errorInfo && (
                    <>
                      <h4>Component Stack:</h4>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="error-actions">
              <button 
                onClick={this.handleReset}
                className="error-button error-button-primary"
                type="button"
              >
                <i className="fas fa-redo" aria-hidden="true"></i>
                Try Again
              </button>
              
              <button 
                onClick={this.handleReload}
                className="error-button error-button-secondary"
                type="button"
              >
                <i className="fas fa-sync-alt" aria-hidden="true"></i>
                Reload Page
              </button>
            </div>

            <div className="error-footer">
              <p>
                If this problem persists, please{' '}
                <a 
                  href={`mailto:support@yourapp.com?subject=Error Report&body=${encodeURIComponent(`Error: ${this.state.error?.message}\nTimestamp: ${new Date().toISOString()}\nURL: ${window.location.href}`)}`}
                  className="error-contact-link"
                >
                  contact support
                </a>
              </p>
            </div>
          </div>

          <style>{`
            .error-boundary-container {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 2rem;
              background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
              color: #ffffff;
              font-family: Inter, system-ui, sans-serif;
            }

            .error-boundary-content {
              max-width: 600px;
              text-align: center;
              background: rgba(255, 255, 255, 0.05);
              backdrop-filter: blur(10px);
              border-radius: 16px;
              padding: 3rem;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
              border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .error-icon {
              font-size: 4rem;
              color: #ff6b6b;
              margin-bottom: 1.5rem;
            }

            .error-title {
              font-size: 2rem;
              font-weight: 600;
              margin-bottom: 1rem;
              color: #ffffff;
            }

            .error-description {
              font-size: 1.125rem;
              line-height: 1.6;
              margin-bottom: 2rem;
              color: #b3b3b3;
            }

            .error-details {
              margin: 2rem 0;
              text-align: left;
              background: rgba(0, 0, 0, 0.3);
              border-radius: 8px;
              padding: 1rem;
            }

            .error-details summary {
              cursor: pointer;
              font-weight: 500;
              margin-bottom: 1rem;
            }

            .error-stack {
              font-size: 0.875rem;
            }

            .error-stack h4 {
              margin: 1rem 0 0.5rem 0;
              color: #ff6b6b;
            }

            .error-stack pre {
              background: rgba(0, 0, 0, 0.5);
              padding: 0.75rem;
              border-radius: 4px;
              overflow-x: auto;
              font-family: 'JetBrains Mono', 'Courier New', monospace;
              font-size: 0.75rem;
              line-height: 1.4;
            }

            .error-actions {
              display: flex;
              gap: 1rem;
              justify-content: center;
              margin-bottom: 2rem;
              flex-wrap: wrap;
            }

            .error-button {
              display: inline-flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 8px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
              text-decoration: none;
              font-family: inherit;
            }

            .error-button-primary {
              background: #4CAF50;
              color: white;
            }

            .error-button-primary:hover {
              background: #45a049;
              transform: translateY(-1px);
            }

            .error-button-secondary {
              background: rgba(255, 255, 255, 0.1);
              color: white;
              border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .error-button-secondary:hover {
              background: rgba(255, 255, 255, 0.2);
              transform: translateY(-1px);
            }

            .error-footer {
              font-size: 0.875rem;
              color: #888;
            }

            .error-contact-link {
              color: #4CAF50;
              text-decoration: none;
            }

            .error-contact-link:hover {
              text-decoration: underline;
            }

            @media (max-width: 640px) {
              .error-boundary-content {
                padding: 2rem;
              }

              .error-actions {
                flex-direction: column;
              }

              .error-button {
                width: 100%;
                justify-content: center;
              }
            }
          `}</style>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary