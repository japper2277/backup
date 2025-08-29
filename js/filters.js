// Filters Functionality

// Cache map bounds with better stability
let cachedBounds = null;
let lastBoundsUpdate = 0;
let boundsUpdateTimeout = null;

// Clear bounds cache
function clearBoundsCache() {
    cachedBounds = null;
    lastBoundsUpdate = 0;
    if (boundsUpdateTimeout) {
        clearTimeout(boundsUpdateTimeout);
        boundsUpdateTimeout = null;
    }
}

// Apply all filters to mics
function applyAllFilters() {
    const { getAllMics, getActiveFilters, getMapFilterEnabled } = window.MicFinderState;
    const { getMap } = window.MicFinderMap;
    
    let allMics = getAllMics();
    const activeFilters = getActiveFilters();
    const map = getMap();
    
    // Guard: If map is not initialized, skip map-based filtering
    if (!map) {
        return allMics;
    }
    
    // Update bounds when map filter is enabled
    const now = Date.now();
    if (getMapFilterEnabled()) {
        // Always update bounds when map filter is enabled, but with debouncing
        if (!cachedBounds || (now - lastBoundsUpdate > 250)) {
            cachedBounds = map.getBounds();
            lastBoundsUpdate = now;
            
            // Clear any existing timeout
            if (boundsUpdateTimeout) {
                clearTimeout(boundsUpdateTimeout);
                boundsUpdateTimeout = null;
            }
        }
    } else {
        // Clear bounds cache when map filter is disabled
        if (cachedBounds) {
            cachedBounds = null;
            lastBoundsUpdate = 0;
        }
    }

    // Apply search filter BEFORE other filters
    if (activeFilters.search && activeFilters.search.trim().length > 0 && typeof Fuse !== 'undefined') {
        // --- Exact match logic for history/autocomplete selection ---
        if (window.isExactVenueSelection) {
            allMics = allMics.filter(mic => mic.venue.toLowerCase() === activeFilters.search.trim().toLowerCase());
        } else {
            const fuse = new Fuse(allMics, {
                keys: ['venue', 'address'],
                threshold: 0.38,
                distance: 100,
                minMatchCharLength: 2,
                ignoreLocation: true,
            });
            const searchResults = fuse.search(activeFilters.search.trim());
            allMics = searchResults.map(res => res.item);
        }
    }

    return allMics.filter(mic => {
        // Add exactVenue filter as part of the main filter logic
        if (activeFilters.exactVenue && activeFilters.exactVenue.trim().length > 0) {
            if (!mic.venue || mic.venue.toLowerCase() !== activeFilters.exactVenue.trim().toLowerCase()) {
                return false;
            }
        }

        // Day filter logic - consolidated and improved
        let dayFilterMatch = true;
        if (activeFilters.day && activeFilters.day !== null) {
            let dayFilterArr = [];
            if (Array.isArray(activeFilters.day)) {
                dayFilterArr = activeFilters.day;
            } else if (typeof activeFilters.day === 'string' && activeFilters.day) {
                dayFilterArr = [activeFilters.day];
            }
            
            if (dayFilterArr.length > 0) {
                const micDay = mic.day.toLowerCase();
                dayFilterMatch = dayFilterArr.some(filterDay => 
                    filterDay === 'any day' || 
                    filterDay.toLowerCase() === micDay
                );
                
                // Special handling for "today" - hide past mics
                const today = window.MicFinderUtils.getCurrentDay().toLowerCase();
                const isFilteringForToday = dayFilterArr.some(d => d.toLowerCase() === today);
                const isMicToday = micDay === today;
                
                if (isFilteringForToday && isMicToday) {
                    const micTime = window.MicFinderUtils.parseTime(mic.time);
                    if (micTime !== null) {
                        const micMinutes = Math.round(micTime * 60);
                        const now = new Date();
                        const nowMinutes = now.getHours() * 60 + now.getMinutes();
                        if (micMinutes < nowMinutes - 30) {
                            dayFilterMatch = false; // Hide if it started more than 30 minutes ago
                        }
                    }
                }
            }
        }
        
        // Borough filter
        const boroughFilter = activeFilters.borough;
        const boroughMatch = !boroughFilter ||
            (Array.isArray(boroughFilter) && boroughFilter.length === 0) ||
            (Array.isArray(boroughFilter)
                ? boroughFilter.includes('all') || boroughFilter.map(b => b.toLowerCase()).includes(mic.borough.toLowerCase())
                : boroughFilter.toLowerCase() === mic.borough.toLowerCase());

        // Neighborhood filter
        const neighborhoodFilter = activeFilters.neighborhood;
        const neighborhoodMatch = !neighborhoodFilter ||
            (Array.isArray(neighborhoodFilter) && neighborhoodFilter.length === 0) ||
            (Array.isArray(neighborhoodFilter)
                ? neighborhoodFilter.some(n => mic.neighborhood.includes(n))
                : neighborhoodFilter.startsWith('All ') || mic.neighborhood.includes(neighborhoodFilter));

        // Day filter logic is handled above - use dayFilterMatch variable

        // Cost filter
        const costFilter = activeFilters.cost;
        const costMatch = !costFilter ||
            (Array.isArray(costFilter) && costFilter.length === 0) ||
            (Array.isArray(costFilter)
                ? costFilter.includes('all') || costFilter.some(c =>
                    (c === 'free' && (mic.cost.toLowerCase() === 'free' || mic.cost.toLowerCase().startsWith('free'))) ||
                    (c === '1 drink min' && mic.cost.toLowerCase().includes('drink')) ||
                    (c === 'paid' && !['free', 'drink'].some(k => mic.cost.toLowerCase().includes(k)))
                )
                : costFilter === 'all' ||
                    (costFilter === 'free' && (mic.cost.toLowerCase() === 'free' || mic.cost.toLowerCase().startsWith('free'))) ||
                    (costFilter === '1 drink min' && mic.cost.toLowerCase().includes('drink')) ||
                    (costFilter === 'paid' && !['free', 'drink'].some(k => mic.cost.toLowerCase().includes(k))));

        // Signup filter
        const signupFilter = activeFilters.signup;
        const signupMatch = !signupFilter ||
            (Array.isArray(signupFilter) && signupFilter.length === 0) ||
            (Array.isArray(signupFilter)
                ? signupFilter.includes('all') || signupFilter.some(s =>
                    (s === 'in-person' && mic.signup && mic.signup.toLowerCase().includes('person')) ||
                    (s === 'online' && mic.signup && (mic.signup.toLowerCase().includes('online') || mic.signup.toLowerCase().includes('http')))
                )
                : signupFilter === 'all' ||
                    (signupFilter === 'in-person' && mic.signup && mic.signup.toLowerCase().includes('person')) ||
                    (signupFilter === 'online' && mic.signup && (mic.signup.toLowerCase().includes('online') || mic.signup.toLowerCase().includes('http'))));

        // Time filter
        const start = activeFilters.customTimeStart;
        const end = activeFilters.customTimeEnd;
        const time = window.MicFinderUtils.parseTime(mic.time);
        let timeMatch = true;
        
        // If both start and end are empty or missing, default to 10am-11:45pm range
        if ((!start || start.trim() === '') && (!end || end.trim() === '')) {
            const defaultStart = '10:00 AM';
            const defaultEnd = '11:45 PM';
            const startMinutes = window.MicFinderUtils.getMinutes(defaultStart);
            const endMinutes = window.MicFinderUtils.getMinutes(defaultEnd);
            const micMinutes = time !== null ? Math.round(time * 60) : null;
            const now = new Date();
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            if (micMinutes !== null) {
                // Always show mics that started up to 30 minutes ago (no custom filter to respect)
                if (nowMinutes >= micMinutes && nowMinutes - micMinutes <= 30) {
                    timeMatch = true;
                    console.log('🕐 [DEFAULT TIME] Bypass triggered for:', mic.venue, 'at', mic.time);
                } else {
                    timeMatch = micMinutes >= startMinutes && micMinutes <= endMinutes;
                    console.log('🕐 [DEFAULT TIME] Normal filter for:', mic.venue, 'at', mic.time, 'result:', timeMatch);
                }
            }
        } else if (start && end) {
            const startMinutes = window.MicFinderUtils.getMinutes(start);
            const endMinutes = window.MicFinderUtils.getMinutes(end);
            const micMinutes = time !== null ? Math.round(time * 60) : null;
            const now = new Date();
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            if (micMinutes !== null) {
                // Show mics that started up to 30 minutes ago, BUT only if they respect user's time range
                if (nowMinutes >= micMinutes && nowMinutes - micMinutes <= 30) {
                    // Bypass only applies if it doesn't conflict with user's explicit time filter
                    timeMatch = micMinutes >= startMinutes && micMinutes <= endMinutes;
                    console.log('🕐 [CUSTOM TIME] Bypass check for:', mic.venue, 'at', mic.time, 'respects user range:', timeMatch);
                } else {
                    timeMatch = micMinutes >= startMinutes && micMinutes <= endMinutes;
                    console.log('🕐 [CUSTOM TIME] Normal filter for:', mic.venue, 'at', mic.time, 'result:', timeMatch);
                }
            }
        }

        // Map bounds filter - use cached bounds with better stability
        // Allow exact venue selections to bypass map bounds restrictions
        const isExactVenueMatch = window.isExactVenueSelection || 
            (activeFilters.search && mic.venue && mic.venue.toLowerCase() === activeFilters.search.trim().toLowerCase());
        const mapBoundsMatch = !getMapFilterEnabled() || isExactVenueMatch ||
            (mic.lat && mic.lon && cachedBounds && cachedBounds.contains([mic.lat, mic.lon]));

        // Favorites filter
        const favoritesFilter = activeFilters.showFavorites;
        const favorites = window.MicFinderState.getFavorites();
        const favoritesMatch = !favoritesFilter || favorites.includes(mic.id);

        return boroughMatch && neighborhoodMatch && dayFilterMatch && costMatch && timeMatch && mapBoundsMatch && favoritesMatch && signupMatch;
    });
}

