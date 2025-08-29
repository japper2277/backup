/**
 * Feature Flag Control Panel
 * Allows users to enable/disable Google Team performance enhancements
 * All features default to OFF to preserve existing functionality
 */
import React, { useState } from 'react'
import { useFeatureFlags, FeatureFlags } from '../../config/featureFlags'
import { Button } from '../ui/Button'

interface FeatureFlagPanelProps {
  className?: string
  showAdvanced?: boolean
}

export const FeatureFlagPanel: React.FC<FeatureFlagPanelProps> = ({
  className = '',
  showAdvanced = false
}) => {
  const { flags, enable, disable, toggle, reset } = useFeatureFlags()
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(showAdvanced)

  const handleToggle = (feature: keyof FeatureFlags) => {
    toggle(feature)
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all feature flags to defaults? This will disable all Google Team enhancements.')) {
      reset()
    }
  }

  const getFeatureDescription = (feature: keyof FeatureFlags): string => {
    const descriptions: Record<keyof FeatureFlags, string> = {
      virtualizedLists: 'High-performance lists for 1000+ jokes (may change current UI behavior)',
      performanceMonitoring: 'Real-time performance tracking and Core Web Vitals monitoring',
      advancedAnalytics: 'User behavior tracking and performance analytics',
      newDesignSystem: 'Google Material Design 3 inspired components (may change appearance)',
      webWorkers: 'Background processing for heavy operations',
      serviceWorker: 'Offline caching and background sync',
      offlineSupport: 'Full offline functionality',
      darkMode: 'Dark theme support',
      animations: 'Enhanced micro-interactions and transitions',
      accessibility: 'Advanced accessibility features and ARIA improvements'
    }
    return descriptions[feature]
  }

  const getFeatureStatus = (feature: keyof FeatureFlags): { color: string; text: string } => {
    const isEnabled = flags[feature]
    return {
      color: isEnabled ? 'text-green-600' : 'text-gray-500',
      text: isEnabled ? 'Enabled' : 'Disabled'
    }
  }

  const getFeatureIcon = (feature: keyof FeatureFlags): string => {
    const isEnabled = flags[feature]
    return isEnabled ? '✅' : '❌'
  }

  const renderFeatureToggle = (feature: keyof FeatureFlags, label: string) => {
    const status = getFeatureStatus(feature)
    const icon = getFeatureIcon(feature)
    const description = getFeatureDescription(feature)

    return (
      <div key={feature} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
        <div className="flex-shrink-0 mt-1">
          <span className="text-lg">{icon}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-900 cursor-pointer">
              {label}
            </label>
            <span className={`text-xs font-medium ${status.color}`}>
              {status.text}
            </span>
          </div>
          
          <p className="text-xs text-gray-600 mt-1">
            {description}
          </p>
        </div>
        
        <div className="flex-shrink-0">
          <Button
            variant={flags[feature] ? "secondary" : "primary"}
            size="sm"
            onClick={() => handleToggle(feature)}
            className="min-w-[80px]"
          >
            {flags[feature] ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`feature-flag-panel bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🎛️</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Feature Flags</h3>
            <p className="text-sm text-gray-500">
              Control Google Team performance enhancements
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
          >
            {showAdvancedFeatures ? 'Hide Advanced' : 'Show Advanced'}
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
          >
            🔄 Reset All
          </Button>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="p-4 bg-yellow-50 border-b border-yellow-200">
        <div className="flex items-start space-x-3">
          <div className="text-yellow-600 text-lg">⚠️</div>
          <div className="text-sm text-yellow-800">
            <strong>Important:</strong> All features default to OFF to preserve your existing React demo functionality. 
            Enable features one at a time and test thoroughly. Some features may change the appearance or behavior of your app.
          </div>
        </div>
      </div>

      {/* Performance Enhancements */}
      <div className="p-4">
        <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
          🚀 Performance Enhancements
        </h4>
        <div className="space-y-3">
          {renderFeatureToggle('virtualizedLists', 'Virtualized Lists')}
          {renderFeatureToggle('performanceMonitoring', 'Performance Monitoring')}
          {renderFeatureToggle('advancedAnalytics', 'Advanced Analytics')}
          {renderFeatureToggle('newDesignSystem', 'New Design System')}
        </div>
      </div>

      {/* Advanced Features */}
      {showAdvancedFeatures && (
        <div className="p-4 border-t border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
            🔬 Experimental Features
          </h4>
          <div className="space-y-3">
            {renderFeatureToggle('webWorkers', 'Web Workers')}
            {renderFeatureToggle('serviceWorker', 'Service Worker')}
            {renderFeatureToggle('offlineSupport', 'Offline Support')}
          </div>
        </div>
      )}

      {/* UI Enhancements */}
      {showAdvancedFeatures && (
        <div className="p-4 border-t border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
            🎨 UI Enhancements
          </h4>
          <div className="space-y-3">
            {renderFeatureToggle('darkMode', 'Dark Mode')}
            {renderFeatureToggle('animations', 'Enhanced Animations')}
            {renderFeatureToggle('accessibility', 'Accessibility Features')}
          </div>
        </div>
      )}

      {/* Current Status */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Enabled features: {Object.values(flags).filter(Boolean).length} / {Object.keys(flags).length}
          </span>
          
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              Object.values(flags).filter(Boolean).length === 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {Object.values(flags).filter(Boolean).length === 0 
                ? 'Original Demo Mode' 
                : 'Enhanced Mode'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          <p>💡 Tip: Enable features one at a time and test your app thoroughly</p>
          <p>🔄 Your React demo will continue working regardless of these settings</p>
        </div>
      </div>
    </div>
  )
}

export default FeatureFlagPanel



