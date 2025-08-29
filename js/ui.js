// UI Functionality

// Show loading spinner
function showLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.classList.add('visible');
    }
}

// Hide loading spinner
function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.classList.remove('visible');
    }
}

// Update card content when a time pill is clicked
function updateCardContent(card, selectedMic) {
    // Update cost
    const costInfo = card.querySelector('[data-dynamic-content="cost"] span');
    if (costInfo) {
        costInfo.textContent = selectedMic.cost || '';
    }
    
    // Update host
    const hostInfo = card.querySelector('[data-dynamic-content="host"]');
    const hostSpan = hostInfo ? hostInfo.querySelector('span') : null;
    if (hostInfo && hostSpan) {
        if (selectedMic.host) {
            hostSpan.textContent = selectedMic.host;
            hostInfo.style.display = 'flex';
        } else {
            hostInfo.style.display = 'none';
        }
    }
    
    // Update all data-mic-id attributes to point to the selected mic
    const viewOnMapRow = card.querySelector('.view-on-map-row');
    if (viewOnMapRow) {
        viewOnMapRow.setAttribute('data-mic-id', selectedMic.id);
    }
    
    
    // Update card's main data-mic-id for modal functionality
    card.setAttribute('data-mic-id', selectedMic.id);
}

// Group mics by venue for time pills display
function groupMicsByVenue(filteredMics) {
    const { getMinutes } = window.MicFinderUtils;
    const venueMap = {};
    
    // Group mics by venue (name + address + coordinates)
    filteredMics.forEach(mic => {
        // Normalize venue name to handle case variations
        const normalizedVenue = window.MicFinderUtils.normalizeVenueName(mic.venue);
        const venueKey = `${normalizedVenue}__${mic.address}__${mic.lat}__${mic.lon}`;
        if (!venueMap[venueKey]) {
            venueMap[venueKey] = {
                venue: mic.venue,
                address: mic.address,
                lat: mic.lat,
                lon: mic.lon,
                neighborhood: mic.neighborhood,
                borough: mic.borough,
                mics: []
            };
        }
        venueMap[venueKey].mics.push(mic);
    });
    
    // Convert to array and sort each venue's mics by time
    const venueGroups = Object.values(venueMap);
    venueGroups.forEach(group => {
        group.mics.sort((a, b) => getMinutes(a.time) - getMinutes(b.time));
        // Add primary mic (first/earliest) for card defaults
        group.primaryMic = group.mics[0];
    });
    
    // Sort venue groups by earliest mic time
    venueGroups.sort((a, b) => getMinutes(a.primaryMic.time) - getMinutes(b.primaryMic.time));
    
    return venueGroups;
}

// Render mic list
function renderMicList(filteredMics) {
    const { getEmptyStateTimeout, setEmptyStateTimeout } = window.MicFinderState;
    const { getMinutes } = window.MicFinderUtils;
    const { getActiveFilters } = window.MicFinderState;
    // Cancel any previous empty state timeout
    if (getEmptyStateTimeout()) {
        clearTimeout(getEmptyStateTimeout());
        setEmptyStateTimeout(null);
    }
    const micListContainer = document.getElementById('mic-list');
    if (!micListContainer) return;
    if (filteredMics.length === 0) {
        micListContainer.innerHTML = '';
        setEmptyStateTimeout(setTimeout(() => {
            micListContainer.innerHTML = renderEmptyState();
        }, 5000));
        return;
    }
    // Get current time in minutes since midnight
    const now = new Date();
    const currentDay = now.toLocaleString('en-us', { weekday: 'long' });
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    // Mics are already deduplicated in the main render function
    const deduplicatedMics = filteredMics;
    
    // Check if we're viewing today's mics
    const activeFilters = getActiveFilters();
    const isToday = typeof activeFilters.day === 'string' 
        ? activeFilters.day.toLowerCase() === currentDay.toLowerCase()
        : Array.isArray(activeFilters.day) 
            ? activeFilters.day.map(d => d.toLowerCase()).includes(currentDay.toLowerCase())
            : false;
    if (isToday) {
        // Just show all mic cards for today, no group headers
        // Sort by time
        const sortedMics = [...deduplicatedMics].sort((a, b) => getMinutes(a.time) - getMinutes(b.time));
        micListContainer.innerHTML = sortedMics.map(mic => renderMicCardHTML(mic)).join('');
    } else {
        // For non-today days, just sort by time
        const sortedMics = [...deduplicatedMics].sort((a, b) => getMinutes(a.time) - getMinutes(b.time));
        if (sortedMics.length === 0) {
            micListContainer.innerHTML = '<div class="p-4 text-center text-gray-500">No mics found matching your criteria.</div>';
        } else {
            micListContainer.innerHTML = sortedMics.map(mic => renderMicCardHTML(mic)).join('');
        }
    }

    // Add click handlers for mic cards and favorite buttons
    micListContainer.querySelectorAll('.mic-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Prevent any action if click was on 'View on Map' or favorite button
            if (e.target.closest('.view-on-map-row') || e.target.closest('.favorite-btn')) return;
            
            // Only show mic details modal, don't move map or switch views
            const micId = card.dataset.micId;
            showMicDetails(micId);
        });
        
        // Add hover handlers for two-way binding
        let hoverTimeout;
        
        card.addEventListener('mouseenter', (e) => {
            const micId = card.dataset.micId;
            if (micId) {
                // Clear any existing timeout
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                }
                
                // Add a small delay to prevent flickering
                hoverTimeout = setTimeout(() => {
                    // Clear highlights from other list items
                    document.querySelectorAll('.mic-card').forEach(otherCard => {
                        if (otherCard !== card) {
                            otherCard.classList.remove('highlighted');
                        }
                    });
                    
                    // Highlight the corresponding map marker
                    if (window.MicFinderMap && window.MicFinderMap.highlightMapMarker) {
                        window.MicFinderMap.highlightMapMarker(micId);
                    }
                }, 50); // 50ms delay
            }
        });
        
        card.addEventListener('mouseleave', (e) => {
            const micId = card.dataset.micId;
            if (micId) {
                // Clear the timeout if it exists
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                    hoverTimeout = null;
                }
                
                // Clear highlight from the map marker
                if (window.MicFinderMap && window.MicFinderMap.clearMarkerHighlight) {
                    window.MicFinderMap.clearMarkerHighlight(micId);
                }
            }
        });
    });
    
    micListContainer.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            const micId = btn.dataset.micId;
            console.log('Dark theme favorites button clicked for mic:', micId);
            
            if (window.MicFinderFavorites && window.MicFinderFavorites.toggleFavorite) {
                try {
                    console.log('Using MicFinderFavorites module');
                    await window.MicFinderFavorites.toggleFavorite(micId);
                    console.log('Successfully toggled favorite for mic:', micId);
                } catch (error) {
                    console.error('Error using MicFinderFavorites module:', error);
                    // Fallback to local toggle
                    toggleFavoriteUI(btn, micId);
                }
            } else {
                console.log('MicFinderFavorites not available, using fallback');
                // Use fallback local favorites toggle
                toggleFavoriteUI(btn, micId);
            }
        });
    });
    
    // Add delegated event listener for 'View on Map' button
    micListContainer.addEventListener('click', (e) => {
        // Check if the click is on or within the view-on-map-row
        const viewOnMapRow = e.target.closest('.view-on-map-row');
        if (viewOnMapRow) {
            console.log('🎯 View on Map clicked');
            e.stopPropagation();
            e.preventDefault();
            const micId = viewOnMapRow.getAttribute('data-mic-id');
            console.log('Mic ID:', micId);
            const allMics = window.MicFinderState.getAllMics();
            const mic = allMics.find(m => m.id === micId);
            console.log('Found mic:', mic);
            
            if (mic && mic.lat && mic.lon) {
                console.log('📍 Mic coordinates:', { lat: mic.lat, lon: mic.lon });
                
                // Close mobile sidebar if it's open (minimized view)
                if (window.innerWidth <= 1023) {
                    const rightSidebar = document.getElementById('right-sidebar');
                    if (rightSidebar && rightSidebar.classList.contains('mobile-open')) {
                        console.log('📱 Closing mobile sidebar');
                        rightSidebar.classList.remove('mobile-open');
                        rightSidebar.style.transform = 'translateX(100%)';
                        // Hide after animation completes
                        setTimeout(() => {
                            rightSidebar.style.display = 'none';
                        }, 300);
                    }
                }
                
                // Switch to map view if on mobile
                if (window.MicFinderState.getCurrentMobileView() !== 'map') {
                    console.log('📱 Switching to map view on mobile');
                    window.MicFinderMobile.switchMobileView('map');
                }
                
                // Use the showMicOnMap function to show this mic and related ones
                window.MicFinderMap.showMicOnMap(mic);
                
                // Force a re-render to update the list with map filter disabled
                // window.MicFinderApp.render();
            }
        }
    });



    // --- Admin Button Event Listeners ---
    const { auth, db } = window.MicFinderConfig;
    if (auth && auth.currentUser) {
        // Edit button logic
        micListContainer.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const micId = e.target.dataset.micId;

                const docRef = db.collection('mics').doc(micId);
                const doc = await docRef.get();

                if (doc.exists) {
                    const micData = doc.data();

                    // Populate the form
                    document.getElementById('mic-id').value = micId;
                    document.getElementById('venue').value = micData.venue || '';
                    document.getElementById('address').value = micData.address || '';
                    document.getElementById('lat').value = micData.lat || '';
                    document.getElementById('lon').value = micData.lon || '';
                    document.getElementById('day').value = micData.day || 'Monday';
                    document.getElementById('time').value = micData.time || '';
                    document.getElementById('borough').value = micData.borough || '';
                    document.getElementById('cost').value = micData.cost || '';
                    document.getElementById('details').value = micData.details || '';
                    
                    // Change modal title and show it
                    document.getElementById('form-title').textContent = 'Edit Mic';
                    document.getElementById('add-mic-modal').classList.remove('hidden');
                } else {
                    console.error('No document found for mic ID:', micId);
                    alert('Could not find mic data to edit.');
                }
            });
        });

        // Delete button logic
        micListContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const micId = e.target.dataset.micId;
                
                if (confirm('Are you sure you want to delete this mic?')) {
                    try {
                        await db.collection('mics').doc(micId).delete();
                        console.log('Mic deleted successfully');
                        window.MicFinderApp.fetchData(); // Refresh the data
                    } catch (error) {
                        console.error('Error deleting mic: ', error);
                        alert('Error deleting mic. Check console for details.');
                    }
                }
            });
        });
    }
    // Note: updateResultsHeading is called from app.js with the correct marker count
}

