/**
 * Simple TimingAttributionFlash Component - No global dependencies
 * 
 * Shows brief notifications when collaborators make timer-related changes.
 * Displays user avatar + change summary, then fades after 2-3 seconds.
 */

import React, { useState, useEffect } from 'react';

const FlashStyles = {
  Container: {
    position: 'fixed',
    bottom: '1rem',
    right: '1rem',
    zIndex: 9999,
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    maxWidth: '320px'
  },
  FlashItem: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    transform: 'translateX(100%)',
    transition: 'all 0.3s ease-out',
    backdropFilter: 'blur(10px)',
    maxWidth: '100%'
  },
  FlashItemVisible: {
    transform: 'translateX(0%)'
  }
};

// Simple, self-contained flash component
export const TimingAttributionFlashSimple = () => {
  const [flashes, setFlashes] = useState([]);

  // Auto-hide flashes after 3 seconds
  useEffect(() => {
    if (flashes.length === 0) return;

    const timer = setTimeout(() => {
      setFlashes([]);
    }, 3000);

    return () => clearTimeout(timer);
  }, [flashes]);

  // Show a flash when needed (could be called from parent components)
  const showFlash = (message) => {
    setFlashes([{ id: Date.now(), message }]);
  };

  // Don't render if no flashes
  if (flashes.length === 0) return null;

  return (
    <div style={FlashStyles.Container}>
      {flashes.map(flash => (
        <div 
          key={flash.id}
          style={{
            ...FlashStyles.FlashItem,
            ...FlashStyles.FlashItemVisible
          }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            {flash.message}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimingAttributionFlashSimple;