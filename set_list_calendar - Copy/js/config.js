// Configuration Module - Environment variables and feature flags
// This module provides a centralized configuration system for the application

/**
 * Environment Configuration
 * Uses Vite environment variables with fallback defaults
 * Fallback to window.ENV_CONFIG for non-Vite environments
 */
const getEnvVar = (key, defaultValue) => {
    try {
        return import.meta.env[key] || defaultValue;
    } catch (e) {
        // Fallback for non-Vite environments
        return (window.ENV_CONFIG && window.ENV_CONFIG[key]) || defaultValue;
    }
};

const DEFAULT_CONFIG = {
    // Environment
    NODE_ENV: getEnvVar('VITE_NODE_ENV', 'development'),
    VERSION: getEnvVar('VITE_VERSION', '2.0.0'),
    
    // API Configuration (for future backend integration)
    API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'https://api.micfinderapp.com'),
    API_TIMEOUT: 10000,
    
    // External Services
    CSV_DATA_URL: getEnvVar('VITE_CSV_DATA_URL', './coordinates.csv'),
    FEEDBACK_EMAIL: getEnvVar('VITE_FEEDBACK_EMAIL', 'support@micfinderapp.com'),
    
    // Feature Flags
    FEATURES: {
        ONBOARDING: getEnvVar('VITE_FEATURE_ONBOARDING', 'true') !== 'false',
        MIC_FINDER: getEnvVar('VITE_FEATURE_MIC_FINDER', 'true') !== 'false',
        STATS_CHARTS: getEnvVar('VITE_FEATURE_STATS_CHARTS', 'true') !== 'false',
        SETLIST_BUILDER: getEnvVar('VITE_FEATURE_SETLIST_BUILDER', 'true') !== 'false',
        DATA_EXPORT: getEnvVar('VITE_FEATURE_DATA_EXPORT', 'true') !== 'false',
        KEYBOARD_SHORTCUTS: getEnvVar('VITE_FEATURE_KEYBOARD_SHORTCUTS', 'true') !== 'false',
        COLLABORATION: getEnvVar('VITE_FEATURE_COLLABORATION', 'false') === 'true',
        OFFLINE_MODE: getEnvVar('VITE_FEATURE_OFFLINE_MODE', 'false') === 'true',
        ANALYTICS: getEnvVar('VITE_FEATURE_ANALYTICS', 'false') === 'true',
        PUSH_NOTIFICATIONS: getEnvVar('VITE_FEATURE_PUSH_NOTIFICATIONS', 'false') === 'true'
    },
    
    // Performance Settings
    PERFORMANCE: {
        CHART_ANIMATION_DURATION: parseInt(getEnvVar('VITE_CHART_ANIMATION_DURATION', '750')),
        NOTIFICATION_DURATION: parseInt(getEnvVar('VITE_NOTIFICATION_DURATION', '3000')),
        DEBOUNCE_DELAY: parseInt(getEnvVar('VITE_DEBOUNCE_DELAY', '300')),
        MAX_EVENTS_PER_DAY: 10,
        MAX_SAVED_SETLISTS: 50
    },
    
    // UI Configuration
    UI: {
        DEFAULT_VIEW: 'week',
        DEFAULT_THEME: 'dark',
        MOBILE_BREAKPOINT: 768,
        MODAL_ANIMATION_DURATION: 200,
        TOAST_POSITION: 'top-right'
    },
    
    // Data Configuration
    DATA: {
        STORAGE_KEY_PREFIX: 'micCalendar',
        AUTO_SAVE: true,
        BACKUP_FREQUENCY: 24 * 60 * 60 * 1000, // 24 hours in ms
        MAX_STORAGE_SIZE: 5 * 1024 * 1024 // 5MB
    },
    
    // Development/Debug Settings
    DEBUG: {
        ENABLED: getEnvVar('VITE_DEBUG_ENABLED', 'false') === 'true',
        LOG_LEVEL: getEnvVar('VITE_LOG_LEVEL', 'info'),
        SHOW_PERFORMANCE_METRICS: getEnvVar('VITE_SHOW_PERFORMANCE_METRICS', 'false') === 'true',
        MOCK_API_DELAY: 500
    }
};

/**
 * Configuration class that manages environment variables and feature flags
 */
class Config {
    constructor() {
        // Merge default config with any environment overrides
        this.config = this.mergeConfig(DEFAULT_CONFIG, window.ENV_CONFIG || {});
        
        // Set debug mode based on environment
        if (this.config.NODE_ENV === 'development') {
            this.config.DEBUG.ENABLED = true;
            this.config.DEBUG.SHOW_PERFORMANCE_METRICS = true;
        }
        
        // Initialize logger
        this.initializeLogger();
        
        this.log('info', 'Configuration initialized', this.config);
    }
    
    /**
     * Deep merge configuration objects
     */
    mergeConfig(defaultConfig, overrides) {
        const result = { ...defaultConfig };
        
        for (const key in overrides) {
            if (overrides[key] && typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
                result[key] = this.mergeConfig(result[key] || {}, overrides[key]);
            } else {
                result[key] = overrides[key];
            }
        }
        
        return result;
    }
    
