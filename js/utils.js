// Utility Functions

// Debounce helper function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Parse time string to decimal hours
const parseTime = timeStr => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    
    // Try 24-hour format first (HH:MM)
    let match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
        let [_, hours, minutes] = match;
        return parseInt(hours, 10) + parseInt(minutes, 10) / 60;
    }
    
    // Try 12-hour format (HH:MM AM/PM)
    match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
        let [_, hours, minutes, modifier] = match;
        hours = parseInt(hours, 10);
        if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
        return hours + parseInt(minutes, 10) / 60;
    }
    
    return null;
};

// Get cost value for sorting
const getCostValue = costStr => {
    if (!costStr) return 999;
    const lowerCost = costStr.toLowerCase();
    if (lowerCost === 'free') return 0;
    if (lowerCost.includes('drink')) return 5;
    const costMatch = lowerCost.match(/\$(\d+)/);
    if (costMatch) return parseInt(costMatch[1], 10);
    return 999;
};

// Convert time string to minutes since midnight
function getMinutes(timeStr) {
    if (!timeStr) return 0;
    
    // Try 24-hour format first (HH:MM)
    let match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
        let [_, hours, minutes] = match;
        return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
    }
    
    // Try 12-hour format (HH:MM AM/PM)
    match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
        let [_, hours, minutes, modifier] = match;
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);
        if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
    }
    
    return 0;
}

// Get current time in minutes since midnight
function getCurrentMinutes() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

// Get current day name
function getCurrentDay() {
    return new Date().toLocaleString('en-us', { weekday: 'long' });
}

// Check if mic is happening now
function isHappeningNow(mic) {
    const currentDay = getCurrentDay();
    const currentMinutes = getCurrentMinutes();
    const micMinutes = getMinutes(mic.time); // Changed from mic.startTime to mic.time
    const isToday = mic.day.toLowerCase() === currentDay.toLowerCase();
    
    return isToday && currentMinutes >= micMinutes && currentMinutes < micMinutes + 30;
}

// Check if mic is starting soon
function isStartingSoon(mic) {
    const currentDay = getCurrentDay();
    const currentMinutes = getCurrentMinutes();
    const micMinutes = getMinutes(mic.time); // Changed from mic.startTime to mic.time
    const isToday = mic.day.toLowerCase() === currentDay.toLowerCase();
    
    return isToday && micMinutes - currentMinutes > 0 && micMinutes - currentMinutes <= 120;
}

// Check if mic is finished
function isFinished(mic) {
    const currentDay = getCurrentDay();
    const currentMinutes = getCurrentMinutes();
    const micMinutes = getMinutes(mic.time); // Changed from mic.startTime to mic.time
    const isToday = mic.day.toLowerCase() === currentDay.toLowerCase();
    
    return isToday && currentMinutes >= micMinutes + 60;
}

// Check if mic has started but not finished
function isStarted(mic) {
    const currentDay = getCurrentDay();
    const currentMinutes = getCurrentMinutes();
    const micMinutes = getMinutes(mic.time);
    const isToday = mic.day.toLowerCase() === currentDay.toLowerCase();
    
    // Started if current time is past start time but before end time (start + 60 minutes)
    return isToday && currentMinutes >= micMinutes && currentMinutes < micMinutes + 60;
}

// Format time for display
function formatTime(timeStr) {
    if (!timeStr) return '';
    
    // If it's in 24-hour format, convert to 12-hour
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
        let [_, hours, minutes] = match;
        hours = parseInt(hours, 10);
        const modifier = hours >= 12 ? 'PM' : 'AM';
        if (hours > 12) hours -= 12;
        if (hours === 0) hours = 12;
        return `${hours}:${minutes} ${modifier}`;
    }
    
    // If it's already in 12-hour format, just clean it up
    return timeStr.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)/i, (match, hours, minutes, modifier) => {
        hours = parseInt(hours, 10);
        if (hours === 0) hours = 12;
        return `${hours}:${minutes} ${modifier.toUpperCase()}`;
    });
}

// Sanitize HTML
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Normalize venue names to handle case variations and inconsistencies
const CANONICAL_VENUE_MAP = {
    'west side comedy club': 'West Side Comedy Club',
    // 'the tiny cupboard': 'The Tiny Cupboard', // COMMENTED OUT
    'greenwich village comedy club': 'Greenwich Village Comedy Club',
    'comedy shop': 'Comedy Shop',
    'broadway comedy club': 'Broadway Comedy Club',
    'qed astoria': 'QED Astoria',
    'the stand nyc': 'The Stand NYC',
    'bushwick comedy club': 'Bushwick Comedy Club',
    'stand up ny': 'Stand Up NY',
    'gotham comedy club': 'Gotham Comedy Club',
    'caroline\'s on broadway': 'Caroline\'s on Broadway',
    'comedy cellar': 'Comedy Cellar',
    'fat black pussycat': 'Fat Black Pussycat',
    'the bell house': 'The Bell House',
    'union hall': 'Union Hall',
    'littlefield': 'Littlefield',
    'brooklyn comedy collective': 'Brooklyn Comedy Collective',
    'creek and the cave': 'Creek and the Cave',
    'the creek and the cave': 'Creek and the Cave',
    'eastville comedy club': 'Eastville Comedy Club',
    'laughing buddha': 'Laughing Buddha',
    'the laughing buddha': 'Laughing Buddha',
    'new york comedy club': 'New York Comedy Club',
    'comedy cellar village underground': 'Comedy Cellar Village Underground',
    'comedy cellar macdougal': 'Comedy Cellar MacDougal',
    'the stand comedy club': 'The Stand Comedy Club',
    'stand comedy club': 'The Stand Comedy Club',
    'ucb east': 'UCB East',
    'ucb west': 'UCB West',
    'ucb chelsea': 'UCB Chelsea',
    'upright citizens brigade': 'Upright Citizens Brigade',
    'the pit': 'The PIT',
    'pit': 'The PIT',
    'magnet theater': 'Magnet Theater',
    'annoyance theatre': 'Annoyance Theatre',
    'annoyance theater': 'Annoyance Theatre',
    'the annoyance': 'Annoyance Theatre',
    'asylum nyc': 'Asylum NYC',
    'the asylum': 'Asylum NYC',
    'people\'s improv theater': 'People\'s Improv Theater',
    'the peoples improv theater': 'People\'s Improv Theater',
    'pit peoples improv theater': 'People\'s Improv Theater',
    'st marks comedy club': 'St. Marks Comedy Club',
    'st. marks comedy club': 'St. Marks Comedy Club',
    'saint marks comedy club': 'St. Marks Comedy Club',
    'the comedy store': 'The Comedy Store',
    'comedy store': 'The Comedy Store',
    'laugh factory': 'Laugh Factory',
    'the laugh factory': 'Laugh Factory',
    'improv': 'The Improv',
    'the improv': 'The Improv',
    'comedy works': 'Comedy Works',
    'the comedy works': 'Comedy Works',
    // Fix Grove 34 space variations
    'grove34': 'Grove 34',
    'grove 34': 'Grove 34',
    // Fix duplicate venue names at same coordinates
    'pinebox': 'Pine Box Rock Shop',
    'cobra club brooklyn': 'Cobra Club',
    'comic strip live': 'The Comic Strip Live',
    'stand': 'The Stand NYC',
    'grisly pear mic-a-thon': 'Grisly Pear Midtown',
    'grisly pear midtown': 'Grisly Pear Midtown',
    'grisly pear mic': 'Grisly Pear Midtown',
    'freddy\'s bar': 'Freddy\'s',
    'gutter bar': 'The Gutter Williamsburg',
    'mood ring bar': 'Mood Ring Bar',
    'mood ring': 'Mood Ring Bar',
    'freddy\'s': 'Freddy\'s',
    'stand nyc': 'The Stand NYC',
    'bklyn made comedy': 'Brooklyn Made Comedy',
    'brooklyn made comedy': 'Brooklyn Made Comedy',
    'new york comedy club east village': 'New York Comedy Club East Village',
    'sesh comedy': 'Sesh Comedy',
    'kgb bar': 'KGB Bar',
    // Add more canonical venues as needed
};
function normalizeVenueName(venueName) {
    if (!venueName) return '';
    const normalized = venueName.trim();
    
    // Debug logging for Grove 34 specifically
    if (normalized.toLowerCase().includes('grove')) {
        console.log('🏢 [UTILS] normalizeVenueName - original:', venueName, 'normalized:', normalized);
    }
    
    // First, remove "the" prefix and normalize spaces/case for lookup
    const key = normalized.toLowerCase().replace(/^the\s+/, '').replace(/\s+/g, ' ');
    
    // Debug logging for Grove 34 key lookup
    if (key.includes('grove')) {
        console.log('🏢 [UTILS] normalizeVenueName - lookup key:', key, 'found mapping:', CANONICAL_VENUE_MAP[key]);
    }
    
    if (CANONICAL_VENUE_MAP[key]) {
        return CANONICAL_VENUE_MAP[key];
    }
    return normalized;
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Deduplicate mics with same venue/address/coordinates AND same start time
function deduplicateMics(mics) {
    // Group mics by venue (name + address + coordinates)
    const venueMap = {};
    mics.forEach(mic => {
        if (mic.lat && mic.lon && mic.venue && mic.address) {
            // Normalize venue name to handle case variations
            const normalizedVenue = normalizeVenueName(mic.venue);
            const key = `${normalizedVenue}__${mic.address}__${mic.lat}__${mic.lon}`;
            
            // Debug logging for Grove 34 specifically
            if (mic.venue && mic.venue.toLowerCase().includes('grove')) {
                console.log('🏢 [UTILS] deduplicateMics - Grove 34 original:', mic.venue, 'normalized:', normalizedVenue, 'key:', key);
            }
            
            if (!venueMap[key]) venueMap[key] = [];
            venueMap[key].push(mic);
        }
    });
    
    // Deduplicate mics with same venue/address/coordinates AND same start time
    const deduplicatedMics = [];
    Object.values(venueMap).forEach(venueMics => {
        if (venueMics.length > 1) {
            const timeGroups = {};
            venueMics.forEach(mic => {
                const timeKey = `${mic.day}__${mic.time}`;
                if (!timeGroups[timeKey]) {
                    timeGroups[timeKey] = [];
                }
                timeGroups[timeKey].push(mic);
            });
            
            // For each time group, keep only the first mic (deduplicate same time slots)
            Object.values(timeGroups).forEach(timeMics => {
                deduplicatedMics.push(timeMics[0]); // Keep only the first mic for this time slot
            });
        } else {
            deduplicatedMics.push(venueMics[0]);
        }
    });
    
    // Debug logging for Grove 34 deduplication results
    const grove34Final = deduplicatedMics.filter(mic => mic.venue && mic.venue.toLowerCase().includes('grove'));
    if (grove34Final.length > 0) {
        console.log('🏢 [UTILS] deduplicateMics - Grove 34 final result:', grove34Final.length, 'mics');
        console.log('🏢 [UTILS] deduplicateMics - Grove 34 details:', grove34Final.map(m => `${m.venue} (${m.day} ${m.time})`));
    }
    
    return deduplicatedMics;
}

// Check if device is mobile
function isMobileDevice() {
    const width = window.innerWidth;
    const isMobile = width <= 768;
    console.log('[Utils] Mobile detection - width:', width, 'isMobile:', isMobile);
    return isMobile;
}

// Fixes 'S to 's at the end of words (for venue names)
function fixApostropheS(name) {
    return typeof name === 'string' ? name.replace(/'S\b/g, "'s") : name;
}

// Export utilities
window.MicFinderUtils = {
    debounce,
    parseTime,
    getCostValue,
    getMinutes,
    getCurrentMinutes,
    getCurrentDay,
    isHappeningNow,
    isStartingSoon,
    isStarted,
    isFinished,
    formatTime,
    sanitizeHTML,
    normalizeVenueName,
    generateId,
    deduplicateMics,
    isMobileDevice,
    fixApostropheS
};