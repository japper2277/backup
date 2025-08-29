// Multi-Source Google Spreadsheet Integration with Data Validation and Backup
// Automatically syncs venue data from Google Sheets with safety features
// Tiny Cupboard real-time monitoring system has been commented out

// State management for multiple spreadsheet sources
let updateState = {
    isUpdating: false,
    lastUpdateTimes: {},
    updateHistory: [],
    cachedData: {},
    activeUpdates: new Set(),
    backupData: null,
    lastBackupTime: null
};

/**
 * Initialize the multi-spreadsheet updater system
 */
function initializeSpreadsheetUpdater() {
    console.log('[MultiSpreadsheetUpdater] Initializing...');
    
    const { SPREADSHEET_UPDATE_CONFIG } = window.MicFinderConfig || {};
    
    if (!SPREADSHEET_UPDATE_CONFIG?.enabled) {
        console.log('[MultiSpreadsheetUpdater] Disabled in config');
        return;
    }
    
    // Load cached data and backup
    loadAllCachedData();
    loadBackupData();
    
    // Check for updates on load if enabled
    if (SPREADSHEET_UPDATE_CONFIG?.checkOnLoad) {
        setTimeout(() => checkAllSources(), 2000);
    }
    
    // Set up periodic updates
    setupPeriodicUpdates();
    
    // Start Tiny Cupboard monitoring (more frequent updates) - COMMENTED OUT
    // startTinyCupboardMonitoring();
}

/**
 * Validate data before applying updates
 */
