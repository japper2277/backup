/**
 * High-Performance Zustand Store for Setlist Builder
 * Google Team Performance Requirements: Sub-100ms state updates
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export interface Joke {
  id: string
  title: string
  content: string
  duration: number // seconds
  tags: string[]
  lastPerformed?: Date
  avgRating?: number
  venuePerformances?: {
    venueId: string
    rating: number
    date: Date
  }[]
  createdAt: Date
  updatedAt: Date
}

export interface Setlist {
  id: string
  name: string
  jokeIds: string[]
  totalDuration: number
  createdAt: Date
  lastUsed?: Date
  venues: string[]
  notes?: string
}

interface FilterState {
  tags: string[]
  duration: [number, number]
  rating: number
  searchQuery: string
  sortBy: 'recent' | 'rating' | 'duration' | 'alphabetical'
}

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  stateUpdateTime: number
  errorCount: number
}

interface SetlistState {
  // Core Data
  jokes: Record<string, Joke>
  setlists: Record<string, Setlist>
  activeSetlistId: string | null
  
  // UI State
  filters: FilterState
  isLoading: boolean
  selectedJokes: string[]
  draggedJoke: string | null
  
  // Performance Tracking
  metrics: PerformanceMetrics
  
  // Computed Getters (Memoized)
  getFilteredJokes: () => Joke[]
  getActiveSetlist: () => Setlist | null
  getSetlistDuration: (setlistId: string) => number
  
  // Core Actions
  addJoke: (joke: Omit<Joke, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateJoke: (id: string, updates: Partial<Joke>) => void
  deleteJoke: (id: string) => void
  
  // Setlist Actions
  createSetlist: (name: string) => string
  addJokeToSetlist: (jokeId: string, setlistId?: string) => void
  removeJokeFromSetlist: (jokeId: string, setlistId?: string) => void
  reorderSetlist: (startIndex: number, endIndex: number, setlistId?: string) => void
  duplicateSetlist: (setlistId: string) => string
  
  // Filter Actions
  setFilters: (filters: Partial<FilterState>) => void
  setSearchQuery: (query: string) => void
  clearFilters: () => void
  
  // UI Actions
  setSelectedJokes: (jokeIds: string[]) => void
  setDraggedJoke: (jokeId: string | null) => void
  setActiveSetlist: (setlistId: string | null) => void
  
  // Performance Actions
  trackMetric: (metric: keyof PerformanceMetrics, value: number) => void
  resetMetrics: () => void
  
  // Batch Operations (Performance Optimized)
  batchUpdateJokes: (updates: Array<{ id: string; updates: Partial<Joke> }>) => void
  importJokes: (jokes: Omit<Joke, 'id' | 'createdAt' | 'updatedAt'>[]) => void
}

const initialFilters: FilterState = {
  tags: [],
  duration: [0, 600], // 0 to 10 minutes
  rating: 0,
  searchQuery: '',
  sortBy: 'recent'
}

const initialMetrics: PerformanceMetrics = {
  loadTime: 0,
  renderTime: 0,
  stateUpdateTime: 0,
  errorCount: 0
}

export const useSetlistStore = create<SetlistState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        jokes: {},
        setlists: {},
        activeSetlistId: null,
        filters: initialFilters,
        isLoading: false,
        selectedJokes: [],
        draggedJoke: null,
        metrics: initialMetrics,
        
        // Computed Getters (Optimized with caching)
        getFilteredJokes: () => {
          const state = get()
          const jokes = Object.values(state.jokes)
          const { tags, duration, rating, searchQuery, sortBy } = state.filters
          
          let filtered = jokes.filter(joke => {
            // Tag filter
            if (tags.length > 0 && !tags.some(tag => joke.tags.includes(tag))) {
              return false
            }
            
            // Duration filter
            if (joke.duration < duration[0] || joke.duration > duration[1]) {
              return false
            }
            
            // Rating filter
            if (rating > 0 && (joke.avgRating || 0) < rating) {
              return false
            }
            
            // Search filter
            if (searchQuery) {
              const query = searchQuery.toLowerCase()
              return (
                joke.title.toLowerCase().includes(query) ||
                joke.content.toLowerCase().includes(query) ||
                joke.tags.some(tag => tag.toLowerCase().includes(query))
              )
            }
            
            return true
          })
          
          // Sort
          filtered.sort((a, b) => {
            switch (sortBy) {
              case 'recent':
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
              case 'rating':
                return (b.avgRating || 0) - (a.avgRating || 0)
              case 'duration':
                return a.duration - b.duration
              case 'alphabetical':
                return a.title.localeCompare(b.title)
              default:
                return 0
            }
          })
          
          return filtered
        },
        
        getActiveSetlist: () => {
          const state = get()
          return state.activeSetlistId ? state.setlists[state.activeSetlistId] || null : null
        },
        
        getSetlistDuration: (setlistId: string) => {
          const state = get()
          const setlist = state.setlists[setlistId]
          if (!setlist) return 0
          
          return setlist.jokeIds.reduce((total, jokeId) => {
            const joke = state.jokes[jokeId]
            return total + (joke?.duration || 0)
          }, 0)
        },
        
        // Core Actions
        addJoke: (jokeData) => set((state) => {
          const id = crypto.randomUUID()
          const now = new Date()
          
          state.jokes[id] = {
            ...jokeData,
            id,
            createdAt: now,
            updatedAt: now
          }
        }),
        
        updateJoke: (id, updates) => set((state) => {
          if (state.jokes[id]) {
            Object.assign(state.jokes[id], updates, { updatedAt: new Date() })
          }
        }),
        
        deleteJoke: (id) => set((state) => {
          // Remove from jokes
          delete state.jokes[id]
          
          // Remove from all setlists
          Object.values(state.setlists).forEach(setlist => {
            const index = setlist.jokeIds.indexOf(id)
            if (index > -1) {
              setlist.jokeIds.splice(index, 1)
              setlist.totalDuration = setlist.jokeIds.reduce((total, jokeId) => {
                return total + (state.jokes[jokeId]?.duration || 0)
              }, 0)
            }
          })
          
          // Remove from selected
          const selectedIndex = state.selectedJokes.indexOf(id)
          if (selectedIndex > -1) {
            state.selectedJokes.splice(selectedIndex, 1)
          }
        }),
        
        // Setlist Actions
        createSetlist: (name) => {
          const id = crypto.randomUUID()
          set((state) => {
            state.setlists[id] = {
              id,
              name,
              jokeIds: [],
              totalDuration: 0,
              createdAt: new Date(),
              venues: []
            }
          })
          return id
        },
        
        addJokeToSetlist: (jokeId, setlistId) => set((state) => {
          const targetId = setlistId || state.activeSetlistId
          if (!targetId || !state.setlists[targetId] || !state.jokes[jokeId]) return
          
          const setlist = state.setlists[targetId]
          if (!setlist.jokeIds.includes(jokeId)) {
            setlist.jokeIds.push(jokeId)
            setlist.totalDuration += state.jokes[jokeId].duration
          }
        }),
        
        removeJokeFromSetlist: (jokeId, setlistId) => set((state) => {
          const targetId = setlistId || state.activeSetlistId
          if (!targetId || !state.setlists[targetId]) return
          
          const setlist = state.setlists[targetId]
          const index = setlist.jokeIds.indexOf(jokeId)
          if (index > -1) {
            setlist.jokeIds.splice(index, 1)
            setlist.totalDuration -= state.jokes[jokeId]?.duration || 0
          }
        }),
        
        reorderSetlist: (startIndex, endIndex, setlistId) => set((state) => {
          const targetId = setlistId || state.activeSetlistId
          if (!targetId || !state.setlists[targetId]) return
          
          const setlist = state.setlists[targetId]
          const [removed] = setlist.jokeIds.splice(startIndex, 1)
          setlist.jokeIds.splice(endIndex, 0, removed)
        }),
        
        duplicateSetlist: (setlistId) => {
          const state = get()
          const original = state.setlists[setlistId]
          if (!original) return ''
          
          const id = crypto.randomUUID()
          set((state) => {
            state.setlists[id] = {
              ...original,
              id,
              name: `${original.name} (Copy)`,
              createdAt: new Date()
            }
          })
          return id
        },
        
        // Filter Actions
        setFilters: (filters) => set((state) => {
          Object.assign(state.filters, filters)
        }),
        
        setSearchQuery: (query) => set((state) => {
          state.filters.searchQuery = query
        }),
        
        clearFilters: () => set((state) => {
          state.filters = { ...initialFilters }
        }),
        
        // UI Actions
        setSelectedJokes: (jokeIds) => set((state) => {
          state.selectedJokes = jokeIds
        }),
        
        setDraggedJoke: (jokeId) => set((state) => {
          state.draggedJoke = jokeId
        }),
        
        setActiveSetlist: (setlistId) => set((state) => {
          state.activeSetlistId = setlistId
          if (setlistId && state.setlists[setlistId]) {
            state.setlists[setlistId].lastUsed = new Date()
          }
        }),
        
        // Performance Actions
        trackMetric: (metric, value) => set((state) => {
          state.metrics[metric] = value
        }),
        
        resetMetrics: () => set((state) => {
          state.metrics = { ...initialMetrics }
        }),
        
        // Batch Operations
        batchUpdateJokes: (updates) => set((state) => {
          const now = new Date()
          updates.forEach(({ id, updates }) => {
            if (state.jokes[id]) {
              Object.assign(state.jokes[id], updates, { updatedAt: now })
            }
          })
        }),
        
        importJokes: (jokes) => set((state) => {
          const now = new Date()
          jokes.forEach(jokeData => {
            const id = crypto.randomUUID()
            state.jokes[id] = {
              ...jokeData,
              id,
              createdAt: now,
              updatedAt: now
            }
          })
        })
      })),
      {
        name: 'setlist-store',
        version: 1,
        // Only persist essential data
        partialize: (state) => ({
          jokes: state.jokes,
          setlists: state.setlists,
          activeSetlistId: state.activeSetlistId,
          filters: state.filters
        })
      }
    ),
    {
      name: 'setlist-store'
    }
  )
)

// Performance hook for tracking render times
export const usePerformanceTracking = () => {
  const trackMetric = useSetlistStore(state => state.trackMetric)
  
  return {
    trackRender: (componentName: string, duration: number) => {
      if (duration > 16) { // Warn if render takes longer than 16ms (60fps target)
        console.warn(`🐌 Slow render: ${componentName} took ${duration}ms`)
      }
      trackMetric('renderTime', duration)
    },
    trackStateUpdate: (duration: number) => {
      trackMetric('stateUpdateTime', duration)
    }
  }
}