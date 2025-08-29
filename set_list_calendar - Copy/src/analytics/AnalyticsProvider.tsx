/**
 * Analytics Provider - Google Team Standards
 * Tracks user events, performance metrics, and provides analytics context
 */
import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react'
import { useSetlistStore } from '../store/useSetlistStore'

interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp: number
  userId?: string
  sessionId: string
  userAgent: string
  url: string
  performance?: {
    memory?: {
      usedJSHeapSize: number
      totalJSHeapSize: number
      jsHeapSizeLimit: number
    }
    navigation?: {
      loadEventEnd: number
      domContentLoadedEventEnd: number
      firstPaint: number
    }
  }
}

interface AnalyticsContextValue {
  track: (event: string, properties?: Record<string, any>) => void
  identify: (userId: string, traits?: Record<string, any>) => void
  trackPageView: (page: string) => void
  trackError: (error: Error, context?: Record<string, any>) => void
  getSessionId: () => string
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null)

interface AnalyticsProviderProps {
  children: React.ReactNode
  enabled?: boolean
  endpoint?: string
  debug?: boolean
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ 
  children,
  enabled = true,
  endpoint = '/api/analytics',
  debug = import.meta.env.DEV
}) => {
  const sessionIdRef = useRef<string>(crypto.randomUUID())
  const userIdRef = useRef<string | null>(null)
  const eventQueueRef = useRef<AnalyticsEvent[]>([])
  const isOnlineRef = useRef<boolean>(navigator.onLine)
  const { trackPerformanceEvent } = useSetlistStore()

  // Generate session ID if not exists
  const getSessionId = useCallback(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = crypto.randomUUID()
    }
    return sessionIdRef.current
  }, [])

  // Get performance metrics
  const getPerformanceMetrics = useCallback(() => {
    const metrics: any = {}
    
    // Memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory
      metrics.memory = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      }
    }

    // Navigation timing
    if ('navigation' in performance) {
      const navigation = (performance as any).navigation
      metrics.navigation = {
        loadEventEnd: navigation.loadEventEnd,
        domContentLoadedEventEnd: navigation.domContentLoadedEventEnd
      }
    }

    // Paint timing
    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
    if (firstPaint) {
      metrics.navigation = {
        ...metrics.navigation,
        firstPaint: firstPaint.startTime
      }
    }

    return metrics
  }, [])

  // Send analytics event
  const sendEvent = useCallback(async (event: AnalyticsEvent) => {
    if (!enabled) return

    try {
      // Add to queue if offline
      if (!isOnlineRef.current) {
        eventQueueRef.current.push(event)
        return
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-ID': getSessionId()
        },
        body: JSON.stringify(event)
      })

      if (!response.ok) {
        throw new Error(`Analytics request failed: ${response.status}`)
      }

      // Log to console in debug mode
      if (debug) {
        console.log('📊 Analytics Event Sent:', event)
      }

    } catch (error) {
      console.warn('Analytics event failed to send:', error)
      // Queue failed events for retry
      eventQueueRef.current.push(event)
    }
  }, [enabled, endpoint, getSessionId, debug])

  // Track event
  const track = useCallback((event: string, properties = {}) => {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      },
      timestamp: Date.now(),
      userId: userIdRef.current || undefined,
      sessionId: getSessionId(),
      performance: getPerformanceMetrics()
    }

    sendEvent(analyticsEvent)

    // Also track in performance store for local monitoring
    trackPerformanceEvent(event, properties)
  }, [sendEvent, getSessionId, getPerformanceMetrics, trackPerformanceEvent])

  // Identify user
  const identify = useCallback((userId: string, traits = {}) => {
    userIdRef.current = userId
    track('user_identified', { userId, ...traits })
  }, [track])

  // Track page view
  const trackPageView = useCallback((page: string) => {
    track('page_view', { page, referrer: document.referrer })
  }, [track])

  // Track errors
  const trackError = useCallback((error: Error, context = {}) => {
    track('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context
    })
  }, [track])

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true
      // Send queued events when back online
      while (eventQueueRef.current.length > 0) {
        const event = eventQueueRef.current.shift()
        if (event) sendEvent(event)
      }
    }

    const handleOffline = () => {
      isOnlineRef.current = false
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [sendEvent])

  // Track initial page view
  useEffect(() => {
    trackPageView(window.location.pathname)
  }, [trackPageView])

  // Global error boundary
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(new Error(event.reason), {
        type: 'unhandled_rejection'
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [trackError])

  const contextValue: AnalyticsContextValue = {
    track,
    identify,
    trackPageView,
    trackError,
    getSessionId
  }

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  )
}

// Hook to use analytics
export const useAnalytics = () => {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider')
  }
  return context
}

// Hook for tracking component performance
export const useAnalyticsPerformance = (componentName: string) => {
  const { track } = useAnalytics()
  
  const trackRender = useCallback((renderTime: number) => {
    track('component_render', {
      component: componentName,
      renderTime,
      timestamp: Date.now()
    })
  }, [track, componentName])

  const trackInteraction = useCallback((interactionName: string, duration: number) => {
    track('component_interaction', {
      component: componentName,
      interaction: interactionName,
      duration,
      timestamp: Date.now()
    })
  }, [track, componentName])

  return {
    trackRender,
    trackInteraction
  }
}

// Export default for backward compatibility
export default AnalyticsProvider