function validateData(data, sourceConfig) {
    if (!data || !Array.isArray(data)) {
        throw new Error('Invalid data format');
    }
    
    const { SPREADSHEET_UPDATE_CONFIG } = window.MicFinderConfig || {};
    if (!SPREADSHEET_UPDATE_CONFIG?.validateBeforeApply) {
        return true;
    }
    
    console.log(`[MultiSpreadsheetUpdater] Validating ${data.length} entries from ${sourceConfig.name}...`);
    
    const errors = [];
    const warnings = [];
    
    data.forEach((entry, index) => {
        // Required fields validation
        if (!entry.venue || !entry.day || !entry.time) {
            errors.push(`Row ${index + 1}: Missing required fields (venue, day, time)`);
        }
        
        // Data type validation
        if (entry.lat && isNaN(parseFloat(entry.lat))) {
            errors.push(`Row ${index + 1}: Invalid latitude`);
        }
        if (entry.lon && isNaN(parseFloat(entry.lon))) {
            errors.push(`Row ${index + 1}: Invalid longitude`);
        }
        
        // Business logic validation
        if (entry.time && !entry.time.match(/^\d{1,2}:\d{2}\s*(AM|PM)$/i)) {
            warnings.push(`Row ${index + 1}: Time format should be "HH:MM AM/PM"`);
        }
        
        if (entry.day && !['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(entry.day)) {
            warnings.push(`Row ${index + 1}: Invalid day of week`);
        }
    });
    
    if (errors.length > 0) {
        console.error(`[MultiSpreadsheetUpdater] Validation errors in ${sourceConfig.name}:`, errors);
        throw new Error(`Data validation failed: ${errors.join(', ')}`);
    }
    
    if (warnings.length > 0) {
        console.warn(`[MultiSpreadsheetUpdater] Validation warnings in ${sourceConfig.name}:`, warnings);
    }
    
    console.log(`[MultiSpreadsheetUpdater] Validation passed for ${sourceConfig.name}`);
    return true;
}

/**
 * Create backup of current data
 */
function createBackup() {
    try {
        const currentMics = window.MicFinderState?.getAllMics() || [];
        if (currentMics.length === 0) return;
        
        const backup = {
            timestamp: Date.now(),
            micCount: currentMics.length,
            data: currentMics
        };
        
        updateState.backupData = backup;
        updateState.lastBackupTime = Date.now();
        
        // Save to localStorage
        localStorage.setItem('micfinder_backup', JSON.stringify(backup));
        
        console.log(`[MultiSpreadsheetUpdater] Backup created: ${currentMics.length} mics`);
    } catch (error) {
        console.warn('[MultiSpreadsheetUpdater] Failed to create backup:', error);
    }
}

/**
 * Restore data from backup
 */
function restoreFromBackup() {
    try {
        const backup = updateState.backupData;
        if (!backup || !backup.data) {
            console.warn('[MultiSpreadsheetUpdater] No backup available');
            return false;
        }
        
        if (window.MicFinderState) {
            window.MicFinderState.setMics(backup.data);
            console.log(`[MultiSpreadsheetUpdater] Restored ${backup.micCount} mics from backup`);
            
            // Trigger re-render
            if (window.MicFinderApp && window.MicFinderApp.render) {
                window.MicFinderApp.render();
            }
            
            return true;
        }
    } catch (error) {
        console.error('[MultiSpreadsheetUpdater] Failed to restore from backup:', error);
    }
    return false;
}

/**
 * Load backup data from localStorage
 */
function loadBackupData() {
    try {
        const backupJson = localStorage.getItem('micfinder_backup');
        if (backupJson) {
            const backup = JSON.parse(backupJson);
            updateState.backupData = backup;
            updateState.lastBackupTime = backup.timestamp;
            console.log(`[MultiSpreadsheetUpdater] Loaded backup: ${backup.micCount} mics from ${new Date(backup.timestamp)}`);
        }
    } catch (error) {
        console.warn('[MultiSpreadsheetUpdater] Failed to load backup:', error);
    }
}

/**
 * Check all enabled spreadsheet sources for updates
 */
async function checkAllSources(forceUpdate = false) {
    if (updateState.isUpdating) {
        console.log('[MultiSpreadsheetUpdater] Update already in progress');
        return false;
    }
    
    const { SPREADSHEET_UPDATE_CONFIG } = window.MicFinderConfig || {};
    if (!SPREADSHEET_UPDATE_CONFIG?.enabled) {
        console.log('[MultiSpreadsheetUpdater] Updates disabled');
        return false;
    }
    
    console.log('[MultiSpreadsheetUpdater] Checking all sources for updates...');
    updateState.isUpdating = true;
    
    try {
        // Create backup before updating
        if (SPREADSHEET_UPDATE_CONFIG?.backupOnUpdate) {
            createBackup();
        }
        
        const { SPREADSHEET_SOURCES } = window.MicFinderConfig || {};
        if (!SPREADSHEET_SOURCES) {
            console.warn('[MultiSpreadsheetUpdater] No spreadsheet sources configured');
            return false;
        }
        
        let hasAnyUpdates = false;
        const enabledSources = Object.entries(SPREADSHEET_SOURCES)
            .filter(([_, config]) => config.enabled && config.url)
            .sort(([_, a], [__, b]) => a.priority - b.priority);
        
        if (enabledSources.length === 0) {
            console.log('[MultiSpreadsheetUpdater] No enabled sources found');
            return false;
        }
        
        // Notify UI that update is starting
        notifyUpdateStatus('checking', `Checking ${enabledSources.length} data sources...`);
        
        // Check each source sequentially
        for (const [sourceId, sourceConfig] of enabledSources) {
            try {
                console.log(`[MultiSpreadsheetUpdater] Checking source: ${sourceConfig.name}`);
                
                if (!shouldCheckSource(sourceId, sourceConfig) && !forceUpdate) {
                    console.log(`[MultiSpreadsheetUpdater] Skipping ${sourceId} - too recent`);
                    continue;
                }
                
                updateState.activeUpdates.add(sourceId);
                const hasUpdates = await checkSingleSource(sourceId, sourceConfig, forceUpdate);
                
                if (hasUpdates) {
                    hasAnyUpdates = true;
                    console.log(`[MultiSpreadsheetUpdater] Updates applied from ${sourceConfig.name}`);
                }
                
            } catch (error) {
                console.error(`[MultiSpreadsheetUpdater] Error checking ${sourceId}:`, error);
                
                // Fallback to CSV if enabled
                if (SPREADSHEET_UPDATE_CONFIG?.fallbackToCSV) {
                    console.log('[MultiSpreadsheetUpdater] Falling back to CSV data');
                    loadMicsFromCSV();
                }
            } finally {
                updateState.activeUpdates.delete(sourceId);
            }
        }
        
        if (hasAnyUpdates) {
            notifyUpdateStatus('updated', 'Schedule data updated successfully!');
            
            // Trigger re-render if app is loaded
            if (window.MicFinderApp && window.MicFinderApp.render) {
                setTimeout(() => window.MicFinderApp.render(), 100);
            }
        } else {
            notifyUpdateStatus('no-changes', 'All data sources are up to date');
        }
        
        return hasAnyUpdates;
        
    } catch (error) {
        console.error('[MultiSpreadsheetUpdater] Error during multi-source update:', error);
        notifyUpdateStatus('error', error.message);
        
        // Restore from backup on critical error
        if (SPREADSHEET_UPDATE_CONFIG?.fallbackToCSV) {
            console.log('[MultiSpreadsheetUpdater] Attempting to restore from backup...');
            restoreFromBackup();
        }
        
        return false;
    } finally {
        updateState.isUpdating = false;
        saveAllCachedData();
    }
}

/**
 * Check a single spreadsheet source for updates
 */
async function checkSingleSource(sourceId, sourceConfig, forceUpdate = false) {
    console.log(`[MultiSpreadsheetUpdater] Processing source: ${sourceConfig.name}`);
    
    try {
        // Fetch data from spreadsheet
        const spreadsheetData = await fetchSpreadsheetData(sourceConfig.url, sourceConfig.name);
        if (!spreadsheetData || spreadsheetData.length === 0) {
            console.warn(`[MultiSpreadsheetUpdater] No data from ${sourceConfig.name}`);
            return false;
        }
        
        // Process and validate the data
        const processedData = processSpreadsheetData(spreadsheetData, sourceConfig);
        if (!processedData || processedData.length === 0) {
            console.warn(`[MultiSpreadsheetUpdater] No valid data after processing ${sourceConfig.name}`);
            return false;
        }
        
        // Check for changes
        const hasChanges = detectChanges(sourceId, processedData) || forceUpdate;
        if (!hasChanges) {
            console.log(`[MultiSpreadsheetUpdater] No changes in ${sourceConfig.name}`);
            updateState.lastUpdateTimes[sourceId] = Date.now();
            return false;
        }
        
        // Apply updates
        await updateLocalData(sourceId, sourceConfig, processedData);
        
        // Update state
        updateState.lastUpdateTimes[sourceId] = Date.now();
        updateState.cachedData[sourceId] = processedData;
        
        // Log the update
        const updateRecord = {
            timestamp: Date.now(),
            sourceId,
            sourceName: sourceConfig.name,
            entriesUpdated: processedData.length
        };
        updateState.updateHistory.push(updateRecord);
        
        // Keep only last 20 update records
        if (updateState.updateHistory.length > 20) {
            updateState.updateHistory = updateState.updateHistory.slice(-20);
        }
        
        console.log(`[MultiSpreadsheetUpdater] Successfully updated from ${sourceConfig.name}: ${processedData.length} entries`);
        return true;
        
    } catch (error) {
        console.error(`[MultiSpreadsheetUpdater] Error processing ${sourceConfig.name}:`, error);
        throw error;
    }
}

/**
 * Fetch data from a Google Spreadsheet
 */
async function fetchSpreadsheetData(url, sourceName) {
    if (!url) {
        throw new Error(`No URL configured for ${sourceName}`);
    }
    
    const { SPREADSHEET_UPDATE_CONFIG } = window.MicFinderConfig || {};
    if (SPREADSHEET_UPDATE_CONFIG?.debugMode) {
        console.log(`[DEBUG] ${sourceName} - Fetching from URL:`, url);
    }
    
    console.log(`[MultiSpreadsheetUpdater] Fetching data from ${sourceName}...`);
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`[MultiSpreadsheetUpdater] HTTP error for ${sourceName}:`, response.status, response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        if (SPREADSHEET_UPDATE_CONFIG?.debugMode) {
            console.log(`[DEBUG] ${sourceName} - Fetch successful, response size:`, response.headers.get('content-length') || 'unknown');
        }
        
        const csvText = await response.text();
        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    if (results.errors.length > 0) {
                        console.warn(`[MultiSpreadsheetUpdater] CSV parsing warnings for ${sourceName}:`, results.errors);
                    }
                    
                    const { SPREADSHEET_UPDATE_CONFIG } = window.MicFinderConfig || {};
                    if (SPREADSHEET_UPDATE_CONFIG?.debugMode) {
                        console.log(`[DEBUG] ${sourceName} - Raw CSV data (${results.data.length} rows):`);
                        console.table(results.data);
                        
                        // Show Tiny Cupboard specific entries - COMMENTED OUT
                        /*
                        const tinyCupboardEntries = results.data.filter(row => 
                            row['Open Mic']?.toLowerCase().includes('tiny cupboard') || 
                            row['Venue Name']?.toLowerCase().includes('tiny cupboard')
                        );
                        if (tinyCupboardEntries.length > 0) {
                            console.log(`[DEBUG] ${sourceName} - Tiny Cupboard entries found:`, tinyCupboardEntries.length);
                            console.table(tinyCupboardEntries);
                        }
                        */
                    }
                    
                    resolve(results.data);
                },
                error: function(error) {
                    reject(new Error(`CSV parsing failed for ${sourceName}: ${error.message}`));
                }
            });
        });
        
    } catch (error) {
        throw new Error(`Failed to fetch ${sourceName}: ${error.message}`);
    }
}

