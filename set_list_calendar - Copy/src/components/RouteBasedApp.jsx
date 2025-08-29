/**
 * Route-Based Code Splitting Implementation
 * 
 * Google Team Requirement: Break up monolithic JavaScript bundle
 * Strategy: Lazy load components by route/feature to reduce initial bundle size
 */

import React, { Suspense, lazy, useState } from 'react'
import { features } from '../config/features'

// Lazy load heavy components
const JokeBankLazy = lazy(() => 
  import('./jokes/JokeBank.jsx').then(module => ({ 
    default: module.default || module.JokeBank 
  }))
)

const SetlistLazy = lazy(() => 
  import('./setlist/Setlist.jsx').then(module => ({ 
    default: module.default || module.Setlist 
  }))
)

// Stats component doesn't exist yet, so provide a fallback
const StatsLazy = lazy(() => 
  Promise.resolve({ 
    default: () => (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '1rem',
        color: '#b3b3b3',
        textAlign: 'center'
      }}>
        <i className="fas fa-chart-bar" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
        <h2>Stats Coming Soon</h2>
        <p>Performance analytics and usage metrics will be available in a future update.</p>
      </div>
    )
  })
)

// Loading component for Suspense fallback
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="loading-container" style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    gap: '1rem'
  }}>
    <div className="loading-spinner" style={{
      width: '32px',
      height: '32px',
      border: '3px solid #3e4042',
      borderTop: '3px solid #4CAF50',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <div style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
      {message}
    </div>
    
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)

// Route/View types
type ViewType = 'jokebank' | 'setlist' | 'stats'

interface RouteBasedAppProps {
  initialView?: ViewType
}

export const RouteBasedApp: React.FC<RouteBasedAppProps> = ({ 
  initialView = 'setlist' 
}) => {
  const [currentView, setCurrentView] = useState<ViewType>(initialView)
  const [loadingView, setLoadingView] = useState<ViewType | null>(null)

  const handleViewChange = async (newView: ViewType) => {
    if (newView === currentView) return
    
    setLoadingView(newView)
    
    // Add artificial delay to show loading state (remove in production)
    if (features.debugMode) {
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    setCurrentView(newView)
    setLoadingView(null)
    
    // Track view changes for analytics
    if (features.advancedAnalytics) {
      console.log(`🎯 Route change: ${currentView} → ${newView}`)
    }
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'jokebank':
        return (
          <Suspense fallback={<LoadingSpinner message="Loading Joke Bank..." />}>
            <JokeBankLazy />
          </Suspense>
        )
      
      case 'setlist':
        return (
          <Suspense fallback={<LoadingSpinner message="Loading Setlist Builder..." />}>
            <SetlistLazy />
          </Suspense>
        )
      
      case 'stats':
        return (
          <Suspense fallback={<LoadingSpinner message="Loading Stats..." />}>
            <StatsLazy />
          </Suspense>
        )
      
      default:
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Unknown view: {currentView}</h2>
          </div>
        )
    }
  }

  return (
    <div className="route-based-app">
      {/* Navigation */}
      <nav className="app-nav" style={{
        display: 'flex',
        gap: '1rem',
        padding: '1rem',
        borderBottom: '1px solid #333',
        backgroundColor: '#1a1a1a'
      }}>
        {[
          { view: 'setlist' as ViewType, label: '🎭 Setlist Builder', icon: 'fas fa-list' },
          { view: 'jokebank' as ViewType, label: '📚 Joke Bank', icon: 'fas fa-book' },
          { view: 'stats' as ViewType, label: '📊 Stats', icon: 'fas fa-chart-bar' }
        ].map(({ view, label, icon }) => (
          <button
            key={view}
            onClick={() => handleViewChange(view)}
            disabled={loadingView === view}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: currentView === view ? '#4CAF50' : '#333',
              color: currentView === view ? 'white' : '#b3b3b3',
              border: 'none',
              borderRadius: '6px',
              cursor: loadingView === view ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '0.9rem',
              fontWeight: currentView === view ? '600' : '400',
              opacity: loadingView === view ? 0.7 : 1
            }}
          >
            <i className={icon} aria-hidden="true"></i>
            {loadingView === view ? 'Loading...' : label}
          </button>
        ))}
        
        {/* Performance indicator (debug mode) */}
        {features.debugMode && (
          <div style={{
            marginLeft: 'auto',
            padding: '0.5rem',
            fontSize: '0.75rem',
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>⚡ Code Split</span>
            <span style={{ 
              background: '#4CAF50', 
              color: 'white', 
              padding: '2px 6px', 
              borderRadius: '3px' 
            }}>
              Active
            </span>
          </div>
        )}
      </nav>

      {/* Main content area */}
      <main className="app-content" style={{
        flex: 1,
        minHeight: 0, // Allow flex shrinking
        display: 'flex',
        flexDirection: 'column'
      }}>
        {renderCurrentView()}
      </main>

      {/* Bundle info footer (development only) */}
      {features.debugMode && import.meta.env.DEV && (
        <footer style={{
          padding: '0.5rem 1rem',
          borderTop: '1px solid #333',
          backgroundColor: '#1a1a1a',
          fontSize: '0.75rem',
          color: '#666',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>🔧 Dev Mode: Dynamic imports active</span>
          <span>Current bundle: {currentView}-feature.js</span>
        </footer>
      )}
    </div>
  )
}

export default RouteBasedApp