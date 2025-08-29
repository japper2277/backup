import React from 'react';
import { features, isFeatureEnabled } from '../../config/features';
import { theme } from '../../styles/theme';

export const PerformanceToggle = () => {
  if (!isFeatureEnabled('debugMode')) return null;
  
  const togglePerformanceMode = () => {
    features.performanceMode = !features.performanceMode;
    window.location.reload(); // Simple reload to apply changes
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: 10000,
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    }}>
      <button
        onClick={togglePerformanceMode}
        style={{
          background: features.performanceMode ? theme.colors.accent.green : theme.colors.bg.surface2,
          color: features.performanceMode ? 'white' : theme.colors.text.secondary,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '12px',
          cursor: 'pointer',
          fontFamily: 'monospace'
        }}
        title="Toggle Performance Mode"
      >
        {features.performanceMode ? '🚀 PERF ON' : '⚡ PERF OFF'}
      </button>
      
      {features.performanceMode && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.9)',
          color: 'white',
          padding: '4px 8px',
          fontSize: '12px',
          borderRadius: '4px',
          fontFamily: 'monospace'
        }}>
          Performance Mode Active
        </div>
      )}
    </div>
  );
};