/**
 * Process and validate spreadsheet data based on source configuration
 */
function processSpreadsheetData(rawData, sourceConfig) {
    console.log(`[MultiSpreadsheetUpdater] Processing ${rawData.length} rows from ${sourceConfig.name}...`);
    
    // Debug mode - log first few rows and column headers
    const { SPREADSHEET_UPDATE_CONFIG } = window.MicFinderConfig || {};
    if (SPREADSHEET_UPDATE_CONFIG?.debugMode && rawData.length > 0) {
        console.log(`[DEBUG] ${sourceConfig.name} - Column headers:`, Object.keys(rawData[0]));
        console.log(`[DEBUG] ${sourceConfig.name} - First row sample:`, rawData[0]);
        if (rawData.length > 1) {
            console.log(`[DEBUG] ${sourceConfig.name} - Second row sample:`, rawData[1]);
        }
    }
    
    const processedEntries = [];
    
    rawData.forEach((row, index) => {
        try {
            // Skip empty rows
            if (!row || Object.keys(row).length === 0) return;
            
            // Extract and normalize data - handle different column naming conventions
            const entry = {
                micName: extractField(row, ['Open Mic', 'Mic Name', 'micName', 'name']),
                day: normalizeDay(extractField(row, ['Day', 'day'])),
                time: normalizeTime(extractField(row, ['Start Time', 'Time', 'time', 'startTime'])),
                endTime: normalizeTime(extractField(row, ['Latest End Time', 'End Time', 'endTime'])),
                venue: extractField(row, ['Venue Name', 'Venue', 'venue', 'venueName']),
                borough: extractField(row, ['Borough', 'borough']),
                neighborhood: extractField(row, ['Neighborhood', 'neighborhood']),
                address: extractField(row, ['Location', 'Address', 'address', 'location']),
                host: extractField(row, ['Host(s) / Organizer', 'Host', 'host', 'organizer']),
                cost: extractField(row, ['Cost', 'cost']),
                signup: extractField(row, ['Sign-Up Instructions', 'Signup', 'signup']),
                notes: extractField(row, ['Other Rules', 'Notes', 'notes', 'rules']),
                venueType: extractField(row, ['Venue type', 'Venue Type', 'venueType', 'type']),
                stageTime: extractField(row, ['Stage time', 'Stage Time', 'stageTime']),
                lat: parseFloat(extractField(row, ['Geocodio Latitude', 'Latitude', 'lat'])) || null,
                lon: parseFloat(extractField(row, ['Geocodio Longitude', 'Longitude', 'lon'])) || null
            };
            
            // Normalize Black Cat LES address to always be 172 Rivington St
            if (entry.venue && entry.venue.trim().toLowerCase() === 'black cat les') {
                entry.address = '172 Rivington St, New York, NY 10002';
                entry.lat = 40.7206; // Replace with the correct latitude for 172 Rivington St
                entry.lon = -73.9876; // Replace with the correct longitude for 172 Rivington St
            }
            
            // *** CUSTOM FILTERING: Block problematic entries ***
            
            // 1. Block lowercase "tiny cupboard" entries (data quality issue) - COMMENTED OUT
            /*
            if (entry.micName && entry.micName.toLowerCase().includes('tiny cupboard') && 
                entry.micName !== entry.micName.charAt(0).toUpperCase() + entry.micName.slice(1)) {
                if (SPREADSHEET_UPDATE_CONFIG?.debugMode) {
                    console.log(`[DEBUG] ${sourceConfig.name} - BLOCKING lowercase/malformed tiny cupboard entry:`, entry.micName);
                }
                return;
            }
            */
            
            // 2. Block specific problematic entries by mic name
            const blockedMicNames = [
                // 'tiny cupboard',        // lowercase variant - COMMENTED OUT
                'theryzzmic',          // problematic 4pm entry causing duplicates
            ];
            if (blockedMicNames.some(blocked => entry.micName?.toLowerCase().includes(blocked.toLowerCase()))) {
                if (SPREADSHEET_UPDATE_CONFIG?.debugMode) {
                    console.log(`[DEBUG] ${sourceConfig.name} - BLOCKING blacklisted mic entry:`, entry.micName);
                }
                return;
            }
            
            // 3. For Tiny Cupboard venue: only allow specific verified entries - COMMENTED OUT
            /*
            if (sourceConfig.venue && sourceConfig.venue.toLowerCase().includes('tiny cupboard')) {
                const allowedMicNames = [
                    'The Tiny Cupboard',
                    'Tiny Cupboard Fever Dream', 
                    'ct qts',
                    'Tiny Cupboard Bad Decision'
                ];
                if (!allowedMicNames.some(allowed => entry.micName?.toLowerCase().includes(allowed.toLowerCase()))) {
                    if (SPREADSHEET_UPDATE_CONFIG?.debugMode) {
                        console.log(`[DEBUG] ${sourceConfig.name} - BLOCKING non-whitelisted Tiny Cupboard entry:`, entry.micName);
                    }
                    return;
                }
            }
            */
            
            // Validate required fields
            if (!entry.micName || !entry.day || !entry.time || !entry.venue) {
                console.warn(`[MultiSpreadsheetUpdater] Skipping incomplete row ${index + 1} in ${sourceConfig.name}:`, entry);
                return;
            }
            
            // Filter by venue if source is venue-specific
            if (sourceConfig.venue && !entry.venue.toLowerCase().includes(sourceConfig.venue.toLowerCase())) {
                if (SPREADSHEET_UPDATE_CONFIG?.debugMode) {
                    console.log(`[DEBUG] ${sourceConfig.name} - Skipping row ${index + 1}: venue "${entry.venue}" doesn't match filter "${sourceConfig.venue}"`);
                }
                return; // Skip entries that don't match the venue filter
            }
            
            if (SPREADSHEET_UPDATE_CONFIG?.debugMode && sourceConfig.venue) {
                console.log(`[DEBUG] ${sourceConfig.name} - Including row ${index + 1}: venue "${entry.venue}" matches filter "${sourceConfig.venue}"`);
            }
            
            processedEntries.push(entry);
            
        } catch (error) {
            console.warn(`[MultiSpreadsheetUpdater] Error processing row ${index + 1} in ${sourceConfig.name}:`, error);
        }
    });
    
    console.log(`[MultiSpreadsheetUpdater] Processed ${processedEntries.length} valid entries from ${sourceConfig.name}`);
    
    // Debug summary
    if (SPREADSHEET_UPDATE_CONFIG?.debugMode) {
        const skippedCount = rawData.length - processedEntries.length;
        console.log(`[DEBUG] ${sourceConfig.name} - Processing Summary:`);
        console.log(`  Total rows: ${rawData.length}`);
        console.log(`  Valid entries: ${processedEntries.length}`);
        console.log(`  Filtered/Skipped: ${skippedCount}`);
        if (processedEntries.length > 0) {
            console.log(`  Sample processed entry:`, processedEntries[0]);
        }
    }
    
    return processedEntries;
}

