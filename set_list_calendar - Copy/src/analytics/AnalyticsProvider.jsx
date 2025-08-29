/**
 * Analytics Provider - Comprehensive User Behavior Tracking
 * Privacy-first analytics with performance metrics
 */

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { 
  initGA, 
  trackEvent as gaTrackEvent, 
  trackPageView as gaTrackPageView,
  trackComedyEvent,
  trackPerformance,
  trackFunnelStep,
  setUserProperties,
  trackError
} from './GoogleAnalytics';

// Analytics Context
const AnalyticsContext = createContext();

// Event Types
const ANALYTICS_EVENTS = {
  // User Actions
  JOKE_CREATED: 'joke_created',
  JOKE_EDITED: 'joke_edited',
  JOKE_DELETED: 'joke_deleted',
  JOKE_STATUS_CHANGED: 'joke_status_changed',
  
  // Setlist Actions  
  SETLIST_CREATED: 'setlist_created',
  SETLIST_EDITED: 'setlist_edited',
  JOKE_ADDED_TO_SETLIST: 'joke_added_to_setlist',
  JOKE_REMOVED_FROM_SETLIST: 'joke_removed_from_setlist',
  SETLIST_REORDERED: 'setlist_reordered',
  
  // Performance Tracking
  PERFORMANCE_MODE_ENTERED: 'performance_mode_entered',
  PERFORMANCE_COMPLETED: 'performance_completed',
  
  // Collaboration
  SETLIST_SHARED: 'setlist_shared',
  COMMENT_ADDED: 'comment_added',
  
  // Search & Discovery
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  
  // App Performance
  PAGE_LOAD: 'page_load',
  COMPONENT_ERROR: 'component_error',
  SLOW_OPERATION: 'slow_operation'
};

