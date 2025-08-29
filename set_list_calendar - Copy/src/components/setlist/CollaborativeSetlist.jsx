/**
 * CollaborativeSetlist - Real-time collaborative setlist component
 * 
 * Replaces the static Setlist component with real-time Firebase collaboration.
 * Multiple users can simultaneously edit jokes with instant updates.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect';
import { auth } from '../../firebase/config.js';
import { useCollaborativeSetlist } from '../../hooks/useCollaborativeSetlist.js';
import { useMockCollaborativeSetlist } from '../../hooks/useMockCollaborativeSetlist.js';
import { AvatarStack, CompactAvatarStack } from '../Collaboration/AvatarStack.jsx';
import { Modal } from '../common';
import { ShareModal } from '../Sharing/ShareModal';
import { CreateSetlistForm } from '../forms';
import { PerformanceMode } from '../performance';
import { SetlistItem } from './SetlistItem';
import { SetlistSkeleton } from '../common/SkeletonLoader';
import { CollaborativeSetlistTimer } from './CollaborativeSetlistTimer.jsx';
import { JokeCommentModal } from '../comments/JokeCommentModal.jsx';
import { theme } from '../../styles/theme';

const CollaborativeSetlistStyles = {
  Panel: { 
    background: theme.colors.bg.main, 
    display: 'flex', 
    flexDirection: 'column' 
  },
  PanelHeader: { 
    padding: '0.75rem 1rem', 
    borderBottom: `1px solid ${theme.colors.border}`, 
    background: theme.colors.bg.surface2, 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    flexShrink: 0 
  },
  PanelTitle: { 
    margin: 0, 
    fontSize: '0.9rem', 
    color: theme.colors.text.primary, 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.5rem' 
  },
  Setlist: (isDragOver, syncing) => ({ 
    flex: 1, 
    overflowY: 'auto', 
    overflowX: 'hidden',
    padding: '0.5rem', 
    transition: 'all 0.2s', 
    backgroundColor: isDragOver ? 'rgba(69, 163, 255, 0.05)' : 'transparent',
    opacity: syncing ? 0.8 : 1,
    position: 'relative',
    maxHeight: '600px',
    scrollBehavior: 'smooth'
  }),
  SyncIndicator: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    background: 'rgba(16, 185, 129, 0.9)',
    color: 'white',
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.7rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    zIndex: 10
  },
  ConnectionStatus: (connected, error) => ({
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.7rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    background: error ? '#ef4444' : connected ? '#10b981' : '#f59e0b',
    color: 'white'
  }),
  Button: (variant = 'primary') => ({
    background: variant === 'primary' ? theme.colors.accent.blue : 
                variant === 'secondary' ? theme.colors.accent.orange :
                variant === 'success' ? theme.colors.accent.green : theme.colors.bg.surface2,
    color: variant === 'ghost' ? theme.colors.text.primary : 'white',
    border: variant === 'ghost' ? `1px solid ${theme.colors.border}` : 'none',
    borderRadius: '4px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.7rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    transition: 'all 0.2s',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      transform: 'none'
    }
  }),
  ErrorAlert: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    padding: '0.75rem',
    margin: '0.5rem',
    color: '#991b1b',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  EmptyState: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    marginTop: '4rem',
    padding: '2rem'
  }
};

/**
 * Unified Draggable Joke Card for consistent visual design
 */