/**
 * Update local data with spreadsheet data
 */
async function updateLocalData(sourceId, sourceConfig, newData) {
    console.log(`[MultiSpreadsheetUpdater] Updating local data from ${sourceConfig.name}...`);
    
    // Get current mic data
    const allMics = window.MicFinderState?.getAllMics() || [];
    let updatedMics = [...allMics];
    
    if (sourceConfig.replaceAll) {
        // Replace all data (main spreadsheet scenario)
        console.log(`[MultiSpreadsheetUpdater] Replacing all data with ${sourceConfig.name}`);
        updatedMics = newData.map((entry, index) => convertToMicFormat(entry, `${sourceId}-${index}`));
        
    } else if (sourceConfig.venue) {
        // Replace venue-specific data
        console.log(`[MultiSpreadsheetUpdater] Replacing ${sourceConfig.venue} data with ${sourceConfig.name}`);
        
        // Remove existing entries for this venue using normalized venue names for accurate matching
        const normalizeVenueName = window.MicFinderUtils?.normalizeVenueName || ((name) => name.trim());
        const normalizedVenueFilter = normalizeVenueName(sourceConfig.venue);
        const beforeCount = allMics.length;
        
        updatedMics = allMics.filter(mic => {
            const normalizedMicVenue = normalizeVenueName(mic.venue || '');
            const matches = normalizedMicVenue === normalizedVenueFilter;
            
            const { SPREADSHEET_UPDATE_CONFIG } = window.MicFinderConfig || {};
            if (SPREADSHEET_UPDATE_CONFIG?.debugMode && matches) {
                console.log(`[DEBUG] ${sourceConfig.name} - Removing existing venue: "${mic.venue}" (matches filter "${sourceConfig.venue}")`);
            }
            
            return !matches;
        });
        
        const afterCount = updatedMics.length;
        console.log(`[MultiSpreadsheetUpdater] Removed ${beforeCount - afterCount} existing ${sourceConfig.venue} entries`);
        
        // Add new entries for this venue
        const newVenueMics = newData.map((entry, index) => 
            convertToMicFormat(entry, `${sourceId}-${index}`) // Tiny Cupboard venue forced override removed
        );
        updatedMics.push(...newVenueMics);
        
        // Debug: Show final venue data being added
        const { SPREADSHEET_UPDATE_CONFIG } = window.MicFinderConfig || {};
        if (SPREADSHEET_UPDATE_CONFIG?.debugMode) {
            console.log(`[DEBUG] ${sourceConfig.name} - Adding ${newVenueMics.length} new entries for ${sourceConfig.venue}:`);
            console.table(newVenueMics.map(mic => ({
                venue: mic.venue,
                micName: mic.micName,
                day: mic.day,
                time: mic.time,
                host: mic.host
            })));
        }
        
    } else {
        // Merge data (update existing, add new)
        console.log(`[MultiSpreadsheetUpdater] Merging data from ${sourceConfig.name}`);
        
        newData.forEach((entry, index) => {
            const newMic = convertToMicFormat(entry, `${sourceId}-${index}`);
            
            // Try to find existing mic with same venue/day/time
            const existingIndex = updatedMics.findIndex(mic => 
                mic.venue === newMic.venue && 
                mic.day === newMic.day && 
                mic.time === newMic.time
            );
            
            if (existingIndex >= 0) {
                // Update existing mic
                updatedMics[existingIndex] = { ...updatedMics[existingIndex], ...newMic };
            } else {
                // Add new mic
                updatedMics.push(newMic);
            }
        });
    }
    
    // Update application state
    if (window.MicFinderState) {
        window.MicFinderState.setMics(updatedMics);
    }
    
    console.log(`[MultiSpreadsheetUpdater] Local data updated successfully: ${updatedMics.length} total mics`);
}

