// Event Handling Module - Manages all user interactions and event listeners
import { dataStore } from './data.js';
import { renderCalendar, setCurrentWeek, setExpandedView, showListView, currentWeek, isExpandedView, initializeUIElements, showJokeBankView, hideJokeBankView } from './ui.js';
import { openModal, closeModal, showEventSummary, showAddSetModal, showDeleteConfirmation, showStatsModal, showSettingsModal, showNotification, initializeModalElements, handleJokeFormSubmit } from './modals.js';

// State management
let set_to_delete = null;

// DOM Element References
let calendarContainer, calendarGrid, contextMenu;

export function initializeEventElements() {
    calendarContainer = document.getElementById('calendarContainer');
    calendarGrid = document.getElementById('calendarGrid');
    contextMenu = document.getElementById('event-context-menu');
}

export function setupEventListeners() {
    // Initialize UI and modal elements
    initializeUIElements();
    initializeModalElements();
    initializeEventElements();
    
    // Initialize date pickers
    initializeDatePickers();
    
    // Initialize setlist functionality
    initializeSetlistFeatures();

    // Modal close handlers
    document.querySelectorAll('.modal-overlay, .modal-close-btn, .modal-cancel-btn').forEach(el => {
        el.addEventListener('click', () => {
            const modal = el.closest('.modal-container');
            closeModal(modal);
        });
    });

    // Main action buttons
    document.getElementById('addSetBtn')?.addEventListener('click', () => {
        showAddSetModal();
    });

    document.getElementById('addMicBtn')?.addEventListener('click', () => {
        handleAddMicClick();
    });

    // Add Mic button from within the Add Set form
    document.getElementById('addMicFromForm')?.addEventListener('click', () => {
        // Set a flag to indicate we're selecting a mic for the current form
        window.isSelectingMicForForm = true;
        handleAddMicClick();
    });

    // Add Joke button from within the setlist builder
    document.getElementById('addJokeFromBuilderBtn')?.addEventListener('click', () => {
        showJokeModal(); 
    });

    // Reset the flag when mic selection modal is closed without selection
    const micSelectionModal = document.getElementById('mic-selection-modal');
    if (micSelectionModal) {
        const micOverlay = micSelectionModal.querySelector('.modal-overlay');
        const micCloseBtn = micSelectionModal.querySelector('.modal-close-btn');
        
        if (micOverlay) {
            micOverlay.addEventListener('click', () => {
                window.isSelectingMicForForm = false;
            });
        }
        
        if (micCloseBtn) {
            micCloseBtn.addEventListener('click', () => {
                window.isSelectingMicForForm = false;
            });
        }
    }

    // Navigation controls
    document.getElementById('expandBtn')?.addEventListener('click', () => {
        const newExpandedState = !isExpandedView;
        setExpandedView(newExpandedState);
        calendarContainer.classList.toggle('is-expanded');
        const icon = document.getElementById('expandBtn').querySelector('i');
        icon.className = newExpandedState ? 'fas fa-compress' : 'fas fa-expand';
        renderCalendar();
    });

    document.getElementById('prevWeekBtn')?.addEventListener('click', () => {
        const newDate = new Date(currentWeek);
        if(isExpandedView) newDate.setMonth(newDate.getMonth() - 1);
        else newDate.setDate(newDate.getDate() - 7);
        setCurrentWeek(newDate);
        renderCalendar();
    });

    document.getElementById('nextWeekBtn')?.addEventListener('click', () => {
        const newDate = new Date(currentWeek);
        if(isExpandedView) newDate.setMonth(newDate.getMonth() + 1);
        else newDate.setDate(newDate.getDate() + 7);
        setCurrentWeek(newDate);
        renderCalendar();
    });

    document.getElementById('todayBtn')?.addEventListener('click', () => {
        setCurrentWeek(new Date());
        renderCalendar();
    });

    // View toggle functionality
    document.getElementById('weekViewBtn')?.addEventListener('click', () => {
        setActiveView('week');
        setExpandedView(false);
        calendarContainer.classList.remove('is-expanded');
        const expandIcon = document.getElementById('expandBtn')?.querySelector('i');
        if (expandIcon) expandIcon.className = 'fas fa-expand';
        renderCalendar();
    });
    
    document.getElementById('monthViewBtn')?.addEventListener('click', () => {
        setActiveView('month');
        setExpandedView(true);
        calendarContainer.classList.add('is-expanded');
        const expandIcon = document.getElementById('expandBtn')?.querySelector('i');
        if (expandIcon) expandIcon.className = 'fas fa-compress';
        renderCalendar();
    });
    
    document.getElementById('listViewBtn')?.addEventListener('click', () => {
        setActiveView('list');
        const filteredSets = showListView();
        setupListItemHandlers(filteredSets);
    });

    // Bottom navigation handlers
    // Bottom navigation
    document.getElementById('calendarNavBtn')?.addEventListener('click', () => {
        // Show calendar view and hide joke bank
        hideJokeBankView();
        updateBottomNavigation('calendar');
    });

    document.getElementById('jokesNavBtn')?.addEventListener('click', () => {
        // Show joke bank view and hide calendar
        showJokeBankView();
        updateBottomNavigation('jokes');
    });

    document.getElementById('statsNavBtn')?.addEventListener('click', () => {
        showStatsModal();
    });
    
    document.getElementById('settingsNavBtn')?.addEventListener('click', () => {
        showSettingsModal();
    });
    
    // Joke form submission
    document.getElementById('jokeForm')?.addEventListener('submit', handleJokeFormSubmit);

    // Real-time tag suggestions with debouncing
    const tagsInput = document.getElementById('tags');
    const tagsSuggestions = document.getElementById('tagsSuggestions');
    let tagSuggestionTimeout;

    tagsInput?.addEventListener('input', () => {
        clearTimeout(tagSuggestionTimeout);
        tagSuggestionTimeout = setTimeout(() => {
            const currentTags = tagsInput.value.split(',').map(t => t.trim());
            const currentTag = currentTags[currentTags.length - 1].toLowerCase();
            
            if (!currentTag) {
                tagsSuggestions.style.display = 'none';
                return;
            }
            
            const allTags = dataStore.getAllTags();
            const suggestions = allTags.filter(tag => 
                tag.toLowerCase().includes(currentTag) && !currentTags.includes(tag)
            );
            
            if (suggestions.length > 0) {
                tagsSuggestions.innerHTML = suggestions
                    .slice(0, 8) // Limit to 8 suggestions
                    .map(tag => `<span class="tag-suggestion" data-tag="${tag}">${tag}</span>`)
                    .join('');
                tagsSuggestions.style.display = 'flex';
            } else {
                tagsSuggestions.style.display = 'none';
            }
        }, 300); // 300ms debounce
    });

    // Add a click handler for the suggestions container
    tagsSuggestions?.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag-suggestion')) {
            const tagToAdd = e.target.dataset.tag;
            let currentTags = tagsInput.value.split(',').map(t => t.trim());
            currentTags[currentTags.length - 1] = tagToAdd; // Replace the currently typed tag
            tagsInput.value = currentTags.join(', ') + ', ';
            tagsSuggestions.style.display = 'none';
            tagsInput.focus();
        }
    });

    // Hide suggestions when input loses focus
    tagsInput?.addEventListener('blur', (e) => {
        // Delay hiding to allow clicks on suggestions to register
        setTimeout(() => {
            if (tagsSuggestions && !tagsSuggestions.contains(document.activeElement)) {
                tagsSuggestions.style.display = 'none';
            }
        }, 150);
    });

    // Hide suggestions on Escape key
    tagsInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tagsSuggestions) {
            tagsSuggestions.style.display = 'none';
            e.preventDefault();
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (tagsSuggestions && !tagsInput?.contains(e.target) && !tagsSuggestions.contains(e.target)) {
            tagsSuggestions.style.display = 'none';
        }
    });

    // Joke Bank Collapsible Toggle
    document.getElementById('jokeBankToggle')?.addEventListener('click', toggleJokeBankCollapse);

    // Clear setlist button handler
    document.getElementById('clearSetlistBtn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the entire setlist?')) {
            // Clear the currentSetlistData by resetting the hidden input
            document.getElementById('setlistData').value = JSON.stringify([]);
            
            // Trigger a custom event to re-initialize the setlist builder
            const setlistBuilder = document.getElementById('setlistBuilder');
            if (setlistBuilder) {
                const event = new CustomEvent('setlistCleared');
                setlistBuilder.dispatchEvent(event);
            }
            
            showNotification('Setlist cleared', 'success');
        }
    });

    // Use event delegation on the setlist container for remove/note buttons
    document.getElementById('currentSetlist')?.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const jokeId = parseInt(e.target.dataset.jokeId);

        // Handle "Remove Joke" button click
        if (action === 'remove' && jokeId) {
            if (window.removeFromSetlist) {
                window.removeFromSetlist(jokeId);
            }
        }

        // Handle "Performance Note" icon click
        if (e.target.classList.contains('performance-note-icon')) {
            const setlistItem = e.target.closest('.setlist-item');
            const noteTextarea = setlistItem.querySelector('.performance-note-input');
            noteTextarea.classList.toggle('active');
            if (noteTextarea.classList.contains('active')) {
                noteTextarea.focus();
            }
        }
    });

    // Add listener to save performance notes as they are typed
    document.getElementById('currentSetlist')?.addEventListener('input', (e) => {
        if (e.target.classList.contains('performance-note-input')) {
            const jokeId = parseInt(e.target.dataset.jokeId);
            const note = e.target.value;
            const currentSetlistData = JSON.parse(document.getElementById('setlistData').value || '[]');
            const itemInSetlist = currentSetlistData.find(item => 
                (typeof item === 'object' ? item.id : item) === jokeId
            );
            if (itemInSetlist && typeof itemInSetlist === 'object') {
                itemInSetlist.perfNote = note;
                document.getElementById('setlistData').value = JSON.stringify(currentSetlistData);
            }
        }
    });

    // Filter and search handlers
    const venueSearch = document.getElementById('venueSearch');
    const typeFilter = document.getElementById('typeFilter');
    
    venueSearch?.addEventListener('input', renderCalendar);
    typeFilter?.addEventListener('change', renderCalendar);
    
    // Advanced search toggle
    document.getElementById('advancedSearchToggle')?.addEventListener('click', () => {
        const advancedSearch = document.getElementById('advancedSearch');
        const toggle = document.getElementById('advancedSearchToggle');
        
        advancedSearch?.classList.toggle('active');
        const isActive = advancedSearch?.classList.contains('active');
        if (toggle) {
            toggle.style.background = isActive ? 'var(--accent-blue)' : '';
            toggle.style.color = isActive ? 'white' : '';
        }
    });
    
    // Advanced search filters
    document.getElementById('dateFrom')?.addEventListener('change', renderCalendar);
    document.getElementById('dateTo')?.addEventListener('change', renderCalendar);
    document.getElementById('minJokes')?.addEventListener('input', renderCalendar);
    
    // Clear filters
    document.getElementById('clearFilters')?.addEventListener('click', () => {
        if (venueSearch) venueSearch.value = '';
        if (typeFilter) typeFilter.value = 'all';
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const minJokes = document.getElementById('minJokes');
        if (dateFrom) dateFrom.value = '';
        if (dateTo) dateTo.value = '';
        if (minJokes) minJokes.value = '';
        renderCalendar();
    });

    // Context menu and calendar interactions
    if (calendarGrid) {
        calendarGrid.addEventListener('contextmenu', handleContextMenu);
        calendarGrid.addEventListener('click', handleCalendarClick);
    }
    
    if (contextMenu) {
        contextMenu.addEventListener('click', handleContextMenuClick);
    }

    // Form submission
    const setForm = document.getElementById('setForm');
    if (setForm) {
        setForm.addEventListener('submit', handleFormSubmission);
    }

    // Delete confirmation
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
        if (set_to_delete !== null) {
            dataStore.deleteSet(set_to_delete);
            closeModal(document.getElementById('delete-confirm-modal'));
            renderCalendar();
            set_to_delete = null;
            showNotification('Set deleted successfully');
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Global click to close context menu
    document.addEventListener('click', () => {
        if (contextMenu) contextMenu.style.display = 'none';
    });

    // Check for pending calendar actions
    setTimeout(checkPendingCalendarAction, 500);
}

