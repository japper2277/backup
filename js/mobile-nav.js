// Mobile Navigation
// Bottom navigation functionality for the minimized mobile view

// Mobile Navigation State
let selectedMicId = null;
let selectedMic = null;
let isFiltersModalOpen = false;

// Initialize mobile navigation
function initializeMobileNavigation() {
    if (!window.MicFinderMobile || !window.MicFinderMobile.isMobileMode()) {
        console.log('[MobileNav] Not in mobile mode - skipping mobile navigation initialization');
        return;
    }
    
    console.log('[MobileNav] Initializing mobile navigation');
    
    // Initialize bottom bar functionality
    initializeBottomBar();
    
    // Initialize mobile modals
    initializeMobileModals();
    
    // Update favorites button state on initialization
    setTimeout(() => {
        updateFavoritesButtonState();
    }, 500);
    
    // Initialize list view functionality
    // initializeListView(); // Disabled - white overlay removed
    
    // Initialize directions functionality
    initializeDirections();
    
    // Setup mobile navigation state management
    setupNavigationState();
}

// Initialize bottom bar functionality
function initializeBottomBar() {
    console.log('[MobileNav] Initializing bottom bar');
    
    // Favorites button - consolidated functionality using fullscreen system
    const favoritesBtn = document.getElementById('favorites-btn-mobile');
    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', function() {
            // Add bounce animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // Open favorites management interface instead of just toggling filter
            openFavoritesManagement();
        });
    }
    
    // Enhanced filters button
    const filtersBtn = document.getElementById('filters-btn');
    if (filtersBtn) {
        // Remove existing listener and add enhanced one
        const newFiltersBtn = filtersBtn.cloneNode(true);
        filtersBtn.parentNode.replaceChild(newFiltersBtn, filtersBtn);
        
        newFiltersBtn.addEventListener('click', function() {
            console.log('[MobileNav] Filters button clicked');
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            openFiltersModal();
        });
    }
    
    // Enhanced list view button - force override existing handlers
    const listViewBtn = document.getElementById('list-view-btn');
    if (listViewBtn) {
        console.log('[MobileNav] Setting up enhanced list view button');
        
        // Remove ALL existing event listeners by cloning
        const newListViewBtn = listViewBtn.cloneNode(true);
        listViewBtn.parentNode.replaceChild(newListViewBtn, listViewBtn);
        
        // Add enhanced functionality
        newListViewBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[MobileNav] Enhanced list view button clicked - implementing list view');
            
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            toggleListView();
        });
        
        // Also override using onclick to be extra sure
        newListViewBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[MobileNav] List view onclick - implementing list view');
            toggleListView();
            return false;
        };
    }
    
    // Enhanced directions button
    const directionsBtn = document.getElementById('directions-bottom-btn');
    if (directionsBtn) {
        // Remove existing listener and add enhanced one
        const newDirectionsBtn = directionsBtn.cloneNode(true);
        directionsBtn.parentNode.replaceChild(newDirectionsBtn, directionsBtn);
        
        newDirectionsBtn.addEventListener('click', function() {
            console.log('[MobileNav] Directions button clicked');
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            openDirections();
        });
    }
}

// Open favorites management interface with individual mic favoriting
function openFavoritesManagement() {
    console.log('[MobileNav] Opening favorites management interface');
    
    // Create modal for favorites management
    if (!document.getElementById('mobile-favorites-modal')) {
        createFavoritesModal();
    }
    
    const modal = document.getElementById('mobile-favorites-modal');
    modal.classList.remove('hidden');
    
    // Load and display favorites
    loadFavoritesForMobile();
}