/**
 * Utility functions
 */
function extractField(row, fieldNames) {
    for (const fieldName of fieldNames) {
        if (row[fieldName] !== undefined && row[fieldName] !== null && row[fieldName] !== '') {
            return row[fieldName].toString().trim();
        }
    }
    return '';
}

function convertToMicFormat(entry, id, forceVenue = null) {
    // Standardize venue names to match existing data using shared normalization function
    let venueName = forceVenue || entry.venue;
    
    // Use the shared venue normalization function for consistency
    if (window.MicFinderUtils && window.MicFinderUtils.normalizeVenueName) {
        venueName = window.MicFinderUtils.normalizeVenueName(venueName);
    } else {
        // Fallback normalization if utils not available
        // Tiny Cupboard venue normalization removed
        /*
        if (venueName.toLowerCase().includes('tiny cupboard')) {
            venueName = 'The Tiny Cupboard';
        }
        */
    }
    
    return {
        id: id,
        venue: venueName,
        address: entry.address,
        borough: entry.borough,
        neighborhood: entry.neighborhood,
        day: entry.day,
        time: entry.time,
        endTime: entry.endTime,
        micName: entry.micName,
        host: entry.host,
        details: entry.notes,
        cost: entry.cost,
        signup: entry.signup,
        lat: entry.lat || getDefaultCoordinates(venueName).lat,
        lon: entry.lon || getDefaultCoordinates(venueName).lon,
        isFree: entry.cost.toLowerCase().includes('free'),
        hasSignup: Boolean(entry.signup),
        venueType: entry.venueType || 'Comedy Club',
        stageTime: entry.stageTime || ''
    };
}

