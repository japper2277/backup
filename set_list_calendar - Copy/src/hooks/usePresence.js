import { useState, useEffect, useCallback, useRef } from 'react';
import { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp, push, remove } from 'firebase/database';
import { auth } from '../firebase/config.js';

// Hook for managing user presence in a setlist using Firebase Realtime Database
export function useSetlistPresence(setlistId) {
  const [activeUsers, setActiveUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const presenceRef = useRef(null);
  const myPresenceRef = useRef(null);
  const myPresenceKey = useRef(null);
  const cleanupFunctions = useRef([]);

  // Initialize presence system when user is authenticated and setlistId is provided
  useEffect(() => {
    if (!setlistId || !auth.currentUser) {
      return;
    }

    const rtdb = getDatabase();
    const setlistPresenceRef = ref(rtdb, `presence/${setlistId}`);
    presenceRef.current = setlistPresenceRef;

    // My presence reference - store the key separately to avoid path issues
    const presenceKey = push(ref(rtdb, `presence/${setlistId}`)).key;
    myPresenceKey.current = presenceKey;
    myPresenceRef.current = ref(rtdb, `presence/${setlistId}/${presenceKey}`);

    // Set up presence data
    const presenceData = {
      userId: auth.currentUser.uid,
      displayName: auth.currentUser.displayName || auth.currentUser.email || 'Anonymous',
      avatar: auth.currentUser.photoURL || null,
      joinedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      isActive: true,
      currentlyEditing: null
    };

    // Set initial presence
    set(myPresenceRef.current, presenceData)
      .then(() => {
        setIsConnected(true);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to set initial presence:', err);
        setError('Failed to connect to presence system');
      });

    // Set up automatic cleanup on disconnect
    onDisconnect(myPresenceRef.current).remove()
      .then(() => {
        console.log('Disconnect cleanup configured');
      })
      .catch((err) => {
        console.error('Failed to configure disconnect cleanup:', err);
      });

    // Listen to all users' presence in this setlist
    const presenceListener = onValue(setlistPresenceRef, (snapshot) => {
      const presenceData = snapshot.val();
      if (presenceData) {
        const users = Object.entries(presenceData).map(([key, userData]) => ({
          presenceKey: key,
          ...userData,
          // Convert Firebase timestamps to JavaScript dates if needed
          joinedAt: userData.joinedAt ? new Date(userData.joinedAt).toISOString() : new Date().toISOString(),
          lastSeen: userData.lastSeen ? new Date(userData.lastSeen).toISOString() : new Date().toISOString()
        }));
        
        // Filter out current user and inactive users
        const otherActiveUsers = users.filter(user => 
          user.userId !== auth.currentUser?.uid && 
          user.isActive
        );
        
        setActiveUsers(otherActiveUsers);
      } else {
        setActiveUsers([]);
      }
    }, (err) => {
      console.error('Presence listener error:', err);
      setError('Failed to track active users');
    });

    cleanupFunctions.current.push(() => presenceListener());

    // Update presence periodically to show activity
    const heartbeatInterval = setInterval(() => {
      if (myPresenceKey.current && auth.currentUser) {
        set(ref(rtdb, `presence/${setlistId}/${myPresenceKey.current}/lastSeen`), serverTimestamp())
          .catch((err) => {
            console.error('Failed to update heartbeat:', err);
          });
      }
    }, 30000); // Update every 30 seconds

    cleanupFunctions.current.push(() => clearInterval(heartbeatInterval));

    // Cleanup function
    return () => {
      cleanupFunctions.current.forEach(cleanup => cleanup());
      cleanupFunctions.current = [];

      // Remove my presence when component unmounts
      if (myPresenceRef.current) {
        remove(myPresenceRef.current)
          .catch((err) => {
            console.error('Failed to cleanup presence on unmount:', err);
          });
      }
      
      setIsConnected(false);
      setActiveUsers([]);
    };
  }, [setlistId]);

  // Update what the user is currently editing
  const updateCurrentlyEditing = useCallback((activity) => {
    if (!myPresenceKey.current || !auth.currentUser || !setlistId) {
      return;
    }

    const rtdb = getDatabase();
    const editingRef = ref(rtdb, `presence/${setlistId}/${myPresenceKey.current}/currentlyEditing`);
    
    set(editingRef, activity)
      .catch((err) => {
        console.error('Failed to update currently editing:', err);
      });
  }, [setlistId]);

  // Clear what the user is currently editing
  const clearCurrentlyEditing = useCallback(() => {
    updateCurrentlyEditing(null);
  }, [updateCurrentlyEditing]);

  // Get users currently editing a specific joke
  const getUsersEditingJoke = useCallback((jokeId) => {
    return activeUsers.filter(user => user.currentlyEditing === jokeId);
  }, [activeUsers]);

  // Get users currently editing target time
  const getUsersEditingTargetTime = useCallback(() => {
    return activeUsers.filter(user => user.currentlyEditing === 'editing-target-time');
  }, [activeUsers]);

  // Get users currently editing any joke duration
  const getUsersEditingDuration = useCallback((jokeId = null) => {
    if (jokeId) {
      return activeUsers.filter(user => user.currentlyEditing === `editing-joke-duration-${jokeId}`);
    }
    return activeUsers.filter(user => 
      user.currentlyEditing && 
      user.currentlyEditing.startsWith('editing-joke-duration-')
    );
  }, [activeUsers]);

  // Helper to start editing target time
  const startEditingTargetTime = useCallback(() => {
    updateCurrentlyEditing('editing-target-time');
  }, [updateCurrentlyEditing]);

  // Helper to start editing joke duration
  const startEditingJokeDuration = useCallback((jokeId) => {
    updateCurrentlyEditing(`editing-joke-duration-${jokeId}`);
  }, [updateCurrentlyEditing]);

  // Update user status (active/inactive)
  const updateStatus = useCallback((isActive) => {
    if (!myPresenceKey.current || !auth.currentUser || !setlistId) {
      return;
    }

    const rtdb = getDatabase();
    const statusRef = ref(rtdb, `presence/${setlistId}/${myPresenceKey.current}/isActive`);
    
    set(statusRef, isActive)
      .catch((err) => {
        console.error('Failed to update status:', err);
      });
  }, [setlistId]);

  // Handle window focus/blur for presence
  useEffect(() => {
    const handleFocus = () => updateStatus(true);
    const handleBlur = () => updateStatus(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [updateStatus]);

  return {
    activeUsers,
    isConnected,
    error,
    updateCurrentlyEditing,
    clearCurrentlyEditing,
    getUsersEditingJoke,
    getUsersEditingTargetTime,
    getUsersEditingDuration,
    startEditingTargetTime,
    startEditingJokeDuration,
    updateStatus
  };
}

// Hook for cursor/activity tracking (more advanced presence)
export function useCursorPresence(setlistId) {
  const [userCursors, setUserCursors] = useState({});

  const updateCursor = useCallback(async (position, activity) => {
    if (!auth.currentUser || !setlistId) return;

    const rtdb = getDatabase();
    const cursorRef = ref(rtdb, `cursors/${setlistId}/${auth.currentUser.uid}`);
    
    try {
      await set(cursorRef, {
        userId: auth.currentUser.uid,
        position,
        activity, // e.g., 'editing', 'viewing', 'dragging'
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating cursor:', error);
    }
  }, [setlistId]);

  useEffect(() => {
    if (!setlistId) return;

    const rtdb = getDatabase();
    const cursorsRef = ref(rtdb, `cursors/${setlistId}`);
    
    const unsubscribe = onValue(
      cursorsRef,
      (snapshot) => {
        const cursorsData = snapshot.val();
        const cursors = {};
        
        if (cursorsData) {
          Object.entries(cursorsData).forEach(([userId, data]) => {
            // Only show cursors from the last 10 seconds
            const now = new Date();
            const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
            
            if ((now - timestamp) < 10000 && userId !== auth.currentUser?.uid) {
              cursors[userId] = data;
            }
          });
        }
        
        setUserCursors(cursors);
      },
      (error) => {
        console.error('Error listening to cursors:', error);
      }
    );

    return () => unsubscribe();
  }, [setlistId]);

  return {
    userCursors,
    updateCursor
  };
}