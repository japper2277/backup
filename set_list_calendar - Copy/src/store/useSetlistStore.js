/**
 * Zustand Store for Performance Mode
 * Provides fast state management with automatic persistence
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { isFeatureEnabled } from '../config/features';

// Initial state
const initialState = {
  // Jokes data
  jokes: {},
  activeSetlist: [],
  
  // Filters
  filters: {
    searchTerm: '',
    sortBy: 'title',
    filterType: 'all',
    tags: [],
    duration: [0, 300],
    rating: 0
  },
  
  // Performance metrics
  metrics: {
    searchLatency: 0,
    renderCount: 0,
    errorCount: 0,
    lastUpdated: Date.now()
  },
  
  // Feature flags (initialized from config)
  featureFlags: {
    performanceMode: isFeatureEnabled('performanceMode'),
    debounceSearch: isFeatureEnabled('debounceSearch'),
    debugMode: isFeatureEnabled('debugMode')
  },
  
  // UI state
  draggedJoke: null,
  loading: false,
  error: null
};

export const useSetlistStore = create(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Joke management
        addJoke: (joke) => set((state) => {
          const id = joke.id || crypto.randomUUID();
          const newJoke = {
            ...joke,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          return {
            jokes: { ...state.jokes, [id]: newJoke },
            metrics: {
              ...state.metrics,
              lastUpdated: Date.now()
            }
          };
        }),
        
        removeJoke: (id) => set((state) => {
          const { [id]: removed, ...remaining } = state.jokes;
          return {
            jokes: remaining,
            activeSetlist: state.activeSetlist.filter(jokeId => jokeId !== id)
          };
        }),
        
        updateJoke: (id, updates) => set((state) => ({
          jokes: {
            ...state.jokes,
            [id]: {
              ...state.jokes[id],
              ...updates,
              updatedAt: new Date().toISOString()
            }
          }
        })),
        
        // Setlist management
        addToSetlist: (jokeId) => set((state) => ({
          activeSetlist: [...state.activeSetlist, jokeId]
        })),
        
        removeFromSetlist: (jokeId) => set((state) => ({
          activeSetlist: state.activeSetlist.filter(id => id !== jokeId)
        })),
        
        reorderSetlist: (startIndex, endIndex) => set((state) => {
          const newSetlist = [...state.activeSetlist];
          const [removed] = newSetlist.splice(startIndex, 1);
          newSetlist.splice(endIndex, 0, removed);
          return { activeSetlist: newSetlist };
        }),
        
        // Filters
        setFilters: (updates) => set((state) => ({
          filters: { ...state.filters, ...updates }
        })),
        
        setSearchQuery: (query) => set((state) => ({
          filters: { ...state.filters, searchTerm: query }
        })),
        
        // Get filtered jokes
        getFilteredJokes: () => {
          const state = get();
          const jokes = Object.values(state.jokes);
          const { searchTerm, sortBy, filterType, tags } = state.filters;
          
          let filtered = jokes;
          
          // Apply search filter
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(joke => 
              joke.title?.toLowerCase().includes(searchLower) ||
              joke.content?.toLowerCase().includes(searchLower) ||
              joke.text?.toLowerCase().includes(searchLower) ||
              joke.tags?.some(tag => tag.toLowerCase().includes(searchLower))
            );
          }
          
          // Apply type filter
          if (filterType !== 'all') {
            filtered = filtered.filter(joke => joke.jokeType === filterType);
          }
          
          // Apply tag filter
          if (tags.length > 0) {
            filtered = filtered.filter(joke => 
              joke.tags?.some(tag => tags.includes(tag))
            );
          }
          
          // Sort results
          filtered.sort((a, b) => {
            switch (sortBy) {
              case 'title':
                return (a.title || '').localeCompare(b.title || '');
              case 'recent':
                return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
              case 'duration':
                return (b.duration || 0) - (a.duration || 0);
              case 'status':
                const stages = ['Idea', 'Workshopping', 'Tight 5 Ready', 'Show Ready'];
                return stages.indexOf(a.readinessStatus) - stages.indexOf(b.readinessStatus);
              default:
                return 0;
            }
          });
          
          return filtered;
        },
        
        // Performance tracking
        trackMetric: (key, value) => set((state) => ({
          metrics: {
            ...state.metrics,
            [key]: value,
            lastUpdated: Date.now()
          }
        })),
        
        // UI state
        setDraggedJoke: (jokeId) => set({ draggedJoke: jokeId }),
        
        setLoading: (loading) => set({ loading }),
        
        setError: (error) => set({ error }),
        
        // Reset to defaults
        reset: () => set(initialState)
      }),
      {
        name: 'setlist-store',
        // Only persist essential data
        partialize: (state) => ({
          jokes: state.jokes,
          activeSetlist: state.activeSetlist,
          filters: state.filters
        })
      }
    ),
    { name: 'SetlistStore' }
  )
);

// Performance tracking hook
export const usePerformanceTracking = () => {
  const trackMetric = useSetlistStore(state => state.trackMetric);
  const metrics = useSetlistStore(state => state.metrics);
  
  const trackRender = (componentName, renderTime) => {
    if (renderTime > 16) { // Over one frame
      console.warn(`⚠️ Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
    
    trackMetric('renderCount', metrics.renderCount + 1);
  };
  
  const trackOperation = (operationName, duration) => {
    trackMetric(`${operationName}Time`, duration);
    
    if (duration > 100) {
      console.warn(`⚠️ Slow operation: ${operationName} took ${duration.toFixed(2)}ms`);
    }
  };
  
  return { trackRender, trackOperation, metrics };
};