// Sort results
function sortResults(mics) {
    const { getActiveFilters } = window.MicFinderState;
    const { getMinutes, getCostValue } = window.MicFinderUtils;
    
    const sorted = [...mics];
    const sortBy = getActiveFilters().sort || 'default';
    
    if (sortBy === 'currentTime') {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        
        // Split into upcoming and past
        const upcoming = sorted.filter(mic => getMinutes(mic.time) >= nowMinutes);
        const past = sorted.filter(mic => getMinutes(mic.time) < nowMinutes);
        upcoming.sort((a, b) => getMinutes(a.time) - getMinutes(b.time));
        past.sort((a, b) => getMinutes(a.time) - getMinutes(b.time));
        return [...upcoming, ...past];
    }
    
    switch(sortBy) {
        case 'signUpTime':
            return sorted.sort((a, b) => window.MicFinderUtils.parseTime(a.signUpTime) - window.MicFinderUtils.parseTime(b.signUpTime));
        case 'cost':
            return sorted.sort((a, b) => getCostValue(a.cost) - getCostValue(b.cost));
        case 'name':
            return sorted.sort((a, b) => a.venue.localeCompare(b.venue));
        default:
            return sorted;
    }
}

// Load saved filters from localStorage
function loadFilterState() {
    try {
        const savedFilters = localStorage.getItem(window.MicFinderConfig.FILTER_STORAGE_KEY);
        return savedFilters ? JSON.parse(savedFilters) : {};
    } catch (error) {
        console.error('Error loading filter state:', error);
        return {};
    }
}

