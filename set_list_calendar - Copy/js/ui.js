// UI Rendering Module - Handles all calendar rendering logic
import { dataStore } from './data.js';

export let currentWeek = new Date();
export let isExpandedView = false;

// DOM Element References
let calendarGrid, dateRangeEl, venueSearch, typeFilter;

export function initializeUIElements() {
    calendarGrid = document.getElementById('calendarGrid');
    dateRangeEl = document.getElementById('dateRange');
    venueSearch = document.getElementById('venueSearch');
    typeFilter = document.getElementById('typeFilter');
}

export function setCurrentWeek(date) {
    currentWeek = new Date(date);
}

export function setExpandedView(expanded) {
    isExpandedView = expanded;
}

export function renderCalendar() {
    if (!calendarGrid) return;
    
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
    const venueQuery = venueSearch?.value.toLowerCase() || '';
    const typeQuery = typeFilter?.value || 'all';
    const dateFrom = document.getElementById('dateFrom')?.value;
    const dateTo = document.getElementById('dateTo')?.value;
    const minJokes = parseInt(document.getElementById('minJokes')?.value) || 0;

    const filteredSets = dataStore.getAllSets().filter(set => {
        // Enhanced search - venue, notes, setlist/jokes
        let setlistMatch = false;
        if (set.setlist) {
            if (typeof set.setlist === 'string') {
                // Legacy string format
                setlistMatch = set.setlist.toLowerCase().includes(venueQuery);
            } else if (Array.isArray(set.setlist)) {
                // New array format - search through joke text
                const jokes = set.setlist.map(jokeId => dataStore.getJokeById(jokeId)).filter(joke => joke);
                setlistMatch = jokes.some(joke => 
                    joke.text.toLowerCase().includes(venueQuery) ||
                    joke.notes.toLowerCase().includes(venueQuery) ||
                    joke.tags.some(tag => tag.toLowerCase().includes(venueQuery))
                );
            }
        }
        
        const searchMatch = venueQuery === '' || 
            set.venue.toLowerCase().includes(venueQuery) ||
            (set.notes && set.notes.toLowerCase().includes(venueQuery)) ||
            setlistMatch;
        
        const typeMatch = typeQuery === 'all' || set.eventType === typeQuery;
        
        // Date range filtering
        const setDate = new Date(set.date);
        const fromMatch = !dateFrom || setDate >= new Date(dateFrom);
        const toMatch = !dateTo || setDate <= new Date(dateTo);
        
        // Minimum jokes filtering - handle both old string format and new array format
        let jokeCount = 0;
        if (set.setlist) {
            if (typeof set.setlist === 'string') {
                jokeCount = set.setlist.split('\n').filter(line => line.trim()).length;
            } else if (Array.isArray(set.setlist)) {
                jokeCount = set.setlist.length;
            }
        }
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
            <div class="day-header">
                <div class="day-name">${d.toLocaleDateString('en-us', { weekday: 'short' })}</div>
                <div class="day-number">${d.getDate()}</div>
                <button class="add-set-btn" data-date="${dateString}" aria-label="Add set to ${d.toLocaleDateString()}" title="Add set to this day">+</button>
            </div>
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
            const eventPill = createEventPill(set);
            eventsContainer.appendChild(eventPill);
        }
    });

    // Add empty state messages for days with no events (only for future dates)
    Object.values(dayCells).forEach(dayCell => {
        const eventsContainer = dayCell.querySelector('.events-container');
        const cellDate = new Date(dayCell.dataset.date + 'T00:00:00');
        
        if (eventsContainer.children.length === 0 && cellDate >= today) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-day-message';
            emptyMessage.textContent = 'No sets scheduled';
            eventsContainer.appendChild(emptyMessage);
        }
    });
}

