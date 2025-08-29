// Modal Management Module - Handles all modal operations
import { dataStore } from './data.js';
import { renderCalendar } from './ui.js';

// Modal elements
let addEditModal, deleteConfirmModal, eventSummaryModal, micSelectionModal, addEditJokeModal;
let formTitle, setIdInput, setForm, jokeForm, jokeFormTitle;

export function initializeModalElements() {
    addEditModal = document.getElementById('add-edit-modal');
    deleteConfirmModal = document.getElementById('delete-confirm-modal');
    eventSummaryModal = document.getElementById('event-summary-modal');
    micSelectionModal = document.getElementById('mic-selection-modal');
    addEditJokeModal = document.getElementById('add-edit-joke-modal');
    setForm = document.getElementById('setForm');
    jokeForm = document.getElementById('jokeForm');
    formTitle = document.getElementById('formTitle');
    jokeFormTitle = document.getElementById('jokeFormTitle');
    setIdInput = document.getElementById('setId');
}

export function openModal(modal) { 
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

export function closeModal(modal) { 
    modal.classList.remove('is-visible');
    modal.removeAttribute('aria-modal');
    
    // Return focus to appropriate trigger element
    if (modal.id === 'mic-selection-modal') {
        // Check if we were selecting a mic for an existing form
        if (window.isSelectingMicForForm) {
            document.getElementById('addMicFromForm')?.focus();
        } else {
            document.getElementById('addMicBtn')?.focus();
        }
    }
}

export function showEventSummary(set) {
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
                <input type="text" id="summary-title" class="summary-title-input" value="${set.title}" placeholder="Event Title" aria-label="Event Title">
                <select id="summary-type" class="summary-type-select" style="background-color: ${typeColors[set.eventType]}" aria-label="Event Type">
                    <option value="blue" ${set.eventType === 'blue' ? 'selected' : ''}>Showcase</option>
                    <option value="green" ${set.eventType === 'green' ? 'selected' : ''}>Open Mic</option>
                    <option value="orange" ${set.eventType === 'orange' ? 'selected' : ''}>Corporate / Private</option>
                    <option value="red" ${set.eventType === 'red' ? 'selected' : ''}>Late Night</option>
                </select>
            </div>
            
            <div class="summary-details">
                <div class="summary-field">
                    <div class="summary-field-label">Venue</div>
                    <input type="text" id="summary-venue" class="summary-field-input" value="${set.venue}" placeholder="Venue name" aria-label="Venue">
                </div>
                <div class="summary-field">
                    <div class="summary-field-label">Date</div>
                    <input type="date" id="summary-date" class="summary-field-input" value="${set.date}" aria-label="Date">
                </div>
            </div>
            
            <div class="summary-setlist">
                <div class="summary-field-label">Setlist</div>
                ${getSetlistDisplayHTML(set.setlist)}
            </div>
            
            <div class="summary-details">
                <div class="summary-field">
                    <div class="summary-field-label">Tags</div>
                    <input type="text" id="summary-tags" class="summary-field-input" value="${set.tags ? set.tags.join(', ') : ''}" placeholder="e.g., new-material, practice, audition" aria-label="Tags">
                </div>
                <div class="summary-field">
                    <div class="summary-field-label">Goal</div>
                    <input type="text" id="summary-goal" class="summary-field-input" value="${set.goal || ''}" placeholder="e.g., Test new opener, Work on timing" aria-label="Goal">
                </div>
            </div>
            
            <div class="summary-field">
                <div class="summary-field-label">Image URL</div>
                <input type="url" id="summary-imageUrl" class="summary-field-input" value="${set.imageUrl || ''}" placeholder="https://example.com/image.jpg" aria-label="Image URL">
                ${set.imageUrl && set.imageUrl.trim() ? `
                    <div style="margin-top: 0.5rem;">
                        <img src="${set.imageUrl}" alt="Set image preview" style="max-width: 100%; height: auto; max-height: 150px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color);" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <div style="display: none; color: var(--text-secondary); font-size: 0.8rem; margin-top: 0.5rem;"><i class="fas fa-image" style="opacity: 0.5"></i> Image not available</div>
                    </div>
                ` : ''}
            </div>
            
            <div class="summary-notes">
                <div class="summary-field-label">Performance Notes</div>
                <textarea id="summary-notes" class="summary-textarea" placeholder="Enter performance notes" aria-label="Performance Notes">${set.notes || ''}</textarea>
            </div>
            
            <div class="summary-actions">
                <button type="button" class="form-btn btn-secondary" id="summary-cancel">Cancel</button>
                <button type="button" class="form-btn" id="print-setlist-btn" style="background: var(--accent-orange); color: white; border: none;">
                    <i class="fas fa-print"></i> Print Setlist
                </button>
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
    
    // Print button functionality
    const printBtn = document.getElementById('print-setlist-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            printSetlist(set);
        });
    }
    
    // Form submission saves changes
    summaryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveSummaryChanges();
    });
    
    openModal(eventSummaryModal);
}

function saveSummaryChanges() {
    const form = document.getElementById('summaryForm');
    const setId = parseInt(form.dataset.setId, 10);
    
    const tagsInput = document.getElementById('summary-tags').value;
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    // Handle setlist data - only update if there's a textarea (legacy format)
    const setlistTextarea = document.getElementById('summary-setlist');
    const setlistValue = setlistTextarea ? setlistTextarea.value : null;
    
    const updatedData = {
        title: document.getElementById('summary-title').value,
        venue: document.getElementById('summary-venue').value,
        date: document.getElementById('summary-date').value,
        eventType: document.getElementById('summary-type').value,
        notes: document.getElementById('summary-notes').value,
        tags: tags,
        goal: document.getElementById('summary-goal').value,
        imageUrl: document.getElementById('summary-imageUrl').value
    };
    
    // Only include setlist if we have a textarea (legacy format)
    if (setlistValue !== null) {
        updatedData.setlist = setlistValue;
    }

    dataStore.updateSet(setId, updatedData);
    
    // Close modal and refresh calendar
    closeModal(eventSummaryModal);
    renderCalendar();
}

export function showAddSetModal(prefilledData = {}) {
    formTitle.textContent = prefilledData.id ? 'Edit Set' : 'Log a New Set';
    setForm.reset();
    setIdInput.value = prefilledData.id || '';
    
    // Pre-fill form with provided data
    if (prefilledData.title) document.getElementById('event-title').value = prefilledData.title;
    if (prefilledData.venue) document.getElementById('venue').value = prefilledData.venue;
    if (prefilledData.date) document.getElementById('date').value = prefilledData.date;
    if (prefilledData.eventType) document.getElementById('event-type').value = prefilledData.eventType;
    if (prefilledData.notes) document.getElementById('notes').value = prefilledData.notes;
    if (prefilledData.tags) document.getElementById('tags').value = Array.isArray(prefilledData.tags) ? prefilledData.tags.join(', ') : prefilledData.tags;
    if (prefilledData.goal) document.getElementById('goal').value = prefilledData.goal;
    if (prefilledData.imageUrl) document.getElementById('imageUrl').value = prefilledData.imageUrl;
    
    // Handle setlist data - support both old string format and new array format
    if (prefilledData.setlist) {
        const legacyInput = document.getElementById('setlist');
        const setlistDataInput = document.getElementById('setlistData');
        
        if (typeof prefilledData.setlist === 'string') {
            // Legacy string format
            if (legacyInput) legacyInput.value = prefilledData.setlist;
            setlistDataInput.value = JSON.stringify([]);
        } else if (Array.isArray(prefilledData.setlist)) {
            // New array format with joke IDs
            setlistDataInput.value = JSON.stringify(prefilledData.setlist);
            if (legacyInput) legacyInput.value = ''; // Clear legacy input
        }
    } else {
        // No existing setlist
        document.getElementById('setlistData').value = JSON.stringify([]);
        const legacyInput = document.getElementById('setlist');
        if (legacyInput) legacyInput.value = '';
    }
    
    // Show existing tags as suggestions
    showTagSuggestions();
    
    // Initialize setlist builder
    initializeSetlistBuilder();
    
    openModal(addEditModal);
}

export function showDeleteConfirmation() {
    openModal(deleteConfirmModal);
}

