import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useAppState, useAppDispatch } from '../../contexts/AppContext';
import { useUserJokes } from '../../hooks/useFirestore';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import { isFeatureEnabled } from '../../config/features';
import { Modal } from '../common';
import { JokeCard } from './JokeCard';
import { AddJokeForm } from '../forms';
import { JokeBankSkeleton } from '../common/SkeletonLoader';
import { SearchInput, Select, Option, Button, Card, CardHeader, CardTitle } from '../ui';
import { theme } from '../../styles/theme';

const READINESS_STAGES = ['Idea', 'Workshopping', 'Tight 5 Ready', 'Show Ready'];

// Draggable Joke Card for @dnd-kit
const DraggableJokeCard = ({ joke, onDragStart }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `bank-${joke.id}`,
    data: {
      type: 'bank-joke',
      joke
    }
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    background: theme.colors.bg.surface,
    border: `1px solid ${isDragging ? theme.colors.accent.green : theme.colors.border}`,
    borderRadius: '6px',
    padding: '0.75rem',
    marginBottom: '0.5rem',
    transition: isDragging ? 'none' : 'all 0.2s ease',
    '&:hover': {
      borderColor: theme.colors.accent.green
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onDragStart={onDragStart}
    >
      <div style={{
        fontWeight: 500,
        fontSize: '0.9rem',
        color: theme.colors.text.primary,
        marginBottom: '0.25rem'
      }}>
        {joke.title}
      </div>
      <div style={{
        fontSize: '0.8rem',
        color: theme.colors.text.secondary,
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center'
      }}>
        <span>{joke.jokeType}</span>
        <span>•</span>
        <span>{joke.readinessStatus}</span>
        {joke.estimated_duration && (
          <>
            <span>•</span>
            <span>{joke.estimated_duration}s</span>
          </>
        )}
      </div>
    </div>
  );
};

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
    fontSize: '0.95rem' 
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
  }
};

