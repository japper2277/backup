import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppState, useAppDispatch } from '../../contexts/AppContext';
import { useUserJokes, useSetlists } from '../../hooks/useFirestore';
import { useSetlistPresence } from '../../hooks/usePresence';
import { Modal } from '../common';
import { ShareModal } from '../Sharing/ShareModal';
import { CommentSidebar } from '../Comments/CommentSidebar';
import { ActiveUsers, CollaborationIndicator } from '../Collaboration/ActiveUsers';
import { CreateSetlistForm } from '../forms';
import { PerformanceMode } from '../performance';
import { SetlistSkeleton } from '../common/SkeletonLoader';
import { theme } from '../../styles/theme';
// Note: Drag and drop functionality removed - use UnifiedSetlist for full drag support

const StyledSetlist = {
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
  Setlist: (isDragOver) => ({ 
    flex: 1, 
    overflowY: 'auto', 
    padding: '0.5rem', 
    transition: 'background-color 0.2s', 
    backgroundColor: isDragOver ? 'rgba(69, 163, 255, 0.05)' : 'transparent' 
  }),
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
  PerformanceModeButton: { 
    background: theme.colors.accent.green, 
    color: 'white', 
    border: 'none', 
    padding: `${theme.spacing.sm} ${theme.spacing.md}`, 
    borderRadius: theme.borderRadius.sm, 
    cursor: 'pointer',
    fontSize: '0.7rem'
  }
};

