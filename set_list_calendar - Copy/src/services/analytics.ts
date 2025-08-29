import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel with your project token
// Replace 'YOUR_PROJECT_TOKEN' with actual Mixpanel project token
const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || 'YOUR_PROJECT_TOKEN';

// Initialize Mixpanel
if (MIXPANEL_TOKEN && MIXPANEL_TOKEN !== 'YOUR_PROJECT_TOKEN') {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: import.meta.env.DEV,
    track_pageview: true,
    persistence: 'localStorage'
  });
  console.log('📊 Mixpanel analytics initialized');
} else {
  console.warn('⚠️ Mixpanel token not found. Analytics disabled.');
}

/**
 * Centralized tracking function
 * @param eventName - The name of the event to track
 * @param properties - Additional properties to send with the event
 */
export const trackEvent = (eventName: string, properties: Record<string, any> = {}) => {
  if (MIXPANEL_TOKEN && MIXPANEL_TOKEN !== 'YOUR_PROJECT_TOKEN') {
    // Add timestamp and environment to all events
    const eventData = {
      ...properties,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE,
      url: window.location.href,
      user_agent: navigator.userAgent
    };
    
    mixpanel.track(eventName, eventData);
    
    if (import.meta.env.DEV) {
      console.log('📊 Analytics Event:', eventName, eventData);
    }
  } else {
    // Development/fallback logging
    console.log('📊 [MOCK] Analytics Event:', eventName, properties);
  }
};

/**
 * Function to identify a user after they log in
 * @param userId - The unique user ID from Firebase Auth
 * @param userProperties - Additional user properties to set
 */
export const identifyUser = (userId: string, userProperties: Record<string, any> = {}) => {
  if (MIXPANEL_TOKEN && MIXPANEL_TOKEN !== 'YOUR_PROJECT_TOKEN') {
    mixpanel.identify(userId);
    
    // Set user properties
    const userData = {
      ...userProperties,
      $first_seen: new Date().toISOString(),
      environment: import.meta.env.MODE
    };
    
    mixpanel.people.set(userData);
    
    if (import.meta.env.DEV) {
      console.log('👤 User Identified:', userId, userData);
    }
  } else {
    console.log('👤 [MOCK] User Identified:', userId, userProperties);
  }
};

/**
 * Track page views
 * @param pageName - The name/path of the page
 */
export const trackPageView = (pageName: string) => {
  trackEvent('Page View', {
    page: pageName,
    referrer: document.referrer
  });
};

/**
 * Track user signup completion
 * @param method - The signup method used (email, google, etc.)
 * @param userId - The user ID from Firebase
 */
export const trackSignup = (method: string, userId: string) => {
  identifyUser(userId);
  trackEvent('Account Created', { 
    method,
    user_id: userId
  });
};

/**
 * Track setlist creation
 * @param setlistId - The ID of the created setlist
 */
export const trackSetlistCreated = (setlistId: string) => {
  trackEvent('Setlist Created', {
    setlist_id: setlistId
  });
};

/**
 * Track user activation (3 jokes in setlist)
 * @param setlistId - The setlist where activation occurred
 * @param jokeCount - The number of jokes in the setlist
 */
export const trackUserActivation = (setlistId: string, jokeCount: number) => {
  trackEvent('User Activated', {
    setlist_id: setlistId,
    joke_count: jokeCount,
    activation_milestone: 3
  });
};

/**
 * Track joke-related events
 */
export const trackJokeEvent = (action: string, jokeId?: string, additionalProps: Record<string, any> = {}) => {
  trackEvent(`Joke ${action}`, {
    joke_id: jokeId,
    ...additionalProps
  });
};

/**
 * Track collaboration events
 */
export const trackCollaborationEvent = (action: string, setlistId: string, additionalProps: Record<string, any> = {}) => {
  trackEvent(`Collaboration ${action}`, {
    setlist_id: setlistId,
    ...additionalProps
  });
};

/**
 * Track performance mode events
 */
export const trackPerformanceEvent = (action: string, setlistId: string, additionalProps: Record<string, any> = {}) => {
  trackEvent(`Performance ${action}`, {
    setlist_id: setlistId,
    ...additionalProps
  });
};

/**
 * Track errors for debugging
 */
export const trackError = (errorType: string, errorMessage: string, additionalProps: Record<string, any> = {}) => {
  trackEvent('Application Error', {
    error_type: errorType,
    error_message: errorMessage,
    ...additionalProps
  });
};

/**
 * Set user properties (for user profile updates)
 */
export const setUserProperties = (properties: Record<string, any>) => {
  if (MIXPANEL_TOKEN && MIXPANEL_TOKEN !== 'YOUR_PROJECT_TOKEN') {
    mixpanel.people.set(properties);
    
    if (import.meta.env.DEV) {
      console.log('👤 User Properties Set:', properties);
    }
  } else {
    console.log('👤 [MOCK] User Properties Set:', properties);
  }
};

// Export mixpanel instance for advanced usage if needed
export { mixpanel };