// Render a mic card HTML
function renderMicCardHTML(mic) {
    const { getFavorites } = window.MicFinderState;
    const { isHappeningNow, isStartingSoon, fixApostropheS } = window.MicFinderUtils;
    
    const favorites = getFavorites();
    const isFavorite = favorites.includes(mic.id);
    
    let statusIndicator = '';
    let statusClass = '';
    
    if (isHappeningNow(mic)) {
        statusIndicator = '<span class="status-badge happening-now" role="status" aria-live="polite">Happening Now</span>';
        statusClass = 'happening-now-card';
    } else if (isStartingSoon(mic)) {
        statusIndicator = '<span class="status-badge starting-soon" role="status" aria-live="polite">Starting Soon</span>';
        statusClass = 'starting-soon-card';
    }

    // Check if an admin is logged in
    const { auth } = window.MicFinderConfig;
    const isAdmin = auth && auth.currentUser;

    const adminButtons = isAdmin ? `
        <div class="admin-buttons mt-2 pt-2 border-t border-gray-200">
            <button class="edit-btn text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2" data-mic-id="${mic.id}">Edit</button>
            <button class="delete-btn text-xs bg-red-100 text-red-800 px-2 py-1 rounded" data-mic-id="${mic.id}">Delete</button>
        </div>
    ` : '';
    
    // Use fixApostropheS for venue display
    const venueName = fixApostropheS(mic.venue);
    
    return `
        <div class="mic-card ${statusClass} p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-all duration-200" 
             data-mic-id="${mic.id}" 
             role="listitem"
             tabindex="0"
             aria-label="${venueName} comedy mic on ${mic.day} at ${mic.time}"
             onkeydown="if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showMicDetails('${mic.id}'); }">
            <div class="flex justify-between items-start">
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between mb-2">
                        <h3 class="venue-name text-lg font-bold text-gray-900 truncate" style="color: var(--text-primary);">${venueName}</h3>
                        <button class="favorite-btn p-2 ml-2 flex-shrink-0" 
                                data-mic-id="${mic.id}" 
                                aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                            <i class="${isFavorite ? 'fa-solid' : 'fa-regular'} fa-star ${isFavorite ? 'text-yellow-500' : ''}" aria-hidden="true"></i>
                        </button>
                    </div>
                    
                    ${statusIndicator}
                    
                    <div class="mic-details mt-3 space-y-2">
                        <div class="time-info flex items-center">
                            <i class="fa-regular fa-clock text-indigo-600 mr-2" aria-hidden="true"></i>
                            <span class="font-semibold text-gray-800" style="color: var(--text-primary);">${mic.time}</span>
                            <span class="mx-2 text-gray-400" aria-hidden="true">•</span>
                            <span class="text-gray-600" style="color: var(--text-secondary);">${mic.day}</span>
                        </div>
                        
                        <div class="location-info flex items-center">
                            <i class="fa-solid fa-location-dot text-green-600 mr-2"></i>
                            <span class="text-gray-700" style="color: var(--text-secondary);">${mic.neighborhood}, ${mic.borough}</span>
                        </div>
                        
                        <div class="cost-info flex items-center">
                            <i class="fa-solid fa-tag text-purple-600 mr-2"></i>
                            <span class="text-gray-700" style="color: var(--text-secondary);">${mic.cost}</span>
                        </div>
                        <div class="view-on-map-row flex items-center mt-1 cursor-pointer" style="color: var(--accent-blue); font-weight: 500;" data-mic-id="${mic.id}">
                            <i class="fa-solid fa-location-arrow mr-2" style="color: var(--accent-blue);"></i>
                            <span>View on Map</span>
                        </div>
                    </div>
                    ${adminButtons}
                </div>
            </div>
        </div>
    `;
}

