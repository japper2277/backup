/**
 * CollaborativeDemoApp - Demonstration of Real-time Collaboration Features
 * 
 * Shows multiple users editing the same setlist simultaneously with:
 * - Real-time joke updates
 * - Presence indicators (who's online)
 * - Avatar stack showing active collaborators
 * - Live sync status
 */

import React, { useState, useEffect, useCallback } from 'react';
// Unified DndContext wraps both JokeBank and CollaborativeSetlist
import { 
  DndContext, 
  PointerSensor, 
  KeyboardSensor, 
  useSensor, 
  useSensors, 
  DragOverlay, 
  closestCenter,
  rectIntersection
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
  arrayMove
} from '@dnd-kit/sortable';
import { auth } from '../firebase/config.js';
import { signInAnonymously } from 'firebase/auth';
import { AuthProvider } from '../contexts/AuthContext.jsx';
import { AppProvider } from '../contexts/AppContext.jsx';
import { CollaborativeSetlist } from './setlist/CollaborativeSetlist.jsx';
import { AvatarStack } from './Collaboration/AvatarStack.jsx';
import { JokeBank } from './jokes/JokeBank.jsx';
import { theme } from '../styles/theme.js';

const CollaborativeDemoAppStyles = {
  Container: {
    display: 'flex',
    height: '100vh',
    background: theme.colors.bg.main,
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.sans
  },
  Sidebar: {
    width: '400px',
    background: theme.colors.bg.surface,
    borderRight: `1px solid ${theme.colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden auto'
  },
  Main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden auto'
  },
  Header: {
    padding: '1rem',
    background: theme.colors.bg.surface2,
    borderBottom: `1px solid ${theme.colors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  Title: {
    fontSize: '1.2rem',
    fontWeight: 600,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  Badge: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.7rem',
    fontWeight: 500
  },
  UserSwitcher: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center'
  },
  UserButton: (isActive) => ({
    padding: '0.5rem 1rem',
    border: `1px solid ${isActive ? theme.colors.accent.green : theme.colors.border}`,
    borderRadius: '6px',
    background: isActive ? theme.colors.accent.green : theme.colors.bg.surface,
    color: isActive ? 'white' : theme.colors.text.primary,
    cursor: 'pointer',
    fontSize: '0.8rem',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  }),
  AuthStatus: {
    padding: '1rem',
    background: theme.colors.bg.surface2,
    borderBottom: `1px solid ${theme.colors.border}`,
    fontSize: '0.8rem',
    color: theme.colors.text.secondary
  },
  LoadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    gap: '1rem',
    color: theme.colors.text.secondary
  },
  Spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid ' + theme.colors.border,
    borderTop: '3px solid ' + theme.colors.accent.green,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  DemoInstructions: {
    padding: '1rem',
    background: 'rgba(16, 185, 129, 0.1)',
    border: `1px solid rgba(16, 185, 129, 0.3)`,
    borderRadius: '8px',
    margin: '1rem',
    fontSize: '0.8rem',
    lineHeight: 1.5
  },
  InstructionTitle: {
    fontWeight: 600,
    color: theme.colors.accent.green,
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  }
};

// Mock users for demo
const DEMO_USERS = [
  { 
    id: 'demo-user-1', 
    name: 'Alex (You)', 
    avatar: null,
    color: '#10b981' 
  },
  { 
    id: 'demo-user-2', 
    name: 'Sarah', 
    avatar: null,
    color: '#3b82f6' 
  },
  { 
    id: 'demo-user-3', 
    name: 'Mike', 
    avatar: null,
    color: '#f59e0b' 
  }
];

