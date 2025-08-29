// Favorites Functionality

console.log('[Favorites] Module loading...');

// Monitor when favorites change during page load
let favoritesLoadCount = 0;
const originalSetFavorites = window.MicFinderState.setFavorites;
window.MicFinderState.setFavorites = function(newFavorites) {
    favoritesLoadCount++;
    console.log(`🎯 FAVORITES LOAD #${favoritesLoadCount}:`, newFavorites);
    console.log(`🎯 Load count: ${favoritesLoadCount}, Favorites count: ${newFavorites.length}`);
    console.log(`🎯 Timestamp: ${new Date().toISOString()}`);
    
    // Call the original function
    const result = originalSetFavorites.call(this, newFavorites);
    
    // Try to update button state after favorites are set
    setTimeout(() => {
        if (window.updateFavoritesButtonState) {
            console.log('🔄 Auto-updating favorites button state...');
            window.updateFavoritesButtonState();
        } else {
            console.log('❌ updateFavoritesButtonState not available yet');
        }
    }, 50);
    
    return result;
};

console.log('Monitoring favorites loading timeline...');

// Load favorites from localStorage
function loadFavoritesFromLocalStorage() {
    console.log('[Favorites] Loading from localStorage...');
    try {
        const favorites = JSON.parse(localStorage.getItem(window.MicFinderConfig.FAVORITES_STORAGE_KEY) || '[]');
        console.log('[Favorites] Loaded from localStorage:', favorites);
        window.MicFinderState.setFavorites(favorites);
    } catch (error) {
        console.error('[Favorites] Error loading from localStorage:', error);
    }
}

// Save favorites to localStorage
function saveFavoritesToLocalStorage() {
    console.log('[Favorites] Saving to localStorage...');
    try {
        const favorites = window.MicFinderState.getFavorites();
        localStorage.setItem(window.MicFinderConfig.FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
        console.log('[Favorites] Saved to localStorage:', favorites);
    } catch (error) {
        console.error('[Favorites] Error saving to localStorage:', error);
    }
}

// Load favorites from Firestore
async function loadFavoritesFromFirestore() {
    const userDocRef = window.MicFinderState.getUserDocRef();
    if (!userDocRef) return;
    
    try {
        const doc = await userDocRef.get();
        if (doc.exists) {
            const favorites = doc.data().favorites || [];
            window.MicFinderState.setFavorites(favorites);
        } else {
            window.MicFinderState.setFavorites([]);
        }
        window.MicFinderApp.render();
    } catch (error) {
        console.error("Error loading favorites from Firestore:", error);
        loadFavoritesFromLocalStorage();
    }
}

// Toggle favorite
async function toggleFavorite(micId) {
    console.log('[Favorites] toggleFavorite called with micId:', micId);
    console.log('[Favorites] MicFinderState available:', !!window.MicFinderState);
    console.log('[Favorites] MicFinderConfig available:', !!window.MicFinderConfig);
    
    try {
        const { auth } = window.MicFinderConfig;
        const { getFavorites, setFavorites, getUserDocRef } = window.MicFinderState;
        const { getAllMics } = window.MicFinderState;
        
        console.log('[Favorites] Dependencies extracted successfully');
        
        const favorites = getFavorites();
        const isCurrentlyFavorite = favorites.includes(micId);
        const allMics = getAllMics();
        const mic = allMics.find(m => m.id === micId);
        
        console.log('[Favorites] Current state - isFavorite:', isCurrentlyFavorite, 'favorites count:', favorites.length, 'mic found:', !!mic);

        if (auth.currentUser) {
            const userDocRef = getUserDocRef();
            const updateAction = isCurrentlyFavorite ?
                firebase.firestore.FieldValue.arrayRemove(micId) :
                firebase.firestore.FieldValue.arrayUnion(micId);
            try {
                await userDocRef.set({ favorites: updateAction }, { merge: true });
                console.log('[Favorites] Firestore update successful');
            } catch (error) {
                console.error("Error updating Firestore favorites:", error);
                window.MicFinderAccessibility.announceToScreenReader('Error updating favorites');
                return;
            }
        }
        
        const index = favorites.indexOf(micId);
        if (index > -1) {
            favorites.splice(index, 1);
            window.MicFinderAccessibility.announceToScreenReader(`${mic?.venue || 'Mic'} removed from favorites`);
            console.log('[Favorites] Removed from favorites');
        } else {
            favorites.push(micId);
            window.MicFinderAccessibility.announceToScreenReader(`${mic?.venue || 'Mic'} added to favorites`);
            console.log('[Favorites] Added to favorites');
        }

        if (!auth.currentUser) {
            saveFavoritesToLocalStorage();
        }

        // Update ARIA labels on favorite buttons
        document.querySelectorAll(`[data-mic-id="${micId}"].favorite-btn`).forEach(btn => {
            const isNowFavorite = favorites.includes(micId);
            btn.setAttribute('aria-label', isNowFavorite ? 'Remove from favorites' : 'Add to favorites');
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = `${isNowFavorite ? 'fa-solid' : 'fa-regular'} fa-star ${isNowFavorite ? 'text-yellow-500' : ''}`;
                icon.setAttribute('aria-hidden', 'true');
            }
        });

        console.log('[Favorites] Calling MicFinderApp.render()');
        window.MicFinderApp.render();
        console.log('[Favorites] toggleFavorite completed successfully');
    } catch (error) {
        console.error('[Favorites] Error in toggleFavorite:', error);
        throw error;
    }
}

// Check if a mic is favorited
function isFavorite(micId) {
    const favorites = window.MicFinderState.getFavorites();
    return favorites.includes(micId);
}

// Export favorites functionality
console.log('[Favorites] Exporting module...');
console.log('[Favorites] MicFinderState available:', !!window.MicFinderState);
console.log('[Favorites] MicFinderConfig available:', !!window.MicFinderConfig);

window.MicFinderFavorites = {
    loadFavoritesFromLocalStorage,
    saveFavoritesToLocalStorage,
    loadFavoritesFromFirestore,
    toggleFavorite,
    isFavorite
}; 

console.log('[Favorites] Module exported:', !!window.MicFinderFavorites);
console.log('[Favorites] toggleFavorite function available:', !!(window.MicFinderFavorites && window.MicFinderFavorites.toggleFavorite)); 