function getDefaultCoordinates(venueName) {
    // Default coordinates for known venues
    const venueCoordinates = {
        // 'the tiny cupboard': { lat: 40.683629, lon: -73.911236 }, // COMMENTED OUT
        'st. mark\'s comedy club': { lat: 40.729131, lon: -73.989225 },
        'greenwich village comedy club': { lat: 40.729604, lon: -74.000966 },
        'comedy shop': { lat: 40.728791, lon: -74.000177 }
    };
    
    const venueKey = venueName.toLowerCase();
    for (const [key, coords] of Object.entries(venueCoordinates)) {
        if (venueKey.includes(key)) {
            return coords;
        }
    }
    
    // Default NYC coordinates
    return { lat: 40.7128, lon: -74.0060 };
}

function shouldCheckSource(sourceId, sourceConfig) {
    const { SPREADSHEET_UPDATE_CONFIG } = window.MicFinderConfig || {};
    const lastUpdate = updateState.lastUpdateTimes[sourceId];
    
    // Always check in debug mode to help troubleshooting
    if (SPREADSHEET_UPDATE_CONFIG?.debugMode) {
        console.log(`[DEBUG] ${sourceConfig.name} - Forcing check due to debug mode`);
        return true;
    }
    
    if (!lastUpdate) return true;
    
    const timeSinceLastUpdate = Date.now() - lastUpdate;
    const shouldCheck = timeSinceLastUpdate >= sourceConfig.updateInterval;
    
    if (SPREADSHEET_UPDATE_CONFIG?.debugMode) {
        console.log(`[DEBUG] ${sourceConfig.name} - Last update: ${new Date(lastUpdate)}, Should check: ${shouldCheck}`);
    }
    
    return shouldCheck;
}

