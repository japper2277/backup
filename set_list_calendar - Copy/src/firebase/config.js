// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration object
// Using Vite environment variables (VITE_*) with proper fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase configuration
const isValidConfig = firebaseConfig.apiKey && 
                     firebaseConfig.authDomain && 
                     firebaseConfig.projectId &&
                     firebaseConfig.apiKey !== 'demo-api-key' &&
                     firebaseConfig.apiKey !== 'demo-key';

if (!isValidConfig) {
  console.error('🔥 Firebase configuration is invalid or missing. Please check your .env.local file.');
  console.log('Expected environment variables:', {
    VITE_FIREBASE_API_KEY: firebaseConfig.apiKey ? '[SET]' : '[MISSING]',
    VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain ? '[SET]' : '[MISSING]',
    VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId ? '[SET]' : '[MISSING]'
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Development mode: connect to emulators
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    // Connect to Firebase emulators for local development
    // Note: These will only connect if not already connected
    
    // Auth emulator
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    console.log('🔐 Firebase Auth Emulator connected');
    
    // Firestore emulator
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔥 Firestore Emulator connected');
    
    // Functions emulator (optional)
    connectFunctionsEmulator(functions, "localhost", 5001);
    console.log('⚡ Firebase Functions Emulator connected');
    
  } catch (error) {
    // Emulators might already be connected, which is fine
    if (error.code === 'auth/emulator-config-failed' || 
        error.message.includes('already been called') ||
        error.message.includes('Cannot call')) {
      console.log('🔧 Firebase emulators already connected');
    } else {
      console.warn('⚠️ Firebase emulator connection failed:', error.message);
      console.log('📱 Continuing with production Firebase...');
    }
  }
}

// Export the Firebase app instance
export default app;