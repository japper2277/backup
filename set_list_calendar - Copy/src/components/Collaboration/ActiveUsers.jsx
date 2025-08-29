import React from 'react';

const ActiveUsersStyles = {
  Container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  UserList: {
    display: 'flex',
    gap: '0.25rem'
  },
  UserAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'var(--accent-green)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: 600,
    border: '2px solid var(--bg-surface)',
    position: 'relative',
    cursor: 'pointer',
    transition: 'transform 0.2s ease'
  },
  OnlineIndicator: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--accent-green)',
    border: '1px solid var(--bg-surface)'
  },
  Tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--bg-surface-2)',
    color: 'var(--text-primary)',
    padding: '0.5rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    marginBottom: '0.25rem',
    border: '1px solid var(--border-color)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
  },
  Count: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 500
  },
  LoadingDot: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: 'var(--accent-green)',
    animation: 'pulse 1.5s ease-in-out infinite'
  }
};

function UserAvatar({ user, index }) {
  const [showTooltip, setShowTooltip] = React.useState(false);
  
  const getUserInitials = (user) => {
    if (user.userName && user.userName !== 'Anonymous') {
      return user.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user.userEmail) {
      return user.userEmail[0].toUpperCase();
    }
    return '?';
  };

  const getAvatarColor = (userId) => {
    // Generate a consistent color based on user ID
    const colors = [
      'var(--accent-green)',
      'var(--accent-blue)', 
      'var(--accent-orange)',
      '#9333ea', // purple
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#84cc16', // lime
      '#f59e0b'  // amber
    ];
    
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      style={{
        ...ActiveUsersStyles.UserAvatar,
        background: getAvatarColor(user.userId),
        zIndex: 100 - index, // Stack avatars properly
        marginLeft: index > 0 ? '-8px' : '0',
        transform: showTooltip ? 'scale(1.1)' : 'scale(1)'
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {user.userPhotoURL ? (
        <img 
          src={user.userPhotoURL} 
          alt={user.userName || 'User'} 
          style={{ width: '100%', height: '100%', borderRadius: '50%' }}
        />
      ) : (
        getUserInitials(user)
      )}
      
      <div style={ActiveUsersStyles.OnlineIndicator} />
      
      {showTooltip && (
        <div style={ActiveUsersStyles.Tooltip}>
          {user.userName || 'Anonymous'} • Active now
        </div>
      )}
    </div>
  );
}

export function ActiveUsers({ users, loading, showCount = true }) {
  const maxVisible = 5;
  const visibleUsers = users.slice(0, maxVisible);
  const extraCount = Math.max(0, users.length - maxVisible);

  if (loading) {
    return (
      <div style={ActiveUsersStyles.Container}>
        <div style={ActiveUsersStyles.LoadingDot} />
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <div style={ActiveUsersStyles.Container}>
      <div style={ActiveUsersStyles.UserList}>
        {visibleUsers.map((user, index) => (
          <UserAvatar key={user.userId} user={user} index={index} />
        ))}
        
        {extraCount > 0 && (
          <div
            style={{
              ...ActiveUsersStyles.UserAvatar,
              background: 'var(--bg-surface-2)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              marginLeft: '-8px',
              fontSize: '0.6rem'
            }}
          >
            +{extraCount}
          </div>
        )}
      </div>
      
      {showCount && users.length > 0 && (
        <span style={ActiveUsersStyles.Count}>
          {users.length === 1 ? '1 user' : `${users.length} users`} online
        </span>
      )}
    </div>
  );
}

export function CollaborationIndicator({ setlistId, isOwner }) {
  const [showDetails, setShowDetails] = React.useState(false);
  
  if (!setlistId) return null;
  
  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.25rem 0.5rem',
          background: isOwner ? 'var(--accent-green)' : 'var(--accent-blue)',
          color: 'white',
          borderRadius: '12px',
          fontSize: '0.7rem',
          fontWeight: 500,
          cursor: 'pointer'
        }}
        onClick={() => setShowDetails(!showDetails)}
      >
        <i className={`fas fa-${isOwner ? 'crown' : 'users'}`} />
        {isOwner ? 'Owner' : 'Collaborator'}
        <i className={`fas fa-chevron-${showDetails ? 'up' : 'down'}`} style={{ fontSize: '0.6rem' }} />
      </div>
      
      {showDetails && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          background: 'var(--bg-surface-2)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '0.75rem',
          marginTop: '0.25rem',
          minWidth: '200px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {isOwner ? 'You own this setlist' : 'Shared setlist'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {isOwner 
              ? 'You can edit, share, and manage collaborators'
              : 'Click jokes to comment and collaborate'
            }
          </div>
        </div>
      )}
    </div>
  );
}