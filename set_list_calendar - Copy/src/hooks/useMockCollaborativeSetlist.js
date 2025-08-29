/**
 * Mock Collaborative Setlist Hook - Demo-friendly version
 * 
 * Provides the same interface as useCollaborativeSetlist but works with local state
 * and mock authentication for demo purposes.
 */

import { useState, useCallback, useMemo } from 'react';

const DEMO_USER = {
  uid: 'demo-user-123',
  email: 'demo@example.com',
  displayName: 'Demo User'
};

const INITIAL_SETLIST = {
  id: 'demo-setlist-123',
  title: 'Collaborative Setlist',
  ownerId: 'demo-user-123',
  sharedWith: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const useMockCollaborativeSetlist = (setlistId) => {
  const [state, setState] = useState({
    jokes: [],
    setlist: INITIAL_SETLIST,
    loading: false,
    error: null,
    connected: true,
    syncing: false,
  });

  const [activeUsers] = useState([
    { id: 'demo-user-123', name: 'Demo User', color: '#10b981', isOnline: true },
    { id: 'demo-user-456', name: 'Sarah', color: '#3b82f6', isOnline: true },
  ]);

  // Mock actions that work with local state
  const actions = {
    addJoke: useCallback(async (jokeData) => {
      console.log('✅ MockCollaborativeSetlist: Adding joke:', jokeData);
      
      setState(prev => ({ ...prev, syncing: true }));
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const newJoke = {
        id: `joke-${Date.now()}`,
        title: jokeData.title || 'Untitled Joke',
        text: jokeData.text || '',
        setup: jokeData.setup || '',
        punchline: jokeData.punchline || '',
        jokeType: jokeData.jokeType || 'Observational',
        readinessStatus: jokeData.readinessStatus || 'Idea',
        isClean: jokeData.isClean || false,
        estimatedDuration: jokeData.estimated_duration || 30,
        tags: jokeData.tags || [],
        notes: jokeData.notes || '',
        position: state.jokes.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorId: DEMO_USER.uid,
        lastEditedBy: DEMO_USER.uid,
        lastEditedAt: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        jokes: [...prev.jokes, newJoke],
        syncing: false,
      }));

      return newJoke.id;
    }, [state.jokes.length]),

    editJoke: useCallback(async (id, updates) => {
      console.log('✅ MockCollaborativeSetlist: Editing joke:', id, updates);
      
      setState(prev => ({ ...prev, syncing: true }));
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setState(prev => ({
        ...prev,
        jokes: prev.jokes.map(joke => 
          joke.id === id 
            ? { 
                ...joke, 
                ...updates, 
                updatedAt: new Date().toISOString(),
                lastEditedBy: DEMO_USER.uid,
                lastEditedAt: new Date().toISOString(),
              }
            : joke
        ),
        syncing: false,
      }));
    }, []),

    removeJoke: useCallback(async (id) => {
      console.log('✅ MockCollaborativeSetlist: Removing joke:', id);
      
      setState(prev => ({ ...prev, syncing: true }));
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setState(prev => ({
        ...prev,
        jokes: prev.jokes.filter(j => j.id !== id),
        syncing: false,
      }));
    }, []),

    reorderSetlistJokes: useCallback(async (jokeIds) => {
      console.log('✅ MockCollaborativeSetlist: Reordering jokes:', jokeIds);
      
      setState(prev => ({ ...prev, syncing: true }));
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const reorderedJokes = jokeIds.map((id, index) => {
        const joke = state.jokes.find(j => j.id === id);
        return joke ? { ...joke, position: index } : null;
      }).filter(Boolean);

      setState(prev => ({
        ...prev,
        jokes: reorderedJokes,
        syncing: false,
      }));
    }, [state.jokes]),

    shareSetlistWith: useCallback(async (userId, permission) => {
      console.log('✅ MockCollaborativeSetlist: Sharing with:', userId, permission);
      // Mock sharing - just log it
    }, []),

    clearError: useCallback(() => {
      setState(prev => ({ ...prev, error: null }));
    }, []),

    retry: useCallback(() => {
      setState(prev => ({ ...prev, loading: false, error: null, connected: true }));
    }, []),
  };

  // Mock presence actions
  const presenceActions = {
    updateCurrentlyEditing: useCallback((jokeId) => {
      console.log('👋 MockCollaborativeSetlist: Editing:', jokeId);
    }, []),
    
    clearCurrentlyEditing: useCallback(() => {
      console.log('👋 MockCollaborativeSetlist: Stopped editing');
    }, []),
    
    getUsersEditingJoke: useCallback((jokeId) => {
      // Return empty array for demo
      return [];
    }, []),
  };

  // Mock permissions - always allow editing in demo
  const permissions = useMemo(() => ({
    isOwner: true,
    canEdit: true,
    canComment: true,
  }), []);

  return {
    // State
    ...state,
    
    // Presence data
    activeUsers,
    isConnectedToPresence: true,
    presenceError: null,
    
    // Actions
    ...actions,
    
    // Presence actions
    ...presenceActions,
    
    // Permissions
    ...permissions,
  };
};

export default useMockCollaborativeSetlist;