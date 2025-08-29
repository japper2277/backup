/**
 * Sentry Configuration for Production Error Tracking
 * REAL monitoring with live error reporting and performance tracking
 */

import * as Sentry from "@sentry/react";

// Always initialize Sentry for real monitoring
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const isDevelopment = import.meta.env.MODE === 'development';

export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.warn('⚠️ No Sentry DSN configured - error reporting disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    
    integrations: [
      new BrowserTracing({
        // Trace user interactions and API calls
        traceFetch: true,
        traceXHR: true,
        // Capture long tasks
        enableLongTask: true,
        // Network timing
        enableHttpTimings: true,
      }),
    ],
    
    // Capture 100% of errors in development, 25% in production
    tracesSampleRate: isDevelopment ? 1.0 : 0.25,
    
    // Release tracking
    release: `setlist-builder@${import.meta.env.VITE_APP_VERSION || 'dev'}`,
    
    // Enhanced context
    beforeSend(event) {
      // Add performance context
      const performanceEntries = performance.getEntriesByType('navigation');
      const navigationTiming = performanceEntries[0];
      
      event.contexts = {
        ...event.contexts,
        app: {
          name: 'Collaborative Setlist Builder',
          version: import.meta.env.VITE_APP_VERSION || 'development',
          build_time: new Date().toISOString()
        },
        performance: {
          page_load_time: navigationTiming?.loadEventEnd - navigationTiming?.fetchStart || 0,
          dom_content_loaded: navigationTiming?.domContentLoadedEventEnd - navigationTiming?.fetchStart || 0,
          connection_type: navigator?.connection?.effectiveType || 'unknown',
          memory_usage: performance?.memory?.usedJSHeapSize || 0
        }
      };
      
      return event;
    },
    
    // Production-grade error filtering
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      // Network errors that aren't actionable
      'Network request failed',
      'NetworkError when attempting to fetch resource',
      // ResizeObserver
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
    ],
    
    // Performance budgets
    beforeSendTransaction(event) {
      // Filter out transactions that are too fast (likely noise)
      if (event.contexts?.trace?.duration && event.contexts.trace.duration < 10) {
        return null;
      }
      return event;
    },
  });

  // Set user context
  const userId = localStorage.getItem('userId');
  if (userId) {
    Sentry.setUser({
      id: userId,
      subscription: localStorage.getItem('subscriptionTier') || 'free'
    });
  }

  console.log(`🔍 Sentry initialized: ${isDevelopment ? 'Development' : 'Production'} mode`);
};

// Enhanced error reporting with context
export const reportError = (error, context = {}) => {
  // Safe error logging to prevent object-to-primitive conversion errors
  const errorMessage = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  const contextString = JSON.stringify(context, null, 2);
  console.error('🚨 Error occurred:', errorMessage, contextString);
  
  Sentry.withScope((scope) => {
    // Add timestamp and user agent
    scope.setContext('error_details', {
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      url: window.location.href,
      ...context
    });
    
    // Add performance context
    if (performance.now) {
      scope.setContext('performance', {
        time_since_load: performance.now(),
        memory_usage: performance?.memory?.usedJSHeapSize || 0,
      });
    }
    
    // Add breadcrumbs for API errors
    if (context.apiEndpoint) {
      scope.addBreadcrumb({
        message: `API call failed: ${context.apiEndpoint}`,
        level: 'error',
        data: {
          endpoint: context.apiEndpoint,
          method: context.method || 'GET',
          status_code: context.statusCode,
        }
      });
    }
    
    Sentry.captureException(error);
  });
};

// API error reporting with structured data
export const reportAPIError = (error, endpoint, method = 'GET', requestData = null) => {
  // Safe error logging to prevent object-to-primitive conversion errors
  const errorMessage = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error(`🔌 API Error: ${method} ${endpoint}`, errorMessage);
  
  Sentry.withScope((scope) => {
    scope.setContext('api_call', {
      endpoint,
      method,
      request_data: requestData,
      timestamp: new Date().toISOString(),
      error_type: error.name || 'APIError',
      error_code: error.code || 'UNKNOWN'
    });
    
    scope.setTag('error_type', 'api_error');
    scope.setTag('api_endpoint', endpoint);
    
    Sentry.captureException(error);
  });
};

// Performance monitoring with real metrics
export const trackPerformance = (operation, duration, metadata = {}) => {
  console.log(`⚡ Performance: ${operation} took ${duration}ms`, metadata);
  
  Sentry.withScope((scope) => {
    scope.setContext('performance_metric', {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...metadata
    });
    
    scope.setTag('performance_operation', operation);
    
    // Only report slow operations to avoid noise
    if (duration > 100) {
      Sentry.captureMessage(`Slow operation: ${operation} (${duration}ms)`, 'warning');
    }
  });
};

// User action tracking
export const trackUserAction = (action, details = {}) => {
  Sentry.addBreadcrumb({
    message: `User action: ${action}`,
    level: 'info',
    category: 'user_interaction',
    data: {
      action,
      timestamp: new Date().toISOString(),
      ...details
    }
  });
};

// Create a transaction for performance monitoring
export const startTransaction = (name, op = 'navigation') => {
  const transaction = Sentry.startTransaction({
    name,
    op,
    description: `${op}: ${name}`
  });
  
  return {
    finish: (status = 'ok') => {
      transaction.setStatus(status);
      transaction.finish();
    },
    setTag: (key, value) => transaction.setTag(key, value),
    setData: (key, value) => transaction.setData(key, value)
  };
};

// Test function to verify Sentry integration
export const testSentryIntegration = () => {
  console.log('🧪 Testing Sentry integration...');
  
  // Test error reporting
  reportError(new Error('Sentry integration test error'), {
    test: true,
    component: 'sentry_config',
    user_initiated: true
  });
  
  // Test performance tracking
  trackPerformance('sentry_test', 123, { test: true });
  
  // Test user action
  trackUserAction('sentry_test_action', { test: true });
  
  console.log('✅ Sentry test completed - check your Sentry dashboard');
};

export { Sentry };