function setActiveView(view) {
    document.querySelectorAll('.view-toggle-btn').forEach(btn => btn.classList.remove('active'));
    const viewBtn = document.getElementById(`${view}ViewBtn`);
    if (viewBtn) viewBtn.classList.add('active');
}

function handleAddMicClick() {
    const micSelectionModal = document.getElementById('mic-selection-modal');
    if (micSelectionModal) {
        openModal(micSelectionModal);
        
        // Show loading state
        const micsList = document.getElementById('micsList');
        if (micsList) {
            micsList.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-secondary);"><i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Loading mics...</div>';
        }
        
        // Load mic data
        loadMicData();
    }
}

function handleContextMenu(e) {
    const pill = e.target.closest('.event-pill');
    if (pill) {
        e.preventDefault();
        if (contextMenu) {
            contextMenu.style.display = 'block';
            contextMenu.style.left = `${e.pageX}px`;
            contextMenu.style.top = `${e.pageY}px`;
            contextMenu.dataset.setId = pill.dataset.setId;
        }
    }
}

function handleCalendarClick(e) {
    // Check if clicking the add-set button
    const addSetBtn = e.target.closest('.add-set-btn');
    if (addSetBtn) {
        e.stopPropagation();
        const date = addSetBtn.dataset.date;
        showAddSetModal({ date: date });
        return;
    }
    
    const pill = e.target.closest('.event-pill');
    if (pill) {
        const setId = parseInt(pill.dataset.setId, 10);
        const set = dataStore.getSetById(setId);
        if (set) {
            showAddSetModal(set);
        }
    } else {
        // Check if clicking on an empty day cell
        const dayCell = e.target.closest('.day-cell');
        if (dayCell && dayCell.dataset.date) {
            showAddSetModal({ date: dayCell.dataset.date });
        }
    }
}

