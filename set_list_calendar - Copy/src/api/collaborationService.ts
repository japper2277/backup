/**
 * Real-time Collaboration Service
 * 
 * Replaces the mock jokeService with live Firebase Firestore real-time listeners.
 * Enables multiple users to collaborate on setlists with instant updates.
 */

import { 
  doc, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  serverTimestamp,
  getDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../firebase/config.js';
import { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import { trackSetlistCreated } from '../services/analytics';

// Re-export types from the original service for compatibility
export interface Joke {
  id: string;
  text: string;
  setup?: string;
  punchline?: string;
  tags: string[];
  position: number;
  estimated_duration: number; // Duration in seconds
  createdAt: string;
  updatedAt: string;
  authorId: string;
  lastEditedBy: string;
  lastEditedAt: string;
  commentCount?: number; // Number of comments on this joke
}

export interface Comment {
  id: string;
  jokeId: string;
  setlistId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  parentId?: string; // For threaded replies
  mentions: string[]; // Array of user IDs mentioned in the comment
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
}

export interface Setlist {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  targetTime: number; // Target duration in seconds
  createdAt: string;
  updatedAt: string;
  sharedWith: Array<{
    userId: string;
    permission: 'read' | 'comment' | 'edit';
    joinedAt: string;
  }>;
  isPublic: boolean;
}

export interface PresenceUser {
  userId: string;
  displayName: string;
  avatar?: string;
  joinedAt: string;
  lastSeen: string;
  isActive: boolean;
  currentlyEditing?: string;
}

// CollaborationError class is defined at the end of the file

/**
 * Subscribe to real-time updates for a setlist's jokes
 * Returns an unsubscribe function to stop listening
 */
export function subscribeToSetlistJokes(
  setlistId: string, 
  onUpdate: (jokes: Joke[]) => void,
  onError?: (error: CollaborationError) => void
): () => void {
  if (!setlistId) {
    throw new Error('Setlist ID is required');
  }

  const jokesQuery = query(
    collection(db, `setlists/${setlistId}/jokes`),
    orderBy('position', 'asc')
  );

  const unsubscribe = onSnapshot(
    jokesQuery,
    (querySnapshot) => {
      const jokes: Joke[] = [];
      querySnapshot.forEach((doc) => {
        jokes.push({
          id: doc.id,
          ...doc.data()
        } as Joke);
      });
      
      // Sort by position to maintain order
      jokes.sort((a, b) => a.position - b.position);
      onUpdate(jokes);
    },
    (error) => {
      console.error('Error in setlist jokes subscription:', error);
      const collaborationError: CollaborationError = {
        name: 'CollaborationError',
        message: error.message,
        code: error.code || 'SUBSCRIPTION_FAILED'
      };
      onError?.(collaborationError);
    }
  );

  return unsubscribe;
}

/**
 * Subscribe to real-time updates for a specific setlist
 */
export function subscribeToSetlist(
  setlistId: string,
  onUpdate: (setlist: Setlist) => void,
  onError?: (error: CollaborationError) => void
): () => void {
  const setlistRef = doc(db, 'setlists', setlistId);

  const unsubscribe = onSnapshot(
    setlistRef,
    async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const setlist: Setlist = {
          id: docSnapshot.id,
          ...docSnapshot.data()
        } as Setlist;
        onUpdate(setlist);
      } else if (setlistId.startsWith('demo-') && auth.currentUser) {
        // Auto-create demo setlist if it doesn't exist
        console.log('Creating demo setlist:', setlistId, 'for user:', auth.currentUser.uid);
        try {
          const demoSetlist = {
            id: setlistId,
            title: 'Collaborative Demo Setlist',
            userId: auth.currentUser.uid, // Use actual authenticated user
            targetTime: 300, // 5 minutes
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isDemo: true,
            collaborators: [],
            jokes: [],
            metadata: {
              totalDuration: 0,
              jokeCount: 0,
              averageJokeDuration: 0
            }
          };
          
          await setDoc(setlistRef, demoSetlist);
          console.log('Demo setlist created successfully for user:', auth.currentUser.uid);
        } catch (error) {
          console.error('Failed to create demo setlist:', error);
          if (onError) {
            onError(new CollaborationError('Failed to create demo setlist', 'creation-failed'));
          }
        }
      }
    },
    (error) => {
      console.error('Error in setlist subscription:', error);
      const collaborationError: CollaborationError = {
        name: 'CollaborationError',
        message: error.message,
        code: error.code || 'SETLIST_SUBSCRIPTION_FAILED'
      };
      onError?.(collaborationError);
    }
  );

  return unsubscribe;
}

/**
 * Add a new joke to a setlist
 */