export function showStatsModal() {
    const stats = dataStore.getPerformanceStats();
    const topVenues = dataStore.getTopVenues();
    const topJokes = dataStore.getJokeFrequency();
    const performanceByType = dataStore.getPerformanceCountByType();
    
    const typeLabels = {
        'blue': 'Showcase',
        'green': 'Open Mic',
        'orange': 'Corporate / Private',
        'red': 'Late Night'
    };
    
    const typeColors = {
        'blue': '#45a3ff',
        'green': '#32b977',
        'orange': '#f5c518',
        'red': '#ef4444'
    };
    
    const statsHTML = `
        <div style="max-width: 800px; width: 100%;">
            <h3>Performance Statistics</h3>
            
            <!-- Key Metrics -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 2rem 0;">
                <div style="text-align: center; padding: 1rem; background: var(--bg-surface-2); border-radius: 8px;">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--accent-blue);">${stats.totalSets}</div>
                    <div style="color: var(--text-secondary);">Total Sets</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--bg-surface-2); border-radius: 8px;">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--accent-green);">${stats.uniqueVenues}</div>
                    <div style="color: var(--text-secondary);">Venues</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--bg-surface-2); border-radius: 8px;">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--accent-orange);">${stats.totalJokes}</div>
                    <div style="color: var(--text-secondary);">Total Jokes</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--bg-surface-2); border-radius: 8px;">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--accent-red);">${stats.averageJokesPerSet}</div>
                    <div style="color: var(--text-secondary);">Avg per Set</div>
                </div>
            </div>
            
            <!-- Charts Section -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 2rem 0;">
                ${performanceByType.length > 0 ? `
                <div style="background: var(--bg-surface-2); padding: 1rem; border-radius: 8px;">
                    <h4 style="color: var(--text-primary); margin-bottom: 1rem; text-align: center;">Performance Types</h4>
                    <canvas id="performanceTypeChart" width="300" height="300"></canvas>
                </div>
                ` : ''}
                
                ${topVenues.length > 0 ? `
                <div style="background: var(--bg-surface-2); padding: 1rem; border-radius: 8px;">
                    <h4 style="color: var(--text-primary); margin-bottom: 1rem; text-align: center;">Top Venues</h4>
                    <canvas id="topVenuesChart" width="300" height="300"></canvas>
                </div>
                ` : ''}
            </div>
            
            <!-- Trend Analysis Charts -->
            <div style="margin: 2rem 0;">
                <h4 style="color: var(--text-primary); margin-bottom: 1rem;">Performance Over Time</h4>
                <div style="background: var(--bg-surface-2); padding: 1rem; border-radius: 8px;">
                    <canvas id="performanceTimelineChart" width="600" height="300"></canvas>
                </div>
            </div>
            
            ${topJokes.length > 0 ? `
            <div style="margin-bottom: 2rem;">
                <h4 style="color: var(--text-primary); margin-bottom: 1rem;">Top Jokes Performance</h4>
                <div style="display: grid; gap: 0.5rem; max-height: 200px; overflow-y: auto;">
                    ${topJokes.slice(0, 10).map(([joke, count]) => {
                        const percentage = Math.round((count / stats.totalSets) * 100);
                        const jokeData = dataStore.getJokePerformanceOverTime().find(j => j.joke.toLowerCase() === joke.toLowerCase());
                        const daysSinceUsed = jokeData ? jokeData.daysSinceLastUsed : 0;
                        const freshnessColor = daysSinceUsed > 90 ? 'var(--accent-green)' : daysSinceUsed > 30 ? 'var(--accent-orange)' : 'var(--accent-red)';
                        return `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--bg-surface-2); border-radius: 6px;">
                                <span style="font-family: monospace; font-size: 0.9rem; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${joke.length > 40 ? joke.substring(0, 40) + '...' : joke}</span>
                                <div style="display: flex; align-items: center; gap: 1rem;">
                                    <span style="color: var(--accent-blue); font-weight: 600;">${count}x (${percentage}%)</span>
                                    <span style="color: ${freshnessColor}; font-size: 0.8rem;">${daysSinceUsed}d ago</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-secondary);">
                    <span style="color: var(--accent-green);">●</span> Fresh (90+ days) 
                    <span style="color: var(--accent-orange);">●</span> Aging (30-90 days) 
                    <span style="color: var(--accent-red);">●</span> Overused (&lt;30 days)
                </div>
            </div>
            ` : ''}
            
            <button onclick="closeModal(eventSummaryModal)" style="width: 100%; padding: 0.75rem; background: var(--accent-blue); color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button>
        </div>
    `;
    
    document.getElementById('summaryContent').innerHTML = statsHTML;
    openModal(eventSummaryModal);
    
    // Initialize charts after modal is open
    // Show skeleton loaders immediately
    setTimeout(() => {
        document.getElementById('performanceTypeChart').parentElement.innerHTML = `
            <div style="height: 300px; display: flex; align-items: center; justify-content: center;">
                <div class="chart-skeleton">
                    <div class="skeleton-circle"></div>
                    <div class="skeleton-legend">
                        <div class="skeleton-legend-item"></div>
                        <div class="skeleton-legend-item"></div>
                        <div class="skeleton-legend-item"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('topVenuesChart').parentElement.innerHTML = `
            <div style="height: 300px; display: flex; align-items: center; justify-content: center;">
                <div class="chart-skeleton">
                    <div class="skeleton-bars">
                        <div class="skeleton-bar" style="height: 80%"></div>
                        <div class="skeleton-bar" style="height: 60%"></div>
                        <div class="skeleton-bar" style="height: 100%"></div>
                        <div class="skeleton-bar" style="height: 40%"></div>
                        <div class="skeleton-bar" style="height: 70%"></div>
                    </div>
                </div>
            </div>
        `;
    }, 100);
    
    // Initialize charts after loading simulation
    setTimeout(() => {
        // Restore chart containers
        document.querySelector('.chart-container:first-of-type').innerHTML = `
            <h4 style="margin-bottom: 1rem; color: var(--text-primary);">Performance Types</h4>
            <canvas id="performanceTypeChart" width="400" height="300"></canvas>
        `;
        
        document.querySelector('.chart-container:last-of-type').innerHTML = `
            <h4 style="margin-bottom: 1rem; color: var(--text-primary);">Top Venues</h4>
            <canvas id="topVenuesChart" width="400" height="300"></canvas>
        `;
        
        initializeStatsCharts(performanceByType, topVenues, typeLabels, typeColors);
        
        // Initialize trend analysis chart
        const timelineData = dataStore.getPerformanceOverTime();
        if (timelineData.length > 0) {
            initializeTimelineChart(timelineData);
        }
    }, 800);
}

export function showSettingsModal() {
    const settings = dataStore.getSettings();
    
    const settingsHTML = `
        <h3>Settings</h3>
        <form id="settingsForm">
            <div style="margin: 2rem 0;">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Default View</label>
                    <select id="defaultView" name="defaultView" style="width: 100%; padding: 0.5rem; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);" aria-label="Default View">
                        <option value="week" ${settings.defaultView === 'week' ? 'selected' : ''}>Week View</option>
                        <option value="month" ${settings.defaultView === 'month' ? 'selected' : ''}>Month View</option>
                        <option value="list" ${settings.defaultView === 'list' ? 'selected' : ''}>List View</option>
                    </select>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Theme</label>
                    <select id="theme" name="theme" style="width: 100%; padding: 0.5rem; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);" aria-label="Theme">
                        <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark Mode</option>
                        <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light Mode</option>
                    </select>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="checkbox" id="notifications" name="notifications" ${settings.notifications ? 'checked' : ''} style="margin: 0;">
                        <span style="font-weight: 500;">Show notifications</span>
                    </label>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="checkbox" id="autoSave" name="autoSave" ${settings.autoSave ? 'checked' : ''} style="margin: 0;">
                        <span style="font-weight: 500;">Auto-save changes</span>
                    </label>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Help & Support</label>
                    <button type="button" data-action="restart-tour" style="width: 100%; padding: 0.5rem; background: var(--accent-orange); color: white; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 0.5rem;">Restart Welcome Tour</button>
                    <button type="button" data-action="send-feedback" style="width: 100%; padding: 0.5rem; background: var(--accent-blue); color: white; border: none; border-radius: 6px; cursor: pointer;">Send Feedback</button>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Data Management</label>
                    <button type="button" data-action="export-data" style="width: 100%; padding: 0.5rem; background: var(--accent-green); color: white; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 0.5rem;">Export My Data (JSON)</button>
                    <button type="button" data-action="clear-data" style="width: 100%; padding: 0.5rem; background: var(--accent-red); color: white; border: none; border-radius: 6px; cursor: pointer;">Clear All Data</button>
                </div>
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button type="button" class="form-btn btn-secondary modal-cancel-btn">Cancel</button>
                <button type="submit" class="form-btn btn-primary" id="saveSettingsBtn">
                    <span id="saveSettingsText">Save Settings</span>
                    <span id="saveSettingsCheck" style="display: none;">✓ Saved!</span>
                </button>
            </div>
        </form>
    `;
    
    document.getElementById('summaryContent').innerHTML = settingsHTML;
    
    // Add form submission handler
    const settingsForm = document.getElementById('settingsForm');
    settingsForm.addEventListener('submit', handleSettingsSubmit);
    
    // Add event delegation for action buttons
    settingsForm.addEventListener('click', handleSettingsActions);
    
    openModal(eventSummaryModal);
}

