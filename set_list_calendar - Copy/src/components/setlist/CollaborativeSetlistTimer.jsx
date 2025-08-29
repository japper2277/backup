/**
 * CollaborativeSetlistTimer Component
 * 
 * Real-time collaborative timer that syncs target time and joke durations
 * across all connected users. Provides visual feedback for timing goals.
 */

import React from 'react';
import { useCollaborativeTimer } from '../../hooks/useCollaborativeTimer.js';
import { TimeInput } from '../ui/TimeInput.jsx';
import { CompactAvatarStack } from '../Collaboration/AvatarStack.jsx';
import { TimingAttributionFlash } from './TimingAttributionFlash.jsx';

const TimerStyles = {
  Container: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '1rem',
    margin: '1rem 0',
    position: 'sticky',
    top: '0',
    zIndex: 100,
    backdropFilter: 'blur(10px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  Header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid var(--border-color)'
  },
  HeaderTitle: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    margin: 0
  },
  Display: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
    gap: '1rem'
  },
  Section: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  Label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    minWidth: 'fit-content'
  },
  TimeDisplay: {
    fontSize: '1.125rem',
    fontWeight: 600,
    fontFamily: 'monospace',
    minWidth: '60px',
    textAlign: 'center'
  },
  Percentage: {
    fontSize: '0.875rem',
    fontWeight: 500,
    marginLeft: '0.5rem'
  },
  ProgressContainer: {
    height: '4px',
    background: 'var(--bg-surface-2)',
    borderRadius: '2px',
    overflow: 'visible',
    position: 'relative',
    marginBottom: '0.5rem'
  },
  ProgressBar: {
    height: '100%',
    transition: 'all 0.3s ease',
    borderRadius: '2px'
  },
  OverflowBar: {
    position: 'absolute',
    top: 0,
    left: '100%',
    height: '100%',
    background: '#ef4444',
    opacity: 0.7,
    borderRadius: '2px'
  },
  Stats: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)'
  },
  Status: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  StatusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0
  },
  LoadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    color: 'var(--text-secondary)'
  },
  ErrorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    color: '#ef4444',
    fontSize: '0.875rem'
  },
  DisabledOverlay: {
    position: 'relative',
    opacity: 0.6,
    pointerEvents: 'none'
  }
};

// Animation keyframes for pulsing effect
const pulseKeyframes = `
  @keyframes pulse-timer {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
`;

