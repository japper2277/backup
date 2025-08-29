import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App.jsx';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/global.css'; // Amy Park's design system styles
// Simplified initialization for debugging

// Create root and render the app
const container = document.getElementById('root');
const root = createRoot(container);

// Safe error logging helper
const safeLogError = (label, error, errorInfo = null) => {
  try {
    const errorMessage = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error(`🚨 ${label}:`, errorMessage);
    
    if (errorInfo && errorInfo.componentStack) {
      console.error('Component Stack:', errorInfo.componentStack);
    }
    
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } catch (logError) {
    console.error('🚨 Error logging failed:', typeof error);
  }
};

// Render the app with production-grade error boundary
root.render(
  <React.StrictMode>
    <ErrorBoundary 
      onError={(error, errorInfo) => {
        // Custom error handling with safe logging
        safeLogError('Production Error Caught', error, errorInfo);
      }}
    >
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Global error handlers to catch all unhandled errors
window.addEventListener('error', (event) => {
  try {
    const errorMessage = event.error instanceof Error 
      ? `${event.error.name}: ${event.error.message}`
      : String(event.error || event.message);
    console.error('🚨 Global Error:', errorMessage);
  } catch (logError) {
    console.error('🚨 Error logging failed in global handler');
  }
});

window.addEventListener('unhandledrejection', (event) => {
  try {
    const errorMessage = event.reason instanceof Error 
      ? `${event.reason.name}: ${event.reason.message}`
      : String(event.reason);
    console.error('🚨 Unhandled Promise Rejection:', errorMessage);
  } catch (logError) {
    console.error('🚨 Error logging failed in rejection handler');
  }
});

// Override console methods to prevent object-to-primitive conversion errors
const originalConsoleError = console.error;
console.error = function(...args) {
  try {
    const safeArgs = args.map(arg => {
      if (arg === null || arg === undefined) return String(arg);
      if (typeof arg === 'object') {
        if (arg instanceof Error) {
          return `${arg.name}: ${arg.message}`;
        }
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return `[Object: ${arg.constructor?.name || 'Unknown'}]`;
        }
      }
      return arg;
    });
    originalConsoleError.apply(console, safeArgs);
  } catch (logError) {
    originalConsoleError.apply(console, ['🚨 Console error logging failed:', typeof args[0]]);
  }
};

// Hot module replacement temporarily disabled