export async function addJokeToSetlist(setlistId: string, jokeData: Partial<Joke>): Promise<string> {
  if (!auth.currentUser) {
    throw new CollaborationError('User must be authenticated');
  }

  // Get the current highest position to append at the end
  const jokesRef = collection(db, `setlists/${setlistId}/jokes`);
  const lastPositionQuery = query(jokesRef, orderBy('position', 'desc'), limit(1));
  const snapshot = await getDocs(lastPositionQuery);
  
  let nextPosition = 0;
  if (!snapshot.empty) {
    const lastJoke = snapshot.docs[0].data();
    nextPosition = (lastJoke.position || 0) + 1;
  }

  const newJoke = {
    text: jokeData.text || '',
    setup: jokeData.setup || '',
    punchline: jokeData.punchline || '',
    tags: jokeData.tags || [],
    estimated_duration: jokeData.estimated_duration || 60, // Default to 1 minute
    position: nextPosition,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    authorId: auth.currentUser.uid,
    lastEditedBy: auth.currentUser.uid,
    lastEditedAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(jokesRef, newJoke);
    return docRef.id;
  } catch (error) {
    console.error('Error adding joke:', error);
    throw new CollaborationError('Failed to add joke to setlist');
  }
}

/**
 * Update an existing joke with real-time conflict detection
 */
export async function updateJoke(setlistId: string, jokeId: string, updates: Partial<Joke>): Promise<void> {
  if (!auth.currentUser) {
    throw new CollaborationError('User must be authenticated');
  }

  const jokeRef = doc(db, `setlists/${setlistId}/jokes`, jokeId);

  const updateData = {
    ...updates,
    updatedAt: serverTimestamp(),
    lastEditedBy: auth.currentUser.uid,
    lastEditedAt: serverTimestamp()
  };

  // Remove fields that shouldn't be updated
  delete updateData.id;
  delete updateData.createdAt;
  delete updateData.authorId;

  try {
    await updateDoc(jokeRef, updateData);
  } catch (error) {
    console.error('Error updating joke:', error);
    throw new CollaborationError('Failed to update joke');
  }
}

/**
 * Delete a joke from a setlist
 */
export async function deleteJoke(setlistId: string, jokeId: string): Promise<void> {
  if (!auth.currentUser) {
    throw new CollaborationError('User must be authenticated');
  }

  const jokeRef = doc(db, `setlists/${setlistId}/jokes`, jokeId);

  try {
    await deleteDoc(jokeRef);
  } catch (error) {
    console.error('Error deleting joke:', error);
    throw new CollaborationError('Failed to delete joke');
  }
}

/**
 * Reorder jokes in a setlist
 */
export async function reorderJokes(setlistId: string, jokeIds: string[]): Promise<void> {
  if (!auth.currentUser) {
    throw new CollaborationError('User must be authenticated');
  }

  const batch = writeBatch(db);

  jokeIds.forEach((jokeId, index) => {
    const jokeRef = doc(db, `setlists/${setlistId}/jokes`, jokeId);
    batch.update(jokeRef, {
      position: index,
      updatedAt: serverTimestamp(),
      lastEditedBy: auth.currentUser?.uid,
      lastEditedAt: serverTimestamp()
    });
  });

  try {
    await batch.commit();
  } catch (error) {
    console.error('Error reordering jokes:', error);
    throw new CollaborationError('Failed to reorder jokes');
  }
}

/**
 * Create a new collaborative setlist
 */
