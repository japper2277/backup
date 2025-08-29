// Main Application

// Global function for hiding the modal
function hideMicDetailsModal() {
    const micDetailModal = document.getElementById('mic-detail-modal');
    const micDetailModalContent = document.getElementById('mic-detail-modal-content');
    
    if (micDetailModal) {
        micDetailModal.classList.add('hidden');
        
        // Clean up event listeners to prevent accumulation
        if (micDetailModal._clickHandler) {
            micDetailModal.removeEventListener('click', micDetailModal._clickHandler);
            micDetailModal._clickHandler = null;
        }
        
        if (micDetailModal._keydownHandler) {
            window.removeEventListener('keydown', micDetailModal._keydownHandler);
            micDetailModal._keydownHandler = null;
        }
        
        // Clean up modal content to prevent memory leaks
        if (micDetailModalContent) {
            micDetailModalContent.innerHTML = '';
        }
        
        // Remove aria-modal attribute
        micDetailModal.removeAttribute('aria-modal');
        
        // Announce modal closing to screen readers
        if (window.MicFinderAccessibility && window.MicFinderAccessibility.announceToScreenReader) {
            window.MicFinderAccessibility.announceToScreenReader('Mic details closed');
        }
        
        // Restore focus to the element that opened the modal
        if (window.MicFinderAccessibility && window.MicFinderAccessibility.restoreFocus) {
            window.MicFinderAccessibility.restoreFocus();
        }
    }
}

// Make tooltip navigation functions global
window.nextTooltip = function() {
    const currentTooltip = document.querySelector('.tooltip');
    if (currentTooltip) {
        currentTooltip.remove();
    }
    const currentStep = window.MicFinderState.getCurrentTooltipStep();
    window.MicFinderState.setCurrentTooltipStep(currentStep + 1);
    
    if (currentStep + 1 < window.MicFinderConfig.onboardingSteps.length) {
        window.MicFinderUI.showTooltip();
    } else {
        window.MicFinderState.setHasSeenOnboarding(true);
    }
};

window.previousTooltip = function() {
    const currentTooltip = document.querySelector('.tooltip');
    if (currentTooltip) {
        currentTooltip.remove();
    }
    const currentStep = window.MicFinderState.getCurrentTooltipStep();
    window.MicFinderState.setCurrentTooltipStep(currentStep - 1);
    
    if (currentStep - 1 >= 0) {
        window.MicFinderUI.showTooltip();
    }
};

// Track last render time and pending render
let lastRenderTime = 0;
let pendingRender = null;

// Main render function
const render = () => {
    // If there's already a pending render, don't schedule another one
    if (pendingRender) {
        return;
    }

    const now = Date.now();
    // If we recently rendered, schedule a new render and return
    if (now - lastRenderTime < 300) {
        pendingRender = setTimeout(() => {
            pendingRender = null;
            render();
        }, 300);
        return;
    }

    lastRenderTime = now;
    let results = window.MicFinderFilters.applyAllFilters();
    
    // Deduplicate mics with same venue/address/coordinates AND same start time
    results = window.MicFinderUtils.deduplicateMics(results);
    
    // Debug: Log Tiny Cupboard count after all processing - COMMENTED OUT
    /*
    const tinyCupboardCount = results.filter(mic => mic.venue && mic.venue.toLowerCase().includes('tiny cupboard')).length;
    if (tinyCupboardCount > 0) {
        console.log('🏪 Final Tiny Cupboard count:', tinyCupboardCount);
    }
    */
    
    // Debug: Log Grove 34 count and details after all processing
    const grove34Mics = results.filter(mic => mic.venue && mic.venue.toLowerCase().includes('grove'));
    if (grove34Mics.length > 0) {
        console.log('🏢 [APP] Grove 34 mics after filtering:', grove34Mics.length);
        console.log('🏢 [APP] Grove 34 mics details:', grove34Mics.map(m => `${m.venue} (${m.day} ${m.time})`));
    }
    
    results = window.MicFinderFilters.sortResults(results);
    
    // Log mic count changes for debugging
    const resultsHeading = document.getElementById('results-heading');
    const currentCount = resultsHeading ? parseInt(resultsHeading.textContent.match(/\d+/)?.[0] || '0') : 0;
    if (results.length !== currentCount) {
        console.log(`Mic count changed: ${currentCount} → ${results.length} (map filter: ${window.MicFinderState.getMapFilterEnabled()})`);
    }
    
    // Break UI updates into smaller chunks to prevent performance violations
    requestAnimationFrame(() => {
        console.log('🔄 [APP] Updating UI - results.length:', results.length);
        
        // Phase 1: Update map markers (most expensive operation)
        const markerCount = window.MicFinderMap.updateMapMarkers(results);
        console.log('🗺️ [APP] Map returned marker count:', markerCount);
        
        // Phase 2: Update results heading immediately (lightweight)
        if (window.MicFinderUI && window.MicFinderUI.updateResultsHeading) {
            console.log('📊 [APP] Calling updateResultsHeading with results.length (sidebar mics):', results.length);
            window.MicFinderUI.updateResultsHeading(results.length);
        }
        
        // Phase 3: Defer heavier UI updates to next frame
        requestAnimationFrame(() => {
            // Only update UI components if they exist (not in minimized mode)
            if (window.MicFinderUI && window.MicFinderUI.renderMicList) {
                window.MicFinderUI.renderMicList(results);
            }
            
            // Phase 4: Defer remaining updates to prevent blocking
            setTimeout(() => {
                if (window.MicFinderUI && window.MicFinderUI.updateCurrentTimeDisplay) {
                    window.MicFinderUI.updateCurrentTimeDisplay();
                }
                if (window.MicFinderUI && window.MicFinderUI.highlightTodayDayPill) {
                    window.MicFinderUI.highlightTodayDayPill();
                }
                
                // Update active pills when state changes
                if (typeof renderActivePills === 'function') {
                    renderActivePills();
                }
            }, 0);
        });
    });
};