export const Setlist = React.memo(() => {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  const { currentUser } = isDemoMode ? { currentUser: { uid: 'demo-user' } } : useAuth();
  const state = useAppState();
  const dispatch = useAppDispatch();
  
  // Demo mode: use local state instead of Firebase
  const jokes = isDemoMode ? state.jokes : useUserJokes().jokes;
  const jokesLoading = isDemoMode ? false : useUserJokes().loading;
  const firebaseSetlistHooks = isDemoMode ? {} : useSetlists();
  const setlists = isDemoMode ? [] : firebaseSetlistHooks.setlists || [];
  const createSetlist = isDemoMode ? (data) => Promise.resolve({ id: 'demo-setlist', ...data }) : firebaseSetlistHooks.createSetlist;
  const updateSetlist = isDemoMode ? () => Promise.resolve() : firebaseSetlistHooks.updateSetlist;
  const shareSetlist = isDemoMode ? () => Promise.resolve() : firebaseSetlistHooks.shareSetlist;
  
  const [isPerfMode, setPerfMode] = useState(false);
  const [currentSetlistId, setCurrentSetlistId] = useState(null);
  const [showCreateSetlist, setShowCreateSetlist] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedJoke, setSelectedJoke] = useState(null);
  // Refs removed - drag functionality moved to UnifiedSetlist component
  
  // Get current setlist or use local state as fallback
  const currentSetlist = currentSetlistId ? setlists.find(s => s.id === currentSetlistId) : null;
  
  // Check if current setlist is shared (not owned by current user)
  const isSharedSetlist = currentSetlist && currentSetlist.ownerId !== currentUser?.uid;
  const isOwner = currentSetlist && currentSetlist.ownerId === currentUser?.uid;
  
  // Use presence system for collaborative setlists (demo mode: mock data)
  const { activeUsers, loading: presenceLoading } = isDemoMode 
    ? { activeUsers: [{ id: 'demo-user', name: 'Demo User', color: '#1DB954' }], loading: false }
    : useSetlistPresence(currentSetlist?.id);
  const setlistJokeIds = currentSetlist ? currentSetlist.jokeIds : (state?.setlist?.map(item => item.id) || []);
  
  // Get joke objects for the setlist
  const setlistJokes = useMemo(() => {
    if (!jokes || !setlistJokeIds) return [];
    return setlistJokeIds.map(jokeId => jokes.find(joke => joke.id === jokeId)).filter(Boolean);
  }, [jokes, setlistJokeIds]);
  
  const stats = useMemo(() => {
    const totalJokes = setlistJokes.length;
    const totalSeconds = setlistJokes.reduce((sum, joke) => sum + (joke?.estimated_duration || 0), 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return {
      count: `${totalJokes} jokes`,
      duration: `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
  }, [setlistJokes]);

  // Drag and drop functionality removed - available in UnifiedSetlist component
  
  const handlePanelDrop = useCallback(async (jokeId) => {
    if (!jokeId) return;
    
    if (currentSetlist) {
      try {
        const newJokeIds = [...setlistJokeIds, jokeId];
        await updateSetlist(currentSetlist.id, { jokeIds: newJokeIds });
      } catch (error) {
        console.error('Error adding joke to setlist:', error);
      }
    } else {
      // Fallback to local state
      dispatch({ type: 'ADD_JOKE_TO_SETLIST', payload: { id: jokeId } });
    }
  }, [currentSetlist, setlistJokeIds, updateSetlist, dispatch]);
  
  const handleCreateSetlist = async (name) => {
    try {
      const newSetlist = await createSetlist({ title: name });
      setCurrentSetlistId(newSetlist.id);
      setShowCreateSetlist(false);
    } catch (error) {
      console.error('Error creating setlist:', error);
    }
  };
  
  const handleJokeClick = (joke) => {
    setSelectedJoke(joke);
    setShowComments(true);
  };

  return (
    <div style={StyledSetlist.Panel}>
      {isPerfMode && <PerformanceMode jokes={setlistJokes} onExit={() => setPerfMode(false)} />}
      <div style={StyledSetlist.PanelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h4 style={StyledSetlist.PanelTitle}><i className="fas fa-list"></i> Setlist</h4>
          {setlists.length > 0 && (
            <select 
              style={{ 
                background: theme.colors.bg.surface2, 
                border: `1px solid ${theme.colors.border}`, 
                borderRadius: '4px', 
                color: theme.colors.text.primary, 
                fontSize: '0.8rem',
                padding: '0.25rem'
              }}
              value={currentSetlistId || ''}
              onChange={(e) => setCurrentSetlistId(e.target.value || null)}
            >
              <option value="">Local Draft</option>
              {setlists.map(setlist => (
                <option key={setlist.id} value={setlist.id}>{setlist.title}</option>
              ))}
            </select>
          )}
        </div>
        <div style={{display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: theme.colors.text.secondary, alignItems: 'center'}}>
          {/* Collaboration indicators */}
          {currentSetlist && (
            <ActiveUsers users={activeUsers} loading={presenceLoading} showCount={false} />
          )}
          {currentSetlist && (
            <CollaborationIndicator setlistId={currentSetlist.id} isOwner={isOwner} />
          )}
          
          {/* Stats */}
          <span>{stats.count}</span>
          <span>{stats.duration}</span>
          <button
            style={{
              background: theme.colors.accent.blue,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '0.25rem 0.5rem',
              fontSize: '0.7rem',
              cursor: 'pointer'
            }}
            onClick={() => setShowCreateSetlist(true)}
          >
            <i className="fas fa-plus"></i>
          </button>
          {currentSetlist && isOwner && (
            <button
              style={{
                background: theme.colors.accent.orange,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.25rem 0.5rem',
                fontSize: '0.7rem',
                cursor: 'pointer'
              }}
              onClick={() => setShowShareModal(true)}
            >
              <i className="fas fa-share"></i>
            </button>
          )}
          {setlistJokes.length > 0 && (
            <button style={StyledSetlist.PerformanceModeButton} onClick={() => setPerfMode(true)}>Perform</button>
          )}
        </div>
      </div>
      {/* Professional drag-and-drop styles */}
      <style>{`
        .dragging-active li {
          transition: all 350ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .snap-animation {
          animation: snapInPlace 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
        }
        
        @keyframes snapInPlace {
          0% {
            transform: scale(0.95) rotate(1deg);
            box-shadow: 0 5px 10px rgba(29, 185, 84, 0.4);
          }
          50% {
            transform: scale(1.05) rotate(-0.5deg);
            box-shadow: 0 15px 25px rgba(29, 185, 84, 0.2);
            background: #2f4f2f !important;
            border-color: #1DB954 !important;
          }
          100% {
            transform: scale(1) rotate(0deg);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            background: ${theme.colors.bg.surface} !important;
            border-color: ${theme.colors.border} !important;
          }
        }
        
        .sortable-ghost {
          opacity: 0 !important;
          height: 80px !important;
          background: linear-gradient(90deg, 
            rgba(29, 185, 84, 0.1) 0%, 
            rgba(29, 185, 84, 0.2) 50%, 
            rgba(29, 185, 84, 0.1) 100%) !important;
          border: 2px dashed #1DB954 !important;
          border-radius: ${theme.borderRadius.md} !important;
          margin: ${theme.spacing.sm} 0 !important;
          position: relative;
        }
        
        .sortable-ghost::before {
          content: "Drop here ✨";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #1DB954;
          font-size: 0.9rem;
          font-weight: 600;
          opacity: 0.8;
        }
        
        .sortable-chosen {
          cursor: grabbing !important;
          opacity: 0.5 !important;
        }
        
        .sortable-drag, .sortable-fallback {
          transform: rotate(3deg) scale(1.02) !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 
                      0 10px 20px -5px rgba(0, 0, 0, 0.3),
                      0 0 0 1px rgba(255, 255, 255, 0.1) !important;
          opacity: 1 !important;
          background: #333333 !important;
          border: 1px solid #555 !important;
          z-index: 9999 !important;
          transition: none !important;
        }
      `}</style>
        <div 
          style={StyledSetlist.Setlist(false)} 
          onDrop={(e) => {
            e.preventDefault();
            const jokeId = e.dataTransfer.getData('text/plain');
            handlePanelDrop(jokeId);
          }} 
          onDragOver={(e) => {
            e.preventDefault();
          }}
        >
          {jokesLoading ? (
            <SetlistSkeleton />
          ) : setlistJokes.length > 0 ? (
            <ul 
              style={{ listStyle: 'none', padding: 0, margin: 0 }}
            >
              {setlistJokes.map((joke, index) => (
                <li
                  key={joke.id}
                  data-id={joke.id}
                  style={{
                    ...StyledSetlist.SetlistItem,
                    cursor: isSharedSetlist ? 'pointer' : 'grab'
                  }}
                  onClick={isSharedSetlist ? () => handleJokeClick(joke) : undefined}
                >
                  <div style={StyledSetlist.SetlistNumber}>{index + 1}</div>
                  <div style={StyledSetlist.SetlistItemContent}>
                    {joke.title}
                    {isSharedSetlist && (
                      <i 
                        className="fas fa-comment" 
                        style={{ 
                          marginLeft: '0.5rem', 
                          fontSize: '0.8rem', 
                          color: theme.colors.accent.blue,
                          opacity: 0.7
                        }}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : ( 
            <div style={{textAlign: 'center', color: theme.colors.text.secondary, marginTop: '4rem'}}>
              {isSharedSetlist ? 'This setlist is empty' : 'Drag jokes here to build your setlist'}
            </div> 
          )}
        </div>
      
      {/* Create Setlist Modal */}
      <Modal isOpen={showCreateSetlist} onClose={() => setShowCreateSetlist(false)}>
        <CreateSetlistForm onSave={handleCreateSetlist} onCancel={() => setShowCreateSetlist(false)} />
      </Modal>
      
      {/* Share Modal */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)}>
        <ShareModal 
          setlist={currentSetlist}
          onClose={() => setShowShareModal(false)}
          onShare={async (userId, permission) => {
            if (currentSetlist) {
              await shareSetlist(currentSetlist.id, userId, permission);
            }
          }}
          onUnshare={async (userId) => {
            if (currentSetlist) {
              const updatedSharedWith = currentSetlist.sharedWith.filter(
                share => share.userId !== userId
              );
              await updateSetlist(currentSetlist.id, { sharedWith: updatedSharedWith });
            }
          }}
        />
      </Modal>
      
      {/* Comment Sidebar */}
      {showComments && selectedJoke && currentSetlist && (
        <CommentSidebar
          setlistId={currentSetlist.id}
          joke={selectedJoke}
          onClose={() => {
            setShowComments(false);
            setSelectedJoke(null);
          }}
        />
      )}
    </div>
  );
});

Setlist.displayName = 'Setlist';

export default Setlist;