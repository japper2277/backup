// Mobile Functionality
// Core mobile device handling, routing, and mobile-specific features

// Mobile state management
// currentMobileView is declared in state.js
let mobileViewHistory = [];
let isInMobileMode = false;

// Mobile detection and routing
function initializeMobileRouting() {
    const isMobile = window.MicFinderUtils.isMobileDevice();
    
    console.log('[Mobile] Initializing mobile routing:', {
        isMobile,
        pathname: window.location.pathname,
        width: window.innerWidth,
        userAgent: navigator.userAgent.substring(0, 50) + '...'
    });
    
    // Set mobile mode flag
    isInMobileMode = isMobile;
    
    // Restore preserved state if available
    restorePreservedState();
    
    // Initialize mobile-specific features if in mobile mode
    if (isInMobileMode) {
        initializeMobileFeatures();
    } else {
        console.log('[Mobile] Desktop mode - mobile features not initialized');
    }
}

// Initialize mobile-specific features
function initializeMobileFeatures() {
    console.log('[Mobile] Initializing mobile features');
    
    // Set initial mobile view
    currentMobileView = 'map';
    

    
    // Initialize mobile search
    initializeMobileSearch();
    
    // Initialize quick filters with delay to ensure everything is loaded
    setTimeout(() => {
        initializeQuickFilters();
        // Mobile pills are handled by the existing system
        console.log('[Mobile] Mobile pills handled by existing renderActivePills function');
    }, 100);
    
    // Initialize mobile gestures
    initializeMobileGestures();
    
    // Setup mobile-specific event listeners
    setupMobileEventListeners();
    
    // Handle mobile view switching
    setupMobileViewSwitching();
}

// Mobile search functionality
function initializeMobileSearch() {
    const searchInput = document.getElementById('minimized-search-input');
    if (!searchInput) return;
    
    console.log('[Mobile] Initializing mobile search');
    
    // Debounced search to improve performance
    const debouncedSearch = window.MicFinderUtils.debounce((query) => {
        if (window.MicFinderState && window.MicFinderApp) {
            const currentFilters = window.MicFinderState.getActiveFilters();
            const newFilters = { ...currentFilters, search: query.trim() };
            window.MicFinderState.setActiveFilters(newFilters);
            window.MicFinderFilters.saveFilterState(newFilters);
            window.MicFinderApp.render();
        }
    }, 300);
    
    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
    
    // Mobile search enhancements
    searchInput.addEventListener('focus', () => {
        searchInput.parentElement.classList.add('focused');
    });
    
    searchInput.addEventListener('blur', () => {
        searchInput.parentElement.classList.remove('focused');
    });
}

// Quick filters functionality - enhance the existing mobile pills system
function initializeQuickFilters() {
    console.log('[Mobile] initializeQuickFilters called');
    const quickFiltersContainer = document.getElementById('active-pills-row-mobile');
    if (!quickFiltersContainer) {
        console.log('[Mobile] ERROR: active-pills-row-mobile container not found');
        return;
    }
    
    console.log('[Mobile] Found active-pills-row-mobile container:', quickFiltersContainer);
    console.log('[Mobile] Initializing quick filters - will enhance existing mobile pills system');
    
    // The mobile pills are already being rendered by the existing system
    // Just add any mobile-specific enhancements here
    console.log('[Mobile] Mobile pills system already handled by existing renderActivePills function');
}

// Mobile gestures (basic implementation for Phase 1)
function initializeMobileGestures() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;
    
    console.log('[Mobile] Initializing mobile gestures');
    
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    mapElement.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    mapElement.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipeGesture();
    }, { passive: true });
    
    function handleSwipeGesture() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const minSwipeDistance = 50;
        
        // Horizontal swipes
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                console.log('[Mobile] Swipe right detected');
                // Could be used for navigation in future phases
            } else {
                console.log('[Mobile] Swipe left detected');
                // Could be used for navigation in future phases
            }
        }
        
        // Vertical swipes
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0) {
                console.log('[Mobile] Swipe down detected');
                // Could implement pull-to-refresh in future phases
            } else {
                console.log('[Mobile] Swipe up detected');
                // Could implement bottom sheet expansion in future phases
            }
        }
    }
}

// Mobile-specific event listeners
function setupMobileEventListeners() {
    console.log('[Mobile] Setting up mobile event listeners');
    
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (window.MicFinderMap && window.MicFinderMap.getMap) {
                const map = window.MicFinderMap.getMap();
                if (map) {
                    map.invalidateSize();
                }
            }
        }, 100);
    });
    
    // Handle visibility changes (app switching)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && isInMobileMode) {
            // App became visible - refresh if needed
            console.log('[Mobile] App became visible');
        }
    });
    
    // Handle window resize for responsive switching
    window.addEventListener('resize', window.MicFinderUtils.debounce(() => {
        const wasMobile = isInMobileMode;
        const isMobile = window.MicFinderUtils.isMobileDevice();
        
        // Update mobile mode flag
        isInMobileMode = isMobile;
        
        // Invalidate map if it exists
        if (window.MicFinderMap && window.MicFinderMap.getMap) {
            const map = window.MicFinderMap.getMap();
            if (map) {
                setTimeout(() => map.invalidateSize(), 100);
            }
        }
    }, 250));
}

