// Sidebar Functionality

// Load sidebar content
function loadSidebar(callback) {
    fetch('sidebar.html?v=1.5')
        .then(response => response.text())
        .then(html => {
            const sidebarContainer = document.getElementById('sidebar-container');
            if (sidebarContainer) {
                sidebarContainer.innerHTML = html;
                
                const sidebar = sidebarContainer.querySelector('.filter-panel');
                if (sidebar) {
                    sidebar.classList.add('sidebar');
                    sidebar.setAttribute('role', 'complementary');
                    sidebar.setAttribute('aria-label', 'Filter panel');
                    
                    if (!document.getElementById('left-sidebar-toggle')) {
                        const toggleBtn = document.createElement('button');
                        toggleBtn.id = 'left-sidebar-toggle';
                        toggleBtn.className = 'p-2 text-gray-500 hover:text-indigo-600 left-sidebar-toggler';
                        toggleBtn.innerHTML = '<i class="fa-solid fa-chevron-left" aria-hidden="true"></i>';
                        toggleBtn.setAttribute('aria-label', 'Toggle filter panel');
                        toggleBtn.setAttribute('aria-expanded', 'true');
                        toggleBtn.setAttribute('aria-controls', 'sidebar-container');
                        toggleBtn.addEventListener('click', () => {
                            const container = document.getElementById('sidebar-container');
                            const icon = toggleBtn.querySelector('i');
                            const isCollapsed = container.classList.contains('collapsed');
                            
                            container.classList.toggle('collapsed');
                            icon.classList.toggle('fa-chevron-left');
                            icon.classList.toggle('fa-chevron-right');

                            toggleBtn.setAttribute('aria-expanded', (!isCollapsed).toString());
                            window.MicFinderAccessibility.announceToScreenReader(`Filter panel ${isCollapsed ? 'expanded' : 'collapsed'}`);
                        });
                        
                        sidebarContainer.insertBefore(toggleBtn, sidebar);
                    }
                }
                
                setupCollapsibleSections();
                
                const geolocateBtn = document.getElementById('geolocate-btn');
                if (geolocateBtn) {
                    geolocateBtn.addEventListener('click', () => {
                        window.MicFinderMap.geolocateUser();
                    });
                    geolocateBtn.setAttribute('aria-label', 'Find my current location');
                }
                
                enhanceFilterAccessibility();
                
                if (callback) callback();
            }
        })
        .catch(error => {
            console.error('Error loading sidebar:', error);
            if (callback) callback();
        });
}

// Setup collapsible sections
function setupCollapsibleSections() {
    document.querySelectorAll('.collapsible-header').forEach(header => {
        const targetId = header.dataset.target;
        const content = document.getElementById(targetId);
        
        if (content) {
            header.setAttribute('aria-expanded', 'true');
            header.setAttribute('aria-controls', targetId);
            content.setAttribute('aria-hidden', 'false');
            
            header.addEventListener('click', () => {
                const icon = header.querySelector('.collapse-icon');
                const isExpanded = content.classList.contains('collapsed');
                
                content.classList.toggle('collapsed');
                icon.classList.toggle('fa-chevron-down');
                icon.classList.toggle('fa-chevron-up');
                
                header.setAttribute('aria-expanded', (!isExpanded).toString());
                content.setAttribute('aria-hidden', isExpanded.toString());
                
                const sectionTitle = header.querySelector('h3, h4')?.textContent || 'Section';
                window.MicFinderAccessibility.announceToScreenReader(`${sectionTitle} ${isExpanded ? 'expanded' : 'collapsed'}`);
            });
        }
    });
}

// Enhance filter accessibility
function enhanceFilterAccessibility() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.setAttribute('aria-label', 'Search mics by venue name');
        searchInput.setAttribute('aria-describedby', 'search-description');
        
        if (!document.getElementById('search-description')) {
            const description = document.createElement('div');
            description.id = 'search-description';
            description.className = 'sr-only';
            description.textContent = 'Type to search for comedy mics by venue name';
            searchInput.parentNode.appendChild(description);
        }
    }
    
    const dayFilter = document.getElementById('day-filter');
    if (dayFilter) {
        dayFilter.setAttribute('role', 'radiogroup');
        dayFilter.setAttribute('aria-label', 'Filter by day of week');
        
        dayFilter.querySelectorAll('.segment-btn').forEach(btn => {
            btn.setAttribute('role', 'radio');
            btn.setAttribute('aria-checked', btn.classList.contains('active').toString());
        });
    }
    
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
        const filterType = checkbox.dataset.filter;
        const value = checkbox.dataset.value;
        checkbox.setAttribute('aria-label', `${value} ${filterType}`);
    });
    
    const customTimeStart = document.getElementById('custom-time-start');
    const customTimeEnd = document.getElementById('custom-time-end');
    if (customTimeStart) {
        customTimeStart.setAttribute('aria-label', 'Start time for custom time range');
    }
    if (customTimeEnd) {
        customTimeEnd.setAttribute('aria-label', 'End time for custom time range');
    }
    
    const sortBySelect = document.getElementById('sort-by');
    if (sortBySelect) {
        sortBySelect.setAttribute('aria-label', 'Sort mics by');
    }
}

// Time of Day custom range logic
function updateTimeFilter() {
    const startHour = document.getElementById('custom-time-start-hour');
    const startMinute = document.getElementById('custom-time-start-minute');
    const startAmPm = document.getElementById('custom-time-start-ampm');
    const endHour = document.getElementById('custom-time-end-hour');
    const endMinute = document.getElementById('custom-time-end-minute');
    const endAmPm = document.getElementById('custom-time-end-ampm');

    if (startHour && startMinute && startAmPm && endHour && endMinute && endAmPm) {
        // Format hours to ensure proper padding
        const startHourVal = startHour.value.padStart(2, '0');
        const endHourVal = endHour.value.padStart(2, '0');
        
        const startTime = `${startHourVal}:${startMinute.value} ${startAmPm.value}`;
        const endTime = `${endHourVal}:${endMinute.value} ${endAmPm.value}`;

        const activeFilters = window.MicFinderState.getActiveFilters();
        activeFilters.customTimeStart = startTime;
        activeFilters.customTimeEnd = endTime;
        window.MicFinderState.setActiveFilters(activeFilters);
        window.MicFinderFilters.saveFilterState(activeFilters);
        window.MicFinderApp.render();
    }
}

// Clear time filter function - sets default 10am-11:45pm range
function clearTimeFilter() {
    setCustomTimeRange(
        { hour: '10', minute: '00', ampm: 'AM' },
        { hour: '11', minute: '45', ampm: 'PM' }
    );
}

function setCustomTimeRange(start, end) {
    const { hour: startHour, minute: startMinute, ampm: startAmpm } = start;
    const { hour: endHour, minute: endMinute, ampm: endAmpm } = end;

    // Check if elements exist before setting values
    const startHourEl = document.getElementById('custom-time-start-hour');
    const startMinuteEl = document.getElementById('custom-time-start-minute');
    const startAmpmEl = document.getElementById('custom-time-start-ampm');
    const endHourEl = document.getElementById('custom-time-end-hour');
    const endMinuteEl = document.getElementById('custom-time-end-minute');

    if (startHourEl) startHourEl.value = startHour;
    if (startMinuteEl) startMinuteEl.value = startMinute;
    if (startAmpmEl) startAmpmEl.value = startAmpm;
    if (endHourEl) endHourEl.value = endHour;
    if (endMinuteEl) endMinuteEl.value = endMinute;
    
    const endAmpmEl = document.getElementById('custom-time-end-ampm');
    if (endAmpmEl) endAmpmEl.value = endAmpm;

    // Trigger the update
    updateTimeFilter();
}

function setDefaultTimeValues() {
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
    
    // Set start time to current time
    document.getElementById('custom-time-start-hour').value = hours.toString();
    document.getElementById('custom-time-start-minute').value = minuteStr;
    document.getElementById('custom-time-start-ampm').value = isPM ? 'PM' : 'AM';
    
    // Set end time to 11:45 PM
    document.getElementById('custom-time-end-hour').value = '11';
    document.getElementById('custom-time-end-minute').value = '45';
    document.getElementById('custom-time-end-ampm').value = 'PM';
    
    // Trigger the update
    updateTimeFilter();
}

