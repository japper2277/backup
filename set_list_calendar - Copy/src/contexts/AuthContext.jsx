import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Create user profile in Firestore
  async function createUserProfile(user, additionalData = {}) {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(userRef);
    
    if (!snapshot.exists()) {
      const { displayName, email, photoURL } = user;
      const createdAt = serverTimestamp();
      
      try {
        await setDoc(userRef, {
          displayName: displayName || additionalData.displayName || '',
          email,
          photoURL: photoURL || '',
          createdAt,
          updatedAt: createdAt,
          preferences: {
            theme: 'dark',
            notifications: true,
            defaultView: 'week'
          },
          ...additionalData
        });
      } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
      }
    }
    
    return userRef;
  }

  // Get user profile from Firestore
  async function getUserProfile(userId) {
    if (!userId) return null;
    
    try {
      const userRef = doc(db, 'users', userId);
      const snapshot = await getDoc(userRef);
      
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Sign up with email and password
  async function signup(email, password, displayName) {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      // Create user profile in Firestore
      await createUserProfile(user, { displayName });
      
      return user;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  // Sign in with email and password
  async function signin(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      console.error('Signin error:', error);
      throw error;
    }
  }

  // Sign in with Google
  async function signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Create user profile if it doesn't exist
      await createUserProfile(result.user);
      
      return result.user;
    } catch (error) {
      console.error('Google signin error:', error);
      throw error;
    }
  }

  // Sign out
  async function logout() {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Reset password
  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // Update user profile
  async function updateUserProfile(updates) {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Refresh local profile
      const updatedProfile = await getUserProfile(currentUser.uid);
      setUserProfile(updatedProfile);
      
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Check if user has access to a setlist
  function hasSetlistAccess(setlist, accessType = 'read') {
    if (!currentUser || !setlist) return false;
    
    // Owner has full access
    if (setlist.ownerId === currentUser.uid) return true;
    
    // Check shared access
    if (setlist.sharedWith && Array.isArray(setlist.sharedWith)) {
      const userAccess = setlist.sharedWith.find(share => share.userId === currentUser.uid);
      if (!userAccess) return false;
      
      // Check permission level
      if (accessType === 'read') return true;
      if (accessType === 'comment') return ['comment', 'edit'].includes(userAccess.permission);
      if (accessType === 'edit') return userAccess.permission === 'edit';
    }
    
    return false;
  }

  useEffect(() => {
    let unsubscribe;
    
    // Initialize Firebase Auth with error handling
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing Firebase Auth...');
        
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          try {
            setCurrentUser(user);
            setError(null); // Clear any previous errors
            
            if (user) {
              console.log('👤 User authenticated:', user.email);
              // Get user profile from Firestore
              const profile = await getUserProfile(user.uid);
              setUserProfile(profile);
            } else {
              console.log('👤 User signed out');
              setUserProfile(null);
            }
            
            setAuthInitialized(true);
            setLoading(false);
            
          } catch (profileError) {
            console.error('❌ Error loading user profile:', profileError);
            setError(profileError);
            setLoading(false);
          }
        });
        
      } catch (authError) {
        console.error('❌ Firebase Auth initialization failed:', authError);
        setError(authError);
        setLoading(false);
        setAuthInitialized(false);
      }
    };
    
    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    signin,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    hasSetlistAccess,
    loading,
    error,
    authInitialized
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}