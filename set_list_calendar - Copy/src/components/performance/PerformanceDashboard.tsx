/**
 * Performance Dashboard - Google Team Standards
 * Real-time monitoring of Core Web Vitals and custom performance metrics
 */
import React, { useState, useEffect, useCallback } from 'react'
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor'
import { useAnalytics } from '../../analytics/AnalyticsProvider'
import { Button } from '../ui/Button'

interface PerformanceDashboardProps {
  className?: string
  showDetails?: boolean
  autoRefresh?: boolean
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  className = '',
  showDetails = false,
  autoRefresh = true
}) => {
  const [isExpanded, setIsExpanded] = useState(showDetails)
  const [refreshKey, setRefreshKey] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  
  const {
    getPerformanceSummary,
    checkPerformanceBudget,
    metrics
  } = usePerformanceMonitor()
  
  const { track } = useAnalytics()

  // Auto-refresh performance data
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1)
      setLastUpdate(new Date())
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  // Get current performance data
  const performanceData = getPerformanceSummary()
  const warnings = checkPerformanceBudget()

  // Format performance values
  const formatMetric = (value: number | null, unit: string = 'ms') => {
    if (value === null) return 'N/A'
    return `${value.toFixed(1)}${unit}`
  }

  const formatScore = (value: number | null) => {
    if (value === null) return 'N/A'
    if (value >= 90) return '🟢 Excellent'
    if (value >= 70) return '🟡 Good'
    if (value >= 50) return '🟠 Needs Improvement'
    return '🔴 Poor'
  }

  // Calculate performance score
  const calculateScore = useCallback(() => {
    let score = 100
    
    // Core Web Vitals scoring
    if (performanceData.coreWebVitals.fcp && performanceData.coreWebVitals.fcp > 1800) score -= 15
    if (performanceData.coreWebVitals.lcp && performanceData.coreWebVitals.lcp > 2500) score -= 20
    if (performanceData.coreWebVitals.fid && performanceData.coreWebVitals.fid > 100) score -= 20
    if (performanceData.coreWebVitals.cls && performanceData.coreWebVitals.cls > 0.1) score -= 15
    
    // Custom metrics scoring
    if (performanceData.customMetrics.jokeRenderTime.p95 > 16) score -= 10
    if (performanceData.customMetrics.setlistUpdateTime.p95 > 50) score -= 10
    
    return Math.max(score, 0)
  }, [performanceData])

  const performanceScore = calculateScore()

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
    setLastUpdate(new Date())
    track('performance_dashboard_refresh', { timestamp: Date.now() })
  }, [track])

  // Handle export performance data
  const handleExport = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      performance: performanceData,
      score: performanceScore,
      warnings
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    track('performance_data_exported', { timestamp: Date.now() })
  }, [performanceData, performanceScore, warnings, track])

  return (
    <div className={`performance-dashboard bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">📊</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Performance Dashboard</h3>
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
          >
            🔄 Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '📉' : '📈'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExport}
          >
            📥 Export
          </Button>
        </div>
      </div>

      {/* Performance Score */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {performanceScore}/100
          </div>
          <div className="text-lg text-gray-600 mb-2">
            {formatScore(performanceScore)}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                performanceScore >= 90 ? 'bg-green-500' :
                performanceScore >= 70 ? 'bg-yellow-500' :
                performanceScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${performanceScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="p-4">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Core Web Vitals</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">FCP</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatMetric(performanceData.coreWebVitals.fcp)}
            </div>
            <div className="text-xs text-gray-500">Target: &lt;1800ms</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">LCP</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatMetric(performanceData.coreWebVitals.lcp)}
            </div>
            <div className="text-xs text-gray-500">Target: &lt;2500ms</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">FID</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatMetric(performanceData.coreWebVitals.fid)}
            </div>
            <div className="text-xs text-gray-500">Target: &lt;100ms</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">CLS</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatMetric(performanceData.coreWebVitals.cls, '')}
            </div>
            <div className="text-xs text-gray-500">Target: &lt;0.1</div>
          </div>
        </div>
      </div>

      {/* Custom Metrics */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Custom Metrics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Joke Render P95</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatMetric(performanceData.customMetrics.jokeRenderTime.p95)}
              </div>
              <div className="text-xs text-gray-500">Target: &lt;16ms</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Setlist Update P95</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatMetric(performanceData.customMetrics.setlistUpdateTime.p95)}
              </div>
              <div className="text-xs text-gray-500">Target: &lt;50ms</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Search Response P95</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatMetric(performanceData.customMetrics.searchResponseTime.p95)}
              </div>
              <div className="text-xs text-gray-500">Target: &lt;100ms</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Drag & Drop P95</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatMetric(performanceData.customMetrics.dragDropLatency.p95)}
              </div>
              <div className="text-xs text-gray-500">Target: &lt;50ms</div>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-yellow-50">
          <h4 className="text-md font-semibold text-yellow-800 mb-2">⚠️ Performance Warnings</h4>
          <ul className="space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className="text-sm text-yellow-700">
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Performance monitoring powered by Google Team standards</span>
          <span>Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
        </div>
      </div>
    </div>
  )
}

export default PerformanceDashboard


