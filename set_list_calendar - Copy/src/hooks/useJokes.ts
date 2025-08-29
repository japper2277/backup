/**
 * useJokes Hook - Production-ready data fetching
 * Integrates API service with proper error handling and Sentry reporting
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getJokes, createJoke, updateJoke, deleteJoke, type Joke, type SearchParams, type APIError } from '../api/jokeService';
import { reportAPIError, trackUserAction, trackPerformance } from '../config/sentry';

interface UseJokesState {
  jokes: Joke[];
  loading: boolean;
  error: APIError | null;
  hasMore: boolean;
  page: number;
  total: number;
  requestTime: number;
}

interface UseJokesActions {
  search: (query: string) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  addJoke: (jokeData: Partial<Joke>) => Promise<Joke>;
  editJoke: (id: string, updates: Partial<Joke>) => Promise<Joke>;
  removeJoke: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useJokes = (initialParams: Partial<SearchParams> = {}) => {
  const [state, setState] = useState<UseJokesState>({
    jokes: [],
    loading: true,
    error: null,
    hasMore: true,
    page: 1,
    total: 0,
    requestTime: 0,
  });

  const currentParams = useRef<SearchParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialParams,
  });

  const abortController = useRef<AbortController | null>(null);

  // Fetch jokes with proper error handling and performance tracking
  const fetchJokes = useCallback(async (params: SearchParams, append: boolean = false) => {
    // Cancel any ongoing request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    const startTime = performance.now();
    
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      // Track user action
      trackUserAction('fetch_jokes', {
        page: params.page,
        query: params.query,
        append,
      });

      const response = await getJokes(params);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Track performance
      trackPerformance('jokes_fetch', duration, {
        page: params.page,
        limit: params.limit,
        query: params.query,
        results_count: response.data.length,
        total_results: response.pagination.total,
      });

      setState(prev => ({
        ...prev,
        jokes: append ? [...prev.jokes, ...response.data] : response.data,
        loading: false,
        hasMore: response.pagination.hasNext,
        page: params.page,
        total: response.pagination.total,
        requestTime: response.meta.requestTime,
      }));

      currentParams.current = params;

    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Don't report aborted requests as errors
      if (error.name === 'AbortError') {
        return;
      }

      console.error('Failed to fetch jokes:', error);

      // Report to Sentry with context
      reportAPIError(error, '/api/jokes', 'GET', params);

      setState(prev => ({
        ...prev,
        loading: false,
        error: error as APIError,
      }));

      // Track failed performance
      trackPerformance('jokes_fetch_failed', duration, {
        error_code: error.code || 'UNKNOWN',
        error_message: error.message,
      });
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchJokes(currentParams.current);

    // Cleanup on unmount
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [fetchJokes]);

  // Actions
  const actions: UseJokesActions = {
    search: async (query: string) => {
      const newParams = {
        ...currentParams.current,
        query,
        page: 1, // Reset to first page
      };
      await fetchJokes(newParams, false);
    },

    loadMore: async () => {
      if (!state.hasMore || state.loading) {
        return;
      }

      const nextParams = {
        ...currentParams.current,
        page: state.page + 1,
      };
      await fetchJokes(nextParams, true); // Append to existing jokes
    },

    refresh: async () => {
      await fetchJokes(currentParams.current, false);
    },

    addJoke: async (jokeData: Partial<Joke>) => {
      const startTime = performance.now();
      
      try {
        trackUserAction('add_joke', { has_setup: !!jokeData.setup });

        const newJoke = await createJoke(jokeData);
        
        const endTime = performance.now();
        trackPerformance('joke_create', endTime - startTime);

        // Add to the beginning of the list
        setState(prev => ({
          ...prev,
          jokes: [newJoke, ...prev.jokes],
          total: prev.total + 1,
        }));

        return newJoke;
      } catch (error) {
        reportAPIError(error, '/api/jokes', 'POST', jokeData);
        throw error;
      }
    },

    editJoke: async (id: string, updates: Partial<Joke>) => {
      const startTime = performance.now();
      
      try {
        trackUserAction('edit_joke', { joke_id: id });

        const updatedJoke = await updateJoke(id, updates);
        
        const endTime = performance.now();
        trackPerformance('joke_update', endTime - startTime);

        // Update in the list
        setState(prev => ({
          ...prev,
          jokes: prev.jokes.map(joke => 
            joke.id === id ? updatedJoke : joke
          ),
        }));

        return updatedJoke;
      } catch (error) {
        reportAPIError(error, `/api/jokes/${id}`, 'PUT', updates);
        throw error;
      }
    },

    removeJoke: async (id: string) => {
      const startTime = performance.now();
      
      try {
        trackUserAction('delete_joke', { joke_id: id });

        await deleteJoke(id);
        
        const endTime = performance.now();
        trackPerformance('joke_delete', endTime - startTime);

        // Remove from the list
        setState(prev => ({
          ...prev,
          jokes: prev.jokes.filter(joke => joke.id !== id),
          total: prev.total - 1,
        }));

      } catch (error) {
        reportAPIError(error, `/api/jokes/${id}`, 'DELETE');
        throw error;
      }
    },

    clearError: () => {
      setState(prev => ({
        ...prev,
        error: null,
      }));
    },
  };

  return {
    ...state,
    ...actions,
  };
};