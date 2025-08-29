// Clear any stale cached data that might have incorrect capitalization
function clearStaleCache() {
    try {
        // Clear backup data that might contain old capitalization issues
        localStorage.removeItem('micfinder_backup');
        
        // Clear any cached spreadsheet data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('micfinder_cache_') || key.includes('micfinder_lastupdate_'))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log('Cleared stale cache data');
    } catch (error) {
        console.warn('Failed to clear stale cache:', error);
    }
}

// Mic Data Loader - Local CSV only
function loadMicData(callback) {
    console.log('Loading mic data from local CSV only...');
    
    // Clear any stale cached data first
    clearStaleCache();
    
    // Load directly from CSV file
    loadMicsFromCSV(callback);
}

// Google Sheets integration removed - using local CSV only

// Load mics from the local CSV file
function loadMicsFromCSV(callback) {
    console.log('🚀 [CSV LOADER] Starting to load mic data from coordinates_new_8_11.csv...');
    Papa.parse(`coordinates_new_8_11.csv?v=${Date.now()}`, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            console.log('✅ [CSV LOADER] Raw data loaded:', results.data.length, 'rows');
            console.log('📊 [CSV LOADER] Sample row:', results.data[0]); // Debug log
            
            const mics = results.data
                .filter(row => {
                    const hasVenue = row['Venue Name'] && row['Venue Name'].trim();
                    const hasLat = row['Geocodio Latitude'] && !isNaN(parseFloat(row['Geocodio Latitude']));
                    const hasLon = row['Geocodio Longitude'] && !isNaN(parseFloat(row['Geocodio Longitude']));
                    return hasVenue && hasLat && hasLon;
                })
                .map((row, index) => {
                    // Parse day and time
                    let day = row['Day'] || '';
                    let time = row['Start Time'] || '';
                    let signupTime = row['Signup Time'] || '';
                    
                    // Parse coordinates
                    const lat = parseFloat(row['Geocodio Latitude']);
                    const lon = parseFloat(row['Geocodio Longitude']);
                    
                    return {
                        id: `mic-${index}`,
                        venue: row['Venue Name'].trim(),
                        address: row['Location'] || '',
                        borough: (row['Borough'] || '').trim(),
                        neighborhood: row['Neighborhood'] || '',
                        day: day,
                        time: time,
                        signupTime: signupTime,
                        host: row["Host(s) / Organizer"] || '',
                        details: row['Other Rules'] || '',
                        cost: row['Cost'] || '',
                        signup: row['Sign-Up Instructions'] || '',
                        lat: lat,
                        lon: lon,
                        // Add status flags for easier filtering
                        isFree: (row['Cost'] || '').toLowerCase().includes('free'),
                        hasSignup: Boolean(row['Sign-Up Instructions'] && row['Sign-Up Instructions'].trim())
                    };
                });
            
            console.log('🔄 [CSV LOADER] Processed mics:', mics.length);
            if (mics.length > 0) {
                console.log('🎯 [CSV LOADER] Sample processed mic:', mics[0]); // Debug log
            }
            
            // Store mics in state
            if (window.MicFinderState) {
                console.log('💾 [CSV LOADER] Storing mics in state...');
                window.MicFinderState.setMics(mics);
                console.log('✅ [CSV LOADER] Mics stored in state successfully');
            } else {
                console.warn('⚠️ [CSV LOADER] MicFinderState not available');
            }
            
            if (typeof callback === 'function') {
                console.log('📞 [CSV LOADER] Calling callback with', mics.length, 'mics');
                callback(mics);
            } else {
                console.warn('⚠️ [CSV LOADER] No callback function provided');
            }
        },
        error: function(error) {
            console.error('❌ [CSV LOADER] Error loading mic data from coordinates_new_8_11.csv:', error);
            if (typeof callback === 'function') {
                console.log('📞 [CSV LOADER] Calling error callback with empty array');
                callback([]);
            }
        }
    });
}

// Helper function to convert 12-hour time to 24-hour format
function convertTo24Hour(time12h) {
    if (!time12h) return '';
    
    const [time, modifier] = time12h.split(' ');
    if (!modifier) return time12h;
    
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours);
    
    if (hours === 12) {
        hours = modifier === 'PM' ? 12 : 0;
    } else if (modifier === 'PM') {
        hours = hours + 12;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes || '00'}`;
}

// Export the function
window.loadMicData = loadMicData; 