export const CollaborativeSetlistTimer = ({ setlistId, className }) => {
  const {
    totalTime,
    targetTime,
    difference,
    isOverTime,
    isCloseToTarget,
    percentOfTarget,
    jokeCount,
    loading,
    error,
    connected,
    canEdit,
    isUpdatingTarget,
    setTargetTime,
    formatTime,
    getUsersEditingTargetTime,
    startEditingTargetTime,
    clearCurrentlyEditing
  } = useCollaborativeTimer(setlistId);

  // Add CSS animations to the page
  React.useEffect(() => {
    const styleId = 'collaborative-timer-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = pulseKeyframes;
      document.head.appendChild(style);
    }
  }, []);

  if (loading) {
    return (
      <div style={TimerStyles.Container} className={className}>
        <div style={TimerStyles.LoadingContainer}>
          <div style={{ marginRight: '0.5rem' }}>⏳</div>
          Loading timer...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={TimerStyles.Container} className={className}>
        <div style={TimerStyles.ErrorContainer}>
          ⚠️ Connection error: {error.message}
        </div>
      </div>
    );
  }

  // Determine colors and status
  const getTimerColor = () => {
    if (isOverTime) return '#ef4444'; // red
    if (isCloseToTarget) return '#f59e0b'; // amber
    return '#10b981'; // green
  };

  const getStatusInfo = () => {
    if (!connected) return { text: 'Offline', color: '#6b7280' };
    if (isUpdatingTarget) return { text: 'Syncing...', color: '#f59e0b' };
    return { text: 'Live', color: '#10b981' };
  };

  const timerColor = getTimerColor();
  const statusInfo = getStatusInfo();
  
  // Get users currently editing target time for visual feedback
  const targetTimeEditors = getUsersEditingTargetTime();
  const isTargetTimeBeingEdited = targetTimeEditors.length > 0;

  const containerStyle = canEdit ? TimerStyles.Container : {
    ...TimerStyles.Container,
    ...TimerStyles.DisabledOverlay
  };

  return (
    <div style={containerStyle} className={className}>
      {/* Timer Header with Collaborators */}
      <div style={TimerStyles.Header}>
        <h4 style={TimerStyles.HeaderTitle}>
          ⏱️ Set Timer
        </h4>
        <CompactAvatarStack 
          setlistId={setlistId}
          maxVisible={3}
        />
      </div>

      {/* Main Timer Display */}
      <div style={TimerStyles.Display}>
        {/* Target Time Section */}
        <div style={TimerStyles.Section}>
          <span style={TimerStyles.Label}>Target:</span>
          <div style={{ position: 'relative' }}>
            <TimeInput 
              value={targetTime}
              onChange={setTargetTime}
              max={7200} // 2 hours max
              disabled={!canEdit || isUpdatingTarget}
              placeholder="5:00"
              onFocus={() => canEdit && startEditingTargetTime()}
              onBlur={() => canEdit && clearCurrentlyEditing()}
              style={{
                borderColor: isTargetTimeBeingEdited ? '#f59e0b' : undefined,
                boxShadow: isTargetTimeBeingEdited ? '0 0 0 2px rgba(245, 158, 11, 0.2)' : undefined
              }}
            />
            {/* Visual indicator when others are editing */}
            {isTargetTimeBeingEdited && (
              <div style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#f59e0b',
                border: '2px solid var(--bg-surface)',
                animation: 'pulse-timer 2s infinite'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-10px',
                  whiteSpace: 'nowrap',
                  fontSize: '0.7rem',
                  color: '#f59e0b',
                  fontWeight: 600,
                  pointerEvents: 'none'
                }}>
                  {targetTimeEditors[0]?.displayName || 'Someone'} editing
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Total Time Section */}
        <div style={TimerStyles.Section}>
          <span style={TimerStyles.Label}>Total:</span>
          <span 
            style={{
              ...TimerStyles.TimeDisplay,
              color: timerColor
            }}
          >
            {formatTime(totalTime)}
          </span>
          {targetTime > 0 && (
            <span 
              style={{
                ...TimerStyles.Percentage,
                color: timerColor
              }}
            >
              ({Math.round(percentOfTarget)}%)
            </span>
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div style={TimerStyles.ProgressContainer}>
        <div 
          style={{
            ...TimerStyles.ProgressBar,
            width: `${Math.min(percentOfTarget, 100)}%`,
            backgroundColor: timerColor
          }}
        />
        {/* Overflow indicator */}
        {isOverTime && (
          <div 
            style={{
              ...TimerStyles.OverflowBar,
              width: `${Math.min((percentOfTarget - 100), 50)}%`,
              animation: 'pulse-timer 2s infinite'
            }}
          />
        )}
      </div>
      
      {/* Stats and Status */}
      <div style={TimerStyles.Stats}>
        <div>
          {jokeCount} {jokeCount === 1 ? 'joke' : 'jokes'}
          {targetTime > 0 && (
            <span style={{ marginLeft: '1rem' }}>
              {isOverTime ? '+' : ''}{formatTime(Math.abs(difference))} vs target
            </span>
          )}
        </div>
        
        <div style={TimerStyles.Status}>
          <div 
            style={{
              ...TimerStyles.StatusDot,
              backgroundColor: statusInfo.color
            }}
          />
          <span>{statusInfo.text}</span>
        </div>
      </div>

      {/* Read-only indicator for non-editors */}
      {!canEdit && (
        <div style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          background: 'var(--bg-surface-2)',
          padding: '0.25rem 0.5rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          👁️ View Only
        </div>
      )}

      {/* Attribution Flash System - Simplified for now */}
      {/* <TimingAttributionFlash setlistId={setlistId} /> */}
    </div>
  );
};

export default CollaborativeSetlistTimer;