// Save current filters to localStorage
function saveFilterState(filters) {
    try {
        localStorage.setItem(window.MicFinderConfig.FILTER_STORAGE_KEY, JSON.stringify(filters));
        updateURL(filters);
    } catch (error) {
        console.error('Error saving filter state:', error);
    }
}

// Get query parameters from URL
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const queryParams = {};
    
    for(const [key, value] of params.entries()) {
        try {
            queryParams[key] = JSON.parse(value);
        } catch {
            queryParams[key] = value;
        }
    }
    
    return queryParams;
}

// Update URL with current filters
function updateURL(filters) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            const paramValue = typeof value === 'object' ? JSON.stringify(value) : value;
            params.set(key, paramValue);
        }
    });
    
    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({ filters }, '', newURL);
}

// Apply filter state to UI
function applyFilterState(filters) {
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = filters.search || '';
    }
    
    // Day filter
    document.querySelectorAll('#day-filter .segment-btn').forEach(btn => {
        btn.classList.toggle('active', filters.day && btn.dataset.value === filters.day);
    });
    
    // Borough checkboxes
    document.querySelectorAll('.filter-checkbox[data-filter="borough"]').forEach(checkbox => {
        checkbox.checked = filters.borough?.includes(checkbox.dataset.value) || false;
    });
    
    // Neighborhood checkboxes
    document.querySelectorAll('.filter-checkbox[data-filter="neighborhood"]').forEach(checkbox => {
        checkbox.checked = filters.neighborhood?.includes(checkbox.dataset.value) || false;
    });
    
    // Cost checkboxes
    document.querySelectorAll('.filter-checkbox[data-filter="cost"]').forEach(checkbox => {
        checkbox.checked = filters.cost?.includes(checkbox.dataset.value) || false;
    });
    
    // Signup checkboxes
    document.querySelectorAll('.filter-checkbox[data-filter="signup"]').forEach(checkbox => {
        checkbox.checked = filters.signup?.includes(checkbox.dataset.value) || false;
    });
    
    // Time inputs
    const customTimeStart = document.getElementById('custom-time-start');
    const customTimeEnd = document.getElementById('custom-time-end');
    if (customTimeStart) customTimeStart.value = filters.customTimeStart || '';
    if (customTimeEnd) customTimeEnd.value = filters.customTimeEnd || '';
    
    // Sort select
    const sortBySelect = document.getElementById('sort-by');
    if (sortBySelect) sortBySelect.value = filters.sort || 'currentTime';
    
    // Favorites toggle
    const favoritesToggle = document.getElementById('favorites-toggle');
    if (favoritesToggle) {
        favoritesToggle.classList.toggle('fa-toggle-on', filters.showFavorites);
        favoritesToggle.classList.toggle('fa-toggle-off', !filters.showFavorites);
    }
    
    // Map filter toggle
    const mapFilterToggle = document.getElementById('map-filter-toggle');
    if (mapFilterToggle) {
        mapFilterToggle.checked = filters.mapFilterEnabled !== false;
        // Also sync the state with the state manager
        window.MicFinderState.setMapFilterEnabled(filters.mapFilterEnabled !== false);
        
        // Update the label text to match the current state
        const mapFilterLabel = document.getElementById('map-filter-label');
        if (mapFilterLabel) {
            mapFilterLabel.textContent = (filters.mapFilterEnabled !== false) ? 'Showing all mics on map ONLY' : 'Showing all mics in sidebar';
        }
    }
}