const UnifiedJokeCard = ({ joke, isDragging, isOverlay = false, showPosition = false, position, editingUsers = [], canEdit, onJokeClick, onJokeDelete }) => {
  const style = {
    background: isDragging ? '#1a1a1a' : '#2a2a2a',
    border: `2px solid ${isDragging ? '#1DB954' : '#404040'}`,
    borderRadius: '12px',
    padding: '1.25rem 1.5rem',
    marginBottom: '1rem',
    cursor: isDragging ? 'grabbing' : 'grab',
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    transition: isDragging ? 'none' : 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    userSelect: 'none',
    opacity: isDragging && !isOverlay ? 0.7 : 1,
    transform: isOverlay ? 'rotate(2deg) scale(1.03)' : isDragging ? 'scale(1.02)' : 'none',
    boxShadow: isOverlay 
      ? '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 15px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(29, 185, 84, 0.3)'
      : isDragging 
      ? '0 8px 16px rgba(29, 185, 84, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2)'
      : '0 4px 8px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
    position: 'relative',
    overflow: 'hidden'
  };

  return (
    <div 
      style={style}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.25), 0 4px 8px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.target.style.transform = 'none';
          e.target.style.boxShadow = style.boxShadow;
        }
      }}
    >
      {/* Drag indicator line */}
      {isDragging && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #1DB954, #10b981, #1DB954)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s ease-in-out infinite'
        }} />
      )}
      
      {showPosition && (
        <div style={{
          background: isDragging ? '#10b981' : '#1DB954',
          color: 'white',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          fontWeight: '700',
          flexShrink: 0,
          transition: 'all 0.2s ease',
          boxShadow: isDragging ? '0 4px 8px rgba(29, 185, 84, 0.4)' : '0 2px 4px rgba(29, 185, 84, 0.2)',
          transform: isDragging ? 'scale(1.1)' : 'scale(1)'
        }}>
          {position}
        </div>
      )}
      
      <div 
        style={{
          flex: 1,
          color: '#ffffff',
          fontSize: '1rem',
          fontWeight: 500,
          cursor: onJokeClick ? 'pointer' : 'grab'
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onJokeClick) onJokeClick(joke);
        }}
      >
        {joke.title}
        {editingUsers?.length > 0 && (
          <div style={{
            fontSize: '0.7rem',
            color: theme.colors.accent.blue,
            marginTop: '0.25rem'
          }}>
            {editingUsers.map(user => user.name).join(', ')} editing...
          </div>
        )}
      </div>
      
      {canEdit && onJokeDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onJokeDelete(joke.id);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          style={{
            background: '#ef4444',
            border: '2px solid #dc2626',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: '700',
            padding: '0.4rem 0.6rem',
            borderRadius: '8px',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
            minWidth: '55px',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#dc2626';
            e.target.style.transform = 'translateY(-2px) scale(1.05)';
            e.target.style.boxShadow = '0 6px 12px rgba(239, 68, 68, 0.4)';
            e.target.style.borderColor = '#b91c1c';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#ef4444';
            e.target.style.transform = 'translateY(0) scale(1)';
            e.target.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)';
            e.target.style.borderColor = '#dc2626';
          }}
          onMouseDown={(e) => {
            e.target.style.transform = 'translateY(0) scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.target.style.transform = 'translateY(-2px) scale(1.05)';
          }}
          title="Delete joke from setlist"
        >
          <span style={{ position: 'relative', zIndex: 1 }}>🗑️</span>
        </button>
      )}
      
      <div style={{
        color: '#888',
        fontSize: '1.5rem',
        opacity: 0.6,
        cursor: 'grab',
        padding: '0.5rem',
        borderRadius: '6px',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '32px',
        minHeight: '32px'
      }}
      onMouseEnter={(e) => {
        e.target.style.opacity = '1';
        e.target.style.color = '#1DB954';
        e.target.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.target.style.opacity = '0.6';
        e.target.style.color = '#888';
        e.target.style.transform = 'scale(1)';
      }}
      title="Drag to reorder"
      >
        ⋮⋮
      </div>
    </div>
  );
};

/**
 * Sortable setlist item using @dnd-kit/sortable for reordering
 */
const SortableSetlistItem = ({ joke, position, editingUsers, canEdit, onJokeClick, onJokeDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `setlist-${joke.id}`,
    data: {
      type: 'setlist-joke',
      joke,
      position
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <UnifiedJokeCard 
        joke={joke}
        isDragging={isDragging}
        showPosition={true}
        position={position}
        editingUsers={editingUsers}
        canEdit={canEdit}
        onJokeClick={onJokeClick}
        onJokeDelete={onJokeDelete}
      />
    </div>
  );
};

/**
 * Droppable zone for bank-to-setlist drops with unified styling
 */
const UnifiedDroppableZone = ({ children, isEmpty }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'collaborative-setlist-droppable',
    data: {
      type: 'setlist-zone'
    }
  });

  const style = {
    background: isOver 
      ? 'linear-gradient(90deg, rgba(29, 185, 84, 0.1) 0%, rgba(29, 185, 84, 0.2) 50%, rgba(29, 185, 84, 0.1) 100%)'
      : 'transparent',
    borderRadius: '12px',
    padding: '1.5rem',
    border: isOver ? '2px dashed #1DB954' : isEmpty ? '1px solid #333' : '2px dashed transparent',
    minHeight: isEmpty ? '200px' : '50px',
    transition: 'all 350ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
      {isOver && (
        <div style={{
          textAlign: 'center',
          color: '#1DB954',
          fontSize: '0.9rem',
          fontWeight: 600,
          opacity: 0.8,
          marginTop: '1rem'
        }}>
          Drop here to add to setlist ✨
        </div>
      )}
    </div>
  );
};