function handleSettingsActions(e) {
    const button = e.target.closest('[data-action]');
    if (!button) return;
    
    const action = button.dataset.action;
    
    switch(action) {
        case 'restart-tour':
            restartTour();
            break;
        case 'send-feedback':
            window.open('mailto:support@micfinderapp.com?subject=Mic Calendar Feedback', '_blank');
            break;
        case 'export-data':
            exportData();
            break;
        case 'clear-data':
            clearAllData();
            break;
    }
}

function handleSettingsSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const newSettings = {
        defaultView: formData.get('defaultView'),
        theme: formData.get('theme'),
        notifications: formData.has('notifications'),
        autoSave: formData.has('autoSave')
    };
    
    // Save settings
    dataStore.updateSettings(newSettings);
    
    // Apply theme immediately if changed
    if (newSettings.theme !== dataStore.getSetting('theme')) {
        applyTheme(newSettings.theme);
    }
    
    // Show save confirmation with animation
    showSaveConfirmation();
    
    // Close modal after a brief delay
    setTimeout(() => {
        closeModal(eventSummaryModal);
        showNotification('Settings saved successfully!', 'success');
    }, 1000);
}

function showSaveConfirmation() {
    const saveBtn = document.getElementById('saveSettingsBtn');
    const saveText = document.getElementById('saveSettingsText');
    const saveCheck = document.getElementById('saveSettingsCheck');
    
    if (saveBtn && saveText && saveCheck) {
        saveBtn.style.background = 'var(--accent-green)';
        saveText.style.display = 'none';
        saveCheck.style.display = 'inline';
        saveBtn.disabled = true;
    }
}

function applyTheme(theme) {
    // Theme application logic - for now just update CSS variables
    const root = document.documentElement;
    if (theme === 'light') {
        // Light theme colors
        root.style.setProperty('--bg-main', '#ffffff');
        root.style.setProperty('--bg-surface', '#f8f9fa');
        root.style.setProperty('--bg-surface-2', '#e9ecef');
        root.style.setProperty('--text-primary', '#212529');
        root.style.setProperty('--text-secondary', '#6c757d');
        root.style.setProperty('--border-color', '#dee2e6');
    } else {
        // Dark theme colors (default)
        root.style.setProperty('--bg-main', '#18191a');
        root.style.setProperty('--bg-surface', '#232533');
        root.style.setProperty('--bg-surface-2', '#3a3b3c');
        root.style.setProperty('--text-primary', '#e4e6eb');
        root.style.setProperty('--text-secondary', '#b0b3b8');
        root.style.setProperty('--border-color', '#3e4042');
    }
}

// Utility function to show notifications
export function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'var(--accent-green)' : 
                   type === 'error' ? 'var(--accent-red)' : 'var(--accent-blue)';
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
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'check-circle'}" aria-hidden="true"></i>
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

// Export data functionality (local function)
function exportData() {
    const data = {
        sets: dataStore.getAllSets(),
        setlists: dataStore.getAllSetlists(),
        settings: dataStore.getSettings(),
        exportDate: new Date().toISOString(),
        version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mic-calendar-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!');
}

// Timeline chart initialization function
function initializeTimelineChart(timelineData) {
    const timelineChart = document.getElementById('performanceTimelineChart');
    if (!timelineChart || typeof Chart === 'undefined') return;
    
    const labels = timelineData.map(data => {
        const date = new Date(data.month + '-01');
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    
    new Chart(timelineChart, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Sets Per Month',
                    data: timelineData.map(data => data.sets),
                    borderColor: '#45a3ff',
                    backgroundColor: 'rgba(69, 163, 255, 0.1)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Avg Jokes Per Set',
                    data: timelineData.map(data => data.avgJokesPerSet),
                    borderColor: '#32b977',
                    backgroundColor: 'rgba(50, 185, 119, 0.1)',
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1'
                },
                {
                    label: 'Unique Venues',
                    data: timelineData.map(data => data.uniqueVenues),
                    borderColor: '#f5c518',
                    backgroundColor: 'rgba(245, 197, 24, 0.1)',
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#e4e6eb',
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const monthData = timelineData[context.dataIndex];
                            return [
                                `Total Jokes: ${monthData.jokes}`,
                                `Most Common Type: ${Object.keys(monthData.types).reduce((a, b) => monthData.types[a] > monthData.types[b] ? a : b, 'none')}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#e4e6eb'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#e4e6eb'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        color: '#e4e6eb'
                    }
                }
            }
        }
    });
}

// Chart initialization function
function initializeStatsCharts(performanceByType, topVenues, typeLabels, typeColors) {
    // Only initialize if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not available for stats visualization');
        return;
    }
    
    // Performance Types Pie Chart
    const performanceChart = document.getElementById('performanceTypeChart');
    if (performanceChart && performanceByType.length > 0) {
        const chart = new Chart(performanceChart, {
            type: 'doughnut',
            data: {
                labels: performanceByType.map(([type]) => typeLabels[type] || type),
                datasets: [{
                    data: performanceByType.map(([, count]) => count),
                    backgroundColor: performanceByType.map(([type]) => typeColors[type] || '#666'),
                    borderWidth: 2,
                    borderColor: '#18191a',
                    hoverBorderWidth: 4,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e4e6eb',
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} sets (${percentage}%)`;
                            },
                            afterLabel: function(context) {
                                return 'Click to view detailed breakdown';
                            }
                        }
                    }
                },
                onHover: (event, elements) => {
                    event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const eventType = performanceByType[index][0];
                        showPerformanceTypeDetails(eventType, typeLabels[eventType]);
                    }
                }
            }
        });
    }
    
    // Top Venues Bar Chart
    const venuesChart = document.getElementById('topVenuesChart');
    if (venuesChart && topVenues.length > 0) {
        const chart = new Chart(venuesChart, {
            type: 'bar',
            data: {
                labels: topVenues.map(([venue]) => venue.length > 15 ? venue.substring(0, 15) + '...' : venue),
                datasets: [{
                    label: 'Sets Performed',
                    data: topVenues.map(([, count]) => count),
                    backgroundColor: '#45a3ff',
                    borderColor: '#45a3ff',
                    borderWidth: 1,
                    hoverBackgroundColor: '#4f46e5',
                    hoverBorderColor: '#4f46e5',
                    hoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#b0b3b8',
                            stepSize: 1
                        },
                        grid: {
                            color: '#3e4042'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#b0b3b8',
                            maxRotation: 45
                        },
                        grid: {
                            color: '#3e4042'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const index = context[0].dataIndex;
                                return topVenues[index][0]; // Full venue name
                            },
                            label: function(context) {
                                const value = context.parsed.y;
                                return `${value} sets performed`;
                            },
                            afterLabel: function(context) {
                                return 'Click to view sets at this venue';
                            }
                        }
                    }
                },
                onHover: (event, elements) => {
                    event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const venueName = topVenues[index][0];
                        showVenueDetails(venueName);
                    }
                }
            }
        });
    }
}

// Local functions (no longer global)
async function restartTour() {
    closeModal(document.getElementById('event-summary-modal'));
    // Dynamically import the restart function to avoid circular dependencies
    const { restartOnboardingTour } = await import('./onboarding.js');
    restartOnboardingTour();
}

