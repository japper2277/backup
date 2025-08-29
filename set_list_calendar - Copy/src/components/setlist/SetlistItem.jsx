import React, { useState } from 'react';
import { TimeInput } from '../ui/TimeInput.jsx';
import { theme } from '../../styles/theme';
import { useSetlistPresence } from '../../hooks/usePresence.js';
import { showTimingChange } from './TimingAttributionFlash.jsx';

const StyledSetlistItem = {
  SetlistItem: { 
    background: theme.colors.bg.surface, 
    border: `1px solid ${theme.colors.border}`, 
    borderRadius: theme.borderRadius.md, 
    padding: theme.spacing.md, 
    marginBottom: theme.spacing.sm, 
    transition: 'all 0.3s ease', 
    display: 'flex', 
    alignItems: 'center', 
    gap: theme.spacing.md, 
    cursor: 'grab' 
  },
  SetlistNumber: { 
    background: theme.colors.accent.green, 
    color: 'white', 
    borderRadius: '50%', 
    width: '24px', 
    height: '24px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontSize: '0.8rem', 
    fontWeight: 600, 
    flexShrink: 0 
  },
  SetlistItemContent: { 
    flex: 1, 
    color: theme.colors.text.primary, 
    fontSize: '0.95rem' 
  },
  DurationSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0
  },
  DurationDisplay: {
    fontSize: '0.8rem',
    color: theme.colors.text.secondary,
    fontFamily: 'monospace',
    minWidth: '45px',
    textAlign: 'center'
  },
  CommentIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.75rem',
    color: theme.colors.text.secondary,
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    transition: 'all 0.2s ease'
  },
  CommentIndicatorActive: {
    backgroundColor: theme.colors.accent.blue + '20',
    color: theme.colors.accent.blue
  }
};

export const SetlistItem = React.memo(({ 
  joke, 
  position, 
  setlistId, 
  isSharedSetlist, 
  canEdit = true,
  onJokeClick, 
  onDurationChange,
  ...dragProps 
}) => {
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  
  // Get presence information for this joke
  const {
    getUsersEditingDuration,
    startEditingJokeDuration,
    clearCurrentlyEditing
  } = useSetlistPresence(setlistId);
  
  const durationEditors = getUsersEditingDuration(joke.id);
  const isBeingEditedByOthers = durationEditors.length > 0;

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClick = (e) => {
    // Prevent dragging when clicking comment indicator
    if (e.target.closest('.comment-indicator')) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // In shared setlists, clicking opens comments instead of dragging
    if (isSharedSetlist && onJokeClick) {
      e.preventDefault();
      onJokeClick(joke);
    }
  };

  const handleCommentClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onJokeClick) {
      onJokeClick(joke);
    }
  };

  const handleDurationClick = (e) => {
    e.stopPropagation();
    if (canEdit && !isSharedSetlist) {
      setIsEditingDuration(true);
      startEditingJokeDuration(joke.id);
    }
  };

  const handleDurationChange = (newDuration) => {
    if (onDurationChange) {
      onDurationChange(joke.id, newDuration);
      
      // Show attribution flash for duration change
      showTimingChange(
        { userId: 'current-user', displayName: 'You' },
        'joke-duration',
        {
          newValue: newDuration,
          jokeId: joke.id,
          jokeTitle: joke.title || joke.text
        }
      );
    }
    setIsEditingDuration(false);
    clearCurrentlyEditing();
  };

  const handleDurationBlur = () => {
    setIsEditingDuration(false);
    clearCurrentlyEditing();
  };
  
  return (
    <div 
      style={{
        ...StyledSetlistItem.SetlistItem,
        cursor: isSharedSetlist ? 'pointer' : 'grab'
      }} 
      draggable={!isSharedSetlist} 
      onClick={handleClick}
      {...(isSharedSetlist ? {} : dragProps)}
    >
      <div style={StyledSetlistItem.SetlistNumber}>{position}</div>
      <div style={StyledSetlistItem.SetlistItemContent}>
        {joke.title || joke.text}
      </div>

      {/* Comment Indicator (for shared setlists) */}
      {isSharedSetlist && (
        <div 
          className="comment-indicator"
          style={{
            ...StyledSetlistItem.CommentIndicator,
            ...(joke.commentCount > 0 ? StyledSetlistItem.CommentIndicatorActive : {})
          }}
          onClick={handleCommentClick}
          title={joke.commentCount > 0 ? 
            `${joke.commentCount} comment${joke.commentCount === 1 ? '' : 's'}` : 
            'Add comment'
          }
        >
          💬
          {joke.commentCount > 0 && (
            <span>{joke.commentCount}</span>
          )}
        </div>
      )}
      
      {/* Duration Section */}
      <div style={{ ...StyledSetlistItem.DurationSection, position: 'relative' }}>
        {isEditingDuration && canEdit ? (
          <TimeInput
            value={joke.estimated_duration || 60}
            onChange={handleDurationChange}
            onBlur={handleDurationBlur}
            autoFocus
            placeholder="1:00"
            style={{
              borderColor: isBeingEditedByOthers ? '#f59e0b' : undefined,
              boxShadow: isBeingEditedByOthers ? '0 0 0 2px rgba(245, 158, 11, 0.2)' : undefined
            }}
          />
        ) : (
          <div 
            style={{
              ...StyledSetlistItem.DurationDisplay,
              cursor: canEdit && !isSharedSetlist ? 'pointer' : 'default',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              backgroundColor: canEdit && !isSharedSetlist ? 'var(--bg-surface-2)' : 'transparent',
              border: isBeingEditedByOthers 
                ? '1px solid #f59e0b' 
                : (canEdit && !isSharedSetlist ? '1px solid transparent' : 'none'),
              boxShadow: isBeingEditedByOthers ? '0 0 0 2px rgba(245, 158, 11, 0.1)' : undefined
            }}
            onClick={handleDurationClick}
            onMouseEnter={(e) => {
              if (canEdit && !isSharedSetlist && !isBeingEditedByOthers) {
                e.target.style.borderColor = theme.colors.border;
              }
            }}
            onMouseLeave={(e) => {
              if (canEdit && !isSharedSetlist && !isBeingEditedByOthers) {
                e.target.style.borderColor = 'transparent';
              }
            }}
            title={
              isBeingEditedByOthers 
                ? `${durationEditors[0]?.displayName || 'Someone'} is editing duration`
                : (canEdit && !isSharedSetlist ? "Click to edit duration" : "")
            }
          >
            {formatTime(joke.estimated_duration || 60)}
          </div>
        )}
        
        {/* Visual indicator when others are editing duration */}
        {isBeingEditedByOthers && (
          <div style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#f59e0b',
            border: '2px solid var(--bg-surface)',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 1; }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
});

SetlistItem.displayName = 'SetlistItem';