export async function createSetlist(setlistData: Partial<Setlist>): Promise<string> {
  if (!auth.currentUser) {
    throw new CollaborationError('User must be authenticated');
  }

  const newSetlist = {
    title: setlistData.title || 'Untitled Setlist',
    description: setlistData.description || '',
    targetTime: setlistData.targetTime || 300, // Default to 5 minutes
    ownerId: auth.currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    sharedWith: [],
    isPublic: setlistData.isPublic || false
  };

  try {
    const docRef = await addDoc(collection(db, 'setlists'), newSetlist);
    
    // Track setlist creation
    trackSetlistCreated(docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating setlist:', error);
    throw new CollaborationError('Failed to create setlist');
  }
}

/**
 * Update the target time for a setlist
 */
export async function updateSetlistTargetTime(setlistId: string, targetTime: number): Promise<void> {
  if (!auth.currentUser) {
    throw new CollaborationError('User must be authenticated');
  }

  const setlistRef = doc(db, 'setlists', setlistId);

  try {
    await updateDoc(setlistRef, {
      targetTime,
      updatedAt: serverTimestamp(),
      lastEditedBy: auth.currentUser.uid,
      lastEditedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating setlist target time:', error);
    throw new CollaborationError('Failed to update target time');
  }
}

/**
 * Share a setlist with another user
 */
export async function shareSetlist(
  setlistId: string, 
  userId: string, 
  permission: 'read' | 'comment' | 'edit'
): Promise<void> {
  if (!auth.currentUser) {
    throw new CollaborationError('User must be authenticated');
  }

  const setlistRef = doc(db, 'setlists', setlistId);
  
  try {
    // Get current setlist data
    const setlistDoc = await getDoc(setlistRef);
    if (!setlistDoc.exists()) {
      throw new CollaborationError('Setlist not found');
    }

    const currentData = setlistDoc.data();
    const sharedWith = currentData.sharedWith || [];
    
    // Check if user is already shared with
    const existingIndex = sharedWith.findIndex(share => share.userId === userId);
    
    if (existingIndex >= 0) {
      // Update existing permission
      sharedWith[existingIndex] = {
        userId,
        permission,
        joinedAt: sharedWith[existingIndex].joinedAt // Keep original join date
      };
    } else {
      // Add new share
      sharedWith.push({
        userId,
        permission,
        joinedAt: new Date().toISOString()
      });
    }

    await updateDoc(setlistRef, {
      sharedWith,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error sharing setlist:', error);
    throw new CollaborationError('Failed to share setlist');
  }
}

/**
 * Comment System Functions
 */

/**
 * Add a comment to a joke
 */
export async function addComment(
  setlistId: string,
  jokeId: string,
  content: string,
  mentions: string[] = [],
  parentId?: string
): Promise<Comment> {
  if (!auth.currentUser) {
    throw new CollaborationError('Must be logged in to add comments');
  }

  try {
    const commentData = {
      jokeId,
      setlistId,
      authorId: auth.currentUser.uid,
      authorName: auth.currentUser.displayName || 'Anonymous',
      authorAvatar: auth.currentUser.photoURL || undefined,
      content,
      parentId: parentId || null,
      mentions,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isEdited: false
    };

    // Add comment to Firestore
    const commentsRef = collection(db, `setlists/${setlistId}/comments`);
    const docRef = await addDoc(commentsRef, commentData);

    // Update joke comment count
    const jokeRef = doc(db, `setlists/${setlistId}/jokes`, jokeId);
    const jokeDoc = await getDoc(jokeRef);
    if (jokeDoc.exists()) {
      const currentCount = jokeDoc.data().commentCount || 0;
      await updateDoc(jokeRef, {
        commentCount: currentCount + 1
      });
    }

    // Return comment with generated ID
    return {
      id: docRef.id,
      ...commentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Comment;

  } catch (error) {
    console.error('Error adding comment:', error);
    throw new CollaborationError('Failed to add comment');
  }
}

/**
 * Subscribe to real-time comments for a joke
 */
export function subscribeToJokeComments(
  setlistId: string,
  jokeId: string,
  onUpdate: (comments: Comment[]) => void,
  onError?: (error: CollaborationError) => void
): () => void {
  const commentsQuery = query(
    collection(db, `setlists/${setlistId}/comments`),
    where('jokeId', '==', jokeId),
    orderBy('createdAt', 'asc')
  );

  const unsubscribe = onSnapshot(
    commentsQuery,
    (querySnapshot) => {
      const comments: Comment[] = [];
      querySnapshot.forEach((doc) => {
        comments.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        } as Comment);
      });
      
      onUpdate(comments);
    },
    (error) => {
      console.error('Error in comments subscription:', error);
      const collaborationError: CollaborationError = {
        name: 'CollaborationError',
        message: error.message,
        code: error.code || 'SUBSCRIPTION_FAILED'
      };
      onError?.(collaborationError);
    }
  );

  return unsubscribe;
}

/**
 * Update a comment
 */
export async function updateComment(
  setlistId: string,
  commentId: string,
  content: string,
  mentions: string[] = []
): Promise<void> {
  if (!auth.currentUser) {
    throw new CollaborationError('Must be logged in to update comments');
  }

  try {
    const commentRef = doc(db, `setlists/${setlistId}/comments`, commentId);
    await updateDoc(commentRef, {
      content,
      mentions,
      updatedAt: serverTimestamp(),
      isEdited: true
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    throw new CollaborationError('Failed to update comment');
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(
  setlistId: string,
  commentId: string,
  jokeId: string
): Promise<void> {
  if (!auth.currentUser) {
    throw new CollaborationError('Must be logged in to delete comments');
  }

  try {
    // Delete the comment
    const commentRef = doc(db, `setlists/${setlistId}/comments`, commentId);
    await deleteDoc(commentRef);

    // Update joke comment count
    const jokeRef = doc(db, `setlists/${setlistId}/jokes`, jokeId);
    const jokeDoc = await getDoc(jokeRef);
    if (jokeDoc.exists()) {
      const currentCount = jokeDoc.data().commentCount || 0;
      await updateDoc(jokeRef, {
        commentCount: Math.max(0, currentCount - 1)
      });
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw new CollaborationError('Failed to delete comment');
  }
}

// Custom error class
export class CollaborationError extends Error {
  constructor(message: string, public code?: string, public details?: Record<string, any>) {
    super(message);
    this.name = 'CollaborationError';
  }
}