// Render empty state
function renderEmptyState() {
    const { getActiveFilters } = window.MicFinderState;
    const activeFilters = getActiveFilters();
    const suggestions = [];
    
    // Add contextual suggestions based on current filters
    if (activeFilters.day) {
        suggestions.push('Try selecting a different day');
    }
    if (activeFilters.mapFilterEnabled) {
        suggestions.push('Try zooming out or panning the map to see more locations');
    }
    if (activeFilters.borough && activeFilters.borough.length > 0) {
        suggestions.push('Try selecting additional boroughs');
    }
    if (activeFilters.customTimeStart && activeFilters.customTimeEnd) {
        suggestions.push('Try expanding your time range');
    }
    if (activeFilters.showFavorites) {
        suggestions.push('Disable the favorites filter to see all mics');
    }
    
    // Add default suggestions if none are applicable
    if (suggestions.length === 0) {
        suggestions.push(
            'Try clearing some filters',
            'Check different days of the week',
            'Expand your search area'
        );
    }

    return `
        <div class="empty-state">
            <div class="empty-state-icon">
                <i class="fa-solid fa-face-thinking"></i>
            </div>
            <h3 class="empty-state-title">No Mics Found</h3>
            <p class="empty-state-text">We couldn't find any mics matching your current criteria.</p>
            <div class="empty-state-suggestions">
                <p>Here are some suggestions:</p>
                <ul>
                    ${suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

// Update results heading
function updateResultsHeading(count) {
    console.log('📊 [UI] updateResultsHeading called with count:', count);
    console.log('📊 [UI] Function is working correctly');
    // Calculate total count for header (all filters except map view)
    let totalCount = count;
    if (window.MicFinderFilters && window.MicFinderState) {
        const prevMapFilter = window.MicFinderState.getMapFilterEnabled();
        console.log('📊 [UI] Current map filter enabled:', prevMapFilter);
        window.MicFinderState.setMapFilterEnabled(false);
        const allFiltersResult = window.MicFinderFilters.applyAllFilters();
        totalCount = allFiltersResult.length;
        console.log('📊 [UI] Total count (all filters except map):', totalCount);
        window.MicFinderState.setMapFilterEnabled(prevMapFilter);
    }
    // Update main header (Mics for Today)
    const resultsHeading = document.getElementById('results-heading');
    const micCountSpan = document.getElementById('mic-count');
    if (resultsHeading && micCountSpan) {
        // Determine the day label
        let dayLabel = 'Today';
        if (window.MicFinderState && typeof window.MicFinderState.getActiveFilters === 'function') {
            const filters = window.MicFinderState.getActiveFilters();
            let day = filters.day;
            const now = new Date();
            const currentDay = now.toLocaleString('en-us', { weekday: 'long' });
            if (!day || (Array.isArray(day) && day.length === 0) || (typeof day === 'string' && day.trim() === '')) {
                resultsHeading.innerHTML = `Mics for the Week <span id="mic-count">(${totalCount})</span>`;
                // Don't set resultsHeading again - already set above
            } else {
                if (Array.isArray(day)) {
                    if (day.length === 1) day = day[0];
                    else if (day.length > 1) dayLabel = 'Multiple Days';
                }
                if (typeof day === 'string' && day.length > 0) {
                    if (day.toLowerCase() === currentDay.toLowerCase()) {
                        dayLabel = 'Today';
                    } else {
                        dayLabel = day;
                    }
                }
                resultsHeading.innerHTML = `Mics for ${dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)} <span id="mic-count">(${totalCount})</span>`;
            }
        }
    }
    // Update Results label (Results (count))
    const resultsLabel = document.getElementById('results-label');
    const resultsCount = document.getElementById('results-count');
    if (resultsLabel && resultsCount) {
        console.log('📊 [UI] Setting Results (N) to:', count);
        resultsCount.textContent = `(${count})`;
        console.log('📊 [UI] Results count element now shows:', resultsCount.textContent);
    }
    // Update last updated time
    const lastUpdatedTime = document.getElementById('last-updated-time');
    if (lastUpdatedTime) {
        const now = new Date();
        // Format as h:mm AM/PM
        const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        lastUpdatedTime.textContent = timeStr;
    }
}

// Update current time display
function updateCurrentTimeDisplay() {
    const { getActiveFilters } = window.MicFinderState;
    const display = document.getElementById('current-time-display');
    const sortBy = getActiveFilters().sort || 'default';
    
    if (sortBy === 'currentTime') {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
        if (display) {
            display.textContent = `Current time: ${timeStr}`;
            display.style.display = '';
        }
    } else if (display) {
        display.style.display = 'none';
    }
}

// Highlight today's day pill
function highlightTodayDayPill() {
    const { getActiveFilters } = window.MicFinderState;
    const dayFilter = getActiveFilters().day;
    document.querySelectorAll('#day-filter .segment-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.value === dayFilter) {
            btn.classList.add('active');
        }
    });
}

// Update day filter UI
function updateDayFilterUI(todayDay) {
    const dayFilterGroup = document.getElementById('day-filter');
    if (dayFilterGroup) {
        dayFilterGroup.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.value.toLowerCase() === todayDay.toLowerCase()) {
                btn.classList.add('active');
            }
        });
    }
}

// Update modal content when a time pill is clicked
function updateModalContent(selectedMic, modalContent) {
    // Update day
    const dayValue = modalContent.querySelector('#modal-day-value');
    if (dayValue) {
        dayValue.textContent = selectedMic.day;
    }
    
    // Update cost
    const costValue = modalContent.querySelector('#modal-cost-value');
    if (costValue) {
        costValue.textContent = selectedMic.cost;
    }
    
    // Update location
    const locationValue = modalContent.querySelector('#modal-location-value');
    if (locationValue) {
        locationValue.textContent = `${selectedMic.neighborhood}, ${selectedMic.borough}`;
    }
    
    // Update signup
    const signupItem = modalContent.querySelector('#modal-signup-item');
    const signupValue = modalContent.querySelector('#modal-signup-value');
    if (signupItem && signupValue) {
        if (selectedMic.signup) {
            const signup = selectedMic.signup.trim();
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const isOnlyUrl = /^https?:\/\/[^\s]+$/.test(signup);
            if (isOnlyUrl) {
                signupValue.innerHTML = `<a class='ig-link' href='${signup}' target='_blank' rel='noopener noreferrer'>Link</a>`;
            } else {
                signupValue.innerHTML = signup.replace(urlRegex, url => `<a class='ig-link' href='${url}' target='_blank' rel='noopener noreferrer'>${url}</a>`);
            }
            signupItem.style.display = '';
        } else {
            signupItem.style.display = 'none';
        }
    }
    
    // Update host
    const hostItem = modalContent.querySelector('#modal-host-item');
    const hostValue = modalContent.querySelector('#modal-host-value');
    if (hostItem && hostValue) {
        if (selectedMic.host) {
            const cleanHandle = selectedMic.host.replace(/[^a-zA-Z0-9_\.]/g, '').replace(/^@/, '');
            hostValue.innerHTML = `<a class='ig-link' href='https://instagram.com/${cleanHandle}' target='_blank' rel='noopener noreferrer'>@${cleanHandle}</a>`;
            hostItem.style.display = '';
        } else {
            hostItem.style.display = 'none';
        }
    }
    
    // Update favorite button
    const favoriteBtn = modalContent.querySelector('.favorite-btn');
    if (favoriteBtn) {
        const { getFavorites } = window.MicFinderState;
        const favorites = getFavorites();
        const isFavorite = favorites.includes(selectedMic.id);
        
        favoriteBtn.setAttribute('data-mic-id', selectedMic.id);
        favoriteBtn.setAttribute('aria-label', isFavorite ? 'Remove from favorites' : 'Add to favorites');
        
        const starIcon = favoriteBtn.querySelector('i');
        if (starIcon) {
            if (isFavorite) {
                starIcon.className = 'fa-solid fa-star';
                favoriteBtn.innerHTML = '<i class="fa-solid fa-star" aria-hidden="true"></i> Remove from Favorites';
            } else {
                starIcon.className = 'fa-regular fa-star';
                favoriteBtn.innerHTML = '<i class="fa-regular fa-star" aria-hidden="true"></i> Add to Favorites';
            }
        }
    }
}

// Show mic details modal
function showMicDetails(micId) {
    const { getAllMics, getFavorites } = window.MicFinderState;
    const { isHappeningNow, isStartingSoon, fixApostropheS } = window.MicFinderUtils;
    const { saveFocus, trapFocus, focusFirstInteractiveElement, announceToScreenReader } = window.MicFinderAccessibility;
    
    const allMics = getAllMics();
    const mic = allMics.find(m => m.id === micId);
    if (!mic) return;

    // --- Bottom bar selection update removed by user request ---
    // if (typeof window.updateBottomBarSelection === 'function') {
    //     window.updateBottomBarSelection(mic);
    // }

    // Find all mics at the same venue that match current filters
    const { getActiveFilters } = window.MicFinderState;
    const activeFilters = getActiveFilters();
    
    // Use filtered mics for this venue (to match sidebar)
    const filteredMics = window.MicFinderFilters.applyAllFilters();
    const normalizedVenue = window.MicFinderUtils.normalizeVenueName(mic.venue);
    const venueMics = filteredMics.filter(m => 
        window.MicFinderUtils.normalizeVenueName(m.venue) === normalizedVenue && 
        m.address === mic.address && 
        m.lat === mic.lat && 
        m.lon === mic.lon &&
        // Apply same day filter logic as current filters
        (activeFilters.day ? 
            (typeof activeFilters.day === 'string' ? 
                m.day.toLowerCase() === activeFilters.day.toLowerCase() :
                Array.isArray(activeFilters.day) ? 
                    activeFilters.day.map(d => d.toLowerCase()).includes(m.day.toLowerCase()) :
                    true
            ) : true)
    );
    
    // Debug logging for Tiny Cupboard - COMMENTED OUT
    /*
    if (normalizedVenue === 'The Tiny Cupboard') {
        console.log('🏪 Modal Debug - Selected mic:', mic.venue, mic.day, mic.time);
        console.log('🏪 Modal Debug - Normalized venue:', normalizedVenue);
        console.log('🏪 Modal Debug - Found venue mics:', venueMics.length);
        console.log('🏪 Modal Debug - Venue mics:', venueMics.map(m => `${m.venue} - ${m.day} ${m.time}`));
    }
    */

    // Check if day filter is cleared (showing all days)
    const isDayFilterCleared = !activeFilters.day || (Array.isArray(activeFilters.day) && activeFilters.day.length === 0);
    
    // Get unique days for this venue if day filter is cleared
    const uniqueDays = [...new Set(venueMics.map(m => m.day))];
    const hasMultipleDays = uniqueDays.length > 1;

    // Sort venue mics by time
    const { getMinutes } = window.MicFinderUtils;
    venueMics.sort((a, b) => getMinutes(a.time) - getMinutes(b.time));

    // Helper function to normalize cost for comparison
    const normalizeCost = (cost) => {
        if (!cost) return '';
        // Extract just the dollar amount, ignore "cash" or other payment method qualifiers
        const match = cost.toLowerCase().match(/\$?(\d+(?:\.\d{2})?)/);
        return match ? `$${match[1]}` : cost.toLowerCase().trim();
    };

    // Helper function to normalize signup for comparison
    const normalizeSignup = (signup) => {
        if (!signup) return '';
        // Extract domain/key part for comparison, normalize URLs
        return signup.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    };

    // Check if all mics have identical information (excluding time, id, day)
    const micInfoIdentical = venueMics.length <= 1 || venueMics.every(venueMic => 
        normalizeCost(venueMic.cost) === normalizeCost(venueMics[0].cost) &&
        (venueMic.host || '').toLowerCase().trim() === (venueMics[0].host || '').toLowerCase().trim() &&
        normalizeSignup(venueMic.signup) === normalizeSignup(venueMics[0].signup) &&
        (venueMic.notes || '').toLowerCase().trim() === (venueMics[0].notes || '').toLowerCase().trim() &&
        venueMic.venue === venueMics[0].venue &&
        venueMic.address === venueMics[0].address &&
        venueMic.neighborhood === venueMics[0].neighborhood &&
        venueMic.borough === venueMics[0].borough
    );

    // Save current focus before opening modal
    saveFocus();

    const favorites = getFavorites();
    
    let statusIndicator = '';
    let statusClass = '';
    
    if (isHappeningNow(mic)) {
        statusIndicator = '<span class="status-badge happening-now" role="status" aria-live="polite">Happening Now</span>';
        statusClass = 'happening-now-card';
    } else if (isStartingSoon(mic)) {
        statusIndicator = '<span class="status-badge starting-soon" role="status" aria-live="polite">Starting Soon</span>';
        statusClass = 'starting-soon-card';
    }

    // Create address for Google Maps
    const address = `${fixApostropheS(mic.venue)}, ${mic.neighborhood}, ${mic.borough}, NY`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

    const modalContent = `
        <div class="modal-header">
            <h2 id="modal-title">${fixApostropheS(mic.venue)}</h2>
            <button class="modal-close-btn" id="modal-close-btn" aria-label="Close mic details">
                <i class="fa-solid fa-times" aria-hidden="true"></i>
            </button>
        </div>
        
        <div class="modal-body">
            <div id="modal-description" class="sr-only">
                Details for ${fixApostropheS(mic.venue)} comedy mic on ${mic.day} at ${mic.time}
            </div>
            
            <div class="space-y-6">
                <div class="details-section">
                    <div class="section-title-with-status">
                        <h3 class="section-title">
                            <i class="fa-solid fa-info-circle" aria-hidden="true"></i>
                            Details
                        </h3>
                        ${statusIndicator}
                    </div>
                    <div class="details-grid" role="list">
                        <div class="detail-item" role="listitem">
                            <i class="fa-regular fa-clock" aria-hidden="true"></i>
                            <span class="detail-label">Time:</span>
                            <div class="detail-value" style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
                                ${micInfoIdentical ? 
                                    // Show comma-separated times when info is identical
                                    venueMics.map(venueMic => venueMic.time).join(', ') :
                                    // Show interactive pills when info is different
                                    venueMics.map(venueMic => {
                                        const isActive = venueMic.id === mic.id;
                                        let pillClass = 'pill bg-gray-700 text-white modal-time-pill clickable';
                                        
                                        if (isActive) {
                                            pillClass += ' active';
                                        }
                                        if (isHappeningNow(venueMic)) {
                                            pillClass += ' happening-now';
                                        } else if (isStartingSoon(venueMic)) {
                                            pillClass += ' starting-soon';
                                        }
                                        
                                        const dataAttributes = `data-mic-id="${venueMic.id}" data-time="${venueMic.time}" data-day="${venueMic.day}"`;
                                        
                                        return `<span class="${pillClass}" ${dataAttributes}>${venueMic.time}</span>`;
                                    }).join('')
                                }
                            </div>
                        </div>
                        <div class="detail-item" role="listitem">
                            <i class="fa-regular fa-calendar" aria-hidden="true"></i>
                            <span class="detail-label">Day:</span>
                            ${hasMultipleDays && isDayFilterCleared ? `
                                <div class="detail-value" style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;">
                                    ${uniqueDays.map(day => {
                                        const isCurrentDay = day === mic.day;
                                        const dayClass = isCurrentDay ? 'pill bg-gray-700 text-white modal-time-pill clickable active' : 'pill bg-gray-700 text-white modal-time-pill clickable';
                                        return `<span class="${dayClass}" data-day="${day}">${day.substring(0, 3)}</span>`;
                                    }).join('')}
                                </div>
                            ` : `
                                <span class="detail-value" id="modal-day-value">${mic.day}</span>
                            `}
                        </div>
                        <div class="detail-item" role="listitem">
                            <i class="fa-solid fa-tag" aria-hidden="true"></i>
                            <span class="detail-label">Cost:</span>
                            <span class="detail-value" id="modal-cost-value">${mic.cost}</span>
                        </div>
                        <div class="detail-item" role="listitem">
                            <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
                            <span class="detail-label">Location:</span>
                            <span class="detail-value" id="modal-location-value">${mic.neighborhood}, ${mic.borough}</span>
                        </div>
                        <div class="detail-item" role="listitem" id="modal-signup-item" style="${mic.signup ? '' : 'display: none;'}">
                            <i class="fa-solid fa-clipboard-list" aria-hidden="true"></i>
                            <span class="detail-label">Sign Up:</span>
                            <span class="detail-value" id="modal-signup-value">
                                ${mic.signup ? (() => {
                                    const signup = mic.signup.trim();
                                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                                    const isOnlyUrl = /^https?:\/\/[^\s]+$/.test(signup);
                                    if (isOnlyUrl) {
                                        return `<a class='ig-link' href='${signup}' target='_blank' rel='noopener noreferrer'>Link</a>`;
                                    } else {
                                        return signup.replace(urlRegex, url => `<a class='ig-link' href='${url}' target='_blank' rel='noopener noreferrer'>${url}</a>`);
                                    }
                                })() : ''}
                            </span>
                        </div>
                        <div class="detail-item" role="listitem" id="modal-host-item" style="${mic.host ? '' : 'display: none;'}">
                            <i class="fa-brands fa-instagram" aria-hidden="true"></i>
                            <span class="detail-label">For Updates:</span>
                            <span class="detail-value" id="modal-host-value">
                                ${mic.host ? (() => {
                                    const cleanHandle = mic.host.replace(/[^a-zA-Z0-9_\.]/g, '').replace(/^@/, '');
                                    return `<a class='ig-link' href='https://instagram.com/${cleanHandle}' target='_blank' rel='noopener noreferrer'>@${cleanHandle}</a>`;
                                })() : ''}
                            </span>
                        </div>
                    </div>
                </div>
                
                ${mic.notes ? `
                    <div class="details-section">
                        <h3 class="section-title">
                            <i class="fa-solid fa-sticky-note" aria-hidden="true"></i>
                            Notes
                        </h3>
                        <p class="notes-text">${mic.notes}</p>
                    </div>
                ` : ''}
                
                ${mic.website ? `
                    <div class="details-section">
                        <h3 class="section-title">
                            <i class="fa-solid fa-globe" aria-hidden="true"></i>
                            Website
                        </h3>
                        <a href="${mic.website}" target="_blank" rel="noopener noreferrer" class="website-link" aria-label="Visit ${fixApostropheS(mic.venue)} website (opens in new tab)">
                            <i class="fa-solid fa-external-link-alt" aria-hidden="true"></i>
                            Visit Website
                        </a>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div class="modal-actions">
            <button class="modal-btn secondary favorite-btn" data-mic-id="${mic.id}" aria-label="${favorites.includes(mic.id) ? 'Remove from favorites' : 'Add to favorites'}">
                <i class="${favorites.includes(mic.id) ? 'fa-solid' : 'fa-regular'} fa-star" aria-hidden="true"></i>
                ${favorites.includes(mic.id) ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="modal-btn primary" aria-label="Get directions to ${fixApostropheS(mic.venue)} (opens in new tab)">
                <i class="fa-solid fa-directions" aria-hidden="true"></i>
                Get Directions
            </a>
        </div>
    `;

    const micDetailModal = document.getElementById('mic-detail-modal');
    const micDetailModalContent = document.getElementById('mic-detail-modal-content');
    
    if (micDetailModal && micDetailModalContent) {
        micDetailModalContent.innerHTML = modalContent;
        micDetailModal.classList.remove('hidden');

        // Announce modal opening to screen readers
        announceToScreenReader(`Opened details for ${fixApostropheS(mic.venue)}`);

        // Setup focus management
        trapFocus(micDetailModalContent);
        focusFirstInteractiveElement(micDetailModalContent);

        // Add close button handler
        const closeBtn = micDetailModalContent.querySelector('#modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', window.MicFinderApp.hideMicDetailsModal);
        }

        // Add favorite button handler
        const favoriteBtn = micDetailModalContent.querySelector('.favorite-btn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => {
                window.MicFinderFavorites.toggleFavorite(mic.id);
                const starIcon = favoriteBtn.querySelector('i');
                const buttonText = favoriteBtn.textContent.trim();
                
                starIcon.classList.toggle('fa-solid');
                starIcon.classList.toggle('fa-regular');
                
                if (favorites.includes(mic.id)) {
                    favoriteBtn.innerHTML = '<i class="fa-solid fa-star" aria-hidden="true"></i> Remove from Favorites';
                    favoriteBtn.setAttribute('aria-label', 'Remove from favorites');
                    announceToScreenReader('Added to favorites');
                } else {
                    favoriteBtn.innerHTML = '<i class="fa-regular fa-star" aria-hidden="true"></i> Add to Favorites';
                    favoriteBtn.setAttribute('aria-label', 'Add to favorites');
                    announceToScreenReader('Removed from favorites');
                }
            });
        }

        // Add time pill click handlers for modal (only for clickable pills)
        const clickableTimePills = micDetailModalContent.querySelectorAll('.pill.modal-time-pill.clickable');
        clickableTimePills.forEach(pill => {
            // Function to handle pill selection
            const handlePillSelection = (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                const clickedMicId = pill.getAttribute('data-mic-id');
                const selectedMic = allMics.find(m => m.id === clickedMicId);
                
                if (selectedMic) {
                    // Update active pill styling
                    clickableTimePills.forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    
                    // Update modal content with selected mic details
                    updateModalContent(selectedMic, micDetailModalContent);
                }
            };
            
            // Add both click and touch events for better mobile support
            pill.addEventListener('click', handlePillSelection);
            pill.addEventListener('touchend', handlePillSelection, { passive: true });
            
            // Prevent default touch behavior to avoid double-firing
            pill.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: true });
        });

        // Add day pill click handlers for modal (when day filter is cleared)
        const dayPills = micDetailModalContent.querySelectorAll('[data-day]:not(.modal-time-pill)');
        dayPills.forEach(pill => {
            // Function to handle day pill selection
            const handleDayPillSelection = (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                const selectedDay = pill.getAttribute('data-day');
                console.log('🗓️ [VENUE MODAL] Day selected:', selectedDay, 'opening time selection popup');
                
                // Update day filter in global state
                if (window.MicFinderState && window.MicFinderFilters && window.MicFinderApp) {
                    const filters = window.MicFinderState.getActiveFilters();
                    filters.day = selectedDay;
                    window.MicFinderState.setActiveFilters(filters);
                    window.MicFinderFilters.saveFilterState(filters);
                    window.MicFinderApp.render();
                    
                    // Re-render pills to reflect changes
                    if (typeof renderActivePills === 'function') {
                        renderActivePills();
                    }
                }
                
                // Close the venue modal
                micDetailModal.style.display = 'none';
                

            };
            
            // Add both click and touch events for better mobile support
            pill.addEventListener('click', handleDayPillSelection);
            pill.addEventListener('touchend', handleDayPillSelection, { passive: true });
            
            // Prevent default touch behavior to avoid double-firing
            pill.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: true });
        });

        // Add time pill click handlers for modal
        const timePills = micDetailModalContent.querySelectorAll('.modal-time-pill');
        timePills.forEach(pill => {
            // Function to handle time pill selection
            const handleTimePillSelection = (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                const selectedMicId = pill.getAttribute('data-mic-id');
                const selectedTime = pill.getAttribute('data-time');
                console.log('🕐 [VENUE MODAL] Time selected:', selectedTime, 'for mic ID:', selectedMicId);
                
                // Remove active class from all time pills
                timePills.forEach(p => p.classList.remove('active'));
                // Add active class to selected pill
                pill.classList.add('active');
                
                // Update modal content with selected mic's details
                if (selectedMicId && window.MicFinderState) {
                    const allMics = window.MicFinderState.getAllMics();
                    const selectedMic = allMics.find(mic => mic.id === selectedMicId);
                    
                    if (selectedMic) {
                        // Update the modal content sections that change between times
                        const costElement = micDetailModalContent.querySelector('#modal-cost-value');
                        const signupElement = micDetailModalContent.querySelector('#modal-signup-value');
                        const hostElement = micDetailModalContent.querySelector('#modal-host-value');
                        const signupItem = micDetailModalContent.querySelector('#modal-signup-item');
                        const hostItem = micDetailModalContent.querySelector('#modal-host-item');
                        
                        if (costElement) costElement.textContent = selectedMic.cost || '$7';
                        
                        if (signupElement && signupItem) {
                            if (selectedMic.signup && selectedMic.signup.trim()) {
                                const signup = selectedMic.signup.trim();
                                const urlRegex = /(https?:\/\/[^\s]+)/g;
                                const isOnlyUrl = /^https?:\/\/[^\s]+$/.test(signup);
                                
                                if (isOnlyUrl) {
                                    signupElement.innerHTML = `<a class="ig-link" href="${signup}" target="_blank" rel="noopener noreferrer">Link</a>`;
                                } else {
                                    const linkedSignup = signup.replace(urlRegex, url => `<a class='ig-link' href='${url}' target='_blank' rel='noopener noreferrer'>${url}</a>`);
                                    signupElement.innerHTML = linkedSignup;
                                }
                                signupItem.style.display = '';
                            } else {
                                signupItem.style.display = 'none';
                            }
                        }
                        
                        if (hostElement && hostItem) {
                            if (selectedMic.host && selectedMic.host.trim()) {
                                const cleanHandle = selectedMic.host.replace(/[^a-zA-Z0-9_\.]/g, '').replace(/^@/, '');
                                hostElement.innerHTML = `<a class='ig-link' href='https://instagram.com/${cleanHandle}' target='_blank' rel='noopener noreferrer'>@${cleanHandle}</a>`;
                                hostItem.style.display = '';
                            } else {
                                hostItem.style.display = 'none';
                            }
                        }
                        
                        // Update favorite button to use the selected mic ID
                        const favoriteBtn = micDetailModalContent.querySelector('.favorite-btn');
                        if (favoriteBtn) {
                            favoriteBtn.setAttribute('data-mic-id', selectedMicId);
                            
                            // Update favorite button state
                            const favorites = window.MicFinderState.getFavorites();
                            const isFavorite = favorites.includes(selectedMicId);
                            const icon = favoriteBtn.querySelector('i');
                            const text = favoriteBtn.querySelector('span') || favoriteBtn.childNodes[favoriteBtn.childNodes.length - 1];
                            
                            if (icon) {
                                icon.className = isFavorite ? 'fa-solid fa-star' : 'fa-regular fa-star';
                            }
                            favoriteBtn.setAttribute('aria-label', isFavorite ? 'Remove from favorites' : 'Add to favorites');
                        }
                    }
                }
            };
            
            // Add both click and touch events for better mobile support
            pill.addEventListener('click', handleTimePillSelection);
            pill.addEventListener('touchend', handleTimePillSelection, { passive: true });
            
            // Prevent default touch behavior to avoid double-firing
            pill.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: true });
        });

        // Allow closing modal by clicking outside content
        micDetailModal.addEventListener('click', function(e) {
            if (e.target === micDetailModal) {
                window.MicFinderApp.hideMicDetailsModal();
            }
        });
        
        // Allow closing modal with Escape key
        window.addEventListener('keydown', function(e) {
            if (!micDetailModal.classList.contains('hidden') && e.key === 'Escape') {
                window.MicFinderApp.hideMicDetailsModal();
            }
        });
    }

    // --- MOBILE DEBUG LOGGING ---
    setTimeout(() => {
        const isMobile = /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent) || window.innerWidth <= 700;
        if (isMobile) {
            const modal = document.getElementById('mic-detail-modal-content');
            if (modal) {
                const rect = modal.getBoundingClientRect();
                const computed = window.getComputedStyle(modal);
                console.log('[MOBILE DEBUG] Modal opened!');
                console.log('[MOBILE DEBUG] User agent:', navigator.userAgent);
                console.log('[MOBILE DEBUG] Window size:', window.innerWidth, 'x', window.innerHeight);
                console.log('[MOBILE DEBUG] Modal bounding rect:', rect);
                console.log('[MOBILE DEBUG] Modal computed width:', computed.width, 'height:', computed.height);
                console.log('[MOBILE DEBUG] Modal max-width:', computed.maxWidth, 'max-height:', computed.maxHeight);
                console.log('[MOBILE DEBUG] Modal padding:', computed.padding);
                console.log('[MOBILE DEBUG] Modal font-size:', computed.fontSize);
            } else {
                console.log('[MOBILE DEBUG] Modal not found in DOM');
            }
        }
    }, 400); // Wait for modal to render

    // --- DEBUG: Log modal content and sizing ---
    setTimeout(() => {
        if (micDetailModalContent) {
            const rect = micDetailModalContent.getBoundingClientRect();
            const computed = window.getComputedStyle(micDetailModalContent);
            console.log('[MIC MODAL DEBUG] Modal content length:', micDetailModalContent.innerHTML.length);
            console.log('[MIC MODAL DEBUG] Modal bounding rect:', rect);
            console.log('[MIC MODAL DEBUG] Modal computed width:', computed.width, 'height:', computed.height);
            console.log('[MIC MODAL DEBUG] Modal max-width:', computed.maxWidth, 'max-height:', computed.maxHeight);
            console.log('[MIC MODAL DEBUG] Modal padding:', computed.padding);
            console.log('[MIC MODAL DEBUG] Modal font-size:', computed.fontSize);
            console.log('[MIC MODAL DEBUG] Modal overflow-y:', computed.overflowY);
            console.log('[MIC MODAL DEBUG] Modal scrollHeight:', micDetailModalContent.scrollHeight);
            console.log('[MIC MODAL DEBUG] Modal clientHeight:', micDetailModalContent.clientHeight);
            // Log parent modal
            if (micDetailModal) {
                const parentRect = micDetailModal.getBoundingClientRect();
                const parentComputed = window.getComputedStyle(micDetailModal);
                console.log('[MIC MODAL DEBUG] Parent modal bounding rect:', parentRect);
                console.log('[MIC MODAL DEBUG] Parent modal computed width:', parentComputed.width, 'height:', parentComputed.height);
                console.log('[MIC MODAL DEBUG] Parent modal padding:', parentComputed.padding);
            }
        } else {
            console.log('[MIC MODAL DEBUG] Modal content not found');
        }
    }, 400);
}