function handleContextMenuClick(e) {
    const menuItem = e.target.closest('.context-menu-item');
    if (!menuItem) return;
    
    const action = menuItem.dataset.action;
    const setId = parseInt(contextMenu.dataset.setId, 10);
    const set = dataStore.getSetById(setId);

    if (action === 'edit') {
        showAddSetModal(set);
    } else if (action === 'delete') {
        set_to_delete = setId;
        showDeleteConfirmation();
    }
    
    if (contextMenu) contextMenu.style.display = 'none';
}

function handleFormSubmission(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = parseInt(formData.get('setId'), 10);
    
    // Clear any previous error states
    clearFormErrors();
    
    // Input validation with enhanced feedback
    const title = formData.get('event-title')?.trim();
    const venue = formData.get('venue')?.trim();
    const date = formData.get('date');
    const notes = formData.get('notes')?.trim();
    const tagsInput = formData.get('tags')?.trim();
    const goal = formData.get('goal')?.trim();
    const imageUrl = formData.get('imageUrl')?.trim();
    
    // Handle setlist data - prioritize new format over legacy
    const setlistData = formData.get('setlistData');
    const legacySetlist = formData.get('setlist')?.trim();
    
    let setlist;
    if (setlistData && setlistData !== '[]') {
        // New format: array of joke IDs
        try {
            setlist = JSON.parse(setlistData);
        } catch (e) {
            setlist = [];
        }
    } else if (legacySetlist) {
        // Legacy format: string
        setlist = legacySetlist;
    } else {
        // No setlist
        setlist = [];
    }
    
    let hasErrors = false;
    
    // Title validation
    if (!title) {
        showFieldError('event-title', 'Event title is required');
        hasErrors = true;
    } else if (title.length < 2) {
        showFieldError('event-title', 'Title must be at least 2 characters');
        hasErrors = true;
    } else if (title.length > 100) {
        showFieldError('event-title', 'Title must be less than 100 characters');
        hasErrors = true;
    }
    
    // Venue validation
    if (!venue) {
        showFieldError('venue', 'Venue is required');
        hasErrors = true;
    } else if (venue.length < 2) {
        showFieldError('venue', 'Venue must be at least 2 characters');
        hasErrors = true;
    } else if (venue.length > 100) {
        showFieldError('venue', 'Venue must be less than 100 characters');
        hasErrors = true;
    }
    
    // Date validation
    if (!date) {
        showFieldError('date', 'Date is required');
        hasErrors = true;
    } else if (!isValidDate(date)) {
        showFieldError('date', 'Please enter a valid date');
        hasErrors = true;
    } else {
        const selectedDate = new Date(date);
        const today = new Date();
        const yearFromNow = new Date();
        yearFromNow.setFullYear(today.getFullYear() + 1);
        
        if (selectedDate > yearFromNow) {
            showFieldError('date', 'Date cannot be more than a year in the future');
            hasErrors = true;
        }
    }
    
    // Setlist validation (optional but with format checking)
    if (typeof setlist === 'string' && setlist.length > 5000) {
        showFieldError('setlist', 'Setlist is too long (max 5000 characters)');
        hasErrors = true;
    } else if (Array.isArray(setlist) && setlist.length > 50) {
        showFieldError('setlistData', 'Setlist has too many jokes (max 50)');
        hasErrors = true;
    }
    
    // Notes validation (optional but with length checking)
    if (notes && notes.length > 2000) {
        showFieldError('notes', 'Notes are too long (max 2000 characters)');
        hasErrors = true;
    }
    
    // If there are errors, don't submit
    if (hasErrors) {
        showNotification('Please fix the form errors before submitting', 'error');
        return;
    }
    
    // Process tags
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    const setData = {
        title,
        venue,
        date,
        eventType: formData.get('eventType'),
        setlist,
        notes,
        tags,
        goal: goal || '',
        imageUrl: imageUrl || ''
    };

    // Show immediate feedback on the submit button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        submitBtn.style.background = 'var(--accent-green)';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            if (id) {
                dataStore.updateSet(id, setData);
                showNotification('Set updated successfully');
            } else {
                dataStore.addSet(setData);
                showNotification('Set added successfully');
            }
            
            closeModal(document.getElementById('add-edit-modal'));
            renderCalendar();
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.style.background = '';
            submitBtn.disabled = false;
        }, 800);
    } else {
        // Fallback if button not found
        if (id) {
            dataStore.updateSet(id, setData);
            showNotification('Set updated successfully');
        } else {
            dataStore.addSet(setData);
            showNotification('Set added successfully');
        }
        
        closeModal(document.getElementById('add-edit-modal'));
        renderCalendar();
    }
}

