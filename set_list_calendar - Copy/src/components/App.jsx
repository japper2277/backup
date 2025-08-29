/**
 * PRODUCTION COMEDY SETLIST BUILDER
 * 
 * Unified collaborative application with:
 * - Real-time multi-user collaboration
 * - Unified @dnd-kit drag system
 * - Firebase persistence and sync
 * - Professional UX with no demo confusion
 */

import React, { Suspense } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { AppProvider } from '../contexts/AppContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { TenantProvider } from '../contexts/TenantContext';
// UNIFIED PRODUCTION APP - No more demo fragmentation
import CollaborativeDemoApp from './CollaborativeDemoApp.jsx';
import { features } from '../config/features';

/**
 * Simple Error Boundary
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          backgroundColor: '#121212',
          color: '#ffffff'
        }}>
          <h1 style={{ color: '#ef4444' }}>Something went wrong</h1>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#1DB954',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Loading Component - Simple loading state
 * No memo needed - this component rarely re-renders and has no props
 */
const Loading = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#121212',
    color: '#ffffff'
  }}>
    <div className="animate-pulse">Loading Setlist Builder...</div>
    {features.debugMode && (
      <div style={{ position: 'absolute', bottom: '20px', fontSize: '12px', opacity: 0.7 }}>
        Performance Mode: Enabled • Debug: On
      </div>
    )}
  </div>
);

/**
 * UNIFIED PRODUCTION APP - Single Comedy Setlist Builder
 * 
 * ✅ No more URL parameter confusion
 * ✅ No more demo fragmentation 
 * ✅ Collaborative real-time setlist building
 * ✅ Unified drag system (@dnd-kit + Firebase)
 * ✅ Multi-user presence and comments
 */
const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <TenantProvider>
            <AppProvider>
              <Suspense fallback={<Loading />}>
                <CollaborativeDemoApp />
              </Suspense>
            </AppProvider>
          </TenantProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App