// Fetch data from CSV
async function fetchData() {
    window.MicFinderUI.showLoading();
    console.log('Calling loadMicData...');
    loadMicData((mics) => {
        if (mics && mics.length > 0) {
            console.log('Loaded mics in app:', mics.length);
        }
        window.MicFinderState.setMics(mics);
        // Always set day filter to today on load
        const todayDay = window.MicFinderUtils.getCurrentDay();
        
        // Set default time range (current time to 11:45 PM) for today
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes();
        const isPM = hours >= 12;
        
        // Convert to 12-hour format
        if (hours > 12) hours -= 12;
        if (hours === 0) hours = 12;
        
        // Round minutes to nearest 15
        const roundedMinutes = Math.round(minutes / 15) * 15;
        const minuteStr = roundedMinutes === 60 ? '00' : roundedMinutes.toString().padStart(2, '0');
        
        const startTime = `${hours.toString().padStart(2, '0')}:${minuteStr} ${isPM ? 'PM' : 'AM'}`;
        const endTime = '11:45 PM';
        
        window.MicFinderState.setActiveFilters({ 
            day: todayDay,
            customTimeStart: startTime,
            customTimeEnd: endTime
        });
        if (window.MicFinderUI && window.MicFinderUI.updateDayFilterUI) {
            window.MicFinderUI.updateDayFilterUI(todayDay);
        }
        window.MicFinderUI.hideLoading();
        window.MicFinderMap.ensureMapVisibility();
        render();
        
        // Ensure pills are rendered on initial load
        if (typeof renderActivePills === 'function') {
            setTimeout(() => renderActivePills(), 100);
        }
        
        // Load favorites after mic data is available
        if (window.MicFinderFavorites) {
            // Load favorites from localStorage first (for immediate display)
            window.MicFinderFavorites.loadFavoritesFromLocalStorage();
            
            // Then try to load from Firestore if user is authenticated
            const { auth } = window.MicFinderConfig;
            if (auth && auth.currentUser) {
                window.MicFinderFavorites.loadFavoritesFromFirestore();
            }
            
            // Auto-update favorites button state after favorites are loaded
            setTimeout(() => {
                if (window.updateFavoritesButtonState) {
                    console.log('🔄 Auto-updating favorites button state after mic data load...');
                    window.updateFavoritesButtonState();
                } else {
                    console.log('❌ updateFavoritesButtonState not available yet after mic data load');
                }
            }, 100);
        }
    });
}

