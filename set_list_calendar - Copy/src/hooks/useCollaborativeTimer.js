/**
 * useCollaborativeTimer Hook
 * 
 * Provides real-time collaborative timer functionality for setlists.
 * Handles target time synchronization and joke duration calculations.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCollaborativeSetlist } from './useCollaborativeSetlist.js';
import { updateSetlistTargetTime } from '../api/collaborationService.ts';
import { useDebounce } from './useDebounce.js';
import { useSetlistPresence } from './usePresence.js';

/**
 * Hook for collaborative setlist timer functionality
 * @param {string} setlistId - The ID of the setlist
 * @returns {Object} Timer state and actions
 */
export const useCollaborativeTimer = (setlistId) => {
  const {
    jokes,
    setlist,
    loading,
    error,
    connected,
    editJoke,
    canEdit
  } = useCollaborativeSetlist(setlistId);

  // Get presence system for timer-specific editing states
  const {
    activeUsers,
    updateCurrentlyEditing,
    clearCurrentlyEditing,
    getUsersEditingJoke,
    getUsersEditingTargetTime,
    getUsersEditingDuration,
    startEditingTargetTime,
    startEditingJokeDuration
  } = useSetlistPresence(setlistId);

  const [localTargetTime, setLocalTargetTime] = useState(null);
  const [isUpdatingTarget, setIsUpdatingTarget] = useState(false);

  // Debounce target time updates to prevent excessive Firestore writes
  const debouncedTargetTime = useDebounce(localTargetTime, 800);

  // Initialize local target time from setlist data
  useEffect(() => {
    if (setlist?.targetTime !== undefined && localTargetTime === null) {
      setLocalTargetTime(setlist.targetTime);
    }
  }, [setlist?.targetTime, localTargetTime]);

  // Update Firestore when debounced target time changes
  useEffect(() => {
    if (
      debouncedTargetTime !== null && 
      setlist?.targetTime !== undefined &&
      debouncedTargetTime !== setlist.targetTime &&
      canEdit
    ) {
      updateTargetTimeInFirestore(debouncedTargetTime);
    }
  }, [debouncedTargetTime, setlist?.targetTime, canEdit]);

  // Update target time in Firestore
  const updateTargetTimeInFirestore = useCallback(async (newTargetTime) => {
    if (!setlistId || !canEdit) return;

    setIsUpdatingTarget(true);
    try {
      await updateSetlistTargetTime(setlistId, newTargetTime);
    } catch (err) {
      console.error('Failed to update target time:', err);
      // Revert to server value on error
      setLocalTargetTime(setlist?.targetTime || 300);
    } finally {
      setIsUpdatingTarget(false);
    }
  }, [setlistId, canEdit, setlist?.targetTime]);

  // Calculate total setlist duration
  const totalTime = useMemo(() => {
    if (!jokes || jokes.length === 0) return 0;
    
    return jokes.reduce((total, joke) => {
      return total + (joke.estimated_duration || 0);
    }, 0);
  }, [jokes]);

  // Get current target time (prioritize local for responsiveness)
  const targetTime = localTargetTime !== null ? localTargetTime : (setlist?.targetTime || 300);

  // Calculate timer statistics
  const timerStats = useMemo(() => {
    const difference = totalTime - targetTime;
    const isOverTime = totalTime > targetTime;
    const isCloseToTarget = Math.abs(difference) <= 30; // Within 30 seconds
    const percentOfTarget = targetTime > 0 ? (totalTime / targetTime) * 100 : 0;
    const jokeCount = jokes?.length || 0;

    return {
      totalTime,
      targetTime,
      difference,
      isOverTime,
      isCloseToTarget,
      percentOfTarget,
      jokeCount
    };
  }, [totalTime, targetTime, jokes?.length]);

  // Format time helper
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Parse time helper
  const parseTime = useCallback((timeString) => {
    if (typeof timeString === 'number') return timeString;
    const [mins, secs] = timeString.split(':').map(Number);
    return (mins || 0) * 60 + (secs || 0);
  }, []);

  // Update joke duration with optimistic updates
  const updateJokeDuration = useCallback(async (jokeId, newDuration) => {
    if (!canEdit) return;

    try {
      await editJoke(jokeId, { estimated_duration: newDuration });
    } catch (err) {
      console.error('Failed to update joke duration:', err);
      throw err;
    }
  }, [editJoke, canEdit]);

  // Set target time (with local state for immediate feedback)
  const setTargetTime = useCallback((newTargetTime) => {
    if (!canEdit) return;
    
    const timeInSeconds = typeof newTargetTime === 'string' 
      ? parseTime(newTargetTime) 
      : newTargetTime;
      
    setLocalTargetTime(Math.max(0, timeInSeconds));
    
    // Note: Attribution flash functionality temporarily simplified
  }, [canEdit, parseTime, localTargetTime, setlist?.targetTime]);

  return {
    // Timer data
    ...timerStats,
    
    // State flags
    loading,
    error,
    connected,
    canEdit,
    isUpdatingTarget,
    
    // Jokes data for duration editing
    jokes,
    
    // Actions
    setTargetTime,
    updateJokeDuration,
    
    // Utilities
    formatTime,
    parseTime,
    
    // Presence data
    activeUsers,
    getUsersEditingTargetTime,
    getUsersEditingDuration,
    startEditingTargetTime,
    startEditingJokeDuration,
    clearCurrentlyEditing,
    
    // Raw setlist data for other components
    setlist
  };
};

export default useCollaborativeTimer;