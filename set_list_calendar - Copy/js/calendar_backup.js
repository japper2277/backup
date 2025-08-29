// Calendar JavaScript - Extracted from set_list_Calendar.html

document.addEventListener('DOMContentLoaded', () => {

    // --- ACTION PLAN 1.2: ABSTRACT DATA LAYER ---
    // All data-related logic is now contained within this object.
    const dataStore = {
        sets: [], // The main data array is now inside the store

        // Method to load data from localStorage or use defaults
        load() {
            const savedData = localStorage.getItem('micCalendarSets');
            if (savedData) {
                this.sets = JSON.parse(savedData);
            } else {
                // Default data if nothing is saved
                this.sets = [
                    { id: 1, date: '2025-06-15', title: 'Open Mic', venue: 'The Laugh Factory', eventType: 'green', setlist: 'Airplane food joke', notes: 'Good crowd.' },
                    { id: 2, date: '2025-06-15', title: 'Showcase', venue: 'The Comedy Store', eventType: 'blue', setlist: 'Cat joke\nDog joke', notes: '' },
                    { id: 3, date: '2025-06-16', title: 'Corporate Gig', venue: 'Microsoft HQ', eventType: 'orange', setlist: 'Clean material only', notes: 'Paid well.' },
                    { id: 4, date: '2025-06-18', title: 'Late Show', venue: 'The Comedy Cellar', eventType: 'red', setlist: 'New 5 minutes', notes: 'Felt a bit rusty.' },
                    { id: 5, date: '2025-06-20', title: 'Weekend Special', venue: 'The Comedy Store', eventType: 'blue', setlist: 'Best 10 minutes', notes: 'Killed it.' },
                    { id: 6, date: '2025-07-04', title: 'July 4th Bash', venue: 'Town Hall', eventType: 'orange', setlist: 'Patriotic humor', notes: 'Fireworks were loud.' },
                ];
            }
        },

        // Method to save the current data to localStorage
        save() {
            localStorage.setItem('micCalendarSets', JSON.stringify(this.sets));
        },

        // Method to get all sets
        getAllSets() {
            return this.sets;
        },

        // Method to get a single set by its ID
        getSetById(id) {
            return this.sets.find(set => set.id === id);
        },

        // Method to add a new set
        addSet(setData) {
            setData.id = Date.now(); // Simple unique ID
            this.sets.push(setData);
            this.save(); // Save after adding
        },

        // Method to update an existing set
        updateSet(id, updatedData) {
            const index = this.sets.findIndex(s => s.id === id);
            if (index !== -1) {
                this.sets[index] = { ...this.sets[index], ...updatedData };
                this.save(); // Save after updating
            }
        },

        // Method to delete a set
        deleteSet(id) {
            this.sets = this.sets.filter(set => set.id !== id);
            this.save(); // Save after deleting
        }
    };

    // --- INITIALIZE DATA ---
    dataStore.load(); // Load data on start

    // --- STATE MANAGEMENT ---
    let currentWeek = new Date(); // Start with the current date
    let isExpandedView = false;
    let set_to_delete = null;

    // --- DOM ELEMENT REFERENCES ---
    const calendarContainer = document.getElementById('calendarContainer');
    const calendarGrid = document.getElementById('calendarGrid');
    const dateRangeEl = document.getElementById('dateRange');
    const venueSearch = document.getElementById('venueSearch');
    const typeFilter = document.getElementById('typeFilter');
    const contextMenu = document.getElementById('event-context-menu');
    
    // Modals
    const addEditModal = document.getElementById('add-edit-modal');
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const eventSummaryModal = document.getElementById('event-summary-modal');
    const micSelectionModal = document.getElementById('mic-selection-modal');
    const setForm = document.getElementById('setForm');
    const formTitle = document.getElementById('formTitle');
    const setIdInput = document.getElementById('setId');
    
    // Mic selection elements
    const micSearch = document.getElementById('micSearch');
    const dayFilter = document.getElementById('dayFilter');
    const micsList = document.getElementById('micsList');

    // --- RENDER FUNCTION ---
    function renderCalendar() {
        calendarGrid.innerHTML = ''; // Clear the grid
        const today = new Date();
        today.setHours(0,0,0,0);

        let viewDate = new Date(currentWeek);
        
        // Determine start and end of the week/month
        let startDate, endDate;
        if(isExpandedView) {
            startDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
            endDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
            dateRangeEl.textContent = viewDate.toLocaleDateString('en-us', { month: 'long', year: 'numeric' });
            calendarGrid.style.gridTemplateRows = `repeat(${Math.ceil((endDate.getDate() + startDate.getDay()) / 7)}, 1fr)`;
        } else {
            let dayOfWeek = viewDate.getDay();
            startDate = new Date(viewDate);
            startDate.setDate(viewDate.getDate() - dayOfWeek);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            dateRangeEl.textContent = `${startDate.toLocaleDateString('en-us', { month: 'short', day: 'numeric' })} – ${endDate.toLocaleDateString('en-us', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }

        // Enhanced filtering
        const venueQuery = venueSearch.value.toLowerCase();
        const typeQuery = typeFilter.value;
        const dateFrom = document.getElementById('dateFrom')?.value;
        const dateTo = document.getElementById('dateTo')?.value;
        const minJokes = parseInt(document.getElementById('minJokes')?.value) || 0;

        // --- ACTION PLAN 1.2 --- Using the new dataStore method to get data
        const filteredSets = dataStore.getAllSets().filter(set => {
            // Enhanced search - venue, notes, setlist
            const searchMatch = venueQuery === '' || 
                set.venue.toLowerCase().includes(venueQuery) ||
                (set.notes && set.notes.toLowerCase().includes(venueQuery)) ||
                (set.setlist && set.setlist.toLowerCase().includes(venueQuery));
            
            const typeMatch = typeQuery === 'all' || set.eventType === typeQuery;
            
            // Date range filtering
            const setDate = new Date(set.date);
            const fromMatch = !dateFrom || setDate >= new Date(dateFrom);
            const toMatch = !dateTo || setDate <= new Date(dateTo);
            
            // Minimum jokes filtering
            const jokeCount = set.setlist ? set.setlist.split('\\n').filter(line => line.trim()).length : 0;
            const jokesMatch = jokeCount >= minJokes;
            
            return searchMatch && typeMatch && fromMatch && toMatch && jokesMatch;
        });

        // Create day cells
        let dayCells = {};
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateString = d.toISOString().split('T')[0];
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell';
            dayCell.dataset.date = dateString;

            if (d.getTime() === today.getTime()) {
                dayCell.classList.add('is-today');
            }

            dayCell.innerHTML = `
                <div class="day-name">${d.toLocaleDateString('en-us', { weekday: 'short' })}</div>
                <div class="day-number">${d.getDate()}</div>
                <div class="events-container"></div>
            `;
            calendarGrid.appendChild(dayCell);
            dayCells[dateString] = dayCell;
        }
        
        // If month view, add empty cells for padding
        if(isExpandedView) {
            for(let i=0; i<startDate.getDay(); i++) {
                calendarGrid.prepend(document.createElement('div'));
            }
        }
        
        // Populate events with enhanced information
        filteredSets.forEach(set => {
            if (dayCells[set.date]) {
                const eventsContainer = dayCells[set.date].querySelector('.events-container');
                const eventPill = document.createElement('div');
                eventPill.className = `event-pill event-${set.eventType}`;
                eventPill.dataset.setId = set.id;
                
                // Create enhanced event content
                const eventTitle = document.createElement('div');
                eventTitle.className = 'event-title';
                eventTitle.textContent = set.title;
                
                const eventDetails = document.createElement('div');
                eventDetails.className = 'event-details';
                
                // Venue detail
                if (set.venue) {
                    const venueDetail = document.createElement('div');
                    venueDetail.className = 'event-detail';
                    venueDetail.innerHTML = `<i class="fas fa-map-marker-alt"></i><span>${set.venue}</span>`;
                    eventDetails.appendChild(venueDetail);
                }
                
                // Setlist count detail (if setlist exists)
                if (set.setlist && set.setlist.trim()) {
                    const jokeCount = set.setlist.split('\n').filter(line => line.trim()).length;
                    const setlistDetail = document.createElement('div');
                    setlistDetail.className = 'event-detail';
                    setlistDetail.innerHTML = `<i class="fas fa-list"></i><span>${jokeCount} jokes</span>`;
                    eventDetails.appendChild(setlistDetail);
                }
                
                // Notes preview (if notes exist)
                if (set.notes && set.notes.trim()) {
                    const notesPreview = set.notes.length > 20 ? set.notes.substring(0, 20) + '...' : set.notes;
                    const notesDetail = document.createElement('div');
                    notesDetail.className = 'event-detail';
                    notesDetail.innerHTML = `<i class="fas fa-sticky-note"></i><span>${notesPreview}</span>`;
                    eventDetails.appendChild(notesDetail);
                }
                
                eventPill.appendChild(eventTitle);
                eventPill.appendChild(eventDetails);
                eventsContainer.appendChild(eventPill);
            }
        });
    }
    
    // --- EVENT SUMMARY FUNCTION ---
    function showEventSummary(set) {
        const summaryContent = document.getElementById('summaryContent');
        
        // Get type labels and colors
        const typeLabels = {
            'blue': 'Showcase',
            'green': 'Open Mic', 
            'orange': 'Corporate / Private',
            'red': 'Late Night'
        };
        
        const typeColors = {
            'blue': 'var(--accent-blue)',
            'green': 'var(--accent-green)',
            'orange': 'var(--accent-orange)', 
            'red': 'var(--accent-red)'
        };
        
        summaryContent.innerHTML = `
            <form id="summaryForm" data-set-id="${set.id}">
                <div class="summary-header">
                    <input type="text" id="summary-title" class="summary-title-input" value="${set.title}" placeholder="Event Title">
                    <select id="summary-type" class="summary-type-select" style="background-color: ${typeColors[set.eventType]}">
                        <option value="blue" ${set.eventType === 'blue' ? 'selected' : ''}>Showcase</option>
                        <option value="green" ${set.eventType === 'green' ? 'selected' : ''}>Open Mic</option>
                        <option value="orange" ${set.eventType === 'orange' ? 'selected' : ''}>Corporate / Private</option>
                        <option value="red" ${set.eventType === 'red' ? 'selected' : ''}>Late Night</option>
                    </select>
                </div>
                
                <div class="summary-details">
                    <div class="summary-field">
                        <div class="summary-field-label">Venue</div>
                        <input type="text" id="summary-venue" class="summary-field-input" value="${set.venue}" placeholder="Venue name">
                    </div>
                    <div class="summary-field">
                        <div class="summary-field-label">Date</div>
                        <input type="date" id="summary-date" class="summary-field-input" value="${set.date}">
                    </div>
                </div>
                
                <div class="summary-setlist">
                    <div class="summary-field-label">Setlist</div>
                    <textarea id="summary-setlist" class="summary-textarea" placeholder="Enter setlist (one joke per line)">${set.setlist || ''}</textarea>
                </div>
                
                <div class="summary-notes">
                    <div class="summary-field-label">Performance Notes</div>
                    <textarea id="summary-notes" class="summary-textarea" placeholder="Enter performance notes">${set.notes || ''}</textarea>
                </div>
                
                <div class="summary-actions">
                    <button type="button" class="form-btn btn-secondary" id="summary-cancel">Cancel</button>
                    <button type="submit" class="form-btn btn-primary">Save Changes</button>
                </div>
            </form>
        `;
        
        // Add event listeners for the summary form
        const summaryForm = document.getElementById('summaryForm');
        const summaryCancel = document.getElementById('summary-cancel');
        const summaryType = document.getElementById('summary-type');
        
        // Update type select background color when changed
        summaryType.addEventListener('change', function() {
            this.style.backgroundColor = typeColors[this.value];
        });
        
        // Cancel button closes modal
        summaryCancel.addEventListener('click', () => {
            closeModal(eventSummaryModal);
        });
        
        // Form submission saves changes
        summaryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveSummaryChanges();
        });
        
        openModal(eventSummaryModal);
    }
    
    // --- SAVE SUMMARY CHANGES ---
    function saveSummaryChanges() {
        const form = document.getElementById('summaryForm');
        const setId = parseInt(form.dataset.setId, 10);
        
        const updatedData = {
            title: document.getElementById('summary-title').value,
            venue: document.getElementById('summary-venue').value,
            date: document.getElementById('summary-date').value,
            eventType: document.getElementById('summary-type').value,
            setlist: document.getElementById('summary-setlist').value,
            notes: document.getElementById('summary-notes').value
        };

        // --- ACTION PLAN 1.2 --- Using the new dataStore method to update data
        dataStore.updateSet(setId, updatedData);
        
        // Close modal and refresh calendar
        closeModal(eventSummaryModal);
        renderCalendar();
    }
    
    // --- MODAL & MENU LOGIC ---
    function openModal(modal) { 
        modal.classList.add('is-visible');
        
        // Set focus to first focusable element in modal after a brief delay
        setTimeout(() => {
            const focusableElements = modal.querySelectorAll('input, select, button, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }, 100);
        
        // Trap focus within modal
        modal.setAttribute('aria-modal', 'true');
    }
    
    function closeModal(modal) { 
        modal.classList.remove('is-visible');
        modal.removeAttribute('aria-modal');
        
        // Return focus to trigger element if it was the add mic button
        if (modal.id === 'mic-selection-modal') {
            document.getElementById('addMicBtn').focus();
        }
    }

    document.querySelectorAll('.modal-overlay, .modal-close-btn, .modal-cancel-btn').forEach(el => {
        el.addEventListener('click', () => {
            const modal = el.closest('.modal-container');
            closeModal(modal);
        });
    });
    
    // --- MIC DATA AND FUNCTIONS ---
    let allMics = [];
    let filteredMics = [];
    let cachedMicData = null;
    let dataLoadPromise = null;
    let lastFilterState = { search: '', day: 'all' };
    let recentlyUsedMics = JSON.parse(localStorage.getItem('recentlyUsedMics') || '[]');

    // Function to load mic data from CSV (same logic as main app)
    function loadMicsFromCSV(callback) {
        Papa.parse('coordinates.csv', {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                const processedMics = results.data.map((row, index) => {
                    // Process the CSV data to match the expected format
                    return {
                        id: `mic-${index}`,
                        venue: row['Venue Name'] || row.venue || '',
                        address: row['Location'] || row.address || '',
                        borough: row['Borough'] || row.borough || '',
                        neighborhood: row['Neighborhood'] || row.neighborhood || '',
                        day: row['Day'] || row.day || '',
                        time: row['Start Time'] || row.time || '',
                        signupTime: row['Sign-Up Instructions'] || row.signupTime || '',
                        host: row['Host(s) / Organizer'] || row.host || '',
                        details: row['Other Rules'] || row.details || '',
                        cost: row['Cost'] || row.cost || 'Free',
                        signup: row['Sign-Up Instructions'] || row.signup || '',
                        lat: parseFloat(row['Geocodio Latitude'] || row.lat || 0),
                        lon: parseFloat(row['Geocodio Longitude'] || row.lon || 0),
                        isFree: (row['Cost'] || row.cost || 'Free').toLowerCase().includes('free'),
                        hasSignup: !!(row['Sign-Up Instructions'] || row.signupTime)
                    };
                }).filter(mic => mic.venue && mic.day); // Filter out invalid entries
                
                callback(processedMics);
            },
            error: function(error) {
                console.error('Error loading CSV:', error);
                callback([]);
            }
        });
    }

    function loadMicData() {
        // Return cached data if available
        if (cachedMicData) {
            allMics = cachedMicData;
            filteredMics = [...allMics];
            restoreFilterState();
            renderMicsList();
            return Promise.resolve();
        }
        
        // Return existing promise if data is already loading
        if (dataLoadPromise) {
            return dataLoadPromise;
        }
        
        // Create new loading promise
        dataLoadPromise = new Promise((resolve) => {
            // Try to get data from main app state if available
            if (window.MicFinderState && typeof window.MicFinderState.getAllMics === 'function') {
                const mainAppMics = window.MicFinderState.getAllMics();
                if (mainAppMics && mainAppMics.length > 0) {
                    cachedMicData = mainAppMics;
                    allMics = cachedMicData;
                    filteredMics = [...allMics];
                    restoreFilterState();
                    renderMicsList();
                    resolve(cachedMicData);
                    return;
                }
            }
            
            // Try to load from main app's loader function
            if (window.loadMicData && typeof window.loadMicData === 'function') {
                window.loadMicData((mics) => {
                    cachedMicData = mics || [];
                    allMics = cachedMicData;
                    filteredMics = [...allMics];
                    restoreFilterState();
                    renderMicsList();
                    resolve(cachedMicData);
                });
                return;
            }
            
            // Fallback: Load directly from CSV
            loadMicsFromCSV((mics) => {
                cachedMicData = mics || [];
                allMics = cachedMicData;
                filteredMics = [...allMics];
                restoreFilterState();
                renderMicsList();
                resolve(cachedMicData);
            });
        });
        
        return dataLoadPromise;
    }

    function saveFilterState() {
        lastFilterState = {
            search: micSearch.value,
            day: dayFilter.value
        };
    }
    
    function restoreFilterState() {
        if (micSearch) micSearch.value = lastFilterState.search;
        if (dayFilter) dayFilter.value = lastFilterState.day;
        if (lastFilterState.search || lastFilterState.day !== 'all') {
            filterMics();
        }
    }

    function setSmartDefaultFilters() {
        // Auto-filter to current day of week if no previous filter state
        if (lastFilterState.day === 'all' && !lastFilterState.search) {
            const today = new Date();
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const currentDay = daysOfWeek[today.getDay()];
            
            if (dayFilter) dayFilter.value = currentDay;
            lastFilterState.day = currentDay;
        }
    }

    function addToRecentlyUsed(micId) {
        // Add to front of array, remove duplicates, limit to 5 items
        recentlyUsedMics = [micId, ...recentlyUsedMics.filter(id => id !== micId)].slice(0, 5);
        localStorage.setItem('recentlyUsedMics', JSON.stringify(recentlyUsedMics));
    }

    function getRecentlyUsedMics() {
        return recentlyUsedMics
            .map(id => allMics.find(mic => mic.id === id))
            .filter(mic => mic && filteredMics.includes(mic));
    }

    function applyQuickFilter(filter) {
        const today = new Date();
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        switch (filter) {
            case 'today':
                dayFilter.value = daysOfWeek[today.getDay()];
                micSearch.value = '';
                break;
            case 'tomorrow':
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                dayFilter.value = daysOfWeek[tomorrow.getDay()];
                micSearch.value = '';
                break;
            case 'free':
                dayFilter.value = 'all';
                micSearch.value = '$0';
                break;
            case 'popular':
                // Filter for venues that might be in Manhattan or popular areas
                dayFilter.value = 'all';
                micSearch.value = 'Manhattan';
                break;
            case 'clear':
                dayFilter.value = 'all';
                micSearch.value = '';
                break;
        }
        
        // Update filter state and trigger filtering
        saveFilterState();
        filterMics();
    }

    function filterMics() {
        const searchTerm = micSearch.value.toLowerCase();
        const selectedDay = dayFilter.value;
        
        // Save filter state
        saveFilterState();
        
        filteredMics = allMics.filter(mic => {
            const matchesSearch = mic.venue.toLowerCase().includes(searchTerm) || 
                                (mic.address && mic.address.toLowerCase().includes(searchTerm)) ||
                                (mic.borough && mic.borough.toLowerCase().includes(searchTerm)) ||
                                (mic.neighborhood && mic.neighborhood.toLowerCase().includes(searchTerm)) ||
                                (mic.host && mic.host.toLowerCase().includes(searchTerm));
            const matchesDay = selectedDay === 'all' || mic.day === selectedDay;
            return matchesSearch && matchesDay;
        });
        
        renderMicsList();
    }

    function renderMicsList() {
        if (filteredMics.length === 0) {
            micsList.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">No mics found. Try adjusting your filters or check if data is loading.</div>';
            return;
        }
        
        // Check if we should show Today's Mics section
        const today = new Date();
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = daysOfWeek[today.getDay()];
        const isViewingToday = Math.abs(today.getTime() - currentWeek.getTime()) < 24 * 60 * 60 * 1000;
        
        let sectionsHTML = '';
        
        // Get recently used mics that match current filters
        const recentMics = getRecentlyUsedMics();
        
        // Show recently used section if we have any and no specific search
        if (recentMics.length > 0 && !lastFilterState.search && dayFilter.value === 'all') {
            sectionsHTML += `
                <div class="mic-section">
                    <div class="mic-section-header">
                        <i class="fas fa-history"></i> Recently Used
                    </div>
                    ${recentMics.map(mic => renderMicItem(mic)).join('')}
                </div>
            `;
        }
        
        if (isViewingToday && dayFilter.value === 'all') {
            // Separate today's mics from others (excluding recently used)
            const todaysMics = filteredMics.filter(mic => mic.day === todayName && !recentMics.includes(mic));
            const otherMics = filteredMics.filter(mic => mic.day !== todayName && !recentMics.includes(mic));
            
            if (todaysMics.length > 0) {
                sectionsHTML += `
                    <div class="mic-section">
                        <div class="mic-section-header">
                            <i class="fas fa-star"></i> Today's Mics
                        </div>
                        ${todaysMics.map(mic => renderMicItem(mic)).join('')}
                    </div>
                `;
            }
            
            if (otherMics.length > 0) {
                sectionsHTML += `
                    <div class="mic-section">
                        <div class="mic-section-header">
                            <i class="fas fa-calendar-alt"></i> Other Days
                        </div>
                        ${otherMics.map(mic => renderMicItem(mic)).join('')}
                    </div>
                `;
            }
        } else {
            // Regular list view (excluding recently used if they're shown above)
            const regularMics = recentMics.length > 0 && !lastFilterState.search && dayFilter.value === 'all' 
                ? filteredMics.filter(mic => !recentMics.includes(mic))
                : filteredMics;
            
            if (regularMics.length > 0) {
                sectionsHTML += regularMics.map(mic => renderMicItem(mic)).join('');
            }
        }
        
        micsList.innerHTML = sectionsHTML;
    }

    function renderMicItem(mic) {
        return `
            <div class="mic-item" data-mic-id="${mic.id}" role="button" tabindex="0" aria-label="Select ${mic.venue}">
                <div class="mic-info">
                    <div class="mic-venue">${mic.venue}</div>
                    <div class="mic-details">
                        <span><i class="fas fa-calendar-day"></i> ${mic.day}</span>
                        <span><i class="fas fa-clock"></i> ${mic.time}</span>
                        <span><i class="fas fa-dollar-sign"></i> ${mic.cost}</span>
                        ${mic.host ? `<span><i class="fas fa-user"></i> ${mic.host}</span>` : ''}
                        ${mic.borough ? `<span><i class="fas fa-map-marker-alt"></i> ${mic.borough}</span>` : ''}
                        ${mic.neighborhood ? `<span><i class="fas fa-map-pin"></i> ${mic.neighborhood}</span>` : ''}
                    </div>
                    ${mic.signupTime ? `<div class="mic-details" style="margin-top: 0.25rem;"><span><i class="fas fa-clipboard-list"></i> ${mic.signupTime}</span></div>` : ''}
                </div>
                <div class="mic-select-indicator">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `;
    }

    function selectMic(micId) {
        const selectedMic = allMics.find(mic => mic.id === micId);
        if (!selectedMic) return;
        
        // Add to recently used
        addToRecentlyUsed(micId);
        
        // Close mic selection modal
        closeModal(micSelectionModal);
        
        // Pre-populate the add set form
        formTitle.textContent = 'Log New Set from Mic';
        setForm.reset();
        setIdInput.value = '';
        
        // Fill in venue name
        document.getElementById('venue').value = selectedMic.venue;
        
        // Set event title to "Open Mic" by default
        document.getElementById('event-title').value = 'Open Mic';
        
        // Set event type to open mic (green)
        document.getElementById('event-type').value = 'green';
        
        // Calculate next date for this day of week
        const today = new Date();
        const targetDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(selectedMic.day);
        const daysUntilTarget = (targetDay - today.getDay() + 7) % 7;
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
        
        document.getElementById('date').value = nextDate.toISOString().split('T')[0];
        
        // Open the add set modal
        openModal(addEditModal);
    }

    // --- EVENT LISTENERS ---
    document.getElementById('addSetBtn').addEventListener('click', () => {
        formTitle.textContent = 'Log a New Set';
        setForm.reset();
        setIdInput.value = '';
        openModal(addEditModal);
    });

    document.getElementById('addMicBtn').addEventListener('click', () => {
        openModal(micSelectionModal);
        
        // Show loading state
        micsList.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-secondary);"><i class="fas fa-spinner fa-spin"></i> Loading mics...</div>';
        
        // Set smart defaults before loading data
        setSmartDefaultFilters();
        
        // Load data
        loadMicData();
    });

    micSearch.addEventListener('input', filterMics);
    dayFilter.addEventListener('change', filterMics);
    
    // Quick filter chips functionality
    const quickFilters = document.querySelector('.quick-filters');
    if (quickFilters) {
        quickFilters.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-chip')) {
                const filter = e.target.dataset.filter;
                applyQuickFilter(filter);
                
                // Update active state
                document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
                if (filter !== 'clear') {
                    e.target.classList.add('active');
                }
            }
        });
    }
    
    // Event listener for mic selection (entire card clickable)
    if (micsList) {
        micsList.addEventListener('click', (e) => {
            const micItem = e.target.closest('.mic-item');
            if (micItem) {
                const micId = micItem.dataset.micId;
                selectMic(micId);
            }
        });
        
        // Keyboard support for mic selection
        micsList.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const micItem = e.target.closest('.mic-item');
                if (micItem) {
                    e.preventDefault();
                    const micId = micItem.dataset.micId;
                    selectMic(micId);
                }
            }
        });
    }
    
    document.getElementById('expandBtn').addEventListener('click', () => {
        isExpandedView = !isExpandedView;
        calendarContainer.classList.toggle('is-expanded');
        const icon = document.getElementById('expandBtn').querySelector('i');
        icon.className = isExpandedView ? 'fas fa-compress' : 'fas fa-expand';
        renderCalendar();
    });

    document.getElementById('prevWeekBtn').addEventListener('click', () => {
        if(isExpandedView) currentWeek.setMonth(currentWeek.getMonth() - 1);
        else currentWeek.setDate(currentWeek.getDate() - 7);
        renderCalendar();
    });

    document.getElementById('nextWeekBtn').addEventListener('click', () => {
         if(isExpandedView) currentWeek.setMonth(currentWeek.getMonth() + 1);
        else currentWeek.setDate(currentWeek.getDate() + 7);
        renderCalendar();
    });

    document.getElementById('todayBtn').addEventListener('click', () => {
        currentWeek = new Date();
        renderCalendar();
    });

    
    // Navigation buttons
    document.getElementById('mapNavBtn')?.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    document.getElementById('calendarNavBtn')?.addEventListener('click', () => {
        // Already on calendar - could show feedback or do nothing
    });
    
    // View toggle functionality
    let currentView = 'week';
    
    document.getElementById('weekViewBtn').addEventListener('click', () => {
        setActiveView('week');
        isExpandedView = false;
        calendarContainer.classList.remove('is-expanded');
        const expandIcon = document.getElementById('expandBtn').querySelector('i');
        expandIcon.className = 'fas fa-expand';
        renderCalendar();
    });
    
    document.getElementById('monthViewBtn').addEventListener('click', () => {
        setActiveView('month');
        isExpandedView = true;
        calendarContainer.classList.add('is-expanded');
        const expandIcon = document.getElementById('expandBtn').querySelector('i');
        expandIcon.className = 'fas fa-compress';
        renderCalendar();
    });
    
    document.getElementById('listViewBtn').addEventListener('click', () => {
        setActiveView('list');
        showListView();
    });
    
    function setActiveView(view) {
        currentView = view;
        document.querySelectorAll('.view-toggle-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${view}ViewBtn`).classList.add('active');
    }
    
    function showListView() {
        const venueQuery = venueSearch.value.toLowerCase();
        const typeQuery = typeFilter.value;
        
        // --- ACTION PLAN 1.2 --- Using the new dataStore method to get data
        const filteredSets = dataStore.getAllSets().filter(set => {
            const venueMatch = set.venue.toLowerCase().includes(venueQuery);
            const typeMatch = typeQuery === 'all' || set.eventType === typeQuery;
            return venueMatch && typeMatch;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const listHTML = filteredSets.map(set => {
            const date = new Date(set.date);
            const jokeCount = set.setlist ? set.setlist.split('\\n').filter(line => line.trim()).length : 0;
            const typeLabels = {
                'blue': 'Showcase',
                'green': 'Open Mic',
                'orange': 'Corporate / Private',
                'red': 'Late Night'
            };
            
            return `
                <div class="list-item event-${set.eventType}" data-set-id="${set.id}" style="margin-bottom: 1rem; padding: 1rem; background: var(--bg-surface-2); border-radius: 8px; cursor: pointer; border-left: 4px solid;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                        <h4 style="margin: 0; font-size: 1.1rem; font-weight: 600;">${set.title}</h4>
                        <span style="font-size: 0.8rem; padding: 0.25rem 0.75rem; background: var(--accent-blue); color: white; border-radius: 12px;">${typeLabels[set.eventType]}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">
                        <div><i class="fas fa-calendar"></i> ${date.toLocaleDateString()}</div>
                        <div><i class="fas fa-map-marker-alt"></i> ${set.venue}</div>
                        ${jokeCount > 0 ? `<div><i class="fas fa-list"></i> ${jokeCount} jokes</div>` : ''}
                        ${set.notes ? `<div><i class="fas fa-sticky-note"></i> ${set.notes.length > 50 ? set.notes.substring(0, 50) + '...' : set.notes}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        calendarGrid.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 1rem 0;">
                <h3 style="margin-bottom: 1rem; color: var(--text-primary);">All Sets (${filteredSets.length})</h3>
                ${listHTML || '<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">No sets found</div>'}
            </div>
        `;
        
        // Add click handlers for list items
        document.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', () => {
                const setId = parseInt(item.dataset.setId, 10);
                // --- ACTION PLAN 1.2 --- Using the new dataStore method to get data
                const set = dataStore.getSetById(setId);
                if (set) {
                    // Open the same edit form as "Add Set"
                    formTitle.textContent = 'Edit Set';
                    setIdInput.value = set.id;
                    document.getElementById('event-title').value = set.title;
                    document.getElementById('venue').value = set.venue;
                    document.getElementById('date').value = set.date;
                    document.getElementById('event-type').value = set.eventType;
                    document.getElementById('setlist').value = set.setlist || '';
                    document.getElementById('notes').value = set.notes || '';
                    openModal(addEditModal);
                }
            });
        });
    }
    
    // Bottom navigation handlers
    document.getElementById('statsNavBtn')?.addEventListener('click', () => {
        showStatsModal();
    });
    
    document.getElementById('settingsNavBtn')?.addEventListener('click', () => {
        showSettingsModal();
    });
    
    function showStatsModal() {
        // --- ACTION PLAN 1.2 --- Using the new dataStore method to get data
        const allSets = dataStore.getAllSets();
        const totalSets = allSets.length;
        const venues = [...new Set(allSets.map(s => s.venue))];
        const totalJokes = allSets.reduce((total, set) => {
            return total + (set.setlist ? set.setlist.split('\\n').filter(line => line.trim()).length : 0);
        }, 0);
        
        const statsHTML = `
            <h3>Performance Statistics</h3>
            <div style="display: grid; gap: 1rem; margin: 2rem 0;">
                <div style="text-align: center; padding: 1rem; background: var(--bg-surface-2); border-radius: 8px;">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--accent-blue);">${totalSets}</div>
                    <div style="color: var(--text-secondary);">Total Sets</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--bg-surface-2); border-radius: 8px;">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--accent-green);">${venues.length}</div>
                    <div style="color: var(--text-secondary);">Venues Performed</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--bg-surface-2); border-radius: 8px;">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--accent-orange);">${totalJokes}</div>
                    <div style="color: var(--text-secondary);">Total Jokes</div>
                </div>
            </div>
            <button onclick="closeModal(eventSummaryModal)" style="width: 100%; padding: 0.75rem; background: var(--accent-blue); color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button>
        `;
        
        document.getElementById('summaryContent').innerHTML = statsHTML;
        openModal(eventSummaryModal);
    }
    
    function showSettingsModal() {
        const settingsHTML = `
            <h3>Settings</h3>
            <div style="margin: 2rem 0;">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Default View</label>
                    <select style="width: 100%; padding: 0.5rem; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
                        <option value="week">Week View</option>
                        <option value="month">Month View</option>
                        <option value="list">List View</option>
                    </select>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Theme</label>
                    <select style="width: 100%; padding: 0.5rem; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
                        <option value="dark">Dark Mode</option>
                        <option value="light">Light Mode</option>
                    </select>
                </div>
            </div>
            <button onclick="closeModal(eventSummaryModal)" style="width: 100%; padding: 0.75rem; background: var(--accent-blue); color: white; border: none; border-radius: 6px; cursor: pointer;">Save Settings</button>
        `;
        
        document.getElementById('summaryContent').innerHTML = settingsHTML;
        openModal(eventSummaryModal);
    }
    
    // Enhanced search functionality
    venueSearch.addEventListener('input', renderCalendar);
    typeFilter.addEventListener('change', renderCalendar);
    
    // Advanced search toggle
    document.getElementById('advancedSearchToggle').addEventListener('click', () => {
        const advancedSearch = document.getElementById('advancedSearch');
        const toggle = document.getElementById('advancedSearchToggle');
        
        advancedSearch.classList.toggle('active');
        const isActive = advancedSearch.classList.contains('active');
        toggle.style.background = isActive ? 'var(--accent-blue)' : '';
        toggle.style.color = isActive ? 'white' : '';
    });
    
    // Advanced search filters
    document.getElementById('dateFrom')?.addEventListener('change', renderCalendar);
    document.getElementById('dateTo')?.addEventListener('change', renderCalendar);
    document.getElementById('minJokes')?.addEventListener('input', renderCalendar);
    
    // Clear filters
    document.getElementById('clearFilters').addEventListener('click', () => {
        venueSearch.value = '';
        typeFilter.value = 'all';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        document.getElementById('minJokes').value = '';
        renderCalendar();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+F - Focus search
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            venueSearch.focus();
            venueSearch.select();
        }
        
        // Ctrl+T - Go to today
        if (e.ctrlKey && e.key === 't') {
            e.preventDefault();
            currentWeek = new Date();
            renderCalendar();
            showNotification('Jumped to today', 'info');
        }
        
        // Ctrl+M - Open add mic modal
        if (e.ctrlKey && e.key === 'm') {
            e.preventDefault();
            document.getElementById('addMicBtn').click();
        }
        
        // Escape - Close modals and clear search
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-container.is-visible').forEach(modal => {
                closeModal(modal);
            });
            contextMenu.style.display = 'none';
            
            if (document.activeElement === venueSearch && venueSearch.value) {
                venueSearch.value = '';
                renderCalendar();
            }
        }
        
        // Arrow keys for navigation
        if (!e.target.matches('input, select, textarea')) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                document.getElementById('prevWeekBtn').click();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                document.getElementById('nextWeekBtn').click();
            }
        }
        
        // 1-3 for view switching
        if (!e.target.matches('input, select, textarea')) {
            if (e.key === '1') {
                e.preventDefault();
                document.getElementById('weekViewBtn').click();
            } else if (e.key === '2') {
                e.preventDefault();
                document.getElementById('monthViewBtn').click();
            } else if (e.key === '3') {
                e.preventDefault();
                document.getElementById('listViewBtn').click();
            }
        }
    });

    // Context menu and form submission logic
    calendarGrid.addEventListener('contextmenu', (e) => {
        const pill = e.target.closest('.event-pill');
        if (pill) {
            e.preventDefault();
            contextMenu.style.display = 'block';
            contextMenu.style.left = `${e.pageX}px`;
            contextMenu.style.top = `${e.pageY}px`;
            contextMenu.dataset.setId = pill.dataset.setId; // Store ID on menu
        }
    });

    // Click event listener for event pills to edit set
    calendarGrid.addEventListener('click', (e) => {
        const pill = e.target.closest('.event-pill');
        if (pill) {
            const setId = parseInt(pill.dataset.setId, 10);
            // --- ACTION PLAN 1.2 --- Using the new dataStore method to get data
            const set = dataStore.getSetById(setId);
            if (set) {
                // Open the same edit form as "Add Set"
                formTitle.textContent = 'Edit Set';
                setIdInput.value = set.id;
                document.getElementById('event-title').value = set.title;
                document.getElementById('venue').value = set.venue;
                document.getElementById('date').value = set.date;
                document.getElementById('event-type').value = set.eventType;
                document.getElementById('setlist').value = set.setlist || '';
                document.getElementById('notes').value = set.notes || '';
                openModal(addEditModal);
            }
        } else {
            // Check if clicking on an empty day cell
            const dayCell = e.target.closest('.day-cell');
            if (dayCell && dayCell.dataset.date) {
                // Open Add Set modal with the clicked date pre-populated
                formTitle.textContent = 'Log a New Set';
                setForm.reset();
                setIdInput.value = '';
                document.getElementById('date').value = dayCell.dataset.date;
                openModal(addEditModal);
            }
        }
    });
    
    contextMenu.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.context-menu-item');
        if (!menuItem) return;
        
        const action = menuItem.dataset.action;
        const setId = parseInt(contextMenu.dataset.setId, 10);
        // --- ACTION PLAN 1.2 --- Using the new dataStore method to get data
        const set = dataStore.getSetById(setId);

        if (action === 'edit') {
            formTitle.textContent = 'Edit Set';
            setIdInput.value = set.id;
            document.getElementById('event-title').value = set.title;
            document.getElementById('venue').value = set.venue;
            document.getElementById('date').value = set.date;
            document.getElementById('event-type').value = set.eventType;
            document.getElementById('setlist').value = set.setlist || '';
            document.getElementById('notes').value = set.notes || '';
            openModal(addEditModal);
        } else if (action === 'delete') {
            set_to_delete = setId; // Store which set to delete
            openModal(deleteConfirmModal);
        }
        contextMenu.style.display = 'none';
    });
    
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
        if (set_to_delete !== null) {
            // --- ACTION PLAN 1.2 --- Using the new dataStore method to delete data
            dataStore.deleteSet(set_to_delete);
            closeModal(deleteConfirmModal);
            renderCalendar();
            set_to_delete = null;
        }
    });

    setForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(setForm);
        const id = parseInt(formData.get('setId'), 10);
        const setData = {
            title: formData.get('event-title'),
            venue: formData.get('venue'),
            date: formData.get('date'),
            eventType: formData.get('eventType'),
            setlist: formData.get('setlist'),
            notes: formData.get('notes'),
        };

        if (id) { // Editing existing
            // --- ACTION PLAN 1.2 --- Using the new dataStore method to update data
            dataStore.updateSet(id, setData);
        } else { // Adding new
            // --- ACTION PLAN 1.2 --- Using the new dataStore method to add data
            dataStore.addSet(setData);
        }
        
        closeModal(addEditModal);
        renderCalendar();
    });

    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    });

    // Check for pending calendar action from main mic finder
    function checkPendingCalendarAction() {
        const pendingAction = localStorage.getItem('pendingCalendarAction');
        if (pendingAction) {
            try {
                const data = JSON.parse(pendingAction);
                if (data.action === 'addMic' && data.mic) {
                    // Clear the pending action
                    localStorage.removeItem('pendingCalendarAction');
                    
                    // Pre-populate the form with mic data
                    formTitle.textContent = 'Log New Set from Mic';
                    setForm.reset();
                    setIdInput.value = '';
                    
                    // Fill in the form fields
                    document.getElementById('venue').value = data.mic.venue;
                    document.getElementById('event-title').value = 'Open Mic';
                    document.getElementById('event-type').value = 'green';
                    document.getElementById('date').value = data.suggestedDate;
                    
                    // Add some context in notes
                    const notesField = document.getElementById('notes');
                    let notes = `Added from Mic Finder.\n`;
                    if (data.mic.host) notes += `Host: ${data.mic.host}\n`;
                    if (data.mic.cost) notes += `Cost: ${data.mic.cost}\n`;
                    if (data.mic.signupTime) notes += `Signup: ${data.mic.signupTime}\n`;
                    if (data.mic.address) notes += `Address: ${data.mic.address}\n`;
                    notesField.value = notes;
                    
                    // Open the add set modal
                    openModal(addEditModal);
                    
                    // Show success notification
                    showNotification(`Pre-filled form with ${data.mic.venue} details!`);
                }
            } catch (error) {
                console.error('Error processing pending calendar action:', error);
                localStorage.removeItem('pendingCalendarAction');
            }
        }
    }
    
    // Function to show notifications
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'var(--accent-green)' : 'var(--accent-blue)';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 600;
            max-width: 300px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    // --- INITIAL RENDER ---
    renderCalendar();
    
    // Check for pending actions after initial render
    setTimeout(checkPendingCalendarAction, 500);
});
