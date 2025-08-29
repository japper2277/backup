/**
 * TimingAttributionFlash Component
 * 
 * Shows brief notifications when collaborators make timer-related changes.
 * Displays user avatar + change summary, then fades after 2-3 seconds.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

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
  },
  FlashItemFading: {
    opacity: 0,
    transform: 'translateX(20px)'
  },
  Avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: 600,
    flexShrink: 0
  },
  AvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  Content: {
    flex: 1,
    minWidth: 0 // Allow text to truncate
  },
  UserName: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '0.1rem'
  },
  Message: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.3,
    wordBreak: 'break-word'
  },
  TimeBadge: {
    background: 'var(--accent-green)',
    color: 'white',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
    fontSize: '0.65rem',
    fontWeight: 600,
    marginLeft: '0.25rem',
    fontFamily: 'monospace'
  }
};

// Get user avatar color based on userId
const getAvatarColor = (userId) => {
  const colors = [
    '#10b981', // emerald-500
    '#3b82f6', // blue-500  
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#f97316'  // orange-500
  ];
  
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

// Get user initials
const getUserInitials = (user) => {
  if (user.displayName && user.displayName !== 'Anonymous') {
    return user.displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return user.userId.slice(0, 2).toUpperCase();
};

// Format time in MM:SS
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

function FlashNotification({ flash, onComplete }) {
  const [phase, setPhase] = useState('entering'); // entering, visible, fading, completed
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const timers = [];

    // Entering -> Visible
    timers.push(setTimeout(() => setPhase('visible'), 50));
    
    // Visible -> Fading
    timers.push(setTimeout(() => setPhase('fading'), 2500));
    
    // Fading -> Completed
    timers.push(setTimeout(() => {
      setPhase('completed');
      onComplete();
    }, 2800));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const getFlashStyle = () => {
    let style = { ...FlashStyles.FlashItem };
    
    if (phase === 'visible') {
      style = { ...style, ...FlashStyles.FlashItemVisible };
    } else if (phase === 'fading') {
      style = { ...style, ...FlashStyles.FlashItemFading };
    }
    
    return style;
  };

  return (
    <div style={getFlashStyle()}>
      {/* User Avatar */}
      <div 
        style={{
          ...FlashStyles.Avatar,
          backgroundColor: getAvatarColor(flash.user.userId)
        }}
      >
        {flash.user.avatar && !imageError ? (
          <img 
            src={flash.user.avatar} 
            alt={flash.user.displayName || 'User'} 
            style={FlashStyles.AvatarImage}
            onError={() => setImageError(true)}
          />
        ) : (
          getUserInitials(flash.user)
        )}
      </div>
      
      {/* Content */}
      <div style={FlashStyles.Content}>
        <div style={FlashStyles.UserName}>
          {flash.user.displayName || 'Anonymous User'}
        </div>
        <div style={FlashStyles.Message}>
          {flash.message}
          {flash.newValue && (
            <span style={FlashStyles.TimeBadge}>
              {formatTime(flash.newValue)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export const TimingAttributionFlash = ({ setlistId }) => {
  const [flashQueue, setFlashQueue] = useState([]);
  const [activeFlashes, setActiveFlashes] = useState([]);
  const nextIdRef = useRef(0);
  const maxActiveFlashes = 3;

  // Process flash queue
  useEffect(() => {
    if (flashQueue.length > 0 && activeFlashes.length < maxActiveFlashes) {
      const nextFlash = flashQueue[0];
      setFlashQueue(prev => prev.slice(1));
      setActiveFlashes(prev => [...prev, { ...nextFlash, id: nextIdRef.current++ }]);
    }
  }, [flashQueue, activeFlashes.length]);

  // Remove completed flash
  const handleFlashComplete = useCallback((flashId) => {
    setActiveFlashes(prev => prev.filter(flash => flash.id !== flashId));
  }, []);

  // Add new flash to queue
  const addFlash = useCallback((flash) => {
    // Batch similar changes to prevent spam
    const recentSimilarFlash = flashQueue.find(f => 
      f.user.userId === flash.user.userId && 
      f.changeType === flash.changeType &&
      f.jokeId === flash.jokeId
    );

    if (recentSimilarFlash) {
      // Update existing flash instead of adding new one
      setFlashQueue(prev => prev.map(f => 
        f === recentSimilarFlash ? { ...flash, timestamp: Date.now() } : f
      ));
    } else {
      setFlashQueue(prev => [...prev, { ...flash, timestamp: Date.now() }]);
    }
  }, [flashQueue]);

  // Create a ref for external access
  React.useImperativeHandle(React.forwardRef(() => null), () => ({
    addFlash
  }), [addFlash]);

  if (activeFlashes.length === 0) return null;

  return (
    <div style={FlashStyles.Container}>
      {activeFlashes.map(flash => (
        <FlashNotification
          key={flash.id}
          flash={flash}
          onComplete={() => handleFlashComplete(flash.id)}
        />
      ))}
    </div>
  );
};

// Helper function to trigger timing change flashes
export const showTimingChange = (user, changeType, details = {}) => {
  // For now, just log the change - can be enhanced later with proper context
  console.log('Timing change:', user.displayName, changeType, details);
};

export default TimingAttributionFlash;