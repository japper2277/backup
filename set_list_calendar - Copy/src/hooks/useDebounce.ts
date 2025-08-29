/**
 * Google Team Performance Hook: Debounced Search
 * 
 * Prevents excessive API calls and state updates during rapid user input.
 * Target: Sub-300ms response time for search operations.
 */

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Debounce hook for delaying function execution
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  
  return debouncedValue
}

/**
 * Debounced callback hook for function execution
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T, 
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay]) as T
}

/**
 * Advanced debounced search hook with performance tracking
 */
export function useDebouncedSearch(
  initialQuery: string = '', 
  delay: number = 300,
  onSearch?: (query: string, metrics: { searchTime: number; resultCount: number }) => void
) {
  const [query, setQuery] = useState(initialQuery)
  const [isSearching, setIsSearching] = useState(false)
  const debouncedQuery = useDebounce(query, delay)
  const searchStartTime = useRef<number>(0)
  
  // Track when user starts typing
  const handleQueryChange = useCallback((newQuery: string) => {
    if (!isSearching && newQuery !== query) {
      setIsSearching(true)
      searchStartTime.current = performance.now()
    }
    setQuery(newQuery)
  }, [query, isSearching])
  
  // Track when debounced search completes
  useEffect(() => {
    if (isSearching && debouncedQuery !== undefined) {
      const searchTime = performance.now() - searchStartTime.current
      setIsSearching(false)
      
      if (onSearch) {
        // This will be called with search results from the consuming component
        onSearch(debouncedQuery, { searchTime, resultCount: 0 })
      }
    }
  }, [debouncedQuery, isSearching, onSearch])
  
  return {
    query,
    debouncedQuery,
    isSearching,
    setQuery: handleQueryChange,
    clearQuery: () => setQuery('')
  }
}

/**
 * Performance-optimized search hook with caching
 */
export function useCachedSearch<T>(
  searchFn: (query: string) => T[],
  delay: number = 300,
  cacheSize: number = 50
) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, delay)
  const cache = useRef(new Map<string, { results: T[]; timestamp: number }>())
  const [results, setResults] = useState<T[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }
    
    setIsSearching(true)
    
    // Check cache first
    const cached = cache.current.get(debouncedQuery)
    const now = Date.now()
    
    // Use cached results if less than 5 minutes old
    if (cached && (now - cached.timestamp) < 300000) {
      setResults(cached.results)
      setIsSearching(false)
      return
    }
    
    // Perform search
    const startTime = performance.now()
    const searchResults = searchFn(debouncedQuery)
    const searchTime = performance.now() - startTime
    
    // Cache results
    cache.current.set(debouncedQuery, { results: searchResults, timestamp: now })
    
    // Limit cache size
    if (cache.current.size > cacheSize) {
      const firstKey = cache.current.keys().next().value
      cache.current.delete(firstKey)
    }
    
    setResults(searchResults)
    setIsSearching(false)
    
    // Log slow searches
    if (searchTime > 100) {
      console.warn(`🔍 Slow search: "${debouncedQuery}" took ${searchTime}ms`)
    }
  }, [debouncedQuery, searchFn, cacheSize])
  
  return {
    query,
    results,
    isSearching,
    setQuery,
    clearQuery: () => setQuery(''),
    clearCache: () => cache.current.clear()
  }
}