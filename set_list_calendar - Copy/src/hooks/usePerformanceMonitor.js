import { useEffect, useRef } from 'react';
import { isFeatureEnabled } from '../config/features';

/**
 * Performance monitoring hook
 * Tracks render times and provides debugging info when enabled
 */
export function usePerformanceMonitor(componentName) {
  const renderCount = useRef(0);
  const startTime = useRef(0);

  useEffect(() => {
    if (!isFeatureEnabled('performanceMode')) return;

    renderCount.current += 1;
    
    if (isFeatureEnabled('debugMode')) {
      console.log(`🔄 ${componentName} render #${renderCount.current}`);
    }
  });

  const startMeasure = (operationName) => {
    if (!isFeatureEnabled('performanceMode')) return () => {};

    startTime.current = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime.current;
      
      if (isFeatureEnabled('debugMode') || duration > 16) { // Log if over 1 frame (16ms)
        console.log(`⏱️ ${componentName}: ${operationName} took ${duration.toFixed(2)}ms`);
      }
    };
  };

  return { startMeasure, renderCount: renderCount.current };
}