import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFeatureFlags } from '../../config/featureFlags';
import { theme } from '../../styles/theme';

const StyledHeader = {
  Header: { textAlign: 'center', marginTop: 0, color: theme.colors.text.primary }
};

export const AppHeader = React.memo(() => {
  const { currentUser, logout, userProfile } = useAuth();
  const { flags, toggle } = useFeatureFlags();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const togglePerformanceMode = () => {
    toggle('performanceMonitoring');
  };
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      padding: '0 1rem'
    }}>
      <h1 style={StyledHeader.Header}>Build Your Setlist</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Google Team Performance Toggle */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: flags.performanceMonitoring ? theme.colors.accent.green : theme.colors.bg.surface2,
            border: `1px solid ${flags.performanceMonitoring ? theme.colors.accent.green : theme.colors.border}`,
            borderRadius: theme.borderRadius.md,
            padding: '0.5rem 0.75rem',
            color: flags.performanceMonitoring ? 'white' : theme.colors.text.secondary,
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: '500'
          }}
          onClick={togglePerformanceMode}
          title="Toggle Google Team Performance Enhancements"
        >
          <span>{flags.performanceMonitoring ? '⚡' : '🐌'}</span>
          <span>{flags.performanceMonitoring ? 'PERFORMANCE' : 'STANDARD'}</span>
        </button>
        
        <div style={{ position: 'relative' }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: theme.colors.bg.surface2,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.md,
            padding: '0.5rem',
            color: theme.colors.text.primary,
            cursor: 'pointer'
          }}
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          {currentUser?.photoURL ? (
            <img 
              src={currentUser.photoURL} 
              alt="Profile" 
              style={{ width: '24px', height: '24px', borderRadius: '50%' }}
            />
          ) : (
            <i className="fas fa-user" style={{ width: '16px', textAlign: 'center' }}></i>
          )}
          <span>{userProfile?.displayName || currentUser?.email || 'Demo User'}</span>
          <i className="fas fa-chevron-down" style={{ fontSize: '0.8rem' }}></i>
        </button>
        
        {showUserMenu && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: theme.colors.bg.surface2,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.md,
            padding: '0.5rem 0',
            minWidth: '150px',
            zIndex: 1000,
            marginTop: '0.25rem'
          }}>
            <button
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.text.primary,
                padding: '0.5rem 1rem',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onClick={handleLogout}
            >
              <i className="fas fa-sign-out-alt" style={{ width: '16px' }}></i>
              Sign Out
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
});

AppHeader.displayName = 'AppHeader';