// Initialize application
function initializeApp(minimizedMode = false) {
    console.log('[App] initializeApp called. minimizedMode:', minimizedMode);
    console.log('[App] window.MicFinderMap:', window.MicFinderMap);
    console.log('[App] window.map:', window.map);
    // Force map initialization for debugging
    window.MicFinderMap.initializeMap();
    console.log('[App] Initializing...', minimizedMode ? '(minimized mode)' : '');
    
    // Initialize state
    window.MicFinderState.initializeDefaultFilters();
    
    // Only initialize UI components if not in minimized mode
    if (!minimizedMode) {
        console.log('[App] Initializing UI components...');
        
        // Load initial filter state
        const initialFilters = window.MicFinderFilters.loadFilterState();
        
        // Override map filter setting for mobile devices
        if (window.MicFinderUtils && window.MicFinderUtils.isMobileDevice()) {
            initialFilters.mapFilterEnabled = false; // Show all mics in sidebar by default on mobile
            console.log('[App] Mobile device detected - setting map filter to OFF by default (show all mics)');
        }
        
        window.MicFinderState.setActiveFilters(initialFilters);
        
        // Apply filter state to UI elements
        window.MicFinderFilters.applyFilterState(initialFilters);
        
        // LOAD FAVORITES - Initialize favorites functionality
        if (window.MicFinderFavorites) {
            // Load favorites from localStorage first (for immediate display)
            window.MicFinderFavorites.loadFavoritesFromLocalStorage();
            
            // Then try to load from Firestore if user is authenticated
            const { auth } = window.MicFinderConfig;
            if (auth && auth.currentUser) {
                window.MicFinderFavorites.loadFavoritesFromFirestore();
            }
            
            // Auto-update favorites button state after favorites are loaded
            setTimeout(() => {
                if (window.updateFavoritesButtonState) {
                    console.log('🔄 Auto-updating favorites button state after app init...');
                    window.updateFavoritesButtonState();
                } else {
                    console.log('❌ updateFavoritesButtonState not available yet after app init');
                }
            }, 100);
        }
        
        // Setup sidebar event listeners
        if (window.MicFinderSidebar && window.MicFinderSidebar.setupSidebarEventListeners) {
            window.MicFinderSidebar.setupSidebarEventListeners();
        } else {
            console.error('MicFinderSidebar not available, setting up map filter toggle manually');
            // Fallback: set up map filter toggle directly
            const mapFilterToggle = document.getElementById('map-filter-toggle');
            if (mapFilterToggle) {
                mapFilterToggle.addEventListener('change', () => {
                    console.log('Map filter toggle changed:', mapFilterToggle.checked);
                    window.MicFinderFilters.clearBoundsCache();
                    window.MicFinderState.setMapFilterEnabled(mapFilterToggle.checked);
                    const activeFilters = window.MicFinderState.getActiveFilters();
                    activeFilters.mapFilterEnabled = mapFilterToggle.checked;
                    window.MicFinderState.setActiveFilters(activeFilters);
                    window.MicFinderFilters.saveFilterState(activeFilters);
                    window.MicFinderApp.render();
                });
            }
        }
        
        // Load mic data
        fetchData();
        
        // Add comprehensive map resize handler
        window.MicFinderMap.handleMapResize();
        
        // Handle browser back/forward navigation
        window.addEventListener('popstate', (event) => {
            if (event.state?.filters) {
                window.MicFinderState.setActiveFilters(event.state.filters);
                window.MicFinderFilters.applyFilterState(event.state.filters);
                render();
            }
        });
        
        // Setup authentication
        checkAuthState();
        
    } else if (minimizedMode) {
        // Minimized mode - just load data and render map
        console.log('[App] Minimized mode - loading data only...');
        fetchData();
        // Add map resize handler for minimized mode
        window.MicFinderMap.handleMapResize();
    }
}

// Setup Firebase authentication
function checkAuthState() {
    const { auth } = window.MicFinderConfig;
    if (!auth) return;

    auth.onAuthStateChanged(async user => {
        // Handle authentication state changes
        // For now, just re-render the mic list to show/hide edit/delete buttons
        await window.MicFinderApp.fetchData();
    });
}


// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 [APP] Mic Finder app starting up...');
    console.log('📁 [APP] Will load data from local CSV file only (Google Sheets disabled)');
    console.log('[App] DOMContentLoaded - initializing...');
    initializeApp();
});

// Export main app functionality
window.MicFinderApp = {
    render,
    fetchData,
    initializeApp,
    hideMicDetailsModal
};

// Global cache clearing function
window.clearMicFinderCache = function() {
    console.log('=== Clearing Mic Finder Cache ===');
    
    // Clear localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('micFinder') || key.includes('MicFinder') || key.includes('mic-finder'))) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('Removed localStorage key:', key);
    });
    
    // Clear sessionStorage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('micFinder') || key.includes('MicFinder') || key.includes('mic-finder'))) {
            sessionKeysToRemove.push(key);
        }
    }
    sessionKeysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
        console.log('Removed sessionStorage key:', key);
    });
    
    // Clear spreadsheet updater cache
    if (window.MicFinderSpreadsheetUpdater && window.MicFinderSpreadsheetUpdater.clearCache) {
        window.MicFinderSpreadsheetUpdater.clearCache();
        console.log('Cleared spreadsheet updater cache');
    }
    
    // Clear application state
    if (window.MicFinderState && window.MicFinderState.clearAll) {
        window.MicFinderState.clearAll();
        console.log('Cleared application state');
    }
    
    console.log('=== Cache Cleared - Please refresh the page ===');
    
    // Optionally reload the page
    if (confirm('Cache cleared! Reload the page to see changes?')) {
        window.location.reload();
    }
};

// Global debug function for troubleshooting
window.debugMicFinder = function() {
    console.log('=== Mic Finder Debug ===');
    console.log('Window width:', window.innerWidth);
    console.log('Is mobile:', window.MicFinderUtils.isMobileDevice());
    console.log('Body classes:', document.body.className);
    console.log('Mobile layout class:', document.body.classList.contains('mobile-layout'));
    
    if (window.MicFinderMobile) {
        window.MicFinderMobile.debugMobileState();
    }
    
    if (window.MicFinderState) {
        console.log('Current mobile view:', window.MicFinderState.getCurrentMobileView());
        console.log('Active filters:', window.MicFinderState.getActiveFilters());
    }
    
    console.log('=== End Debug ===');
}; 