// Application State Management

// Global state
let mics = [];
let allMics = [];
let markers = {};
let favorites = [];
let userDocRef;

// Active filters
let activeFilters = {
    day: null,
    borough: [],
    neighborhood: [],
    cost: [],
    customTimeStart: '',
    customTimeEnd: '',
    sort: 'currentTime',
    showFavorites: false,
    search: '',
    mapFilterEnabled: false
};

// Mobile state
let currentMobileView = 'map';
let mapFilterEnabled = false;

// Onboarding state
let hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding') === 'true';
let currentTooltipStep = 0;

// Super highlight state
let superHighlightedMicId = null;
let superHighlightTimeout = null;

// Accessibility state
let lastFocusedElement = null;
let focusableElements = [];
let currentFocusIndex = 0;

// Loading state
let emptyStateTimeout = null;

// Spiderfy state
let currentSpiderfyElements = null;

// State management functions
function setMics(newMics) {
    mics = newMics;
    allMics = newMics;
}

function getMics() {
    return mics;
}

function getAllMics() {
    return allMics;
}

function setMarkers(newMarkers) {
    markers = newMarkers;
}

function getMarkers() {
    return markers;
}

function setFavorites(newFavorites) {
    favorites = newFavorites;
}

function getFavorites() {
    return favorites;
}

function setActiveFilters(newFilters) {
    activeFilters = { ...activeFilters, ...newFilters };
}

function getActiveFilters() {
    return activeFilters;
}

function setUserDocRef(ref) {
    userDocRef = ref;
}

function getUserDocRef() {
    return userDocRef;
}

function setCurrentMobileView(view) {
    currentMobileView = view;
}

function getCurrentMobileView() {
    return currentMobileView;
}

function setMapFilterEnabled(enabled) {
    mapFilterEnabled = enabled;
    activeFilters.mapFilterEnabled = enabled;
}

function getMapFilterEnabled() {
    return mapFilterEnabled;
}

function setHasSeenOnboarding(seen) {
    hasSeenOnboarding = seen;
    localStorage.setItem('hasSeenOnboarding', seen.toString());
}

function getHasSeenOnboarding() {
    return hasSeenOnboarding;
}

function setCurrentTooltipStep(step) {
    currentTooltipStep = step;
}

function getCurrentTooltipStep() {
    return currentTooltipStep;
}

function setSuperHighlightedMicId(id) {
    superHighlightedMicId = id;
}

function getSuperHighlightedMicId() {
    return superHighlightedMicId;
}

function setSuperHighlightTimeout(timeout) {
    superHighlightTimeout = timeout;
}

function getSuperHighlightTimeout() {
    return superHighlightTimeout;
}

function setLastFocusedElement(element) {
    lastFocusedElement = element;
}

function getLastFocusedElement() {
    return lastFocusedElement;
}

function setFocusableElements(elements) {
    focusableElements = elements;
}

function getFocusableElements() {
    return focusableElements;
}

function setCurrentFocusIndex(index) {
    currentFocusIndex = index;
}

function getCurrentFocusIndex() {
    return currentFocusIndex;
}

function setEmptyStateTimeout(timeout) {
    emptyStateTimeout = timeout;
}

function getEmptyStateTimeout() {
    return emptyStateTimeout;
}

function setCurrentSpiderfyElements(elements) {
    // Clean up previous spiderfy elements if they exist
    if (currentSpiderfyElements) {
        if (currentSpiderfyElements.centerPoint) {
            currentSpiderfyElements.centerPoint.remove();
        }
        if (currentSpiderfyElements.legLines) {
            currentSpiderfyElements.legLines.forEach(line => line.remove());
        }
    }
    currentSpiderfyElements = elements;
}

function getCurrentSpiderfyElements() {
    return currentSpiderfyElements;
}

// Get current day helper
function getCurrentDay() {
    return new Date().toLocaleString('en-us', { weekday: 'long' });
}

// Initialize default filters
function initializeDefaultFilters() {
    // Keep day filter as null to show all venues by default
    // Users can explicitly select a day if they want to filter
    
    if (!activeFilters.sort) {
        activeFilters.sort = 'currentTime';
    }
    
    if (!activeFilters.customTimeStart || !activeFilters.customTimeEnd) {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const isPM = hours >= 12;
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const nowStr = `${displayHours}:${minutes.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
        activeFilters.customTimeStart = nowStr;
        activeFilters.customTimeEnd = '11:59 PM';
    }
}

// Clear all state
function clearAll() {
    mics = [];
    allMics = [];
    markers = {};
    favorites = [];
    userDocRef = null;
    activeFilters = {
        day: null,
        borough: [],
        neighborhood: [],
        cost: [],
        customTimeStart: '',
        customTimeEnd: '',
        sort: 'currentTime',
        showFavorites: false,
        search: '',
        mapFilterEnabled: false
    };
    currentMobileView = 'map';
    mapFilterEnabled = false;
    superHighlightedMicId = null;
    if (superHighlightTimeout) {
        clearTimeout(superHighlightTimeout);
        superHighlightTimeout = null;
    }
    lastFocusedElement = null;
    focusableElements = [];
    currentFocusIndex = 0;
    if (emptyStateTimeout) {
        clearTimeout(emptyStateTimeout);
        emptyStateTimeout = null;
    }
    currentSpiderfyElements = null;
    console.log('[MicFinderState] All state cleared');
}

// Export state management
window.MicFinderState = {
    setMics,
    getMics,
    getAllMics,
    setMarkers,
    getMarkers,
    setFavorites,
    getFavorites,
    setActiveFilters,
    getActiveFilters,
    setUserDocRef,
    getUserDocRef,
    setCurrentMobileView,
    getCurrentMobileView,
    setMapFilterEnabled,
    getMapFilterEnabled,
    setHasSeenOnboarding,
    getHasSeenOnboarding,
    setCurrentTooltipStep,
    getCurrentTooltipStep,
    setSuperHighlightedMicId,
    getSuperHighlightedMicId,
    setSuperHighlightTimeout,
    getSuperHighlightTimeout,
    setLastFocusedElement,
    getLastFocusedElement,
    setFocusableElements,
    getFocusableElements,
    setCurrentFocusIndex,
    getCurrentFocusIndex,
    setEmptyStateTimeout,
    getEmptyStateTimeout,
    getCurrentDay,
    initializeDefaultFilters,
    setCurrentSpiderfyElements,
    getCurrentSpiderfyElements,
    clearAll
}; 