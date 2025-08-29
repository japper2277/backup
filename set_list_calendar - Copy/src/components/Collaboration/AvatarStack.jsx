/**
 * AvatarStack - Real-time Collaboration Presence Indicator
 * 
 * Displays active users in a collaborative setlist with real-time updates.
 * Shows user avatars, initials, and online status using Firebase Realtime Database.
 */

import React, { useState } from 'react';
import { useSetlistPresence } from '../../hooks/usePresence.js';

const AvatarStackStyles = {
  Container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  AvatarGroup: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative'
  },
  Avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: '2px solid var(--bg-surface)',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    zIndex: 10,
    backgroundColor: 'var(--accent-green)'
  },
  AvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  OnlineIndicator: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#10b981', // green-500
    border: '2px solid var(--bg-surface)',
    zIndex: 11
  },
  EditingIndicator: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#f59e0b', // amber-500
    border: '1px solid var(--bg-surface)',
    zIndex: 11,
    animation: 'pulse 2s ease-in-out infinite'
  },
  Tooltip: {
    position: 'absolute',
    bottom: '120%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--bg-surface-2)',
    color: 'var(--text-primary)',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    border: '1px solid var(--border-color)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    
    // Tooltip arrow
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      border: '4px solid transparent',
      borderTopColor: 'var(--bg-surface-2)'
    }
  },
  OverflowIndicator: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'var(--bg-surface-2)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 600,
    marginLeft: '-8px',
    zIndex: 5,
    cursor: 'pointer'
  },
  StatusText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 500
  },
  LoadingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  LoadingDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--accent-green)',
    animation: 'loadingPulse 1.5s ease-in-out infinite'
  },
  ConnectedIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.7rem',
    color: 'var(--text-secondary)'
  },
  ConnectedDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#10b981'
  }
};

function UserAvatar({ user, index, maxVisible, onClick }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getUserInitials = (user) => {
    if (user.displayName && user.displayName !== 'Anonymous') {
      return user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return '?';
  };

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

  const formatLastSeen = (lastSeen) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now - lastSeenDate;
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 30) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    
    return 'Recently active';
  };

  return (
    <div
      style={{
        ...AvatarStackStyles.Avatar,
        backgroundColor: getAvatarColor(user.userId),
        marginLeft: index > 0 ? '-8px' : '0',
        zIndex: maxVisible - index,
        transform: showTooltip ? 'scale(1.1)' : 'scale(1)',
        filter: showTooltip ? 'brightness(1.1)' : 'brightness(1)'
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => onClick?.(user)}
    >
      {user.avatar && !imageError ? (
        <img 
          src={user.avatar} 
          alt={user.displayName || 'User'} 
          style={AvatarStackStyles.AvatarImage}
          onError={() => setImageError(true)}
        />
      ) : (
        getUserInitials(user)
      )}
      
      {/* Online indicator */}
      <div style={AvatarStackStyles.OnlineIndicator} />
      
      {/* Currently editing indicator */}
      {user.currentlyEditing && (
        <div style={AvatarStackStyles.EditingIndicator} />
      )}
      
      {/* Tooltip */}
      {showTooltip && (
        <div style={AvatarStackStyles.Tooltip}>
          <div style={{ fontWeight: 600, marginBottom: '2px' }}>
            {user.displayName || 'Anonymous User'}
          </div>
          <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
            {user.currentlyEditing 
              ? '✏️ Currently editing' 
              : `👁️ ${formatLastSeen(user.lastSeen)}`
            }
          </div>
        </div>
      )}
      
      {/* CSS animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes loadingPulse {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

function OverflowIndicator({ count, users, onClick }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      style={AvatarStackStyles.OverflowIndicator}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => onClick?.(users)}
    >
      +{count}
      
      {showTooltip && (
        <div style={AvatarStackStyles.Tooltip}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            {count} more collaborator{count !== 1 ? 's' : ''}
          </div>
          {users.slice(0, 3).map((user, index) => (
            <div key={`overflow-${user.userId}-${user.presenceKey || index}`} style={{ fontSize: '0.7rem', opacity: 0.8 }}>
              {user.displayName || 'Anonymous'}
            </div>
          ))}
          {users.length > 3 && (
            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
              ...and {users.length - 3} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * AvatarStack Component
 * Shows active collaborators in a compact, visually appealing stack
 */
export function AvatarStack({ 
  setlistId, 
  maxVisible = 4,
  showStatus = true,
  showConnectedIndicator = false,
  onUserClick,
  className 
}) {
  const { 
    activeUsers, 
    isConnected, 
    error,
    getUsersEditingJoke 
  } = useSetlistPresence(setlistId);

  if (error) {
    return (
      <div style={AvatarStackStyles.Container} className={className}>
        <span style={{ ...AvatarStackStyles.StatusText, color: 'var(--text-error)' }}>
          ⚠️ Connection error
        </span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div style={AvatarStackStyles.LoadingContainer} className={className}>
        <div style={AvatarStackStyles.LoadingDot} />
        <span style={AvatarStackStyles.StatusText}>Connecting...</span>
        <style>{`
          @keyframes loadingPulse {
            0%, 100% { opacity: 0.4; transform: scale(0.9); }
            50% { opacity: 1; transform: scale(1.1); }
          }
        `}</style>
      </div>
    );
  }

  if (!activeUsers || activeUsers.length === 0) {
    return showStatus ? (
      <div style={AvatarStackStyles.Container} className={className}>
        {showConnectedIndicator && (
          <div style={AvatarStackStyles.ConnectedIndicator}>
            <div style={AvatarStackStyles.ConnectedDot} />
            <span>Connected</span>
          </div>
        )}
        <span style={AvatarStackStyles.StatusText}>
          You're the only one here
        </span>
      </div>
    ) : null;
  }

  const visibleUsers = activeUsers.slice(0, maxVisible);
  const overflowUsers = activeUsers.slice(maxVisible);
  const overflowCount = overflowUsers.length;

  return (
    <div style={AvatarStackStyles.Container} className={className}>
      <div style={AvatarStackStyles.AvatarGroup}>
        {visibleUsers.map((user, index) => (
          <UserAvatar
            key={`${setlistId}-${user.userId}-${user.presenceKey || index}`}
            user={user}
            index={index}
            maxVisible={maxVisible}
            onClick={onUserClick}
          />
        ))}
        
        {overflowCount > 0 && (
          <OverflowIndicator
            count={overflowCount}
            users={overflowUsers}
            onClick={onUserClick}
          />
        )}
      </div>
      
      {showStatus && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {showConnectedIndicator && (
            <div style={AvatarStackStyles.ConnectedIndicator}>
              <div style={AvatarStackStyles.ConnectedDot} />
              <span>Live</span>
            </div>
          )}
          <span style={AvatarStackStyles.StatusText}>
            {activeUsers.length === 1 
              ? '1 collaborator' 
              : `${activeUsers.length} collaborators`
            }
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for headers/toolbars
 */
export function CompactAvatarStack({ setlistId, maxVisible = 3 }) {
  return (
    <AvatarStack 
      setlistId={setlistId}
      maxVisible={maxVisible}
      showStatus={false}
      showConnectedIndicator={true}
    />
  );
}

export default AvatarStack;