function setupListItemHandlers(filteredSets) {
    // Add click handlers for list items
    document.querySelectorAll('.list-item').forEach(item => {
        item.addEventListener('click', () => {
            const setId = parseInt(item.dataset.setId, 10);
            const set = dataStore.getSetById(setId);
            if (set) {
                showAddSetModal(set);
            }
        });
        
        // Keyboard support
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.click();
            }
        });
    });
}

function handleKeyboardShortcuts(e) {
    // Don't trigger shortcuts when typing in inputs (unless specifically intended)
    const isTyping = e.target.matches('input, select, textarea');
    
    // === NAVIGATION SHORTCUTS ===
    
    // Ctrl+F - Focus search
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const venueSearch = document.getElementById('venueSearch');
        if (venueSearch) {
            venueSearch.focus();
            venueSearch.select();
            showNotification('Search focused - Type to search sets', 'info');
        }
    }
    
    // Ctrl+T - Go to today
    if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        setCurrentWeek(new Date());
        renderCalendar();
        showNotification('Jumped to today', 'info');
    }
    
    // === ACTION SHORTCUTS ===
    
    // Ctrl+N - Add new set
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        document.getElementById('addSetBtn')?.click();
        showNotification('Add Set form opened', 'info');
    }
    
    // Ctrl+M - Open add mic modal
    if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        document.getElementById('addMicBtn')?.click();
        showNotification('Mic Finder opened', 'info');
    }
    
    // Ctrl+S - Open stats (when not in form)
    if (e.ctrlKey && e.key === 's' && !isTyping) {
        e.preventDefault();
        document.getElementById('statsNavBtn')?.click();
        showNotification('Stats opened', 'info');
    }
    
    // Ctrl+, - Open settings
    if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        document.getElementById('settingsNavBtn')?.click();
        showNotification('Settings opened', 'info');
    }
    
    // === MODAL AND ESCAPE SHORTCUTS ===
    
    // Escape - Close modals and clear search
    if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal-container.is-visible');
        if (openModals.length > 0) {
            openModals.forEach(modal => closeModal(modal));
            showNotification('Modal closed', 'info');
        } else if (contextMenu && contextMenu.style.display !== 'none') {
            contextMenu.style.display = 'none';
        } else {
            // Clear search if focused
            const venueSearch = document.getElementById('venueSearch');
            if (document.activeElement === venueSearch && venueSearch?.value) {
                venueSearch.value = '';
                renderCalendar();
                showNotification('Search cleared', 'info');
            }
        }
    }
    
    // === NAVIGATION ARROWS ===
    
    // Arrow keys for navigation (only when not typing)
    if (!isTyping) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            document.getElementById('prevWeekBtn')?.click();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            document.getElementById('nextWeekBtn')?.click();
        } else if (e.key === 'ArrowUp' && e.ctrlKey) {
            e.preventDefault();
            // Go to previous month
            const newDate = new Date(currentWeek);
            newDate.setMonth(newDate.getMonth() - 1);
            setCurrentWeek(newDate);
            renderCalendar();
            showNotification('Previous month', 'info');
        } else if (e.key === 'ArrowDown' && e.ctrlKey) {
            e.preventDefault();
            // Go to next month
            const newDate = new Date(currentWeek);
            newDate.setMonth(newDate.getMonth() + 1);
            setCurrentWeek(newDate);
            renderCalendar();
            showNotification('Next month', 'info');
        }
    }
    
    // === VIEW SWITCHING ===
    
    // 1-3 for view switching (only when not typing)
    if (!isTyping) {
        if (e.key === '1') {
            e.preventDefault();
            document.getElementById('weekViewBtn')?.click();
            showNotification('Week view activated', 'info');
        } else if (e.key === '2') {
            e.preventDefault();
            document.getElementById('monthViewBtn')?.click();
            showNotification('Month view activated', 'info');
        } else if (e.key === '3') {
            e.preventDefault();
            document.getElementById('listViewBtn')?.click();
            showNotification('List view activated', 'info');
        }
    }
    
    // === ADVANCED SHORTCUTS ===
    
    // Ctrl+Shift+E - Export data
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        window.exportData();
    }
    
    // Ctrl+Shift+C - Clear all filters
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        document.getElementById('clearFilters')?.click();
        showNotification('All filters cleared', 'info');
    }
    
    // ? - Show keyboard shortcuts help
    if (e.key === '?' && !isTyping) {
        e.preventDefault();
        showKeyboardShortcutsHelp();
    }
    
    // === QUICK FILTERS ===
    
    // Alt+1,2,3,4 for quick event type filters
    if (e.altKey && !isTyping) {
        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    typeFilter.value = 'blue';
                    typeFilter.dispatchEvent(new Event('change'));
                    showNotification('Filtered to Showcases', 'info');
                    break;
                case '2':
                    e.preventDefault();
                    typeFilter.value = 'green';
                    typeFilter.dispatchEvent(new Event('change'));
                    showNotification('Filtered to Open Mics', 'info');
                    break;
                case '3':
                    e.preventDefault();
                    typeFilter.value = 'orange';
                    typeFilter.dispatchEvent(new Event('change'));
                    showNotification('Filtered to Corporate/Private', 'info');
                    break;
                case '4':
                    e.preventDefault();
                    typeFilter.value = 'red';
                    typeFilter.dispatchEvent(new Event('change'));
                    showNotification('Filtered to Late Night', 'info');
                    break;
                case '0':
                    e.preventDefault();
                    typeFilter.value = 'all';
                    typeFilter.dispatchEvent(new Event('change'));
                    showNotification('Filter cleared - showing all types', 'info');
                    break;
            }
        }
    }
}