// Setup sidebar event listeners
function setupSidebarEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const activeFilters = window.MicFinderState.getActiveFilters();
            activeFilters.search = e.target.value;
            window.MicFinderState.setActiveFilters(activeFilters);
            window.MicFinderFilters.saveFilterState(activeFilters);
            window.MicFinderApp.render();
        });
    }

    // Day filter
    const dayFilterGroup = document.getElementById('day-filter');
    if (dayFilterGroup) {
        const newDayFilter = dayFilterGroup.cloneNode(true);
        dayFilterGroup.parentNode.replaceChild(newDayFilter, dayFilterGroup);
        
        newDayFilter.addEventListener('click', e => {
            if (!e.target.matches('.segment-btn')) return;
            const value = e.target.dataset.value;
            
            const activeFilters = window.MicFinderState.getActiveFilters();
            
            // Toggle logic: if clicking the same day, deselect it
            if (activeFilters.day === value) {
                activeFilters.day = null;
                window.MicFinderState.setActiveFilters(activeFilters);
                
                newDayFilter.querySelectorAll('.segment-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
            } else {
                activeFilters.day = value;
                window.MicFinderState.setActiveFilters(activeFilters);
                
                newDayFilter.querySelectorAll('.segment-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                

            }

            const currentDay = window.MicFinderUtils.getCurrentDay();
            if (value.toLowerCase() === currentDay.toLowerCase()) {
                setDefaultTimeValues();
            } else {
                setCustomTimeRange(
                    { hour: '10', minute: '00', ampm: 'AM' },
                    { hour: '11', minute: '45', ampm: 'PM' }
                );
            }
            
            window.MicFinderFilters.saveFilterState(activeFilters);
            window.MicFinderApp.render();
        });
    }

    // Checkbox filters
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', e => {
            const filterType = e.target.dataset.filter;
            const value = e.target.dataset.value;
            const activeFilters = window.MicFinderState.getActiveFilters();
            
            if (!Array.isArray(activeFilters[filterType])) {
                activeFilters[filterType] = [];
            }
            
            if (e.target.checked) {
                if (!activeFilters[filterType].includes(value)) {
                    activeFilters[filterType].push(value);
                }
            } else {
                const index = activeFilters[filterType].indexOf(value);
                if (index > -1) {
                    activeFilters[filterType].splice(index, 1);
                }
            }
            
            window.MicFinderState.setActiveFilters(activeFilters);
            window.MicFinderFilters.saveFilterState(activeFilters);
            window.MicFinderApp.render();
        });
    });
    
    // Map filter toggle
    const mapFilterToggle = document.getElementById('map-filter-toggle');
    const mapFilterLabel = document.getElementById('map-filter-label');
    
    // Function to update label text based on toggle state
    function updateMapFilterLabel(isEnabled) {
        if (mapFilterLabel) {
            mapFilterLabel.textContent = isEnabled ? 'Showing all mics on map ONLY' : 'Showing all mics in sidebar';
        }
    }
    
    if (mapFilterToggle) {
        // Set initial label text based on current state
        updateMapFilterLabel(mapFilterToggle.checked);
        
        mapFilterToggle.addEventListener('change', () => {
            console.log('Map filter toggle changed:', mapFilterToggle.checked);
            
            // Update label text
            updateMapFilterLabel(mapFilterToggle.checked);
            
            // Clear bounds cache when toggling map filter to ensure clean state
            window.MicFinderFilters.clearBoundsCache();
            
            window.MicFinderState.setMapFilterEnabled(mapFilterToggle.checked);
            const activeFilters = window.MicFinderState.getActiveFilters();
            activeFilters.mapFilterEnabled = mapFilterToggle.checked;
            window.MicFinderState.setActiveFilters(activeFilters);
            window.MicFinderFilters.saveFilterState(activeFilters);
            window.MicFinderApp.render();
        });
    } else {
        console.error('Map filter toggle element not found');
    }

    // Sort by select
    const sortBySelect = document.getElementById('sort-by');
    if (sortBySelect) {
        sortBySelect.addEventListener('change', () => {
            const activeFilters = window.MicFinderState.getActiveFilters();
            activeFilters.sort = sortBySelect.value;
            window.MicFinderState.setActiveFilters(activeFilters);
            window.MicFinderFilters.saveFilterState(activeFilters);
            window.MicFinderApp.render();
        });
    }

    // Time of Day custom range logic
    const timeSelects = [
        'custom-time-start-hour',
        'custom-time-start-minute',
        'custom-time-start-ampm',
        'custom-time-end-hour',
        'custom-time-end-minute',
        'custom-time-end-ampm'
    ].map(id => document.getElementById(id));

    if (timeSelects.every(select => select)) {
        timeSelects.forEach(select => {
            select.addEventListener('change', updateTimeFilter);
        });
        
        // Set default values
        setDefaultTimeValues();
    }

    // Clear time filter button
    const clearTimeBtn = document.getElementById('clear-time-filter');
    if (clearTimeBtn) {
        clearTimeBtn.addEventListener('click', clearTimeFilter);
    }

    // Favorites toggle
    const favoritesToggle = document.getElementById('favorites-toggle');
    if (favoritesToggle) {
        favoritesToggle.addEventListener('click', () => {
            const activeFilters = window.MicFinderState.getActiveFilters();
            activeFilters.showFavorites = !activeFilters.showFavorites;
            window.MicFinderState.setActiveFilters(activeFilters);
            favoritesToggle.classList.toggle('fa-toggle-on', activeFilters.showFavorites);
            favoritesToggle.classList.toggle('fa-toggle-off', !activeFilters.showFavorites);
            window.MicFinderFilters.saveFilterState(activeFilters);
            window.MicFinderApp.render();
        });
    }
    
    // Reset filters
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // Reset to default filters, always set day to today
            const todayDay = window.MicFinderUtils.getCurrentDay();
            const defaultFilters = {
                day: todayDay,
                sort: 'currentTime',
                customTimeStart: '10:00 AM',
                customTimeEnd: '11:45 PM',
                timeSetViaModal: false, // Don't show pill for reset
                showFavorites: false,
                borough: [],
                neighborhood: [],
                cost: [],
                mapFilterEnabled: false,
                search: ''
            };
            window.MicFinderState.setActiveFilters(defaultFilters);
            window.MicFinderFilters.applyFilterState(defaultFilters);
            window.MicFinderFilters.saveFilterState(defaultFilters);
            
            // Update the time selectors to match the default range
            setCustomTimeRange(
                { hour: '10', minute: '00', ampm: 'AM' },
                { hour: '11', minute: '45', ampm: 'PM' }
            );
            
            window.MicFinderApp.render();
        });
    }
}