function detectChanges(sourceId, newData) {
    const cachedData = updateState.cachedData[sourceId];
    if (!cachedData) return true;
    
    // Simple change detection - compare data fingerprints
    const newFingerprint = generateDataFingerprint(newData);
    const cachedFingerprint = generateDataFingerprint(cachedData);
    
    return newFingerprint !== cachedFingerprint;
}

function generateDataFingerprint(data) {
    // Create a simple hash of the essential data for change detection
    const essentialData = data.map(entry => ({
        venue: entry.venue,
        day: entry.day,
        time: entry.time,
        micName: entry.micName,
        host: entry.host,
        cost: entry.cost
    }));
    
    const dataString = JSON.stringify(essentialData);
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
}

function normalizeDay(day) {
    if (!day) return '';
    
    const dayStr = day.toString().trim().toLowerCase();
    const days = {
        'sunday': 'Sunday', 'sun': 'Sunday',
        'monday': 'Monday', 'mon': 'Monday',
        'tuesday': 'Tuesday', 'tue': 'Tuesday', 'tues': 'Tuesday',
        'wednesday': 'Wednesday', 'wed': 'Wednesday',
        'thursday': 'Thursday', 'thu': 'Thursday', 'thur': 'Thursday', 'thurs': 'Thursday',
        'friday': 'Friday', 'fri': 'Friday',
        'saturday': 'Saturday', 'sat': 'Saturday'
    };
    
    return days[dayStr] || day;
}

function normalizeTime(time) {
    if (!time) return '';
    
    let timeStr = time.toString().trim();
    
    // Handle various time formats
    if (!timeStr.toLowerCase().includes('am') && !timeStr.toLowerCase().includes('pm')) {
        // Assume 24-hour format, convert to 12-hour
        const [hours, minutes] = timeStr.split(':').map(n => parseInt(n) || 0);
        const isPM = hours >= 12;
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
    }
    
    return timeStr;
}

function setupPeriodicUpdates() {
    // Set up interval checking (check every hour when page is visible)
    setInterval(() => {
        if (document.visibilityState === 'visible' && !updateState.isUpdating) {
            checkAllSources();
        }
    }, 60 * 60 * 1000); // Check every hour
}