// Restore filter state to UI
function restoreFilterState() {
    const { getActiveFilters } = window.MicFinderState;
    const activeFilters = getActiveFilters();
    
    // Restore segmented control for day filter
    if (activeFilters.day) {
        document.querySelectorAll('#day-filter .segment-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.value === activeFilters.day) {
                btn.classList.add('active');
            }
        });
    }

    // Restore checkboxes for multi-select filters
    ['borough', 'cost', 'signup'].forEach(filterType => {
        if (Array.isArray(activeFilters[filterType])) {
            activeFilters[filterType].forEach(value => {
                const checkbox = document.querySelector(`.filter-checkbox[data-filter="${filterType}"][data-value="${value}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
    });

    // Restore favorites toggle
    const favoritesToggle = document.getElementById('favorites-toggle');
    if (favoritesToggle && activeFilters.showFavorites) {
        favoritesToggle.classList.remove('fa-toggle-off');
        favoritesToggle.classList.add('fa-toggle-on');
    }

    // Restore time inputs
    const customTimeStart = document.getElementById('custom-time-start');
    const customTimeEnd = document.getElementById('custom-time-end');
    if (customTimeStart && customTimeEnd) {
        if (activeFilters.customTimeStart) customTimeStart.value = activeFilters.customTimeStart;
        if (activeFilters.customTimeEnd) customTimeEnd.value = activeFilters.customTimeEnd;
    }
}

// Filter mics (legacy function for compatibility)
function filterMics(mics) {
    return mics.filter(mic => {
        // Search filter
        const searchFilter = document.getElementById('search-input')?.value || '';
        const searchMatch = !searchFilter || mic.venue.toLowerCase().includes(searchFilter.toLowerCase());
        
        // Borough filter
        const { getActiveFilters } = window.MicFinderState;
        const boroughFilter = getActiveFilters().borough;
        const boroughMatch = !boroughFilter ||
            (Array.isArray(boroughFilter) && boroughFilter.length === 0) ||
            (Array.isArray(boroughFilter)
                ? boroughFilter.includes('all') || boroughFilter.map(b => b.toLowerCase()).includes(mic.borough.toLowerCase())
                : boroughFilter.toLowerCase() === mic.borough.toLowerCase());

        return searchMatch && boroughMatch;
    });
}

// Export filters functionality
window.MicFinderFilters = {
    applyAllFilters,
    sortResults,
    loadFilterState,
    saveFilterState,
    getQueryParams,
    updateURL,
    applyFilterState,
    restoreFilterState,
    filterMics,
    clearBoundsCache
}; 