// Fallback favorites toggle UI function
function toggleFavoriteUI(favoriteBtn, micId) {
    const starIcon = favoriteBtn.querySelector('i');
    if (!starIcon) return;
    
    const isCurrentlyFavorite = starIcon.classList.contains('fa-solid');
    
    if (isCurrentlyFavorite) {
        // Remove from favorites
        starIcon.className = 'fa-regular fa-star';
        console.log('Fallback: Removed mic', micId, 'from favorites');
    } else {
        // Add to favorites
        starIcon.className = 'fa-solid fa-star text-yellow-500';
        console.log('Fallback: Added mic', micId, 'to favorites');
    }
    
    // Try to sync with global state if available
    if (window.MicFinderState && window.MicFinderState.getFavorites) {
        try {
            const favorites = window.MicFinderState.getFavorites();
            if (isCurrentlyFavorite) {
                const index = favorites.indexOf(micId);
                if (index > -1) favorites.splice(index, 1);
            } else {
                if (!favorites.includes(micId)) favorites.push(micId);
            }
            
            // Save to localStorage if the config is available
            if (window.MicFinderConfig && window.MicFinderConfig.FAVORITES_STORAGE_KEY) {
                localStorage.setItem(window.MicFinderConfig.FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
            }
        } catch (error) {
            console.error('Fallback: Error updating global state:', error);
        }
    }
    
    // Try to trigger a render if the app is available
    if (window.MicFinderApp && window.MicFinderApp.render) {
        setTimeout(() => window.MicFinderApp.render(), 100);
    }
}

// Show hover card (disabled)
function showHoverCard(e, title, content) {
    // Disabled: do nothing
}

// Hide hover card (disabled)
function hideHoverCard() {
    // Disabled: do nothing
}

// Update hover card position (disabled)
function updateHoverCardPosition(e) {
    // Disabled: do nothing
}

document.addEventListener('mousemove', (e) => {
    // Disabled: do nothing
});

// Start onboarding
function startOnboarding() {
    setTimeout(() => {
        window.MicFinderState.setCurrentTooltipStep(0);
        showTooltip();
    }, 1000);
}

// Show tooltip
function showTooltip() {
    const { onboardingSteps } = window.MicFinderConfig;
    const currentStep = window.MicFinderState.getCurrentTooltipStep();
    
    if (currentStep >= onboardingSteps.length) {
        window.MicFinderState.setHasSeenOnboarding(true);
        return;
    }

    const step = onboardingSteps[currentStep];
    
    // Handle mobile-specific steps
    if (step.mobileOnly) {
        const isMobile = window.MicFinderUtils.isMobileDevice();
        if (!isMobile) {
            window.MicFinderState.setCurrentTooltipStep(currentStep + 1);
            showTooltip();
            return;
        }
    }

    // Try to find element using multiple selectors if provided
    let element = null;
    if (step.element.includes(',')) {
        const selectors = step.element.split(',').map(s => s.trim());
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.offsetParent !== null) {
                element = el;
                break;
            }
        }
    } else {
        element = document.querySelector(step.element);
    }

    if (!element || element.offsetParent === null) {
        window.MicFinderState.setCurrentTooltipStep(currentStep + 1);
        showTooltip();
        return;
    }

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.innerHTML = `
        <div class="tooltip-title">${step.title}</div>
        <div class="tooltip-content">${step.content}</div>
        <div class="tooltip-footer">
            <div class="tooltip-progress">Step ${currentStep + 1} of ${onboardingSteps.length}</div>
            <div class="tooltip-nav">
                ${currentStep > 0 ? 
                    `<button class="tooltip-btn secondary" onclick="previousTooltip()">Previous</button>` : 
                    ''}
                <button class="tooltip-btn primary" onclick="nextTooltip()">
                    ${currentStep === onboardingSteps.length - 1 ? 'Finish' : 'Next'}
                </button>
            </div>
        </div>
    `;

    // Position tooltip
    const rect = element.getBoundingClientRect();
    const isMobile = window.MicFinderUtils.isMobileDevice();
    
    switch (step.position) {
        case 'bottom':
            tooltip.style.top = `${rect.bottom + 10}px`;
            tooltip.style.left = `${rect.left + (rect.width / 2) - 150}px`;
            break;
        case 'left':
            tooltip.style.top = `${rect.top + (rect.height / 2) - 75}px`;
            tooltip.style.left = isMobile ? '20px' : `${rect.left - 310}px`;
            break;
        case 'right':
            tooltip.style.top = `${rect.top + (rect.height / 2) - 75}px`;
            tooltip.style.left = isMobile ? '20px' : `${rect.right + 10}px`;
            break;
        case 'center':
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            break;
    }

    // Ensure tooltip is within viewport
    const tooltipRect = tooltip.getBoundingClientRect();
    if (tooltipRect.right > window.innerWidth) {
        tooltip.style.left = `${window.innerWidth - tooltipRect.width - 20}px`;
    }
    if (tooltipRect.left < 0) {
        tooltip.style.left = '20px';
    }
    if (tooltipRect.bottom > window.innerHeight) {
        tooltip.style.top = `${window.innerHeight - tooltipRect.height - 20}px`;
    }
    if (tooltipRect.top < 0) {
        tooltip.style.top = '20px';
    }

    document.body.appendChild(tooltip);
    setTimeout(() => tooltip.classList.add('visible'), 100);
}

