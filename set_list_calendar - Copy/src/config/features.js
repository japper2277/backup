/**
 * Real Feature Flag System - Environment Based Configuration
 * Features are controlled via environment variables, not hardcoded constants
 * 
 * Usage in .env files:
 * VITE_FF_PERFORMANCE_MODE=true
 * VITE_FF_DEBUG_MODE=false
 */

// Environment-based feature flag evaluation
const getFeatureFlag = (flagName, defaultValue = false) => {
  const envKey = `VITE_FF_${flagName.toUpperCase()}`;
  const envValue = import.meta.env[envKey];
  
  if (envValue === undefined) {
    return defaultValue;
  }
  
  // Handle boolean conversion
  if (envValue === 'true') return true;
  if (envValue === 'false') return false;
  
  // Handle other types if needed
  return envValue;
};

// Feature flag definitions with fallbacks
export const features = {
  // Performance improvements
  performanceMode: getFeatureFlag('performance_mode', true),
  debounceSearch: getFeatureFlag('debounce_search', true),
  virtualizedLists: getFeatureFlag('virtualized_lists', false),
  
  // UI enhancements  
  newDesignSystem: getFeatureFlag('new_design_system', true),
  darkModeToggle: getFeatureFlag('dark_mode_toggle', true),
  
  // Analytics & Monitoring
  advancedAnalytics: getFeatureFlag('advanced_analytics', true),
  performanceTracking: getFeatureFlag('performance_tracking', true),
  
  // Development & Debug
  debugMode: getFeatureFlag('debug_mode', import.meta.env.DEV),
  showPerformancePanel: getFeatureFlag('show_performance_panel', import.meta.env.DEV),
  verboseLogging: getFeatureFlag('verbose_logging', import.meta.env.DEV),
  
  // Business Features
  collaboration: getFeatureFlag('collaboration', true),
  realTimeSync: getFeatureFlag('real_time_sync', true),
  offlineMode: getFeatureFlag('offline_mode', true),
  pushNotifications: getFeatureFlag('push_notifications', false),
  
  // Experimental
  aiJokeSuggestions: getFeatureFlag('ai_joke_suggestions', false),
  voiceRecording: getFeatureFlag('voice_recording', false),
  advancedSearch: getFeatureFlag('advanced_search', false)
};

// Helper to check if feature is enabled
export const isFeatureEnabled = (feature) => {
  const enabled = features[feature];
  
  // Log feature flag access in development
  if (import.meta.env.DEV && features.verboseLogging) {
    console.log(`🚩 Feature flag: ${feature} = ${enabled}`);
  }
  
  return Boolean(enabled);
};

// Helper to get feature flag value (for non-boolean flags)
export const getFeatureValue = (feature) => {
  return features[feature];
};

// Helper to check multiple features at once
export const hasAllFeatures = (...featureNames) => {
  return featureNames.every(feature => isFeatureEnabled(feature));
};

export const hasAnyFeature = (...featureNames) => {
  return featureNames.some(feature => isFeatureEnabled(feature));
};