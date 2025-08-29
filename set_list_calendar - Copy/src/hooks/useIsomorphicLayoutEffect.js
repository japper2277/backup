import { useLayoutEffect, useEffect } from 'react';

/**
 * Isomorphic layout effect hook for React 19 compatibility
 * Uses useLayoutEffect on client and useEffect on server to prevent SSR warnings
 */
export const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;