function checkPendingCalendarAction() {
    const pendingAction = localStorage.getItem('pendingCalendarAction');
    if (pendingAction) {
        try {
            const data = JSON.parse(pendingAction);
            if (data.action === 'addMic' && data.mic) {
                localStorage.removeItem('pendingCalendarAction');
                
                const micData = {
                    venue: data.mic.venue,
                    title: 'Open Mic',
                    eventType: 'green',
                    date: data.suggestedDate,
                    notes: `Added from Mic Finder.\n${data.mic.host ? `Host: ${data.mic.host}\n` : ''}${data.mic.cost ? `Cost: ${data.mic.cost}\n` : ''}${data.mic.signupTime ? `Signup: ${data.mic.signupTime}\n` : ''}${data.mic.address ? `Address: ${data.mic.address}\n` : ''}`
                };
                
                showAddSetModal(micData);
                showNotification(`Pre-filled form with ${data.mic.venue} details!`);
            }
        } catch (error) {
            console.error('Error processing pending calendar action:', error);
            localStorage.removeItem('pendingCalendarAction');
        }
    }
}

function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

function showKeyboardShortcutsHelp() {
    const helpHTML = `
        <div style="max-width: 700px;">
            <h3>⌨️ Keyboard Shortcuts</h3>
            <p style="color: var(--text-secondary); margin-bottom: 2rem;">Master these shortcuts to become a power user!</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 1.5rem 0;">
                <div>
                    <h4 style="color: var(--accent-blue); margin-bottom: 1rem;">🚀 Quick Actions</h4>
                    <div class="shortcut-list">
                        <div class="shortcut-item">
                            <kbd>Ctrl+N</kbd>
                            <span>Add New Set</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl+M</kbd>
                            <span>Open Mic Finder</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl+S</kbd>
                            <span>Open Stats</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl+,</kbd>
                            <span>Open Settings</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl+Shift+E</kbd>
                            <span>Export Data</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 style="color: var(--accent-green); margin-bottom: 1rem;">🧭 Navigation</h4>
                    <div class="shortcut-list">
                        <div class="shortcut-item">
                            <kbd>Ctrl+T</kbd>
                            <span>Go to Today</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>←/→</kbd>
                            <span>Previous/Next Week</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl+↑/↓</kbd>
                            <span>Previous/Next Month</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>1/2/3</kbd>
                            <span>Week/Month/List View</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 style="color: var(--accent-orange); margin-bottom: 1rem;">🔍 Search & Filter</h4>
                    <div class="shortcut-list">
                        <div class="shortcut-item">
                            <kbd>Ctrl+F</kbd>
                            <span>Focus Search</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Alt+1</kbd>
                            <span>Filter Showcases</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Alt+2</kbd>
                            <span>Filter Open Mics</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Alt+3</kbd>
                            <span>Filter Corporate</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Alt+4</kbd>
                            <span>Filter Late Night</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Alt+0</kbd>
                            <span>Clear Type Filter</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl+Shift+C</kbd>
                            <span>Clear All Filters</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 style="color: var(--accent-red); margin-bottom: 1rem;">⚡ Utilities</h4>
                    <div class="shortcut-list">
                        <div class="shortcut-item">
                            <kbd>Esc</kbd>
                            <span>Close Modal/Clear Search</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>?</kbd>
                            <span>Show This Help</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="background: var(--bg-surface-2); padding: 1rem; border-radius: 8px; margin: 1.5rem 0;">
                <h4 style="margin-bottom: 0.5rem;">💡 Pro Tips</h4>
                <ul style="margin: 0; padding-left: 1.5rem; color: var(--text-secondary);">
                    <li>Click empty calendar days to quickly add sets for that date</li>
                    <li>Right-click event pills for context menu options</li>
                    <li>Click charts in Stats to drill down into details</li>
                    <li>Use saved setlists to speed up data entry</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin-top: 2rem;">
                <button onclick="closeModal(eventSummaryModal)" style="padding: 0.75rem 2rem; background: var(--accent-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Got it!</button>
            </div>
        </div>
        
        <style>
            .shortcut-list {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .shortcut-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem;
                background: var(--bg-surface-2);
                border-radius: 6px;
            }
            
            .shortcut-item kbd {
                background: var(--bg-main);
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.8rem;
                font-family: monospace;
                border: 1px solid var(--border-color);
                color: var(--accent-blue);
                font-weight: 600;
            }
            
            .shortcut-item span {
                color: var(--text-primary);
                font-size: 0.9rem;
            }
        </style>
    `;
    
    document.getElementById('summaryContent').innerHTML = helpHTML;
    openModal(document.getElementById('event-summary-modal'));
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Remove any existing error
    clearFieldError(fieldId);
    
    // Add error styling
    field.classList.add('field-error');
    field.setAttribute('aria-invalid', 'true');
    
    // Create and insert error message
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error-message';
    errorElement.id = `${fieldId}-error`;
    errorElement.textContent = message;
    errorElement.setAttribute('role', 'alert');
    
    // Insert after the field
    field.parentNode.insertBefore(errorElement, field.nextSibling);
    
    // Associate error with field for screen readers
    field.setAttribute('aria-describedby', errorElement.id);
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.classList.remove('field-error');
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
    
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
        errorElement.remove();
    }
}

function clearFormErrors() {
    const errorFields = document.querySelectorAll('.field-error');
    errorFields.forEach(field => {
        field.classList.remove('field-error');
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
    });
    
    const errorMessages = document.querySelectorAll('.field-error-message');
    errorMessages.forEach(message => message.remove());
}

function initializeDatePickers() {
    // Wait for the datepicker library to be available
    if (typeof Datepicker !== 'undefined') {
        // Initialize date pickers for all date inputs
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            new Datepicker(input, {
                format: 'yyyy-mm-dd',
                todayHighlight: true,
                orientation: 'auto',
                container: input.closest('.modal-content') || document.body,
                clearBtn: true,
                todayBtn: true
            });
        });
        console.log('Date pickers initialized successfully');
    } else {
        // Retry after a short delay if library isn't loaded yet
        setTimeout(initializeDatePickers, 100);
    }
}

