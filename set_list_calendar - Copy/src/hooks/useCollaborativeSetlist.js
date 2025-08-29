/**
 * useCollaborativeSetlist Hook - Real-time collaborative setlist management
 * 
 * Replaces the mock jokeService with live Firebase real-time collaboration.
 * Manages jokes, real-time updates, and presence for collaborative editing.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  subscribeToSetlistJokes, 
  subscribeToSetlist,
  addJokeToSetlist, 
  updateJoke, 
  deleteJoke,
  reorderJokes,
  createSetlist,
  shareSetlist
} from '../api/collaborationService.ts';
import { useSetlistPresence } from './usePresence.js';
import { auth } from '../firebase/config.js';

// Interface definitions for TypeScript-like documentation
// In JavaScript, these are just comments for IDE support
const UseCollaborativeSetlistState = {
  jokes: [], // Joke[]
  setlist: null, // Setlist | null
  loading: true, // boolean
  error: null, // CollaborationError | null
  connected: false, // boolean
  syncing: false // boolean
};

const UseCollaborativeSetlistActions = {
  addJoke: null, // (jokeData: Partial<Joke>) => Promise<string>
  editJoke: null, // (id: string, updates: Partial<Joke>) => Promise<void>
  removeJoke: null, // (id: string) => Promise<void>
  reorderSetlistJokes: null, // (jokeIds: string[]) => Promise<void>
  shareSetlistWith: null, // (userId: string, permission: 'read' | 'comment' | 'edit') => Promise<void>
  clearError: null, // () => void
  retry: null // () => void
};

export const useCollaborativeSetlist = (setlistId) => {
  const [state, setState] = useState({
    jokes: [],
    setlist: null,
    loading: true,
    error: null,
    connected: false,
    syncing: false,
  });

  const unsubscribeRefs = useRef([]);
  const optimisticUpdates = useRef(new Map());
  const isOptimisticUpdate = useRef(false); // New ref to track optimistic updates

  // Get presence data
  const presence = useSetlistPresence(setlistId);

  // Clean up subscriptions
  const cleanup = useCallback(() => {
    unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
    unsubscribeRefs.current = [];
  }, []);

  // Handle connection errors with retry logic
  const handleError = useCallback((error) => {
    console.error('Collaborative setlist error:', error);
    setState(prev => ({
      ...prev,
      error,
      connected: false,
      loading: false,
    }));
  }, []);

  // Initialize real-time subscriptions
  useEffect(() => {
    console.log('🔧 useCollaborativeSetlist: Initializing with setlistId:', setlistId);
    console.log('🔧 useCollaborativeSetlist: Auth user:', auth.currentUser);
    
    if (!setlistId || !auth.currentUser) {
      console.log('❌ useCollaborativeSetlist: Missing setlistId or auth user');
      setState(prev => ({ ...prev, loading: false, connected: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    cleanup();

         // Subscribe to setlist metadata
     const unsubscribeSetlist = subscribeToSetlist(
       setlistId,
       (setlist) => {
         console.log('✅ Setlist loaded from Firebase:', setlist);
         setState(prev => ({
           ...prev,
           setlist,
           connected: true,
           loading: false,
         }));
       },
       handleError
     );

         // Subscribe to jokes in the setlist
     const unsubscribeJokes = subscribeToSetlistJokes(
       setlistId,
       (jokes) => {
         console.log('✅ Jokes loaded from Firebase:', jokes.length, 'jokes');
         
         // Transform jokes to ensure they have a title field for the UI
         const transformedJokes = jokes.map(joke => ({
           ...joke,
           title: joke.title || joke.text || joke.setup || 'Untitled Joke'
         }));
         
         console.log('🔧 Transformed jokes:', transformedJokes.map(j => ({ id: j.id, title: j.title, text: j.text })));
         
         setState(prev => ({
           ...prev,
           jokes: transformedJokes,
           connected: true,
           loading: false,
           syncing: false,
         }));
         
         // Clear any resolved optimistic updates
         optimisticUpdates.current.clear();
       },
       handleError
     );

    unsubscribeRefs.current = [unsubscribeSetlist, unsubscribeJokes];

    return cleanup;
  }, [setlistId, cleanup, handleError]);

  // Optimistic update helper
  const applyOptimisticUpdate = useCallback((updateFn) => {
    isOptimisticUpdate.current = true; // Set flag to prevent real-time listener override
    setState(prev => ({
      ...prev,
      jokes: updateFn(prev.jokes),
      syncing: true,
    }));
    
    // Clear flag after a delay to allow real-time updates again
    setTimeout(() => {
      isOptimisticUpdate.current = false;
    }, 1000);
  }, []);

  // Actions - memoized to prevent recreation on every render
  const actions = useMemo(() => ({
    addJoke: async (jokeData) => {
      if (!setlistId) throw new Error('No setlist ID provided');

      // Create the joke object with proper structure matching what UnifiedJokeCard expects
      const newJoke = {
        id: `joke-${Date.now()}`,
        title: jokeData.title || jokeData.text || jokeData.setup || 'Untitled Joke', // Ensure title is always present
        text: jokeData.text || jokeData.setup || '',
        setup: jokeData.setup || jokeData.text || '',
        punchline: jokeData.punchline || '',
        tags: jokeData.tags || [],
        position: state.jokes.length,
        estimated_duration: jokeData.estimated_duration || 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorId: auth.currentUser?.uid || 'demo-user',
        lastEditedBy: auth.currentUser?.uid || 'demo-user',
        lastEditedAt: new Date().toISOString(),
        // Add additional fields that might be expected
        jokeType: jokeData.jokeType || 'Observational',
        readinessStatus: jokeData.readinessStatus || 'Idea',
        isClean: jokeData.isClean || true,
        notes: jokeData.notes || '',
        archived: jokeData.archived || false
      };

      console.log('🎭 Creating new joke:', {
        title: newJoke.title,
        structure: Object.keys(newJoke),
        originalData: jokeData
      });

      // Optimistic update - add joke immediately to UI
      applyOptimisticUpdate(jokes => [...jokes, newJoke]);

      try {
        // Notify presence system that user is adding a joke
        presence.updateCurrentlyEditing?.('adding-joke');
        
        const jokeId = await addJokeToSetlist(setlistId, jokeData);
        
        // Clear editing status
        presence.clearCurrentlyEditing?.();
        
        return jokeId;
      } catch (error) {
        // Revert optimistic update on error
        applyOptimisticUpdate(jokes => jokes.filter(j => j.id !== newJoke.id));
        presence.clearCurrentlyEditing?.();
        throw error;
      }
    },

    editJoke: async (id, updates) => {
      if (!setlistId) throw new Error('No setlist ID provided');

      // Optimistic update
      applyOptimisticUpdate(jokes => 
        jokes.map(joke => 
          joke.id === id 
            ? { 
                ...joke, 
                ...updates, 
                updatedAt: new Date().toISOString(),
                lastEditedBy: auth.currentUser?.uid || 'unknown',
                lastEditedAt: new Date().toISOString(),
              }
            : joke
        )
      );

      try {
        // Notify presence system
        presence.updateCurrentlyEditing?.(id);
        
        await updateJoke(setlistId, id, updates);
        
        // Clear editing status after a short delay
        setTimeout(() => {
          presence.clearCurrentlyEditing?.();
        }, 1000);
        
      } catch (error) {
        // Real-time listener will revert the optimistic update
        presence.clearCurrentlyEditing?.();
        throw error;
      }
    },

    removeJoke: async (id) => {
      if (!setlistId) throw new Error('No setlist ID provided');

      // Optimistic update
      const jokeToDelete = state.jokes.find(j => j.id === id);
      applyOptimisticUpdate(jokes => jokes.filter(j => j.id !== id));

      try {
        await deleteJoke(setlistId, id);
      } catch (error) {
        // Revert optimistic update
        if (jokeToDelete) {
          applyOptimisticUpdate(jokes => [...jokes, jokeToDelete].sort((a, b) => a.position - b.position));
        }
        throw error;
      }
    },

    reorderSetlistJokes: async (jokeIds) => {
      if (!setlistId) throw new Error('No setlist ID provided');

      // Optimistic update - reorder locally
      const reorderedJokes = jokeIds.map((id, index) => {
        const joke = state.jokes.find(j => j.id === id);
        return joke ? { ...joke, position: index } : null;
      }).filter(Boolean);

      applyOptimisticUpdate(() => reorderedJokes);

      try {
        await reorderJokes(setlistId, jokeIds);
      } catch (error) {
        // Real-time listener will revert the change
        throw error;
      }
    },

    shareSetlistWith: async (userId, permission) => {
      if (!setlistId) throw new Error('No setlist ID provided');

      try {
        await shareSetlist(setlistId, userId, permission);
      } catch (error) {
        console.error('Failed to share setlist:', error);
        throw error;
      }
    },

    clearError: () => {
      setState(prev => ({ ...prev, error: null }));
    },

    retry: () => {
      if (setlistId) {
        setState(prev => ({ ...prev, loading: true, error: null }));
        // Re-trigger the effect by clearing and re-setting up subscriptions
        cleanup();
      }
    },
  }), [setlistId, state.jokes, applyOptimisticUpdate, presence.updateCurrentlyEditing, presence.clearCurrentlyEditing, cleanup]);

  // Auto-retry connection on network reconnection
  useEffect(() => {
    const handleOnline = () => {
      if (state.error && !state.connected) {
        console.log('Network reconnected, retrying...');
        actions.retry();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [state.error, state.connected, actions.retry]);

  // Debug logging for state - commented out to prevent console flooding
  // console.log('🔧 useCollaborativeSetlist: Current state:', {
  //   jokesCount: state.jokes.length,
  //   jokes: state.jokes.map(j => ({ id: j.id, title: j.title })),
  //   setlist: state.setlist?.title,
  //   loading: state.loading,
  //   connected: state.connected,
  //   error: state.error?.message
  // });

  return {
    // State
    ...state,
    
    // Presence data
    activeUsers: presence.activeUsers || [],
    isConnectedToPresence: presence.isConnected || false,
    presenceError: presence.error,
    
    // Actions
    ...actions,
    
    // Presence actions
    updateCurrentlyEditing: presence.updateCurrentlyEditing,
    clearCurrentlyEditing: presence.clearCurrentlyEditing,
    getUsersEditingJoke: presence.getUsersEditingJoke,
    
    // Utilities
    isOwner: state.setlist?.ownerId === auth.currentUser?.uid,
    canEdit: state.setlist?.ownerId === auth.currentUser?.uid || 
             state.setlist?.sharedWith?.some(share => 
               share.userId === auth.currentUser?.uid && 
               share.permission === 'edit'
             ),
    canComment: state.setlist?.ownerId === auth.currentUser?.uid ||
                state.setlist?.sharedWith?.some(share => 
                  share.userId === auth.currentUser?.uid && 
                  ['comment', 'edit'].includes(share.permission)
                ),
  };
};

export default useCollaborativeSetlist;