export const CollaborativeSetlist = React.memo(({ setlistId: propSetlistId }) => {
  // Use demo setlist ID if none provided
  const defaultSetlistId = propSetlistId || 'demo-setlist-123';
  
  const collaborativeData = useCollaborativeSetlist(defaultSetlistId);
  

  
  const {
    // State
    jokes,
    setlist,
    loading,
    error,
    connected,
    syncing,
    
    // Presence
    activeUsers,
    isConnectedToPresence,
    
    // Actions
    addJoke,
    editJoke,
    removeJoke,
    reorderSetlistJokes,
    shareSetlistWith,
    clearError,
    retry,
    
    // Presence actions
    updateCurrentlyEditing,
    clearCurrentlyEditing,
    getUsersEditingJoke,
    
    // Permissions
    isOwner,
    canEdit,
    canComment
  } = collaborativeData;
  
  const [isPerfMode, setPerfMode] = useState(false);
  
  // Helper function to check if user can edit (including demo mode)
  const canUserEdit = useMemo(() => {
    const isDemoMode = !auth.currentUser || 
                      auth.currentUser.displayName === 'Demo User' || 
                      auth.currentUser.isAnonymous ||
                      defaultSetlistId === 'demo-setlist-123';
    return canEdit || isDemoMode;
  }, [canEdit, defaultSetlistId]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedJoke, setSelectedJoke] = useState(null);
  
  // Calculate stats
  const stats = useMemo(() => {
    const totalJokes = jokes.length;
    const totalSeconds = jokes.reduce((sum, joke) => sum + (joke?.estimatedDuration || 30), 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return {
      count: `${totalJokes} ${totalJokes === 1 ? 'joke' : 'jokes'}`,
      duration: `${minutes}:${seconds.toString().padStart(2, '0')}`
    };
  }, [jokes]);

  // Handler functions moved to useMemo for stable references

  // Stable handler references to prevent infinite re-renders
  const stableHandlers = useMemo(() => ({
    handleBankToSetlistDrop: async (jokeData) => {
      if (!canUserEdit) return;
      
      try {
        console.log('✅ CollaborativeSetlist: Adding joke to setlist:', jokeData.title);
        
        // Add the full joke to the setlist
        await addJoke({
          id: jokeData.id,
          title: jokeData.title,
          text: jokeData.text || '',
          setup: jokeData.setup || '',
          punchline: jokeData.punchline || '',
          jokeType: jokeData.jokeType || 'Observational',
          readinessStatus: jokeData.readinessStatus || 'Idea',
          isClean: jokeData.isClean || false,
          estimated_duration: jokeData.estimated_duration || 30,
          tags: jokeData.tags || [],
          notes: jokeData.notes || ''
        });
        
        console.log('🎉 Unified: Joke added to Firebase setlist successfully!');
      } catch (error) {
        console.error('💥 Error adding joke to setlist:', error);
      }
    },
    
    handleSetlistReorder: async (activeId, overId) => {
      if (!canUserEdit) return;
      
      try {
        // Remove prefixes to get actual joke IDs
        const actualActiveId = activeId.replace('setlist-', '');
        const actualOverId = overId.replace('setlist-', '');
        
        // Get current jokes from the latest state
        const currentJokes = jokes || [];
        const activeIndex = currentJokes.findIndex(joke => joke.id === actualActiveId);
        const overIndex = currentJokes.findIndex(joke => joke.id === actualOverId);
        
        if (activeIndex !== -1 && overIndex !== -1) {
          console.log('🔄 Reordering setlist via Firebase:', {
            from: activeIndex,
            to: overIndex,
            activeJoke: currentJokes[activeIndex]?.title
          });
          
          // Create new order array
          const newOrder = arrayMove(currentJokes, activeIndex, overIndex);
          const newJokeIds = newOrder.map(joke => joke.id);
          
          // Call Firebase reorder if available
          if (typeof reorderSetlistJokes === 'function') {
            await reorderSetlistJokes(newJokeIds);
            console.log('🎉 Unified: Setlist reordered via Firebase successfully!');
          } else {
            console.log('⚠️ Unified: No reorder function available, optimistic update only');
          }
        }
      } catch (error) {
        console.error('💥 Error reordering setlist:', error);
      }
    }
  }), [canUserEdit, addJoke, reorderSetlistJokes, jokes]);

  // Expose handlers to parent via useEffect - stable reference
  useIsomorphicLayoutEffect(() => {
    // Use persistent flag to prevent multiple registration logs
    if (!window._collaborativeHandlersRegistered) {
      console.log('🔧 Registering collaborative setlist handlers');
      window._collaborativeHandlersRegistered = true;
    }
    
    window.collaborativeSetlistHandlers = stableHandlers;
    
    // Announce handlers are ready
    window.dispatchEvent(new CustomEvent('collaborativeSetlistHandlersReady', {
      detail: { setlistId: defaultSetlistId }
    }));
  }, [stableHandlers, defaultSetlistId]);
  
  // Separate cleanup effect that only runs on unmount
  useEffect(() => {
    return () => {
      console.log('🗑️ Cleaning up collaborative setlist handlers on unmount');
      if (window.collaborativeSetlistHandlers) {
        delete window.collaborativeSetlistHandlers;
      }
    };
  }, []);
  
  const handleJokeClick = useCallback((joke) => {
    if (!canComment && !canUserEdit) return;
    
    setSelectedJoke(joke);
    setShowCommentModal(true);
    updateCurrentlyEditing?.(joke.id);
  }, [canComment, canUserEdit, updateCurrentlyEditing]);

  const handleJokeEdit = useCallback(async (jokeId, updates) => {
    if (!canUserEdit) return;
    
    try {
      updateCurrentlyEditing?.(jokeId);
      await editJoke(jokeId, updates);
    } catch (error) {
      console.error('Error editing joke:', error);
    } finally {
      // Clear after a delay to show the edit indicator briefly
      setTimeout(() => clearCurrentlyEditing?.(), 2000);
    }
  }, [canUserEdit, editJoke, updateCurrentlyEditing, clearCurrentlyEditing]);

  const handleJokeDelete = useCallback(async (jokeId) => {
    if (!canUserEdit) return;
    
    try {
      await removeJoke(jokeId);
    } catch (error) {
      console.error('Error deleting joke:', error);
    }
  }, [canUserEdit, removeJoke]);

  const handleDurationChange = useCallback(async (jokeId, newDuration) => {
    if (!canUserEdit) return;
    
    try {
      updateCurrentlyEditing?.(jokeId);
      await editJoke(jokeId, { estimated_duration: newDuration });
    } catch (error) {
      console.error('Error updating joke duration:', error);
    } finally {
      // Clear editing indicator after a brief moment
      setTimeout(() => clearCurrentlyEditing?.(), 1000);
    }
  }, [canUserEdit, editJoke, updateCurrentlyEditing, clearCurrentlyEditing]);

  // Connection status indicator
  const renderConnectionStatus = () => {
    if (error) {
      return (
        <div style={CollaborativeSetlistStyles.ConnectionStatus(false, true)}>
          <i className="fas fa-exclamation-triangle" />
          <span>Connection Error</span>
          <button 
            onClick={retry}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer',
              marginLeft: '0.25rem'
            }}
          >
            <i className="fas fa-redo" />
          </button>
        </div>
      );
    }
    
    if (!connected) {
      return (
        <div style={CollaborativeSetlistStyles.ConnectionStatus(false, false)}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: 'currentColor',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
          <span>Connecting...</span>
        </div>
      );
    }

    return (
      <div style={CollaborativeSetlistStyles.ConnectionStatus(true, false)}>
        <i className="fas fa-check-circle" />
        <span>Live</span>
      </div>
    );
  };

  if (loading && !jokes.length) {
    return (
      <div style={CollaborativeSetlistStyles.Panel}>
        <div style={CollaborativeSetlistStyles.PanelHeader}>
          <h4 style={CollaborativeSetlistStyles.PanelTitle}>
            <i className="fas fa-list"></i> 
            {setlist?.title || 'Loading...'}
          </h4>
          {renderConnectionStatus()}
        </div>
        <SetlistSkeleton />
      </div>
    );
  }

  return (
    <div style={CollaborativeSetlistStyles.Panel}>
        {isPerfMode && (
          <PerformanceMode 
            jokes={jokes} 
            onExit={() => setPerfMode(false)} 
          />
        )}
      
      <div style={CollaborativeSetlistStyles.PanelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h4 style={CollaborativeSetlistStyles.PanelTitle}>
            <i className="fas fa-list"></i> 
            {setlist?.title || 'Collaborative Setlist'}
          </h4>
          
          {/* Real-time collaboration indicator */}
          <CompactAvatarStack setlistId={defaultSetlistId} maxVisible={3} />
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          fontSize: '0.8rem', 
          alignItems: 'center' 
        }}>
          {/* Connection status */}
          {renderConnectionStatus()}
          
          {/* Stats */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            color: theme.colors.text.secondary 
          }}>
            <span>{stats.count}</span>
            <span>{stats.duration}</span>
          </div>
          
          {/* Action buttons */}
          {isOwner && (
            <button
              style={CollaborativeSetlistStyles.Button('secondary')}
              onClick={() => setShowShareModal(true)}
              title="Share setlist"
            >
              <i className="fas fa-share" />
              Share
            </button>
          )}
          
          {jokes.length > 0 && (
            <button 
              style={CollaborativeSetlistStyles.Button('success')}
              onClick={() => setPerfMode(true)}
            >
              <i className="fas fa-play" />
              Perform
            </button>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div style={CollaborativeSetlistStyles.ErrorAlert}>
          <i className="fas fa-exclamation-triangle" />
          <div>
            <strong>Connection Error:</strong> {error.message}
            <button 
              onClick={clearError}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'inherit',
                cursor: 'pointer',
                marginLeft: '0.5rem'
              }}
            >
              <i className="fas fa-times" />
            </button>
          </div>
        </div>
      )}

      {/* Collaborative Timer */}
      <CollaborativeSetlistTimer 
        setlistId={defaultSetlistId}
        className="collaborative-timer"
      />
      
        <div style={CollaborativeSetlistStyles.Setlist(false, syncing)}>
          <UnifiedDroppableZone isEmpty={jokes.length === 0}>
            {/* Sync indicator */}
            {syncing && (
              <div style={CollaborativeSetlistStyles.SyncIndicator}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: 'currentColor',
                  animation: 'spin 1s linear infinite'
                }} />
                <span>Syncing...</span>
              </div>
            )}
            
            {jokes.length > 0 ? (
              <>
                
                <SortableContext 
                  items={jokes.map(joke => `setlist-${joke.id}`)} 
                  strategy={verticalListSortingStrategy}
                >
                  {jokes.map((joke, index) => {
                    const editingUsers = getUsersEditingJoke?.(joke.id) || [];
                    
                    return (
                      <SortableSetlistItem 
                        key={`setlist-${joke.id}`} 
                        joke={joke} 
                        position={index + 1}
                        editingUsers={editingUsers}
                        canEdit={canUserEdit}
                        onJokeClick={handleJokeClick}
                        onJokeDelete={handleJokeDelete}
                      />
                    );
                  })}
                </SortableContext>
              </>
            ) : (
              <div style={CollaborativeSetlistStyles.EmptyState}>
                {canUserEdit ? (
                  <>
                    <i className="fas fa-list" style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem' }} />
                    <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                      Your setlist is empty
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                      Drag jokes here to build your setlist
                    </div>
                  </>
                ) : (
                  <>
                    <i className="fas fa-eye" style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem' }} />
                    <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                      This setlist is empty
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                      Wait for the owner to add jokes
                    </div>
                  </>
                )}
              </div>
            )}
          </UnifiedDroppableZone>
        </div>
      
      {/* Share Modal */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)}>
        <ShareModal 
          setlist={setlist}
          onClose={() => setShowShareModal(false)}
          onShare={async (userId, permission) => {
            try {
              await shareSetlistWith(userId, permission);
            } catch (error) {
              console.error('Error sharing setlist:', error);
            }
          }}
        />
      </Modal>
      
      {/* Comment Modal */}
      <JokeCommentModal
        joke={selectedJoke}
        setlistId={defaultSetlistId}
        isOpen={showCommentModal}
        collaborators={activeUsers}
        onClose={() => {
          setShowCommentModal(false);
          setSelectedJoke(null);
          clearCurrentlyEditing?.();
        }}
      />
      
      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
          40%, 43% { transform: translate3d(0,-8px,0); }
          70% { transform: translate3d(0,-4px,0); }
          90% { transform: translate3d(0,-2px,0); }
        }
      `}</style>
      </div>
  );
});

CollaborativeSetlist.displayName = 'CollaborativeSetlist';

export default CollaborativeSetlist;