function createEventPill(set) {
    const eventPill = document.createElement('div');
    eventPill.className = `event-pill event-${set.eventType}`;
    eventPill.dataset.setId = set.id;
    eventPill.setAttribute('aria-label', `${set.title} at ${set.venue}`);
    eventPill.setAttribute('tabindex', '0');
    eventPill.setAttribute('role', 'button');
    
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
        venueDetail.innerHTML = `<i class="fas fa-map-marker-alt" aria-hidden="true"></i><span>${set.venue}</span>`;
        eventDetails.appendChild(venueDetail);
    }
    
    // Setlist count detail (if setlist exists)
    if (set.setlist) {
        let jokeCount = 0;
        
        // Handle both old string format and new array format
        if (typeof set.setlist === 'string' && set.setlist.trim()) {
            jokeCount = set.setlist.split('\n').filter(line => line.trim()).length;
        } else if (Array.isArray(set.setlist)) {
            jokeCount = set.setlist.length;
        }
        
        if (jokeCount > 0) {
            const setlistDetail = document.createElement('div');
            setlistDetail.className = 'event-detail';
            setlistDetail.innerHTML = `<i class="fas fa-list" aria-hidden="true"></i><span>${jokeCount} joke${jokeCount === 1 ? '' : 's'}</span>`;
            eventDetails.appendChild(setlistDetail);
        }
    }
    
    // Notes preview (if notes exist)
    if (set.notes && set.notes.trim()) {
        const notesPreview = set.notes.length > 20 ? set.notes.substring(0, 20) + '...' : set.notes;
        const notesDetail = document.createElement('div');
        notesDetail.className = 'event-detail';
        notesDetail.innerHTML = `<i class="fas fa-sticky-note" aria-hidden="true"></i><span>${notesPreview}</span>`;
        eventDetails.appendChild(notesDetail);
    }
    
    // Add image if imageUrl exists
    if (set.imageUrl && set.imageUrl.trim()) {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'event-image-container';
        
        const eventImage = document.createElement('img');
        eventImage.className = 'event-image';
        eventImage.src = set.imageUrl;
        eventImage.alt = `Image for ${set.title}`;
        eventImage.setAttribute('loading', 'lazy');
        
        // Handle image load errors gracefully
        eventImage.addEventListener('error', function() {
            this.style.display = 'none';
            // Optionally show a broken image icon
            const brokenIcon = document.createElement('div');
            brokenIcon.className = 'event-detail';
            brokenIcon.innerHTML = `<i class="fas fa-image" aria-hidden="true" style="opacity: 0.5"></i><span style="opacity: 0.5">Image unavailable</span>`;
            imageContainer.appendChild(brokenIcon);
        });
        
        imageContainer.appendChild(eventImage);
        eventDetails.appendChild(imageContainer);
    }
    
    eventPill.appendChild(eventTitle);
    eventPill.appendChild(eventDetails);
    return eventPill;
}