// Mobile view switching
function setupMobileViewSwitching() {
    if (!isInMobileMode) return;
    
    console.log('[Mobile] Setting up mobile view switching');
    
    // This will be enhanced when we implement bottom navigation
    // For now, just ensure map is the default view
    currentMobileView = 'map';
}

// Switch mobile view (for bottom navigation)
function switchMobileView(view) {
    if (!isInMobileMode) return;
    
    console.log(`[Mobile] Switching to view: ${view}`);
    
    // Add to history
    if (currentMobileView !== view) {
        mobileViewHistory.push(currentMobileView);
    }
    
    currentMobileView = view;
    
    // Handle view-specific logic
    switch (view) {
        case 'map':
            // Ensure map is visible and properly sized
            if (window.MicFinderMap && window.MicFinderMap.getMap) {
                setTimeout(() => {
                    const map = window.MicFinderMap.getMap();
                    if (map) {
                        map.invalidateSize();
                    }
                }, 100);
            }
            break;
            
        case 'list':
            // Future: Show list view
            console.log('[Mobile] List view requested - to be implemented');
            break;
            
        case 'filters':
            // Future: Show filters panel
            console.log('[Mobile] Filters view requested - to be implemented');
            break;
    }
    
    // Dispatch custom event for other modules
    window.dispatchEvent(new CustomEvent('mobileViewChanged', {
        detail: { view, previousView: mobileViewHistory[mobileViewHistory.length - 1] }
    }));
}

// Get current mobile view
function getCurrentMobileView() {
    return currentMobileView;
}

// Check if in mobile mode
function isMobileMode() {
    return isInMobileMode;
}

// Mobile-specific utilities
function vibrate(pattern = 50) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

function showMobileToast(message, duration = 3000) {
    // Create simple toast notification for mobile
    const toast = document.createElement('div');
    toast.className = 'mobile-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 24px;
        font-size: 14px;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // Animate out and remove
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Mobile] DOM loaded - initializing mobile routing');
    initializeMobileRouting();
    
    // Favorites functionality moved to mobile-nav.js for consolidation
});

// Favorites functionality completely moved to mobile-nav.js for consolidation

// State preservation functions for routing
function preserveCurrentState() {
    const state = {};
    
    // Preserve search query
    const searchInput = document.getElementById('search-input');
    if (searchInput && searchInput.value) {
        state.search = searchInput.value;
    }
    
    // Preserve active filters if MicFinderState is available
    if (window.MicFinderState && typeof window.MicFinderState.getActiveFilters === 'function') {
        const filters = window.MicFinderState.getActiveFilters();
        if (filters && Object.keys(filters).length > 0) {
            state.filters = filters;
        }
    }
    
    // Preserve current URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.toString()) {
        state.urlParams = urlParams.toString();
    }
    
    return state;
}

function buildStatePreservationParams(state) {
    const params = new URLSearchParams();
    
    // Add search if present
    if (state.search) {
        params.set('search', state.search);
    }
    
    // Add filters if present (encode as JSON)
    if (state.filters) {
        params.set('filters', JSON.stringify(state.filters));
    }
    
    // Preserve existing URL params
    if (state.urlParams) {
        const existingParams = new URLSearchParams(state.urlParams);
        for (const [key, value] of existingParams) {
            if (!params.has(key)) {
                params.set(key, value);
            }
        }
    }
    
    return params.toString();
}

function restorePreservedState() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Restore search
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = searchQuery;
        }
    }
    
    // Restore filters
    const filtersParam = urlParams.get('filters');
    if (filtersParam && window.MicFinderState && window.MicFinderFilters) {
        try {
            const filters = JSON.parse(filtersParam);
            window.MicFinderState.setActiveFilters(filters);
            window.MicFinderFilters.saveFilterState(filters);
        } catch (e) {
            console.warn('[Mobile] Failed to restore filters:', e);
        }
    }
    
    // Clean up the URL parameters after restoring state
    if (urlParams.has('search') || urlParams.has('filters')) {
        const cleanParams = new URLSearchParams(window.location.search);
        cleanParams.delete('search');
        cleanParams.delete('filters');
        
        const newUrl = window.location.pathname + (cleanParams.toString() ? '?' + cleanParams.toString() : '') + window.location.hash;
        window.history.replaceState({}, '', newUrl);
    }
}