function initializeSetlistFeatures() {
    // Populate setlist template dropdown
    populateSetlistDropdown();
    
    // Setlist template selection
    const setlistTemplate = document.getElementById('setlistTemplate');
    if (setlistTemplate) {
        setlistTemplate.addEventListener('change', (e) => {
            if (e.target.value) {
                const setlist = dataStore.getSetlistById(parseInt(e.target.value));
                if (setlist) {
                    document.getElementById('setlist').value = setlist.jokes.join('\n');
                    showNotification(`Loaded "${setlist.name}" setlist`);
                }
            }
        });
    }
    
    // Manage setlists button
    const manageSetlistsBtn = document.getElementById('manageSetlistsBtn');
    if (manageSetlistsBtn) {
        manageSetlistsBtn.addEventListener('click', showSetlistManagementModal);
    }
    
    // New setlist form
    const newSetlistForm = document.getElementById('newSetlistForm');
    if (newSetlistForm) {
        newSetlistForm.addEventListener('submit', handleNewSetlistForm);
    }
}

function populateSetlistDropdown() {
    const dropdown = document.getElementById('setlistTemplate');
    if (!dropdown) return;
    
    // Clear existing options except the first one
    dropdown.innerHTML = '<option value="">Choose a saved setlist...</option>';
    
    // Add saved setlists
    dataStore.getAllSetlists().forEach(setlist => {
        const option = document.createElement('option');
        option.value = setlist.id;
        option.textContent = `${setlist.name} (${setlist.jokes.length} jokes)`;
        dropdown.appendChild(option);
    });
}

function showSetlistManagementModal() {
    const modal = document.getElementById('setlist-management-modal');
    if (!modal) return;
    
    renderSetlistsContainer();
    
    // Set up event delegation for setlist actions
    const container = document.getElementById('setlistsContainer');
    if (container) {
        // Remove existing listener to avoid duplicates
        container.removeEventListener('click', handleSetlistActions);
        container.addEventListener('click', handleSetlistActions);
    }
    
    openModal(modal);
}

function handleSetlistActions(e) {
    const button = e.target.closest('[data-action]');
    if (!button) return;
    
    const action = button.dataset.action;
    const setlistId = parseInt(button.dataset.setlistId);
    
    switch(action) {
        case 'edit-setlist':
            editSetlist(setlistId);
            break;
        case 'delete-setlist':
            deleteSetlist(setlistId);
            break;
    }
}

function renderSetlistsContainer() {
    const container = document.getElementById('setlistsContainer');
    if (!container) return;
    
    const setlists = dataStore.getAllSetlists();
    
    if (setlists.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No saved setlists yet. Create one below!</p>';
        return;
    }
    
    container.innerHTML = setlists.map(setlist => `
        <div style="background: var(--bg-surface-2); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <h4 style="margin: 0; color: var(--text-primary);">${setlist.name}</h4>
                <div style="display: flex; gap: 0.5rem;">
                    <button data-action="edit-setlist" data-setlist-id="${setlist.id}" style="padding: 0.25rem 0.5rem; background: var(--accent-blue); color: white; border: none; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">Edit</button>
                    <button data-action="delete-setlist" data-setlist-id="${setlist.id}" style="padding: 0.25rem 0.5rem; background: var(--accent-red); color: white; border: none; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">Delete</button>
                </div>
            </div>
            <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.5rem;">${setlist.jokes.length} jokes</div>
            <div style="background: var(--bg-main); padding: 0.5rem; border-radius: 4px; font-family: monospace; font-size: 0.8rem; max-height: 100px; overflow-y: auto;">
                ${setlist.jokes.map(joke => `<div>${joke}</div>`).join('')}
            </div>
        </div>
    `).join('');
}

function handleNewSetlistForm(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('newSetlistName')?.trim();
    const jokes = formData.get('newSetlistJokes')?.trim();
    
    if (!name || !jokes) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Show immediate feedback on the submit button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Created!';
        submitBtn.style.background = 'var(--accent-green)';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            dataStore.addSetlist(name, jokes);
            showNotification(`Setlist "${name}" created successfully!`);
            
            // Reset form and refresh views
            e.target.reset();
            renderSetlistsContainer();
            populateSetlistDropdown();
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.style.background = '';
            submitBtn.disabled = false;
        }, 600);
    } else {
        // Fallback
        dataStore.addSetlist(name, jokes);
        showNotification(`Setlist "${name}" created successfully!`);
        e.target.reset();
        renderSetlistsContainer();
        populateSetlistDropdown();
    }
}

// Local functions for setlist management (no longer global)
function editSetlist(id) {
    const setlist = dataStore.getSetlistById(id);
    if (!setlist) return;
    
    const newName = prompt('Edit setlist name:', setlist.name);
    if (newName === null) return; // User cancelled
    
    const newJokes = prompt('Edit jokes (one per line):', setlist.jokes.join('\n'));
    if (newJokes === null) return; // User cancelled
    
    if (newName.trim() && newJokes.trim()) {
        dataStore.updateSetlist(id, newName.trim(), newJokes.trim());
        showNotification(`Setlist "${newName}" updated successfully!`);
        renderSetlistsContainer();
        populateSetlistDropdown();
    }
}

function deleteSetlist(id) {
    const setlist = dataStore.getSetlistById(id);
    if (!setlist) return;
    
    if (confirm(`Are you sure you want to delete "${setlist.name}"?`)) {
        dataStore.deleteSetlist(id);
        showNotification(`Setlist "${setlist.name}" deleted`);
        renderSetlistsContainer();
        populateSetlistDropdown();
    }
}

// --- MIC DATA FUNCTIONALITY ---
let allMics = [];
let filteredMics = [];
let cachedMicData = null;
let dataLoadPromise = null;
let lastFilterState = { search: '', day: 'all' };
let recentlyUsedMics = JSON.parse(localStorage.getItem('recentlyUsedMics') || '[]');