// Demo jokes for the joke bank
const DEMO_JOKES = [
  {
    id: 'demo-joke-1',
    title: "Scientists and Atoms",
    text: "Why don't scientists trust atoms? Because they make up everything!",
    tags: ['science', 'wordplay'],
    setup: "Why don't scientists trust atoms?",
    punchline: "Because they make up everything!",
    jokeType: 'One-liner',
    readinessStatus: 'Show Ready',
    isClean: true,
    estimated_duration: 15,
    archived: false,
    notes: 'Great opener - always gets a laugh'
  },
  {
    id: 'demo-joke-2',
    title: "Eyebrows Too High", 
    text: "I told my wife she was drawing her eyebrows too high. She looked surprised.",
    tags: ['observational', 'marriage'],
    setup: "I told my wife she was drawing her eyebrows too high.",
    punchline: "She looked surprised.",
    jokeType: 'Observational',
    readinessStatus: 'Show Ready',
    isClean: true,
    estimated_duration: 20,
    archived: false,
    notes: 'Visual comedy - works better with gesture'
  },
  {
    id: 'demo-joke-3',
    title: "Eggs and Jokes",
    text: "Why don't eggs tell jokes? They'd crack each other up!",
    tags: ['puns', 'food'],
    setup: "Why don't eggs tell jokes?",
    punchline: "They'd crack each other up!",
    jokeType: 'One-liner',
    readinessStatus: 'Tight 5 Ready',
    isClean: true,
    estimated_duration: 12,
    archived: false,
    notes: 'Classic pun - reliable crowd pleaser'
  },
  {
    id: 'demo-joke-4',
    title: "Fake Noodle",
    text: "What do you call a fake noodle? An impasta!",
    tags: ['puns', 'food'],
    setup: "What do you call a fake noodle?",
    punchline: "An impasta!",
    jokeType: 'One-liner',
    readinessStatus: 'Workshopping',
    isClean: true,
    estimated_duration: 10,
    archived: false,
    notes: 'Simple pun - good for warming up audience'
  }
];

