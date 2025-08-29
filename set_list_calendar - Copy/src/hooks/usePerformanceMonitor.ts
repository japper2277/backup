/**
 * Performance Monitoring Hook - Google Team Standards
 * Tracks Core Web Vitals and custom performance metrics
 */
import { useEffect, useRef, useCallback } from 'react'
import { useSetlistStore } from '../store/useSetlistStore'

interface PerformanceEntry {
  name: string
  entryType: string
  startTime: number
  duration: number
  value?: number
}

interface PerformanceMetrics {
  fcp: number | null
  lcp: number | null
  fid: number | null
  cls: number | null
  ttfb: number | null
  domLoad: number | null
  windowLoad: number | null
}

interface CustomMetrics {
  jokeRenderTime: number[]
  setlistUpdateTime: number[]
  searchResponseTime: number[]
  dragDropLatency: number[]
}

export const usePerformanceMonitor = () => {
  const metricsRef = useRef<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    domLoad: null,
    windowLoad: null
  })

  const customMetricsRef = useRef<CustomMetrics>({
    jokeRenderTime: [],
    setlistUpdateTime: [],
    searchResponseTime: [],
    dragDropLatency: []
  })

  const observerRef = useRef<PerformanceObserver | null>(null)
  const { trackPerformanceEvent } = useSetlistStore()

  // Measure Core Web Vitals
  const measureCoreWebVitals = useCallback(() => {
    if ('PerformanceObserver' in window) {
      try {
        // First Contentful Paint
        observerRef.current = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              metricsRef.current.fcp = entry.startTime
              trackPerformanceEvent('fcp', entry.startTime)
            }
          }
        })
        observerRef.current.observe({ entryTypes: ['paint'] })

        // Largest Contentful Paint
        observerRef.current = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              metricsRef.current.lcp = entry.startTime
              trackPerformanceEvent('lcp', entry.startTime)
            }
          }
        })
        observerRef.current.observe({ entryTypes: ['largest-contentful-paint'] })

        // First Input Delay
        observerRef.current = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'first-input') {
              metricsRef.current.fid = entry.processingStart! - entry.startTime
              trackPerformanceEvent('fid', metricsRef.current.fid)
            }
          }
        })
        observerRef.current.observe({ entryTypes: ['first-input'] })

        // Cumulative Layout Shift
        observerRef.current = new PerformanceObserver((list) => {
          let clsValue = 0
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
          metricsRef.current.cls = clsValue
          trackPerformanceEvent('cls', clsValue)
        })
        observerRef.current.observe({ entryTypes: ['layout-shift'] })
      } catch (error) {
        console.warn('Performance monitoring setup failed:', error)
      }
    }
  }, [trackPerformanceEvent])

  // Measure custom performance metrics
  const measureJokeRenderTime = useCallback((renderTime: number) => {
    customMetricsRef.current.jokeRenderTime.push(renderTime)
    if (customMetricsRef.current.jokeRenderTime.length > 100) {
      customMetricsRef.current.jokeRenderTime.shift()
    }
    trackPerformanceEvent('joke_render_time', renderTime)
  }, [trackPerformanceEvent])

  const measureSetlistUpdateTime = useCallback((updateTime: number) => {
    customMetricsRef.current.setlistUpdateTime.push(updateTime)
    if (customMetricsRef.current.setlistUpdateTime.length > 100) {
      customMetricsRef.current.setlistUpdateTime.shift()
    }
    trackPerformanceEvent('setlist_update_time', updateTime)
  }, [trackPerformanceEvent])

  const measureSearchResponseTime = useCallback((responseTime: number) => {
    customMetricsRef.current.searchResponseTime.push(responseTime)
    if (customMetricsRef.current.searchResponseTime.length > 100) {
      customMetricsRef.current.searchResponseTime.shift()
    }
    trackPerformanceEvent('search_response_time', responseTime)
  }, [trackPerformanceEvent])

  const measureDragDropLatency = useCallback((latency: number) => {
    customMetricsRef.current.dragDropLatency.push(latency)
    if (customMetricsRef.current.dragDropLatency.length > 100) {
      customMetricsRef.current.dragDropLatency.shift()
    }
    trackPerformanceEvent('drag_drop_latency', latency)
  }, [trackPerformanceEvent])

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    const getAverage = (values: number[]) => 
      values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0

    const getPercentile = (values: number[], percentile: number) => {
      if (values.length === 0) return 0
      const sorted = [...values].sort((a, b) => a - b)
      const index = Math.ceil((percentile / 100) * sorted.length) - 1
      return sorted[index] || 0
    }

    return {
      coreWebVitals: {
        fcp: metricsRef.current.fcp,
        lcp: metricsRef.current.lcp,
        fid: metricsRef.current.fid,
        cls: metricsRef.current.cls,
        ttfb: metricsRef.current.ttfb
      },
      customMetrics: {
        jokeRenderTime: {
          average: getAverage(customMetricsRef.current.jokeRenderTime),
          p95: getPercentile(customMetricsRef.current.jokeRenderTime, 95),
          p99: getPercentile(customMetricsRef.current.jokeRenderTime, 99)
        },
        setlistUpdateTime: {
          average: getAverage(customMetricsRef.current.setlistUpdateTime),
          p95: getPercentile(customMetricsRef.current.setlistUpdateTime, 95),
          p99: getPercentile(customMetricsRef.current.setlistUpdateTime, 99)
        },
        searchResponseTime: {
          average: getAverage(customMetricsRef.current.searchResponseTime),
          p95: getPercentile(customMetricsRef.current.searchResponseTime, 95),
          p99: getPercentile(customMetricsRef.current.searchResponseTime, 99)
        },
        dragDropLatency: {
          average: getAverage(customMetricsRef.current.dragDropLatency),
          p95: getPercentile(customMetricsRef.current.dragDropLatency, 95),
          p99: getPercentile(customMetricsRef.current.dragDropLatency, 99)
        }
      }
    }
  }, [])

  // Performance budget checker
  const checkPerformanceBudget = useCallback(() => {
    const summary = getPerformanceSummary()
    const warnings: string[] = []

    // Core Web Vitals thresholds (Google standards)
    if (summary.coreWebVitals.fcp && summary.coreWebVitals.fcp > 1800) {
      warnings.push(`FCP is ${summary.coreWebVitals.fcp}ms (target: <1800ms)`)
    }
    if (summary.coreWebVitals.lcp && summary.coreWebVitals.lcp > 2500) {
      warnings.push(`LCP is ${summary.coreWebVitals.lcp}ms (target: <2500ms)`)
    }
    if (summary.coreWebVitals.fid && summary.coreWebVitals.fid > 100) {
      warnings.push(`FID is ${summary.coreWebVitals.fid}ms (target: <100ms)`)
    }
    if (summary.coreWebVitals.cls && summary.coreWebVitals.cls > 0.1) {
      warnings.push(`CLS is ${summary.coreWebVitals.cls} (target: <0.1)`)
    }

    // Custom metrics thresholds
    if (summary.customMetrics.jokeRenderTime.p95 > 16) {
      warnings.push(`Joke render P95 is ${summary.customMetrics.jokeRenderTime.p95}ms (target: <16ms)`)
    }
    if (summary.customMetrics.setlistUpdateTime.p95 > 50) {
      warnings.push(`Setlist update P95 is ${summary.customMetrics.setlistUpdateTime.p95}ms (target: <50ms)`)
    }

    return warnings
  }, [getPerformanceSummary])

  // Initialize performance monitoring
  useEffect(() => {
    measureCoreWebVitals()

    // Measure DOM and window load times
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        metricsRef.current.domLoad = performance.now()
        trackPerformanceEvent('dom_load_time', metricsRef.current.domLoad)
      })
    } else {
      metricsRef.current.domLoad = performance.now()
    }

    window.addEventListener('load', () => {
      metricsRef.current.windowLoad = performance.now()
      trackPerformanceEvent('window_load_time', metricsRef.current.windowLoad)
    })

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [measureCoreWebVitals, trackPerformanceEvent])

  return {
    measureJokeRenderTime,
    measureSetlistUpdateTime,
    measureSearchResponseTime,
    measureDragDropLatency,
    getPerformanceSummary,
    checkPerformanceBudget,
    metrics: metricsRef.current
  }
}