// Redirect loop prevention
function hasRecentRedirect() {
    const lastRedirect = sessionStorage.getItem('lastMobileRedirect');
    if (!lastRedirect) return false;
    
    const lastRedirectTime = parseInt(lastRedirect);
    const now = Date.now();
    
    // Prevent redirects within 2 seconds
    return (now - lastRedirectTime) < 2000;
}

// Check if page was refreshed (to prevent unnecessary redirects)
function isPageRefresh() {
    // Check if this is a refresh by looking at performance navigation timing
    if (performance.navigation && performance.navigation.type === 1) {
        return true;
    }
    
    // Alternative check using performance API
    if (performance.getEntriesByType) {
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries.length > 0 && navEntries[0].type === 'reload') {
            return true;
        }
    }
    
    return false;
}

function setRedirectFlag() {
    sessionStorage.setItem('lastMobileRedirect', Date.now().toString());
}

// Mobile pills are handled by the existing renderActivePills function
// This function is no longer needed since the main system handles mobile pills

// Helper function to get current day
function getCurrentDay() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
}

// Helper functions to set filters
function setDayFilter(day) {
    if (!window.MicFinderState || !window.MicFinderFilters) return;
    
    const currentFilters = window.MicFinderState.getActiveFilters();
    const newFilters = { ...currentFilters, day: day };
    
    window.MicFinderState.setActiveFilters(newFilters);
    window.MicFinderFilters.saveFilterState(newFilters);
    
    if (window.MicFinderApp) {
        window.MicFinderApp.render();
    }
    
    // Mobile pills handled by existing system
}

function setCostFilter(cost) {
    if (!window.MicFinderState || !window.MicFinderFilters) return;
    
    const currentFilters = window.MicFinderState.getActiveFilters();
    const newFilters = { ...currentFilters, cost: cost };
    
    window.MicFinderState.setActiveFilters(newFilters);
    window.MicFinderFilters.saveFilterState(newFilters);
    
    if (window.MicFinderApp) {
        window.MicFinderApp.render();
    }
    
    // Mobile pills handled by existing system
}

function setBoroughFilter(borough) {
    if (!window.MicFinderState || !window.MicFinderFilters) return;
    
    const currentFilters = window.MicFinderState.getActiveFilters();
    const newFilters = { ...currentFilters, borough: borough };
    
    window.MicFinderState.setActiveFilters(newFilters);
    window.MicFinderFilters.saveFilterState(newFilters);
    
    if (window.MicFinderApp) {
        window.MicFinderApp.render();
    }
    
    // Mobile pills handled by existing system
}

// Mobile remove filter function - replicate the desktop logic
function removeMobileFilter(category, value) {
    console.log(`[Mobile] Removing filter: ${category} = ${value}`);
    
    if (!window.MicFinderState || !window.MicFinderFilters) {
        console.log('[Mobile] ERROR: MicFinderState or MicFinderFilters not available');
        return;
    }
    
    // Get current global filters
    const globalFilters = window.MicFinderState.getActiveFilters();
    
    if (category === 'time') {
        globalFilters.customTimeStart = '10:00 AM';
        globalFilters.customTimeEnd = '11:45 PM';
        globalFilters.timeSetViaModal = false;
        delete globalFilters.time;
    } else if (category === 'dayOfWeek') {
        if (Array.isArray(globalFilters.day)) {
            globalFilters.day = globalFilters.day.filter(day => day !== value);
            if (globalFilters.day.length === 0) {
                delete globalFilters.day;
            }
        } else {
            delete globalFilters.day;
        }
    } else if (category === 'search') {
        delete globalFilters.search;
    } else if (category === 'showFavorites') {
        delete globalFilters.showFavorites;
    } else if (Array.isArray(globalFilters[category])) {
        globalFilters[category] = globalFilters[category].filter(item => item !== value);
        if (globalFilters[category].length === 0) {
            delete globalFilters[category];
        }
    } else {
        delete globalFilters[category];
    }
    
    // Apply the new filters
    window.MicFinderState.setActiveFilters(globalFilters);
    window.MicFinderFilters.saveFilterState(globalFilters);
    
    if (window.MicFinderApp) {
        window.MicFinderApp.render();
    }
    
    // Update mobile pills
    // Mobile pills handled by existing system
    
    console.log('[Mobile] Filter removed. New filters:', globalFilters);
}


// Export mobile functionality
window.MicFinderMobile = {
    initializeMobileRouting,
    initializeMobileFeatures,
    switchMobileView,
    getCurrentMobileView,
    isMobileMode,
    vibrate,
    showMobileToast,
    preserveCurrentState,
    restorePreservedState,
    // renderMobileFilterPills removed - handled by existing system
    initializeQuickFilters // Export for debugging
};