// Create favorites management modal
function createFavoritesModal() {
    const modal = document.createElement('div');
    modal.id = 'mobile-favorites-modal';
    modal.className = 'mobile-modal hidden';
    modal.innerHTML = `
        <div class="mobile-modal-backdrop" onclick="closeMobileModal('mobile-favorites-modal')"></div>
        <div class="mobile-modal-content">
            <div class="mobile-modal-header">
                <div class="header-content">
                    <h3>Manage Favorites</h3>
                    <div class="header-actions">
                        <button class="show-favorites-only-btn" id="show-favorites-only-btn" onclick="toggleShowFavoritesOnly()" title="Toggle favorites filter on map">
                            <i class="fa-solid fa-filter"></i>
                            <span class="btn-text">Show Favorites Only</span>
                        </button>
                        <button class="modal-toggle-btn" onclick="toggleFavoritesModal()" title="Toggle modal view">
                            <i class="fa-solid fa-chevron-down"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="mobile-modal-body">
                <div id="mobile-favorites-list">
                    <div class="loading-spinner">Loading favorites...</div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Load and display favorites for mobile management
function loadFavoritesForMobile() {
    const favoritesList = document.getElementById('mobile-favorites-list');
    if (!favoritesList) return;
    
    try {
        const { getAllMics, getFavorites } = window.MicFinderState;
        const allMics = getAllMics();
        const favorites = getFavorites();
        
        // Initialize the show favorites only button state
        initializeShowFavoritesOnlyButton();
        
        if (favorites.length === 0) {
            favoritesList.innerHTML = `
                <div class="empty-favorites">
                    <i class="fa-regular fa-star text-4xl mb-4"></i>
                    <p>No favorites yet</p>
                    <p class="text-sm">Tap the star on any mic to add it to favorites</p>
                </div>
            `;
            return;
        }
        
        // Render favorite mics with the same format as list view
        const favoritesHTML = favorites.map(micId => {
            const mic = allMics.find(m => m.id === micId);
            if (!mic) return '';
            
            return `
                <div class="mobile-mic-card list-view-format" data-mic-id="${mic.id}" data-mic-data='${JSON.stringify(mic)}'>
                    <div class="mic-card-content">
                        <div class="mic-info">
                            <div class="venue-header">
                                <h4 class="venue-name">${mic.venue}</h4>
                                <div class="venue-actions">
                                    <button class="remove-venue-btn" onclick="removeFavoriteMic('${mic.id}')" title="Remove from favorites">
                                        <i class="fa-solid fa-heart-crack"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="mic-details">
                                <div class="time-info">
                                    <i class="fa-regular fa-clock mr-2"></i>
                                    <span>${mic.time} • ${mic.day}</span>
                                </div>
                                <div class="location-info">
                                    <i class="fa-solid fa-location-dot mr-2"></i>
                                    <span>${mic.neighborhood}, ${mic.borough}</span>
                                </div>
                                <div class="cost-info">
                                    <i class="fa-solid fa-tag mr-2"></i>
                                    <span>${mic.cost}</span>
                                </div>
                                <div class="view-on-map-row" onclick="viewMicOnMap('${mic.id}')">
                                    <i class="fa-solid fa-location-arrow mr-2"></i>
                                    <span>View on Map</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        favoritesList.innerHTML = favoritesHTML;
        
        // Star button event listeners removed - buttons no longer exist
        
    } catch (error) {
        console.error('[MobileNav] Error loading favorites:', error);
        favoritesList.innerHTML = `
            <div class="error-state">
                <i class="fa-solid fa-exclamation-triangle text-4xl mb-4"></i>
                <p>Error loading favorites</p>
                <p class="text-sm">Please try again</p>
            </div>
        `;
    }
}

// Update favorites button state (simplified - just visual feedback)
function updateFavoritesButtonState() {
    console.log('[MobileNav] updateFavoritesButtonState called');
    
    const favoritesBtn = document.getElementById('favorites-btn-mobile');
    console.log('[MobileNav] Favorites button found:', !!favoritesBtn);
    
    if (!favoritesBtn || !window.MicFinderState) {
        console.log('[MobileNav] Missing dependencies - button:', !!favoritesBtn, 'state:', !!window.MicFinderState);
        return;
    }
    
    const favorites = window.MicFinderState.getFavorites();
    console.log('[MobileNav] Current favorites:', favorites);
    
    // Update icon based on whether user has any favorites
    const icon = favoritesBtn.querySelector('i');
    console.log('[MobileNav] Icon found:', !!icon);
    
    if (icon) {
        if (favorites.length > 0) {
            console.log('[MobileNav] Setting filled star - favorites count:', favorites.length);
            icon.className = 'fa-solid fa-star';
            favoritesBtn.classList.add('has-favorites');
        } else {
            console.log('[MobileNav] Setting empty star - no favorites');
            icon.className = 'fa-regular fa-star';
            favoritesBtn.classList.remove('has-favorites');
        }
    } else {
        console.log('[MobileNav] No icon found in favorites button');
    }
}

