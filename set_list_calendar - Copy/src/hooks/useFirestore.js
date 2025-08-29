import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

// Hook for listening to a Firestore collection
export function useFirestoreCollection(collectionPath, queryConstraints = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const collectionRef = collection(db, collectionPath);
    const q = queryConstraints.length > 0 ? query(collectionRef, ...queryConstraints) : collectionRef;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(documents);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore collection error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionPath, JSON.stringify(queryConstraints)]);

  return { data, loading, error };
}

// Hook for listening to a Firestore document
export function useFirestoreDocument(documentPath) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!documentPath) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const docRef = doc(db, documentPath);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() });
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore document error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [documentPath]);

  return { data, loading, error };
}

// Hook for user's jokes
export function useUserJokes() {
  const { currentUser } = useAuth();
  const [jokes, setJokes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setJokes([]);
      setLoading(false);
      return;
    }

    const jokesRef = collection(db, `users/${currentUser.uid}/jokes`);
    const q = query(jokesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jokesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setJokes(jokesList);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching jokes:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Add a new joke
  const addJoke = useCallback(async (jokeData) => {
    if (!currentUser) throw new Error('User must be authenticated');

    try {
      const jokesRef = collection(db, `users/${currentUser.uid}/jokes`);
      const newJoke = {
        ...jokeData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        archived: false
      };
      
      const docRef = await addDoc(jokesRef, newJoke);
      return { id: docRef.id, ...newJoke };
    } catch (error) {
      console.error('Error adding joke:', error);
      throw error;
    }
  }, [currentUser]);

  // Update a joke
  const updateJoke = useCallback(async (jokeId, updates) => {
    if (!currentUser) throw new Error('User must be authenticated');

    try {
      const jokeRef = doc(db, `users/${currentUser.uid}/jokes/${jokeId}`);
      await updateDoc(jokeRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating joke:', error);
      throw error;
    }
  }, [currentUser]);

  // Delete a joke
  const deleteJoke = useCallback(async (jokeId) => {
    if (!currentUser) throw new Error('User must be authenticated');

    try {
      const jokeRef = doc(db, `users/${currentUser.uid}/jokes/${jokeId}`);
      await deleteDoc(jokeRef);
    } catch (error) {
      console.error('Error deleting joke:', error);
      throw error;
    }
  }, [currentUser]);

  return {
    jokes,
    loading,
    error,
    addJoke,
    updateJoke,
    deleteJoke
  };
}

// Hook for setlists (both owned and shared)
export function useSetlists() {
  const { currentUser } = useAuth();
  const [setlists, setSetlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setSetlists([]);
      setLoading(false);
      return;
    }

    // Query for setlists where user is owner or in sharedWith array
    const setlistsRef = collection(db, 'setlists');
    const ownedQuery = query(setlistsRef, where('ownerId', '==', currentUser.uid));
    const sharedQuery = query(setlistsRef, where('sharedWith', 'array-contains-any', [
      { userId: currentUser.uid, permission: 'read' },
      { userId: currentUser.uid, permission: 'comment' },
      { userId: currentUser.uid, permission: 'edit' }
    ]));

    let allSetlists = new Map();

    const unsubscribeOwned = onSnapshot(
      ownedQuery,
      (snapshot) => {
        snapshot.docs.forEach(doc => {
          allSetlists.set(doc.id, { id: doc.id, ...doc.data() });
        });
        setSetlists(Array.from(allSetlists.values()));
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching owned setlists:', err);
        setError(err);
        setLoading(false);
      }
    );

    const unsubscribeShared = onSnapshot(
      sharedQuery,
      (snapshot) => {
        snapshot.docs.forEach(doc => {
          allSetlists.set(doc.id, { id: doc.id, ...doc.data() });
        });
        setSetlists(Array.from(allSetlists.values()));
      },
      (err) => {
        console.error('Error fetching shared setlists:', err);
        setError(err);
      }
    );

    return () => {
      unsubscribeOwned();
      unsubscribeShared();
    };
  }, [currentUser]);

  // Create a new setlist
  const createSetlist = useCallback(async (setlistData) => {
    if (!currentUser) throw new Error('User must be authenticated');

    try {
      const setlistsRef = collection(db, 'setlists');
      const newSetlist = {
        ...setlistData,
        ownerId: currentUser.uid,
        jokeIds: [],
        sharedWith: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        collaborationSettings: {
          allowComments: true,
          allowEditing: false,
          requireApproval: false
        }
      };
      
      const docRef = await addDoc(setlistsRef, newSetlist);
      return { id: docRef.id, ...newSetlist };
    } catch (error) {
      console.error('Error creating setlist:', error);
      throw error;
    }
  }, [currentUser]);

  // Update a setlist
  const updateSetlist = useCallback(async (setlistId, updates) => {
    if (!currentUser) throw new Error('User must be authenticated');

    try {
      const setlistRef = doc(db, `setlists/${setlistId}`);
      await updateDoc(setlistRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating setlist:', error);
      throw error;
    }
  }, [currentUser]);

  // Share a setlist
  const shareSetlist = useCallback(async (setlistId, userId, permission = 'read') => {
    if (!currentUser) throw new Error('User must be authenticated');

    try {
      const setlistRef = doc(db, `setlists/${setlistId}`);
      const setlistDoc = await getDoc(setlistRef);
      
      if (!setlistDoc.exists()) throw new Error('Setlist not found');
      
      const setlistData = setlistDoc.data();
      const sharedWith = setlistData.sharedWith || [];
      
      // Check if user is already shared with
      const existingIndex = sharedWith.findIndex(share => share.userId === userId);
      
      if (existingIndex >= 0) {
        // Update existing permission
        sharedWith[existingIndex].permission = permission;
      } else {
        // Add new share
        sharedWith.push({ userId, permission });
      }
      
      await updateDoc(setlistRef, {
        sharedWith,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sharing setlist:', error);
      throw error;
    }
  }, [currentUser]);

  return {
    setlists,
    loading,
    error,
    createSetlist,
    updateSetlist,
    shareSetlist
  };
}

// Hook for comments on a specific joke in a setlist
export function useJokeComments(setlistId, jokeId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!setlistId || !jokeId) {
      setComments([]);
      setLoading(false);
      return;
    }

    const commentsRef = collection(db, `setlists/${setlistId}/jokes/${jokeId}/comments`);
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setComments(commentsList);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching comments:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [setlistId, jokeId]);

  // Add a comment
  const addComment = useCallback(async (text) => {
    if (!currentUser || !setlistId || !jokeId) throw new Error('Missing required parameters');

    try {
      const commentsRef = collection(db, `setlists/${setlistId}/jokes/${jokeId}/comments`);
      const newComment = {
        text,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        authorPhotoURL: currentUser.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isEdited: false
      };
      
      const docRef = await addDoc(commentsRef, newComment);
      return { id: docRef.id, ...newComment };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }, [currentUser, setlistId, jokeId]);

  return {
    comments,
    loading,
    error,
    addComment
  };
}