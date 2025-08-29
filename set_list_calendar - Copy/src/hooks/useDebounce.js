import { useRef, useCallback } from 'react'

/**
 * Custom hook for debouncing function calls
 * Improves performance by limiting how often functions execute
 */
export function useDebounce(callback, delay) {
  const timeoutRef = useRef()

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay])
}