// Internal component without providers
const CollaborativeDemoAppContent = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('demo-user-1');
  const [activeJoke, setActiveJoke] = useState(null);
  const [dragSource, setDragSource] = useState(null);
  
  // Configure sensors for unified drag system with optimized settings
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevents accidental drags, good for both touch and mouse
        delay: 100, // Small delay for better touch handling
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Unified collision detection
  const collisionDetection = useCallback((args) => {
    const { active, droppableContainers } = args;
    
    // Check if dragging from bank by examining active item data
    if (active?.data?.current?.type === 'bank-joke') {
      const setlistContainer = droppableContainers.find(container => 
        container.id === 'collaborative-setlist-droppable'
      );
      if (setlistContainer) {
        return rectIntersection({
          ...args,
          droppableContainers: [setlistContainer]
        });
      }
      return [];
    }
    
    return closestCenter(args);
  }, []);
  
  // Helper function to safely extract joke title
  const getJokeTitle = (joke) => {
    if (!joke) return 'Unknown Joke';
    
    // Try different possible title fields
    return joke.title || 
           joke.text?.split('.')[0]?.trim() || 
           joke.setup || 
           joke.name || 
           'Untitled Joke';
  };

  // Unified drag handlers
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    
    const joke = active.data.current?.joke;
    const jokeTitle = getJokeTitle(joke);
    
    console.log('🔍 Debug drag start:', {
      id: active.id,
      type: active.data.current?.type,
      joke: joke,
      hasJoke: !!joke,
      jokeTitle: jokeTitle,
      jokeStructure: joke ? Object.keys(joke) : 'no joke data'
    });
    
    if (active.data.current?.type === 'bank-joke') {
      setActiveJoke(joke);
      setDragSource('bank');
      console.log('🚀 Bank drag started:', jokeTitle);
    } else if (active.data.current?.type === 'setlist-joke') {
      setActiveJoke(joke);
      setDragSource('setlist');
      console.log('🚀 Setlist drag started:', jokeTitle);
    } else {
      console.log('⚠️ Unknown drag type:', active.data.current?.type);
    }
  }, []);
  
  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    
    const debugInfo = {
      activeId: active.id, 
      overId: over?.id,
      activeData: active.data?.current,
      overData: over?.data?.current,
      dragSource,
      handlersAvailable: !!window.collaborativeSetlistHandlers,
      handlerTypes: window.collaborativeSetlistHandlers ? Object.keys(window.collaborativeSetlistHandlers) : [],
      timestamp: new Date().toISOString()
    };
    
    console.log('🎯 Unified drag ended:', debugInfo);
    
    // Clear drag state first
    setActiveJoke(null);
    setDragSource(null);
    
    if (!over) {
      console.log('❌ No valid drop target - drag cancelled');
      return;
    }
    
    // Enhanced validation and error handling
    try {
      // Wait a bit to ensure handlers are fully initialized
      if (!window.collaborativeSetlistHandlers) {
        console.warn('⏳ Handlers not ready, waiting...');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Check if this is a bank-to-setlist drop
      if (over.id === 'collaborative-setlist-droppable' && active.data?.current?.type === 'bank-joke') {
        console.log('📦 Processing bank-to-setlist drop');
        
        const jokeData = active.data.current.joke;
        
        // Enhanced joke data validation
        if (!jokeData) {
          console.error('❌ No joke data available');
          alert('Drop failed: No joke data found. Please try again.');
          return;
        }
        
        if (!jokeData.id) {
          console.error('❌ Invalid joke data - missing ID:', jokeData);
          alert('Drop failed: Invalid joke data. Please refresh and try again.');
          return;
        }
        
        // Verify handlers with retry mechanism
        if (!window.collaborativeSetlistHandlers?.handleBankToSetlistDrop) {
          console.error('❌ Bank-to-setlist handler not available:', {
            handlersObject: !!window.collaborativeSetlistHandlers,
            availableHandlers: window.collaborativeSetlistHandlers ? Object.keys(window.collaborativeSetlistHandlers) : 'none'
          });
          
          // Try to re-initialize handlers
          console.log('🔄 Attempting to re-initialize handlers...');
          if (window.initializeDragHandlers) {
            window.initializeDragHandlers();
          }
          
          // Show user feedback with retry option
          const retry = confirm('Drop failed: Drag handlers not ready. Click OK to retry or Cancel to skip.');
          if (retry && window.collaborativeSetlistHandlers?.handleBankToSetlistDrop) {
            await window.collaborativeSetlistHandlers.handleBankToSetlistDrop(jokeData);
            console.log('✅ Bank-to-setlist drop completed after retry');
          } else {
            console.log('❌ User cancelled or retry failed');
          }
          return;
        }
        
        console.log('🚀 Calling bank-to-setlist handler with data:', {
          jokeTitle: jokeData.title,
          jokeId: jokeData.id,
          handlerType: typeof window.collaborativeSetlistHandlers.handleBankToSetlistDrop
        });
        
        await window.collaborativeSetlistHandlers.handleBankToSetlistDrop(jokeData);
        console.log('✅ Bank-to-setlist drop completed successfully');
        
        // Visual feedback
        console.log('🎉 Success! Added "' + jokeData.title + '" to setlist');
        
      } else if (dragSource === 'setlist') {
        // Handle setlist reordering or same-position drops
        if (active.id === over.id) {
          // Same position drop - this is valid, just no change needed
          console.log('✅ Same position drop - no reordering needed:', {
            itemId: active.id,
            jokeTitle: getJokeTitle(active.data.current?.joke)
          });
          console.log('📍 Item "' + getJokeTitle(active.data.current?.joke) + '" already in correct position');
          return;
        }
        
        // Different position - proceed with reordering
        console.log('🔄 Processing setlist reorder');
        
        // Enhanced validation for reordering
        if (!active.id || !over.id) {
          console.error('❌ Missing IDs for reorder:', { activeId: active.id, overId: over.id });
          alert('Reorder failed: Missing item identifiers. Please try again.');
          return;
        }
        
        // Verify handlers with retry mechanism  
        if (!window.collaborativeSetlistHandlers?.handleSetlistReorder) {
          console.error('❌ Setlist reorder handler not available:', {
            handlersObject: !!window.collaborativeSetlistHandlers,
            availableHandlers: window.collaborativeSetlistHandlers ? Object.keys(window.collaborativeSetlistHandlers) : 'none'
          });
          
          // Try to re-initialize handlers
          if (window.initializeDragHandlers) {
            window.initializeDragHandlers();
          }
          
          const retry = confirm('Reorder failed: Drag handlers not ready. Click OK to retry or Cancel to skip.');
          if (retry && window.collaborativeSetlistHandlers?.handleSetlistReorder) {
            await window.collaborativeSetlistHandlers.handleSetlistReorder(active.id, over.id);
            console.log('✅ Setlist reorder completed after retry');
          }
          return;
        }
        
        console.log('🚀 Calling setlist reorder handler:', {
          activeId: active.id,
          overId: over.id,
          handlerType: typeof window.collaborativeSetlistHandlers.handleSetlistReorder
        });
        
        await window.collaborativeSetlistHandlers.handleSetlistReorder(active.id, over.id);
        console.log('✅ Setlist reorder completed successfully');
        
      } else {
        console.log('⚠️ Unhandled drag scenario:', { 
          overId: over.id, 
          activeType: active.data?.current?.type,
          dragSource,
          samePosition: active.id === over.id,
          possibleReasons: [
            'Wrong drop target',
            'Invalid drag source', 
            'Missing drag data',
            'Unsupported drag type'
          ]
        });
      }
    } catch (error) {
      console.error('💥 Unified drag error:', {
        error: error.message,
        stack: error.stack,
        debugInfo,
        timestamp: new Date().toISOString()
      });
      
      // Enhanced user feedback
      const errorMsg = error.message || 'Unknown error occurred';
      alert(`Drop failed: ${errorMsg}\n\nPlease check the console for more details and try again.`);
    }
  }, [dragSource]);

  // Initialize authentication with improved fallback and handler setup
  useEffect(() => {
    const initAuth = async () => {
      console.log('🚀 Initializing Firebase auth and drag handlers...');
      
      // Add a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('🎭 Firebase auth timeout - falling back to demo mode');
        const demoUser = {
          uid: 'demo-user-' + Math.random().toString(36).substr(2, 9),
          isAnonymous: true,
          email: null,
          displayName: 'Demo User'
        };
        setCurrentUser(demoUser);
        setAuthError(null);
        setLoading(false);
        
        // Ensure drag handlers are initialized even in demo mode
        initializeDragHandlers();
      }, 3000); // Reduced to 3 seconds for better UX

      try {
        if (!auth.currentUser) {
          const userCredential = await signInAnonymously(auth);
          clearTimeout(timeoutId);
          console.log('✅ Firebase auth successful:', userCredential.user.uid);
          setCurrentUser(userCredential.user);
          setLoading(false);
          initializeDragHandlers();
        } else {
          clearTimeout(timeoutId);
          console.log('✅ Firebase auth already active:', auth.currentUser.uid);
          setCurrentUser(auth.currentUser);
          setLoading(false);
          initializeDragHandlers();
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('❌ Authentication failed:', error);
        
        // Fallback: Create a mock user for demo purposes when auth fails
        console.log('🎭 Using demo mode - Firebase auth failed, but initializing drag handlers');
        const demoUser = {
          uid: 'demo-user-' + Math.random().toString(36).substr(2, 9),
          isAnonymous: true,
          email: null,
          displayName: 'Demo User'
        };
        setCurrentUser(demoUser);
        setAuthError(null); // Clear error for demo mode
        setLoading(false);
        
        // CRITICAL: Initialize drag handlers even when auth fails
        initializeDragHandlers();
      }
    };

    // Helper function to ensure drag handlers are available
    const initializeDragHandlers = () => {
      console.log('🎯 Initializing drag handlers...');
      
      // Ensure global handlers exist for drag operations
      if (!window.collaborativeSetlistHandlers) {
        window.collaborativeSetlistHandlers = {};
      }
      
      // Initialize basic handlers that work without Firebase
      window.collaborativeSetlistHandlers.handleBankToSetlistDrop = async (jokeData) => {
        console.log('📦 Demo bank-to-setlist drop:', jokeData?.title || 'Unknown joke');
        // Add visual feedback
        if (jokeData?.title) {
          console.log('✨ Added to setlist:', jokeData.title);
          // Show user feedback for demo mode
          if (window.ENV_CONFIG?.DEBUG?.ENABLED) {
            alert(`Demo Mode: Added "${jokeData.title}" to setlist!`);
          }
        }
      };
      
      window.collaborativeSetlistHandlers.handleSetlistReorder = async (activeId, overId) => {
        console.log('🔄 Demo setlist reorder:', { activeId, overId });
        console.log('✨ Reordered setlist items');
        // Show user feedback for demo mode
        if (window.ENV_CONFIG?.DEBUG?.ENABLED) {
          alert(`Demo Mode: Reordered setlist items!`);
        }
      };
      
      // Make the initializer globally accessible for retry mechanism
      window.initializeDragHandlers = initializeDragHandlers;
      
      console.log('✅ Drag handlers initialized successfully');
    };

    initAuth();

    // Listen for auth state changes only if auth is working
    const unsubscribe = auth.onAuthStateChanged ? auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        setLoading(false);
        // Ensure handlers are re-initialized on auth changes
        initializeDragHandlers();
      }
    }) : () => {};

    return () => unsubscribe();
  }, []);

  // Simulate user switching for demo purposes
  const switchUser = (userId) => {
    setSelectedUserId(userId);
    // In a real app, this would trigger a new auth session
    // For demo, we just change the selected user
  };

  if (loading) {
    return (
      <div style={CollaborativeDemoAppStyles.Container}>
        <div style={CollaborativeDemoAppStyles.LoadingState}>
          <div style={CollaborativeDemoAppStyles.Spinner} />
          <div>Initializing Firebase...</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
            Setting up real-time collaboration
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (authError) {
    return (
      <div style={CollaborativeDemoAppStyles.Container}>
        <div style={CollaborativeDemoAppStyles.LoadingState}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: '#ef4444' }} />
          <div style={{ color: '#ef4444' }}>Authentication Failed</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7, maxWidth: '300px', textAlign: 'center' }}>
            {authError}
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: theme.colors.accent.green,
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={CollaborativeDemoAppStyles.Container}>
        {/* Sidebar with Joke Bank */}
        <div style={CollaborativeDemoAppStyles.Sidebar}>
        <div style={CollaborativeDemoAppStyles.Header}>
          <h3 style={CollaborativeDemoAppStyles.Title}>
            <i className="fas fa-lightbulb" />
            Joke Bank
          </h3>
        </div>
        
        <div style={CollaborativeDemoAppStyles.AuthStatus}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: currentUser ? theme.colors.accent.green : theme.colors.text.secondary
            }} />
            <span>{currentUser ? 'Connected' : 'Connecting...'}</span>
            {currentUser?.displayName === 'Demo User' && (
              <span style={{ 
                fontSize: '0.7rem', 
                background: 'rgba(255, 193, 7, 0.2)', 
                color: '#ffc107',
                padding: '2px 6px',
                borderRadius: '4px',
                marginLeft: '0.5rem'
              }}>
                DEMO
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
            {currentUser?.displayName === 'Demo User' ? 
              'Demo Mode - No Firebase auth required' :
              `UID: ${currentUser?.uid?.slice(0, 8) || 'N/A'}...`
            }
          </div>
        </div>

        <JokeBank jokes={DEMO_JOKES} />
      </div>

      {/* Main area with Collaborative Setlist */}
      <div style={CollaborativeDemoAppStyles.Main}>
        <div style={CollaborativeDemoAppStyles.Header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={CollaborativeDemoAppStyles.Title}>
              <i className="fas fa-users" />
              Collaborative Setlist
              <span style={CollaborativeDemoAppStyles.Badge}>LIVE</span>
            </h2>
            
            {/* Real-time collaboration indicator */}
            <AvatarStack 
              setlistId="demo-setlist-123"
              showStatus={false}
              showConnectedIndicator={true}
            />
          </div>

          {/* Demo user switcher */}
          <div style={CollaborativeDemoAppStyles.UserSwitcher}>
            <span style={{ fontSize: '0.8rem', color: theme.colors.text.secondary }}>
              Demo as:
            </span>
            {DEMO_USERS.map(user => (
              <button
                key={user.id}
                style={CollaborativeDemoAppStyles.UserButton(selectedUserId === user.id)}
                onClick={() => switchUser(user.id)}
              >
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: user.color
                }} />
                {user.name}
              </button>
            ))}
          </div>
        </div>

        {/* Demo instructions */}
        <div style={CollaborativeDemoAppStyles.DemoInstructions}>
          <div style={CollaborativeDemoAppStyles.InstructionTitle}>
            <i className="fas fa-info-circle" />
            Real-time Collaboration Demo
          </div>
          <div>
            • <strong>Drag jokes</strong> from the left panel to build your setlist<br/>
            • <strong>Open multiple browser tabs</strong> to see real-time collaboration<br/>
            • <strong>Avatar indicators</strong> show who's currently online and editing<br/>
            • <strong>Changes sync instantly</strong> across all connected users<br/>
            {currentUser?.displayName === 'Demo User' && (
              <>
                <br/>
                <em style={{ color: '#ffc107' }}>
                  ⚠️ Demo Mode: Firebase anonymous auth is disabled. Enable it in Firebase Console for full collaboration features.
                </em>
              </>
            )}
          </div>
        </div>

        {/* Collaborative Setlist Component - now has unified drag system */}
        <CollaborativeSetlist setlistId="demo-setlist-123" />
      </div>
      
      {/* Unified Drag Overlay */}
      <DragOverlay>
        {activeJoke ? (
          <div style={{
            background: '#333333',
            border: '2px solid #1DB954',
            borderRadius: '8px',
            padding: '1rem 1.25rem',
            color: '#ffffff',
            fontSize: '1rem',
            fontWeight: 500,
            transform: 'rotate(3deg) scale(1.05)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            opacity: 0.95,
            cursor: 'grabbing',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ fontSize: '1.2rem' }}>🎭</div>
            <div>Moving: {getJokeTitle(activeJoke)}</div>
          </div>
        ) : null}
      </DragOverlay>
      
    </div>
    </DndContext>
  );
};

// Main exported component with proper context providers
export const CollaborativeDemoApp = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <CollaborativeDemoAppContent />
      </AppProvider>
    </AuthProvider>
  );
};

export default CollaborativeDemoApp;