// Function to load mic data from CSV
function loadMicsFromCSV(callback) {
    if (typeof Papa === 'undefined') {
        console.error('Papa Parse library not available');
        callback([]);
        return;
    }
    
    Papa.parse('coordinates.csv', {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            const processedMics = results.data.map((row, index) => {
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
            }).filter(mic => mic.venue && mic.day);
            
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
    const micSearch = document.getElementById('micSearch');
    const dayFilter = document.getElementById('dayFilter');
    
    lastFilterState = {
        search: micSearch ? micSearch.value : '',
        day: dayFilter ? dayFilter.value : 'all'
    };
}

function restoreFilterState() {
    const micSearch = document.getElementById('micSearch');
    const dayFilter = document.getElementById('dayFilter');
    
    if (micSearch) micSearch.value = lastFilterState.search;
    if (dayFilter) dayFilter.value = lastFilterState.day;
    if (lastFilterState.search || lastFilterState.day !== 'all') {
        filterMics();
    }
}

function setSmartDefaultFilters() {
    const dayFilter = document.getElementById('dayFilter');
    
    if (lastFilterState.day === 'all' && !lastFilterState.search) {
        const today = new Date();
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = daysOfWeek[today.getDay()];
        
        if (dayFilter) dayFilter.value = currentDay;
        lastFilterState.day = currentDay;
    }
}

function addToRecentlyUsed(micId) {
    recentlyUsedMics = [micId, ...recentlyUsedMics.filter(id => id !== micId)].slice(0, 5);
    localStorage.setItem('recentlyUsedMics', JSON.stringify(recentlyUsedMics));
}

function getRecentlyUsedMics() {
    return recentlyUsedMics
        .map(id => allMics.find(mic => mic.id === id))
        .filter(mic => mic && filteredMics.includes(mic));
}

function applyQuickFilter(filter) {
    const micSearch = document.getElementById('micSearch');
    const dayFilter = document.getElementById('dayFilter');
    const today = new Date();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    switch (filter) {
        case 'today':
            if (dayFilter) dayFilter.value = daysOfWeek[today.getDay()];
            if (micSearch) micSearch.value = '';
            break;
        case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (dayFilter) dayFilter.value = daysOfWeek[tomorrow.getDay()];
            if (micSearch) micSearch.value = '';
            break;
        case 'free':
            if (dayFilter) dayFilter.value = 'all';
            if (micSearch) micSearch.value = 'free';
            break;
        case 'popular':
            if (dayFilter) dayFilter.value = 'all';
            if (micSearch) micSearch.value = 'Manhattan';
            break;
        case 'clear':
            if (dayFilter) dayFilter.value = 'all';
            if (micSearch) micSearch.value = '';
            break;
    }
    
    saveFilterState();
    filterMics();
}

function filterMics() {
    const micSearch = document.getElementById('micSearch');
    const dayFilter = document.getElementById('dayFilter');
    
    const searchTerm = micSearch ? micSearch.value.toLowerCase() : '';
    const selectedDay = dayFilter ? dayFilter.value : 'all';
    
    saveFilterState();
    
    filteredMics = allMics.filter(mic => {
        const matchesSearch = mic.venue.toLowerCase().includes(searchTerm) || 
                            (mic.address && mic.address.toLowerCase().includes(searchTerm)) ||
                            (mic.borough && mic.borough.toLowerCase().includes(searchTerm)) ||
                            (mic.neighborhood && mic.neighborhood.toLowerCase().includes(searchTerm)) ||
                            (mic.host && mic.host.toLowerCase().includes(searchTerm)) ||
                            (mic.cost && mic.cost.toLowerCase().includes(searchTerm));
        const matchesDay = selectedDay === 'all' || mic.day === selectedDay;
        return matchesSearch && matchesDay;
    });
    
    renderMicsList();
}

function renderMicsList() {
    const micsList = document.getElementById('micsList');
    if (!micsList) return;
    
    if (filteredMics.length === 0) {
        micsList.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">No mics found. Try adjusting your filters.</div>';
        return;
    }
    
    const today = new Date();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = daysOfWeek[today.getDay()];
    
    let sectionsHTML = '';
    
    // Get recently used mics that match current filters
    const recentMics = getRecentlyUsedMics();
    
    // Show recently used section if we have any and no specific search
    if (recentMics.length > 0 && !lastFilterState.search && lastFilterState.day === 'all') {
        sectionsHTML += `
            <div class="mic-section">
                <div class="mic-section-header">
                    <i class="fas fa-history"></i> Recently Used
                </div>
                ${recentMics.map(mic => renderMicItem(mic)).join('')}
            </div>
        `;
    }
    
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
    
    micsList.innerHTML = sectionsHTML;
    
    // Add event listeners for mic selection
    setupMicEventListeners();
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

function setupMicEventListeners() {
    const micsList = document.getElementById('micsList');
    if (!micsList) return;
    
    // Remove existing listeners to avoid duplicates
    micsList.removeEventListener('click', handleMicClick);
    micsList.removeEventListener('keydown', handleMicKeydown);
    
    // Add new listeners
    micsList.addEventListener('click', handleMicClick);
    micsList.addEventListener('keydown', handleMicKeydown);
    
    // Quick filter chips
    const quickFilters = document.querySelector('.quick-filters');
    if (quickFilters) {
        quickFilters.removeEventListener('click', handleQuickFilterClick);
        quickFilters.addEventListener('click', handleQuickFilterClick);
    }
    
    // Search and filter inputs
    const micSearch = document.getElementById('micSearch');
    const dayFilter = document.getElementById('dayFilter');
    
    if (micSearch) {
        micSearch.removeEventListener('input', filterMics);
        micSearch.addEventListener('input', filterMics);
    }
    
    if (dayFilter) {
        dayFilter.removeEventListener('change', filterMics);
        dayFilter.addEventListener('change', filterMics);
    }
}

function handleMicClick(e) {
    const micItem = e.target.closest('.mic-item');
    if (micItem) {
        const micId = micItem.dataset.micId;
        selectMic(micId);
    }
}

function handleMicKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const micItem = e.target.closest('.mic-item');
        if (micItem) {
            e.preventDefault();
            const micId = micItem.dataset.micId;
            selectMic(micId);
        }
    }
}

function handleQuickFilterClick(e) {
    if (e.target.classList.contains('filter-chip')) {
        const filter = e.target.dataset.filter;
        applyQuickFilter(filter);
        
        // Update active state
        document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
        if (filter !== 'clear') {
            e.target.classList.add('active');
        }
    }
}

function selectMic(micId) {
    const selectedMic = allMics.find(mic => mic.id === micId);
    if (!selectedMic) return;
    
    // Add to recently used
    addToRecentlyUsed(micId);
    
    // Close mic selection modal
    const micSelectionModal = document.getElementById('mic-selection-modal');
    closeModal(micSelectionModal);
    
    // Check if we're selecting a mic for an existing form or creating a new one
    const isForExistingForm = window.isSelectingMicForForm;
    
    if (isForExistingForm) {
        // Just fill in the venue field and return to the existing form
        const venueField = document.getElementById('venue');
        if (venueField) venueField.value = selectedMic.venue;
        
        // Reset the flag
        window.isSelectingMicForForm = false;
        
        // Ensure the Add Set modal is visible
        const addEditModal = document.getElementById('add-edit-modal');
        if (addEditModal && !addEditModal.classList.contains('is-visible')) {
            openModal(addEditModal);
        }
        
        return;
    }
    
    // Original behavior for creating a new set from mic
    const formTitle = document.getElementById('formTitle');
    const setForm = document.getElementById('setForm');
    const setIdInput = document.getElementById('setId');
    
    if (formTitle) formTitle.textContent = 'Log New Set from Mic';
    if (setForm) setForm.reset();
    if (setIdInput) setIdInput.value = '';
    
    // Fill in venue name
    const venueField = document.getElementById('venue');
    if (venueField) venueField.value = selectedMic.venue;
    
    // Set event title to "Open Mic" by default
    const titleField = document.getElementById('event-title');
    if (titleField) titleField.value = 'Open Mic';
    
    // Set event type to open mic (green)
    const typeField = document.getElementById('event-type');
    if (typeField) typeField.value = 'green';
    
    // Calculate next date for this day of week
    const today = new Date();
    const targetDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(selectedMic.day);
    const daysUntilTarget = (targetDay - today.getDay() + 7) % 7;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
    
    const dateField = document.getElementById('date');
    if (dateField) dateField.value = nextDate.toISOString().split('T')[0];
    
    // Add mic details to notes
    const notesField = document.getElementById('notes');
    if (notesField) {
        let notes = `Added from Mic Finder.\n`;
        if (selectedMic.host) notes += `Host: ${selectedMic.host}\n`;
        if (selectedMic.cost) notes += `Cost: ${selectedMic.cost}\n`;
        if (selectedMic.signupTime) notes += `Signup: ${selectedMic.signupTime}\n`;
        if (selectedMic.address) notes += `Address: ${selectedMic.address}\n`;
        notesField.value = notes;
    }
    
    // Open the add set modal
    const addEditModal = document.getElementById('add-edit-modal');
    if (addEditModal) openModal(addEditModal);
    
    showNotification(`Pre-filled form with ${selectedMic.venue} details!`);
}

// Bottom navigation management
function updateBottomNavigation(activeView) {
    const navItems = document.querySelectorAll('.bottom-nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    const activeNavMapping = {
        'calendar': 'calendarNavBtn',
        'jokes': 'jokesNavBtn',
        'stats': 'statsNavBtn',
        'settings': 'settingsNavBtn'
    };
    
    const activeNavId = activeNavMapping[activeView];
    if (activeNavId) {
        const activeNav = document.getElementById(activeNavId);
        if (activeNav) {
            activeNav.classList.add('active');
        }
    }
}

// Joke Bank Collapsible Functionality
function initializeJokeBankCollapse() {
    const isCollapsed = localStorage.getItem('jokeBankCollapsed') === 'true';
    const jokeBankPanel = document.querySelector('.joke-bank-panel');
    const jokeBankToggle = document.getElementById('jokeBankToggle');
    const jokeBankCollapsible = document.getElementById('jokeBankCollapsible');
    
    if (isCollapsed && jokeBankPanel && jokeBankToggle && jokeBankCollapsible) {
        // Set initial collapsed state
        jokeBankPanel.classList.add('collapsed');
        jokeBankToggle.classList.remove('expanded');
        jokeBankCollapsible.classList.add('collapsed');
    } else if (jokeBankToggle) {
        // Set initial expanded state
        jokeBankToggle.classList.add('expanded');
    }
}

function toggleJokeBankCollapse() {
    const jokeBankPanel = document.querySelector('.joke-bank-panel');
    const jokeBankToggle = document.getElementById('jokeBankToggle');
    const jokeBankCollapsible = document.getElementById('jokeBankCollapsible');
    
    if (!jokeBankPanel || !jokeBankToggle || !jokeBankCollapsible) return;
    
    const isCurrentlyCollapsed = jokeBankPanel.classList.contains('collapsed');
    
    if (isCurrentlyCollapsed) {
        // Expand
        jokeBankPanel.classList.remove('collapsed');
        jokeBankToggle.classList.add('expanded');
        jokeBankCollapsible.classList.remove('collapsed');
        localStorage.setItem('jokeBankCollapsed', 'false');
    } else {
        // Collapse
        jokeBankPanel.classList.add('collapsed');
        jokeBankToggle.classList.remove('expanded');
        jokeBankCollapsible.classList.add('collapsed');
        localStorage.setItem('jokeBankCollapsed', 'true');
    }
}

// Initialize collapse state when setlist builder is opened
document.addEventListener('DOMContentLoaded', () => {
    // Set up mutation observer to initialize when setlist builder is added to DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && (node.id === 'setlistBuilder' || node.querySelector('#setlistBuilder'))) {
                    setTimeout(() => initializeJokeBankCollapse(), 100);
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
});