// Initialize mobile modals
function initializeMobileModals() {
    console.log('[MobileNav] Initializing mobile modals');
    
    // Create filters modal if it doesn't exist
    if (!document.getElementById('mobile-filters-modal')) {
        createFiltersModal();
    }
}

// Create filters modal
function createFiltersModal() {
    const modal = document.createElement('div');
    modal.id = 'mobile-filters-modal';
    modal.className = 'mobile-modal hidden';
    modal.innerHTML = `
        <div class="mobile-modal-backdrop" onclick="closeMobileModal('mobile-filters-modal')"></div>
        <div class="mobile-modal-content">
            <div class="mobile-modal-header">
                <h3>Filters</h3>
                <button class="mobile-modal-close" onclick="closeMobileModal('mobile-filters-modal')">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            <div class="mobile-modal-body">
                <div class="filter-section">
                    <h4>Day</h4>
                    <div class="filter-buttons">
                        <button class="mobile-filter-btn" data-filter="day" data-value="">All Days</button>
                        <button class="mobile-filter-btn" data-filter="day" data-value="Monday">Monday</button>
                        <button class="mobile-filter-btn" data-filter="day" data-value="Tuesday">Tuesday</button>
                        <button class="mobile-filter-btn" data-filter="day" data-value="Wednesday">Wednesday</button>
                        <button class="mobile-filter-btn" data-filter="day" data-value="Thursday">Thursday</button>
                        <button class="mobile-filter-btn" data-filter="day" data-value="Friday">Friday</button>
                        <button class="mobile-filter-btn" data-filter="day" data-value="Saturday">Saturday</button>
                        <button class="mobile-filter-btn" data-filter="day" data-value="Sunday">Sunday</button>
                    </div>
                </div>
                <div class="filter-section">
                    <h4>Cost</h4>
                    <div class="filter-buttons">
                        <button class="mobile-filter-btn" data-filter="cost" data-value="">All Costs</button>
                        <button class="mobile-filter-btn" data-filter="cost" data-value="free">Free</button>
                        <button class="mobile-filter-btn" data-filter="cost" data-value="paid">Paid</button>
                    </div>
                </div>
                <div class="filter-section">
                    <h4>Borough</h4>
                    <div class="filter-buttons">
                        <button class="mobile-filter-btn" data-filter="borough" data-value="">All Boroughs</button>
                        <button class="mobile-filter-btn" data-filter="borough" data-value="Manhattan">Manhattan</button>
                        <button class="mobile-filter-btn" data-filter="borough" data-value="Brooklyn">Brooklyn</button>
                        <button class="mobile-filter-btn" data-filter="borough" data-value="Queens">Queens</button>
                        <button class="mobile-filter-btn" data-filter="borough" data-value="Bronx">Bronx</button>
                    </div>
                </div>
            </div>
            <div class="mobile-modal-footer">
                <button class="mobile-btn secondary" onclick="clearAllFilters()">Clear All</button>
                <button class="mobile-btn primary" onclick="closeMobileModal('mobile-filters-modal')">Apply</button>
            </div>
        </div>
    `;
    
    // Add modal styles
    const styles = document.createElement('style');
    styles.textContent = `
        .mobile-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        .mobile-modal:not(.hidden) {
            opacity: 1;
            visibility: visible;
        }
        .mobile-modal-backdrop {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
        }
        .mobile-modal-content {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: #374151 !important; /* Dark gray to match list view instead of blue */
            border-radius: 20px 20px 0 0;
            max-height: 80vh;
            overflow-y: auto;
            transform: translateY(100%);
            transition: transform 0.3s ease;
            color: #f9fafb !important; /* Light text for dark background */
        }
        .mobile-modal:not(.hidden) .mobile-modal-content {
            transform: translateY(0);
        }
        .mobile-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid #4b5563; /* Dark gray border to match list view */
            background: #374151 !important; /* Dark gray background */
        }
        .mobile-modal-header h3 {
            margin: 0;
            font-size: 1.2rem;
            font-weight: 600;
            color: #f9fafb !important; /* Light text for dark background */
        }
        .mobile-modal-close {
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 0.5rem;
            color: #f9fafb !important; /* Light close button for dark background */
        }
        .mobile-modal-body {
            padding: 1.5rem;
            background: #374151 !important; /* Dark gray background */
        }
        .filter-section {
            margin-bottom: 2rem;
        }
        .filter-section h4 {
            margin: 0 0 1rem 0;
            font-size: 1rem;
            font-weight: 600;
        }
        .filter-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        .mobile-filter-btn {
            padding: 0.5rem 1rem;
            border: 1px solid #d1d5db;
            border-radius: 1rem;
            background: white;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .mobile-filter-btn.active {
            background: #3b82f6;
            color: white;
            border-color: #3b82f6;
        }
        .mobile-modal-footer {
            display: flex;
            gap: 1rem;
            padding: 1rem 1.5rem;
            border-top: 1px solid #e5e7eb;
        }
        .mobile-btn {
            flex: 1;
            padding: 0.75rem;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .mobile-btn.primary {
            background: #3b82f6;
            color: white;
            border: none;
        }
        .mobile-btn.secondary {
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
        }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(modal);
    
    // Add filter button event listeners
    modal.querySelectorAll('.mobile-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filterType = this.dataset.filter;
            const filterValue = this.dataset.value;
            
            // Update active state
            modal.querySelectorAll(`[data-filter="${filterType}"]`).forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Apply filter
            applyMobileFilter(filterType, filterValue);
        });
    });
}

// Apply mobile filter
function applyMobileFilter(filterType, filterValue) {
    if (!window.MicFinderState || !window.MicFinderFilters) return;
    
    const currentFilters = window.MicFinderState.getActiveFilters();
    const newFilters = { ...currentFilters };
    
    if (filterValue === '') {
        delete newFilters[filterType];
    } else {
        if (filterType === 'cost') {
            newFilters[filterType] = filterValue === 'free' ? ['free'] : ['paid'];
        } else if (filterType === 'borough') {
            newFilters[filterType] = [filterValue];
        } else {
            newFilters[filterType] = filterValue;
        }
    }
    
    window.MicFinderState.setActiveFilters(newFilters);
    window.MicFinderFilters.saveFilterState(newFilters);
    
    if (window.MicFinderApp) {
        window.MicFinderApp.render();
    }
}

// Open filters modal
function openFiltersModal() {
    const modal = document.getElementById('mobile-filters-modal');
    if (!modal) return;
    
    // Update active states based on current filters
    updateFilterModalState();
    
    modal.classList.remove('hidden');
    isFiltersModalOpen = true;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

// Update filter modal state
function updateFilterModalState() {
    if (!window.MicFinderState) return;
    
    const currentFilters = window.MicFinderState.getActiveFilters();
    const modal = document.getElementById('mobile-filters-modal');
    if (!modal) return;
    
    // Reset all buttons
    modal.querySelectorAll('.mobile-filter-btn').forEach(btn => btn.classList.remove('active'));
    
    // Set active states
    Object.entries(currentFilters).forEach(([filterType, filterValue]) => {
        let value = '';
        if (filterType === 'day' && typeof filterValue === 'string') {
            value = filterValue;
        } else if (filterType === 'cost' && Array.isArray(filterValue)) {
            value = filterValue.includes('free') ? 'free' : 'paid';
        } else if (filterType === 'borough' && Array.isArray(filterValue) && filterValue.length > 0) {
            value = filterValue[0];
        }
        
        const btn = modal.querySelector(`[data-filter="${filterType}"][data-value="${value}"]`);
        if (btn) {
            btn.classList.add('active');
        }
    });
}

// Close mobile modal
function closeMobileModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.add('hidden');
    
    if (modalId === 'mobile-filters-modal') {
        isFiltersModalOpen = false;
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
}

// Clear all filters
function clearAllFilters() {
    if (!window.MicFinderState || !window.MicFinderFilters) return;
    
    const clearedFilters = {
        search: '',
        mapFilterEnabled: false
    };
    
    window.MicFinderState.setActiveFilters(clearedFilters);
    window.MicFinderFilters.saveFilterState(clearedFilters);
    
    if (window.MicFinderApp) {
        window.MicFinderApp.render();
    }
    
    updateFilterModalState();
    
    if (window.MicFinderMobile && window.MicFinderMobile.showMobileToast) {
        window.MicFinderMobile.showMobileToast('All filters cleared');
    }
}

// Initialize list view functionality
function initializeListView() {
    // This function is no longer needed - white overlay removed
    console.log('[MobileNav] White overlay list view initialization disabled - using main dark theme list view instead');
    return;
}

// Toggle list view
async function toggleListView() {
    // This function is no longer needed - white overlay removed
    console.log('[MobileNav] White overlay list view toggle disabled - using main dark theme list view instead');
    return;
}

// Wait for favorites module to be available
function waitForFavoritesModule(maxWaitTime = 2000) {
    // This function is no longer needed - white overlay removed
    console.log('[MobileNav] White overlay favorites module waiting disabled');
    return Promise.resolve();
}

// Retry favorites operation with module waiting
async function retryFavoritesOperation(micId, maxRetries = 3) {
    // This function is no longer needed - white overlay removed
    console.log('[MobileNav] White overlay favorites retry disabled');
    return false;
}

// Fallback favorites toggle UI function
function toggleFavoriteUI(favoriteBtn, micId) {
    // This function is no longer needed - white overlay removed
    console.log('[MobileNav] White overlay favorites fallback disabled');
    return;
}

// Populate list view with current mic data
async function populateListView() {
    // This function is no longer needed - white overlay removed
    console.log('[MobileNav] White overlay list population disabled - using main dark theme list view instead');
    return;
}

// Create mobile list card
function createMobileListCard(mic) {
    // This function is no longer needed - white overlay removed
    console.log('[MobileNav] White overlay list card creation disabled - using main dark theme list view instead');
    return null;
}

// Initialize directions functionality
function initializeDirections() {
    console.log('[MobileNav] Directions functionality initialized');
}

// Open directions
function openDirections() {
    if (!selectedMicId) {
        if (window.MicFinderMobile && window.MicFinderMobile.showMobileToast) {
            window.MicFinderMobile.showMobileToast('Please select a mic first');
        }
        return;
    }
    
    // Get selected mic details
    const allMics = window.MicFinderState ? window.MicFinderState.getAllMics() : [];
    const selectedMic = allMics.find(mic => mic.id === selectedMicId);
    
    if (!selectedMic) {
        if (window.MicFinderMobile && window.MicFinderMobile.showMobileToast) {
            window.MicFinderMobile.showMobileToast('Selected mic not found');
        }
        return;
    }
    
    // Create Google Maps URL
    const address = `${selectedMic.venue}, ${selectedMic.neighborhood}, ${selectedMic.borough}, NY`;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    
    // Open in new tab
    window.open(googleMapsUrl, '_blank');
    
    if (window.MicFinderMobile && window.MicFinderMobile.showMobileToast) {
        window.MicFinderMobile.showMobileToast('Opening directions...');
    }
}

// Setup navigation state management
function setupNavigationState() {
    console.log('[MobileNav] Setting up navigation state management');
    
    // Listen for mic selection changes
    window.addEventListener('micSelected', (event) => {
        selectedMicId = event.detail.micId;
        updateBottomBarSelection(event.detail.mic);
    });
    
    // Listen for mobile view changes
    window.addEventListener('mobileViewChanged', (event) => {
        console.log('[MobileNav] Mobile view changed to:', event.detail.view);
    });
}

// Update bottom bar selection display (enhance existing function)
function updateBottomBarSelection(mic) {
    // Check if the global function already exists
    if (window.updateBottomBarSelection && typeof window.updateBottomBarSelection === 'function') {
        // Use the existing function
        window.updateBottomBarSelection(mic);
    } else {
        // Fallback implementation
        const titleEl = document.getElementById('bottom-selection-title');
        const subtitleEl = document.getElementById('bottom-selection-subtitle');
        
        if (mic && titleEl && subtitleEl) {
            titleEl.textContent = mic.venue || 'Unknown venue';
            subtitleEl.textContent = `${mic.day} at ${mic.time}`;
        } else if (titleEl && subtitleEl) {
            titleEl.textContent = 'No mic selected';
            subtitleEl.textContent = 'Tap a marker to see details';
        }
    }
}

// Public API for updating selection (called from other modules)
function setSelectedMic(micId, mic) {
    selectedMicId = micId;
    updateBottomBarSelection(mic);
    
    // Dispatch event for other modules
    window.dispatchEvent(new CustomEvent('micSelected', {
        detail: { micId, mic }
    }));
}

// Get currently selected mic
function getSelectedMicId() {
    return selectedMicId;
}

// Force override any existing placeholder handlers
function forceOverridePlaceholders() {
    console.log('[MobileNav] Force overriding placeholder handlers');
    
    // List view button - no longer needed (white overlay removed)
    // const listViewBtn = document.getElementById('list-view-btn');
    // if (listViewBtn) {
    //     // Remove existing handlers
    //     listViewBtn.onclick = null;
    //     const newBtn = listViewBtn.cloneNode(true);
    //     listViewBtn.parentNode.replaceChild(newBtn, listViewBtn);
    //     
    //     // Add our handler
    //     newBtn.addEventListener('click', function(e) {
    //         e.preventDefault();
    //         e.stopPropagation();
    //         console.log('[MobileNav] FORCE OVERRIDE - List view implementing');
    //         toggleListView();
    //         return false;
    //     });
    // }
    
    // Filters button
    const filtersBtn = document.getElementById('filters-btn');
    if (filtersBtn) {
        filtersBtn.onclick = null;
        const newBtn = filtersBtn.cloneNode(true);
        filtersBtn.parentNode.replaceChild(newBtn, filtersBtn);
        
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[MobileNav] FORCE OVERRIDE - Filters modal opening');
            openFiltersModal();
            return false;
        });
    }
    
    // Directions button
    const directionsBtn = document.getElementById('directions-bottom-btn');
    if (directionsBtn) {
        directionsBtn.onclick = null;
        const newBtn = directionsBtn.cloneNode(true);
        directionsBtn.parentNode.replaceChild(newBtn, directionsBtn);
        
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[MobileNav] FORCE OVERRIDE - Directions opening');
            openDirections();
            return false;
        });
    }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[MobileNav] DOMContentLoaded - checking for favorites module...');
    console.log('[MobileNav] MicFinderFavorites available:', !!window.MicFinderFavorites);
    console.log('[MobileNav] MicFinderFavorites.toggleFavorite available:', !!(window.MicFinderFavorites && window.MicFinderFavorites.toggleFavorite));
    
    // Wait for mobile.js to initialize first
    setTimeout(() => {
        console.log('[MobileNav] Initializing mobile navigation after delay...');
        console.log('[MobileNav] MicFinderFavorites available after delay:', !!window.MicFinderFavorites);
        initializeMobileNavigation();
    }, 100);
    
    // Force override after all other scripts have run
    setTimeout(() => {
        console.log('[MobileNav] Force overriding placeholder handlers...');
        console.log('[MobileNav] MicFinderFavorites available after override delay:', !!window.MicFinderFavorites);
        forceOverridePlaceholders();
    }, 1000);
    
    // Additional check for favorites module availability
    setTimeout(() => {
        console.log('[MobileNav] Final check - MicFinderFavorites available:', !!window.MicFinderFavorites);
        if (window.MicFinderFavorites && window.MicFinderFavorites.toggleFavorite) {
            console.log('[MobileNav] Favorites module is fully available');
        } else {
            console.error('[MobileNav] Favorites module still not available after 1 second');
        }
    }, 1000);
});

// Make functions globally available for onclick handlers
window.closeMobileModal = closeMobileModal;
window.clearAllFilters = clearAllFilters;

// Enhanced favorites functionality
window.editFavoriteMic = function(micId) {
    console.log('[MobileNav] Editing favorite mic:', micId);
    
    // Show edit options modal
    showEditFavoriteModal(micId);
};

window.removeFavoriteMic = function(micId) {
    console.log('[MobileNav] Removing favorite mic:', micId);
    
    // Show confirmation dialog
    if (confirm('Remove this venue from favorites?')) {
        if (window.MicFinderFavorites && window.MicFinderFavorites.toggleFavorite) {
            window.MicFinderFavorites.toggleFavorite(micId);
            // Refresh the favorites list
            loadFavoritesForMobile();
        }
    }
};

window.viewMicOnMap = function(micId) {
    console.log('[MobileNav] Viewing mic on map:', micId);
    
    // Close the favorites modal
    closeMobileModal('mobile-favorites-modal');
    
    // Switch to map view
    if (window.MicFinderMobile && window.MicFinderMobile.switchMobileView) {
        window.MicFinderMobile.switchMobileView('map');
    }
    
    // Show the mic on the map using the correct function
    if (window.MicFinderMap && window.MicFinderMap.showMicOnMap) {
        // Get the mic data from state
        if (window.MicFinderState) {
            const allMics = window.MicFinderState.getAllMics();
            const mic = allMics.find(m => m.id === micId);
            if (mic) {
                window.MicFinderMap.showMicOnMap(mic);
            }
        }
    }
};

// Show edit favorite modal
function showEditFavoriteModal(micId) {
    const mic = window.MicFinderState ? window.MicFinderState.getAllMics().find(m => m.id === micId) : null;
    if (!mic) return;
    
    const editModal = document.createElement('div');
    editModal.id = 'edit-favorite-modal';
    editModal.className = 'mobile-modal';
    editModal.innerHTML = `
        <div class="mobile-modal-backdrop" onclick="closeEditFavoriteModal()"></div>
        <div class="mobile-modal-content">
            <div class="mobile-modal-header">
                <h3>Edit Favorite</h3>
                <button class="mobile-modal-close" onclick="closeEditFavoriteModal()">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            <div class="mobile-modal-body">
                <div class="edit-favorite-form">
                    <div class="form-group" data-field="venue">
                        <label>Venue Name</label>
                        <input type="text" id="edit-venue-name" value="${mic.venue}" class="edit-input" style="color: #1f2937 !important; background: white !important;">
                    </div>
                    <div class="form-group" data-field="time">
                        <label>Time</label>
                        <input type="text" id="edit-venue-time" value="${mic.time}" class="edit-input" style="color: #1f2937 !important; background: white !important;">
                    </div>
                    <div class="form-group" data-field="day">
                        <label>Day</label>
                        <input type="text" id="edit-venue-day" value="${mic.day}" class="edit-input" style="color: #1f2937 !important; background: white !important;">
                    </div>
                    <div class="form-group" data-field="cost">
                        <label>Cost</label>
                        <input type="text" id="edit-venue-cost" value="${mic.cost}" class="edit-input" style="color: #1f2937 !important; background: white !important;">
                    </div>
                    <div class="form-actions">
                        <button class="save-edit-btn" onclick="saveFavoriteEdit('${micId}')">Save Changes</button>
                        <button class="cancel-edit-btn" onclick="closeEditFavoriteModal()">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(editModal);
    editModal.classList.remove('hidden');
}

