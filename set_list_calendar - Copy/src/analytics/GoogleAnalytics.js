/**
 * Google Analytics 4 Integration
 * Real user behavior tracking for production analytics
 */

// Using global gtag function loaded by Google Analytics script

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const isDevelopment = import.meta.env.MODE === 'development';

// Initialize Google Analytics
export const initGA = () => {
  if (isDevelopment || !GA_MEASUREMENT_ID) {
    console.log('🔍 Development mode: Google Analytics disabled, using console logging');
    return;
  }

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() { window.dataLayer.push(arguments); };
  
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: 'Collaborative Setlist Builder',
    page_location: window.location.href,
    custom_map: {
      custom_dimension_1: 'user_type',
      custom_dimension_2: 'feature_used'
    }
  });

  console.log('📊 Google Analytics 4 initialized:', GA_MEASUREMENT_ID);
};

// Track page views
export const trackPageView = (path, title = '') => {
  if (isDevelopment) {
    console.log('📄 Page View:', path, title);
    return;
  }
  
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'page_view', {
      page_title: title,
      page_location: `${window.location.origin}${path}`
    });
  }
};

// Track user interactions
export const trackEvent = (action, category = 'engagement', label = '', value = 0) => {
  if (isDevelopment) {
    console.log('🎯 Event:', { action, category, label, value });
    return;
  }
  
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      custom_dimension_2: category
    });
  }
};

// Track comedy-specific events
export const trackComedyEvent = (action, context = {}) => {
  const events = {
    'joke_added': { category: 'joke_management', label: context.jokeType || 'general' },
    'joke_edited': { category: 'joke_management', label: context.editType || 'content' },
    'joke_deleted': { category: 'joke_management', label: context.jokeType || 'general' },
    'joke_favorited': { category: 'joke_engagement', label: context.jokeType || 'general' },
    
    'setlist_created': { category: 'setlist_management', label: context.setlistType || 'general' },
    'setlist_shared': { category: 'collaboration', label: context.shareMethod || 'link' },
    'setlist_exported': { category: 'export', label: context.format || 'text' },
    
    'performance_logged': { category: 'performance_tracking', label: context.venue || 'unknown' },
    'venue_searched': { category: 'discovery', label: context.searchTerm || 'general' },
    
    'collaboration_joined': { category: 'collaboration', label: context.method || 'link' },
    'comment_added': { category: 'collaboration', label: 'setlist_comment' },
    
    'filter_applied': { category: 'user_experience', label: context.filterType || 'general' },
    'search_performed': { category: 'user_experience', label: context.searchType || 'general' }
  };

  const eventConfig = events[action] || { category: 'custom', label: action };
  
  trackEvent(action, eventConfig.category, eventConfig.label, context.value || 0);
};

// Track performance metrics
export const trackPerformance = (metric, value, context = {}) => {
  if (isDevelopment) {
    console.log('⚡ Performance:', { metric, value, context });
    return;
  }
  
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'performance_metric', {
      event_category: 'performance',
      event_label: metric,
      value: Math.round(value),
      custom_dimension_1: context.userType || 'anonymous',
      custom_dimension_2: 'performance'
    });
  }
};

// Track user funnel progression
export const trackFunnelStep = (step, context = {}) => {
  const funnelSteps = {
    'app_loaded': { category: 'funnel', label: 'step_1_app_loaded' },
    'first_interaction': { category: 'funnel', label: 'step_2_first_interaction' },
    'joke_created': { category: 'funnel', label: 'step_3_joke_created' },
    'setlist_created': { category: 'funnel', label: 'step_4_setlist_created' },
    'performance_logged': { category: 'funnel', label: 'step_5_performance_logged' },
    'user_registered': { category: 'funnel', label: 'step_6_user_registered' },
    'collaboration_used': { category: 'funnel', label: 'step_7_collaboration_used' }
  };

  const stepConfig = funnelSteps[step] || { category: 'funnel', label: step };
  
  trackEvent('funnel_progression', stepConfig.category, stepConfig.label, context.value || 0);
};

// Set user properties
export const setUserProperties = (properties) => {
  if (isDevelopment) {
    console.log('👤 User Properties:', properties);
    return;
  }
  
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', GA_MEASUREMENT_ID, {
      user_properties: properties
    });
  }
};

// Track errors (complementing Sentry)
export const trackError = (error, context = {}) => {
  if (isDevelopment) {
    console.log('🚨 Analytics Error:', error, context);
    return;
  }
  
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'exception', {
      description: error.message || error,
      fatal: context.fatal || false,
      custom_dimension_2: 'error'
    });
  }
};