export function showListView() {
    const venueQuery = venueSearch?.value.toLowerCase() || '';
    const typeQuery = typeFilter?.value || 'all';
    
    const filteredSets = dataStore.getAllSets().filter(set => {
        const venueMatch = set.venue.toLowerCase().includes(venueQuery);
        const typeMatch = typeQuery === 'all' || set.eventType === typeQuery;
        return venueMatch && typeMatch;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const listHTML = filteredSets.map(set => {
        const date = new Date(set.date);
        // Handle both old string format and new array format for joke counting
        let jokeCount = 0;
        if (set.setlist) {
            if (typeof set.setlist === 'string') {
                jokeCount = set.setlist.split('\n').filter(line => line.trim()).length;
            } else if (Array.isArray(set.setlist)) {
                jokeCount = set.setlist.length;
            }
        }
        
        const typeLabels = {
            'blue': 'Showcase',
            'green': 'Open Mic',
            'orange': 'Corporate / Private',
            'red': 'Late Night'
        };
        
        return `
            <div class="list-item event-${set.eventType}" data-set-id="${set.id}" style="margin-bottom: 1rem; padding: 1rem; background: var(--bg-surface-2); border-radius: 8px; cursor: pointer; border-left: 4px solid;" role="button" tabindex="0" aria-label="Edit ${set.title} at ${set.venue}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                    <h4 style="margin: 0; font-size: 1.1rem; font-weight: 600;">${set.title}</h4>
                    <span style="font-size: 0.8rem; padding: 0.25rem 0.75rem; background: var(--accent-blue); color: white; border-radius: 12px;">${typeLabels[set.eventType]}</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">
                    <div><i class="fas fa-calendar" aria-hidden="true"></i> ${date.toLocaleDateString()}</div>
                    <div><i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${set.venue}</div>
                    ${jokeCount > 0 ? `<div><i class="fas fa-list" aria-hidden="true"></i> ${jokeCount} jokes</div>` : ''}
                    ${set.notes ? `<div><i class="fas fa-sticky-note" aria-hidden="true"></i> ${set.notes.length > 50 ? set.notes.substring(0, 50) + '...' : set.notes}</div>` : ''}
                </div>
                ${set.imageUrl && set.imageUrl.trim() ? `
                    <div style="margin-top: 0.75rem;">
                        <img src="${set.imageUrl}" alt="Image for ${set.title}" style="max-width: 200px; height: auto; max-height: 120px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color);" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <div style="display: none; color: var(--text-secondary); font-size: 0.8rem; margin-top: 0.5rem;"><i class="fas fa-image" style="opacity: 0.5"></i> Image unavailable</div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    calendarGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 1rem 0;">
            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">All Sets (${filteredSets.length})</h3>
            ${listHTML || '<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">No sets found</div>'}
        </div>
    `;
    
    return filteredSets;
}

// Joke Library UI Functions  
export function showJokeBankView() {
    // Hide calendar container and show joke library container
    const calendarContainer = document.getElementById('calendarContainer');
    const jokeBankContainer = document.getElementById('jokeBankContainer');
    
    if (calendarContainer) calendarContainer.style.display = 'none';
    if (jokeBankContainer) jokeBankContainer.style.display = 'block';
    
    // Initialize joke tag filter
    initializeJokeTagFilter();
    
    // Render jokes
    renderJokeBank();
    
    // Setup event listeners for joke library controls
    setupJokeBankEventListeners();
}

export function hideJokeBankView() {
    // Show calendar container and hide joke library container
    const calendarContainer = document.getElementById('calendarContainer');
    const jokeBankContainer = document.getElementById('jokeBankContainer');
    
    if (calendarContainer) calendarContainer.style.display = 'block';
    if (jokeBankContainer) jokeBankContainer.style.display = 'none';
}

function initializeJokeTagFilter() {
    const jokeTagFilter = document.getElementById('jokeTagFilter');
    if (!jokeTagFilter) return;
    
    // Get all unique tags from jokes
    const allJokes = dataStore.getAllJokes(true); // Include archived
    const tags = [...new Set(allJokes.flatMap(joke => joke.tags))].sort();
    
    // Clear existing options except "All Tags"
    jokeTagFilter.innerHTML = '<option value="">All Tags</option>';
    
    // Add tag options
    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        jokeTagFilter.appendChild(option);
    });
}

function setupJokeBankEventListeners() {
    const jokeSearch = document.getElementById('jokeSearch');
    const jokeTagFilter = document.getElementById('jokeTagFilter');
    const showArchivedJokes = document.getElementById('showArchivedJokes');
    const addJokeBtn = document.getElementById('addJokeBtn');
    
    // Search and filter handlers
    if (jokeSearch) {
        jokeSearch.addEventListener('input', renderJokeBank);
    }
    
    if (jokeTagFilter) {
        jokeTagFilter.addEventListener('change', renderJokeBank);
    }
    
    if (showArchivedJokes) {
        showArchivedJokes.addEventListener('change', renderJokeBank);
    }
    
    // Add joke button
    if (addJokeBtn) {
        addJokeBtn.addEventListener('click', () => {
            showJokeModal();
        });
    }
}

export function renderJokeBank() {
    const jokesGrid = document.getElementById('jokesGrid');
    if (!jokesGrid) return;
    
    // Get filter values
    const searchTerm = document.getElementById('jokeSearch')?.value || '';
    const selectedTag = document.getElementById('jokeTagFilter')?.value || '';
    const includeArchived = document.getElementById('showArchivedJokes')?.checked || false;
    
    // Get filtered jokes
    let jokes = dataStore.getAllJokes(includeArchived);
    
    // Apply search filter
    if (searchTerm) {
        jokes = dataStore.searchJokes(searchTerm, includeArchived);
    }
    
    // Apply tag filter
    if (selectedTag) {
        jokes = jokes.filter(joke => joke.tags.includes(selectedTag));
    }
    
    // Sort jokes by updated date (newest first)
    jokes.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    
    if (jokes.length === 0) {
        jokesGrid.innerHTML = `
            <div class="empty-jokes-state" style="grid-column: 1 / -1;">
                <i class="fas fa-lightbulb"></i>
                <h3>No jokes found</h3>
                <p>${searchTerm || selectedTag ? 'Try adjusting your search or filters.' : 'Start building your comedy arsenal by adding your first joke!'}</p>
                ${!searchTerm && !selectedTag ? '<button class="add-set-btn" onclick="showJokeModal()"><i class="fas fa-plus"></i> Add Your First Joke</button>' : ''}
            </div>
        `;
        return;
    }
    
    // Render joke cards
    jokesGrid.innerHTML = jokes.map(joke => createJokeCard(joke)).join('');
    
    // Add event listeners to joke cards
    addJokeCardEventListeners();
}

function createJokeCard(joke) {
    const lastPerformed = dataStore.getJokeLastPerformed(joke.id);
    const performances = dataStore.getJokePerformanceData(joke.id);
    const createdDate = new Date(joke.created_at).toLocaleDateString();
    const updatedDate = new Date(joke.updated_at).toLocaleDateString();
    
    // Calculate days since last performed
    let daysSincePerformed = null;
    if (lastPerformed) {
        const daysDiff = Math.floor((Date.now() - new Date(lastPerformed)) / (1000 * 60 * 60 * 24));
        daysSincePerformed = daysDiff;
    }
    
    return `
        <div class="joke-card ${joke.archived ? 'archived' : ''}" data-joke-id="${joke.id}">
            <div class="joke-actions">
                <button class="joke-action-btn edit" title="Edit joke" data-action="edit" data-joke-id="${joke.id}">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="joke-action-btn archive" title="${joke.archived ? 'Unarchive' : 'Archive'} joke" data-action="archive" data-joke-id="${joke.id}">
                    <i class="fas fa-${joke.archived ? 'box-open' : 'archive'}"></i>
                </button>
                <button class="joke-action-btn delete" title="Delete joke" data-action="delete" data-joke-id="${joke.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="joke-text">${joke.text}</div>
            
            <div class="joke-meta">
                <span><i class="fas fa-clock"></i> ${joke.estimated_duration}s</span>
                <span><i class="fas fa-calendar-plus"></i> ${createdDate}</span>
                ${joke.updated_at !== joke.created_at ? `<span><i class="fas fa-edit"></i> ${updatedDate}</span>` : ''}
            </div>
            
            ${joke.tags.length > 0 ? `
                <div class="joke-tags">
                    ${joke.tags.map(tag => `<span class="joke-tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
            
            ${joke.notes ? `
                <div class="joke-notes">${joke.notes}</div>
            ` : ''}
            
            ${performances.length > 0 ? `
                <div class="joke-performance">
                    <i class="fas fa-chart-line"></i> Performed ${performances.length} time${performances.length === 1 ? '' : 's'}
                    ${lastPerformed ? ` • Last: ${new Date(lastPerformed).toLocaleDateString()}${daysSincePerformed !== null ? ` (${daysSincePerformed}d ago)` : ''}` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

function addJokeCardEventListeners() {
    const jokeCards = document.querySelectorAll('.joke-card');
    
    jokeCards.forEach(card => {
        // Handle joke card click (edit)
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking on action buttons
            if (e.target.closest('.joke-action-btn')) return;
            
            const jokeId = parseInt(card.dataset.jokeId);
            const joke = dataStore.getJokeById(jokeId);
            if (joke) {
                showJokeModal(joke);
            }
        });
        
        // Handle action buttons
        const actionButtons = card.querySelectorAll('.joke-action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleJokeAction(btn.dataset.action, parseInt(btn.dataset.jokeId));
            });
        });
    });
}

function handleJokeAction(action, jokeId) {
    const joke = dataStore.getJokeById(jokeId);
    if (!joke) return;
    
    switch (action) {
        case 'edit':
            showJokeModal(joke);
            break;
        case 'archive':
            dataStore.archiveJoke(jokeId, !joke.archived);
            renderJokeBank();
            // Update tag filter in case this was the last joke with certain tags
            initializeJokeTagFilter();
            break;
        case 'delete':
            if (confirm(`Are you sure you want to permanently delete this joke?\n\n"${joke.text.length > 100 ? joke.text.substring(0, 100) + '...' : joke.text}"\n\nThis action cannot be undone.`)) {
                dataStore.deleteJoke(jokeId);
                renderJokeBank();
                initializeJokeTagFilter();
            }
            break;
    }
}

// Make joke modal function global
window.showJokeModal = showJokeModal;

export function showJokeModal(joke = null) {
    // This will be implemented in modals.js
    const modalEvent = new CustomEvent('showJokeModal', { detail: joke });
    document.dispatchEvent(modalEvent);
}
