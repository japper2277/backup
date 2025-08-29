// Firebase Configuration
// Replace these placeholder values with your actual Firebase project credentials
// Get these from: https://console.firebase.google.com/ → Your Project → Project Settings → General → Your Apps
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCt13mRSpdQhVQ2dV0MzCqJSBIpNfPvVds",
    authDomain: "mic-finder-app.firebaseapp.com",
    projectId: "mic-finder-app",
    storageBucket: "mic-finder-app.appspot.com",
    messagingSenderId: "803569348671",
    appId: "1:803569348671:web:cca8a2859e87148352888a"
  };

// Initialize Firebase (only if config is valid)
let auth;
let db;
if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
} else {
    console.warn('Firebase not configured. Please update the firebaseConfig object in config.js with your actual Firebase credentials.');
    // Create dummy objects to prevent errors
    auth = { 
        currentUser: null,
        onAuthStateChanged: () => {} // Add a dummy function to prevent crashes
    };
    db = { collection: () => ({ add: () => Promise.resolve(), get: () => Promise.resolve({ docs: [] }) }) };
}

// Constants
const FILTER_STORAGE_KEY = 'micFinderFilters';
const FAVORITES_STORAGE_KEY = 'micFinderFavorites';

// Onboarding steps
const onboardingSteps = [
    {
        element: '#day-filter',
        title: 'Select Your Day',
        content: 'Choose which day you want to find mics for. The current day is selected by default.',
        position: 'bottom'
    },
    {
        element: '#map',
        title: 'Interactive Map',
        content: 'See all mics on the map. Click markers to view details and get directions.',
        position: 'center'
    },
    {
        element: '#right-sidebar',
        title: 'Mic List',
        content: 'View all available mics in a list format. Click any mic to see more details.',
        position: 'left'
    },
    {
        element: '.mobile-filter-btn, #mobile-filter-toggle',
        title: 'Filters',
        content: 'Refine your search by borough, time, and more.',
        position: 'right',
        mobileOnly: true
    }
];

// Map configuration
const MAP_CONFIG = {
    defaultCenter: [40.73, -73.99],
    defaultZoom: 12,
    maxZoom: 18,
    minZoom: 10,
    clusterMaxRadius: 40,
    clusterDisableAtZoom: 16
};

// Google Sheets integration removed - using local CSV only
const SPREADSHEET_SOURCES = {
    // All Google Sheets sources disabled
};

// Spreadsheet update settings - DISABLED
const SPREADSHEET_UPDATE_CONFIG = {
    enabled: false, // Google Sheets integration disabled
    checkOnLoad: false, // Don't check for updates
    showNotifications: false, // No update notifications
    debugMode: false, // Debug mode off
    dataSourcePriority: ['csv'], // Only use local CSV
    maxRetries: 0, // No retries needed
    fallbackToCSV: true, // Always use CSV
    validateBeforeApply: false, // No validation needed
    backupInterval: 0 // No backups needed
};

// Export for use in other modules
window.MicFinderConfig = {
    firebaseConfig,
    auth,
    db,
    FILTER_STORAGE_KEY,
    FAVORITES_STORAGE_KEY,
    onboardingSteps,
    MAP_CONFIG,
    SPREADSHEET_SOURCES,
    SPREADSHEET_UPDATE_CONFIG
}; 