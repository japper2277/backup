// Simple Clean Pills System with Event Delegation
// Fixes race condition by using stable parent container for event handling
console.log('🔄 LOADING SIMPLE PILLS SYSTEM - Using event delegation to prevent race conditions...');

// Set up event delegation on the stable parent container
// This only needs to be done once when the script loads
const initializeEventDelegation = () => {
    const parentContainer = document.querySelector('.mobile-pills-row');
    
    if (!parentContainer) {
        console.error('❌ Parent container (.mobile-pills-row) not found for event delegation');
        return;
    }

    // Check if we've already set up event delegation
    if (parentContainer._hasEventDelegation) {
        console.log('✅ Event delegation already initialized');
        return;
    }

    // Use event delegation to handle clicks on any child elements
    parentContainer.addEventListener('click', function(event) {
        // Check if the clicked element is the modal button or is inside the modal button
        const modalButton = event.target.closest('#modal-button-mobile');
        
        if (modalButton) {
            console.log('🖱️ All Filters button clicked via event delegation!');
            event.preventDefault();
            event.stopPropagation();
            
            // Call the modal opening function
            if (typeof openModal === 'function') {
                openModal();
            } else if (typeof window.openModal === 'function') {
                window.openModal();
            } else {
                console.error('❌ openModal function not found');
            }
        }
        
        // Handle pill removal clicks (for filter pills with X buttons)
        const pillCloseButton = event.target.closest('.pill svg');
        if (pillCloseButton) {
            const pill = pillCloseButton.closest('.pill');
            if (pill && pill.dataset.type) {
                console.log('🗑️ Removing filter pill:', pill.dataset.type);
                event.preventDefault();
                event.stopPropagation();
                
                // Handle pill removal logic
                const currentFilters = window.MicFinderState.getActiveFilters();
                const type = pill.dataset.type;
                const value = pill.dataset.value;
                
                if (type === 'day') {
                    currentFilters.day = '';
                } else if (type === 'time') {
                    currentFilters.customTimeStart = '';
                    currentFilters.customTimeEnd = '';
                }
                
                window.MicFinderState.setActiveFilters(currentFilters);
                window.MicFinderApp.render();
            }
        }
    });

    // Mark that we've set up event delegation
    parentContainer._hasEventDelegation = true;
    console.log('✅ Event delegation initialized on .mobile-pills-row container');
};

// Initialize event delegation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEventDelegation);
} else {
    initializeEventDelegation();
}

window.renderActivePills = () => {
    console.log('🔄 Rendering pills with event delegation...');
    
    const filters = window.MicFinderState.getActiveFilters();
    const pillsContainer = document.getElementById('active-pills-row-mobile');
    
    if (!pillsContainer) {
        console.error('❌ Pills container not found');
        return;
    }
    
    // Clear container
    pillsContainer.innerHTML = '';
    
    // Create All Filters button (no direct event listeners needed)
    const allFiltersBtn = document.createElement('button');
    allFiltersBtn.id = 'modal-button-mobile';
    allFiltersBtn.className = 'bg-gray-100 text-gray-800 border border-gray-400 shadow-md hover:bg-gray-200 hover:border-gray-500 flex-shrink-0 mr-2 text-sm font-medium py-2.5 px-5 rounded-xl transition-colors flex items-center gap-2';
    
    // Force aggressive styling to prevent zero dimensions
    allFiltersBtn.style.display = 'flex !important';
    allFiltersBtn.style.minWidth = '120px !important';
    allFiltersBtn.style.minHeight = '40px !important';
    allFiltersBtn.style.width = '120px !important';
    allFiltersBtn.style.height = '40px !important';
    allFiltersBtn.style.alignItems = 'center';
    allFiltersBtn.style.justifyContent = 'center';
    allFiltersBtn.style.position = 'relative';
    allFiltersBtn.style.visibility = 'visible';
    allFiltersBtn.style.opacity = '1';
    allFiltersBtn.style.zIndex = '999';
    
    allFiltersBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M11.5 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M9.05 3a2.5 2.5 0 0 1 4.9 0H16v1h-2.05a2.5 2.5 0 0 1-4.9 0H0V3zM4.5 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M2.05 8a2.5 2.5 0 0 1 4.9 0H16v1H6.95a2.5 2.5 0 0 1-4.9 0H0V8zm9.45 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m-2.45 1a2.5 2.5 0 0 1 4.9 0H16v1h-2.05a2.5 2.5 0 0 1-4.9 0H0v-1z"/>
        </svg>
        <span>All Filters</span>
    `;
    
    // NO direct event listeners - event delegation handles this!
    console.log('✅ Button created without direct event listeners (using event delegation)');
    
    pillsContainer.appendChild(allFiltersBtn);
    
    // Simple filter pills with data attributes for event delegation
    const createPill = (text, type, value) => {
        const pill = document.createElement('button');
        pill.className = 'pill bg-gray-900/80 text-white border border-white/10 shadow-md hover:bg-black/70 text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 flex-shrink-0 ml-2';
        
        // Add data attributes for event delegation
        pill.dataset.type = type;
        pill.dataset.value = value;
        
        pill.innerHTML = `
            ${text}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
            </svg>
        `;
        
        // NO direct event listeners - event delegation handles pill removal too!
        
        return pill;
    };
    
    // Add day filter pill
    if (filters.day) {
        const dayPill = createPill(filters.day, 'day', filters.day);
        pillsContainer.appendChild(dayPill);
    }
    
    // Add time filter pill
    if (filters.customTimeStart && filters.customTimeEnd) {
        const timePill = createPill(`${filters.customTimeStart} - ${filters.customTimeEnd}`, 'time', 'time');
        pillsContainer.appendChild(timePill);
    }
    
    console.log('✅ Simple pills system completed with event delegation');
};

// Also create the throttled version
window.renderActivePillsImmediate = window.renderActivePills;

console.log('✅ SIMPLE PILLS SYSTEM LOADED - Race condition fixed with event delegation!');