// Save filter state
function saveFilterState(state) {
    window.MicFinderFilters.saveFilterState(state);
}

// Load filter state
function loadFilterState() {
    return window.MicFinderFilters.loadFilterState();
}

// Add this new function to handle the admin panel
function setupAdminTools(user) {
    const adminPanel = document.getElementById('admin-panel');
    const logoutBtn = document.getElementById('logout-btn');
    const addMicBtn = document.getElementById('add-mic-btn');
    const addMicModal = document.getElementById('add-mic-modal');
    const cancelBtn = document.getElementById('cancel-add-mic');
    const closeBtn = document.getElementById('close-modal-btn');
    const addMicForm = document.getElementById('add-mic-form');

    if (!adminPanel) return;

    if (user) {
        adminPanel.classList.remove('hidden');
    } else {
        adminPanel.classList.add('hidden');
        return; // Don't set up listeners if user is not logged in
    }

    // This listener only needs to be set up once
    if (logoutBtn && !logoutBtn.dataset.listenerAttached) {
        logoutBtn.dataset.listenerAttached = 'true';
        logoutBtn.addEventListener('click', () => {
            const { auth } = window.MicFinderConfig;
            auth.signOut().catch(error => console.error('Logout Error:', error));
        });
    }

    // --- Add Mic Modal Logic ---
    if (addMicBtn && addMicModal && cancelBtn && addMicForm && closeBtn && !addMicBtn.dataset.listenerAttached) {
        addMicBtn.dataset.listenerAttached = 'true';

        const closeModal = () => {
            addMicModal.classList.add('hidden');
            addMicForm.reset();
            document.getElementById('mic-id').value = ''; // Clear ID on close
            document.getElementById('form-title').textContent = 'Add New Mic'; // Reset title
        };

        addMicBtn.addEventListener('click', () => {
            // Reset form for adding a new mic
            addMicForm.reset();
            document.getElementById('mic-id').value = '';
            document.getElementById('form-title').textContent = 'Add New Mic';
            addMicModal.classList.remove('hidden');
        });

        cancelBtn.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);

        addMicForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const { db } = window.MicFinderConfig;
            const micId = document.getElementById('mic-id').value;
            const micData = {
                venue: document.getElementById('venue').value,
                address: document.getElementById('address').value,
                lat: parseFloat(document.getElementById('lat').value),
                lon: parseFloat(document.getElementById('lon').value),
                day: document.getElementById('day').value,
                time: document.getElementById('time').value,
                borough: document.getElementById('borough').value,
                cost: document.getElementById('cost').value,
                details: document.getElementById('details').value,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                if (micId) {
                    await db.collection('mics').doc(micId).update(micData);
                } else {
                    await db.collection('mics').add(micData);
                }
                closeModal();
                window.MicFinderApp.fetchData(); 
            } catch (error) {
                console.error('Error saving mic: ', error);
                alert('There was an error saving the mic.');
            }
        });
    }
}

// Export sidebar functionality
window.MicFinderSidebar = {
    loadSidebar,
    setupCollapsibleSections,
    enhanceFilterAccessibility,
    setupSidebarEventListeners,
    saveFilterState,
    loadFilterState,
    setupAdminTools,
    clearTimeFilter,
    setCustomTimeRange
}; 