function notifyUpdateStatus(status, message = '') {
    console.log(`[MultiSpreadsheetUpdater] Status: ${status}`, message);
    
    // Dispatch custom event for UI to listen to
    const event = new CustomEvent('spreadsheetUpdate', {
        detail: { status, message, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
}

function loadAllCachedData() {
    try {
        const cacheKeys = localStorage.getItem('spreadsheetUpdaterCacheKeys');
        if (cacheKeys) {
            const keys = JSON.parse(cacheKeys);
            
            keys.forEach(sourceId => {
                const lastUpdateKey = `spreadsheetUpdater_lastUpdate_${sourceId}`;
                const dataKey = `spreadsheetUpdater_data_${sourceId}`;
                
                const lastUpdate = localStorage.getItem(lastUpdateKey);
                const cachedData = localStorage.getItem(dataKey);
                
                if (lastUpdate) {
                    updateState.lastUpdateTimes[sourceId] = parseInt(lastUpdate);
                }
                
                if (cachedData) {
                    updateState.cachedData[sourceId] = JSON.parse(cachedData);
                }
            });
        }
    } catch (error) {
        console.warn('[MultiSpreadsheetUpdater] Failed to load cached data:', error);
    }
}

function saveAllCachedData() {
    try {
        const sourceIds = Object.keys(updateState.lastUpdateTimes);
        localStorage.setItem('spreadsheetUpdaterCacheKeys', JSON.stringify(sourceIds));
        
        sourceIds.forEach(sourceId => {
            const lastUpdateKey = `spreadsheetUpdater_lastUpdate_${sourceId}`;
            const dataKey = `spreadsheetUpdater_data_${sourceId}`;
            
            if (updateState.lastUpdateTimes[sourceId]) {
                localStorage.setItem(lastUpdateKey, updateState.lastUpdateTimes[sourceId].toString());
            }
            
            if (updateState.cachedData[sourceId]) {
                localStorage.setItem(dataKey, JSON.stringify(updateState.cachedData[sourceId]));
            }
        });
    } catch (error) {
        console.warn('[MultiSpreadsheetUpdater] Failed to save cached data:', error);
    }
}

// ============================================================================
// TINY CUPBOARD SPECIFIC MONITORING SYSTEM - COMMENTED OUT
// ============================================================================

/*
 * All Tiny Cupboard functions have been commented out:
 * - transformTinyCupboardData
 * - checkTinyCupboardUpdates  
 * - updateAppWithTinyCupboardData
 * - startTinyCupboardMonitoring
 * - stopTinyCupboardMonitoring
 */

/**
 * Notify the app of updates
 */
function notifyAppUpdate(sourceId, data) {
    try {
        // Dispatch custom event for other parts of the app
        const event = new CustomEvent('spreadsheetUpdate', {
            detail: {
                sourceId,
                data,
                timestamp: Date.now(),
                type: 'spreadsheet' // Changed from 'tinyCupboard'
            }
        });
        window.dispatchEvent(event);
        
        // Show notification if enabled
        if (window.MicFinderConfig?.SPREADSHEET_UPDATE_CONFIG?.showNotifications) {
            showUpdateNotification(sourceId, data.length);
        }
        
    } catch (error) {
        console.warn('[SpreadsheetUpdater] Error notifying app:', error); // Changed from TinyCupboard
    }
}

/**
 * Show update notification
 */
function showUpdateNotification(sourceId, micCount) {
    try {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'spreadsheet-update-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <strong>Mic Schedule Updated!</strong> <!-- Tiny Cupboard specific text removed -->
                <br>${micCount} mics refreshed
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 300px;
            font-family: Arial, sans-serif;
        `;
        
        // Add close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            float: right;
            margin-left: 10px;
        `;
        closeBtn.onclick = () => notification.remove();
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
    } catch (error) {
        console.warn('[SpreadsheetUpdater] Error showing notification:', error); // Changed from TinyCupboard
    }
}

// Export functions for use by other modules
window.MicFinderSpreadsheetUpdater = {
    initialize: initializeSpreadsheetUpdater,
    checkAllSources,
    forceUpdate: () => checkAllSources(true),
    checkSingleSource: (sourceId) => {
        const { SPREADSHEET_SOURCES } = window.MicFinderConfig || {};
        const sourceConfig = SPREADSHEET_SOURCES[sourceId];
        if (sourceConfig && sourceConfig.enabled) {
            return checkSingleSource(sourceId, sourceConfig, true);
        }
        return Promise.resolve(false);
    },
    getUpdateState: () => ({ ...updateState }),
    createBackup,
    restoreFromBackup,
    validateData,
    clearCache: () => {
        updateState.lastUpdateTimes = {};
        updateState.cachedData = {};
        localStorage.removeItem('spreadsheetUpdaterCacheKeys');
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('spreadsheetUpdater_')) {
                localStorage.removeItem(key);
            }
        });
        console.log('[MultiSpreadsheetUpdater] Cache cleared');
    },
    enableUpdates: () => {
        if (window.MicFinderConfig) {
            window.MicFinderConfig.SPREADSHEET_UPDATE_CONFIG.enabled = true;
            console.log('[MultiSpreadsheetUpdater] Updates enabled');
        }
    },
    disableUpdates: () => {
        if (window.MicFinderConfig) {
            window.MicFinderConfig.SPREADSHEET_UPDATE_CONFIG.enabled = false;
            console.log('[MultiSpreadsheetUpdater] Updates disabled');
        }
    },
    // Tiny Cupboard specific functions - COMMENTED OUT
    // startTinyCupboardMonitoring,
    // stopTinyCupboardMonitoring,
    // checkTinyCupboardUpdates,
    // transformTinyCupboardData
};

// Auto-initialize when the module loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeSpreadsheetUpdater, 1000);
});