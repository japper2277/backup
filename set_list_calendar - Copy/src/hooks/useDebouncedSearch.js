import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Debounced search hook with caching
 * Provides smooth search experience with performance optimizations
 */
export function useDebouncedSearch(searchFunction, debounceMs = 300) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [query, debounceMs]);
  
  // Execute search when debounced query changes
  useEffect(() => {
    if (!searchFunction) return;
    
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    const executeSearch = async () => {
      try {
        const searchResults = await Promise.resolve(searchFunction(debouncedQuery));
        setResults(searchResults || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    
    executeSearch();
  }, [debouncedQuery, searchFunction]);
  
  const clearQuery = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setResults([]);
    setIsSearching(false);
  }, []);
  
  return {
    query,
    debouncedQuery,
    results,
    isSearching,
    setQuery,
    clearQuery
  };
}

/**
 * Cached search hook with LRU cache
 * Caches search results to avoid re-computation
 */
export function useCachedSearch(searchFunction, debounceMs = 300, cacheSize = 50) {
  const [cache] = useState(() => new Map());
  
  const cachedSearchFunction = useCallback((query) => {
    // Check cache first
    if (cache.has(query)) {
      const cached = cache.get(query);
      // Move to end (LRU)
      cache.delete(query);
      cache.set(query, cached);
      return cached;
    }
    
    // Execute search
    const results = searchFunction(query);
    
    // Add to cache
    if (cache.size >= cacheSize) {
      // Remove oldest entry
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(query, results);
    
    return results;
  }, [searchFunction, cache, cacheSize]);
  
  return useDebouncedSearch(cachedSearchFunction, debounceMs);
}

/**
 * Simple debounce utility
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}