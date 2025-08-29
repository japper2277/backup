/**
 * Performance enhancement initialization
 * Auto-enables performance optimizations while preserving original functionality
 */
import { features } from './config/features.js';
// Initialize performance monitoring if enabled
if (features.performanceMode && typeof window !== 'undefined') {
  
  // Lazy load store and demo data to avoid import issues
  Promise.all([
    import('./store/useSetlistStore.js'),
    import('./utils/demoData.js')
  ]).then(([storeModule, demoModule]) => {
    // Make store available globally for debugging
    window.useSetlistStore = storeModule.useSetlistStore;
    
    // Initialize demo data if in debug mode
    if (features.debugMode) {
      setTimeout(() => {
        demoModule.initializeDemoData();
      }, 100);
    }
  }).catch(error => {
    console.warn('Performance modules failed to load:', error);
  });
  
  // Add performance CSS for smoother animations
  const performanceStyles = document.createElement('style');
  performanceStyles.textContent = `
    /* Performance optimized animations */
    * {
      will-change: auto;
    }
    
    /* Optimized transitions for frequently animated elements */
    [draggable="true"] {
      will-change: transform;
    }
    
    /* GPU acceleration for better performance */
    .joke-card:hover,
    .setlist-item:hover {
      transform: translateZ(0) translateY(-1px);
    }
    
    /* Shimmer animation optimization */
    @keyframes shimmer {
      0% { background-position: -200px 0; }
      100% { background-position: calc(200px + 100%) 0; }
    }
    
    /* Performance debug indicator */
    ${features.debugMode ? `
      body::before {
        content: "🚀 Performance Mode Active";
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(34, 197, 94, 0.9);
        color: white;
        padding: 4px 8px;
        font-size: 12px;
        border-radius: 4px;
        z-index: 10000;
        font-family: monospace;
      }
    ` : ''}
  `;
  document.head.appendChild(performanceStyles);

  // Performance observer for Core Web Vitals
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (features.debugMode) {
          console.log(`📊 Performance: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
        }
        
        // Log slow operations
        if (entry.duration > 16) { // Over one frame
          console.warn(`⚠️ Slow operation detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
        }
      }
    });
    
    // Observe various performance metrics
    try {
      observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
    } catch (e) {
      // Fallback for browsers that don't support all entry types
      console.log('Performance monitoring partially supported');
    }
  }

  // Memory usage monitoring (debug mode only)
  if (features.debugMode && 'performance' in window && 'memory' in window.performance) {
    setInterval(() => {
      const memory = window.performance.memory;
      if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // Over 50MB
        console.warn(`🧠 High memory usage: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`);
      }
    }, 10000);
  }
}

// Export debug utilities
window.debugSetlistBuilder = () => {
  if (!features.debugMode) {
    console.log('Enable debugMode in features.js to use debug utilities');
    return;
  }
  
  console.log('🔧 Setlist Builder Debug Info:');
  console.log('Features:', features);
  console.log('Performance entries:', performance.getEntriesByType('measure'));
  
  if ('memory' in window.performance) {
    const memory = window.performance.memory;
    console.log(`Memory: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB used of ${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB limit`);
  }
};