// --- Search Bar Filtering Logic ---
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    
    console.log('[UI Debug] DOMContentLoaded - Found search inputs:', {
        desktop: !!searchInput,
        mobile: !!mobileSearchInput
    });
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            // Update the search filter in state and re-render
            const { setActiveFilters, getActiveFilters } = window.MicFinderState;
            const filters = getActiveFilters();
            console.log('🔍 [UI Debug] Desktop search input changed:', searchInput.value);
            setActiveFilters({ ...filters, search: searchInput.value });
            if (window.MicFinderApp && window.MicFinderApp.render) {
                window.MicFinderApp.render();
            }
        });
    }
    
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', function() {
            // Update the search filter in state and re-render
            const { setActiveFilters, getActiveFilters } = window.MicFinderState;
            const filters = getActiveFilters();
            console.log('🔍 [UI Debug] Mobile search input changed:', mobileSearchInput.value);
            setActiveFilters({ ...filters, search: mobileSearchInput.value });
            if (window.MicFinderApp && window.MicFinderApp.render) {
                window.MicFinderApp.render();
            }
        });
    }
    const directionsBtn = document.getElementById('directions-btn');
    if (directionsBtn && window.MicFinderMap && window.MicFinderMap.geolocateUser) {
        directionsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.MicFinderMap.geolocateUser();
        });
    }
});


