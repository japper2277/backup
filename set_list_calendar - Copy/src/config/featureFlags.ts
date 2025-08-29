/**
 * Feature Flags - Google Team Performance Enhancements
 * Control which performance improvements are enabled
 * All flags default to false to preserve existing functionality
 */

import React from 'react'
export interface FeatureFlags {
  // Performance Enhancements
  virtualizedLists: boolean
  performanceMonitoring: boolean
  advancedAnalytics: boolean
  newDesignSystem: boolean
  
  // Experimental Features
  webWorkers: boolean
  serviceWorker: boolean
  offlineSupport: boolean
  
  // UI Enhancements
  darkMode: boolean
  animations: boolean
  accessibility: boolean
}

// Default configuration - preserves existing functionality
export const defaultFeatureFlags: FeatureFlags = {
  // Performance Enhancements
  virtualizedLists: false,        // Keep current joke lists
  performanceMonitoring: false,    // No performance tracking
  advancedAnalytics: false,       // No analytics
  newDesignSystem: false,         // Keep current styling
  
  // Experimental Features
  webWorkers: false,              // No background processing
  serviceWorker: false,           // No offline caching
  offlineSupport: false,          // No offline mode
  
  // UI Enhancements
  darkMode: false,                // Keep current theme
  animations: false,              // No new animations
  accessibility: false            // Keep current accessibility
}

// Environment-based overrides
const envFlags: Partial<FeatureFlags> = {
  // Enable performance monitoring in development
  ...(import.meta.env.DEV && {
    performanceMonitoring: true,
    advancedAnalytics: true
  }),
  
  // Enable virtualized lists if explicitly set
  ...(import.meta.env.VITE_ENABLE_VIRTUALIZATION === 'true' && {
    virtualizedLists: true
  }),
  
  // Enable new design system if explicitly set
  ...(import.meta.env.VITE_ENABLE_DESIGN_SYSTEM === 'true' && {
    newDesignSystem: true
  })
}

// Merge default flags with environment overrides
export const featureFlags: FeatureFlags = {
  ...defaultFeatureFlags,
  ...envFlags
}

// Feature flag hooks and utilities
export class FeatureFlagManager {
  private static instance: FeatureFlagManager
  private flags: FeatureFlags
  private listeners: Set<(flags: FeatureFlags) => void>

  private constructor() {
    this.flags = { ...featureFlags }
    this.listeners = new Set()
    
    // Load from localStorage if available
    this.loadFromStorage()
  }

  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager()
    }
    return FeatureFlagManager.instance
  }

  // Get current feature flags
  getFlags(): FeatureFlags {
    return { ...this.flags }
  }

  // Check if a specific feature is enabled
  isEnabled(feature: keyof FeatureFlags): boolean {
    return this.flags[feature] || false
  }

  // Enable a feature
  enable(feature: keyof FeatureFlags): void {
    if (this.flags[feature] !== true) {
      this.flags[feature] = true
      this.saveToStorage()
      this.notifyListeners()
    }
  }

  // Disable a feature
  disable(feature: keyof FeatureFlags): void {
    if (this.flags[feature] !== false) {
      this.flags[feature] = false
      this.saveToStorage()
      this.notifyListeners()
    }
  }

  // Toggle a feature
  toggle(feature: keyof FeatureFlags): void {
    this.flags[feature] = !this.flags[feature]
    this.saveToStorage()
    this.notifyListeners()
  }

  // Reset all flags to defaults
  reset(): void {
    this.flags = { ...defaultFeatureFlags }
    this.saveToStorage()
    this.notifyListeners()
  }

  // Subscribe to flag changes
  subscribe(listener: (flags: FeatureFlags) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Notify all listeners of flag changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getFlags()))
  }

  // Save flags to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem('setlist-feature-flags', JSON.stringify(this.flags))
    } catch (error) {
      console.warn('Failed to save feature flags to localStorage:', error)
    }
  }

  // Load flags from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('setlist-feature-flags')
      if (stored) {
        const parsed = JSON.parse(stored)
        this.flags = { ...this.flags, ...parsed }
      }
    } catch (error) {
      console.warn('Failed to load feature flags from localStorage:', error)
    }
  }
}

// React hook for using feature flags
export const useFeatureFlags = () => {
  const [flags, setFlags] = React.useState<FeatureFlags>(() => {
    const manager = FeatureFlagManager.getInstance()
    return manager.getFlags()
  })
  
  React.useEffect(() => {
    const manager = FeatureFlagManager.getInstance()
    const unsubscribe = manager.subscribe(setFlags)
    return unsubscribe
  }, [])
  
  const manager = FeatureFlagManager.getInstance()
  
  return {
    flags,
    isEnabled: manager.isEnabled.bind(manager),
    enable: manager.enable.bind(manager),
    disable: manager.disable.bind(manager),
    toggle: manager.toggle.bind(manager),
    reset: manager.reset.bind(manager)
  }
}

// Note: JSX utility functions moved to separate file to avoid TS/JSX conflicts

// Export default instance
export default FeatureFlagManager.getInstance()