// Analytics Provider Component
export const AnalyticsProvider = ({ children, config = {} }) => {
  const sessionId = useRef(generateSessionId());
  const userId = useRef(null);
  const eventQueue = useRef([]);
  const batchTimer = useRef(null);
  
  // Configuration
  const analyticsConfig = {
    batchSize: 10,
    batchTimeout: 5000,
    enabled: import.meta.env.PROD,
    endpoint: '/api/analytics',
    ...config
  };

  // Initialize analytics
  useEffect(() => {
    // Initialize Google Analytics
    initGA();
    
    // Track page load
    trackEvent(ANALYTICS_EVENTS.PAGE_LOAD, {
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    });
    
    // Track funnel entry
    trackFunnelStep('app_loaded');

    // Performance observer
    if ('PerformanceObserver' in window) {
      const perfObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 100) {
            trackEvent(ANALYTICS_EVENTS.SLOW_OPERATION, {
              name: entry.name,
              duration: entry.duration,
              type: entry.entryType
            });
          }
        });
      });
      
      perfObserver.observe({ entryTypes: ['measure', 'navigation'] });
    }

    // Error tracking
    window.addEventListener('error', (event) => {
      trackEvent(ANALYTICS_EVENTS.COMPONENT_ERROR, {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      trackEvent(ANALYTICS_EVENTS.COMPONENT_ERROR, {
        message: 'Unhandled Promise Rejection',
        reason: event.reason?.toString(),
        stack: event.reason?.stack
      });
    });

    // Cleanup
    return () => {
      flushEvents();
    };
  }, []);

  // Generate unique session ID
  function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  // Track individual event
  const trackEvent = (eventName, properties = {}, options = {}) => {
    // Always track to Google Analytics (handles dev/prod internally)
    gaTrackEvent(eventName, 'app_interaction', properties.label || eventName, properties.value);
    
    // Also track comedy-specific events
    if (eventName.includes('joke_') || eventName.includes('setlist_') || eventName.includes('performance_')) {
      trackComedyEvent(eventName, properties);
    }
    
    if (!analyticsConfig.enabled) return;

    const event = {
      eventName,
      properties: {
        ...properties,
        sessionId: sessionId.current,
        userId: userId.current,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      },
      options
    };

    // Add to queue
    eventQueue.current.push(event);

    // Batch send
    if (eventQueue.current.length >= analyticsConfig.batchSize) {
      flushEvents();
    } else {
      // Set timer for batch send
      if (batchTimer.current) clearTimeout(batchTimer.current);
      batchTimer.current = setTimeout(flushEvents, analyticsConfig.batchTimeout);
    }
  };

  // Send events to analytics service
  const flushEvents = async () => {
    if (eventQueue.current.length === 0) return;

    const events = [...eventQueue.current];
    eventQueue.current = [];

    if (batchTimer.current) {
      clearTimeout(batchTimer.current);
      batchTimer.current = null;
    }

    try {
      await fetch(analyticsConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events,
          sessionId: sessionId.current,
          batchTimestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // Re-queue events for retry
      eventQueue.current.unshift(...events);
    }
  };

  // Set user ID
  const setUserId = (id) => {
    userId.current = id;
    setUserProperties({ user_id: id, user_type: 'authenticated' });
    trackEvent('user_identified', { userId: id });
  };

  // Page view tracking
  const trackPageView = (page, properties = {}) => {
    gaTrackPageView(page, properties.title);
    trackEvent('page_view', {
      page,
      ...properties
    });
  };

  // User timing events
  const startTiming = (name) => {
    performance.mark(`${name}_start`);
  };

  const endTiming = (name, properties = {}) => {
    performance.mark(`${name}_end`);
    performance.measure(name, `${name}_start`, `${name}_end`);
    
    const measurement = performance.getEntriesByName(name, 'measure')[0];
    trackEvent('timing', {
      name,
      duration: measurement.duration,
      ...properties
    });
    
    // Clean up marks
    performance.clearMarks(`${name}_start`);
    performance.clearMarks(`${name}_end`);
    performance.clearMeasures(name);
  };

  // A/B Test tracking
  const trackExperiment = (experimentName, variant, properties = {}) => {
    trackEvent('experiment_exposure', {
      experiment: experimentName,
      variant,
      ...properties
    });
  };

  // Funnel tracking
  const trackFunnelStep = (funnelName, stepName, stepIndex, properties = {}) => {
    trackEvent('funnel_step', {
      funnel: funnelName,
      step: stepName,
      stepIndex,
      ...properties
    });
  };

  // Context value
  const contextValue = {
    trackEvent,
    trackPageView,
    setUserId,
    startTiming,
    endTiming,
    trackExperiment,
    trackFunnelStep,
    flushEvents,
    EVENTS: ANALYTICS_EVENTS
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Hook for using analytics
export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
};

// HOC for automatic component tracking
export const withAnalytics = (Component, componentName) => {
  return React.forwardRef((props, ref) => {
    const { trackEvent, startTiming, endTiming } = useAnalytics();
    
    useEffect(() => {
      startTiming(`component_render_${componentName}`);
      
      return () => {
        endTiming(`component_render_${componentName}`, {
          component: componentName
        });
      };
    }, [componentName, startTiming, endTiming]);

    // Track component mount
    useEffect(() => {
      trackEvent('component_mounted', {
        component: componentName,
        props: Object.keys(props)
      });
    }, [componentName, trackEvent]);

    return <Component {...props} ref={ref} />;
  });
};

// Hook for tracking user interactions
export const useInteractionTracking = (elementType, elementId) => {
  const { trackEvent } = useAnalytics();
  
  const trackClick = (properties = {}) => {
    trackEvent('element_clicked', {
      elementType,
      elementId,
      ...properties
    });
  };
  
  const trackHover = (properties = {}) => {
    trackEvent('element_hovered', {
      elementType,
      elementId,
      ...properties
    });
  };
  
  const trackFocus = (properties = {}) => {
    trackEvent('element_focused', {
      elementType,
      elementId,
      ...properties
    });
  };

  return { trackClick, trackHover, trackFocus };
};

// Hook for tracking form interactions
export const useFormTracking = (formName) => {
  const { trackEvent } = useAnalytics();
  
  const trackFormStart = () => {
    trackEvent('form_started', { formName });
  };
  
  const trackFormSubmit = (success, errors = []) => {
    trackEvent('form_submitted', {
      formName,
      success,
      errors,
      errorCount: errors.length
    });
  };
  
  const trackFormError = (fieldName, errorMessage) => {
    trackEvent('form_error', {
      formName,
      fieldName,
      errorMessage
    });
  };
  
  const trackFieldEdit = (fieldName, value) => {
    trackEvent('form_field_edited', {
      formName,
      fieldName,
      valueLength: typeof value === 'string' ? value.length : undefined
    });
  };

  return {
    trackFormStart,
    trackFormSubmit,
    trackFormError,
    trackFieldEdit
  };
};

// Hook for performance monitoring
export const usePerformanceMonitoring = (componentName) => {
  const { trackEvent, startTiming, endTiming } = useAnalytics();
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  
  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;
    
    if (renderCount.current > 1 && timeSinceLastRender < 16) {
      trackEvent('component_frequent_renders', {
        component: componentName,
        renderCount: renderCount.current,
        timeSinceLastRender
      });
    }
  });
  
  const trackSlowOperation = (operationName, duration, details = {}) => {
    if (duration > 100) {
      trackEvent('slow_operation', {
        component: componentName,
        operation: operationName,
        duration,
        ...details
      });
    }
  };

  return { trackSlowOperation };
};

// A/B Testing Hook
export const useABTest = (experimentName, variants, defaultVariant) => {
  const { trackExperiment } = useAnalytics();
  const [variant, setVariant] = React.useState(defaultVariant);
  
  React.useEffect(() => {
    // Simple hash-based variant assignment (replace with proper A/B testing service)
    const userId = sessionStorage.getItem('userId') || 'anonymous';
    const hash = simpleHash(userId + experimentName);
    const selectedVariant = variants[hash % variants.length];
    
    setVariant(selectedVariant);
    trackExperiment(experimentName, selectedVariant);
  }, [experimentName, variants, trackExperiment]);
  
  return variant;
};

// Simple hash function for A/B testing
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}