export const JokeBank = React.memo(({ jokes: propJokes = null }) => {
  const { startMeasure } = usePerformanceMonitor('JokeBank');
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  const state = useAppState();
  
  // Conditionally call Firebase hook only when needed
  const firebaseData = (!propJokes && !isDemoMode) ? useUserJokes() : { jokes: [], loading: false, error: null };
  
  // Use prop jokes (for collaborative demo), demo mode, or Firebase
  const jokes = propJokes || (isDemoMode ? state.jokes : firebaseData.jokes);
  const loading = propJokes ? false : (isDemoMode ? false : firebaseData.loading);
  const error = propJokes ? null : (isDemoMode ? null : firebaseData.error);
  const dispatch = useAppDispatch();
  const [filters, setFilters] = useState({ searchTerm: '', sortBy: 'title', filterType: 'all' });
  const [showAddJokeForm, setShowAddJokeForm] = useState(false);
  
  // Performance: debounced search state
  const [debouncedTerm, setDebouncedTerm] = useState('');
  
  // Debounced search effect
  useEffect(() => {
    if (!isFeatureEnabled('debounceSearch')) return;
    
    const timer = setTimeout(() => {
      setDebouncedTerm(filters.searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filters.searchTerm]);

  // Filter jokes based on current setlist and search criteria
  const jokesInBank = useMemo(() => {
    const endMeasure = startMeasure('filter-and-sort');
    
    if (!jokes || !state?.setlist) {
      endMeasure();
      return [];
    }
    
    const setlistIds = new Set(state.setlist.map(item => item.id));
    const searchTerm = isFeatureEnabled('debounceSearch') ? debouncedTerm : filters.searchTerm;
    
    const result = jokes
      .filter(joke => !setlistIds.has(joke.id) && !joke.archived)
      .filter(joke => joke.title.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(joke => filters.filterType === 'all' || joke.jokeType === filters.filterType)
      .sort((a, b) => {
        if (filters.sortBy === 'title') return a.title.localeCompare(b.title);
        if (filters.sortBy === 'status') return READINESS_STAGES.indexOf(a.readinessStatus) - READINESS_STAGES.indexOf(b.readinessStatus);
        return 0;
      });
    
    endMeasure();
    return result;
  }, [jokes, state?.setlist, filters, debouncedTerm, startMeasure]);

  // Memoized drag handler to prevent unnecessary re-renders
  const handleDragStart = useCallback((e, jokeId) => { 
    const joke = jokes.find(j => j.id === jokeId);
    console.log('🚀 JokeBank: Starting drag for joke:', jokeId, joke);
    if (joke) {
      const jokeData = JSON.stringify(joke);
      console.log('📦 JokeBank: Setting drag data:', jokeData);
      e.dataTransfer.setData('application/json', jokeData); 
    } else {
      console.warn('❌ JokeBank: Joke not found for ID:', jokeId);
    }
  }, [jokes]);
  
  // Memoized filter options to prevent re-computation
  const filterOptions = useMemo(() => ({
    sortOptions: [
      { value: 'title', label: 'Title (A-Z)' },
      { value: 'status', label: 'Status' }
    ],
    typeOptions: [
      { value: 'all', label: 'All Types' },
      { value: 'One-liner', label: 'One-liner' },
      { value: 'Story', label: 'Story' },
      { value: 'Observational', label: 'Observational' }
    ]
  }), []);
  
  const handleAddJoke = async (jokeData) => {
    if (propJokes || isDemoMode) {
      // Collaborative demo or demo mode: add to local state
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
      };
      dispatch({ type: 'ADD_JOKE', payload: newJoke });
      setShowAddJokeForm(false);
    } else {
      try {
        const { addJoke } = firebaseData;
        await addJoke({
          title: jokeData.title,
          text: jokeData.text || '',
          readinessStatus: jokeData.readinessStatus || 'Idea',
          jokeType: jokeData.jokeType || 'Observational',
          isClean: jokeData.isClean || false,
          estimated_duration: jokeData.estimated_duration || 60,
          tags: jokeData.tags || [],
          notes: jokeData.notes || ''
        });
        setShowAddJokeForm(false);
      } catch (error) {
        console.error('Error adding joke:', error);
      }
    }
  };
  
  if (loading) {
    return (
      <div style={StyledJokeBank.Panel}>
        <div style={StyledJokeBank.PanelHeader}>
          <h4 style={StyledJokeBank.PanelTitle}>
            <i className="fas fa-book-open"></i> Your Jokes
          </h4>
          <div style={{
            width: '60px',
            height: '24px',
            background: 'linear-gradient(90deg, #282828 25%, #3e3e3e 50%, #282828 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '4px'
          }} />
        </div>
        <div style={{ padding: '0 1rem' }}>
          <div style={{
            width: '100%',
            height: '40px',
            background: 'linear-gradient(90deg, #282828 25%, #3e3e3e 50%, #282828 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '6px',
            marginBottom: '0.5rem'
          }} />
        </div>
        <div style={StyledJokeBank.FilterBar}>
          <div style={StyledJokeBank.FilterGroup}>
            <div style={{
              width: '50px',
              height: '12px',
              background: 'linear-gradient(90deg, #282828 25%, #3e3e3e 50%, #282828 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '4px',
              marginBottom: '0.25rem'
            }} />
            <div style={{
              width: '100%',
              height: '28px',
              background: 'linear-gradient(90deg, #282828 25%, #3e3e3e 50%, #282828 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '4px'
            }} />
          </div>
          <div style={StyledJokeBank.FilterGroup}>
            <div style={{
              width: '60px',
              height: '12px',
              background: 'linear-gradient(90deg, #282828 25%, #3e3e3e 50%, #282828 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '4px',
              marginBottom: '0.25rem'
            }} />
            <div style={{
              width: '100%',
              height: '28px',
              background: 'linear-gradient(90deg, #282828 25%, #3e3e3e 50%, #282828 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '4px'
            }} />
          </div>
        </div>
        <JokeBankSkeleton />
      </div>
    );
  }
  
  if (error) {
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
    );
  }
  
  return (
    <div style={StyledJokeBank.Panel}>
      <div style={StyledJokeBank.PanelHeader}>
        <h4 style={StyledJokeBank.PanelTitle}>
          <i className="fas fa-book-open"></i> Your Jokes
        </h4>
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
      <div style={{ padding: '0 1rem' }}>
        <input 
          style={StyledJokeBank.SearchInput} 
          type="search" 
          placeholder="Search..." 
          value={filters.searchTerm} 
          onChange={e => {
            const term = e.target.value;
            // Update search term immediately for responsive feel
            setFilters(f => ({...f, searchTerm: term}));
          }} 
        />
      </div>
      <div style={StyledJokeBank.FilterBar}>
        <div style={StyledJokeBank.FilterGroup}>
          <label style={StyledJokeBank.FilterLabel}>Sort by</label>
          <select 
            style={StyledJokeBank.Select} 
            value={filters.sortBy} 
            onChange={e => setFilters(f => ({...f, sortBy: e.target.value}))}
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
            value={filters.filterType} 
            onChange={e => setFilters(f => ({...f, filterType: e.target.value}))}
          >
            {filterOptions.typeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={StyledJokeBank.JokeBankList}>
        {jokesInBank.length > 0 ? (
          jokesInBank.map(joke => 
            <DraggableJokeCard 
              key={joke.id} 
              joke={joke} 
              onDragStart={(e) => handleDragStart(e, joke.id)} 
            />
          )
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: theme.colors.text.secondary }}>
            {jokes.length === 0 ? 'No jokes yet. Add your first joke!' : 'No jokes match your filters'}
          </div>
        )}
      </div>
      
      <Modal isOpen={showAddJokeForm} onClose={() => setShowAddJokeForm(false)}>
        <AddJokeForm onSave={handleAddJoke} onCancel={() => setShowAddJokeForm(false)} />
      </Modal>
    </div>
  );
});

JokeBank.displayName = 'JokeBank';

export default JokeBank;