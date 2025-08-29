        // --- Global Utility Functions ---
        function setExactVenueFlag(val) {
            window.__exactVenueFlag = val;
        }
        function getExactVenueFlag() {
            return !!window.__exactVenueFlag;
        }

        // --- Search History Support ---
        const SEARCH_HISTORY_KEY = 'micfinder_search_history';
        const SEARCH_HISTORY_LIMIT = 8;
        
        function getSearchHistory() {
            try {
                return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
            } catch {
                return [];
            }
        }
        
        function saveSearchHistory(history) {
            try {
                // Keep only the most recent entries
                const limitedHistory = history.slice(0, SEARCH_HISTORY_LIMIT);
                localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limitedHistory));
            } catch (e) {
                console.warn('Could not save search history:', e);
            }
        }
        
        function addSearchToHistory(term) {
            if (!term || !term.trim()) return;
            let history = getSearchHistory();
            // Remove duplicates (case-insensitive)
            history = history.filter(item => item.toLowerCase() !== term.toLowerCase());
            history.unshift(term);
            saveSearchHistory(history);
        }
        
        // Helper to convert "HH:mm" to "h:mm AM/PM"
        function to12HourString(time24) {
            if (!time24) return '';
            const [h, m] = time24.split(':').map(Number);
            const period = h >= 12 ? 'PM' : 'AM';
            let hour = h % 12;
            if (hour === 0) hour = 12;
            return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
        }

        // --- Location-aware autocomplete support ---
        let userLocation = null;
        
        // Function to request user location (only called in response to user gesture)
        function requestUserLocation(callback) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        userLocation = {
                            lat: pos.coords.latitude,
                            lon: pos.coords.longitude
                        };
                        if (callback) callback(userLocation);
                    },
                    (err) => {
                        userLocation = null;
                        if (callback) callback(null);
                    },
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
                );
            } else {
                if (callback) callback(null);
            }
        }
        
        // Haversine formula for distance in miles
        function getDistanceMiles(lat1, lon1, lat2, lon2) {
            if ([lat1, lon1, lat2, lon2].some(v => typeof v !== 'number' || isNaN(v))) return null;
            const toRad = (deg) => deg * Math.PI / 180;
            const R = 3958.8; // Earth radius in miles
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        }

        // --- State Management ---
        let filterState = {
            dayOfWeek: new Set(),
            time: { from: '', to: '' },
            locations: new Set(),
            details: new Set(),
            favorites: new Set()
        };
        const locationOptions = ["Manhattan", "Brooklyn", "Queens"];
        const detailOptions = ["Free", "Paid", "1 Item Min", "In-person Sign-up", "Online Sign-up"];
        
        // Initialize DOM elements when DOM is ready
        let modalButton, filterModal, closeModalX, applyFiltersButton, clearFiltersButton, filtersScrollContainer, allFiltersText;
        
        function initializeDOMElements() {
            modalButton = document.getElementById('modal-button');
            filterModal = document.getElementById('filter-modal');
            closeModalX = document.getElementById('close-modal-x');
            applyFiltersButton = document.getElementById('apply-filters');
            clearFiltersButton = document.getElementById('clear-filters');
            filtersScrollContainer = document.getElementById('filters-scroll-container');
            allFiltersText = document.getElementById('all-filters-text');
            
            console.log('[DOM] Elements initialized:', {
                modalButton: !!modalButton,
                filterModal: !!filterModal,
                closeModalX: !!closeModalX,
                applyFiltersButton: !!applyFiltersButton,
                clearFiltersButton: !!clearFiltersButton
            });
        }
        const createCustomTimePicker = (containerId) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = `
                <div class="custom-time-picker">
                    <div class="relative"><button class="time-part" data-part="hour">12</button><div class="time-dropdown hidden top-full mt-1" data-part="hour"></div></div>
                    <span class="text-white mx-1">:</span>
                    <div class="relative"><button class="time-part" data-part="minute">00</button><div class="time-dropdown hidden top-full mt-1" data-part="minute"></div></div>
                    <div class="relative"><button class="time-part" data-part="period">AM</button><div class="time-dropdown hidden top-full mt-1" data-part="period"></div></div>
                </div>
            `;
            const parts = {
                hour: container.querySelector('button[data-part="hour"]'),
                minute: container.querySelector('button[data-part="minute"]'),
                period: container.querySelector('button[data-part="period"]')
            };
            const dropdowns = {
                hour: container.querySelector('.time-dropdown[data-part="hour"]'),
                minute: container.querySelector('.time-dropdown[data-part="minute"]'),
                period: container.querySelector('.time-dropdown[data-part="period"]')
            };
            dropdowns.hour.innerHTML = Array.from({length: 12}, (_, i) => `<div class="time-dropdown-option">${i + 1}</div>`).join('');
            dropdowns.minute.innerHTML = ['00', '15', '30', '45'].map(m => `<div class="time-dropdown-option">${m}</div>`).join('');
            dropdowns.period.innerHTML = `<div class="time-dropdown-option">AM</div><div class="time-dropdown-option">PM</div>`;
            Object.keys(parts).forEach(part => {
                const button = parts[part];
                const dropdown = dropdowns[part];
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isHidden = dropdown.classList.contains('hidden');
                    closeAllDropdowns();
                    if(isHidden) dropdown.classList.remove('hidden');
                });
                dropdown.addEventListener('click', (e) => {
                    if (e.target.classList.contains('time-dropdown-option')) {
                        button.textContent = e.target.textContent;
                        dropdown.classList.add('hidden');
                        
                        // Update filterState with new time values
                        filterState.time.from = readPickerState('time-from-picker');
                        filterState.time.to = readPickerState('time-to-picker');
                        
                        // Update global filters and re-render
                        const newFilters = {};
                        newFilters.customTimeStart = filterState.time.from ? to12HourString(filterState.time.from) : '';
                        newFilters.customTimeEnd = filterState.time.to ? to12HourString(filterState.time.to) : '';
                        
                        // Preserve existing filters
                        const existingFilters = window.MicFinderState ? window.MicFinderState.getActiveFilters() : {};
                        Object.assign(newFilters, existingFilters);
                        
                        // Mark that time was set via sidebar
                        if (newFilters.customTimeStart && newFilters.customTimeEnd) {
                            newFilters.timeSetViaModal = true;
                        }
                        
                        // Update global state and re-render
                        if (window.MicFinderState && window.MicFinderFilters) {
                            window.MicFinderState.setActiveFilters(newFilters);
                            window.MicFinderFilters.saveFilterState(newFilters);
                            window.MicFinderApp.render();
                        }
                        
                        // Re-render pills when time changes
                        setTimeout(renderActivePills, 0);
                    }
                });
            });
        };
        const closeAllDropdowns = () => document.querySelectorAll('.time-dropdown').forEach(d => d.classList.add('hidden'));
        const updatePickerFromState = (pickerId, timeStr) => {
            if (!timeStr) return;
            const container = document.getElementById(pickerId);
            if (!container) return;
            const [hour24, minute] = timeStr.split(':').map(Number);
            const period = hour24 >= 12 ? 'PM' : 'AM';
            let hour12 = hour24 % 12;
            if (hour12 === 0) hour12 = 12;
            
            const hourBtn = container.querySelector('button[data-part="hour"]');
            const minuteBtn = container.querySelector('button[data-part="minute"]');
            const periodBtn = container.querySelector('button[data-part="period"]');
            
            if (hourBtn) hourBtn.textContent = hour12;
            if (minuteBtn) minuteBtn.textContent = minute.toString().padStart(2, '0');
            if (periodBtn) periodBtn.textContent = period;
        };
        const readPickerState = (pickerId) => {
            const container = document.getElementById(pickerId);
            if (!container) return '00:00';
            
            const hourBtn = container.querySelector('button[data-part="hour"]');
            const minuteBtn = container.querySelector('button[data-part="minute"]');
            const periodBtn = container.querySelector('button[data-part="period"]');
            
            if (!hourBtn || !minuteBtn || !periodBtn) return '00:00';
            
            let hour = parseInt(hourBtn.textContent);
            const minute = parseInt(minuteBtn.textContent);
            const period = periodBtn.textContent;
            
            if (period === 'PM' && hour !== 12) hour += 12;
            else if (period === 'AM' && hour === 12) hour = 0;
            return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        };
        createCustomTimePicker('time-from-picker');
        createCustomTimePicker('time-to-picker');
        const createCheckboxes = (containerId, options) => {
            const container = document.getElementById(containerId);
            container.innerHTML = options.map(opt => `<label class="flex items-center cursor-pointer"><input type="checkbox" value="${opt}" class="custom-checkbox"><span class="ml-2 text-gray-200">${opt}</span></label>`).join('');
        };
        document.querySelectorAll('.day-pill').forEach(pill => {
            pill.addEventListener('click', function () {
                // Only allow one active day at a time
                document.querySelectorAll('.day-pill').forEach(p => p.classList.remove('active'));
                this.classList.add('active');

                // Get selected day
                const selectedDay = this.dataset.day;
                

                const today = new Date();
                const daysOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
                const todayName = daysOfWeek[today.getDay()];

                let fromTime, toTime;

                if (selectedDay === todayName) {
                    // Today: current time (rounded to nearest 15 min) - 11:45 PM
                    let hours = today.getHours();
                    let minutes = today.getMinutes();
                    let snappedMinutes = Math.round(minutes / 15) * 15;
                    if (snappedMinutes === 60) {
                        snappedMinutes = 0;
                        hours = (hours + 1) % 24;
                    }
                    fromTime = `${hours.toString().padStart(2, '0')}:${snappedMinutes.toString().padStart(2, '0')}`;
                    toTime = '23:45';
                } else {
                    // All other days: 10:00 AM - 11:45 PM
                    fromTime = '10:00';
                    toTime = '23:45';
                }

                updatePickerFromState('time-from-picker', fromTime);
                updatePickerFromState('time-to-picker', toTime);
                filterState.time.from = fromTime;
                filterState.time.to = toTime;

                // Do NOT update global filter state or results here
                renderActivePills();
            });
        });
        const pillsRow = document.getElementById('active-pills-row');
        const pillsRowMobile = document.getElementById('active-pills-row-mobile');
        // Throttling for renderActivePills to prevent performance issues
        let lastRenderActivePillsTime = 0;
        let pendingRenderActivePills = null;
        
        window.renderActivePills = () => {
            // DISABLED: Old throttled pills system replaced by simple_pills.js
            console.log('⚠️ Old throttled pills system called but DISABLED - simple_pills.js will override this');
            return;
        };
        
        // Create local alias for internal use
        const renderActivePills = window.renderActivePills;
        
        function updateModalDaySelection(selectedDay) {
            // Update the modal day pills to match the dropdown selection
            const modalDayPills = document.querySelectorAll('#dayOfWeek-filters .day-pill');
            modalDayPills.forEach(pill => {
                pill.classList.toggle('active', pill.dataset.day === selectedDay);
            });
            
            // Update mobile day select if it exists
            const mobileDaySelect = document.getElementById('mobile-day-select');
            if (mobileDaySelect) {
                mobileDaySelect.value = selectedDay || '';
            }
            
            // Also update the internal filterState to keep things in sync
            if (typeof filterState !== 'undefined') {
                filterState.dayOfWeek.clear();
                if (selectedDay && selectedDay.trim()) {
                    filterState.dayOfWeek.add(selectedDay);
                }
            }
        }
        
        function syncPillsWithGlobalState() {
            if (window.MicFinderState) {
                const globalFilters = window.MicFinderState.getActiveFilters();
                
                // Update day selection in modal to match global state
                if (globalFilters.day) {
                    const selectedDay = Array.isArray(globalFilters.day) ? globalFilters.day[0] : globalFilters.day;
                    updateModalDaySelection(selectedDay);
                }
            }
        }
        
        window.renderActivePillsImmediate = () => {
            // DISABLED: Old complex pills system replaced by simple_pills.js
            console.log('⚠️ Old pills system called but DISABLED - using simple_pills.js instead');
            return;
            lastRenderActivePillsTime = Date.now();
            
            // Ensure DOM elements are available
            const currentPillsRow = document.getElementById('active-pills-row');
            const currentPillsRowMobile = document.getElementById('active-pills-row-mobile');
            
            if (!currentPillsRowMobile) {
                console.error('Mobile pills container not found in DOM!');
                return;
            }
            // Desktop: only filter pills in scrollable, All Filters outside
            if (pillsRow) {
                pillsRow.innerHTML = '';
                let totalFilters = 0;
                const createPill = (value, category, displayValue = value) => {
                    const pill = document.createElement('button');
                    pill.className = 'pill active-pill-item bg-gray-900/80 backdrop-blur-sm text-white border-white/10 shadow-md';
                    if (category === 'time') pill.classList.add('time-pill');
                    if (category === 'dayOfWeek') {
                        pill.setAttribute('data-type', 'day');
                        pill.classList.add('day-filter-pill');
                    }
                    
                    // Different structure for different pill types
                    if (category === 'time') {
                        pill.innerHTML = `${displayValue} <i class="fa-solid fa-clock ml-2 text-gray-300" style="font-size: 0.75rem;"></i>`;
                        
                        // Function to handle time pill interaction
                        const handleTimePillSelection = (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('🕒 Time pill clicked - opening time picker');
                            // Time selection functionality removed
                        };
                        
                        // Add both click and touch events for better mobile support
                        pill.addEventListener('click', handleTimePillSelection);
                        pill.addEventListener('touchend', handleTimePillSelection, { passive: true });
                        
                        // Prevent default touch behavior to avoid double-firing
                        pill.addEventListener('touchstart', (e) => {
                            e.stopPropagation();
                        }, { passive: true });
                    } else if (category === 'dayOfWeek') {
                        // Create simple pill for day of week - opens popup when clicked
                        pill.innerHTML = `${displayValue} <i class="fa-solid fa-chevron-down"></i>`;
                        pill.addEventListener('click', (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('🗓️ [DESKTOP] Day pill clicked - opening popup!');
                            openDaySelectionPopup(value);
                        });
                    } else if (category === 'locations') {
                        // Create simple pill for borough - opens popup when clicked
                        pill.setAttribute('data-type', 'location');
                        pill.classList.add('location-filter-pill');
                        pill.innerHTML = `${displayValue} <i class="fa-solid fa-chevron-down"></i>`;
                        pill.addEventListener('click', (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('🏢 [DESKTOP] Borough pill clicked - opening popup!');
                            openBoroughSelectionPopup(value);
                        });
                    } else if (category === 'details') {
                        // Create simple pill for details - opens popup when clicked
                        pill.setAttribute('data-type', 'details');
                        pill.classList.add('details-filter-pill');
                        pill.innerHTML = `${displayValue} <i class="fa-solid fa-chevron-down"></i>`;
                        pill.addEventListener('click', (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('📝 [DESKTOP] Details pill clicked - opening popup!');
                            openDetailsSelectionPopup(value);
                        });
                    } else {
                        pill.innerHTML = `${displayValue} <span class="ml-2 font-mono text-gray-300 hover:text-white">×</span>`;
                        pill.addEventListener('click', () => removeFilter(category, value));
                    }
                    
                    pillsRow.appendChild(pill);
                    totalFilters++;
                };
                const globalFilters = window.MicFinderState ? window.MicFinderState.getActiveFilters() : filterState;
                console.log('🏷️ [PILLS] Current globalFilters:', globalFilters);
                if (globalFilters.day) {
                    if (Array.isArray(globalFilters.day)) {
                        globalFilters.day.forEach(day => createPill(day, 'dayOfWeek'));
                    } else if (typeof globalFilters.day === 'string' && globalFilters.day) {
                        createPill(globalFilters.day, 'dayOfWeek');
                    }
                }
                if (globalFilters.customTimeStart && globalFilters.customTimeEnd) {
                    // Show the pill if it was set via modal, OR if it's not the default range
                    const isDefaultTimeRange = globalFilters.customTimeStart === '10:00 AM' && globalFilters.customTimeEnd === '11:45 PM';
                    const shouldShowPill = globalFilters.timeSetViaModal || !isDefaultTimeRange;
                    console.log('🕐 [PILL] Time pill logic:', {
                        customTimeStart: globalFilters.customTimeStart,
                        customTimeEnd: globalFilters.customTimeEnd,
                        timeSetViaModal: globalFilters.timeSetViaModal,
                        isDefaultTimeRange: isDefaultTimeRange,
                        shouldShowPill: shouldShowPill
                    });
                    if (shouldShowPill) {
                        console.log('🕐 [PILL] Creating time pill:', `${globalFilters.customTimeStart} - ${globalFilters.customTimeEnd}`);
                        createPill('time-range', 'time', `${globalFilters.customTimeStart} - ${globalFilters.customTimeEnd}`);
                    } else {
                        console.log('🕐 [PILL] NOT creating time pill (default range and not set via modal)');
                    }
                }
                if (globalFilters.borough && Array.isArray(globalFilters.borough)) {
                    globalFilters.borough.forEach(loc => createPill(loc, 'locations'));
                }
                if (globalFilters.cost && Array.isArray(globalFilters.cost)) {
                    globalFilters.cost.forEach(det => createPill(det, 'details'));
                }
                if (globalFilters.signup && Array.isArray(globalFilters.signup)) {
                    globalFilters.signup.forEach(det => createPill(det, 'details'));
                }
                if (globalFilters.showFavorites) {
                    createPill('Show Favorites Only', 'favorites');
                }
                const allFiltersText = document.getElementById('all-filters-text');
                if (allFiltersText) {
                    allFiltersText.textContent = totalFilters > 0 ? `All Filters (${totalFilters})` : 'All Filters';
                }
            }
            // Mobile: All Filters and filter pills in same row
            if (currentPillsRowMobile) {
                try {
                    // Check if All Filters button already exists to prevent duplicates
                    let allFiltersBtn = document.getElementById('modal-button-mobile');
                    
                    if (!allFiltersBtn) {
                        // Only create if it doesn't exist
                        console.log('[MOBILE PILLS] Creating new All Filters button');
                        allFiltersBtn = document.createElement('button');
                        allFiltersBtn.id = 'modal-button-mobile';
                        allFiltersBtn.className = 'bg-gray-100 text-gray-800 border border-gray-400 shadow-md hover:bg-gray-200 hover:border-gray-500 flex-shrink-0 mr-2 text-sm font-medium py-2.5 px-5 rounded-xl transition-colors flex items-center gap-2';
                        allFiltersBtn.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M11.5 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M9.05 3a2.5 2.5 0 0 1 4.9 0H16v1h-2.05a2.5 2.5 0 0 1-4.9 0H0V3zM4.5 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M2.05 8a2.5 2.5 0 0 1 4.9 0H16v1H6.95a2.5 2.5 0 0 1-4.9 0H0V8zm9.45 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m-2.45 1a2.5 2.5 0 0 1 4.9 0H16v1h-2.05a2.5 2.5 0 0 1-4.9 0H0v-1z"/>
                            </svg>
                            <span id="all-filters-text-mobile">All Filters</span>
                        `;
                        
                        // Add event listener with error handling
                        try {
                            allFiltersBtn.addEventListener('click', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('[MODAL] Mobile button clicked');
                                openModal();
                            });
                            console.log('[MOBILE PILLS] ✅ Event listener attached successfully');
                        } catch (e) {
                            console.error('[MOBILE PILLS] ❌ Failed to attach event listener:', e);
                        }
                        
                        // Ensure button is properly rendered before continuing
                        allFiltersBtn.style.display = 'flex';
                        allFiltersBtn.style.minWidth = '100px'; // Ensure minimum width
                        allFiltersBtn.style.minHeight = '40px'; // Ensure minimum height
                        
                        // Verify button was created successfully
                        console.log('[MOBILE PILLS] ✅ All Filters button created successfully');
                    } else {
                        console.log('[MOBILE PILLS] All Filters button already exists, reusing it');
                    }
                    
                    // Clear the container and add/re-add the button first
                    currentPillsRowMobile.innerHTML = '';
                    currentPillsRowMobile.appendChild(allFiltersBtn);
                } catch (e) {
                    console.error('[MOBILE PILLS] ❌ Failed to create All Filters button:', e);
                }
                
                // Then render filter pills (these will scroll)
                const scrollPills = currentPillsRowMobile;
                let totalFilters = 0;
                const createPill = (value, category, displayValue = value) => {
                    const pill = document.createElement('button');
                    pill.className = 'pill active-pill-item bg-gray-900/80 backdrop-blur-sm text-white border-white/10 shadow-md hover:bg-black/70';
                    if (category === 'time') pill.classList.add('time-pill');
                    if (category === 'dayOfWeek') {
                        pill.setAttribute('data-type', 'day');
                        pill.classList.add('day-filter-pill');
                    }
                    
                    if (category === 'time') {
                        pill.innerHTML = `${displayValue} <span class="ml-2 text-gray-300 hover:text-white">🕒</span>`;
                        
                        // Function to handle mobile time pill interaction
                        const handleMobileTimePillSelection = (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('🕒 Mobile time pill clicked - opening time picker');
                            // Time selection functionality removed
                        };
                        
                        // Add both click and touch events for better mobile support
                        pill.addEventListener('click', handleMobileTimePillSelection);
                        pill.addEventListener('touchend', handleMobileTimePillSelection, { passive: true });
                        
                        // Prevent default touch behavior to avoid double-firing
                        pill.addEventListener('touchstart', (e) => {
                            e.stopPropagation();
                        }, { passive: true });
                    } else if (category === 'dayOfWeek') {
                        // Create simple pill for day of week - opens popup when clicked
                        pill.innerHTML = `${displayValue} <i class="fa-solid fa-chevron-down"></i>`;
                        pill.addEventListener('click', (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('🗓️ [MOBILE] Day pill clicked - opening popup!');
                            openDaySelectionPopup(value);
                        });
                    } else if (category === 'locations') {
                        // Create simple pill for borough - opens popup when clicked
                        pill.setAttribute('data-type', 'location');
                        pill.classList.add('location-filter-pill');
                        pill.innerHTML = `${displayValue} <i class="fa-solid fa-chevron-down"></i>`;
                        pill.addEventListener('click', (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('🏢 [MOBILE] Borough pill clicked - opening popup!');
                            openBoroughSelectionPopup(value);
                        });
                    } else if (category === 'details') {
                        // Create simple pill for details - opens popup when clicked
                        pill.setAttribute('data-type', 'details');
                        pill.classList.add('details-filter-pill');
                        pill.innerHTML = `${displayValue} <i class="fa-solid fa-chevron-down"></i>`;
                        pill.addEventListener('click', (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('📝 [MOBILE] Details pill clicked - opening popup!');
                            openDetailsSelectionPopup(value);
                        });
                    } else {
                        pill.innerHTML = `${displayValue} <span class="ml-2 font-mono text-gray-300 hover:text-white">×</span>`;
                        pill.addEventListener('click', () => removeFilter(category, value));
                    }
                    
                    scrollPills.appendChild(pill);
                    totalFilters++;
                    console.log('[MOBILE PILLS] Created pill:', displayValue, 'Category:', category);
                };
                const globalFilters = window.MicFinderState ? window.MicFinderState.getActiveFilters() : filterState;
                console.log('🏷️ [PILLS] Current globalFilters:', globalFilters);
                console.log('[MOBILE PILLS] Global filters:', globalFilters);
                
                if (globalFilters.day) {
                    if (Array.isArray(globalFilters.day)) {
                        globalFilters.day.forEach(day => createPill(day, 'dayOfWeek'));
                    } else if (typeof globalFilters.day === 'string' && globalFilters.day) {
                        createPill(globalFilters.day, 'dayOfWeek');
                    }
                }
                if (globalFilters.customTimeStart && globalFilters.customTimeEnd) {
                    // Show the pill if it was set via modal, OR if it's not the default range
                    const isDefaultTimeRange = globalFilters.customTimeStart === '10:00 AM' && globalFilters.customTimeEnd === '11:45 PM';
                    const shouldShowPill = globalFilters.timeSetViaModal || !isDefaultTimeRange;
                    console.log('🕐 [PILL] Time pill logic:', {
                        customTimeStart: globalFilters.customTimeStart,
                        customTimeEnd: globalFilters.customTimeEnd,
                        timeSetViaModal: globalFilters.timeSetViaModal,
                        isDefaultTimeRange: isDefaultTimeRange,
                        shouldShowPill: shouldShowPill
                    });
                    if (shouldShowPill) {
                        console.log('🕐 [PILL] Creating time pill:', `${globalFilters.customTimeStart} - ${globalFilters.customTimeEnd}`);
                        createPill('time-range', 'time', `${globalFilters.customTimeStart} - ${globalFilters.customTimeEnd}`);
                    } else {
                        console.log('🕐 [PILL] NOT creating time pill (default range and not set via modal)');
                    }
                }
                if (globalFilters.borough && Array.isArray(globalFilters.borough)) {
                    globalFilters.borough.forEach(loc => createPill(loc, 'locations'));
                }
                if (globalFilters.cost && Array.isArray(globalFilters.cost)) {
                    globalFilters.cost.forEach(det => createPill(det, 'details'));
                }
                if (globalFilters.signup && Array.isArray(globalFilters.signup)) {
                    globalFilters.signup.forEach(det => createPill(det, 'details'));
                }
                if (globalFilters.showFavorites) {
                    createPill('Show Favorites Only', 'favorites');
                }
                
                const allFiltersTextMobile = document.getElementById('all-filters-text-mobile');
                if (allFiltersTextMobile) {
                    allFiltersTextMobile.textContent = totalFilters > 0 ? `All Filters (${totalFilters})` : 'All Filters';
                }
                
                // Update the button text as well
                const modalBtn = currentPillsRowMobile.querySelector('#modal-button-mobile');
                if (modalBtn) {
                    const btnText = modalBtn.querySelector('#all-filters-text-mobile');
                    if (btnText) {
                        btnText.textContent = totalFilters > 0 ? `All Filters (${totalFilters})` : 'All Filters';
                    }
                }
                
                // Test the layout after rendering (disabled to prevent console errors)
                // setTimeout(() => {
                    console.log('[MOBILE PILLS] === LAYOUT TEST ===');
                    console.log('[MOBILE PILLS] Container exists:', !!currentPillsRowMobile);
                    console.log('[MOBILE PILLS] Container display:', getComputedStyle(currentPillsRowMobile).display);
                    console.log('[MOBILE PILLS] Container visibility:', getComputedStyle(currentPillsRowMobile).visibility);
                    console.log('[MOBILE PILLS] Container opacity:', getComputedStyle(currentPillsRowMobile).opacity);
                    console.log('[MOBILE PILLS] Container dimensions:', {
                        width: currentPillsRowMobile.offsetWidth,
                        height: currentPillsRowMobile.offsetHeight,
                        scrollWidth: currentPillsRowMobile.scrollWidth,
                        clientWidth: currentPillsRowMobile.clientWidth
                    });
                    
                    // Check parent container
                    const parentContainer = currentPillsRowMobile.closest('.mobile-pills-row');
                    if (parentContainer) {
                        console.log('[MOBILE PILLS] Parent container display:', getComputedStyle(parentContainer).display);
                        console.log('[MOBILE PILLS] Parent container visibility:', getComputedStyle(parentContainer).visibility);
                        console.log('[MOBILE PILLS] Parent container dimensions:', {
                            width: parentContainer.offsetWidth,
                            height: parentContainer.offsetHeight
                        });
                    }
                    
                    // Check if we're on mobile/tablet view - delay measurements for layout completion
                    requestAnimationFrame(() => {
                        console.log('[MOBILE PILLS] Window width:', window.innerWidth);
                        console.log('[MOBILE PILLS] lg:hidden should be active:', window.innerWidth < 1024);
                        const testAllFiltersBtn = currentPillsRowMobile.querySelector('#modal-button-mobile');
                        
                        if (testAllFiltersBtn) {
                            const btnRect = testAllFiltersBtn.getBoundingClientRect();
                            console.log('[MOBILE PILLS] All Filters button position:', {
                                left: btnRect.left,
                                right: btnRect.right,
                                width: btnRect.width,
                                height: btnRect.height,
                                display: getComputedStyle(testAllFiltersBtn).display
                            });
                            
                            // Verify button is actually clickable
                            if (btnRect.width === 0 || btnRect.height === 0) {
                                console.error('[MOBILE PILLS] ❌ Button has zero dimensions!');
                                // Force explicit styling
                                testAllFiltersBtn.style.display = 'flex';
                                testAllFiltersBtn.style.minWidth = '100px';
                                testAllFiltersBtn.style.minHeight = '40px';
                            } else {
                                console.log('[MOBILE PILLS] ✅ Button has proper dimensions');
                            }
                        } else {
                            console.error('[MOBILE PILLS] ❌ All Filters button not found');
                        }
                    });
                // }, 100);
            }
        };
        const syncStateFromModal = () => {
            filterState.dayOfWeek.clear();
            document.querySelectorAll('#dayOfWeek-filters .day-pill.active').forEach(p => filterState.dayOfWeek.add(p.dataset.day));
            filterState.time.from = readPickerState('time-from-picker');
            filterState.time.to = readPickerState('time-to-picker');
            // Robustly sync checkboxes for each filter category
            // Locations (boroughs)
            filterState.locations.clear();
            document.querySelectorAll('#location-filters input[type="checkbox"]:checked').forEach(i => filterState.locations.add(i.value));
            // Details
            filterState.details.clear();
            document.querySelectorAll('#details-filters input[type="checkbox"]:checked').forEach(i => filterState.details.add(i.value));
            // Favorites
            filterState.favorites.clear();
            document.querySelectorAll('#favorites-filter input[type="checkbox"]:checked').forEach(i => filterState.favorites.add(i.value));
            // DEBUG: Log locations after syncing from modal
            console.log('[DEBUG] filterState.locations after sync:', Array.from(filterState.locations));
        };
        const syncModalFromState = () => {
            document.querySelectorAll('#dayOfWeek-filters .day-pill').forEach(p => p.classList.toggle('active', filterState.dayOfWeek.has(p.dataset.day)));
            updatePickerFromState('time-from-picker', filterState.time.from);
            updatePickerFromState('time-to-picker', filterState.time.to);
            ['locations', 'details', 'favorites'].forEach(cat => {
                const container = cat === 'favorites' ? 'favorites-filter' : `${cat}-filters`;
                document.querySelectorAll(`#${container} input[type="checkbox"]`).forEach(input => {
                    input.checked = filterState[cat]?.has(input.value) || false;
                });
            });
        };
        const removeFilter = (category, value) => {
            // Get current global filters
            const globalFilters = window.MicFinderState.getActiveFilters();

            if (category === 'time') {
                console.log('🕐 [FILTER] Removing time pill - resetting to default 10:00 AM - 11:45 PM');
                globalFilters.customTimeStart = '10:00 AM';
                globalFilters.customTimeEnd = '11:45 PM';
                globalFilters.timeSetViaModal = false; // Clear modal flag when X'ing out
                
                // Update the sidebar time selectors to reflect the new default range
                if (window.MicFinderSidebar && window.MicFinderSidebar.setCustomTimeRange) {
                    window.MicFinderSidebar.setCustomTimeRange(
                        { hour: '10', minute: '00', ampm: 'AM' },
                        { hour: '11', minute: '45', ampm: 'PM' }
                    );
                }
            } else if (category === 'dayOfWeek') {
                if (Array.isArray(globalFilters.day)) {
                    globalFilters.day = globalFilters.day.filter(day => day !== value);
                } else if (globalFilters.day === value) {
                    globalFilters.day = '';
                }
            } else if (category === 'locations') {
                if (Array.isArray(globalFilters.borough)) {
                    globalFilters.borough = globalFilters.borough.filter(b => b !== value);
                }
            } else if (category === 'details') {
                if (Array.isArray(globalFilters.cost)) {
                    globalFilters.cost = globalFilters.cost.filter(c => c !== value && c !== '1 drink min');
                }
                if (Array.isArray(globalFilters.signup)) {
                    globalFilters.signup = globalFilters.signup.filter(s => s !== value);
                }
            } else if (category === 'favorites') {
                globalFilters.showFavorites = false;
            }

            // Update global state and UI
            window.MicFinderState.setActiveFilters(globalFilters);
            window.MicFinderFilters.saveFilterState(globalFilters);
            window.MicFinderApp.render();
            renderActivePills();
            // Force search bar dropdown to update with new filters
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        };
        const setDefaultTime = () => {
             const now = new Date();
             let hours = now.getHours();
             let minutes = now.getMinutes();
             let snappedMinutes = Math.round(minutes / 15) * 15;
             if (snappedMinutes === 60) {
                 snappedMinutes = 0;
                 hours = (hours + 1) % 24;
             }
             filterState.time.from = `${hours.toString().padStart(2, '0')}:${snappedMinutes.toString().padStart(2, '0')}`;
             filterState.time.to = '23:45';
        };
        const openModal = () => {
            console.log('[MODAL] Opening filter modal...');
            
            // Ensure DOM elements are available
            if (!filterModal) {
                console.log('[MODAL] FilterModal not available, reinitializing DOM elements...');
                initializeDOMElements();
            }
            
            if (!filterModal) {
                console.error('[MODAL] Filter modal element not found even after reinitialization!');
                return;
            }
            
            // Sync from global state first
            syncModalFromGlobalState();
            
            // Set default time if no time is set
            if (!filterState.time.from && !filterState.time.to) setDefaultTime();
            
            // Update modal UI
            syncModalFromState();
            renderActivePills();
            
            // Show modal - Use multiple approaches to ensure visibility
            if (filterModal) {
                console.log('[MODAL] Before:', filterModal.className);
                
                // Method 1: Remove hidden and add flex
                filterModal.classList.remove('hidden');
                filterModal.classList.add('flex');
                
                // Method 2: Try with !important classes
                filterModal.classList.add('!flex');
                
                // Method 3: Force with inline style as fallback
                filterModal.style.cssText = 'display: flex !important; position: fixed !important; inset: 0 !important; z-index: 50 !important;';
                
                console.log('[MODAL] After:', filterModal.className);
                
                // Check if it worked
                setTimeout(() => {
                    const computedDisplay = getComputedStyle(filterModal).display;
                    console.log('[MODAL] Computed display:', computedDisplay);
                    if (computedDisplay === 'none') {
                        console.error('[MODAL] Modal still hidden! Trying alternative approach...');
                        // Last resort: completely override the style
                        filterModal.style.cssText = 'display: flex !important; position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; z-index: 9999 !important; background: rgba(0,0,0,0.6) !important; align-items: center !important; justify-content: center !important; padding: 1rem !important;';
                    }
                }, 50);
            } else {
                console.error('[MODAL] Filter modal element not found!');
            }
        };
        const closeModal = () => {
            console.log('[MODAL] Closing filter modal...');
            if (filterModal) {
                filterModal.classList.add('hidden');
                filterModal.classList.remove('flex', '!flex');
                // Reset inline styles completely
                filterModal.style.cssText = '';
                closeAllDropdowns();
                console.log('[MODAL] Modal closed');
            }
        };
        const handleApplyFilters = () => {
            syncStateFromModal();
            closeModal();

            // --- Map modal filterState to app's global filter format ---
            const newFilters = {};

            // Search filter (get from main search input)
            const searchInput = document.getElementById('search-input');
            if (searchInput && searchInput.value.trim()) {
                newFilters.search = searchInput.value.trim();
            }

            // Day of week
            if (filterState.dayOfWeek.size > 0) {
                // If only one day, use string, else array
                newFilters.day = filterState.dayOfWeek.size === 1
                    ? Array.from(filterState.dayOfWeek)[0]
                    : Array.from(filterState.dayOfWeek);
            } else {
                newFilters.day = '';
            }

            // Time
            newFilters.customTimeStart = filterState.time.from
                ? to12HourString(filterState.time.from)
                : '';
            newFilters.customTimeEnd = filterState.time.to
                ? to12HourString(filterState.time.to)
                : '';
            
            // Mark that time was set via modal (to show pill even if it's 10am-11:45pm)
            if (newFilters.customTimeStart && newFilters.customTimeEnd) {
                newFilters.timeSetViaModal = true;
            }

            // Location (map to boroughs)
            newFilters.borough = Array.from(filterState.locations);
            // DEBUG: Log boroughs after mapping
            console.log('[DEBUG] newFilters.borough:', newFilters.borough);

            // Details (map to cost and signup)
            newFilters.cost = [];
            newFilters.signup = [];
            filterState.details.forEach(detail => {
                if (detail === "Free") {
                    newFilters.cost.push('free');
                } else if (detail === "Paid") {
                    newFilters.cost.push('paid');
                } else if (detail === "1 Item Min") {
                    newFilters.cost.push('1 drink min');
                } else if (detail === "In-person Sign-up") {
                    newFilters.signup.push('in-person');
                } else if (detail === "Online Sign-up") {
                    newFilters.signup.push('online');
                }
            });

            // Favorites
            newFilters.showFavorites = filterState.favorites.has("Show Favorites Only");

            // DEBUG: Log all filters before applying
            console.log('[DEBUG] About to apply filters:', newFilters);

            // Save and apply
            if (window.MicFinderState && window.MicFinderFilters && window.MicFinderApp) {
                console.log('Applying filters...');
                window.MicFinderState.setActiveFilters(newFilters);
                window.MicFinderFilters.saveFilterState(newFilters);
                window.MicFinderApp.render();
                console.log('Filters applied successfully');
                // Render pills AFTER global state is updated
                renderActivePills();
                // Force search bar dropdown to update with new filters
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            } else {
                console.error('Required window objects not available');
            }
        };
        const handleClearFilters = () => {
            // Clear local filter state
            Object.values(filterState).forEach(val => (val instanceof Set ? val.clear() : (val.from = '', val.to = '')));
            
            // Set time to 10:00 AM - 11:59 PM after clearing
            filterState.time.from = '10:00';
            filterState.time.to = '23:59';
            
            // Don't set any default day - leave dayOfWeek empty
            // const today = new Date().toLocaleString('en-us', { weekday: 'long' });
            // filterState.dayOfWeek.add(today);
            
            // Update time pickers
            updatePickerFromState('time-from-picker', '10:00');
            updatePickerFromState('time-to-picker', '23:59');
            
            // Clear all day pills - don't set any as active
            document.querySelectorAll('#dayOfWeek-filters .day-pill').forEach(p => {
                p.classList.remove('active');
            });
            
            // Clear mobile day select as well
            const mobileDaySelect = document.getElementById('mobile-day-select');
            if (mobileDaySelect) {
                mobileDaySelect.value = '';
            }
            
            // Clear all checkboxes
            document.querySelectorAll('#location-filters input[type="checkbox"]').forEach(cb => cb.checked = false);
            document.querySelectorAll('#details-filters input[type="checkbox"]').forEach(cb => cb.checked = false);
            document.querySelectorAll('#favorites-filter input[type="checkbox"]').forEach(cb => cb.checked = false);
            
            // Apply the cleared filters
            handleApplyFilters();
        };
        const syncModalFromGlobalState = () => {
            if (!window.MicFinderState) return;
            
            const globalFilters = window.MicFinderState.getActiveFilters();
            
            // Clear current state
            Object.values(filterState).forEach(val => (val instanceof Set ? val.clear() : (val.from = '', val.to = '')));
            
            // Day of week
            if (globalFilters.day) {
                if (Array.isArray(globalFilters.day)) {
                    globalFilters.day.forEach(day => filterState.dayOfWeek.add(day));
                } else {
                    filterState.dayOfWeek.add(globalFilters.day);
                }
            }
            
            // Time
            if (globalFilters.customTimeStart) {
                const startTime = globalFilters.customTimeStart;
                const [time, period] = startTime.split(' ');
                const [hour, minute] = time.split(':');
                let hour24 = parseInt(hour);
                if (period === 'PM' && hour24 !== 12) hour24 += 12;
                if (period === 'AM' && hour24 === 12) hour24 = 0;
                filterState.time.from = `${hour24.toString().padStart(2, '0')}:${minute}`;
            }
            
            if (globalFilters.customTimeEnd) {
                const endTime = globalFilters.customTimeEnd;
                const [time, period] = endTime.split(' ');
                const [hour, minute] = time.split(':');
                let hour24 = parseInt(hour);
                if (period === 'PM' && hour24 !== 12) hour24 += 12;
                if (period === 'AM' && hour24 === 12) hour24 = 0;
                filterState.time.to = `${hour24.toString().padStart(2, '0')}:${minute}`;
            }
            
            // Borough
            if (globalFilters.borough && Array.isArray(globalFilters.borough)) {
                globalFilters.borough.forEach(borough => filterState.locations.add(borough));
            }
            
            // Cost and signup
            if (globalFilters.cost && Array.isArray(globalFilters.cost)) {
                globalFilters.cost.forEach(cost => {
                    if (cost === 'free') filterState.details.add('Free');
                    else if (cost === 'paid') filterState.details.add('Paid');
                    else if (cost === '1 drink min') filterState.details.add('1 Item Min');
                });
            }
            
            if (globalFilters.signup && Array.isArray(globalFilters.signup)) {
                globalFilters.signup.forEach(signup => {
                    if (signup === 'in-person') filterState.details.add('In-person Sign-up');
                    else if (signup === 'online') filterState.details.add('Online Sign-up');
                });
            }
            
            // Favorites
            if (globalFilters.showFavorites) {
                filterState.favorites.add('Show Favorites Only');
            }
            
            // Update modal UI
            syncModalFromState();
            renderActivePills();
        };
        // Initialize everything when DOM is ready
        function initializeApp() {
            console.log('[APP] Initializing filter modal system...');
            initializeDOMElements();
            
            // Attach event listeners with better error handling and logging
            if (modalButton) {
                console.log('[MODAL] Attaching click listener to desktop modal button');
                modalButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[MODAL] Desktop button clicked');
                    openModal();
                });
            } else {
                console.warn('[MODAL] Desktop modal button not found');
            }
            }
        
        // Note: modalButtonMobile event listener is attached when button is created in renderActivePills()
        if (closeModalX) {
            closeModalX.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeModal();
            });
        }
        if (applyFiltersButton) {
            applyFiltersButton.addEventListener('click', handleApplyFilters);
        }
        if (clearFiltersButton) {
            clearFiltersButton.addEventListener('click', handleClearFilters);
        }
        
        // Close modal when clicking outside of modal content
        if (typeof filterModal !== 'undefined' && filterModal) {
            filterModal.addEventListener('click', (e) => {
                if (e.target === filterModal) {
                    closeModal();
                }
            });
        }
        
        document.addEventListener('click', (e) => {
            // Don't close dropdowns if clicking on day dropdown or pill
            if (e.target && typeof e.target.closest === 'function') {
                if (!e.target.closest('.relative') && 
                    !e.target.closest('.pill-dropdown') && 
                    !e.target.closest('.pill[data-type="day"]')) {
                    closeAllDropdowns();
                }
            }
        });
        
        // Initialize modal state on page load
        document.addEventListener('DOMContentLoaded', () => {
            // Wait for the app to initialize, then sync modal state
            setTimeout(() => {
                if (window.MicFinderState) {
                    syncModalFromGlobalState();
                    // Render pills immediately after syncing state
                    renderActivePills();
                    // Set up a listener for state changes to re-render pills
                    const originalSetActiveFilters = window.MicFinderState.setActiveFilters;
                    // Helper function to apply mutual exclusivity rules
                    function applyMutualExclusivityRules(filters) {
                        const cleanFilters = { ...filters };
                        
                        // Cost mutual exclusivity: Free vs Paid (handle both popup and modal formats)
                        if (Array.isArray(cleanFilters.cost)) {
                            const hasFree = cleanFilters.cost.includes('Free') || cleanFilters.cost.includes('free');
                            const hasPaid = cleanFilters.cost.includes('Paid') || cleanFilters.cost.includes('paid');
                            
                            if (hasFree && hasPaid) {
                                // Remove all Paid variants and keep Free variants
                                cleanFilters.cost = cleanFilters.cost.filter(c => 
                                    c !== 'Paid' && c !== 'paid'
                                );
                                console.log('🔧 [MUTUAL EXCLUSIVITY] Removed "Paid" because "Free" is selected');
                            }
                        }
                        
                        // Signup mutual exclusivity: In-person vs Online (handle both popup and modal formats)
                        if (Array.isArray(cleanFilters.signup)) {
                            const hasInPerson = cleanFilters.signup.includes('In-person Sign-up') || cleanFilters.signup.includes('in-person');
                            const hasOnline = cleanFilters.signup.includes('Online Sign-up') || cleanFilters.signup.includes('online');
                            
                            if (hasInPerson && hasOnline) {
                                // Remove all Online variants and keep In-person variants
                                cleanFilters.signup = cleanFilters.signup.filter(s => 
                                    s !== 'Online Sign-up' && s !== 'online'
                                );
                                console.log('🔧 [MUTUAL EXCLUSIVITY] Removed "Online Sign-up" because "In-person Sign-up" is selected');
                            }
                        }
                        
                        return cleanFilters;
                    }

                    window.MicFinderState.setActiveFilters = function(filters) {
                        // Apply mutual exclusivity rules before setting filters
                        const cleanFilters = applyMutualExclusivityRules(filters);
                        originalSetActiveFilters.call(this, cleanFilters);
                        // Re-render pills whenever filters change (unless disabled)
                        if (!window._disablePillRerender) {
                            setTimeout(() => {
                                syncModalFromGlobalState();
                                renderActivePills();
                                syncPillsWithGlobalState();
                            }, 0);
                        }
                    };

                    // Clean up existing filter state immediately
                    const currentFilters = window.MicFinderState.getActiveFilters();
                    const cleanedCurrentFilters = applyMutualExclusivityRules(currentFilters);
                    if (JSON.stringify(currentFilters) !== JSON.stringify(cleanedCurrentFilters)) {
                        console.log('🔧 [INITIAL CLEANUP] Applying mutual exclusivity to existing filters');
                        window.MicFinderState.setActiveFilters(cleanedCurrentFilters);
                    }
                }
            }, 100);
            
            // Add search input listener for real-time filtering
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                // Autocomplete functionality
                let autocompleteSuggestions = [];
                let selectedIndex = -1;
                
                // Generate suggestions from mic data (with typo tolerance using Fuse.js)
                function generateSuggestions(query) {
                    if (!query || query.length < 2) return [];

                    // Always use the full list of mics for venue suggestions (do NOT apply current filters)
                    let allMics = window.MicFinderState ? window.MicFinderState.getAllMics() : [];
                    if (!allMics || allMics.length === 0) return [];

                    // --- Group mics by venue for pill grid ---
                    function normalizeVenueName(name) {
                        return name.trim().toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9 ]/gi, '');
                    }
                    const venueMap = {};
                    const filters = window.MicFinderState ? window.MicFinderState.getActiveFilters() : {};
                    allMics.forEach(mic => {
                        const normVenue = normalizeVenueName(mic.venue);
                        if (!venueMap[normVenue]) {
                            venueMap[normVenue] = {
                                ...mic,
                                venue: mic.venue, // Keep the original casing of the first occurrence
                                times: [],
                                allMicTimes: [],
                                allMicIds: [],
                            };
                        }
                        // Always store all times/ids for reference (but deduplicate times)
                        if (!venueMap[normVenue].allMicTimes.includes(mic.time)) {
                            venueMap[normVenue].allMicTimes.push(mic.time);
                        }
                        venueMap[normVenue].allMicIds.push(mic.id);

                        // Only add to .times if it matches ALL filters
                        let matches = true;
                        // Day filter
                        if (filters.day) {
                            const days = Array.isArray(filters.day) ? filters.day : [filters.day];
                            if (!days.includes(mic.day)) matches = false;
                        }
                        // Time filter (assume mic.time is in 'h:mm AM/PM' and filters.customTimeStart/End are also in 'h:mm AM/PM')
                        if (filters.customTimeStart && filters.customTimeEnd && mic.time) {
                            function timeToMinutes(t) {
                                let match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                                if (!match) return null;
                                let [_, h, m, p] = match;
                                h = parseInt(h, 10);
                                m = parseInt(m, 10);
                                if (p.toUpperCase() === 'PM' && h < 12) h += 12;
                                if (p.toUpperCase() === 'AM' && h === 12) h = 0;
                                return h * 60 + m;
                            }
                            const micMins = timeToMinutes(mic.time);
                            const startMins = timeToMinutes(filters.customTimeStart);
                            const endMins = timeToMinutes(filters.customTimeEnd);
                            if (micMins === null || startMins === null || endMins === null || micMins < startMins || micMins > endMins) matches = false;
                        }
                        // Location filter (borough)
                        if (filters.borough && Array.isArray(filters.borough) && filters.borough.length > 0) {
                            if (!filters.borough.includes(mic.borough)) matches = false;
                        }
                        // Details filter (cost)
                        if (filters.cost && Array.isArray(filters.cost) && filters.cost.length > 0) {
                            if (!filters.cost.includes((mic.cost || '').toLowerCase())) matches = false;
                        }
                        // Details filter (signup)
                        if (filters.signup && Array.isArray(filters.signup) && filters.signup.length > 0) {
                            if (!filters.signup.includes((mic.signup || '').toLowerCase())) matches = false;
                        }
                        // Favorites filter
                        if (filters.showFavorites) {
                            if (!window.MicFinderFavorites || !window.MicFinderFavorites.isFavorite || !window.MicFinderFavorites.isFavorite(mic.id)) matches = false;
                        }
                        // --- DEBUG LOG ---
                        console.log('[DEBUG][Autocomplete] Venue:', mic.venue, '| Day:', mic.day, '| Time:', mic.time, '| Borough:', mic.borough, '| Included:', matches);
                        // --- Add times for mics that match filters (include future mics) ---
                        if (matches) {
                            // For autocomplete, show all matching times (not just "open" ones)
                            if (!venueMap[normVenue].times.includes(mic.time)) {
                                venueMap[normVenue].times.push(mic.time);
                            }
                        }
                    });
                    const fuseData = Object.values(venueMap).map(venue => ({
                        type: 'venue',
                        title: venue.venue,
                        subtitle: venue.address,
                        data: { venue: venue.venue },
                        mic: venue,
                        times: venue.times,
                        micIds: venue.allMicIds,
                    }));

                    // Set up Fuse.js
                    const fuse = new Fuse(fuseData, {
                        keys: ['title'],
                        threshold: 0.38, // Lower = stricter, higher = fuzzier
                        distance: 100,
                        minMatchCharLength: 2,
                        ignoreLocation: true,
                    });

                    // Get results
                    const results = fuse.search(query, { limit: 8 });
                    // Map to suggestion format
                    return results.map(res => ({
                        ...res.item,
                        title: res.item.title,
                        subtitle: res.item.subtitle,
                        type: res.item.type,
                        data: res.item.data,
                        mic: res.item.mic,
                        times: res.item.times,
                        micIds: res.item.micIds,
                    }));
                }
                
                // Highlight matching text
                function highlightText(text, query) {
                    if (!query) return text;
                    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    return text.replace(regex, '<span class="autocomplete-highlight">$1</span>');
                }
                
                // Render a single mixed list of recent searches and fuzzy suggestions (Google Maps style)
                function renderSuggestions(suggestions, isHistory = false, historyList = []) {
                    const dropdown = document.getElementById('autocomplete-dropdown');
                    if (!dropdown) return;

                    const query = searchInput.value.trim().toLowerCase();
                    let history = (historyList && historyList.length > 0) ? historyList : getSearchHistory();
                    let matchingHistory = [];
                    let mixedList = [];

                    if (query.length < 2) {
                        // Show up to 5 most recent history items (no venue suggestions)
                        matchingHistory = history.slice(0, 5);
                        mixedList = matchingHistory.map(term => ({
                            type: 'history',
                            title: term,
                            icon: 'fa-history',
                            isHistory: true
                        }));
                    } else {
                        // Show up to 2 matching history items, then venue suggestions
                        matchingHistory = history.filter(term => term.toLowerCase().includes(query)).slice(0, 2);
                        mixedList = [
                            ...matchingHistory.map(term => ({
                                type: 'history',
                                title: term,
                                icon: 'fa-history',
                                isHistory: true
                            })),
                            ...suggestions
                        ];
                    }

                    if (mixedList.length === 0) {
                        dropdown.innerHTML = '<div class="autocomplete-no-results">No matches found</div>';
                        dropdown.classList.remove('hidden');
                        return;
                    }

                    let html = mixedList.map((item, index) => {
                        if (item.isHistory) {
                            console.log('[RENDER] Rendering history suggestion:', item.title);
                            return `
                                <div class="autocomplete-suggestion history" data-index="h${index}" data-type="history" data-history-term="${item.title}">
                                    <div class="autocomplete-suggestion-icon"><i class="fa fa-history" aria-hidden="true"></i></div>
                                    <div class="autocomplete-suggestion-content">
                                        <div class="autocomplete-suggestion-title">${item.title}</div>
                                    </div>
                                    <button class="autocomplete-history-remove" title="Remove from history" tabindex="0" aria-label="Remove ${item.title} from history">&times;</button>
                                </div>
                            `;
                        } else {
                            let mic = item.mic || null;
                            const address = mic?.address || item.subtitle || '';
                            let distanceHtml = '';
                            if (userLocation && mic && typeof mic.lat === 'number' && typeof mic.lon === 'number') {
                                const dist = getDistanceMiles(userLocation.lat, userLocation.lon, mic.lat, mic.lon);
                                if (dist !== null && !isNaN(dist)) {
                                    distanceHtml = `<span class='autocomplete-suggestion-distance'>${dist.toFixed(1)} mi away</span>`;
                                }
                            }
                            let fullAddress = (mic?.address || item.subtitle || '').replace(/\n|\r|<br\s*\/?\>/gi, ' ');
                            let zip = '';
                            const zipMatch = fullAddress.match(/\b\d{5}\b/);
                            if (zipMatch) zip = zipMatch[0];
                            if (mic?.borough && zip) {
                                fullAddress = `${mic.borough}, NY, ${zip}`;
                            } else if (mic?.borough) {
                                fullAddress = `${mic.borough}, NY`;
                            } else if (zip) {
                                fullAddress = `NY, ${zip}`;
                            }
                            // --- Always render all times as pills for venue suggestions ---
                            let timesHtml = '';
                            if (item.type === 'venue' && item.times && item.times.length > 0) {
                                // DEBUG: Log times for each venue
                                console.log(`[RENDER DEBUG] Venue: ${item.title} | Times:`, item.times);
                                
                                // Sort times from earliest to latest
                                const parseTimeToMinutes = (timeStr) => {
                                    let match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                                    if (match) {
                                        let [_, hours, minutes, modifier] = match;
                                        hours = parseInt(hours, 10);
                                        minutes = parseInt(minutes, 10);
                                        if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
                                        if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
                                        return hours * 60 + minutes;
                                    }
                                    match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
                                    if (match) {
                                        let [_, hours, minutes] = match;
                                        return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
                                    }
                                    return 0;
                                };
                                const sortedTimes = [...item.times].sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
                                timesHtml = `
                                    <div class=\"flex flex-wrap gap-2 mt-2\">
                                        ${sortedTimes.map(time => `<span class=\"pill bg-gray-700 text-white\" data-venue=\"${item.title}\" data-time=\"${time}\">${time}</span>`).join('')}
                                    </div>
                                `;
                            } else if (item.type === 'venue') {
                                // DEBUG: Log when venue has no times
                                console.log(`[RENDER DEBUG] Venue: ${item.title} | No times array or empty times array:`, item.times);
                            }
                            return `
                                <div class=\"autocomplete-suggestion ${item.type} ${index === selectedIndex ? 'selected' : ''}\" 
                                     data-index=\"${index}\" 
                                     data-type=\"${item.type}\"
                                     data-venue=\"${item.data?.venue || ''}\"
                                     data-neighborhood=\"${item.data?.neighborhood || ''}\"
                                     data-borough=\"${item.data?.borough || ''}\"
                                     data-address=\"${fullAddress}\">
                                    <div class=\"autocomplete-suggestion-icon\">
                                        <i class=\"fa fa-map-marker-alt\" aria-hidden=\"true\"></i>
                                    </div>
                                    <div class=\"autocomplete-suggestion-content\">
                                        <div class=\"autocomplete-suggestion-title\">${highlightText(item.title, searchInput.value)}</div>
                                        <div class=\"autocomplete-suggestion-subtitle\">${fullAddress}</div>
                                        ${distanceHtml ? `<div class=\"autocomplete-suggestion-distance\">${distanceHtml}</div>` : ''}
                                        ${timesHtml}
                                    </div>
                                </div>
                            `;
                        }
                    }).join('');
                    // Add clear history button if any history is shown
                    if (matchingHistory.length > 0) {
                        html += `<div class="autocomplete-clear-history-row">
                            <button class="autocomplete-clear-history-btn" tabindex="0">Clear History</button>
                        </div>`;
                    }
                    dropdown.innerHTML = html;
                    dropdown.classList.remove('hidden');
                    isDropdownVisible = true;
                    console.log('Dropdown shown');

                    // Click handler for fuzzy suggestions
                    dropdown.querySelectorAll('.autocomplete-suggestion:not(.history)').forEach(suggestion => {
                        suggestion.addEventListener('mousedown', (e) => {
                            e.preventDefault(); // Prevent input blur before handler
                            selectSuggestion(suggestion);
                        });
                    });
                    // --- NEW: Click handler for time pills ---
                    dropdown.querySelectorAll('.autocomplete-suggestion').forEach(suggestion => {
                        const venue = suggestion.getAttribute('data-venue');
                        // Try to get the day from the suggestion's mic object (if available)
                        let day = null;
                        // Try to find the suggestion's index in the suggestions array
                        let suggestionIndex = suggestion.getAttribute('data-index');
                        if (suggestionIndex && !isNaN(suggestionIndex)) {
                            suggestionIndex = parseInt(suggestionIndex);
                            if (suggestions[suggestionIndex] && suggestions[suggestionIndex].mic && suggestions[suggestionIndex].mic.day) {
                                day = suggestions[suggestionIndex].mic.day;
                            }
                        }
                        // Fallback: use current filter day
                        if (!day && window.MicFinderState) {
                            const filters = window.MicFinderState.getActiveFilters();
                            day = Array.isArray(filters.day) ? filters.day[0] : filters.day;
                        }
                        suggestion.querySelectorAll('.pill.bg-gray-700').forEach(pill => {
                            pill.addEventListener('click', (e) => {
                                e.stopPropagation();
                                const time = pill.textContent.trim();
                                console.log('[Time Pill Click] Venue:', venue, 'Day:', day, 'Time:', time);
                                if (!venue || !day || !time) {
                                    console.warn('[Time Pill Click] Missing venue, day, or time.');
                                    return;
                                }
                                const allMics = window.MicFinderState.getAllMics();
                                // Find mic by venue, day, and time (case-insensitive, trimmed)
                                const mic = allMics.find(m =>
                                    m.venue && m.venue.trim().toLowerCase() === venue.trim().toLowerCase() &&
                                    m.day && m.day.trim().toLowerCase() === day.trim().toLowerCase() &&
                                    m.time && m.time.trim().toLowerCase() === time.toLowerCase()
                                );
                                console.log('[Time Pill Click] Found mic:', mic);
                                if (mic) {
                                    if (window.MicFinderUI && window.MicFinderUI.showMicDetails) {
                                        console.log('[Time Pill Click] Calling showMicDetails for mic.id:', mic.id);
                                        window.MicFinderUI.showMicDetails(mic.id);
                                    }
                                    if (window.MicFinderMap && window.MicFinderMap.showMicOnMap) {
                                        console.log('[Time Pill Click] Calling showMicOnMap for mic:', mic);
                                        window.MicFinderMap.showMicOnMap(mic);
                                    }
                                    // Optionally, close the dropdown
                                    hideDropdown();
                                } else {
                                    console.warn('[Time Pill Click] No matching mic found for venue, day, time.');
                                }
                            });
                        });
                    });
                    // Click handler for history
                    console.log('[ATTACH] Attaching history click listeners...');
                    dropdown.querySelectorAll('.autocomplete-suggestion.history').forEach(suggestion => {
                        suggestion.addEventListener('mousedown', (e) => {
                            e.preventDefault(); // Prevent input blur before handler
                            // Prevent remove button from triggering this
                            if (e.target.classList.contains('autocomplete-history-remove')) return;
                            const term = suggestion.getAttribute('data-history-term');
                            
                            // Set the search input value
                            isExactVenueSelection = true;
                            searchInput.value = term;
                            
                            // Hide dropdown
                            hideDropdown();
                            
                            // Apply the search
                            applySearch();
                            
                            // --- Zoom to venue on map if it's a venue name ---
                            if (window.MicFinderState && window.MicFinderMap) {
                                const allMics = window.MicFinderState.getAllMics();
                                // Try to find the first mic for this venue name
                                const mic = allMics.find(m => m.venue && m.venue.toLowerCase() === term.toLowerCase());
                                // Simulate applying the search filter
                                const currentFilters = window.MicFinderState.getActiveFilters();
                                const testFilters = { ...currentFilters, search: term, exactVenue: term };
                                const filteredMics = window.MicFinderFilters.applyAllFilters(testFilters);
                                if (!mic || filteredMics.length === 0) {
                                    // Revert search input value to previous if popup is shown
                                    if (searchInput) searchInput.value = currentFilters.search || '';
                                    showNoMicsTodayPopup(term);
                                    return;
                                }
                                // If there are results, proceed as normal
                                if (mic && typeof mic.lat === 'number' && typeof mic.lon === 'number') {
                                    if (window.MicFinderState.getCurrentMobileView && window.MicFinderState.getCurrentMobileView() !== 'map') {
                                        if (window.MicFinderMobile && window.MicFinderMobile.switchMobileView) {
                                            window.MicFinderMobile.switchMobileView('map');
                                        }
                                    }
                                    setTimeout(() => {
                                        if (window.MicFinderMap.showMicOnMap) {
                                            window.MicFinderMap.showMicOnMap(mic);
                                            if (window.MicFinderMap.scrollToListItem) {
                                                window.MicFinderMap.scrollToListItem(mic.id);
                                            }
                                        } else if (window.map && window.map.setView) {
                                            window.map.setView([mic.lat, mic.lon], 14, { animate: true });
                                        }
                                    }, 0);
                                }
                            }
                            
                            // Reset the flag after all logic is complete
                            setTimeout(() => {
                                isExactVenueSelection = false;
                            }, 100);
                        });
                    });
                    // Remove individual history item
                    dropdown.querySelectorAll('.autocomplete-history-remove').forEach((btn, idx) => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            let history = getSearchHistory();
                            history.splice(idx, 1);
                            saveSearchHistory(history);
                            // Re-render with current suggestions and updated history
                            const query = searchInput.value.trim();
                            const suggestions = query.length >= 2 ? generateSuggestions(query) : [];
                            renderSuggestions(suggestions, false, history);
                        });
                    });
                    // Clear all history
                    const clearBtn = dropdown.querySelector('.autocomplete-clear-history-btn');
                    if (clearBtn) {
                        clearBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            saveSearchHistory([]);
                            const query = searchInput.value.trim();
                            const suggestions = query.length >= 2 ? generateSuggestions(query) : [];
                            renderSuggestions(suggestions, false, []);
                        });
                    }
                }

                // --- Loading feedback for autocomplete ---
                let autocompleteLoadingTimeout = null;
                function showAutocompleteSpinner() {
                    const dropdown = document.getElementById('autocomplete-dropdown');
                    if (dropdown) {
                        dropdown.innerHTML = `<div class='autocomplete-loading-spinner'><div class='autocomplete-spinner'></div></div>`;
                        dropdown.classList.remove('hidden');
                    }
                }
                function hideAutocompleteSpinner() {
                    // No-op: spinner will be replaced by suggestions
                }

                // Show mixed suggestions as you type or on focus (with loading feedback)
                function showMixedSuggestions() {
                    const query = searchInput.value.trim();
                    if (query.length >= 2) {
                        // Show spinner if search takes >200ms
                        clearTimeout(autocompleteLoadingTimeout);
                        autocompleteLoadingTimeout = setTimeout(() => {
                            showAutocompleteSpinner();
                        }, 200);
                        Promise.resolve().then(() => {
                            const suggestions = generateSuggestions(query);
                            const history = getSearchHistory();
                            clearTimeout(autocompleteLoadingTimeout);
                            renderSuggestions(suggestions, false, history);
                        });
                    } else {
                        clearTimeout(autocompleteLoadingTimeout);
                        const history = getSearchHistory();
                        renderSuggestions([], false, history);
                    }
                }
                searchInput.addEventListener('focus', showMixedSuggestions);
                searchInput.addEventListener('input', (e) => {
                    setExactVenueFlag(false);
                    clearTimeout(searchInput.searchTimeout); // Always clear the debounce timer first

                    const value = searchInput.value;
                    if (value.length < 2) {
                        // Clear search and exactVenue filters immediately when text is too short
                        if (window.MicFinderState && window.MicFinderApp) {
                            const { setActiveFilters, getActiveFilters } = window.MicFinderState;
                            const filters = getActiveFilters();
                            const newFilters = { ...filters, search: '', exactVenue: '' };
                            setActiveFilters(newFilters);
                            if (window.MicFinderFilters && window.MicFinderFilters.saveFilterState) {
                                window.MicFinderFilters.saveFilterState(newFilters);
                            }
                            window.MicFinderApp.render();
                            renderActivePills();
                        }
                        return;
                    }

                    showMixedSuggestions();
                    // Debounce the search application to allow continued typing
                    searchInput.searchTimeout = setTimeout(() => {
                        applySearch();
                    }, 300); // Wait 300ms after user stops typing
                });
                
                // Add to history on every search
                function applySearch() {
                    console.log('[APPLY SEARCH] applySearch called with value:', searchInput.value);
                    if (window.MicFinderState && window.MicFinderApp) {
                        const currentFilters = window.MicFinderState.getActiveFilters();
                        const searchValue = searchInput.value.trim();
                        
                        // Only add to history if search has meaningful content
                        if (searchValue.length >= 2) {
                            addSearchToHistory(searchValue);
                        }

                        // Only apply search if at least 2 characters
                        if (searchValue.length < 2) {
                            // Clear search and exactVenue filters if search is too short
                            const newFilters = { ...currentFilters, search: '', exactVenue: '' };
                            window.MicFinderState.setActiveFilters(newFilters);
                            window.MicFinderFilters.saveFilterState(newFilters);
                            window.MicFinderApp.render();
                            renderActivePills();
                            return;
                        }

                        // Merge search/exactVenue into existing filters instead of replacing
                        const newFilters = { ...currentFilters, search: searchValue };
                        if (typeof currentFilters.mapFilterEnabled !== 'undefined') {
                            newFilters.mapFilterEnabled = currentFilters.mapFilterEnabled;
                        } else {
                            newFilters.mapFilterEnabled = false;
                        }
                        // Set exactVenue property
                        if (getExactVenueFlag()) {
                            newFilters.exactVenue = searchValue;
                        } else {
                            newFilters.exactVenue = '';
                        }
                        window.MicFinderState.setActiveFilters(newFilters);
                        window.MicFinderFilters.saveFilterState(newFilters);
                        window.MicFinderApp.render();
                        renderActivePills();
                        
                        // --- Navigate to venue on map if it's an exact venue match ---
                        if (window.MicFinderState && window.MicFinderMap) {
                            const allMics = window.MicFinderState.getAllMics();
                            // Try to find the first mic for this venue name (check both exact flag and direct match)
                            const mic = allMics.find(m => m.venue && m.venue.toLowerCase() === searchValue.toLowerCase());
                            if (mic && typeof mic.lat === 'number' && typeof mic.lon === 'number' && 
                                (getExactVenueFlag() || mic.venue.toLowerCase() === searchValue.toLowerCase())) {
                                if (window.MicFinderState.getCurrentMobileView && window.MicFinderState.getCurrentMobileView() !== 'map') {
                                    if (window.MicFinderMobile && window.MicFinderMobile.switchMobileView) {
                                        window.MicFinderMobile.switchMobileView('map');
                                    }
                                }
                                setTimeout(() => {
                                    if (window.MicFinderMap.showMicOnMap) {
                                        window.MicFinderMap.showMicOnMap(mic);
                                        if (window.MicFinderMap.scrollToListItem) {
                                            window.MicFinderMap.scrollToListItem(mic.id);
                                        }
                                    } else if (window.map && window.map.setView) {
                                        window.map.setView([mic.lat, mic.lon], 14, { animate: true });
                                    }
                                }, 0);
                            }
                        }
                    }
                    // Note: isExactVenueSelection flag is now handled by the calling code
                }
                
                // Select a suggestion
                function selectSuggestion(suggestionElement) {
                    const type = suggestionElement.dataset.type;
                    const venue = suggestionElement.dataset.venue;
                    const address = suggestionElement.dataset.address;
                    const historyTerm = suggestionElement.getAttribute('data-history-term');

                    // Set the search input value
                    if (type === 'venue') {
                        setExactVenueFlag(true);
                        searchInput.value = venue || address || '';
                    } else if (type === 'address') {
                        setExactVenueFlag(false);
                        searchInput.value = address || venue || '';
                    } else if (type === 'history') {
                        setExactVenueFlag(true);
                        searchInput.value = historyTerm || '';
                    } else {
                        setExactVenueFlag(false);
                    }

                    // Debug log
                    console.log('[SELECT SUGGESTION] searchInput.value before applySearch:', searchInput.value);
                    console.log('[SELECT SUGGESTION] isExactVenueSelection:', isExactVenueSelection);

                    // Hide dropdown
                    hideDropdown();

                    // Apply the search
                    applySearch();

                    // --- Zoom to venue on map if type is 'venue' or 'history' ---
                    if ((type === 'venue' || type === 'history') && window.MicFinderState && window.MicFinderMap) {
                        const allMics = window.MicFinderState.getAllMics();
                        // Try to find the first mic for this venue name
                        const searchTerm = type === 'venue' ? (venue || '') : (historyTerm || '');
                        const mic = allMics.find(m => m.venue && m.venue.toLowerCase() === searchTerm.toLowerCase());
                        // Simulate applying the search filter
                        const currentFilters = window.MicFinderState.getActiveFilters();
                        const testFilters = { ...currentFilters, search: searchTerm, exactVenue: searchTerm };
                        const filteredMics = window.MicFinderFilters.applyAllFilters(testFilters);
                        if (!mic || filteredMics.length === 0) {
                            // Revert search input value to previous if popup is shown
                            if (searchInput) searchInput.value = currentFilters.search || '';
                            showNoMicsTodayPopup(searchTerm);
                            return;
                        }
                        if (mic && typeof mic.lat === 'number' && typeof mic.lon === 'number') {
                            if (window.MicFinderState.getCurrentMobileView && window.MicFinderState.getCurrentMobileView() !== 'map') {
                                if (window.MicFinderMobile && window.MicFinderMobile.switchMobileView) {
                                    window.MicFinderMobile.switchMobileView('map');
                                }
                            }
                            setTimeout(() => {
                                if (window.MicFinderMap.showMicOnMap) {
                                    window.MicFinderMap.showMicOnMap(mic);
                                    if (window.MicFinderMap.scrollToListItem) {
                                        window.MicFinderMap.scrollToListItem(mic.id);
                                    }
                                } else if (window.map && window.map.setView) {
                                    window.map.setView([mic.lat, mic.lon], 14, { animate: true });
                                }
                            }, 0);
                        }
                    }
                    
                    // Reset the flag after all logic is complete
                    setTimeout(() => {
                        isExactVenueSelection = false;
                    }, 100);
                }
                
                // Hide dropdown
                function hideDropdown() {
                    const dropdown = document.getElementById('autocomplete-dropdown');
                    if (dropdown) {
                        dropdown.classList.add('hidden');
                    }
                    isDropdownVisible = false;
                    console.log('Dropdown hidden');
                    selectedIndex = -1;
                }
                
                // Handle keyboard navigation
                function handleKeydown(e) {
                    if (!isDropdownVisible) return;
                    
                    const suggestions = document.querySelectorAll('.autocomplete-suggestion');
                    
                    switch (e.key) {
                        case 'ArrowDown':
                            e.preventDefault();
                            selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
                            updateSelection();
                            break;
                        case 'ArrowUp':
                            e.preventDefault();
                            selectedIndex = Math.max(selectedIndex - 1, -1);
                            updateSelection();
                            break;
                        case 'Enter':
                            e.preventDefault();
                            console.log('[ENTER KEY] selectedIndex:', selectedIndex, suggestions[selectedIndex]);
                            if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                                console.log('[ENTER KEY] suggestion type:', suggestions[selectedIndex].dataset.type);
                                selectSuggestion(suggestions[selectedIndex]);
                            } else {
                                applySearch();
                                hideDropdown();
                            }
                            break;
                        case 'Escape':
                            e.preventDefault();
                            hideDropdown();
                            break;
                    }
                }
                
                // Update visual selection
                function updateSelection() {
                    const suggestions = document.querySelectorAll('.autocomplete-suggestion');
                    suggestions.forEach((suggestion, index) => {
                        suggestion.classList.toggle('selected', index === selectedIndex);
                    });
                    
                    // Scroll selected item into view
                    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                        suggestions[selectedIndex].scrollIntoView({ block: 'nearest' });
                    }
                }
                
                // Keyboard navigation
                searchInput.addEventListener('keydown', handleKeydown);
                
                // Hide dropdown when clicking outside
                document.addEventListener('click', (e) => {
                    if (e.target && typeof e.target.closest === 'function' && !e.target.closest('#map-search-bar')) {
                        hideDropdown();
                    }
                });
                
                // Focus handling
                searchInput.addEventListener('focus', () => {
                    const query = searchInput.value.trim();
                    if (query.length >= 2) {
                        const suggestions = generateSuggestions(query);
                        renderSuggestions(suggestions);
                    }
                });
                
                searchInput.addEventListener('blur', () => {
                    // Small delay to allow for suggestion clicks
                    setTimeout(() => {
                        if (!document.activeElement.closest('#autocomplete-dropdown')) {
                            hideDropdown();
                        }
                    }, 150);
                });
            }

            // CREATE CHECKBOXES ONCE HERE:
            createCheckboxes('location-filters', locationOptions);
            createCheckboxes('details-filters', detailOptions);
            document.getElementById('favorites-filter').innerHTML = `<label class="flex items-center cursor-pointer"><input type="checkbox" value="Show Favorites Only" class="custom-checkbox"><span class="ml-2 text-gray-200">Show Favorites Only</span></label>`;

            // Add mutual exclusivity logic to details checkboxes
            const detailsCheckboxes = document.querySelectorAll('#details-filters input[type="checkbox"]');
            detailsCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const value = this.value;
                    
                    if (this.checked) {
                        // Apply mutual exclusivity rules when checking a box
                        if (value === 'Free') {
                            // Uncheck Paid
                            const paidCheckbox = document.querySelector('#details-filters input[value="Paid"]');
                            if (paidCheckbox) paidCheckbox.checked = false;
                        } else if (value === 'Paid') {
                            // Uncheck Free
                            const freeCheckbox = document.querySelector('#details-filters input[value="Free"]');
                            if (freeCheckbox) freeCheckbox.checked = false;
                        } else if (value === 'In-person Sign-up') {
                            // Uncheck Online Sign-up
                            const onlineCheckbox = document.querySelector('#details-filters input[value="Online Sign-up"]');
                            if (onlineCheckbox) onlineCheckbox.checked = false;
                        } else if (value === 'Online Sign-up') {
                            // Uncheck In-person Sign-up
                            const inPersonCheckbox = document.querySelector('#details-filters input[value="In-person Sign-up"]');
                            if (inPersonCheckbox) inPersonCheckbox.checked = false;
                        }
                    }
                });
            });

            // Initial render of pills
            renderActivePills();

            // Clear the search filter and input field on page load
            if (window.MicFinderState && window.MicFinderFilters && window.MicFinderApp) {
                const filters = window.MicFinderState.getActiveFilters();
                let changed = false;
                if (filters.search) {
                    filters.search = '';
                    changed = true;
                }
                if (filters.exactVenue) {
                    filters.exactVenue = '';
                    changed = true;
                }
                if (changed) {
                    window.MicFinderState.setActiveFilters(filters);
                    window.MicFinderFilters.saveFilterState(filters);
                    window.MicFinderApp.render();
                }
                // Also clear the search input field
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = '';
                // Also clear the global exactVenue flag
                setExactVenueFlag(false);
            }
        });

        // Search button click handler
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('search-input');
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                // Clear any pending debounced search
                clearTimeout(searchInput.searchTimeout);
                // Apply search immediately
                applySearch();
                hideDropdown();
            });
        }
        
        // Enter key handler for immediate search (when dropdown is not visible)
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !isDropdownVisible) {
                    e.preventDefault();
                    // Clear any pending debounced search
                    clearTimeout(searchInput.searchTimeout);
                    // Apply search immediately
                    applySearch();
                }
            });
        }

        // Mobile sidebar close button functionality
        const mobileListClose = document.getElementById('mobile-list-close');
        if (mobileListClose) {
            mobileListClose.addEventListener('click', function() {
                closeMobileSidebar();
            });
        }
        
        // Function to close mobile sidebar
        function closeMobileSidebar() {
            const rightSidebar = document.getElementById('right-sidebar');
            if (rightSidebar) {
                rightSidebar.classList.remove('mobile-open');
                rightSidebar.style.transform = 'translateX(100%)';
                // Hide after animation completes
                setTimeout(() => {
                    rightSidebar.style.display = 'none';
                }, 300);
            }
        }
        
        // Close sidebar when clicking outside (only on mobile)
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 1023) {
                const rightSidebar = document.getElementById('right-sidebar');
                const listBtn = document.getElementById('list-view-btn-mobile');
                
                if (rightSidebar && rightSidebar.classList.contains('mobile-open')) {
                    // Don't close if clicking on the sidebar itself or the list button
                    if (!rightSidebar.contains(e.target) && !listBtn.contains(e.target)) {
                        closeMobileSidebar();
                    }
                }
            }
        });

        // Add this function after searchInput is defined
        function clearSearchIfEmpty() {
            if (searchInput.value.trim().length < 2) {
                if (window.MicFinderState && window.MicFinderApp) {
                    const { setActiveFilters, getActiveFilters } = window.MicFinderState;
                    const filters = getActiveFilters();
                    const newFilters = { ...filters, search: '', exactVenue: '' };
                    setActiveFilters(newFilters);
                    if (window.MicFinderFilters && window.MicFinderFilters.saveFilterState) {
                        window.MicFinderFilters.saveFilterState(newFilters);
                    }
                    window.MicFinderApp.render();
                    renderActivePills();
                }
            }
        }
        if (searchInput) {
            searchInput.addEventListener('input', clearSearchIfEmpty);
            searchInput.addEventListener('blur', clearSearchIfEmpty);
        }
        const clearSearchBtn = document.getElementById('clear-search-btn');
        if (searchInput && clearSearchBtn) {
            // Show/hide the button based on input
            searchInput.addEventListener('input', () => {
                if (searchInput.value.trim().length > 0) {
                    clearSearchBtn.classList.remove('hidden');
                } else {
                    clearSearchBtn.classList.add('hidden');
                }
            });

            // On click, clear input and trigger clear logic
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                clearSearchBtn.classList.add('hidden');
                if (typeof clearSearchIfEmpty === 'function') {
                    clearSearchIfEmpty();
                }
                searchInput.focus();
            });
        }
        
        // Service Worker Registration for PWA functionality
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('[PWA] Service Worker registered successfully:', registration.scope);
                        
                        // Handle updates
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            if (newWorker) {
                                newWorker.addEventListener('statechange', () => {
                                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                        // New content is available, notify user
                                        showUpdateNotification();
                                    }
                                });
                            }
                        });
                    })
                    .catch(error => {
                        console.warn('[PWA] Service Worker registration failed:', error);
                    });
                    
                // Listen for messages from service worker
                navigator.serviceWorker.addEventListener('message', event => {
                    if (event.data && event.data.type === 'SYNC_FAVORITES') {
                        // Handle offline favorite sync
                        console.log('[PWA] Favorites synced from offline');
                    }
                });
            });
        }
        
        // PWA Install prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('[PWA] Install prompt triggered');
            e.preventDefault();
            deferredPrompt = e;
            showInstallBanner();
        });
        
        function showInstallBanner() {
            // Create a subtle install banner
            const banner = document.createElement('div');
            banner.id = 'pwa-install-banner';
            banner.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                background: #3b82f6;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: space-between;
                transform: translateY(100%);
                transition: transform 0.3s ease;
                font-size: 14px;
            `;
            
            banner.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-mobile-alt"></i>
                    <span>Install Mic Finder as an app for better experience</span>
                </div>
                <div>
                    <button onclick="installPWA()" style="background: white; color: #3b82f6; border: none; padding: 6px 12px; border-radius: 4px; margin-right: 8px; cursor: pointer; font-weight: 600;">Install</button>
                    <button onclick="dismissInstallBanner()" style="background: transparent; color: white; border: 1px solid white; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Later</button>
                </div>
            `;
            
            document.body.appendChild(banner);
            setTimeout(() => banner.style.transform = 'translateY(0)', 100);
        }
        
        function installPWA() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    console.log('[PWA] Install choice:', choiceResult.outcome);
                    deferredPrompt = null;
                    dismissInstallBanner();
                });
            }
        }
        
        function dismissInstallBanner() {
            const banner = document.getElementById('pwa-install-banner');
            if (banner) {
                banner.style.transform = 'translateY(100%)';
                setTimeout(() => banner.remove(), 300);
            }
        }
        
        function showUpdateNotification() {
            // Create update notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                font-size: 14px;
                max-width: 300px;
            `;
            
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-download"></i>
                    <span>New version available!</span>
                </div>
                <button onclick="refreshApp()" style="background: white; color: #10b981; border: none; padding: 4px 8px; border-radius: 4px; margin-top: 2px; cursor: pointer; font-weight: 600;">Refresh</button>
            `;
            
            document.body.appendChild(notification);
            setTimeout(() => notification.style.transform = 'translateX(0)', 100);
        }
        
        function refreshApp() {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
            }
        }

        // Day selection popup functionality
        function openDaySelectionPopup(currentDay) {
            console.log('🗓️ [POPUP] Opening day selection popup. Current day:', currentDay);
            
            const popup = document.getElementById('day-selection-popup');
            if (!popup) {
                console.error('🗓️ [POPUP] Day selection popup not found');
                return;
            }
            
            // Mark current day as selected
            const dayOptions = popup.querySelectorAll('.day-option');
            dayOptions.forEach(option => {
                option.classList.remove('bg-blue-600');
                if (option.dataset.value === currentDay) {
                    option.classList.add('bg-blue-600');
                }
            });
            
            // Show popup
            popup.classList.remove('hidden');
            
            // Set up click handlers for day options
            dayOptions.forEach(option => {
                option.onclick = function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    const selectedValue = this.dataset.value;
                    const selectedText = this.textContent.trim();
                    
                    console.log('🗓️ [POPUP] Day selected:', selectedValue, selectedText);
                    
                    // Update global filters
                    if (window.MicFinderState && window.MicFinderFilters && window.MicFinderApp) {
                        const filters = window.MicFinderState.getActiveFilters();
                        filters.day = selectedValue || null;
                        window.MicFinderState.setActiveFilters(filters);
                        window.MicFinderFilters.saveFilterState(filters);
                        window.MicFinderApp.render();
                        
                        // Re-render pills to reflect changes
                        if (typeof renderActivePills === 'function') {
                            renderActivePills();
                        }
                    }
                    
                    // Close day popup
                    closeDaySelectionPopup();
                    

                };
            });
        }
        
        function closeDaySelectionPopup() {
            console.log('🗓️ [POPUP] Closing day selection popup');
            const popup = document.getElementById('day-selection-popup');
            if (popup) {
                popup.classList.add('hidden');
            }
        }


        
        // Borough selection popup functionality
        function openBoroughSelectionPopup(currentBorough) {
            console.log('🏢 [POPUP] Opening borough selection popup. Current borough:', currentBorough);
            
            const popup = document.getElementById('borough-selection-popup');
            if (!popup) {
                console.error('🏢 [POPUP] Borough selection popup not found');
                return;
            }
            
            // Mark current boroughs as selected (support multiple selections)
            const boroughOptions = popup.querySelectorAll('.borough-option');
            const currentFilters = window.MicFinderState ? window.MicFinderState.getActiveFilters() : {};
            const selectedBoroughs = currentFilters.borough || [];
            
            boroughOptions.forEach(option => {
                option.classList.remove('bg-blue-600');
                if (Array.isArray(selectedBoroughs) && selectedBoroughs.includes(option.dataset.value)) {
                    option.classList.add('bg-blue-600');
                } else if (option.dataset.value === currentBorough) {
                    option.classList.add('bg-blue-600');
                }
            });
            
            // Show popup
            popup.classList.remove('hidden');
            
            // Set up click handlers for borough options
            boroughOptions.forEach(option => {
                option.onclick = function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    const selectedValue = this.dataset.value;
                    const selectedText = this.textContent.trim();
                    
                    console.log('🏢 [POPUP] Borough selected:', selectedValue, selectedText);
                    
                    // Update global filters
                    if (window.MicFinderState && window.MicFinderFilters && window.MicFinderApp) {
                        const filters = window.MicFinderState.getActiveFilters();
                        
                        if (selectedValue === '') {
                            // "Any Borough" selected - clear all borough filters
                            filters.borough = [];
                        } else {
                            // Toggle borough selection (multi-select)
                            if (!Array.isArray(filters.borough)) {
                                filters.borough = [];
                            }
                            
                            if (filters.borough.includes(selectedValue)) {
                                // Remove if already selected
                                filters.borough = filters.borough.filter(b => b !== selectedValue);
                            } else {
                                // Add to selection
                                filters.borough.push(selectedValue);
                            }
                        }
                        
                        window.MicFinderState.setActiveFilters(filters);
                        window.MicFinderFilters.saveFilterState(filters);
                        window.MicFinderApp.render();
                        
                        // Re-render pills to reflect changes
                        if (typeof renderActivePills === 'function') {
                            renderActivePills();
                        }
                    }
                    
                    // Close popup
                    closeBoroughSelectionPopup();
                };
            });
        }
        
        function closeBoroughSelectionPopup() {
            console.log('🏢 [POPUP] Closing borough selection popup');
            const popup = document.getElementById('borough-selection-popup');
            if (popup) {
                popup.classList.add('hidden');
            }
        }

        // Details selection popup functionality
        function openDetailsSelectionPopup(currentDetail) {
            console.log('📝 [POPUP] Opening details selection popup. Current detail:', currentDetail);
            
            const popup = document.getElementById('details-selection-popup');
            if (!popup) {
                console.error('📝 [POPUP] Details selection popup not found');
                return;
            }
            
            // Mark current details as selected (support multiple selections with exclusivity rules)
            const detailOptions = popup.querySelectorAll('.detail-option');
            const currentFilters = window.MicFinderState ? window.MicFinderState.getActiveFilters() : {};
            const selectedCost = currentFilters.cost || [];
            const selectedSignup = currentFilters.signup || [];
            
            detailOptions.forEach(option => {
                option.classList.remove('bg-blue-600');
                const value = option.dataset.value;
                
                // Check if this option should be highlighted as selected
                if (Array.isArray(selectedCost) && selectedCost.includes(value)) {
                    option.classList.add('bg-blue-600');
                } else if (Array.isArray(selectedSignup) && selectedSignup.includes(value)) {
                    option.classList.add('bg-blue-600');
                } else if (value === currentDetail) {
                    option.classList.add('bg-blue-600');
                }
            });
            
            // Show popup
            popup.classList.remove('hidden');
            
            // Set up click handlers for detail options
            detailOptions.forEach(option => {
                option.onclick = function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    const selectedValue = this.dataset.value;
                    const selectedText = this.textContent.trim();
                    
                    console.log('📝 [POPUP] Detail selected:', selectedValue, selectedText);
                    
                    // Update global filters with mutual exclusivity logic
                    if (window.MicFinderState && window.MicFinderFilters && window.MicFinderApp) {
                        const filters = window.MicFinderState.getActiveFilters();
                        
                        if (selectedValue === '') {
                            // "Any Details" selected - clear all detail filters
                            filters.cost = [];
                            filters.signup = [];
                        } else {
                            // Initialize arrays if needed
                            if (!Array.isArray(filters.cost)) filters.cost = [];
                            if (!Array.isArray(filters.signup)) filters.signup = [];
                            
                            // Handle mutual exclusivity and toggle logic
                            if (selectedValue === 'Free' || selectedValue === 'Paid') {
                                // Cost options: Free vs Paid (mutually exclusive)
                                if (selectedValue === 'Free') {
                                    if (filters.cost.includes('Free')) {
                                        // Remove Free if already selected
                                        filters.cost = filters.cost.filter(c => c !== 'Free');
                                    } else {
                                        // Add Free and remove Paid
                                        filters.cost = filters.cost.filter(c => c !== 'Paid');
                                        filters.cost.push('Free');
                                    }
                                } else { // Paid
                                    if (filters.cost.includes('Paid')) {
                                        // Remove Paid if already selected
                                        filters.cost = filters.cost.filter(c => c !== 'Paid');
                                    } else {
                                        // Add Paid and remove Free
                                        filters.cost = filters.cost.filter(c => c !== 'Free');
                                        filters.cost.push('Paid');
                                    }
                                }
                            } else if (selectedValue === 'In-person Sign-up' || selectedValue === 'Online Sign-up') {
                                // Signup options: In-person vs Online (mutually exclusive)
                                if (selectedValue === 'In-person Sign-up') {
                                    if (filters.signup.includes('In-person Sign-up')) {
                                        // Remove In-person if already selected
                                        filters.signup = filters.signup.filter(s => s !== 'In-person Sign-up');
                                    } else {
                                        // Add In-person and remove Online
                                        filters.signup = filters.signup.filter(s => s !== 'Online Sign-up');
                                        filters.signup.push('In-person Sign-up');
                                    }
                                } else { // Online Sign-up
                                    if (filters.signup.includes('Online Sign-up')) {
                                        // Remove Online if already selected
                                        filters.signup = filters.signup.filter(s => s !== 'Online Sign-up');
                                    } else {
                                        // Add Online and remove In-person
                                        filters.signup = filters.signup.filter(s => s !== 'In-person Sign-up');
                                        filters.signup.push('Online Sign-up');
                                    }
                                }
                            } else if (selectedValue === '1 Item Min') {
                                // 1 Item Min can be toggled independently
                                if (filters.cost.includes('1 Item Min')) {
                                    filters.cost = filters.cost.filter(c => c !== '1 Item Min');
                                } else {
                                    filters.cost.push('1 Item Min');
                                }
                            }
                        }
                        
                        window.MicFinderState.setActiveFilters(filters);
                        window.MicFinderFilters.saveFilterState(filters);
                        window.MicFinderApp.render();
                        
                        // Re-render pills to reflect changes
                        if (typeof renderActivePills === 'function') {
                            renderActivePills();
                        }
                    }
                    
                    // Close popup
                    closeDetailsSelectionPopup();
                };
            });
        }
        
        function closeDetailsSelectionPopup() {
            console.log('📝 [POPUP] Closing details selection popup');
            const popup = document.getElementById('details-selection-popup');
            if (popup) {
                popup.classList.add('hidden');
            }
        }

        // Make functions globally available
        window.openDaySelectionPopup = openDaySelectionPopup;
        window.closeDaySelectionPopup = closeDaySelectionPopup;
        window.openBoroughSelectionPopup = openBoroughSelectionPopup;
        window.closeBoroughSelectionPopup = closeBoroughSelectionPopup;
        window.openDetailsSelectionPopup = openDetailsSelectionPopup;
        window.closeDetailsSelectionPopup = closeDetailsSelectionPopup;
        
        // Set up popup event listeners
        document.addEventListener('DOMContentLoaded', function() {
            // Day popup listeners
            const dayPopup = document.getElementById('day-selection-popup');
            const dayCloseBtn = document.getElementById('close-day-popup');
            
            // Day close button
            if (dayCloseBtn) {
                dayCloseBtn.addEventListener('click', closeDaySelectionPopup);
            }
            
            // Day close on outside click
            if (dayPopup) {
                dayPopup.addEventListener('click', function(e) {
                    if (e.target === dayPopup) {
                        closeDaySelectionPopup();
                    }
                });
            }

            // Borough popup listeners
            const boroughPopup = document.getElementById('borough-selection-popup');
            const boroughCloseBtn = document.getElementById('close-borough-popup');
            
            // Borough close button
            if (boroughCloseBtn) {
                boroughCloseBtn.addEventListener('click', closeBoroughSelectionPopup);
            }
            
            // Borough close on outside click
            if (boroughPopup) {
                boroughPopup.addEventListener('click', function(e) {
                    if (e.target === boroughPopup) {
                        closeBoroughSelectionPopup();
                    }
                });
            }

            // Details popup listeners
            const detailsPopup = document.getElementById('details-selection-popup');
            const detailsCloseBtn = document.getElementById('close-details-popup');
            
            // Details close button
            if (detailsCloseBtn) {
                detailsCloseBtn.addEventListener('click', closeDetailsSelectionPopup);
            }
            
            // Details close on outside click
            if (detailsPopup) {
                detailsPopup.addEventListener('click', function(e) {
                    if (e.target === detailsPopup) {
                        closeDetailsSelectionPopup();
                    }
                });
            }
            
            // Close on escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    if (dayPopup && !dayPopup.classList.contains('hidden')) {
                        closeDaySelectionPopup();
                    }
                    if (boroughPopup && !boroughPopup.classList.contains('hidden')) {
                        closeBoroughSelectionPopup();
                    }
                    if (detailsPopup && !detailsPopup.classList.contains('hidden')) {
                        closeDetailsSelectionPopup();
                    }
                }
            });
        });

        // Old dropdown code removed - now using popup
        
        // Essential debug functions for testing
        window.debugDayPopup = function() {
            const dayPills = document.querySelectorAll('.pill[data-type="day"]');
            console.log('🧪 Testing day popup functionality...');
            console.log('Day pills found:', dayPills.length);
            if (dayPills.length > 0) {
                const firstPill = dayPills[0];
                console.log('Clicking first day pill to open popup...');
                firstPill.click();
            } else {
                console.log('No day pills found. Manually testing popup...');
                openDaySelectionPopup('Thursday');
            }
        };
        
        // Check pill container visibility
        window.checkPillContainers = function() {
            const desktop = document.getElementById('active-pills-row');
            const mobile = document.getElementById('active-pills-row-mobile');
            const desktopParent = desktop ? desktop.closest('.hidden.lg\\:flex') : null;
            const mobileParent = mobile ? mobile.closest('.lg\\:hidden') : null;
            
            console.log('🔍 PILL CONTAINER VISIBILITY CHECK');
            console.log('Window width:', window.innerWidth);
            console.log('Desktop container parent:', !!desktopParent);
            console.log('Mobile container parent:', !!mobileParent);
            
            if (desktopParent) {
                const style = getComputedStyle(desktopParent);
                console.log('Desktop parent display:', style.display);
            }
            
            if (mobileParent) {
                const style = getComputedStyle(mobileParent);
                console.log('Mobile parent display:', style.display);
            }
            
            console.log('Desktop pills:', desktop ? desktop.children.length : 0);
            console.log('Mobile pills:', mobile ? mobile.children.length : 0);
        };
        
        // Legacy function name for compatibility
        window.debugDayDropdown = window.debugDayPopup;
        
        // Quick health check function
        window.checkDayPillHealth = function() {
            console.log('🏥 DAY PILL HEALTH CHECK');
            console.log('✅ toggleDayDropdown function:', typeof window.toggleDayDropdown);
            console.log('✅ renderActivePills function:', typeof renderActivePills);
            console.log('✅ MicFinderState:', !!window.MicFinderState);
            console.log('✅ MicFinderApp:', !!window.MicFinderApp);
            
            const dayPills = document.querySelectorAll('.pill[data-type="day"]');
            console.log('✅ Day pills in DOM:', dayPills.length);
            
            const dropdowns = document.querySelectorAll('.pill-dropdown');
            console.log('✅ Dropdowns in DOM:', dropdowns.length);
            
            console.log('🏥 Health check complete!');
        };

        // Final comprehensive test function to verify all fixes
        window.testAllFixes = function() {
            console.log('🧪 FINAL COMPREHENSIVE TEST');
            
            // Test mobile container visibility
            const mobileContainer = document.getElementById('active-pills-row-mobile');
            const mobileParent = mobileContainer ? mobileContainer.closest('.mobile-pills-row') : null;
            
            console.log('📱 Mobile container tests:');
            console.log('  Container exists:', !!mobileContainer);
            console.log('  Parent exists:', !!mobileParent);
            
            if (mobileParent) {
                const parentStyles = getComputedStyle(mobileParent);
                console.log('  Parent display:', parentStyles.display);
                console.log('  Parent visibility:', parentStyles.visibility);
                console.log('  Parent has lg:hidden:', mobileParent.classList.contains('lg:hidden'));
            }
            
            if (mobileContainer) {
                const containerStyles = getComputedStyle(mobileContainer);
                console.log('  Container display:', containerStyles.display);
                console.log('  Container visibility:', containerStyles.visibility);
                const rect = mobileContainer.getBoundingClientRect();
                console.log('  Container dimensions:', `${rect.width}x${rect.height}`);
            }
            
            // Test day pill popup functionality
            const dayPills = document.querySelectorAll('.pill[data-type="day"]');
            const popup = document.getElementById('day-selection-popup');
            console.log('🗓️ Day pill tests:');
            console.log('  Day pills found:', dayPills.length);
            console.log('  Day popup exists:', !!popup);
            
            if (dayPills.length > 0) {
                const firstPill = dayPills[0];
                console.log('  Testing popup click...');
                firstPill.click();
                
                setTimeout(() => {
                    const isPopupVisible = popup && !popup.classList.contains('hidden');
                    console.log('  Popup opened:', isPopupVisible);
                    
                    if (isPopupVisible) {
                        console.log('✅ Day pill popup functionality working!');
                        // Close it
                        closeDaySelectionPopup();
                    } else {
                        console.log('❌ Day pill popup not working');
                    }
                }, 100);
            } else {
                console.log('  No day pills found, testing popup directly...');
                openDaySelectionPopup('Thursday');
                setTimeout(() => {
                    const isPopupVisible = popup && !popup.classList.contains('hidden');
                    console.log('  Direct popup test:', isPopupVisible ? 'Success' : 'Failed');
                    if (isPopupVisible) {
                        closeDaySelectionPopup();
                    }
                }, 100);
            }
            
            console.log('🧪 Final test complete!');
        };
        
        // Legacy test function for backward compatibility
        window.testDayPillOptimizations = function() {
            console.log('🧪 TESTING DAY PILL OPTIMIZATIONS');
            
            // Test throttling
            console.log('⏱️ Testing renderActivePills throttling...');
            const startTime = performance.now();
            for (let i = 0; i < 10; i++) {
                renderActivePills();
            }
            const endTime = performance.now();
            console.log(`✅ Called renderActivePills 10 times in ${(endTime - startTime).toFixed(2)}ms`);
            
            // Test day pill functionality
            const dayPills = document.querySelectorAll('.pill[data-type="day"]');
            console.log(`✅ Found ${dayPills.length} day pills`);
            
            if (dayPills.length > 0) {
                console.log('🖱️ Testing day pill click...');
                const firstPill = dayPills[0];
                console.log('🖱️ First pill element:', firstPill);
                console.log('🖱️ First pill has dropdown:', !!firstPill.querySelector('.pill-dropdown'));
                console.log('🖱️ First pill data-type:', firstPill.getAttribute('data-type'));
                
                firstPill.click();
                
                setTimeout(() => {
                    const visibleDropdown = document.querySelector('.pill-dropdown.visible');
                    const allDropdowns = document.querySelectorAll('.pill-dropdown');
                    console.log('🖱️ All dropdowns found:', allDropdowns.length);
                    console.log('🖱️ Visible dropdowns found:', visibleDropdown ? 1 : 0);
                    
                    if (visibleDropdown) {
                        console.log('✅ Day pill dropdown opened successfully');
                        // Close it
                        firstPill.click();
                        setTimeout(() => {
                            const stillVisible = document.querySelector('.pill-dropdown.visible');
                            if (!stillVisible) {
                                console.log('✅ Day pill dropdown closed successfully');
                            } else {
                                console.log('⚠️ Day pill dropdown did not close');
                            }
                        }, 200);
                    } else {
                        console.log('⚠️ Day pill dropdown did not open');
                        // Debug: check the dropdown state
                        if (allDropdowns.length > 0) {
                            console.log('🖱️ Checking dropdown classes:', allDropdowns[0].className);
                        }
                    }
                }, 200);
            }
            
            // Test mobile container sizing
            const mapContainer = document.getElementById('map');
            if (mapContainer) {
                const rect = mapContainer.getBoundingClientRect();
                console.log(`📱 Map container size: ${rect.width}x${rect.height}`);
                if (rect.width > 0 && rect.height > 0) {
                    console.log('✅ Mobile container sizing fixed');
                } else {
                    console.log('⚠️ Mobile container still has zero dimensions');
                }
            }
            
            console.log('🧪 Optimization tests complete!');
        };
        
        // Test function to verify complete integration
        window.testDayPillFunctionality = function() {
            console.log('🧪 Testing integrated day pill functionality...');
            
            // Test full integration with app render cycle
            if (window.MicFinderState && window.MicFinderApp) {
                console.log('✅ MicFinderState and MicFinderApp available');
                
                const currentFilters = window.MicFinderState.getActiveFilters();
                console.log('📊 Current filters:', currentFilters);
                
                const testFilters = { ...currentFilters, day: 'Wednesday' };
                console.log('🔄 Setting day filter to Wednesday via app render...');
                
                // Use the proper app render cycle
                window.MicFinderState.setActiveFilters(testFilters);
                window.MicFinderFilters.saveFilterState(testFilters);
                window.MicFinderApp.render(); // This should call renderActivePills automatically
                
                setTimeout(() => {
                    const dayPills = document.querySelectorAll('.pill[data-type="day"]');
                    console.log('✅ Day pills created via app render:', dayPills.length);
                    
                    if (dayPills.length > 0) {
                        const pill = dayPills[0];
                        console.log('🔄 Testing dropdown functionality...');
                        
                        // Test dropdown
                        pill.click();
                        
                        setTimeout(() => {
                            const visibleDropdown = document.querySelector('.pill-dropdown.visible');
                            if (visibleDropdown) {
                                console.log('✅ Dropdown visible!');
                                const options = visibleDropdown.querySelectorAll('.dropdown-option');
                                console.log('✅ Options found:', options.length);
                                
                                // Test option selection
                                const fridayOption = Array.from(options).find(opt => opt.textContent.includes('Friday'));
                                if (fridayOption) {
                                    console.log('🔄 Clicking Friday option...');
                                    fridayOption.click();
                                    
                                    setTimeout(() => {
                                        // Check if filter was updated in state
                                        const newFilters = window.MicFinderState.getActiveFilters();
                                        if (newFilters.day === 'Friday') {
                                            console.log('✅ SUCCESS: State updated correctly!');
                                            console.log('✅ SUCCESS: Complete integration working!');
                                        } else {
                                            console.log('❌ FAILED: State not updated. Current day filter:', newFilters.day);
                                        }
                                    }, 200);
                                }
                            } else {
                                console.log('❌ FAILED: Dropdown not visible');
                                window.forceCreateDayPill();
                            }
                        }, 200);
                    } else {
                        console.log('❌ No day pills found via app render, trying manual creation...');
                        window.forceCreateDayPill();
                    }
                }, 1000);
            } else {
                console.log('❌ Required modules not available, testing manual pill...');
                window.forceCreateDayPill();
            }
        };
        
        // Force create a day pill for testing
        window.forceCreateDayPill = function() {
            const pillsContainer = document.getElementById('active-pills-row') || document.getElementById('active-pills-row-mobile');
            if (!pillsContainer) {
                console.log('❌ No pills container found');
                return;
            }
            
            console.log('🔧 Creating manual test day pill...');
            const pill = document.createElement('button');
            pill.className = 'pill active-pill-item bg-gray-900/80 backdrop-blur-sm text-white border-white/10 shadow-md';
            pill.setAttribute('data-type', 'day');
            pill.classList.add('day-filter-pill');
            
            pill.innerHTML = `
                Wednesday 
                <i class="fa-solid fa-chevron-down pill-edit-icon"></i>
                <div class="pill-dropdown">
                    <div class="dropdown-option" data-value="Monday">Monday <i class="fa-solid fa-check dropdown-option-check"></i></div>
                    <div class="dropdown-option" data-value="Tuesday">Tuesday <i class="fa-solid fa-check dropdown-option-check"></i></div>
                    <div class="dropdown-option selected" data-value="Wednesday">Wednesday <i class="fa-solid fa-check dropdown-option-check"></i></div>
                    <div class="dropdown-option" data-value="Thursday">Thursday <i class="fa-solid fa-check dropdown-option-check"></i></div>
                    <div class="dropdown-option" data-value="Friday">Friday <i class="fa-solid fa-check dropdown-option-check"></i></div>
                    <div class="dropdown-option" data-value="Saturday">Saturday <i class="fa-solid fa-check dropdown-option-check"></i></div>
                    <div class="dropdown-option" data-value="Sunday">Sunday <i class="fa-solid fa-check dropdown-option-check"></i></div>
                    <div class="dropdown-option" data-value="">Any Day <i class="fa-solid fa-check dropdown-option-check"></i></div>
                </div>
            `;
            
            pill.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('🗓️ [MANUAL TEST] Day pill clicked!');
                window.toggleDayDropdown(pill);
            });
            
            pillsContainer.appendChild(pill);
            console.log('✅ Manual test day pill created');
            
            // Auto-test it after creation
            setTimeout(() => {
                console.log('🔄 Auto-testing manual pill...');
                pill.click();
            }, 100);
        };

        document.addEventListener('DOMContentLoaded', function() {
            // Pills should now work normally without forced debug state
            
            // Initialize sidebar visibility based on current screen size
            const rightSidebar = document.getElementById('right-sidebar');
            if (rightSidebar) {
                if (window.innerWidth >= 1024) {
                    // Desktop view - ensure sidebar is visible
                    rightSidebar.style.display = 'flex';
                    rightSidebar.classList.remove('mobile-open');
                    // Reset any mobile-specific styles that might have been applied
                    rightSidebar.style.transform = '';
                    rightSidebar.style.position = '';
                    rightSidebar.style.top = '';
                    rightSidebar.style.right = '';
                    rightSidebar.style.bottom = '';
                    rightSidebar.style.width = '';
                    rightSidebar.style.zIndex = '';
                    rightSidebar.style.transition = '';
                } else {
                    // Mobile view - hide sidebar initially
                    rightSidebar.style.display = 'none';
                }
            }
            
            // Debug pill container dimensions and RIGHT-SIDE overflow
            function debugPillContainer() {
                const container = document.getElementById('active-pills-row-mobile');
                if (container) {
                    const containerRect = container.getBoundingClientRect();
                    const viewportWidth = window.innerWidth;
                    
                    console.log('=== PILLS RIGHT-SIDE OVERFLOW DEBUG ===');
                    console.log('[Pills Debug] Viewport width:', viewportWidth + 'px');
                    console.log('[Pills Debug] Container dimensions:', {
                        width: container.offsetWidth,
                        scrollWidth: container.scrollWidth,
                        clientWidth: container.clientWidth,
                        containerRect: {
                            left: containerRect.left,
                            right: containerRect.right,
                            width: containerRect.width
                        }
                    });
                    
                    const pills = container.querySelectorAll('.pill');
                    console.log('[Pills Debug] Pills count:', pills.length);
                    
                    let totalPillWidth = 0;
                    let pillsOverflowingRight = [];
                    let visiblePills = [];
                    
                    pills.forEach((pill, index) => {
                        const pillRect = pill.getBoundingClientRect();
                        const pillWidth = pill.offsetWidth;
                        totalPillWidth += pillWidth;
                        
                        // Check if pill extends beyond RIGHT edge of viewport
                        const isOverflowingRight = pillRect.right > viewportWidth;
                        // Check if pill is visible (at least partially)
                        const isVisible = pillRect.left < viewportWidth && pillRect.right > 0;
                        
                        if (isOverflowingRight) {
                            pillsOverflowingRight.push({
                                index,
                                text: pill.textContent,
                                pillRight: pillRect.right,
                                overflowAmount: pillRect.right - viewportWidth
                            });
                        }
                        
                        if (isVisible) {
                            visiblePills.push({
                                index,
                                text: pill.textContent,
                                left: pillRect.left,
                                right: pillRect.right
                            });
                        }
                        
                        console.log(`[Pills Debug] Pill ${index}: "${pill.textContent}" - Width: ${pillWidth}px, Right edge: ${pillRect.right}px, Overflowing right: ${isOverflowingRight}`);
                    });
                    
                    console.log('[Pills Debug] RIGHT OVERFLOW ANALYSIS:');
                    console.log('- Total pills width:', totalPillWidth + 'px');
                    console.log('- Pills overflowing RIGHT:', pillsOverflowingRight.length);
                    console.log('- Pills currently visible:', visiblePills.length);
                    
                    if (pillsOverflowingRight.length > 0) {
                        console.log('[Pills Debug] PILLS CUT OFF ON RIGHT:', pillsOverflowingRight);
                    }
                    
                    // Scroll analysis
                    const maxScrollLeft = container.scrollWidth - container.clientWidth;
                    const scrollProgress = maxScrollLeft > 0 ? (container.scrollLeft / maxScrollLeft) * 100 : 0;
                    
                    console.log('[Pills Debug] SCROLL STATUS:');
                    console.log('- Current scroll position:', container.scrollLeft + 'px');
                    console.log('- Maximum scroll distance:', maxScrollLeft + 'px');
                    console.log('- Scroll progress:', scrollProgress.toFixed(1) + '%');
                    console.log('- Can scroll more right:', container.scrollLeft < maxScrollLeft);
                    
                    // Container overflow analysis
                    const isOverflowing = container.scrollWidth > container.clientWidth;
                    const leftOverflowAmount = isOverflowing ? container.scrollWidth - container.clientWidth : 0;
                    
                    console.log('[Pills Debug] CONTAINER OVERFLOW:');
                    console.log('- Container overflowing:', isOverflowing ? 'YES' : 'NO');
                    console.log('- Left overflow amount:', leftOverflowAmount + 'px');
                    console.log('- Overflow-x style:', getComputedStyle(container).overflowX);
                    console.log('- Direction style:', getComputedStyle(container).direction);
                    
                    // Visual boundary check
                    console.log('[Pills Debug] BOUNDARY CHECK:');
                    console.log('- Container starts at:', containerRect.left + 'px from left edge');
                    console.log('- Container ends at:', containerRect.right + 'px from left edge');
                    console.log('- Content extends from:', (containerRect.right - container.scrollWidth) + 'px from left edge');
                    
                    return {
                        pillsOverflowingRight,
                        canScrollLeft: container.scrollLeft > 0,
                        totalOverflow: leftOverflowAmount
                    };
                }
            }
            
            // Debug pill styling
            function debugPillStyling() {
                console.log('[Pill Styling Debug] Checking mobile pill styles...');
                const pills = document.querySelectorAll('.pill');
                console.log('[Pill Styling Debug] Found pills:', pills.length);
                
                pills.forEach((pill, index) => {
                    const computedStyles = getComputedStyle(pill);
                    console.log(`[Pill Styling Debug] Pill ${index}:`, {
                        text: pill.textContent,
                        classes: pill.className,
                        background: computedStyles.background,
                        backgroundColor: computedStyles.backgroundColor,
                        backgroundImage: computedStyles.backgroundImage,
                        backdropFilter: computedStyles.backdropFilter,
                        boxShadow: computedStyles.boxShadow,
                        color: computedStyles.color,
                        hasGradient: computedStyles.background.includes('linear-gradient') || computedStyles.backgroundImage.includes('linear-gradient')
                    });
                });
            }
            
            // Force apply styles test for mobile pills
            function forceApplyPillStyles() {
                console.log('[Force Pill Styles] Attempting to force apply gradient styles...');
                const pills = document.querySelectorAll('.pill');
                pills.forEach((pill, index) => {
                    console.log(`[Force Pill Styles] Pill ${index} before:`, {
                        background: getComputedStyle(pill).background,
                        backgroundColor: getComputedStyle(pill).backgroundColor
                    });
                    
                    // Try to force apply the gradient
                    pill.style.setProperty('background', 'linear-gradient(90deg, #444857 0%, #232533 100%)', 'important');
                    pill.style.setProperty('color', '#fff', 'important');
                    pill.style.setProperty('backdrop-filter', 'none', 'important');
                    pill.style.setProperty('box-shadow', 'none', 'important');
                    
                    console.log(`[Force Pill Styles] Pill ${index} after:`, {
                        background: getComputedStyle(pill).background,
                        backgroundColor: getComputedStyle(pill).backgroundColor
                    });
                });
            }
            
            // Debug on load and when pills are updated
            setTimeout(debugPillContainer, 1000);
            setTimeout(() => {
                debugPillStyling();
                forceApplyPillStyles();
                if (window.testPillBarriers) {
                    window.testPillBarriers();
                }
            }, 1500);
            window.addEventListener('resize', debugPillContainer);
            
            // Handle sidebar visibility on window resize
            window.addEventListener('resize', function() {
                const rightSidebar = document.getElementById('right-sidebar');
                if (rightSidebar) {
                    if (window.innerWidth >= 1024) {
                        // Desktop view - ensure sidebar is visible
                        rightSidebar.style.display = 'flex';
                        rightSidebar.classList.remove('mobile-open');
                        // Reset any mobile-specific transforms
                        rightSidebar.style.transform = '';
                        rightSidebar.style.position = '';
                        rightSidebar.style.top = '';
                        rightSidebar.style.right = '';
                        rightSidebar.style.bottom = '';
                        rightSidebar.style.width = '';
                        rightSidebar.style.zIndex = '';
                        rightSidebar.style.transition = '';
                    } else {
                        // Mobile view - hide sidebar unless explicitly opened
                        if (!rightSidebar.classList.contains('mobile-open')) {
                            rightSidebar.style.display = 'none';
                        }
                    }
                }
            });
            
            // Add real-time scroll debugging
            const container = document.getElementById('active-pills-row-mobile');
            if (container) {
                container.addEventListener('scroll', function() {
                    const maxScrollLeft = this.scrollWidth - this.clientWidth;
                    const scrollProgress = maxScrollLeft > 0 ? (this.scrollLeft / maxScrollLeft) * 100 : 0;
                    console.log('[Pills Scroll] Position:', this.scrollLeft + 'px, Progress:', scrollProgress.toFixed(1) + '%, Can scroll more right:', this.scrollLeft < maxScrollLeft);
                });
                
                // Add touch/mouse interaction debugging
                container.addEventListener('touchstart', () => console.log('[Pills Touch] Touch scroll started'), { passive: true });
                container.addEventListener('touchend', () => console.log('[Pills Touch] Touch scroll ended'), { passive: true });
                container.addEventListener('mousedown', () => console.log('[Pills Mouse] Mouse scroll started'), { passive: true });
                container.addEventListener('mouseup', () => console.log('[Pills Mouse] Mouse scroll ended'), { passive: true });
            }
            
            // Expose debug function globally
            window.debugPills = debugPillContainer;
            
            // Add mobile pills layout test function
            window.testMobilePillsLayout = function() {
                console.log('[MOBILE PILLS TEST] === MANUAL LAYOUT TEST ===');
                const pillsRowMobile = document.getElementById('active-pills-row-mobile');
                const allFiltersBtn = pillsRowMobile?.querySelector('#modal-button-mobile');
                
                if (!pillsRowMobile) {
                    console.error('[MOBILE PILLS TEST] ❌ Pills row mobile not found');
                    return;
                }
                
                console.log('[MOBILE PILLS TEST] Main container:', {
                    width: pillsRowMobile.offsetWidth,
                    scrollWidth: pillsRowMobile.scrollWidth,
                    clientWidth: pillsRowMobile.clientWidth,
                    overflow: getComputedStyle(pillsRowMobile).overflow
                });
                
                if (allFiltersBtn) {
                    const btnRect = allFiltersBtn.getBoundingClientRect();
                    console.log('[MOBILE PILLS TEST] All Filters button:', {
                        left: btnRect.left,
                        right: btnRect.right,
                        width: btnRect.width,
                        position: getComputedStyle(allFiltersBtn).position
                    });
                } else {
                    console.error('[MOBILE PILLS TEST] ❌ All Filters button not found');
                }
                
                const pills = pillsRowMobile.querySelectorAll('.pill');
                console.log('[MOBILE PILLS TEST] Pills container:', {
                    left: pillsRowMobile.getBoundingClientRect().left,
                    right: pillsRowMobile.getBoundingClientRect().right,
                    width: pillsRowMobile.getBoundingClientRect().width,
                    scrollWidth: pillsRowMobile.scrollWidth,
                    clientWidth: pillsRowMobile.clientWidth,
                    canScroll: pillsRowMobile.scrollWidth > pillsRowMobile.clientWidth,
                    paddingLeft: getComputedStyle(pillsRowMobile).paddingLeft,
                    flex: getComputedStyle(pillsRowMobile).flex
                });
                
                console.log('[MOBILE PILLS TEST] Pills count:', pills.length);
                
                if (pills.length > 0) {
                    const firstPill = pills[0];
                    const firstPillRect = firstPill.getBoundingClientRect();
                    console.log('[MOBILE PILLS TEST] First pill:', {
                        left: firstPillRect.left,
                        right: firstPillRect.right,
                        width: firstPillRect.width,
                        text: firstPill.textContent.trim()
                    });
                    
                    // Test scroll behavior
                    console.log('[MOBILE PILLS TEST] Testing scroll behavior...');
                    const originalScrollLeft = pillsRowMobile.scrollLeft;
                    pillsRowMobile.scrollLeft = 0;
                    console.log('[MOBILE PILLS TEST] After scrolling to start:', {
                        scrollLeft: pillsRowMobile.scrollLeft,
                        firstPillLeft: firstPill.getBoundingClientRect().left
                    });
                    
                    // Check overlap after scroll
                    if (allFiltersBtn) {
                        const btnRect = allFiltersBtn.getBoundingClientRect();
                        const firstPillRectAfterScroll = firstPill.getBoundingClientRect();
                        const canOverlap = firstPillRectAfterScroll.left < btnRect.right;
                        console.log('[MOBILE PILLS TEST] After scroll to start - can overlap?', canOverlap);
                        
                        if (canOverlap) {
                            console.error('[MOBILE PILLS TEST] ❌ FAILED: First pill can still overlap after scrolling to start!');
                        } else {
                            console.log('[MOBILE PILLS TEST] ✅ PASSED: First pill cannot overlap after scrolling to start');
                        }
                    }
                    
                    // Restore original scroll position
                    pillsRowMobile.scrollLeft = originalScrollLeft;
                }
            };
            
            // Add scroll test function for RIGHT scrolling
            window.testPillScroll = function() {
                const container = document.getElementById('active-pills-row-mobile');
                if (container) {
                    console.log('[Pills Test] Testing scroll to right...');
                    container.scrollBy({left: 100, behavior: 'smooth'});
                    setTimeout(() => {
                        console.log('[Pills Test] Current scroll position:', container.scrollLeft);
                    }, 500);
                }
            };
            
            // Comprehensive barrier test function
            window.testPillBarriers = function() {
                const container = document.getElementById('active-pills-row-mobile');
                
                console.log('=== BARRIER REMOVAL TEST ===');
                
                if (container) {
                    const containerStyle = getComputedStyle(container);
                    console.log('[Barrier Test] Container overflow-x:', containerStyle.overflowX);
                    console.log('[Barrier Test] Container padding-right:', containerStyle.paddingRight);
                    console.log('[Barrier Test] Container max-width:', containerStyle.maxWidth);
                    console.log('[Barrier Test] Container width:', containerStyle.width);
                    console.log('[Barrier Test] Container scrollWidth:', container.scrollWidth);
                    console.log('[Barrier Test] Container clientWidth:', container.clientWidth);
                }
                
                // Test if scrolling is possible
                if (container && container.scrollWidth > container.clientWidth) {
                    console.log('[Barrier Test] ✅ Container can scroll horizontally');
                    console.log('[Barrier Test] Max scroll distance:', container.scrollWidth - container.clientWidth);
                } else {
                    console.log('[Barrier Test] ❌ Container cannot scroll horizontally');
                }
            };
            
            // Add visual right-overflow indicator
            // function addRightOverflowIndicator() {
            //     const container = document.getElementById('active-pills-row-mobile');
            //     if (container && container.scrollWidth > container.clientWidth) {
            //         // Create visual indicator that content extends to the right
            //         const indicator = document.createElement('div');
            //         indicator.id = 'right-overflow-indicator';
            //         indicator.style.cssText = `
            //             position: absolute;
            //             right: 0;
            //             top: 0;
            //             width: 20px;
            //             height: 100%;
            //             background: linear-gradient(to right, transparent, rgba(0, 255, 0, 0.7));
            //             pointer-events: none;
            //             z-index: 100;
            //             border: 2px solid lime;
            //         `;
            //         indicator.textContent = '→';
            //         indicator.style.display = 'flex';
            //         indicator.style.alignItems = 'center';
            //         indicator.style.justifyContent = 'center';
            //         indicator.style.color = 'lime';
            //         indicator.style.fontWeight = 'bold';
            //         container.parentElement.style.position = 'relative';
            //         container.parentElement.appendChild(indicator);
            //         console.log('[Pills Debug] Added right overflow indicator');
            //     }
            // }
            
            // setTimeout(addRightOverflowIndicator, 1500);
            
            // Log computed background color for #search-and-filters-row
            var searchRow = document.getElementById('search-and-filters-row');
            if (searchRow) {
                var style = window.getComputedStyle(searchRow);
                console.log('[DEBUG] #search-and-filters-row background:', style.background, style.backgroundColor);
                console.log('[DEBUG] #search-and-filters-row classes:', searchRow.className);
                console.log('[DEBUG] #search-and-filters-row rect:', searchRow.getBoundingClientRect());
                if (searchRow.parentElement) {
                    var parentStyle = window.getComputedStyle(searchRow.parentElement);
                    console.log('[DEBUG] Parent of #search-and-filters-row background:', parentStyle.background, parentStyle.backgroundColor);
                    console.log('[DEBUG] Parent tag:', searchRow.parentElement.tagName, 'classes:', searchRow.parentElement.className);
                }
            }
            // Log computed background color for body
            var bodyStyle = window.getComputedStyle(document.body);
            console.log('[DEBUG] body background:', bodyStyle.background, bodyStyle.backgroundColor);
            // Log main if present
            var main = document.querySelector('main');
            if (main) {
                var mainStyle = window.getComputedStyle(main);
                console.log('[DEBUG] main background:', mainStyle.background, mainStyle.backgroundColor);
                console.log('[DEBUG] main classes:', main.className);
            }
        });

        // --- Bottom Bar Mobile Button Functionality ---
        document.addEventListener('DOMContentLoaded', function() {
            // Favorites button
            const favBtn = document.getElementById('favorites-btn-mobile');
            if (favBtn) {
                function updateMobileFavoritesIcon() {
                    if (window.MicFinderState) {
                        const filters = window.MicFinderState.getActiveFilters();
                        const icon = favBtn.querySelector('i');
                        if (icon) {
                            if (filters.showFavorites) {
                                icon.className = 'fa-solid fa-star';
                            } else {
                                icon.className = 'fa-regular fa-star';
                            }
                        }
                    }
                }
                favBtn.addEventListener('click', function() {
                    if (window.MicFinderState && window.MicFinderFilters && window.MicFinderApp) {
                        const filters = window.MicFinderState.getActiveFilters();
                        const newFilters = { ...filters, showFavorites: !filters.showFavorites };
                        window.MicFinderState.setActiveFilters(newFilters);
                        window.MicFinderFilters.saveFilterState(newFilters);
                        window.MicFinderApp.render();
                        updateMobileFavoritesIcon();
                    }
                });
                // Update icon on load and after render
                updateMobileFavoritesIcon();
                // Optionally, listen for global render events if available
                if (window.MicFinderApp && window.MicFinderApp.render) {
                    const origRender = window.MicFinderApp.render;
                    window.MicFinderApp.render = function() {
                        origRender.apply(this, arguments);
                        updateMobileFavoritesIcon();
                    };
                }
            }
            // Filter button
            const filterBtn = document.getElementById('filters-btn-mobile');
            if (filterBtn) {
                filterBtn.addEventListener('click', function() {
                    if (typeof openModal === 'function') {
                        openModal();
                    } else {
                        alert('Filter modal not available.');
                    }
                });
            }
            // List view button
            const listBtn = document.getElementById('list-view-btn-mobile');
            if (listBtn) {
                listBtn.addEventListener('click', function() {
                    // Show the right sidebar for mobile list view
                    const rightSidebar = document.getElementById('right-sidebar');
                    if (rightSidebar) {
                        // First ensure the sidebar is properly initialized
                        rightSidebar.style.display = 'flex';
                        rightSidebar.style.position = 'fixed';
                        rightSidebar.style.top = '0';
                        rightSidebar.style.right = '0';
                        rightSidebar.style.bottom = '0';
                        rightSidebar.style.width = '100%';
                        rightSidebar.style.zIndex = '1000';
                        rightSidebar.style.transform = 'translateX(100%)';
                        rightSidebar.style.transition = 'transform 0.3s ease';
                        
                        // Force a reflow to ensure the initial state is applied
                        rightSidebar.offsetHeight;
                        
                        // Now animate it in
                        rightSidebar.classList.add('mobile-open');
                        rightSidebar.style.transform = 'translateX(0)';
                        
                        // Ensure the mic list is populated
                        if (window.MicFinderApp && window.MicFinderApp.render) {
                            window.MicFinderApp.render();
                        }
                    }
                });
            }
            // Find location button
            const findLocationBtn = document.getElementById('find-location-btn-mobile');
            if (findLocationBtn) {
                findLocationBtn.addEventListener('click', function() {
                    // Trigger the same function as the desktop find location button
                    const desktopDirectionsBtn = document.getElementById('directions-btn');
                    if (desktopDirectionsBtn) {
                        desktopDirectionsBtn.click();
                    } else if (window.MicFinderMap && window.MicFinderMap.geolocateUser) {
                        window.MicFinderMap.geolocateUser();
                    }
                });
            }
            // Reset map view button
            const resetMapBtn = document.getElementById('reset-map-btn-mobile');
            if (resetMapBtn) {
                resetMapBtn.addEventListener('click', function() {
                    // Trigger the same function as the desktop reset map button
                    const desktopZoomBtn = document.getElementById('zoom-to-fit-btn');
                    if (desktopZoomBtn) {
                        desktopZoomBtn.click();
                    }
                });
            }
        });

        document.addEventListener('DOMContentLoaded', function() {
          var mobileDaySelect = document.getElementById('mobile-day-select');
          var mobileDayWrapper = document.querySelector('.mobile-day-select-wrapper');
          var mobileDayClose = document.querySelector('.mobile-day-select-close');
          
          // Debug logging
          console.log('[DEBUG] mobileDayClose element:', mobileDayClose);
          console.log('[DEBUG] mobileDayWrapper element:', mobileDayWrapper);
          // Show wrapper if on mobile
          if (mobileDayWrapper) mobileDayWrapper.style.display = window.innerWidth <= 600 ? 'block' : 'none';
          if (mobileDaySelect) {
            // Sync select with filter state on open
            if (window.MicFinderState) {
              var filters = window.MicFinderState.getActiveFilters();
              if (filters.day) {
                mobileDaySelect.value = Array.isArray(filters.day) ? filters.day[0] : filters.day;
              }
            }
            // On change, update filter state
            mobileDaySelect.addEventListener('change', function(e) {
              var selectedDay = this.value;
              if (window.MicFinderState && window.MicFinderFilters && window.MicFinderApp) {
                var filters = window.MicFinderState.getActiveFilters();
                filters.day = selectedDay;
                window.MicFinderState.setActiveFilters(filters);
                window.MicFinderFilters.saveFilterState(filters);
                window.MicFinderApp.render();
              }
              
              // If a day was selected, show time selection popup
              if (selectedDay && selectedDay.trim()) {

              }
              
              // Optionally close dropdown after selection
              if (window.innerWidth <= 600 && mobileDayWrapper) mobileDayWrapper.style.display = 'none';
            });
          }
          // X button closes dropdown
          if (mobileDayClose && mobileDayWrapper) {
            console.log('[DEBUG] Adding click listener to mobileDayClose');
            mobileDayClose.addEventListener('click', function() {
              console.log('[DEBUG] mobileDayClose clicked');
              mobileDayWrapper.style.display = 'none';
            });
          } else {
            console.log('[DEBUG] mobileDayClose or mobileDayWrapper not found:', { mobileDayClose, mobileDayWrapper });
          }
          // Click outside closes dropdown (mobile only)
          document.addEventListener('mousedown', function(e) {
            if (window.innerWidth > 600) return;
            if (mobileDayWrapper && !mobileDayWrapper.contains(e.target)) {
              mobileDayWrapper.style.display = 'none';
            }
          });
        });

        // Function to update bottom bar selection for mobile view
        window.updateBottomBarSelection = function(mic) {
            const bottomBarInfo = document.getElementById('bottom-bar-info');
            const titleElement = document.getElementById('bottom-selection-title');
            const subtitleElement = document.getElementById('bottom-selection-subtitle');
            
            if (bottomBarInfo && titleElement && subtitleElement && mic) {
                titleElement.textContent = mic.venue || 'Unknown Venue';
                subtitleElement.textContent = mic.time + ' • ' + mic.day;
                bottomBarInfo.style.display = 'block';
            }
        };

        // Remove any leftover right-overflow-indicator on page load
        document.addEventListener('DOMContentLoaded', function() {
          var indicator = document.getElementById('right-overflow-indicator');
          if (indicator) indicator.remove();
        });

        // Note: Modal button debug moved to renderActivePills() where button actually exists

        // Enhanced Intro System with UX Optimization
        document.addEventListener('DOMContentLoaded', function() {
          console.log('[Intro] Enhanced system initializing...');
          
          // Check if user has seen intro before
          const hasSeenIntro = localStorage.getItem('micfinder-intro-seen');
          const visitCount = parseInt(localStorage.getItem('micfinder-visit-count') || '0') + 1;
          localStorage.setItem('micfinder-visit-count', visitCount.toString());
          
          const introOverlay = document.getElementById('intro-overlay');
          const smartStartBtn = document.getElementById('smart-start-btn');
          const skipWalkthroughBtn = document.getElementById('skip-walkthrough');
          const showIntroBtn = document.getElementById('show-intro-btn');
          const skipIntroBtn = document.getElementById('skip-intro-btn');
          const returnUserBanner = document.getElementById('return-user-banner');
          
          // Dynamic content based on user context
          function initializeDynamicContent() {
            const currentHour = new Date().getHours();
            const isEvening = currentHour >= 17;
            const isMorning = currentHour < 12;
            const isWeekend = [0, 6].includes(new Date().getDay());
            
            // Dynamic headlines based on time and context
            const welcomeTitle = document.getElementById('dynamic-welcome-title');
            const welcomeSubtitle = document.getElementById('dynamic-welcome-subtitle');
            
            let titleText, subtitleText;
            
            if (visitCount > 1) {
              // Return user messaging
              titleText = "Welcome back! Ready for your next gig?";
              subtitleText = "Let's find the perfect stage for tonight";
              if (returnUserBanner) {
                returnUserBanner.classList.remove('hidden');
              }
            } else if (isEvening) {
              titleText = "Tonight's the night to perform!";
              subtitleText = "Find open mics happening right now near you";
            } else if (isMorning) {
              titleText = "Planning your comedy journey?";
              subtitleText = "Discover the best venues to showcase your talent";
            } else if (isWeekend) {
              titleText = "Weekend comedy awaits!";
              subtitleText = "Explore this weekend's hottest open mic scenes";
            } else {
              titleText = "Ready to find your perfect stage?";
              subtitleText = "Join thousands of comedians discovering their next big break";
            }
            
            if (welcomeTitle) welcomeTitle.textContent = titleText;
            if (welcomeSubtitle) welcomeSubtitle.textContent = subtitleText;
            
            // Location-aware messaging if available (but only if intro is not currently visible)
            if (navigator.geolocation && (!introOverlay || introOverlay.style.display === 'none')) {
              navigator.geolocation.getCurrentPosition(function(position) {
                // Update subtitle with location context only if intro is not showing
                const currentIntroOverlay = document.getElementById('intro-overlay');
                if (welcomeSubtitle && visitCount === 1 && (!currentIntroOverlay || currentIntroOverlay.style.display === 'none')) {
                  welcomeSubtitle.textContent = "Discover amazing comedy venues in your area";
                }
              }, function() {
                // Geolocation failed, keep default messaging
              });
            }
          }
          
          // Initialize dynamic content
          initializeDynamicContent();
          
          console.log('[Intro] Elements found:', {
            introOverlay: !!introOverlay,
            smartStartBtn: !!smartStartBtn,
            skipWalkthroughBtn: !!skipWalkthroughBtn,
            showIntroBtn: !!showIntroBtn,
            hasSeenIntro: hasSeenIntro
          });
          

          
          // Show intro if not seen before
          if (!hasSeenIntro && introOverlay) {
            console.log('[Intro] Showing intro for first time');
            introOverlay.style.display = 'flex';
            introOverlay.style.visibility = 'visible';
          } else if (introOverlay) {
            console.log('[Intro] Hiding intro - user has seen it');
            introOverlay.style.display = 'none';
          }
          
          // Function to show intro
          function showIntro() {
            console.log('[Intro] Showing intro manually');
            if (introOverlay) {
              introOverlay.style.display = 'flex';
              introOverlay.style.visibility = 'visible';
            }
          }
          
          // Function to hide intro
          function hideIntro() {
            console.log('[Intro] Hiding intro');
            if (introOverlay) {
              introOverlay.style.display = 'none';
              introOverlay.style.visibility = 'hidden';
            }
            localStorage.setItem('micfinder-intro-seen', 'true');
            console.log('[Intro] Marked as seen in localStorage');
          }
          
          // Smart start functionality - user-paced demo then optional tutorial
          if (smartStartBtn) {
            smartStartBtn.addEventListener('click', function(e) {
              console.log('[Intro] Smart start button clicked');
              e.preventDefault();
              e.stopPropagation();
              hideIntro();
              // Start with demo only - let user control the pace
              setTimeout(() => {
                startQuickDemoWithTutorialOption();
              }, 300);
            });
          }
          
          // Skip walkthrough - direct access
          if (skipWalkthroughBtn) {
            skipWalkthroughBtn.addEventListener('click', function(e) {
              console.log('[Intro] Skip walkthrough clicked');
              e.preventDefault();
              e.stopPropagation();
              hideIntro();
              // Track that user skipped guided experience
              localStorage.setItem('micfinder-walkthrough-skipped', 'true');
            });
          }
          
          // Filters tutorial trigger functionality
          const filtersTutorialTrigger = document.getElementById('filters-tutorial-trigger');
          if (filtersTutorialTrigger) {
            filtersTutorialTrigger.addEventListener('click', function(e) {
              console.log('[Tutorial] Filters tutorial trigger clicked');
              e.preventDefault();
              e.stopPropagation();
              hideIntro();
              // Show quick filter highlight first, then start tutorial
              setTimeout(() => {
                showQuickFilterHighlight();
              }, 300);
            });
          }
          
          // Skip intro functionality for return users
          if (skipIntroBtn) {
            skipIntroBtn.addEventListener('click', function(e) {
              console.log('[Intro] Skip button clicked');
              e.preventDefault();
              e.stopPropagation();
              hideIntro();
              // Track that user explicitly skipped
              localStorage.setItem('micfinder-intro-skipped', 'true');
            });
          }
          

          
          // Enhanced show intro button with smart detection
          if (showIntroBtn) {
            showIntroBtn.addEventListener('click', function(e) {
              console.log('[Intro] Help button clicked - showing enhanced intro');
              e.preventDefault();
              e.stopPropagation();
              
              // Reset dynamic content for manual activation
              initializeDynamicContent();
              showIntro();
            });
          }
          
          // Search Tutorial Function
          function startSearchTutorial() {
            console.log('[Tutorial] Starting search tutorial');
            
            let currentStep = 0;
            const steps = [
              {
                id: 'search-bar',
                title: 'Main Search Bar',
                description: 'Type venue names, comedian names, or locations. Try "QED Astoria" or "West Side"',
                color: 'blue',
                highlight: 'search-highlight'
              },
              {
                id: 'filters',
                title: 'Filter Options', 
                description: 'Use filter pills to narrow by day, time, location, or mic type',
                color: 'green',
                highlight: 'filters-highlight'
              },
              {
                id: 'suggestions',
                title: 'Smart Suggestions',
                description: 'See autocomplete suggestions as you type, including recent searches',
                color: 'purple',
                highlight: 'search-highlight'
              },
              {
                id: 'map',
                title: 'Map Integration',
                description: 'Search results automatically highlight on the map below',
                color: 'orange',
                highlight: 'map-highlight'
              }
            ];
            
            // Create tutorial overlay
            const tutorialOverlay = document.createElement('div');
            tutorialOverlay.id = 'search-tutorial-overlay';
            tutorialOverlay.className = 'fixed inset-0 z-[70] pointer-events-none';
            tutorialOverlay.innerHTML = `
              <!-- Highlight for main search bar -->
              <div id="search-highlight" class="absolute border-4 border-blue-400 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-pulse pointer-events-none" style="transition: all 0.3s ease; display: none;"></div>
              
              <!-- Highlight for filter pills -->
              <div id="filters-highlight" class="absolute border-4 border-green-400 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.8)] animate-pulse pointer-events-none" style="transition: all 0.3s ease; display: none;"></div>
              
              <!-- Highlight for map -->
              <div id="map-highlight" class="absolute border-4 border-orange-400 rounded-lg shadow-[0_0_20px_rgba(251,146,60,0.8)] animate-pulse pointer-events-none" style="transition: all 0.3s ease; display: none;"></div>
              
              <!-- Tutorial explanation box -->
              <div id="tutorial-box" class="fixed top-1/2 right-8 transform -translate-y-1/2 bg-white rounded-2xl p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] border-4 border-gray-400 max-w-md pointer-events-auto" style="z-index: 80; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-2xl font-black text-gray-900 drop-shadow-sm">Search for Mics & Venues</h3>
                  <button id="close-tutorial" class="text-gray-600 hover:text-gray-800 text-3xl font-black bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors">&times;</button>
                </div>
                
                <!-- Step indicator -->
                <div class="flex justify-center mb-6">
                  <div class="flex space-x-2">
                    ${steps.map((_, index) => `
                      <div class="w-3 h-3 rounded-full transition-colors ${index === 0 ? 'bg-blue-500' : 'bg-gray-300'}" data-step-dot="${index}"></div>
                    `).join('')}
                  </div>
                </div>
                
                <!-- Current step content -->
                <div id="step-content" class="mb-8">
                  <!-- Will be populated by updateStepContent -->
                </div>
                
                <!-- Navigation buttons -->
                <div class="flex gap-3">
                  <button id="prev-step" class="flex-1 py-3 px-4 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-colors" style="display: none;">
                    Previous
                  </button>
                  <button id="next-step" class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold transition-all duration-300 transform hover:scale-105 shadow-lg">
                    Next
                  </button>
                  <button id="finish-tutorial" class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold transition-all duration-300 transform hover:scale-105 shadow-lg" style="display: none;">
                    Got it!
                  </button>
                </div>
              </div>
            `;
            
            document.body.appendChild(tutorialOverlay);
            
            // Update step content
            function updateStepContent() {
              const step = steps[currentStep];
              const stepContent = document.getElementById('step-content');
              const colorClasses = {
                blue: 'bg-blue-50 border-blue-200 text-blue-700',
                green: 'bg-green-50 border-green-200 text-green-700', 
                purple: 'bg-purple-50 border-purple-200 text-purple-700',
                orange: 'bg-orange-50 border-orange-200 text-orange-700'
              };
              
              stepContent.innerHTML = `
                <div class="flex items-start gap-4 p-4 rounded-xl ${colorClasses[step.color]} border-2">
                  <div class="w-10 h-10 bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 rounded-full flex items-center justify-center text-white text-lg font-black shadow-lg mt-0.5">
                    ${currentStep + 1}
                  </div>
                  <div>
                    <div class="font-black text-${step.color}-700 text-xl mb-2">${step.title}</div>
                    <div class="text-gray-900 font-semibold text-lg">${step.description}</div>
                  </div>
                </div>
              `;
              
              // Update step dots
              document.querySelectorAll('[data-step-dot]').forEach((dot, index) => {
                dot.className = `w-3 h-3 rounded-full transition-colors ${index === currentStep ? 'bg-blue-500' : index < currentStep ? 'bg-green-500' : 'bg-gray-300'}`;
              });
              
              // Update navigation buttons
              document.getElementById('prev-step').style.display = currentStep > 0 ? 'block' : 'none';
              document.getElementById('next-step').style.display = currentStep < steps.length - 1 ? 'block' : 'none';
              document.getElementById('finish-tutorial').style.display = currentStep === steps.length - 1 ? 'block' : 'none';
              
              // Show/hide highlights
              document.querySelectorAll('[id$="-highlight"]').forEach(highlight => highlight.style.display = 'none');
              const activeHighlight = document.getElementById(step.highlight);
              if (activeHighlight) {
                activeHighlight.style.display = 'block';
                positionHighlights();
              }
            }
            
            // Position highlights
            function positionHighlights() {
              const step = steps[currentStep];
              const searchBar = document.getElementById('map-search-bar');
              const filtersRow = document.querySelector('#search-and-filters-row .flex.flex-wrap');
              const mapElement = document.getElementById('map');
              
              if (step.highlight === 'search-highlight' && searchBar) {
                const highlight = document.getElementById('search-highlight');
                const rect = searchBar.getBoundingClientRect();
                highlight.style.left = `${rect.left - 8}px`;
                highlight.style.top = `${rect.top - 8}px`;
                highlight.style.width = `${rect.width + 16}px`;
                highlight.style.height = `${rect.height + 16}px`;
              } else if (step.highlight === 'filters-highlight' && filtersRow) {
                const highlight = document.getElementById('filters-highlight');
                const rect = filtersRow.getBoundingClientRect();
                highlight.style.left = `${rect.left - 8}px`;
                highlight.style.top = `${rect.top - 8}px`;
                highlight.style.width = `${rect.width + 16}px`;
                highlight.style.height = `${rect.height + 16}px`;
              } else if (step.highlight === 'map-highlight' && mapElement) {
                const highlight = document.getElementById('map-highlight');
                const rect = mapElement.getBoundingClientRect();
                highlight.style.left = `${rect.left - 8}px`;
                highlight.style.top = `${rect.top - 8}px`;
                highlight.style.width = `${rect.width + 16}px`;
                highlight.style.height = `${rect.height + 16}px`;
              }
            }
            
            // Initialize first step
            updateStepContent();
            
            // Navigation event listeners
            document.getElementById('next-step').addEventListener('click', () => {
              if (currentStep < steps.length - 1) {
                currentStep++;
                updateStepContent();
              }
            });
            
            document.getElementById('prev-step').addEventListener('click', () => {
              if (currentStep > 0) {
                currentStep--;
                updateStepContent();
              }
            });
            
            // Position highlights initially and on resize
            setTimeout(positionHighlights, 100);
            window.addEventListener('resize', positionHighlights);
            
            // Close tutorial functionality
            function closeTutorial() {
              const overlay = document.getElementById('search-tutorial-overlay');
              if (overlay) {
                document.body.removeChild(overlay);
              }
              window.removeEventListener('resize', positionHighlights);
            }
            
            // Add close event listeners
            document.getElementById('close-tutorial').addEventListener('click', closeTutorial);
            document.getElementById('finish-tutorial').addEventListener('click', closeTutorial);
          }
          
          // Filters Tutorial Function
          function startFiltersTutorial() {
            console.log('[Tutorial] Starting filters tutorial');
            
            let currentFilterStep = 0;
            const filterSteps = [
              {
                id: 'filter-pills',
                title: 'Filter Pills',
                description: 'Click filter categories to narrow your search results instantly',
                color: 'green',
                highlight: 'filter-pills-highlight'
              },
              {
                id: 'day-filters',
                title: 'Day Filters',
                description: 'Filter by specific days: Monday, Tuesday, Weekend, etc.',
                color: 'blue',
                highlight: 'day-filters-highlight'
              },
              {
                id: 'time-filters',
                title: 'Time Filters',
                description: 'Filter by time slots: Evening, Late Night, Afternoon',
                color: 'purple',
                highlight: 'time-filters-highlight'
              },
              {
                id: 'location-filters',
                title: 'Location Filters',
                description: 'Filter by boroughs, neighborhoods, or distance from your location',
                color: 'orange',
                highlight: 'filter-pills-highlight'
              },
              {
                id: 'mic-type',
                title: 'Mic Type',
                description: 'Filter by mic style: Open Mic, Showcase, Bringer, etc.',
                color: 'red',
                highlight: 'filter-pills-highlight'
              }
            ];
            
            // Create tutorial overlay
            const tutorialOverlay = document.createElement('div');
            tutorialOverlay.id = 'filters-tutorial-overlay';
            tutorialOverlay.className = 'fixed inset-0 z-[70] pointer-events-none';
            tutorialOverlay.innerHTML = `
              <!-- Highlight for filter pills -->
              <div id="filter-pills-highlight" class="absolute border-4 border-green-400 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.8)] animate-pulse pointer-events-none" style="transition: all 0.3s ease; display: none;"></div>
              
              <!-- Highlight for day filters -->
              <div id="day-filters-highlight" class="absolute border-4 border-blue-400 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-pulse pointer-events-none" style="transition: all 0.3s ease; display: none;"></div>
              
              <!-- Highlight for time filters -->
              <div id="time-filters-highlight" class="absolute border-4 border-purple-400 rounded-lg shadow-[0_0_20px_rgba(147,51,234,0.8)] animate-pulse pointer-events-none" style="transition: all 0.3s ease; display: none;"></div>
              
              <!-- Tutorial explanation box -->
              <div id="filters-tutorial-box" class="fixed top-1/2 right-8 transform -translate-y-1/2 bg-white rounded-2xl p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] border-4 border-gray-400 max-w-md pointer-events-auto" style="z-index: 80; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-2xl font-black text-gray-900 drop-shadow-sm">Filter Mics & Venues</h3>
                  <button id="close-filters-tutorial" class="text-gray-600 hover:text-gray-800 text-3xl font-black bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors">&times;</button>
                </div>
                
                <!-- Step indicator -->
                <div class="flex justify-center mb-6">
                  <div class="flex space-x-2">
                    ${filterSteps.map((_, index) => `
                      <div class="w-3 h-3 rounded-full transition-colors ${index === 0 ? 'bg-green-500' : 'bg-gray-300'}" data-filter-step-dot="${index}"></div>
                    `).join('')}
                  </div>
                </div>
                
                <!-- Current step content -->
                <div id="filter-step-content" class="mb-8">
                  <!-- Will be populated by updateFilterStepContent -->
                </div>
                
                <!-- Navigation buttons -->
                <div class="flex gap-3">
                  <button id="prev-filter-step" class="flex-1 py-3 px-4 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-colors" style="display: none;">
                    Previous
                  </button>
                  <button id="next-filter-step" class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold transition-all duration-300 transform hover:scale-105 shadow-lg">
                    Next
                  </button>
                  <button id="finish-filters-tutorial" class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold transition-all duration-300 transform hover:scale-105 shadow-lg" style="display: none;">
                    Got it!
                  </button>
                </div>
              </div>
            `;
            
            document.body.appendChild(tutorialOverlay);
            
            // Update step content
            function updateFilterStepContent() {
              const step = filterSteps[currentFilterStep];
              const stepContent = document.getElementById('filter-step-content');
              const colorClasses = {
                green: 'bg-green-50 border-green-200 text-green-700',
                blue: 'bg-blue-50 border-blue-200 text-blue-700',
                purple: 'bg-purple-50 border-purple-200 text-purple-700',
                orange: 'bg-orange-50 border-orange-200 text-orange-700',
                red: 'bg-red-50 border-red-200 text-red-700'
              };
              
              stepContent.innerHTML = `
                <div class="flex items-start gap-4 p-4 rounded-xl ${colorClasses[step.color]} border-2">
                  <div class="w-10 h-10 bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 rounded-full flex items-center justify-center text-white text-lg font-black shadow-lg mt-0.5">
                    ${currentFilterStep + 1}
                  </div>
                  <div>
                    <div class="font-black text-${step.color}-700 text-xl mb-2">${step.title}</div>
                    <div class="text-gray-900 font-semibold text-lg">${step.description}</div>
                  </div>
                </div>
              `;
              
              // Update step dots
              document.querySelectorAll('[data-filter-step-dot]').forEach((dot, index) => {
                dot.className = `w-3 h-3 rounded-full transition-colors ${index === currentFilterStep ? 'bg-green-500' : index < currentFilterStep ? 'bg-blue-500' : 'bg-gray-300'}`;
              });
              
              // Update navigation buttons
              document.getElementById('prev-filter-step').style.display = currentFilterStep > 0 ? 'block' : 'none';
              document.getElementById('next-filter-step').style.display = currentFilterStep < filterSteps.length - 1 ? 'block' : 'none';
              document.getElementById('finish-filters-tutorial').style.display = currentFilterStep === filterSteps.length - 1 ? 'block' : 'none';
              
              // Show/hide highlights
              document.querySelectorAll('[id$="-highlight"]').forEach(highlight => highlight.style.display = 'none');
              const activeHighlight = document.getElementById(step.highlight);
              if (activeHighlight) {
                activeHighlight.style.display = 'block';
                positionFilterHighlights();
              }
            }
            
            // Position highlights
            function positionFilterHighlights() {
              const step = filterSteps[currentFilterStep];
              const filterPills = document.querySelector('#search-and-filters-row .flex.flex-wrap');
              const dayFilters = document.querySelector('[data-filter-type="day"]');
              const timeFilters = document.querySelector('[data-filter-type="time"]');
              
              if (step.highlight === 'filter-pills-highlight' && filterPills) {
                const highlight = document.getElementById('filter-pills-highlight');
                const rect = filterPills.getBoundingClientRect();
                highlight.style.left = `${rect.left - 8}px`;
                highlight.style.top = `${rect.top - 8}px`;
                highlight.style.width = `${rect.width + 16}px`;
                highlight.style.height = `${rect.height + 16}px`;
              } else if (step.highlight === 'day-filters-highlight' && dayFilters) {
                const highlight = document.getElementById('day-filters-highlight');
                const rect = dayFilters.getBoundingClientRect();
                highlight.style.left = `${rect.left - 4}px`;
                highlight.style.top = `${rect.top - 4}px`;
                highlight.style.width = `${rect.width + 8}px`;
                highlight.style.height = `${rect.height + 8}px`;
              } else if (step.highlight === 'time-filters-highlight' && timeFilters) {
                const highlight = document.getElementById('time-filters-highlight');
                const rect = timeFilters.getBoundingClientRect();
                highlight.style.left = `${rect.left - 4}px`;
                highlight.style.top = `${rect.top - 4}px`;
                highlight.style.width = `${rect.width + 8}px`;
                highlight.style.height = `${rect.height + 8}px`;
              }
            }
            
            // Initialize first step
            updateFilterStepContent();
            
            // Navigation event listeners
            document.getElementById('next-filter-step').addEventListener('click', () => {
              if (currentFilterStep < filterSteps.length - 1) {
                currentFilterStep++;
                updateFilterStepContent();
              }
            });
            
            document.getElementById('prev-filter-step').addEventListener('click', () => {
              if (currentFilterStep > 0) {
                currentFilterStep--;
                updateFilterStepContent();
              }
            });
            
            // Position highlights initially and on resize
            setTimeout(positionFilterHighlights, 100);
            window.addEventListener('resize', positionFilterHighlights);
            
            // Close tutorial functionality
            function closeFiltersTutorial() {
              const overlay = document.getElementById('filters-tutorial-overlay');
              if (overlay) {
                document.body.removeChild(overlay);
              }
              window.removeEventListener('resize', positionFilterHighlights);
            }
            
            // Add close event listeners
            document.getElementById('close-filters-tutorial').addEventListener('click', closeFiltersTutorial);
            document.getElementById('finish-filters-tutorial').addEventListener('click', closeFiltersTutorial);
          }
          
          // Quick Filter Highlight Function
          function showQuickFilterHighlight() {
            console.log('[Tutorial] Showing quick filter highlight');
            
            // Create a brief filter highlight overlay
            const filterHighlightOverlay = document.createElement('div');
            filterHighlightOverlay.id = 'quick-filter-highlight-overlay';
            filterHighlightOverlay.className = 'fixed inset-0 z-[70] pointer-events-none';
            filterHighlightOverlay.innerHTML = `
              <!-- Quick highlight for filter area -->
              <div id="quick-filter-highlight" class="absolute border-4 border-green-400 rounded-lg shadow-[0_0_25px_rgba(34,197,94,0.9)] animate-pulse pointer-events-none" style="transition: all 0.3s ease;"></div>
              
              <!-- Brief instruction tooltip -->
              <div id="filter-tooltip" class="fixed bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg pointer-events-none" style="z-index: 80;">
                <div class="text-sm font-semibold">These are your filter options!</div>
                <div class="text-xs">Click any filter to narrow your search</div>
              </div>
            `;
            
            document.body.appendChild(filterHighlightOverlay);
            
            // Position highlight on filter area
            function positionQuickFilterHighlight() {
              const filterArea = document.querySelector('#search-and-filters-row .flex.flex-wrap');
              const quickHighlight = document.getElementById('quick-filter-highlight');
              const tooltip = document.getElementById('filter-tooltip');
              
              if (filterArea && quickHighlight) {
                const rect = filterArea.getBoundingClientRect();
                quickHighlight.style.left = `${rect.left - 8}px`;
                quickHighlight.style.top = `${rect.top - 8}px`;
                quickHighlight.style.width = `${rect.width + 16}px`;
                quickHighlight.style.height = `${rect.height + 16}px`;
                quickHighlight.style.display = 'block';
                
                // Position tooltip near the filter area
                if (tooltip) {
                  tooltip.style.left = `${rect.left + 20}px`;
                  tooltip.style.top = `${rect.bottom + 10}px`;
                  tooltip.style.display = 'block';
                }
              }
            }
            
            // Position highlight initially
            setTimeout(positionQuickFilterHighlight, 100);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
              const overlay = document.getElementById('quick-filter-highlight-overlay');
              if (overlay) {
                document.body.removeChild(overlay);
              }
              // Start full filters tutorial after highlight
              setTimeout(() => {
                startFiltersTutorial();
              }, 200);
            }, 3000);
          }
          
          // Get venues that have mics today for demo suggestions
          function getTodaysVenueSuggestions() {
            const today = new Date().getDay(); // 0=Sunday, 1=Monday, etc.
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const todayName = dayNames[today];
            
            // Map days to venues that definitely have mics (prioritize West Side Comedy Club)
            const venueSchedule = {
              'Sunday': ['West Side Comedy Club', 'QED Astoria'],
              'Monday': ['West Side Comedy Club', 'QED Astoria'],
              'Tuesday': ['West Side Comedy Club', 'Comedy Shop'],
              'Wednesday': ['West Side Comedy Club', 'QED Astoria'],
              'Thursday': ['West Side Comedy Club', 'Comedy Shop'],
              'Friday': ['West Side Comedy Club', 'QED Astoria'],
              'Saturday': ['West Side Comedy Club', 'The Stand']
            };
            
            const todaysVenues = venueSchedule[todayName] || ['West Side Comedy Club', 'QED Astoria'];
            return {
              venue1: todaysVenues[0],
              venue2: todaysVenues[1] || todaysVenues[0],
              todayName: todayName
            };
          }

          // User-paced demo with optional tutorial
          function startQuickDemoWithTutorialOption() {
            console.log('[Demo] Starting comprehensive app demo');
            
            const suggestions = getTodaysVenueSuggestions();
            let currentDemoStep = 1;
            const totalSteps = 4;
            
            // Create a comprehensive demo overlay
            const demoOverlay = document.createElement('div');
            demoOverlay.id = 'quick-demo-overlay';
            demoOverlay.className = 'fixed inset-0 z-[70] pointer-events-none';
            demoOverlay.innerHTML = `
              <!-- Demo highlight that moves between elements -->
              <div id="demo-highlight" class="absolute border-4 border-yellow-400 rounded-xl shadow-[0_0_25px_rgba(251,191,36,0.9)] animate-pulse pointer-events-none" style="transition: all 0.5s ease;"></div>
              
              <!-- Demo instruction box -->
              <div id="demo-instruction-box" class="fixed top-1/2 right-8 transform -translate-y-1/2 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 shadow-2xl border-3 border-yellow-300 max-w-sm pointer-events-auto" style="z-index: 80;">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white text-lg">⚡</div>
                    <h3 class="text-xl font-black text-gray-900">App Tour</h3>
                  </div>
                  <div class="text-sm text-gray-600 font-medium">
                    <span id="demo-step">1</span>/${totalSteps}
                  </div>
                </div>
                <div id="demo-content" class="mb-6">
                  <div id="demo-title" class="text-lg font-semibold text-gray-900 mb-2">🔍 Search for venues</div>
                  <div id="demo-description" class="text-gray-700">Type "${suggestions.venue1}" or "${suggestions.venue2}" to see ${suggestions.todayName}'s mics</div>
                </div>
                <div class="flex gap-2">
                  <button id="demo-skip" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold transition-colors touch-manipulation">
                    Skip Tour
                  </button>
                  <button id="demo-prev" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors touch-manipulation" style="display: none;">
                    Previous
                  </button>
                  <button id="demo-next" class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg font-bold transition-colors touch-manipulation">
                    Next
                  </button>
                </div>
              </div>
            `;
            
            document.body.appendChild(demoOverlay);
            
            // Demo steps configuration
            const demoSteps = [
              {
                id: 'search',
                title: '🔍 Search for venues',
                description: `Type "${suggestions.venue1}" or "${suggestions.venue2}" to see ${suggestions.todayName}'s mics with live suggestions`,
                target: 'map-search-bar',
                action: () => {
                  const searchInput = document.getElementById('search-input');
                  if (searchInput) {
                    searchInput.focus();
                    searchInput.placeholder = `Try typing '${suggestions.venue1}' or '${suggestions.venue2}'...`;
                  }
                }
              },
              {
                id: 'pills',
                title: '💊 Filter pills system',
                description: 'Quick filter pills show your active filters. Click pills to modify them, or use "All Filters" for advanced options.',
                target: 'active-pills-row',
                action: () => {
                  // Highlight the pills area
                }
              },
              {
                id: 'map',
                title: '🗺️ Interactive map features',
                description: 'Click markers to see details, use map controls to zoom/locate, and see real-time status colors (happening now, starting soon).',
                target: 'map-container',
                action: () => {
                  // Highlight the map
                }
              },
              {
                id: 'sidebar',
                title: '📋 Venue cards & time pills',
                description: 'Each venue shows multiple mic times as clickable time pills. Cards show status, cost, and quick actions.',
                target: 'right-sidebar',
                action: () => {
                  // Highlight the sidebar/list area
                }
              }
            ];
            
            // Position demo highlight on target element
            function positionDemoHighlight(targetId) {
              const target = document.getElementById(targetId);
              const demoHighlight = document.getElementById('demo-highlight');
              
              console.log('[Demo] Trying to highlight:', targetId, 'Found element:', !!target);
              
              if (target && demoHighlight) {
                const rect = target.getBoundingClientRect();
                console.log('[Demo] Element rect:', rect);
                
                // Make sure the element is visible
                if (rect.width === 0 && rect.height === 0) {
                  console.warn('[Demo] Target element has no dimensions:', targetId);
                  return;
                }
                
                demoHighlight.style.left = `${rect.left - 8}px`;
                demoHighlight.style.top = `${rect.top - 8}px`;
                demoHighlight.style.width = `${rect.width + 16}px`;
                demoHighlight.style.height = `${rect.height + 16}px`;
                demoHighlight.style.display = 'block';
                demoHighlight.style.pointerEvents = 'none';
                demoHighlight.style.zIndex = '75';
                
                console.log('[Demo] Highlight positioned at:', {
                  left: demoHighlight.style.left,
                  top: demoHighlight.style.top,
                  width: demoHighlight.style.width,
                  height: demoHighlight.style.height
                });
              } else {
                console.warn('[Demo] Could not find target or highlight element:', {
                  targetId,
                  target: !!target,
                  highlight: !!demoHighlight
                });
                
                // Try alternative selectors if main ID doesn't work
                if (!target) {
                  const alternatives = {
                    'map-container': ['#map', '.leaflet-container', '#leaflet-map'],
                    'active-pills-row': ['#active-pills-row-mobile', '.mobile-pills-row', '#active-pills-row'],
                    'sidebar-container': ['#right-sidebar', '#sidebar-content', '.mic-list', '.sidebar'],
                    'map-search-bar': ['#search-input', '.search-container', '#map-search-bar'],
                    'favorites-btn-mobile': ['#favorites-btn-mobile', '.quick-action-btn[title="Show favorites"]', '#right-sidebar'],
                    'bottom-bar-mobile': ['#bottom-bar-mobile', '.bottom-bar-content', '#active-pills-row-mobile'],
                    'find-location-btn-mobile': ['#find-location-btn-mobile', '.quick-action-btn[title="Find my location"]', '#map-container']
                  };
                  
                  if (alternatives[targetId]) {
                    for (const altSelector of alternatives[targetId]) {
                      const altTarget = document.querySelector(altSelector);
                      if (altTarget) {
                        console.log('[Demo] Found alternative target:', altSelector);
                        const rect = altTarget.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                          demoHighlight.style.left = `${rect.left - 8}px`;
                          demoHighlight.style.top = `${rect.top - 8}px`;
                          demoHighlight.style.width = `${rect.width + 16}px`;
                          demoHighlight.style.height = `${rect.height + 16}px`;
                          demoHighlight.style.display = 'block';
                          demoHighlight.style.pointerEvents = 'none';
                          demoHighlight.style.zIndex = '75';
                          return;
                        }
                      }
                    }
                  }
                }
              }
            }
            
            // Update demo step
            function updateDemoStep() {
              const step = demoSteps[currentDemoStep - 1];
              document.getElementById('demo-step').textContent = currentDemoStep;
              document.getElementById('demo-title').textContent = step.title;
              document.getElementById('demo-description').textContent = step.description;
              
              // Position highlight and run step action
              positionDemoHighlight(step.target);
              if (step.action) step.action();
              
              // Update button states
              const nextBtn = document.getElementById('demo-next');
              const prevBtn = document.getElementById('demo-prev');
              const skipBtn = document.getElementById('demo-skip');
              
              // Update next button text
              nextBtn.textContent = currentDemoStep === totalSteps ? 'Start Exploring!' : 'Next';
              
              // Show/hide previous button based on current step
              if (currentDemoStep === 1) {
                prevBtn.style.display = 'none';
                skipBtn.classList.remove('flex-1');
                skipBtn.classList.add('flex-1');
              } else {
                prevBtn.style.display = 'block';
                skipBtn.classList.remove('flex-1');
                skipBtn.classList.add('flex-shrink-0');
              }
            }
            
            // Initialize first step
            updateDemoStep();
            window.addEventListener('resize', () => positionDemoHighlight(demoSteps[currentDemoStep - 1].target));
            
            // Close demo functionality
            function closeDemoOverlay() {
              const overlay = document.getElementById('quick-demo-overlay');
              if (overlay) {
                document.body.removeChild(overlay);
              }
              window.removeEventListener('resize', positionDemoHighlight);
            }
            
            // Next step handler
            document.getElementById('demo-next').addEventListener('click', function() {
              if (currentDemoStep < totalSteps) {
                currentDemoStep++;
                updateDemoStep();
              } else {
                // Tour complete
                console.log('[Demo] User completed app tour');
                closeDemoOverlay();
                localStorage.setItem('micfinder-demo-completed', 'true');
              }
            });
            
            // Previous step handler
            document.getElementById('demo-prev').addEventListener('click', function() {
              if (currentDemoStep > 1) {
                currentDemoStep--;
                updateDemoStep();
              }
            });
            
            // Skip tour handler
            document.getElementById('demo-skip').addEventListener('click', function() {
              console.log('[Demo] User skipped app tour');
              closeDemoOverlay();
              localStorage.setItem('micfinder-demo-skipped', 'true');
            });
          }
          
          // Quick Demo Function
          function startQuickDemo() {
            console.log('[Demo] Starting quick interactive demo');
            
            // Create a simplified demo overlay
            const demoOverlay = document.createElement('div');
            demoOverlay.id = 'quick-demo-overlay';
            demoOverlay.className = 'fixed inset-0 z-[70] pointer-events-none';
            demoOverlay.innerHTML = `
              <!-- Demo highlight for search bar -->
              <div id="demo-search-highlight" class="absolute border-4 border-yellow-400 rounded-full shadow-[0_0_25px_rgba(251,191,36,0.9)] animate-pulse pointer-events-none" style="transition: all 0.3s ease;"></div>
              
              <!-- Demo instruction box -->
              <div id="demo-instruction-box" class="fixed top-1/2 right-8 transform -translate-y-1/2 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 shadow-2xl border-3 border-yellow-300 max-w-sm pointer-events-auto" style="z-index: 80;">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white text-lg">⚡</div>
                  <h3 class="text-xl font-black text-gray-900">Quick Demo</h3>
                </div>
                <div id="demo-content" class="mb-6">
                  <div class="text-lg font-semibold text-gray-900 mb-2">Try typing in the search bar!</div>
                  <div class="text-gray-700">Type "QED Astoria" or "West Side" to see live results</div>
                </div>
                <button id="end-demo" class="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-xl font-bold transition-colors touch-manipulation">
                  Got it, let me explore!
                </button>
              </div>
            `;
            
            document.body.appendChild(demoOverlay);
            
            // Position demo highlight on search bar
            function positionDemoHighlight() {
              const searchBar = document.getElementById('map-search-bar');
              const demoHighlight = document.getElementById('demo-search-highlight');
              
              if (searchBar && demoHighlight) {
                const rect = searchBar.getBoundingClientRect();
                demoHighlight.style.left = `${rect.left - 12}px`;
                demoHighlight.style.top = `${rect.top - 12}px`;
                demoHighlight.style.width = `${rect.width + 24}px`;
                demoHighlight.style.height = `${rect.height + 24}px`;
                demoHighlight.style.display = 'block';
              }
            }
            
            // Position highlight initially and on resize
            setTimeout(positionDemoHighlight, 100);
            window.addEventListener('resize', positionDemoHighlight);
            
            // Auto-focus search input for immediate interaction
            setTimeout(() => {
              const searchInput = document.getElementById('search-input');
              if (searchInput) {
                searchInput.focus();
                // Add a subtle placeholder animation
                searchInput.placeholder = "Try typing 'QED Astoria' or 'West Side'...";
              }
            }, 200);
            
            // Close demo functionality
            function closeDemoTutorial() {
              const overlay = document.getElementById('quick-demo-overlay');
              if (overlay) {
                document.body.removeChild(overlay);
              }
              window.removeEventListener('resize', positionDemoHighlight);
            }
            
            // Add close event listener
            document.getElementById('end-demo').addEventListener('click', closeDemoTutorial);
            
            // Auto-close after 10 seconds
            setTimeout(closeDemoTutorial, 10000);
          }
          
          // Mobile optimization enhancements
          function optimizeForMobile() {
            const isMobile = window.innerWidth <= 768;
            const introOverlay = document.getElementById('intro-overlay');
            
            if (isMobile && introOverlay) {
              // Adjust padding and sizing for mobile
              const introContent = introOverlay.querySelector('.bg-white');
              if (introContent) {
                introContent.classList.add('mx-2', 'px-6', 'py-8');
                introContent.classList.remove('p-10');
                
                // Reduce font sizes on mobile
                const title = introContent.querySelector('#dynamic-welcome-title');
                const features = introContent.querySelectorAll('.text-xl');
                
                if (title) {
                  title.classList.remove('text-4xl');
                  title.classList.add('text-3xl');
                }
                
                features.forEach(feature => {
                  if (feature.classList.contains('text-xl')) {
                    feature.classList.remove('text-xl');
                    feature.classList.add('text-lg');
                  }
                });
              }
            }
          }
          
          // Apply mobile optimizations
          optimizeForMobile();
          window.addEventListener('resize', optimizeForMobile);
          
          // Show intro button functionality
          if (showIntroBtn) {
            showIntroBtn.addEventListener('click', function(e) {
              console.log('[Intro] Help button clicked');
              e.preventDefault();
              e.stopPropagation();
              showIntro();
            });
          }
          
          // Also close on overlay click (outside modal)
          if (introOverlay) {
            introOverlay.addEventListener('click', function(e) {
              if (e.target === introOverlay) {
                console.log('[Intro] Overlay background clicked');
                hideIntro();
              }
            });
          }
        });
        
        // Filter modal system will be initialized by app.js
        // Removed duplicate initializeApp() call to prevent conflicts