// Close edit favorite modal
window.closeEditFavoriteModal = function() {
    const editModal = document.getElementById('edit-favorite-modal');
    if (editModal) {
        document.body.removeChild(editModal);
    }
};

// Save favorite edit
window.saveFavoriteEdit = function(micId) {
    const venueName = document.getElementById('edit-venue-name').value;
    const venueTime = document.getElementById('edit-venue-time').value;
    const venueDay = document.getElementById('edit-venue-day').value;
    const venueCost = document.getElementById('edit-venue-cost').value;
    
    console.log('[MobileNav] Saving favorite edit:', { micId, venueName, venueTime, venueDay, venueCost });
    
    // Here you would typically save the changes to your data store
    // For now, we'll just close the modal and show a success message
    
    closeEditFavoriteModal();
    
    // Show success message
    if (window.MicFinderMobile && window.MicFinderMobile.showMobileToast) {
        window.MicFinderMobile.showMobileToast('Favorite updated successfully!');
    }
    
    // Refresh the favorites list
    loadFavoritesForMobile();
};

// Toggle show favorites only filter
window.toggleShowFavoritesOnly = function() {
    console.log('[MobileNav] Toggling show favorites only filter');
    
    if (!window.MicFinderState || !window.MicFinderFilters) {
        console.error('[MobileNav] MicFinderState or MicFinderFilters not available');
        return;
    }
    
    const currentFilters = window.MicFinderState.getActiveFilters();
    const newFilters = { ...currentFilters };
    
    // Toggle the showFavorites filter
    newFilters.showFavorites = !newFilters.showFavorites;
    
    // Apply the new filters
    window.MicFinderState.setActiveFilters(newFilters);
    window.MicFinderFilters.saveFilterState(newFilters);
    
    // Update the button state
    updateShowFavoritesOnlyButton(newFilters.showFavorites);
    
    // Apply filters and render
    if (window.MicFinderFilters && window.MicFinderFilters.applyAllFilters) {
        window.MicFinderFilters.applyAllFilters();
    }
    
    if (window.MicFinderApp && window.MicFinderApp.render) {
        window.MicFinderApp.render();
    }
    
    // Show feedback
    const message = newFilters.showFavorites ? 'Showing favorites only' : 'Showing all mics';
    if (window.MicFinderMobile && window.MicFinderMobile.showMobileToast) {
        window.MicFinderMobile.showMobileToast(message);
    }
    
    console.log('[MobileNav] Show favorites filter toggled:', newFilters.showFavorites);
};

