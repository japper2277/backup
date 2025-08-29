/**
 * AppContext - Centralized Application State Management
 * 
 * This context provides global state management for the Setlist Builder Pro application.
 * It handles joke collection, setlist management, and demo mode persistence using
 * React's useReducer hook with localStorage integration.
 * 
 * Features:
 * - Joke CRUD operations (Create, Read, Update, Delete)
 * - Setlist management (add, reorder, remove jokes)
 * - Status progression tracking (Idea → Workshopping → Tight 5 Ready → Show Ready)
 * - Demo mode localStorage persistence
 * - Optimistic UI updates
 * 
 * @module AppContext
 * @version 2.0.0
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';

/**
 * Demo data for the application
 * 
 * This provides a realistic set of sample jokes to demonstrate the application's
 * capabilities without requiring Firebase setup. Each joke includes all the
 * fields used in the actual application.
 */
const initialData = {
  jokes: [
    { 
      id: 'a1', 
      title: 'Airplane Food Bit', 
      text: 'The classic opener.', 
      readinessStatus: 'Show Ready', 
      jokeType: 'Observational', 
      isClean: true, 
      estimated_duration: 60, 
      performanceHistory: [{ date: '2025-08-19' }] 
    },
    { 
      id: 'e5', 
      title: 'Coffee Shop Rant', 
      text: 'A long-form story.', 
      readinessStatus: 'Workshopping', 
      jokeType: 'Story', 
      isClean: false, 
      estimated_duration: 180, 
      performanceHistory: [{ date: '2025-08-12' }] 
    },
    { 
      id: 'i9', 
      title: 'Lazy Cat Hire', 
      text: 'A quick one-liner.', 
      readinessStatus: 'Tight 5 Ready', 
      jokeType: 'One-liner', 
      isClean: true, 
      estimated_duration: 30, 
      performanceHistory: [] 
    },
    { 
      id: 'j7', 
      title: 'The Dusty Opener', 
      text: 'An old bit about dial-up modems.', 
      readinessStatus: 'Idea', 
      jokeType: 'Observational', 
      isClean: true, 
      estimated_duration: 75, 
      performanceHistory: [{ date: '2023-01-15' }] 
    },
  ],
  setlist: [],
};

/**
 * Joke readiness progression stages
 * 
 * Represents the typical workflow of joke development from initial idea
 * to performance-ready material. Users can cycle through these stages
 * to track their material's development progress.
 */
const READINESS_STAGES = ['Idea', 'Workshopping', 'Tight 5 Ready', 'Show Ready'];

/**
 * Application state reducer
 * 
 * Handles all state mutations for the application using the reducer pattern.
 * This ensures predictable state changes and enables features like undo/redo,
 * time-travel debugging, and optimistic updates.
 * 
 * @param {Object} state - Current application state
 * @param {Object} action - Action object with type and payload
 * @returns {Object} New state object
 */
function appReducer(state, action) {
  switch (action.type) {
    case 'ADD_JOKE': {
      // Add a new joke to the collection
      return { ...state, jokes: [...state.jokes, action.payload] };
    }
    case 'ADD_JOKE_TO_SETLIST': {
      // Add joke to setlist, preventing duplicates
      if (state.setlist.find(item => item.id === action.payload.id)) return state;
      return { ...state, setlist: [...state.setlist, { id: action.payload.id }] };
    }
    case 'REORDER_SETLIST': {
      // Reorder setlist items via drag and drop
      const { oldIndex, newIndex } = action.payload;
      const newSetlist = [...state.setlist];
      const [movedItem] = newSetlist.splice(oldIndex, 1);
      newSetlist.splice(newIndex, 0, movedItem);
      return { ...state, setlist: newSetlist };
    }
    case 'ARCHIVE_JOKE': {
      // Remove joke from both collection and setlist
      return { 
        ...state, 
        jokes: state.jokes.filter(j => j.id !== action.payload.id), 
        setlist: state.setlist.filter(item => item.id !== action.payload.id) 
      };
    }
    case 'CYCLE_STATUS': {
      // Advance joke to next readiness stage (cycles back to 'Idea')
      return { 
        ...state, 
        jokes: state.jokes.map(j => {
          if (j.id === action.payload.id) {
            const currentIndex = READINESS_STAGES.indexOf(j.readinessStatus);
            const nextIndex = (currentIndex + 1) % READINESS_STAGES.length;
            return { ...j, readinessStatus: READINESS_STAGES[nextIndex] };
          }
          return j;
        })
      };
    }
    case 'DUPLICATE_JOKE': {
      // Create a copy of an existing joke with new ID
      const jokeToDuplicate = state.jokes.find(j => j.id === action.payload.id);
      if (!jokeToDuplicate) return state;
      const newJoke = { 
        ...jokeToDuplicate, 
        id: crypto.randomUUID(), 
        title: `${jokeToDuplicate.title} (Copy)` 
      };
      return { ...state, jokes: [...state.jokes, newJoke] };
    }
    case 'EDIT_JOKE': {
      // Update an existing joke with new data
      return { 
        ...state, 
        jokes: state.jokes.map(j => 
          j.id === action.payload.joke.id ? action.payload.joke : j
        ) 
      };
    }
    default: 
      // Return current state for unknown actions
      return state;
  }
}

/**
 * Storage utilities for demo mode persistence
 * 
 * In demo mode, this provides localStorage persistence to maintain state
 * across browser sessions. In Firebase mode, this is largely a no-op as
 * persistence is handled by Firestore real-time listeners.
 */
const storage = {
  /**
   * Get initial state (demo mode only)
   * @returns {Object} Initial application state
   */
  getState: () => initialData,
  
  /**
   * Save state to localStorage (demo mode only)
   * @param {Object} state - Application state to persist
   */
  saveState: (state) => {
    // Only persist in demo mode to avoid conflicts with Firebase
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      try {
        localStorage.setItem('demoAppState', JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to save demo state:', error);
      }
    }
  },
};

/**
 * React Context instances
 * 
 * Split into separate state and dispatch contexts for performance optimization.
 * This prevents unnecessary re-renders when components only need one or the other.
 */
const AppStateContext = createContext(null);
const AppDispatchContext = createContext(null);

/**
 * Application Context Provider
 * 
 * Provides global state management for the entire application.
 * Handles initialization from localStorage in demo mode and
 * automatic persistence of state changes.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Context provider wrapper
 */
export function AppProvider({ children }) {
  // Initialize state with useReducer, loading from localStorage in demo mode
  const [state, dispatch] = useReducer(appReducer, initialData, () => {
    // Try to load previously saved state from localStorage (demo mode only)
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      try {
        const saved = localStorage.getItem('demoAppState');
        return saved ? JSON.parse(saved) : initialData;
      } catch (error) {
        console.warn('Failed to load demo state:', error);
        return initialData;
      }
    }
    return storage.getState();
  });

  // Auto-save state changes to localStorage (demo mode only)
  useEffect(() => {
    storage.saveState(state);
  }, [state]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

// Custom hooks for accessing context
export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (context === undefined) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return context;
}