function clearAllData() {
    // Create and show a custom confirmation modal
    const confirmationHTML = `
        <div id="safe-delete-modal" class="modal-container is-visible confirm-modal">
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <h3>⚠️ Are You Sure?</h3>
                <p>This will permanently delete all your sets, jokes, and settings. This action cannot be undone. Please type <strong>DELETE</strong> to confirm.</p>
                <div class="form-group" style="margin: 2rem 0;">
                    <input type="text" id="delete-confirmation-input" class="filter-input" style="text-align: center; padding: 0.8rem;" placeholder="Type DELETE here">
                </div>
                <div class="confirm-actions">
                    <button id="cancel-safe-delete" class="form-btn btn-secondary">Cancel</button>
                    <button id="confirm-safe-delete" class="form-btn btn-danger" disabled>Permanently Delete</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', confirmationHTML);

    // Add event listeners for the new modal
    const modal = document.getElementById('safe-delete-modal');
    const input = document.getElementById('delete-confirmation-input');
    const confirmBtn = document.getElementById('confirm-safe-delete');
    const cancelBtn = document.getElementById('cancel-safe-delete');

    input.addEventListener('input', () => {
        confirmBtn.disabled = input.value !== 'DELETE';
    });

    cancelBtn.addEventListener('click', () => modal.remove());
    modal.querySelector('.modal-overlay').addEventListener('click', () => modal.remove());

    confirmBtn.addEventListener('click', () => {
        // Clear localStorage
        localStorage.removeItem('micCalendarSets');
        localStorage.removeItem('micCalendarSetlists');
        localStorage.removeItem('micCalendarSettings');
        localStorage.removeItem('micCalendarJokes');
        localStorage.removeItem('hasCompletedOnboarding');
        localStorage.removeItem('recentlyUsedMics');
        
        // Reset data store
        dataStore.sets = [];
        dataStore.savedSetlists = [];
        dataStore.jokes = [];
        dataStore.userSettings = {
            defaultView: 'week',
            theme: 'dark',
            notifications: true,
            autoSave: true,
            showOnboarding: true
        };
        
        // Close modals and refresh
        modal.remove();
        closeModal(document.getElementById('event-summary-modal'));
        showNotification('All data cleared. Refreshing page...', 'info');
        
        // Refresh page after a brief delay
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    });
}

// Tag suggestions functionality
function showTagSuggestions() {
    const container = document.getElementById('tagsSuggestions');
    if (!container) return;
    
    const existingTags = dataStore.getAllTags();
    const commonTags = ['new-material', 'practice', 'audition', 'corporate', 'clean', 'late-night', 'headlining', 'open-mic'];
    const allTags = [...new Set([...commonTags, ...existingTags])];
    
    container.innerHTML = allTags.map(tag => 
        `<span class="tag-suggestion" data-tag="${tag}" style="
            padding: 0.25rem 0.5rem; 
            background: var(--bg-surface); 
            border: 1px solid var(--border-color); 
            border-radius: 12px; 
            font-size: 0.8rem; 
            cursor: pointer; 
            color: var(--text-secondary);
            transition: all 0.2s ease;
        " onmouseover="this.style.background='var(--accent-blue)'; this.style.color='white';" 
           onmouseout="this.style.background='var(--bg-surface)'; this.style.color='var(--text-secondary)';"
           onclick="addTagFromSuggestion('${tag}')">${tag}</span>`
    ).join('');
}

// Global function to add tag from suggestion
window.addTagFromSuggestion = function(tag) {
    const tagsInput = document.getElementById('tags');
    if (!tagsInput) return;
    
    const currentTags = tagsInput.value ? tagsInput.value.split(',').map(t => t.trim()) : [];
    if (!currentTags.includes(tag)) {
        currentTags.push(tag);
        tagsInput.value = currentTags.join(', ');
    }
};

// Print setlist functionality
function printSetlist(set) {
    const typeLabels = {
        'blue': 'Showcase',
        'green': 'Open Mic', 
        'orange': 'Corporate / Private',
        'red': 'Late Night'
    };
    
    let jokes = [];
    if (set.setlist) {
        if (typeof set.setlist === 'string') {
            jokes = set.setlist.split('\n').filter(line => line.trim());
        } else if (Array.isArray(set.setlist)) {
            // New format - get actual joke objects
            jokes = set.setlist.map(jokeId => dataStore.getJokeById(jokeId)).filter(joke => joke).map(joke => joke.text);
        }
    }
    
    const printWindow = window.open('', '_blank');
    const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Setlist - ${set.title}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 2rem;
                    color: #333;
                    line-height: 1.6;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #333;
                    padding-bottom: 1rem;
                    margin-bottom: 2rem;
                }
                .header h1 {
                    margin: 0;
                    font-size: 2rem;
                }
                .details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                .detail-item {
                    margin: 0.5rem 0;
                }
                .detail-label {
                    font-weight: 600;
                    color: #666;
                }
                .setlist {
                    margin: 2rem 0;
                }
                .setlist h3 {
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 0.5rem;
                }
                .joke-list {
                    list-style: none;
                    padding: 0;
                }
                .joke-item {
                    padding: 0.75rem;
                    margin: 0.5rem 0;
                    background: #fff;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    border-left: 4px solid #007bff;
                }
                .tags {
                    margin: 1rem 0;
                }
                .tag {
                    display: inline-block;
                    padding: 0.25rem 0.5rem;
                    background: #e9ecef;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    margin: 0.2rem;
                }
                .notes {
                    margin-top: 2rem;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border-left: 4px solid #28a745;
                }
                .goal {
                    margin-top: 1rem;
                    padding: 1rem;
                    background: #fff3cd;
                    border-radius: 8px;
                    border-left: 4px solid #ffc107;
                }
                @media print {
                    body { margin: 0; padding: 1rem; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${set.title}</h1>
                <p style="margin: 0.5rem 0; color: #666;">${typeLabels[set.eventType]} • ${new Date(set.date).toLocaleDateString()}</p>
            </div>

            <div class="details">
                <div class="detail-item">
                    <div class="detail-label">Venue:</div>
                    <div>${set.venue}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Date:</div>
                    <div>${new Date(set.date).toLocaleDateString()}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Type:</div>
                    <div>${typeLabels[set.eventType]}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Total Jokes:</div>
                    <div>${jokes.length}</div>
                </div>
            </div>

            ${set.tags && set.tags.length ? `
                <div class="tags">
                    <strong>Tags:</strong>
                    ${set.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            ` : ''}

            ${set.goal ? `
                <div class="goal">
                    <strong>Performance Goal:</strong> ${set.goal}
                </div>
            ` : ''}

            <div class="setlist">
                <h3>Setlist (${jokes.length} jokes)</h3>
                ${jokes.length > 0 ? `
                    <ol class="joke-list">
                        ${jokes.map((joke, index) => `
                            <li class="joke-item">
                                <strong>${index + 1}.</strong> ${joke}
                            </li>
                        `).join('')}
                    </ol>
                ` : '<p><em>No setlist provided</em></p>'}
            </div>

            ${set.notes ? `
                <div class="notes">
                    <strong>Performance Notes:</strong><br>
                    ${set.notes.replace(/\n/g, '<br>')}
                </div>
            ` : ''}

            <div class="no-print" style="text-align: center; margin-top: 2rem; padding: 1rem; border-top: 1px solid #ddd;">
                <button onclick="window.print()" style="padding: 0.75rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 1rem;">
                    🖨️ Print
                </button>
                <button onclick="window.close()" style="padding: 0.75rem 1.5rem; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Close
                </button>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(printHTML);
    printWindow.document.close();
    printWindow.focus();
}

// Chart drill-down functions
function showPerformanceTypeDetails(eventType, typeName) {
    const sets = dataStore.getAllSets().filter(set => set.eventType === eventType);
    const venues = [...new Set(sets.map(s => s.venue))];
    const totalJokes = sets.reduce((total, set) => {
        let jokeCount = 0;
        if (set.setlist) {
            if (typeof set.setlist === 'string') {
                jokeCount = set.setlist.split('\n').filter(line => line.trim()).length;
            } else if (Array.isArray(set.setlist)) {
                jokeCount = set.setlist.length;
            }
        }
        return total + jokeCount;
    }, 0);
    
    const recentSets = sets
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    const detailHTML = `
        <div style="max-width: 600px;">
            <h3>${typeName} Performance Details</h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin: 1.5rem 0;">
                <div style="text-align: center; padding: 1rem; background: var(--bg-surface-2); border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-blue);">${sets.length}</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">Total Sets</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--bg-surface-2); border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-green);">${venues.length}</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">Venues</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--bg-surface-2); border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-orange);">${totalJokes}</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">Total Jokes</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--bg-surface-2); border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-red);">${sets.length > 0 ? Math.round(totalJokes / sets.length) : 0}</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">Avg Jokes</div>
                </div>
            </div>
            
            <h4 style="margin: 1.5rem 0 1rem 0;">Recent ${typeName} Sets</h4>
            <div style="max-height: 300px; overflow-y: auto;">
                ${recentSets.map(set => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-surface-2); border-radius: 6px; margin-bottom: 0.5rem;">
                        <div>
                            <div style="font-weight: 600; color: var(--text-primary);">${set.title}</div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">${set.venue} • ${new Date(set.date).toLocaleDateString()}</div>
                        </div>
                        <div style="text-align: right; color: var(--accent-blue); font-weight: 600;">
                            ${(() => {
                                let jokeCount = 0;
                                if (set.setlist) {
                                    if (typeof set.setlist === 'string') {
                                        jokeCount = set.setlist.split('\n').filter(line => line.trim()).length;
                                    } else if (Array.isArray(set.setlist)) {
                                        jokeCount = set.setlist.length;
                                    }
                                }
                                return jokeCount;
                            })()} jokes
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                <button onclick="showStatsModal()" style="padding: 0.5rem 1rem; background: var(--accent-blue); color: white; border: none; border-radius: 6px; cursor: pointer;">← Back to Stats</button>
                <button onclick="closeModal(eventSummaryModal)" style="padding: 0.5rem 1rem; background: var(--bg-surface-2); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">Close</button>
            </div>
        </div>
    `;
    
    document.getElementById('summaryContent').innerHTML = detailHTML;
}

function showVenueDetails(venueName) {
    const sets = dataStore.getAllSets().filter(set => set.venue === venueName);
    const eventTypes = [...new Set(sets.map(s => s.eventType))];
    const totalJokes = sets.reduce((total, set) => {
        let jokeCount = 0;
        if (set.setlist) {
            if (typeof set.setlist === 'string') {
                jokeCount = set.setlist.split('\n').filter(line => line.trim()).length;
            } else if (Array.isArray(set.setlist)) {
                jokeCount = set.setlist.length;
            }
        }
        return total + jokeCount;
    }, 0);
    
    const typeLabels = {
        'blue': 'Showcase',
        'green': 'Open Mic',
        'orange': 'Corporate / Private',
        'red': 'Late Night'
    };
    
    const recentSets = sets
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 8);
    
    const bestSet = sets.reduce((best, current) => {
        let currentJokes = 0;
        if (current.setlist) {
            if (typeof current.setlist === 'string') {
                currentJokes = current.setlist.split('\n').filter(line => line.trim()).length;
            } else if (Array.isArray(current.setlist)) {
                currentJokes = current.setlist.length;
            }
        }
        
        let bestJokes = 0;
        if (best.setlist) {
            if (typeof best.setlist === 'string') {
                bestJokes = best.setlist.split('\n').filter(line => line.trim()).length;
            } else if (Array.isArray(best.setlist)) {
                bestJokes = best.setlist.length;
            }
        }
        
        return currentJokes > bestJokes ? current : best;
    }, sets[0]);
    
    const detailHTML = `
        <div style="max-width: 600px;">
            <h3>📍 ${venueName}</h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin: 1.5rem 0;">
                <div style="text-align: center; padding: 1rem; background: var(--bg-surface-2); border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-blue);">${sets.length}</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">Total Sets</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--bg-surface-2); border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-green);">${eventTypes.length}</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">Event Types</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--bg-surface-2); border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-orange);">${totalJokes}</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">Total Jokes</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--bg-surface-2); border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-red);">${bestSet ? (() => {
                        let jokeCount = 0;
                        if (bestSet.setlist) {
                            if (typeof bestSet.setlist === 'string') {
                                jokeCount = bestSet.setlist.split('\n').filter(line => line.trim()).length;
                            } else if (Array.isArray(bestSet.setlist)) {
                                jokeCount = bestSet.setlist.length;
                            }
                        }
                        return jokeCount;
                    })() : 0}</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">Best Set</div>
                </div>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <h4 style="margin-bottom: 0.5rem;">Performance Types at this Venue</h4>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${eventTypes.map(type => `
                        <span style="padding: 0.25rem 0.75rem; background: var(--bg-surface-2); border-radius: 12px; font-size: 0.8rem; color: var(--text-secondary);">
                            ${typeLabels[type] || type}
                        </span>
                    `).join('')}
                </div>
            </div>
            
            <h4 style="margin: 1.5rem 0 1rem 0;">All Sets at ${venueName}</h4>
            <div style="max-height: 300px; overflow-y: auto;">
                ${recentSets.map(set => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-surface-2); border-radius: 6px; margin-bottom: 0.5rem;">
                        <div>
                            <div style="font-weight: 600; color: var(--text-primary);">${set.title}</div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">${new Date(set.date).toLocaleDateString()} • ${typeLabels[set.eventType]}</div>
                            ${set.notes ? `<div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">${set.notes.length > 50 ? set.notes.substring(0, 50) + '...' : set.notes}</div>` : ''}
                        </div>
                        <div style="text-align: right; color: var(--accent-blue); font-weight: 600;">
                            ${(() => {
                                let jokeCount = 0;
                                if (set.setlist) {
                                    if (typeof set.setlist === 'string') {
                                        jokeCount = set.setlist.split('\n').filter(line => line.trim()).length;
                                    } else if (Array.isArray(set.setlist)) {
                                        jokeCount = set.setlist.length;
                                    }
                                }
                                return jokeCount;
                            })()} jokes
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                <button onclick="showStatsModal()" style="padding: 0.5rem 1rem; background: var(--accent-blue); color: white; border: none; border-radius: 6px; cursor: pointer;">← Back to Stats</button>
                <button onclick="closeModal(eventSummaryModal)" style="padding: 0.5rem 1rem; background: var(--bg-surface-2); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">Close</button>
            </div>
        </div>
    `;
    
    document.getElementById('summaryContent').innerHTML = detailHTML;
}

// Joke Bank Modal Functions
export function showJokeModal(joke = null) {
    if (!addEditJokeModal) return;
    
    jokeFormTitle.textContent = joke ? 'Edit Joke' : 'Add New Joke';
    jokeForm.reset();
    
    // Pre-fill form if editing
    if (joke) {
        document.getElementById('jokeId').value = joke.id;
        document.getElementById('jokeText').value = joke.text;
        document.getElementById('jokeTags').value = joke.tags.join(', ');
        document.getElementById('estimatedDuration').value = joke.estimated_duration;
        document.getElementById('jokeNotes').value = joke.notes || '';
    } else {
        document.getElementById('jokeId').value = '';
    }
    
    // Show existing tags as suggestions
    showJokeTagSuggestions();
    
    openModal(addEditJokeModal);
}

function showJokeTagSuggestions() {
    const container = document.getElementById('jokeTagsSuggestions');
    if (!container) return;
    
    // Get existing joke tags
    const allJokes = dataStore.getAllJokes(true);
    const existingTags = [...new Set(allJokes.flatMap(joke => joke.tags))];
    const commonJokeTags = ['opener', 'closer', 'clean', 'crowd-work', 'observational', 'personal', 'callback', 'physical', 'impression', 'one-liner', 'story', 'topical'];
    const allTags = [...new Set([...commonJokeTags, ...existingTags])];
    
    container.innerHTML = allTags.map(tag => 
        `<span class="tag-suggestion" data-tag="${tag}" onclick="addJokeTagFromSuggestion('${tag}')">${tag}</span>`
    ).join('');
}

// Handle joke form submission
export function handleJokeFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(jokeForm);
    const jokeId = formData.get('jokeId');
    const tags = formData.get('jokeTags') ? formData.get('jokeTags').split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    const jokeData = {
        text: formData.get('jokeText'),
        tags: tags,
        notes: formData.get('jokeNotes'),
        estimated_duration: parseInt(formData.get('estimatedDuration')) || 60
    };
    
    if (jokeId) {
        // Update existing joke
        dataStore.updateJoke(parseInt(jokeId), jokeData);
    } else {
        // Create new joke
        dataStore.addJoke(jokeData);
    }
    
    // Close modal and refresh joke bank
    closeModal(addEditJokeModal);
    
    // Trigger joke bank refresh if it's currently visible
    const jokeBankContainer = document.getElementById('jokeBankContainer');
    if (jokeBankContainer && jokeBankContainer.style.display !== 'none') {
        import('./ui.js').then(({ renderJokeBank }) => {
            renderJokeBank();
        });
    }
    
    // Also refresh the mini joke bank if the setlist builder is open
    const modalJokeBank = document.getElementById('modalJokeBank');
    if (modalJokeBank) {
        // Re-render mini joke bank
        renderMiniJokeBank();
    }
}

// Global function to add tag from suggestion
window.addJokeTagFromSuggestion = function(tag) {
    const tagsInput = document.getElementById('jokeTags');
    if (!tagsInput) return;
    
    const currentTags = tagsInput.value ? tagsInput.value.split(',').map(t => t.trim()) : [];
    if (!currentTags.includes(tag)) {
        currentTags.push(tag);
        tagsInput.value = currentTags.join(', ');
    }
};

// Listen for custom joke modal events
document.addEventListener('showJokeModal', (event) => {
    showJokeModal(event.detail);
});

// Setlist Builder Implementation
let currentSetlistData = [];
let jokeBankSortable = null;
let currentSetlistSortable = null;
let renderDebounceTimer = null;
let dragOperationInProgress = false;

// Global debug functions for troubleshooting
window.enableDragDropDebug = function() {
    localStorage.setItem('debugDragDrop', 'true');
    console.log('🔧 Drag & Drop debug mode enabled. Try dragging a joke now.');
    console.log('Available jokes:', dataStore.getAllJokes().map(j => ({ id: j.id, text: j.text.substring(0, 30) + '...' })));
};

window.disableDragDropDebug = function() {
    localStorage.removeItem('debugDragDrop');
    console.log('🔧 Drag & Drop debug mode disabled.');
};

window.debugJokeData = function() {
    const jokes = dataStore.getAllJokes();
    console.log('🔍 All jokes in database:', jokes);
    console.log('🔍 Current setlist data:', currentSetlistData);
    return { jokes, currentSetlistData };
};

// Migrate old ID-only format to new object format
function migrateSetlistData() {
    // Check if currentSetlistData is old format (array of numbers)
    if (currentSetlistData.length > 0 && typeof currentSetlistData[0] === 'number') {
        console.log('📦 Migrating setlist data to new format...');
        currentSetlistData = currentSetlistData.map(id => ({
            id: id,
            perfNote: ""
        }));
        document.getElementById('setlistData').value = JSON.stringify(currentSetlistData);
    }
}

// Helper function for debounced rendering
function debouncedRenderSetlistPanels() {
    if (renderDebounceTimer) {
        clearTimeout(renderDebounceTimer);
    }
    renderDebounceTimer = setTimeout(() => {
        renderCurrentSetlist();
        renderMiniJokeBank();
    }, 16); // ~60fps
}

// Helper function to validate joke ID and prevent duplicates
function validateJokeForSetlist(jokeId, debugMode = false) {
    if (debugMode) {
        console.log('🔍 Validating joke:', { 
            jokeId, 
            type: typeof jokeId, 
            isNaN: isNaN(jokeId),
            allJokes: dataStore.getAllJokes().map(j => ({ id: j.id, type: typeof j.id }))
        });
    }
    
    // Validate joke ID
    if (!jokeId || isNaN(jokeId)) {
        showNotification(`Invalid joke selected (ID: ${jokeId}, type: ${typeof jokeId})`, 'error');
        return false;
    }
    
    // Check if joke exists - try multiple lookup strategies
    let joke = dataStore.getJokeById(jokeId);
    
    if (!joke && debugMode) {
        console.log('🔍 Primary lookup failed, trying alternatives...');
    }
    
    // Additional fallback lookups if primary fails
    if (!joke) {
        const allJokes = dataStore.getAllJokes();
        
        // Try direct array search with loose equality
        joke = allJokes.find(j => j.id == jokeId); // Note: == instead of ===
        if (joke && debugMode) console.log('🔍 Found with loose equality:', joke);
        
        // Try searching by string conversion
        if (!joke) {
            joke = allJokes.find(j => j.id.toString() === jokeId.toString());
            if (joke && debugMode) console.log('🔍 Found with string conversion:', joke);
        }
        
        // Try parseFloat comparison for decimal IDs
        if (!joke && typeof jokeId === 'number') {
            joke = allJokes.find(j => parseFloat(j.id) === parseFloat(jokeId));
            if (joke && debugMode) console.log('🔍 Found with parseFloat comparison:', joke);
        }
        
        // Try closest match for truncated decimals
        if (!joke) {
            const intJokeId = Math.floor(jokeId);
            joke = allJokes.find(j => Math.floor(j.id) === intJokeId);
            if (joke && debugMode) console.log('🔍 Found with floor comparison:', joke);
        }
    }
    
    if (!joke) {
        const allJokeIds = dataStore.getAllJokes().map(j => j.id);
        const errorMsg = debugMode ? 
            `Joke not found (ID: ${jokeId}, type: ${typeof jokeId}). Available IDs: [${allJokeIds.join(', ')}]` :
            `Joke not found. Please try refreshing the page or contact support.`;
        showNotification(errorMsg, 'error');
        
        if (debugMode) {
            console.error('🚨 All joke lookup strategies failed:', { 
                searchedId: jokeId, 
                searchedType: typeof jokeId,
                availableIds: allJokeIds,
                availableTypes: allJokeIds.map(id => typeof id)
            });
        }
        return false;
    }
    
    // Prevent duplicates - check both old and new format
    const jokeIdNum = typeof jokeId === 'string' ? parseInt(jokeId) : jokeId;
    const setlistJokeIds = currentSetlistData.map(item => 
        typeof item === 'object' ? item.id : item
    );
    
    if (setlistJokeIds.includes(jokeIdNum) || setlistJokeIds.includes(jokeId)) {
        showNotification('Joke is already in your setlist', 'error');
        return false;
    }
    
    return true;
}

function initializeSetlistBuilder() {
    // Get current setlist data
    const setlistDataInput = document.getElementById('setlistData');
    currentSetlistData = setlistDataInput.value ? JSON.parse(setlistDataInput.value) : [];
    
    // Migrate old data format if needed
    migrateSetlistData();
    
    // Initialize mini joke bank
    initializeMiniJokeBank();
    
    // Render current setlist
    renderCurrentSetlist();
    
    // Setup drag-and-drop
    setupSetlistDragAndDrop();
    
    // Setup toggle between legacy and new builder
    setupLegacyToggle();
    
    // Setup search and filter
    setupMiniJokeBankFilters();
    
    // Setup joke quick-view functionality
    setupJokeQuickView();
    
    // Listen for setlist cleared event
    const setlistBuilder = document.getElementById('setlistBuilder');
    if (setlistBuilder) {
        setlistBuilder.addEventListener('setlistCleared', () => {
            currentSetlistData = [];
            renderCurrentSetlist();
            renderMiniJokeBank();
        });
    }
}

function initializeMiniJokeBank() {
    const modalJokeBankContainer = document.getElementById('modalJokeBank');
    const modalJokeTagFilter = document.getElementById('modalJokeTagFilter');
    
    if (!modalJokeBankContainer) return;
    
    // Populate tag filter
    const allJokes = dataStore.getAllJokes();
    const tags = [...new Set(allJokes.flatMap(joke => joke.tags))].sort();
    
    modalJokeTagFilter.innerHTML = '<option value="">All Tags</option>';
    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        modalJokeTagFilter.appendChild(option);
    });
    
    // Render jokes
    renderMiniJokeBank();
}

function renderMiniJokeBank() {
    const modalJokeBankContainer = document.getElementById('modalJokeBank');
    const searchTerm = document.getElementById('modalJokeSearch')?.value || '';
    const selectedTag = document.getElementById('modalJokeTagFilter')?.value || '';
    
    if (!modalJokeBankContainer) return;
    
    // Get filtered jokes
    let jokes = dataStore.getAllJokes(); // Non-archived only
    
    // Apply search filter
    if (searchTerm) {
        jokes = dataStore.searchJokes(searchTerm);
    }
    
    // Apply tag filter
    if (selectedTag) {
        jokes = jokes.filter(joke => joke.tags.includes(selectedTag));
    }
    
    // Remove jokes already in setlist (handle both old and new format)
    const setlistJokeIds = currentSetlistData.map(item => 
        typeof item === 'object' ? item.id : item
    );
    jokes = jokes.filter(joke => !setlistJokeIds.includes(joke.id));
    
    if (jokes.length === 0) {
        modalJokeBankContainer.innerHTML = `
            <div class="empty-joke-bank">
                <i class="fas fa-lightbulb"></i>
                <p>${searchTerm || selectedTag ? 'No jokes match your filters' : 'No jokes available'}</p>
                ${!searchTerm && !selectedTag ? '<button onclick="showJokeModal()">Add Your First Joke</button>' : ''}
            </div>
        `;
        return;
    }
    
    modalJokeBankContainer.innerHTML = jokes.map(joke => createJokeBankItem(joke)).join('');
}

function createJokeBankItem(joke) {
    const tags = joke.tags.slice(0, 3); // Show max 3 tags
    
    return `
        <div class="joke-bank-item" data-joke-id="${joke.id}">
            <div class="joke-item-text">${joke.text}</div>
            <div class="joke-item-meta">
                <div class="joke-item-tags">
                    ${tags.map(tag => `<span class="joke-item-tag">${tag}</span>`).join('')}
                    ${joke.tags.length > 3 ? `<span class="joke-item-tag">+${joke.tags.length - 3}</span>` : ''}
                </div>
                <div class="joke-item-duration">${joke.estimated_duration}s</div>
            </div>
        </div>
    `;
}

function renderCurrentSetlist() {
    const currentSetlistContainer = document.getElementById('currentSetlist');
    const jokeCountEl = document.getElementById('jokeCount');
    const totalDurationEl = document.getElementById('totalDuration');
    const clearBtn = document.getElementById('clearSetlistBtn');
    
    if (!currentSetlistContainer) return;
    
    // Show/hide clear button based on setlist length
    if (clearBtn) {
        if (currentSetlistData.length > 0) {
            clearBtn.style.display = 'inline-block';
        } else {
            clearBtn.style.display = 'none';
        }
    }
    
    if (currentSetlistData.length === 0) {
        currentSetlistContainer.innerHTML = `
            <div class="empty-setlist">
                <i class="fas fa-arrow-left"></i>
                <p>Drag jokes here to build your setlist</p>
            </div>
        `;
        
        if (jokeCountEl) jokeCountEl.textContent = '0 jokes';
        if (totalDurationEl) totalDurationEl.textContent = '0:00';
        return;
    }
    
    // Get joke objects for current setlist
    const setlistItems = currentSetlistData.map(item => ({
        item,
        joke: dataStore.getJokeById(typeof item === 'object' ? item.id : item)
    })).filter(entry => entry.joke);
    
    // Calculate total duration
    const totalSeconds = setlistItems.reduce((total, entry) =>
        total + (entry.joke.estimated_duration || 60), 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Update stats
    if (jokeCountEl) jokeCountEl.textContent = `${setlistItems.length} joke${setlistItems.length === 1 ? '' : 's'}`;
    if (totalDurationEl) totalDurationEl.textContent = durationStr;
    
    // Render setlist items
    currentSetlistContainer.innerHTML = setlistItems.map((entry, index) =>
        createSetlistItem(entry.joke, index + 1, entry.item)
    ).join('');
}

function createSetlistItem(joke, position, itemData) {
    // Handle both old and new format
    const perfNote = (itemData && typeof itemData === 'object') ? itemData.perfNote || '' : '';
    
    return `
        <div class="setlist-item" data-joke-id="${joke.id}">
            <i class="fas fa-grip-vertical drag-handle"></i>
            <div class="setlist-item-number">${position}</div>
            
            <div class="setlist-item-content">
                <!-- This new wrapper keeps the main info together -->
                <div class="joke-info">
                    <div class="joke-item-text">${joke.text}</div>
                    <div class="joke-item-meta">
                        <span>${joke.tags.join(', ')}</span>
                        <div class="joke-item-duration">${joke.estimated_duration || 60}s</div>
                    </div>
                </div>
                <textarea class="performance-note-input ${perfNote ? 'active' : ''}" placeholder="Add performance note..." data-joke-id="${joke.id}">${perfNote}</textarea>
            </div>

            <div class="setlist-item-actions">
                <i class="fas fa-comment-dots performance-note-icon" title="Add performance note" data-joke-id="${joke.id}"></i>
                <button class="remove-joke-btn" title="Remove joke" data-action="remove" data-joke-id="${joke.id}">
                    <i class="fas fa-times" data-action="remove" data-joke-id="${joke.id}"></i>
                </button>
            </div>
        </div>
    `;
}

function setupSetlistDragAndDrop() {
    const modalJokeBankContainer = document.getElementById('modalJokeBank');
    const currentSetlistContainer = document.getElementById('currentSetlist');
    
    if (!modalJokeBankContainer || !currentSetlistContainer) return;
    
    // Destroy existing sortables
    if (jokeBankSortable) jokeBankSortable.destroy();
    if (currentSetlistSortable) currentSetlistSortable.destroy();
    
    // Joke Bank (source) - only allow pulling items out
    jokeBankSortable = new Sortable(modalJokeBankContainer, {
        group: {
            name: 'setlist',
            pull: 'clone',
            put: false
        },
        sort: false,
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onStart: function(evt) {
            dragOperationInProgress = true;
            evt.item.classList.add('dragging');
        },
        onEnd: function(evt) {
            dragOperationInProgress = false;
            evt.item.classList.remove('dragging');
            // Only remove cloned item if it wasn't successfully added to setlist
            // The onAdd handler will manage successful operations
            if (evt.to === modalJokeBankContainer) {
                // Drag was cancelled or failed, clean up the clone
                evt.item.remove();
            }
        }
    });
    
    // Current Setlist (target) - allow receiving and reordering
    currentSetlistSortable = new Sortable(currentSetlistContainer, {
        group: {
            name: 'setlist',
            pull: false,
            put: true
        },
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onAdd: function(evt) {
            const rawJokeId = evt.item.dataset.jokeId;
            // Use parseFloat to handle decimal IDs, then convert to match stored format
            const jokeId = parseFloat(rawJokeId);
            const newIndex = evt.newIndex;
            
            // Debug mode - enable when needed
            const debugMode = localStorage.getItem('debugDragDrop') === 'true';
            
            if (debugMode) {
                console.log('🎯 Drag operation:', {
                    rawJokeId,
                    jokeId,
                    rawType: typeof rawJokeId,
                    parsedType: typeof jokeId,
                    newIndex,
                    element: evt.item
                });
            }
            
            // Validate joke before adding to setlist
            if (validateJokeForSetlist(jokeId, debugMode)) {
                // Use the exact joke ID as found in the database
                const foundJoke = dataStore.getJokeById(jokeId);
                const newItem = { id: foundJoke.id, perfNote: "" };
                
                // Add to setlist at the correct position
                currentSetlistData.splice(newIndex, 0, newItem);
                document.getElementById('setlistData').value = JSON.stringify(currentSetlistData);
                
                // Success - remove the original dragged item (it's now been replaced by rendered content)
                evt.item.remove();
                
                // Re-render both panels with debouncing
                debouncedRenderSetlistPanels();
                
                // Add flash animation to the newly added element
                setTimeout(() => {
                    const setlistContainer = document.getElementById('currentSetlist');
                    const addedItem = setlistContainer.children[newIndex];
                    if (addedItem) {
                        addedItem.classList.add('flash');
                        // Remove the flash class after animation completes
                        setTimeout(() => {
                            addedItem.classList.remove('flash');
                        }, 700);
                    }
                }, 50);
                
                // Show success feedback
                const jokePreview = foundJoke.text.substring(0, 30) + (foundJoke.text.length > 30 ? '...' : '');
                showNotification(`Added "${jokePreview}" to setlist`, 'success');
            } else {
                // Failed validation - remove the dragged item and don't add to setlist
                evt.item.remove();
                if (debugMode) {
                    console.error('🚨 Validation failed, removed dragged item');
                }
            }
        },
        onUpdate: function(evt) {
            // Reorder within setlist
            const rawJokeId = evt.item.dataset.jokeId;
            const jokeId = parseFloat(rawJokeId);
            const oldIndex = evt.oldIndex;
            const newIndex = evt.newIndex;
            
            // Validate joke ID
            if (!jokeId || isNaN(jokeId)) {
                showNotification('Error reordering joke', 'error');
                return;
            }
            
            // Validate indices
            if (oldIndex < 0 || newIndex < 0 || oldIndex >= currentSetlistData.length) {
                showNotification('Error reordering joke', 'error');
                return;
            }
            
            // Get the item being moved
            const itemToMove = currentSetlistData[oldIndex];
            
            // Remove from old position and insert at new position
            currentSetlistData.splice(oldIndex, 1);
            currentSetlistData.splice(newIndex, 0, itemToMove);
            
            // Update hidden input
            document.getElementById('setlistData').value = JSON.stringify(currentSetlistData);
            
            // Re-render setlist with debouncing
            debouncedRenderSetlistPanels();
        }
    });
}

function setupLegacyToggle() {
    const toggleBtn = document.getElementById('toggleLegacySetlist');
    const setlistBuilder = document.getElementById('setlistBuilder');
    const legacyInput = document.getElementById('legacySetlistInput');
    
    if (!toggleBtn || !setlistBuilder || !legacyInput) return;
    
    toggleBtn.addEventListener('click', () => {
        const isLegacyVisible = legacyInput.style.display !== 'none';
        
        if (isLegacyVisible) {
            // Switch to new builder
            legacyInput.style.display = 'none';
            setlistBuilder.style.display = 'block';
            toggleBtn.innerHTML = '<i class="fas fa-keyboard"></i>';
            toggleBtn.title = 'Switch to text input';
        } else {
            // Switch to legacy input
            setlistBuilder.style.display = 'none';
            legacyInput.style.display = 'block';
            toggleBtn.innerHTML = '<i class="fas fa-magic"></i>';
            toggleBtn.title = 'Switch to drag-and-drop builder';
        }
    });
}

function setupMiniJokeBankFilters() {
    const searchInput = document.getElementById('modalJokeSearch');
    const tagFilter = document.getElementById('modalJokeTagFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', renderMiniJokeBank);
    }
    
    if (tagFilter) {
        tagFilter.addEventListener('change', renderMiniJokeBank);
    }
}

// Expose helper functions globally for cross-module access
window.debouncedRenderSetlistPanels = debouncedRenderSetlistPanels;
window.renderCurrentSetlist = renderCurrentSetlist;
window.renderMiniJokeBank = renderMiniJokeBank;

// Global function to remove joke from setlist
window.removeFromSetlist = function(jokeId) {
    const index = currentSetlistData.findIndex(item => 
        (typeof item === 'object' ? item.id : item) === jokeId
    );
    if (index > -1) {
        const joke = dataStore.getJokeById(jokeId);
        currentSetlistData.splice(index, 1);
        document.getElementById('setlistData').value = JSON.stringify(currentSetlistData);
        debouncedRenderSetlistPanels();
        
        // Show feedback
        if (joke) {
            const jokePreview = joke.text.substring(0, 30) + (joke.text.length > 30 ? '...' : '');
            showNotification(`Removed "${jokePreview}" from setlist`, 'success');
        }
    }
};

// Setup joke quick-view functionality
function setupJokeQuickView() {
    const modalJokeBank = document.getElementById('modalJokeBank');
    
    modalJokeBank?.addEventListener('click', (e) => {
        // Don't trigger during drag operations or on drag-related elements
        if (dragOperationInProgress) return;
        
        const jokeItem = e.target.closest('.joke-bank-item');
        if (jokeItem && 
            !jokeItem.classList.contains('sortable-ghost') && 
            !jokeItem.classList.contains('sortable-chosen') &&
            !jokeItem.classList.contains('dragging')) {
            
            const jokeId = parseInt(jokeItem.dataset.jokeId);
            
            // Validate joke ID
            if (!jokeId || isNaN(jokeId)) return;
            
            const joke = dataStore.getJokeById(jokeId);
            if (joke) {
                showJokeDetailModal(joke);
            }
        }
    });
}

// Show joke detail modal
function showJokeDetailModal(joke) {
    const modalHTML = `
        <div id="joke-detail-modal" class="modal-container is-visible">
            <div class="modal-overlay"></div>
            <div class="modal-content" style="max-width: 500px;">
                <button class="modal-close-btn" aria-label="Close">&times;</button>
                <h3 style="margin-top: 0; color: var(--accent-blue);"><i class="fas fa-lightbulb"></i> Joke Details</h3>
                
                <div class="joke-detail-content">
                    <div class="joke-text" style="background: var(--bg-surface-2); padding: 1rem; border-radius: 8px; margin: 1rem 0; font-size: 1.05rem; line-height: 1.5; border-left: 3px solid var(--accent-blue);">
                        ${joke.text}
                    </div>
                    
                    <div class="joke-meta" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0;">
                        <div>
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; display: block; margin-bottom: 0.5rem;">Duration</label>
                            <div style="color: var(--text-primary); font-weight: 500;">
                                <i class="fas fa-clock" style="color: var(--accent-orange); margin-right: 0.5rem;"></i>
                                ${joke.estimated_duration} seconds
                            </div>
                        </div>
                        <div>
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; display: block; margin-bottom: 0.5rem;">Created</label>
                            <div style="color: var(--text-primary); font-weight: 500;">
                                <i class="fas fa-calendar" style="color: var(--accent-green); margin-right: 0.5rem;"></i>
                                ${new Date(joke.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                    
                    ${joke.tags.length > 0 ? `
                        <div style="margin: 1.5rem 0;">
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; display: block; margin-bottom: 0.5rem;">Tags</label>
                            <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
                                ${joke.tags.map(tag => `
                                    <span style="padding: 0.25rem 0.5rem; background: var(--accent-blue); color: white; border-radius: 12px; font-size: 0.8rem;">
                                        ${tag}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${joke.notes ? `
                        <div style="margin: 1.5rem 0;">
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; display: block; margin-bottom: 0.5rem;">Notes</label>
                            <div style="background: var(--bg-surface-2); padding: 1rem; border-radius: 8px; color: var(--text-primary); line-height: 1.5;">
                                ${joke.notes}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <button onclick="editJokeFromQuickView(${joke.id})" class="form-btn" style="background: var(--accent-orange); color: white; border: none;">
                        <i class="fas fa-edit"></i> Edit Joke
                    </button>
                    <button onclick="closeJokeDetailModal()" class="form-btn btn-secondary">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup close handlers
    const modal = document.getElementById('joke-detail-modal');
    modal.querySelector('.modal-close-btn').addEventListener('click', closeJokeDetailModal);
    modal.querySelector('.modal-overlay').addEventListener('click', closeJokeDetailModal);
}

// Global functions for joke detail modal
window.closeJokeDetailModal = function() {
    const modal = document.getElementById('joke-detail-modal');
    if (modal) {
        modal.classList.remove('is-visible');
        setTimeout(() => modal.remove(), 200);
    }
};

window.editJokeFromQuickView = function(jokeId) {
    const joke = dataStore.getJokeById(jokeId);
    if (joke) {
        closeJokeDetailModal();
        showJokeModal(joke);
    }
};

// Helper function to generate setlist display HTML for event summary
function getSetlistDisplayHTML(setlist) {
    if (!setlist) {
        return '<textarea id="summary-setlist" class="summary-textarea" placeholder="Enter setlist (one joke per line)" aria-label="Setlist"></textarea>';
    }
    
    if (typeof setlist === 'string') {
        // Legacy string format - use textarea
        return `<textarea id="summary-setlist" class="summary-textarea" placeholder="Enter setlist (one joke per line)" aria-label="Setlist">${setlist}</textarea>`;
    } else if (Array.isArray(setlist) && setlist.length > 0) {
        // New format - show as read-only list with joke text
        const jokes = setlist.map(jokeId => dataStore.getJokeById(jokeId)).filter(joke => joke);
        
        if (jokes.length === 0) {
            return '<div class="setlist-readonly"><p style="color: var(--text-secondary); font-style: italic;">Setlist contains jokes that no longer exist</p></div>';
        }
        
        // Calculate total duration
        const totalSeconds = jokes.reduce((total, joke) => total + (joke.estimated_duration || 60), 0);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        return `
            <div class="setlist-readonly">
                <div class="setlist-summary" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-surface-2); border-radius: 6px;">
                    <span style="color: var(--text-secondary); font-size: 0.9rem;">
                        <i class="fas fa-list"></i> ${jokes.length} joke${jokes.length === 1 ? '' : 's'}
                    </span>
                    <span style="color: var(--text-secondary); font-size: 0.9rem;">
                        <i class="fas fa-clock"></i> ${durationStr}
                    </span>
                </div>
                <div class="setlist-jokes">
                    ${jokes.map((joke, index) => `
                        <div class="setlist-joke-item" style="display: flex; gap: 1rem; padding: 0.75rem; background: var(--bg-surface); border-radius: 6px; margin-bottom: 0.5rem; border-left: 3px solid var(--accent-blue);">
                            <div class="joke-number" style="background: var(--accent-blue); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 600; flex-shrink: 0;">
                                ${index + 1}
                            </div>
                            <div class="joke-content" style="flex: 1;">
                                <div class="joke-text" style="color: var(--text-primary); margin-bottom: 0.5rem; line-height: 1.4;">
                                    ${joke.text}
                                </div>
                                <div class="joke-meta" style="display: flex; gap: 1rem; font-size: 0.8rem; color: var(--text-secondary);">
                                    ${joke.tags.length > 0 ? `
                                        <span><i class="fas fa-tags"></i> ${joke.tags.slice(0, 3).join(', ')}${joke.tags.length > 3 ? `+${joke.tags.length - 3}` : ''}</span>
                                    ` : ''}
                                    <span><i class="fas fa-clock"></i> ${joke.estimated_duration}s</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 1rem; padding: 0.75rem; background: var(--bg-surface-2); border-radius: 6px; border: 1px solid var(--border-color);">
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.5rem;">
                        <i class="fas fa-info-circle"></i> This setlist uses the new Joke Library format. 
                        <a href="#" onclick="showJokeBankView(); closeModal(document.getElementById('event-summary-modal')); return false;" style="color: var(--accent-blue); text-decoration: none;">
                            View in Joke Library
                        </a>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Empty array
        return '<div class="setlist-readonly"><p style="color: var(--text-secondary); font-style: italic;">No jokes in setlist</p></div>';
    }
}