// Spreadsheet update notification system
let updateNotificationTimeout = null;

function showUpdateNotification(status, message = '') {
    // Remove any existing notification
    hideUpdateNotification();
    
    const { SPREADSHEET_UPDATE_CONFIG } = window.MicFinderConfig || {};
    if (!SPREADSHEET_UPDATE_CONFIG?.showNotifications) {
        return;
    }
    
    let notificationText = '';
    let notificationClass = 'update-notification';
    
    switch (status) {
        case 'checking':
            notificationText = 'Checking for updates...'; // Tiny Cupboard specific text removed
            notificationClass += ' checking';
            break;
        case 'updated':
            notificationText = 'Schedule updated!'; // Tiny Cupboard specific text removed
            notificationClass += ' success';
            break;
        case 'no-changes':
            notificationText = 'Schedule is up to date'; // Tiny Cupboard specific text removed
            notificationClass += ' info';
            break;
        case 'error':
            notificationText = `Update check failed: ${message}`;
            notificationClass += ' error';
            break;
        default:
            return;
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'update-notification';
    notification.className = notificationClass;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">🔄</span>
            <span class="notification-text">${notificationText}</span>
            <button class="notification-close" onclick="window.MicFinderUI.hideUpdateNotification()">×</button>
        </div>
    `;
    
    // Add styles if not already present
    if (!document.getElementById('update-notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'update-notification-styles';
        styles.textContent = `
            .update-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #2c3e50;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                font-size: 14px;
                max-width: 300px;
                animation: slideIn 0.3s ease-out;
            }
            .update-notification.success {
                background: #27ae60;
            }
            .update-notification.error {
                background: #e74c3c;
            }
            .update-notification.info {
                background: #3498db;
            }
            .update-notification.checking {
                background: #f39c12;
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .notification-icon {
                font-size: 16px;
            }
            .notification-text {
                flex: 1;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                margin-left: 8px;
            }
            .notification-close:hover {
                opacity: 0.7;
            }
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @media (max-width: 768px) {
                .update-notification {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-hide after delay (except for errors)
    if (status !== 'error' && status !== 'checking') {
        updateNotificationTimeout = setTimeout(() => {
            hideUpdateNotification();
        }, status === 'updated' ? 5000 : 3000);
    }
}

function hideUpdateNotification() {
    const notification = document.getElementById('update-notification');
    if (notification) {
        notification.remove();
    }
    
    if (updateNotificationTimeout) {
        clearTimeout(updateNotificationTimeout);
        updateNotificationTimeout = null;
    }
}

// Listen for spreadsheet update events (supports multiple sources) - DISABLED
// window.addEventListener('spreadsheetUpdate', (event) => {
//     const { status, message } = event.detail;
//     showUpdateNotification(status, message);
// });

// Backwards compatibility - also listen for old event name - DISABLED
// window.addEventListener('tinyCupboardUpdate', (event) => {
//     const { status, message } = event.detail;
//     showUpdateNotification(status, message);
// });

// Export UI functionality
window.MicFinderUI = {
    showLoading,
    hideLoading,
    renderMicList,
    renderMicCardHTML,
    renderEmptyState,
    updateResultsHeading,
    updateCurrentTimeDisplay,
    highlightTodayDayPill,
    updateDayFilterUI,
    showMicDetails,
    showHoverCard,
    hideHoverCard,
    updateHoverCardPosition,
    startOnboarding,
    showTooltip,
    showUpdateNotification,
    hideUpdateNotification
}; 