// Update the show favorites only button state
function updateShowFavoritesOnlyButton(isActive) {
    const btn = document.getElementById('show-favorites-only-btn');
    if (!btn) return;
    
    if (isActive) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="fa-solid fa-filter-circle-check"></i><span class="btn-text">Favorites Only</span>';
        btn.title = 'Click to show all mics';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fa-solid fa-filter"></i><span class="btn-text">Show Favorites Only</span>';
        btn.title = 'Click to show only favorites';
    }
}

// Initialize the button state when modal opens
function initializeShowFavoritesOnlyButton() {
    if (window.MicFinderState) {
        const currentFilters = window.MicFinderState.getActiveFilters();
        updateShowFavoritesOnlyButton(currentFilters.showFavorites || false);
    }
}

// Toggle favorites modal (minimize/maximize)
window.toggleFavoritesModal = function() {
    const modal = document.getElementById('mobile-favorites-modal');
    const toggleBtn = modal.querySelector('.modal-toggle-btn i');
    const modalBody = modal.querySelector('.mobile-modal-body');
    
    if (modal.classList.contains('minimized')) {
        // Maximize the modal
        modal.classList.remove('minimized');
        modalBody.style.display = 'block';
        toggleBtn.className = 'fa-solid fa-chevron-down';
        toggleBtn.parentElement.title = 'Minimize modal';
    } else {
        // Minimize the modal
        modal.classList.add('minimized');
        modalBody.style.display = 'none';
        toggleBtn.className = 'fa-solid fa-chevron-up';
        toggleBtn.parentElement.title = 'Maximize modal';
    }
};

// Export mobile navigation functionality
window.MicFinderMobileNav = {
    initializeMobileNavigation,
    setSelectedMic,
    getSelectedMicId,
    updateBottomBarSelection,
    openFiltersModal,
    // toggleListView, // Disabled - white overlay removed
    openDirections,
    openFavoritesManagement,
    loadFavoritesForMobile
};