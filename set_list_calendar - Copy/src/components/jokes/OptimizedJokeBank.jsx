/**
 * Optimized JokeBank Component - Google Team Performance Enhancement
 * 
 * This component works alongside the existing JokeBank.jsx to provide:
 * - Debounced search with sub-300ms response time
 * - Zustand state management for faster updates  
 * - Memoized filtering and sorting
 * - Performance monitoring and metrics
 * - Feature flag support for gradual rollout
 * 
 * Backward compatible: Falls back to existing AppContext if Zustand unavailable
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useAppState, useAppDispatch } from '../../contexts/AppContext'
import { useSetlistStore, usePerformanceTracking } from '../../store/useSetlistStore'
import { useDebouncedSearch, useCachedSearch } from '../../hooks/useDebouncedSearch'
import { useUserJokes } from '../../hooks/useFirestore'
import { initializeDemoData, isDemoDataLoaded } from '../../utils/demoData'
import { Modal } from '../common'
import { JokeCard } from './JokeCard'
import { AddJokeForm } from '../forms'
import { JokeBankSkeleton } from '../common/SkeletonLoader'
import { theme } from '../../styles/theme'

const READINESS_STAGES = ['Idea', 'Workshopping', 'Tight 5 Ready', 'Show Ready']

const StyledJokeBank = {
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
  SearchInput: { 
    width: '100%', 
    background: theme.colors.bg.input, 
    border: `1px solid ${theme.colors.border}`, 
    borderRadius: theme.borderRadius.md, 
    padding: '0.75rem', 
    color: theme.colors.text.primary, 
    fontSize: '0.95rem',
    position: 'relative'
  },
  SearchContainer: {
    position: 'relative',
    padding: '0 1rem'
  },
  SearchIndicator: {
    position: 'absolute',
    right: '1.5rem',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '0.8rem',
    color: theme.colors.text.secondary,
    pointerEvents: 'none'
  },
  FilterBar: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '0.5rem', 
    padding: '0.5rem 1rem', 
    borderBottom: `1px solid ${theme.colors.border}` 
  },
  FilterGroup: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '0.25rem' 
  },
  FilterLabel: { 
    fontSize: '0.7rem', 
    color: theme.colors.text.secondary 
  },
  Select: { 
    width: '100%', 
    backgroundColor: theme.colors.bg.surface2, 
    border: `1px solid ${theme.colors.border}`, 
    borderRadius: '4px', 
    color: theme.colors.text.primary, 
    fontSize: '0.8rem', 
    padding: '0.25rem' 
  },
  JokeBankList: { 
    flex: 1, 
    overflowY: 'auto', 
    padding: '0.5rem' 
  },
  PerformanceBar: {
    padding: '0.25rem 1rem',
    borderBottom: `1px solid ${theme.colors.border}`,
    fontSize: '0.7rem',
    color: theme.colors.text.secondary,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: theme.colors.bg.surface1
  }
}

export const OptimizedJokeBank = React.memo(() => {
  // Feature flags and performance tracking
  const featureFlags = useSetlistStore(state => state.featureFlags) || {}
  const { trackRender } = usePerformanceTracking()
  
  // Determine data source based on demo mode
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  
  // Legacy Context (backward compatibility)
  const legacyState = useAppState()
  const legacyDispatch = useAppDispatch()
  
  // Zustand store (performance mode)
  const {
    jokes: zustandJokes,
    filters,
    setFilters,
    setSearchQuery,
    getFilteredJokes,
    trackMetric,
    addJoke: zustandAddJoke
  } = useSetlistStore()
  
  // Firebase hooks
  const firebaseHooks = useUserJokes()
  const { jokes: firebaseJokes, loading, error, addJoke: firebaseAddJoke } = firebaseHooks
  
  // Local state
  const [showAddJokeForm, setShowAddJokeForm] = useState(false)
  const [performanceMode, setPerformanceMode] = useState(featureFlags.performanceMode)
  const [demoDataLoaded, setDemoDataLoaded] = useState(false)
  
  // Initialize demo data when performance mode is first enabled
  useEffect(() => {
    if (performanceMode && !demoDataLoaded && !isDemoDataLoaded()) {
      initializeDemoData()
      setDemoDataLoaded(true)
    }
  }, [performanceMode, demoDataLoaded])
  
  // Determine data source priority: Zustand > Firebase > Context
  const jokes = useMemo(() => {
    if (performanceMode && Object.keys(zustandJokes).length > 0) {
      return Object.values(zustandJokes)
    }
    if (!isDemoMode && firebaseJokes) {
      return firebaseJokes
    }
    return legacyState?.jokes || []
  }, [performanceMode, zustandJokes, firebaseJokes, legacyState?.jokes, isDemoMode])
  
  // Debounced search implementation
  const searchFilter = useCallback((query) => {
    const startTime = performance.now()
    const filtered = jokes.filter(joke => {
      if (!joke || typeof joke.title !== 'string') return false
      
      const searchTerm = query.toLowerCase()
      return (
        joke.title.toLowerCase().includes(searchTerm) ||
        (joke.text && joke.text.toLowerCase().includes(searchTerm)) ||
        (joke.tags && joke.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      )
    })
    
    const searchTime = performance.now() - startTime
    if (performanceMode) {
      trackMetric('searchLatency', searchTime)
    }
    
    return filtered
  }, [jokes, performanceMode, trackMetric])
  
  // Use cached search for performance
  const {
    query: searchTerm,
    results: searchResults,
    isSearching,
    setQuery: setSearchTerm,
    clearQuery
  } = useCachedSearch(searchFilter, 300, 100)
  
  // Apply additional filters to search results
  const filteredJokes = useMemo(() => {
    const startTime = performance.now()
    
    let filtered = searchTerm.trim() ? searchResults : jokes
    
    // Apply legacy Context filtering if not in performance mode
    if (!performanceMode && legacyState?.setlist) {
      const setlistIds = new Set(legacyState.setlist.map(item => item.id))
      filtered = filtered.filter(joke => !setlistIds.has(joke.id) && !joke.archived)
    }
    
    // Apply Zustand filtering if in performance mode
    if (performanceMode) {
      filtered = getFilteredJokes()
    }
    
    const filterTime = performance.now() - startTime
    if (performanceMode && filterTime > 10) {
      console.warn(`🐌 Slow filtering: ${filterTime}ms for ${filtered.length} jokes`)
    }
    
    return filtered
  }, [searchTerm, searchResults, jokes, performanceMode, legacyState?.setlist, getFilteredJokes])
  
  // Memoized drag handler
  const handleDragStart = useCallback((e, jokeId) => { 
    e.dataTransfer.setData('text/plain', jokeId)
    if (performanceMode) {
      useSetlistStore.getState().setDraggedJoke(jokeId)
    }
  }, [performanceMode])
  
  // Filter options memoization
  const filterOptions = useMemo(() => ({
    sortOptions: [
      { value: 'title', label: 'Title (A-Z)' },
      { value: 'status', label: 'Status' },
      { value: 'recent', label: 'Recently Updated' },
      { value: 'duration', label: 'Duration' }
    ],
    typeOptions: [
      { value: 'all', label: 'All Types' },
      { value: 'One-liner', label: 'One-liner' },
      { value: 'Story', label: 'Story' },
      { value: 'Observational', label: 'Observational' }
    ]
  }), [])
  
  // Handle joke addition with proper fallback
  const handleAddJoke = useCallback(async (jokeData) => {
    const startTime = performance.now()
    
    try {
      if (performanceMode) {
        // Use Zustand store
        zustandAddJoke({
          title: jokeData.title,
          content: jokeData.text || jokeData.content || '',
          duration: jokeData.estimated_duration || 60,
          tags: jokeData.tags || [],
          avgRating: jokeData.avgRating,
          venuePerformances: []
        })
        setShowAddJokeForm(false)
      } else if (!isDemoMode && firebaseAddJoke) {
        // Use Firebase
        await firebaseAddJoke({
          title: jokeData.title,
          text: jokeData.text || '',
          readinessStatus: jokeData.readinessStatus || 'Idea',
          jokeType: jokeData.jokeType || 'Observational',
          isClean: jokeData.isClean || false,
          estimated_duration: jokeData.estimated_duration || 60,
          tags: jokeData.tags || [],
          notes: jokeData.notes || ''
        })
        setShowAddJokeForm(false)
      } else {
        // Fall back to legacy Context
        const newJoke = {
          id: crypto.randomUUID(),
          title: jokeData.title,
          text: jokeData.text || '',
          readinessStatus: jokeData.readinessStatus || 'Idea',
          jokeType: jokeData.jokeType || 'Observational',
          isClean: jokeData.isClean || false,
          estimated_duration: jokeData.estimated_duration || 60,
          tags: jokeData.tags || [],
          notes: jokeData.notes || '',
          performanceHistory: []
        }
        legacyDispatch({ type: 'ADD_JOKE', payload: newJoke })
        setShowAddJokeForm(false)
      }
      
      const addTime = performance.now() - startTime
      if (performanceMode) {
        trackMetric('stateUpdateTime', addTime)
      }
      
    } catch (error) {
      console.error('Error adding joke:', error)
      if (performanceMode) {
        trackMetric('errorCount', useSetlistStore.getState().metrics.errorCount + 1)
      }
    }
  }, [performanceMode, zustandAddJoke, firebaseAddJoke, legacyDispatch, isDemoMode, trackMetric])
  
  // Performance tracking effect
  useEffect(() => {
    const startTime = performance.now()
    return () => {
      const renderTime = performance.now() - startTime
      trackRender('OptimizedJokeBank', renderTime)
    }
  }, []) // Empty dependency array - only run once
  
  // Loading state
  if (loading && !isDemoMode) {
    return <JokeBankSkeleton />
  }
  
  // Error state
  if (error && !isDemoMode) {
    return (
      <div style={StyledJokeBank.Panel}>
        <div style={StyledJokeBank.PanelHeader}>
          <h4 style={StyledJokeBank.PanelTitle}>
            <i className="fas fa-book-open"></i> Your Jokes
          </h4>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: theme.colors.accent.red }}>
          Error loading jokes: {error.message}
        </div>
      </div>
    )
  }
  
  return (
    <div style={StyledJokeBank.Panel}>
      {/* Header */}
      <div style={StyledJokeBank.PanelHeader}>
        <h4 style={StyledJokeBank.PanelTitle}>
          <i className="fas fa-book-open"></i> 
          Your Jokes {performanceMode && '⚡'}
        </h4>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {featureFlags.debugMode && (
            <button
              style={{
                background: performanceMode ? theme.colors.accent.green : theme.colors.bg.surface2,
                color: performanceMode ? 'white' : theme.colors.text.secondary,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '4px',
                padding: '0.25rem 0.5rem',
                fontSize: '0.7rem',
                cursor: 'pointer'
              }}
              onClick={() => setPerformanceMode(!performanceMode)}
              title="Toggle performance mode"
            >
              {performanceMode ? 'PERF' : 'COMPAT'}
            </button>
          )}
          <button
            style={{
              background: theme.colors.accent.green,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '0.25rem 0.5rem',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
            onClick={() => setShowAddJokeForm(true)}
          >
            <i className="fas fa-plus"></i> Add
          </button>
        </div>
      </div>
      
      {/* Performance metrics bar (debug mode) */}
      {performanceMode && (
        <div style={StyledJokeBank.PerformanceBar}>
          <span>
            🚀 Performance Mode Active
          </span>
          <span>
            Search: {useSetlistStore.getState().metrics.searchLatency.toFixed(1)}ms
          </span>
          <span>
            Results: {filteredJokes.length}
          </span>
          <span>
            {isSearching && '🔍'} 
            {searchTerm && !isSearching && '✓'}
          </span>
        </div>
      )}
      
      {/* Search input with indicator */}
      <div style={StyledJokeBank.SearchContainer}>
        <input 
          style={StyledJokeBank.SearchInput} 
          type="search" 
          placeholder="Search jokes..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              clearQuery()
            }
          }}
        />
        {(isSearching || searchTerm) && (
          <div style={StyledJokeBank.SearchIndicator}>
            {isSearching ? '🔍' : searchTerm ? `${filteredJokes.length}` : ''}
          </div>
        )}
      </div>
      
      {/* Filter controls - only show if not using Zustand advanced filters */}
      {!performanceMode && (
        <div style={StyledJokeBank.FilterBar}>
          <div style={StyledJokeBank.FilterGroup}>
            <label style={StyledJokeBank.FilterLabel}>Sort by</label>
            <select 
              style={StyledJokeBank.Select} 
              value={filters?.sortBy || 'title'} 
              onChange={e => {
                if (performanceMode) {
                  setFilters({ sortBy: e.target.value })
                }
              }}
            >
              {filterOptions.sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div style={StyledJokeBank.FilterGroup}>
            <label style={StyledJokeBank.FilterLabel}>Joke Type</label>
            <select 
              style={StyledJokeBank.Select} 
              value={filters?.filterType || 'all'} 
              onChange={e => {
                if (performanceMode) {
                  setFilters({ filterType: e.target.value })
                }
              }}
            >
              {filterOptions.typeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      {/* Jokes list */}
      <div style={StyledJokeBank.JokeBankList}>
        {filteredJokes.length > 0 ? (
          filteredJokes.map(joke => (
            <JokeCard 
              key={joke.id} 
              joke={joke} 
              onDragStart={(e) => handleDragStart(e, joke.id)} 
            />
          ))
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: theme.colors.text.secondary }}>
            {searchTerm ? 
              `No jokes match "${searchTerm}"` : 
              jokes.length === 0 ? 
              'No jokes yet. Add your first joke!' : 
              'No jokes match your filters'
            }
            {searchTerm && (
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  style={{
                    background: 'none',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: '4px',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.8rem',
                    color: theme.colors.text.secondary,
                    cursor: 'pointer'
                  }}
                  onClick={clearQuery}
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Add joke modal */}
      <Modal isOpen={showAddJokeForm} onClose={() => setShowAddJokeForm(false)}>
        <AddJokeForm onSave={handleAddJoke} onCancel={() => setShowAddJokeForm(false)} />
      </Modal>
    </div>
  )
})

OptimizedJokeBank.displayName = 'OptimizedJokeBank'