    /**
     * Initialize logging based on configuration
     */
    initializeLogger() {
        const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = logLevels[this.config.DEBUG.LOG_LEVEL] || 1;
        
        this.logger = {
            debug: currentLevel <= 0 ? console.debug.bind(console, '[MIC-CAL DEBUG]') : () => {},
            info: currentLevel <= 1 ? console.info.bind(console, '[MIC-CAL INFO]') : () => {},
            warn: currentLevel <= 2 ? console.warn.bind(console, '[MIC-CAL WARN]') : () => {},
            error: currentLevel <= 3 ? console.error.bind(console, '[MIC-CAL ERROR]') : () => {}
        };
    }
    
    /**
     * Get a configuration value by path (dot notation supported)
     * @param {string} path - Configuration path (e.g., 'FEATURES.ONBOARDING')
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Configuration value
     */
    get(path, defaultValue = undefined) {
        const keys = path.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                this.log('warn', `Configuration path not found: ${path}`);
                return defaultValue;
            }
        }
        
        return value;
    }
    
    /**
     * Set a configuration value by path
     * @param {string} path - Configuration path
     * @param {*} value - Value to set
     */
    set(path, value) {
        const keys = path.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
        this.log('info', `Configuration updated: ${path} = ${value}`);
    }
    
    /**
     * Check if a feature is enabled
     * @param {string} featureName - Feature name
     * @returns {boolean} Feature enabled status
     */
    isFeatureEnabled(featureName) {
        return this.get(`FEATURES.${featureName}`, false);
    }
    
    /**
     * Enable or disable a feature
     * @param {string} featureName - Feature name
     * @param {boolean} enabled - Enable/disable flag
     */
    setFeature(featureName, enabled) {
        this.set(`FEATURES.${featureName}`, enabled);
        
        // Emit custom event for feature toggle
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('featureToggle', {
                detail: { feature: featureName, enabled }
            }));
        }
    }
    
    /**
     * Get all enabled features
     * @returns {string[]} Array of enabled feature names
     */
    getEnabledFeatures() {
        const features = this.get('FEATURES', {});
        return Object.keys(features).filter(key => features[key]);
    }
    
    /**
     * Check if we're in development mode
     * @returns {boolean} Development mode status
     */
    isDevelopment() {
        return this.get('NODE_ENV') === 'development';
    }
    
    /**
     * Check if we're in production mode
     * @returns {boolean} Production mode status
     */
    isProduction() {
        return this.get('NODE_ENV') === 'production';
    }
    
    /**
     * Get API endpoint URL
     * @param {string} endpoint - API endpoint path
     * @returns {string} Full API URL
     */
    getApiUrl(endpoint = '') {
        const baseUrl = this.get('API_BASE_URL');
        return endpoint ? `${baseUrl}/${endpoint.replace(/^\//, '')}` : baseUrl;
    }
    
    /**
     * Log a message if debug is enabled
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {*} data - Additional data
     */
    log(level, message, data = null) {
        if (this.config.DEBUG.ENABLED && this.logger) {
            if (data) {
                this.logger[level](message, data);
            } else {
                this.logger[level](message);
            }
        }
    }
    
    /**
     * Measure performance if enabled
     * @param {string} label - Performance label
     * @param {Function} fn - Function to measure
     * @returns {*} Function result
     */
    async measurePerformance(label, fn) {
        if (!this.get('DEBUG.SHOW_PERFORMANCE_METRICS')) {
            return await fn();
        }
        
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        
        this.log('debug', `Performance [${label}]: ${(end - start).toFixed(2)}ms`);
        return result;
    }
    
    /**
     * Create a debounced function
     * @param {Function} fn - Function to debounce
     * @param {number} delay - Delay in milliseconds (optional, uses config default)
     * @returns {Function} Debounced function
     */
    debounce(fn, delay = null) {
        const debounceDelay = delay || this.get('PERFORMANCE.DEBOUNCE_DELAY');
        let timeoutId;
        
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), debounceDelay);
        };
    }
    
    /**
     * Export current configuration (for debugging)
     * @returns {Object} Current configuration
     */
    exportConfig() {
        return JSON.parse(JSON.stringify(this.config));
    }
    
    /**
     * Validate configuration
     * @returns {Object} Validation results
     */
    validate() {
        const errors = [];
        const warnings = [];
        
        // Check required settings
        if (!this.get('CSV_DATA_URL')) {
            errors.push('CSV_DATA_URL is required');
        }
        
        // Check performance settings
        const maxEvents = this.get('PERFORMANCE.MAX_EVENTS_PER_DAY');
        if (maxEvents < 1 || maxEvents > 100) {
            warnings.push('MAX_EVENTS_PER_DAY should be between 1 and 100');
        }
        
        // Check storage size
        const maxStorage = this.get('DATA.MAX_STORAGE_SIZE');
        if (maxStorage < 1024 * 1024) { // 1MB
            warnings.push('MAX_STORAGE_SIZE might be too small');
        }
        
        return { errors, warnings, valid: errors.length === 0 };
    }
}

// Create singleton instance
const config = new Config();

// Export the config instance and specific utilities
export default config;
export { Config };

// Make config available globally for debugging
if (typeof window !== 'undefined') {
    window.micCalendarConfig = config;
}

// Environment-specific initialization
if (config.isDevelopment()) {
    console.log('🎭 Mic Calendar - Development Mode');
    console.log('Config validation:', config.validate());
    console.log('Enabled features:', config.getEnabledFeatures());
}
