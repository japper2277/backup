// Map Functionality

let map;
let markerClusterGroup;
let venueClusterMarkers = [];

// Initialize map
function initializeMap() {
    console.log('[Map] initializeMap called, attempting to attach to #map');
    const { MAP_CONFIG } = window.MicFinderConfig;
    
    map = L.map('map', {
        preferCanvas: true,
        updateWhenZooming: false,
        updateWhenIdle: true,
        maxZoom: MAP_CONFIG.maxZoom || 18,
        minZoom: MAP_CONFIG.minZoom || 10,
        zoomControl: false // Remove default zoom control
    }).setView([40.7128, -74.0060], 12); // Set default view to NYC

    // Add tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 18,
        tileSize: 256,
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: 2
    }).addTo(map);

    // Initialize marker cluster group with smart venue-aware clustering
    markerClusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: false,
        // Smart clustering radius for smooth zoom transitions
        maxClusterRadius: function(zoom) {
            // At high zoom levels (16+), use very small radius to prevent different venues from clustering
            if (zoom >= 16) return 5;
            // At mid zoom levels (13-15), use small radius for venue markers
            if (zoom >= 13 && zoom <= 15) return 20;
            // At low zoom levels (<13), use larger radius to prevent different venues from clustering
            return 50;
        },


        // Create custom cluster icons that show venue info when needed
        iconCreateFunction: function(cluster) {
            const markers = cluster.getAllChildMarkers();
            const count = markers.length;
            
            // Check if all markers are from the same venue
            const venueKeys = markers.map(m => {
                const mic = m.options.micData || {};
                // Normalize venue name to handle case variations
                const normalizedVenue = window.MicFinderUtils.normalizeVenueName(mic.venue || '');
                return `${normalizedVenue}__${mic.address}__${mic.lat}__${mic.lon}`;
            });
            const allSameVenue = venueKeys.every(k => k === venueKeys[0]);
            
            let className = 'marker-cluster ';
            if (count < 10) {
                className += 'marker-cluster-small';
            } else if (count < 100) {
                className += 'marker-cluster-medium';
            } else {
                className += 'marker-cluster-large';
            }
            
            // Add warning class if different venues are clustered (shouldn't happen often with our settings)
            if (!allSameVenue) {
                className += ' mixed-venue-cluster';
                console.warn('🚨 Different venues clustered together:', venueKeys);
            }
            
            return new L.DivIcon({
                html: `<div><span>${count}</span></div>`,
                className: className,
                iconSize: new L.Point(40, 40)
            });
        }
    });

    map.addLayer(markerClusterGroup);
    
    // Add map controls
    setupMapControls();
    
    // Add event listeners
    setupMapEventListeners();
    
    // Ensure map is properly sized
    requestAnimationFrame(() => {
        map.invalidateSize();
    });
}

// Setup map controls
function setupMapControls() {
    // Remove default zoom control (do not add it)
    // L.control.zoom({
    //     position: 'bottomright'
    // }).addTo(map);

    // Remove or comment out the scale control
    // L.control.scale({
    //     imperial: true,
    //     position: 'bottomright'
    // }).addTo(map);

    // Setup custom map control buttons
    const zoomToFitBtn = document.getElementById('zoom-to-fit-btn');
    if (zoomToFitBtn) {
        zoomToFitBtn.addEventListener('click', zoomToFitAllMics);
    }

    // Safeguard: Only enable geolocate/location buttons on fullscreen/desktop
    const geolocateMapBtn = document.getElementById('geolocate-map-btn');
    const directionsBtn = document.getElementById('directions-btn');
    // Consider mobile/minimized if width <= 1023px or body/mobile class is present
    const isMobileOrMinimized = window.innerWidth <= 1023 || document.body.classList.contains('mobile-layout') || document.body.classList.contains('minimized-layout');
    
    // Handle geolocate button (hide on mobile)
    if (geolocateMapBtn) {
        if (isMobileOrMinimized) {
            geolocateMapBtn.style.display = 'none';
        } else {
            geolocateMapBtn.style.display = '';
            geolocateMapBtn.addEventListener('click', geolocateUser);
        }
    }
    
    // Handle directions button (always show and make functional)
    if (directionsBtn) {
        directionsBtn.style.display = '';
        directionsBtn.addEventListener('click', geolocateUser);
    }
}

// Helper function to determine zoom range
function getZoomRange(zoomLevel) {
    if (zoomLevel >= 13) {
        return 'high'; // Detailed venue markers
    } else {
        return 'low'; // Clustering
    }
}

// Setup map event listeners
function setupMapEventListeners() {
    let mapChangeTimeout = null;
    let lastRenderTime = 0;
    let previousZoomLevel = map.getZoom();
    
    const handleMapChange = () => {
        if (mapChangeTimeout) {
            clearTimeout(mapChangeTimeout);
        }
        
        const now = Date.now();
        // Only trigger render if enough time has passed since last render
        const minRenderInterval = 500; // 500ms minimum between renders
        
        mapChangeTimeout = setTimeout(() => {
            if (window.MicFinderState.getMapFilterEnabled() && (now - lastRenderTime > minRenderInterval)) {
                lastRenderTime = now;
                window.MicFinderApp.render();
            }
            mapChangeTimeout = null;
        }, 300); // Increased debounce time from 200ms to 300ms
    };

    // Handle zoom level changes for marker style transitions
    const handleZoomChange = () => {
        const currentZoom = map.getZoom();
        
        // Since we're using consistent purple venue markers at all zoom levels,
        // we don't need to refresh markers when crossing zoom thresholds
        // This prevents the flashing issue when zooming in on clusters
        
        previousZoomLevel = currentZoom;
    };

    map.on('moveend', handleMapChange);
    map.on('zoomend', () => {
        handleMapChange();
        handleZoomChange();
    });

    map.on('zoomstart', clearCustomSpiderfy);
    map.on('movestart', clearCustomSpiderfy);

    // --- Custom cluster click handler ---
    markerClusterGroup.on('clusterclick', function (a) {
        const markers = a.layer.getAllChildMarkers();
        console.log('🔘 Cluster clicked with', markers.length, 'markers');
        if (markers.length < 2) return; // Only care about clusters
        
        // Custom: Check if all markers are from the same venue
        const venueKeys = markers.map(m => {
            const mic = m.options.micData || {};
            // Normalize venue name to handle case variations
            const normalizedVenue = window.MicFinderUtils.normalizeVenueName(mic.venue || '');
            return `${normalizedVenue}__${mic.address}__${mic.lat}__${mic.lon}`;
        });
        console.log('[DEBUG] Cluster click venueKeys:', venueKeys);
        const allSameVenue = venueKeys.every(k => k === venueKeys[0]);
        console.log('[DEBUG] allSameVenue:', allSameVenue);
        
        if (allSameVenue) {
            // Instead of opening a Leaflet popup, open the big modal
            const mics = markers.map(m => m.options.micData).filter(Boolean);
            if (mics.length > 0) {
                showVenueClusterModal(mics);
                // Prevent default zoom/spiderfy
                a.originalEvent.preventDefault();
                a.originalEvent.stopPropagation();
                return;
            }
        } else {
            console.log('🏢 Different venues clustered - allowing expansion');
            // Different venues clustered together - always allow expansion
            return; // Let Leaflet handle the default expansion
        }
        // Default: allow cluster to break up/zoom
        // Get all mics for these markers
        const allMics = window.MicFinderState.getAllMics();
        const markerLat = markers[0].getLatLng().lat;
        const markerLon = markers[0].getLatLng().lng;
        // Find all mics at this lat/lon and day
        const micsInCluster = markers.map(m => {
            // Find mic by lat/lon and id
            return allMics.find(mic => mic.lat == m.getLatLng().lat && mic.lon == m.getLatLng().lng && mic.id == m.options.micId);
        }).filter(Boolean);
        if (micsInCluster.length < 2) return;

        // Check if all at nearly the same coordinates (within 1 meter)
        function getDistanceMeters(lat1, lon1, lat2, lon2) {
            const R = 6371000; // meters
            const toRad = x => x * Math.PI / 180;
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        }
        let allWithinOneMeter = true;
        for (let i = 0; i < micsInCluster.length; i++) {
            for (let j = i + 1; j < micsInCluster.length; j++) {
                const d = getDistanceMeters(
                    parseFloat(micsInCluster[i].lat),
                    parseFloat(micsInCluster[i].lon),
                    parseFloat(micsInCluster[j].lat),
                    parseFloat(micsInCluster[j].lon)
                );
                if (d > 1) {
                    allWithinOneMeter = false;
                    break;
                }
            }
            if (!allWithinOneMeter) break;
        }
        // If all markers are at the same spot, always show the group popup, never just one marker
        console.log('📏 All within one meter?', allWithinOneMeter);
        if (!allWithinOneMeter) {
            console.log('✅ Allowing default cluster expansion (markers are spread out)');
            // Default: zoom to bounds - don't prevent default behavior
            // Let Leaflet handle the cluster expansion
            return; // This allows the default zoomToBoundsOnClick behavior
        }

        // Group by info (excluding time)
        function micInfoKey(mic) {
            // Exclude time, id, and any unique fields
            return JSON.stringify({
                venue: mic.venue,
                address: mic.address,
                day: mic.day,
                cost: mic.cost,
                details: mic.details,
                borough: mic.borough
            });
        }
        const infoGroups = {};
        micsInCluster.forEach(mic => {
            const key = micInfoKey(mic);
            if (!infoGroups[key]) infoGroups[key] = [];
            infoGroups[key].push(mic);
        });
        const infoGroupKeys = Object.keys(infoGroups);

        // Show first group by default (earliest by time)
        const sortedInfoGroupKeys = [...infoGroupKeys].sort((a, b) => {
            // Sort by earliest time in each group
            const getEarliestMinutes = (group) => {
                const times = group.map(m => m.time);
                // Parse 'h:mm AM/PM' to minutes
                const toMinutes = (t) => {
                    const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                    if (!match) return 0;
                    let [_, h, m, p] = match;
                    h = parseInt(h, 10);
                    m = parseInt(m, 10);
                    if (p.toUpperCase() === 'PM' && h < 12) h += 12;
                    if (p.toUpperCase() === 'AM' && h === 12) h = 0;
                    return h * 60 + m;
                };
                return Math.min(...times.map(toMinutes));
            };
            return getEarliestMinutes(infoGroups[a]) - getEarliestMinutes(infoGroups[b]);
        });
        const firstMic = infoGroups[sortedInfoGroupKeys[0]][0];

        // Build popup HTML
        let popupHtml = '';
        if (infoGroupKeys.length === 1) {
            // All info same, show one card with all times as plain text
            const group = infoGroups[infoGroupKeys[0]];
            const mic = group[0];
            popupHtml += `<div class="details-section" style="margin-bottom:2rem;">`;
            popupHtml += `<div style=\"margin-bottom:1em; font-size:1.1em; color:#fff;\"><b>Time(s):</b> ${group.map(m => m.time).join(', ')}</div>`;
            popupHtml += `<div class="details-grid" role="list">
                <div class="detail-item" role="listitem"><i class="fa-regular fa-calendar" aria-hidden="true"></i><span class="detail-label">Day:</span><span class="detail-value">${mic.day}</span></div>
                <div class="detail-item" role="listitem"><i class="fa-solid fa-tag" aria-hidden="true"></i><span class="detail-label">Cost:</span><span class="detail-value">${mic.cost}</span></div>
                <div class="detail-item" role="listitem"><i class="fa-solid fa-location-dot" aria-hidden="true"></i><span class="detail-label">Location:</span><span class="detail-value">${mic.borough ? mic.borough + ', ' : ''}${mic.address}</span></div>
                ${mic.signup ? (() => {
                    const signup = mic.signup.trim();
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const isOnlyUrl = /^https?:\/\/[^\s]+$/.test(signup);
                    if (isOnlyUrl) {
                        return `<div class=\"detail-item\" role=\"listitem\"><i class=\"fa-solid fa-clipboard-list\" aria-hidden=\"true\"></i><span class=\"detail-label\">Sign Up:</span><span class=\"detail-value\">Link</span></div>`;
                    } else {
                        const linkedSignup = signup.replace(urlRegex, url => `<a class='ig-link' href='${url}' target='_blank' rel='noopener noreferrer'>${url}</a>`);
                        return `<div class=\"detail-item\" role=\"listitem\"><i class=\"fa-solid fa-clipboard-list\" aria-hidden=\"true\"></i><span class=\"detail-label\">Sign Up:</span><span class=\"detail-value\">${linkedSignup}</span></div>`;
                    }
                })() : ''}
                ${mic.host ? (() => {
                    const cleanHandle = mic.host.replace(/[^a-zA-Z0-9_\.]/g, '').replace(/^@/, '');
                    return `<div class="detail-item" role="listitem"><i class="fa-brands fa-instagram" aria-hidden="true"></i><span class="detail-label">For Updates:</span><span class="detail-value"><a class='ig-link' href='https://instagram.com/${cleanHandle}' target='_blank' rel='noopener noreferrer'>@${cleanHandle}</a></span></div>`;
                })() : ''}
            </div>`;
            if (mic.details) {
                popupHtml += `<div class="details-section"><b>Details:</b> ${mic.details}</div>`;
            }
            popupHtml += `<div class="modal-actions" style="margin-top:1rem;">
                <button class="modal-btn secondary favorite-btn" data-mic-id="${mic.id}" aria-label="${favorites.includes(mic.id) ? 'Remove from favorites' : 'Add to favorites'}">
                    <i class="${favorites.includes(mic.id) ? 'fa-solid' : 'fa-regular'} fa-star" aria-hidden="true"></i>
                </button>
                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mic.venue + ', ' + mic.address)}" target="_blank" rel="noopener noreferrer" class="modal-btn primary" aria-label="Get directions to ${mic.venue} (opens in new tab)">
                    <i class="fa-solid fa-directions" aria-hidden="true"></i>
                    Get Directions
                </a>
            </div>`;
            popupHtml += `</div>`;
        } else {
            // Info differs, show pills and a note
            popupHtml += `<div style='margin-bottom:0.5em;color:#fbbf24;font-weight:600;'>Multiple events at this location have different details. Select a time to see specific info.</div>`;
            popupHtml += `<div class='mic-times-pills' style='display:flex;flex-wrap:wrap;gap:0.5em;margin-bottom:1em;'>`;
            sortedInfoGroupKeys.forEach((key, i) => {
                const group = infoGroups[key];
                const times = group.map(m => m.time).join(', ');
                popupHtml += `<span class='mic-time-pill' data-info-group='${i}' data-mic-idx='${i}' style='display:inline-block;padding:0.5em 1.2em;border-radius:1.2em;background:linear-gradient(90deg,#444857 0%,#232533 100%);color:#fff;font-weight:500;margin:0.2em 0.5em 0.2em 0;cursor:pointer;'>${times}</span>`;
            });
            popupHtml += `</div>`;
            // Show first group by default
            const firstMic = infoGroups[sortedInfoGroupKeys[0]][0];
            popupHtml += `<div class='mic-popup-details'><div><b>Day:</b> ${firstMic.day}</div><div><b>Cost:</b> ${firstMic.cost}</div><div><b>Location:</b> ${firstMic.borough ? firstMic.borough + ', ' : ''}${firstMic.address}</div></div>`;
            popupHtml += `</div>`;
        }

        // Show popup at cluster location
        const popup = L.popup({
            closeButton: true,
            autoClose: true,
            className: 'mic-popup-container',
            maxWidth: 400
        })
        .setLatLng(a.layer.getLatLng())
        .setContent(popupHtml);
        map.openPopup(popup);

        // Add click handler for pills if info differs
        if (sortedInfoGroupKeys.length > 1) {
            setTimeout(() => {
                document.querySelectorAll('.mic-time-pill').forEach(pill => {
                    pill.addEventListener('click', function() {
                        const groupIdx = this.getAttribute('data-info-group');
                        const micIdx = this.getAttribute('data-mic-idx');
                        const mic = infoGroups[sortedInfoGroupKeys[groupIdx]][micIdx];
                        const detailsDiv = document.querySelector('.mic-popup-details');
                        if (detailsDiv && mic) {
                            let igHtml = '';
                            if (mic.host) {
                                const cleanHandle = mic.host.replace(/[^a-zA-Z0-9_\.]/g, '').replace(/^@/, '');
                                igHtml = `<div class=\"detail-item\" role=\"listitem\"><i class=\"fa-brands fa-instagram\" aria-hidden=\"true\"></i><span class=\"detail-label\">For Updates:</span><span class=\"detail-value\"><a class='ig-link' href='https://instagram.com/${cleanHandle}' target='_blank' rel='noopener noreferrer'>@${cleanHandle}</a></span></div>`;
                            }
                            let signupHtml = '';
                            if (mic.signup) {
                                const signup = mic.signup.trim();
                                const urlRegex = /(https?:\/\/[^\s]+)/g;
                                const isOnlyUrl = /^https?:\/\/[^\s]+$/.test(signup);
                                if (isOnlyUrl) {
                                    signupHtml = `<div class=\"detail-item\" role=\"listitem\"><i class=\"fa-solid fa-clipboard-list\" aria-hidden=\"true\"></i><span class=\"detail-label\">Sign Up:</span><span class=\"detail-value\"><a class='ig-link' href='${signup}' target='_blank' rel='noopener noreferrer'>Link</a></span></div>`;
                                } else {
                                    const linkedSignup = signup.replace(urlRegex, url => `<a class='ig-link' href='${url}' target='_blank' rel='noopener noreferrer'>${url}</a>`);
                                    signupHtml = `<div class=\"detail-item\" role=\"listitem\"><i class=\"fa-solid fa-clipboard-list\" aria-hidden=\"true\"></i><span class=\"detail-label\">Sign Up:</span><span class=\"detail-value\">${linkedSignup}</span></div>`;
                                }
                            }
                            detailsDiv.innerHTML = `<div class=\"details-grid\" role=\"list\">\n<div class=\"detail-item\" role=\"listitem\"><i class=\"fa-regular fa-calendar\" aria-hidden=\"true\"></i><span class=\"detail-label\">Day:</span><span class=\"detail-value\">${mic.day}</span></div>\n<div class=\"detail-item\" role=\"listitem\"><i class=\"fa-solid fa-tag\" aria-hidden=\"true\"></i><span class=\"detail-label\">Cost:</span><span class=\"detail-value\">${mic.cost}</span></div>\n<div class=\"detail-item\" role=\"listitem\"><i class=\"fa-solid fa-location-dot\" aria-hidden=\"true\"></i><span class=\"detail-label\">Location:</span><span class=\"detail-value\">${mic.borough ? mic.borough + ', ' : ''}${mic.address}</span></div>\n${signupHtml}${igHtml}</div>`;
                        }
                    });
                });
            }, 100);
        }

        // Prevent default zoom/spiderfy
        a.originalEvent.preventDefault();
        a.originalEvent.stopPropagation();
    });
}

// Helper function to create darker color for gradient
function getDarkerColor(hexColor) {
    const colorMap = {
        '#ef4444': '#dc2626', // Red to darker red
        '#f97316': '#ea580c', // Orange to darker orange 
        '#6b7280': '#4b5563', // Gray to darker gray
        '#22c55e': '#16a34a', // Green to darker green
        '#eab308': '#ca8a04', // Gold to darker gold
        '#45a3ff': '#2563eb'  // Blue to darker blue
    };
    return colorMap[hexColor] || hexColor;
}

// Create custom marker icon based on mic status with visual hierarchy
function createCustomMarkerIcon(mic) {
    const { isHappeningNow, isStartingSoon, isStarted } = window.MicFinderUtils;
    const { getFavorites } = window.MicFinderState;
    
    // Get user favorites
    const favorites = getFavorites();
    const isFavorite = favorites.includes(mic.id);
    
    // Determine status and visual properties
    let statusClass = '';
    let backgroundColor = '#45a3ff'; // Default blue
    let size = 32; // Default size
    let pulseAnimation = '';
    
    // Status-based styling (highest priority)
    if (isHappeningNow(mic)) {
        statusClass = 'happening-now';
        backgroundColor = '#ef4444'; // Red
        size = 38; // Larger for urgency
        pulseAnimation = 'marker-pulse 2s infinite';
    } else if (isStartingSoon(mic)) {
        statusClass = 'starting-soon';
        backgroundColor = '#f97316'; // Orange
        size = 36; // Slightly larger
    } else if (isStarted(mic)) {
        statusClass = 'started';
        backgroundColor = '#6b7280'; // Gray
        size = 28; // Smaller since it's less relevant
    } else if (mic.cost && mic.cost.toLowerCase().includes('free')) {
        statusClass = 'free';
        backgroundColor = '#22c55e'; // Green
        size = 34; // Slightly larger to highlight free events
    } else if (isFavorite) {
        statusClass = 'favorite';
        backgroundColor = '#eab308'; // Gold
        size = 34; // Larger for favorites
    }
    
    // Create custom SVG icon with number (like demo #3)
    const svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" width="${size}" height="${Math.floor(size * 1.2)}" class="custom-svg-venue-icon">
            <defs>
                <linearGradient id="grad_${mic.id}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="${backgroundColor}"/>
                    <stop offset="100%" stop-color="${getDarkerColor(backgroundColor)}"/>
                </linearGradient>
            </defs>
            <path d="M20 0C11.16 0 4 7.16 4 16c0 10.5 16 32 16 32s16-21.5 16-32C36 7.16 28.84 0 20 0z" fill="url(#grad_${mic.id})"/>
            <circle cx="20" cy="16" r="9" fill="white"/>
            <text x="20" y="20.5" font-family="Poppins, sans-serif" font-size="12" font-weight="600" fill="${backgroundColor}" text-anchor="middle">1</text>
        </svg>`;
    
    // Create the marker HTML with enhanced styling
    const markerHtml = `
        <div class="enhanced-marker ${statusClass}" style="
            position: relative;
            transition: all 0.3s cubic-bezier(0.4, 1.4, 0.6, 1);
            ${pulseAnimation ? `animation: ${pulseAnimation};` : ''}
            z-index: ${statusClass === 'happening-now' ? 1000 : statusClass === 'starting-soon' ? 900 : 800};
        ">
            ${svgIcon}
        </div>
    `;
    
    return L.divIcon({
        className: `custom-marker-enhanced ${statusClass}`,
        html: markerHtml,
        iconSize: [size, Math.floor(size * 1.2)],
        iconAnchor: [size/2, Math.floor(size * 1.2)],
        popupAnchor: [0, -Math.floor(size * 1.2)]
    });
}

// Create highlighted marker icon with enhanced visual hierarchy
function createHighlightedMarkerIcon(mic) {
    const { isHappeningNow, isStartingSoon, isStarted } = window.MicFinderUtils;
    const { getFavorites } = window.MicFinderState;
    
    // Get user favorites
    const favorites = getFavorites();
    const isFavorite = favorites.includes(mic.id);
    
    // Determine status and visual properties (larger for highlighted state)
    let statusClass = 'highlighted';
    let backgroundColor = '#45a3ff'; // Default blue
    let size = 40; // Larger base size for highlighted
    let pulseAnimation = '';
    let glowColor = '#45a3ff';
    
    // Status-based styling (highest priority)
    if (isHappeningNow(mic)) {
        statusClass = 'happening-now highlighted';
        backgroundColor = '#ef4444';
        glowColor = '#ef4444';
        size = 46;
        pulseAnimation = 'marker-pulse-highlighted 1.5s infinite';
    } else if (isStartingSoon(mic)) {
        statusClass = 'starting-soon highlighted';
        backgroundColor = '#f97316';
        glowColor = '#f97316';
        size = 44;
    } else if (isStarted(mic)) {
        statusClass = 'started highlighted';
        backgroundColor = '#6b7280';
        glowColor = '#6b7280';
        size = 36;
    } else if (mic.cost && mic.cost.toLowerCase().includes('free')) {
        statusClass = 'free highlighted';
        backgroundColor = '#22c55e';
        glowColor = '#22c55e';
        size = 42;
    } else if (isFavorite) {
        statusClass = 'favorite highlighted';
        backgroundColor = '#eab308';
        glowColor = '#eab308';
        size = 42;
    }
    
    // Create custom SVG icon for highlighted state with number (like demo #3)
    const svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" width="${size}" height="${Math.floor(size * 1.2)}" class="custom-svg-venue-icon">
            <defs>
                <linearGradient id="grad_h_${mic.id}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="${backgroundColor}"/>
                    <stop offset="100%" stop-color="${getDarkerColor(backgroundColor)}"/>
                </linearGradient>
            </defs>
            <path d="M20 0C11.16 0 4 7.16 4 16c0 10.5 16 32 16 32s16-21.5 16-32C36 7.16 28.84 0 20 0z" fill="url(#grad_h_${mic.id})"/>
            <circle cx="20" cy="16" r="9" fill="white"/>
            <text x="20" y="20.5" font-family="Poppins, sans-serif" font-size="12" font-weight="600" fill="${backgroundColor}" text-anchor="middle">1</text>
        </svg>`;
    
    // Create the highlighted marker HTML with glow effect
    const markerHtml = `
        <div class="enhanced-marker ${statusClass}" style="
            position: relative;
            box-shadow: 0 0 0 4px rgba(${hexToRgb(glowColor)}, 0.3), 0 6px 16px rgba(0,0,0,0.4);
            transition: all 0.3s cubic-bezier(0.4, 1.4, 0.6, 1);
            ${pulseAnimation ? `animation: ${pulseAnimation};` : ''}
            z-index: 2000;
            transform: scale(1.1);
        ">
            ${svgIcon}
        </div>
    `;
    
    return L.divIcon({
        className: `custom-marker-enhanced ${statusClass}`,
        html: markerHtml,
        iconSize: [size, Math.floor(size * 1.2)],
        iconAnchor: [size/2, Math.floor(size * 1.2)],
        popupAnchor: [0, -Math.floor(size * 1.2)]
    });
}

// Create simple purple dot marker for mid-zoom levels
function createSimplePurpleDotMarker(mic) {
    const size = 12; // Small uniform size for clean appearance
    const backgroundColor = '#8E2DE2'; // Purple color
    
    // Simple circle SVG
    const svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="simple-purple-dot">
            <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="${backgroundColor}" stroke="white" stroke-width="2"/>
        </svg>`;
    
    // Create the marker HTML with minimal styling
    const markerHtml = `
        <div class="simple-dot-marker" style="
            position: relative;
            transition: all 0.3s ease;
        ">
            ${svgIcon}
        </div>
    `;
    
    return L.divIcon({
        className: 'simple-purple-dot-marker',
        html: markerHtml,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
        popupAnchor: [0, -size/2]
    });
}

// Create highlighted simple purple dot marker for mid-zoom levels
function createHighlightedSimplePurpleDotMarker(mic) {
    const size = 14; // Slightly larger for highlighted state
    const backgroundColor = '#8E2DE2'; // Purple color
    
    // Simple circle SVG with glow effect
    const svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="simple-purple-dot highlighted">
            <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="${backgroundColor}" stroke="white" stroke-width="3"/>
        </svg>`;
    
    // Create the marker HTML with glow styling
    const markerHtml = `
        <div class="simple-dot-marker highlighted" style="
            position: relative;
            transition: all 0.3s ease;
            box-shadow: 0 0 0 3px rgba(142, 45, 226, 0.4), 0 4px 12px rgba(0,0,0,0.3);
            border-radius: 50%;
            z-index: 2000;
            transform: scale(1.2);
        ">
            ${svgIcon}
        </div>
    `;
    
    return L.divIcon({
        className: 'simple-purple-dot-marker highlighted',
        html: markerHtml,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
        popupAnchor: [0, -size/2]
    });
}

// Create venue marker icon with mic count
function createVenueMarkerIcon(mic, micCount) {
    const backgroundColor = '#8E2DE2'; // Purple gradient like demo #3
    const size = 32; // Uniform size
    
    // Create different designs based on mic count
    let svgIcon;
    if (micCount === 1) {
        // Regular pin without number for single mics
        svgIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" width="${size}" height="${Math.floor(size * 1.2)}" class="custom-svg-venue-icon">
                <defs>
                    <linearGradient id="grad_venue_${mic.id}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="${backgroundColor}"/>
                        <stop offset="100%" stop-color="#4A00E0"/>
                    </linearGradient>
                </defs>
                <path d="M20 0C11.16 0 4 7.16 4 16c0 10.5 16 32 16 32s16-21.5 16-32C36 7.16 28.84 0 20 0z" fill="url(#grad_venue_${mic.id})"/>
                <circle cx="20" cy="16" r="9" fill="white"/>
            </svg>`;
    } else {
        // Pin with number for multiple mics
        svgIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" width="${size}" height="${Math.floor(size * 1.2)}" class="custom-svg-venue-icon">
                <defs>
                    <linearGradient id="grad_venue_${mic.id}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="${backgroundColor}"/>
                        <stop offset="100%" stop-color="#4A00E0"/>
                    </linearGradient>
                </defs>
                <path d="M20 0C11.16 0 4 7.16 4 16c0 10.5 16 32 16 32s16-21.5 16-32C36 7.16 28.84 0 20 0z" fill="url(#grad_venue_${mic.id})"/>
                <circle cx="20" cy="16" r="9" fill="white"/>
                <text x="20" y="20.5" font-family="Poppins, sans-serif" font-size="12" font-weight="600" fill="#4A00E0" text-anchor="middle">${micCount}</text>
            </svg>`;
    }
    
    // Create the marker HTML with simple styling
    const markerHtml = `
        <div class="enhanced-marker" style="
            position: relative;
            transition: all 0.3s ease;
        ">
            ${svgIcon}
        </div>
    `;
    
    return L.divIcon({
        className: 'custom-marker-enhanced',
        html: markerHtml,
        iconSize: [size, Math.floor(size * 1.2)],
        iconAnchor: [size/2, Math.floor(size * 1.2)],
        popupAnchor: [0, -Math.floor(size * 1.2)]
    });
}

// Create highlighted venue marker icon with mic count
function createHighlightedVenueMarkerIcon(mic, micCount) {
    const backgroundColor = '#8E2DE2'; // Same purple gradient
    const size = 36; // Slightly larger for highlighted state
    const glowColor = '#8E2DE2';
    
    // Create different designs based on mic count
    let svgIcon;
    if (micCount === 1) {
        // Regular pin without number for single mics
        svgIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" width="${size}" height="${Math.floor(size * 1.2)}" class="custom-svg-venue-icon">
                <defs>
                    <linearGradient id="grad_h_venue_${mic.id}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="${backgroundColor}"/>
                        <stop offset="100%" stop-color="#4A00E0"/>
                    </linearGradient>
                </defs>
                <path d="M20 0C11.16 0 4 7.16 4 16c0 10.5 16 32 16 32s16-21.5 16-32C36 7.16 28.84 0 20 0z" fill="url(#grad_h_venue_${mic.id})"/>
                <circle cx="20" cy="16" r="9" fill="white"/>
            </svg>`;
    } else {
        // Pin with number for multiple mics
        svgIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" width="${size}" height="${Math.floor(size * 1.2)}" class="custom-svg-venue-icon">
                <defs>
                    <linearGradient id="grad_h_venue_${mic.id}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="${backgroundColor}"/>
                        <stop offset="100%" stop-color="#4A00E0"/>
                    </linearGradient>
                </defs>
                <path d="M20 0C11.16 0 4 7.16 4 16c0 10.5 16 32 16 32s16-21.5 16-32C36 7.16 28.84 0 20 0z" fill="url(#grad_h_venue_${mic.id})"/>
                <circle cx="20" cy="16" r="9" fill="white"/>
                <text x="20" y="20.5" font-family="Poppins, sans-serif" font-size="12" font-weight="600" fill="#4A00E0" text-anchor="middle">${micCount}</text>
            </svg>`;
    }
    
    // Create the highlighted marker HTML with simple glow effect
    const markerHtml = `
        <div class="enhanced-marker highlighted" style="
            position: relative;
            box-shadow: 0 0 0 4px rgba(142, 45, 226, 0.3), 0 6px 16px rgba(0,0,0,0.4);
            transition: all 0.3s ease;
            z-index: 2000;
            transform: scale(1.1);
        ">
            ${svgIcon}
        </div>
    `;
    
    return L.divIcon({
        className: 'custom-marker-enhanced highlighted',
        html: markerHtml,
        iconSize: [size, Math.floor(size * 1.2)],
        iconAnchor: [size/2, Math.floor(size * 1.2)],
        popupAnchor: [0, -Math.floor(size * 1.2)]
    });
}

// Helper function to convert hex color to RGB values
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
    }
    // Fallback for color names
    const colorMap = {
        '#ef4444': '239, 68, 68',
        '#f97316': '249, 115, 22',
        '#22c55e': '34, 197, 94',
        '#eab308': '234, 179, 8',
        '#45a3ff': '69, 163, 255',
        '#6b7280': '107, 114, 128'
    };
    return colorMap[hex] || '69, 163, 255';
}

function createPopupContent(mic) {
    const { fixApostropheS } = window.MicFinderUtils;
    return `
        <div class="custom-map-popup">
            <div class="popup-header">${fixApostropheS(mic.venue)}</div>
            <div class="popup-address"><b>${mic.address || ''}${mic.address && mic.borough ? ', ' : ''}${mic.borough ? mic.borough + ', NY' : ''}</b></div>
            <div class="popup-mic-info">Open Mic: <b>${mic.day}s @ ${mic.time}</b></div>
        </div>
    `;
}

// Create popup content for multiple mics at the same venue
function createMultiMicPopupContent(mics) {
    const { fixApostropheS } = window.MicFinderUtils;
    if (!mics || mics.length === 0) return '';
    const mic = mics[0];
    // Group times by day and deduplicate same times
    const dayMap = {};
    mics.forEach(m => {
        if (!dayMap[m.day]) dayMap[m.day] = [];
        // Only add time if it's not already in the array for this day
        if (!dayMap[m.day].includes(m.time)) {
            dayMap[m.day].push(m.time);
        }
    });
    // Calendar order
    const weekdayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const orderedDays = weekdayOrder.filter(day => dayMap[day]);
    let micInfo = 'Open Mic: ';
    micInfo += orderedDays.map((day, i) => {
        const times = dayMap[day].join(', ');
        return (i === 0 ? '' : '<br>') + `${day}s @ ${times}`;
    }).join('');
    return `
        <div class=\"custom-map-popup\">\n            <div class=\"popup-header\">${fixApostropheS(mic.venue)}</div>\n            <div class=\"popup-address\"><b>${mic.address || ''}${mic.address && mic.borough ? ', ' : ''}${mic.borough ? mic.borough + ', NY' : ''}</b></div>\n            <div class=\"popup-mic-info\">${micInfo}</div>\n        </div>\n    `;
}

// Highlight a map marker
function highlightMapMarker(micId) {
    const markers = window.MicFinderState.getMarkers();
    const marker = markers[micId];
    if (marker) {
        // Remove highlight from all other markers
        clearAllMarkerHighlights();
        // Add highlight to this marker
        const mic = window.MicFinderState.getAllMics().find(m => m.id === micId);
        if (mic && marker.options.venueData) {
            // Use highlighted venue marker for all zoom levels
            marker.setIcon(createHighlightedVenueMarkerIcon(mic, marker.options.venueData.length));
            marker.getElement()?.classList.add('highlighted');
        }
    }
}

// Clear highlight from a specific marker
function clearMarkerHighlight(micId) {
    const markers = window.MicFinderState.getMarkers();
    const marker = markers[micId];
    if (marker) {
        const mic = window.MicFinderState.getAllMics().find(m => m.id === micId);
        if (mic && marker.options.venueData) {
            // Use normal venue marker for all zoom levels
            marker.setIcon(createVenueMarkerIcon(mic, marker.options.venueData.length));
            marker.getElement()?.classList.remove('highlighted');
        }
    }
}

// Clear highlights from all markers
function clearAllMarkerHighlights() {
    const markers = window.MicFinderState.getMarkers();
    const allMics = window.MicFinderState.getAllMics();
    const processedMarkers = new Set();
    const currentZoom = map.getZoom();
    
    Object.keys(markers).forEach(micId => {
        const marker = markers[micId];
        if (marker && !processedMarkers.has(marker)) {
            processedMarkers.add(marker);
            const mic = allMics.find(m => m.id === micId);
            if (mic && marker.options.venueData) {
                // Use normal venue marker for all zoom levels
                marker.setIcon(createVenueMarkerIcon(mic, marker.options.venueData.length));
                marker.getElement()?.classList.remove('highlighted');
            }
        }
    });
}

// Scroll to and highlight list item
function scrollToListItem(micId) {
    const listItem = document.querySelector(`[data-mic-id="${micId}"]`);
    if (listItem) {
        // Remove highlight from all other list items
        document.querySelectorAll('.mic-card').forEach(card => {
            card.classList.remove('highlighted');
        });
        
        // Add highlight to this list item
        listItem.classList.add('highlighted');
        
        // Scroll to the list item
        listItem.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        
        // Remove highlight after a delay
        setTimeout(() => {
            listItem.classList.remove('highlighted');
        }, 3000);
    }
}

// Get current marker count based on venue grouping (same logic as updateMapMarkersNow)
function getCurrentMarkerCount(filteredMics) {
    console.log('🔢 [MAP] getCurrentMarkerCount called with filteredMics.length:', filteredMics?.length || 0);
    
    if (!filteredMics || filteredMics.length === 0) {
        console.log('🔢 [MAP] No filtered mics, returning 0');
        return 0;
    }
    
    // Apply same deduplication and venue grouping logic as updateMapMarkersNow
    const deduplicatedMics = window.MicFinderUtils.deduplicateMics(filteredMics);
    console.log('🔢 [MAP] After deduplication:', deduplicatedMics.length, 'mics');
    
    const venueMap = {};
    
    deduplicatedMics.forEach(mic => {
        if (!mic.lat || !mic.lon || !mic.venue || !mic.address) return;
        
        // Use the same venue key format as updateMapMarkersNow
        const normalizedVenue = window.MicFinderUtils.normalizeVenueName(mic.venue);
        let venueKey = `${normalizedVenue}__${mic.address}__${mic.lat}__${mic.lon}`;
        
        // Special handling for KGB Bar and New York Comedy Club East Village
        if (normalizedVenue === 'KGB Bar' || normalizedVenue === 'New York Comedy Club East Village') {
            venueKey = `${normalizedVenue}__SPECIAL__${mic.address}__${mic.lat}__${mic.lon}`;
        }
        
        if (!venueMap[venueKey]) {
            venueMap[venueKey] = [];
        }
        venueMap[venueKey].push(mic);
    });
    
    const venueCount = Object.keys(venueMap).length;
    console.log('🔢 [MAP] Venue count (marker count):', venueCount);
    
    return venueCount;
}

// Debounced map marker updates to prevent duplicate calls
let updateMapMarkersTimeout;
function updateMapMarkers(filteredMics) {
    if (!markerClusterGroup) {
        // Marker cluster group not initialized, skip updating markers
        return 0;
    }
    
    // Clear any pending update
    if (updateMapMarkersTimeout) {
        clearTimeout(updateMapMarkersTimeout);
    }
    
    // Debounce the update to prevent rapid successive calls
    updateMapMarkersTimeout = setTimeout(() => {
        updateMapMarkersNow(filteredMics);
        updateMapMarkersTimeout = null;
    }, 50); // Increased debounce time to reduce frequency
    
    // Return current marker count immediately (for synchronous use)
    return getCurrentMarkerCount(filteredMics);
}

// The actual update function (renamed to avoid confusion)
function updateMapMarkersNow(filteredMics) {
    if (filteredMics.length > 0) {
        console.log('Updating map markers with', filteredMics.length, 'mics');
    }
    
    // Remove previous venue cluster markers from the map
    if (venueClusterMarkers && venueClusterMarkers.length > 0) {
        venueClusterMarkers.forEach(marker => {
            if (map.hasLayer(marker)) map.removeLayer(marker);
        });
        venueClusterMarkers = [];
    }

    // Deduplicate mics with same venue/address/coordinates AND same start time
    const deduplicatedMics = window.MicFinderUtils.deduplicateMics(filteredMics);
    
    // Group deduplicated mics by venue (name + address + coordinates)
    const venueMap = {};
    deduplicatedMics.forEach(mic => {
        if (mic.lat && mic.lon && mic.venue && mic.address) {
            // Normalize venue name to handle case variations
            const normalizedVenue = window.MicFinderUtils.normalizeVenueName(mic.venue);
            let key = `${normalizedVenue}__${mic.address}__${mic.lat}__${mic.lon}`;
            
            // Special handling for KGB Bar and New York Comedy Club East Village
            // Force them to have separate markers even though they're at the same address
            if (normalizedVenue === 'KGB Bar' || normalizedVenue === 'New York Comedy Club East Village') {
                key = `${normalizedVenue}__SPECIAL__${mic.address}__${mic.lat}__${mic.lon}`;
            }
            
            // Debug logging for Grove 34 specifically
            if (mic.venue && mic.venue.toLowerCase().includes('grove')) {
                console.log('🏢 [MAP] Grove 34 venue grouping - original:', mic.venue, 'normalized:', normalizedVenue, 'key:', key);
            }
            
            if (!venueMap[key]) venueMap[key] = [];
            venueMap[key].push(mic);
        }
    });

    const allMarkers = [];
    const markers = {};
    
    Object.entries(venueMap).forEach(([key, mics]) => {
        const mic = mics[0]; // Use the first mic for marker position and info
        
        console.log('🏗️ Creating marker for venue:', mic.venue, 'with', mics.length, 'mics');
        
        // Debug logging for Grove 34 specifically
        if (mic.venue && mic.venue.toLowerCase().includes('grove')) {
            console.log('🏢 [MAP] Creating Grove 34 marker - venue:', mic.venue, 'mics count:', mics.length);
            console.log('🏢 [MAP] Grove 34 mics:', mics.map(m => `${m.venue} (${m.day} ${m.time})`));
        }
        
        // Calculate position offset for special venue pairs
        let lat = mic.lat;
        let lon = mic.lon;
        const normalizedVenue = window.MicFinderUtils.normalizeVenueName(mic.venue);
        
        // Offset KGB Bar and New York Comedy Club East Village to appear side by side
        if (normalizedVenue === 'KGB Bar') {
            lat = mic.lat - 0.0001; // Offset slightly south
            lon = mic.lon - 0.0001; // Offset slightly west
        } else if (normalizedVenue === 'New York Comedy Club East Village') {
            lat = mic.lat + 0.0001; // Offset slightly north
            lon = mic.lon + 0.0001; // Offset slightly east
        }
        
        // Create a marker with appropriate icon based on zoom level
        const currentZoom = map.getZoom();
        let markerIcon;
        
        // Define zoom level ranges:
        // Low zoom (10-12): Clustering handles display
        // Mid/High zoom (13+): Detailed venue markers with counts
        if (currentZoom >= 13) {
            // All zoom levels 13+: detailed venue markers with counts
            markerIcon = createVenueMarkerIcon(mic, mics.length);
        } else {
            // Low zoom: also use venue markers (clustering will handle grouping)
            markerIcon = createVenueMarkerIcon(mic, mics.length);
        }
        
        const marker = L.marker([lat, lon], {
            icon: markerIcon,
            riseOnHover: true,
            riseOffset: 250,
            micData: mic,
            venueData: mics
        });
        
        // Special handling for KGB Bar and New York Comedy Club East Village
        // Show a choice popup when clicking near this location
        if (normalizedVenue === 'KGB Bar' || normalizedVenue === 'New York Comedy Club East Village') {
            marker.specialVenueChoice = true;
            marker.originalLat = mic.lat;
            marker.originalLon = mic.lon;
        }
        
        // Create popup content showing all mics at this venue
        const popupContent = mics.length === 1 ? 
            createPopupContent(mic) : 
            createMultiMicPopupContent(mics);
            
        const popup = L.popup({
            closeButton: true,
            autoClose: true,
            className: 'mic-popup-container',
            maxWidth: mics.length > 1 ? 400 : 300
        }).setContent(popupContent);
        
        // Show popup on hover with dynamic positioning, but with delay to prevent interference with clicks
        let hoverTimeout = null;
        marker.on('mouseover', (e) => {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
            }
            hoverTimeout = setTimeout(() => {
                // Determine if marker is in top or bottom half of screen
                const markerPoint = map.latLngToContainerPoint(marker.getLatLng());
                const mapHeight = map.getSize().y;
                const isInTopHalf = markerPoint.y < mapHeight / 2;
                // Dynamically calculate offset based on marker icon size
                let iconHeight = 30; // default
                if (marker.options.icon && marker.options.icon.options && marker.options.icon.options.iconSize) {
                    iconHeight = marker.options.icon.options.iconSize[1];
                }
                const offsetY = Math.round(iconHeight / 2);
                if (isInTopHalf) {
                    popup.options.offset = [0, -offsetY]; // Touch above
                } else {
                    popup.options.offset = [0, offsetY]; // Touch below
                }
                marker.bindPopup(popup);
                marker.openPopup();
            }, 300); // Add 300ms delay to prevent popup interference with clicks
        });
        
        // Hide popup on mouseout
        marker.on('mouseout', (e) => {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }
            marker.closePopup();
        });
        
        // Click handler for big modal
        marker.on('click', (e) => {
            // Clear any hover timeout and close popup immediately
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }
            marker.closePopup();
            
            // ADDED DEBUG LOG
            console.log('[DEBUG] Marker clicked:', mic.venue, '| Mics at this marker:', mics.map(m => `${m.day} ${m.time}`).join(', '));
            
            e.originalEvent.stopPropagation();
            clearAllMarkerHighlights();
            document.querySelectorAll('.mic-card').forEach(card => {
                card.classList.remove('highlighted');
            });
            
            // Special handling for KGB Bar and New York Comedy Club East Village
            if (marker.specialVenueChoice) {
                window.MicFinderMap.showVenueChoicePopup(marker.originalLat, marker.originalLon);
                return;
            }
            
            if (mics.length === 1) {
                scrollToListItem(mic.id);
                // Show the mic detail modal just like sidebar click
                if (window.MicFinderUI && window.MicFinderUI.showMicDetails) {
                    window.MicFinderUI.showMicDetails(mic.id);
                }
            } else {
                // For multiple mics, show the first one but could be enhanced
                scrollToListItem(mics[0].id);
                if (window.MicFinderUI && window.MicFinderUI.showMicDetails) {
                    window.MicFinderUI.showMicDetails(mics[0].id);
                }
            }
        });
        
        console.log('✅ Marker created and events bound for:', mic.venue);
        allMarkers.push(marker);
        // Map all mic IDs to this venue marker
        mics.forEach(micObj => { 
            markers[micObj.id] = marker; 
        });
    });

    console.log('🔗 Adding', allMarkers.length, 'markers to cluster group');
    markerClusterGroup.clearLayers();
    
    // Add markers in venue groups to prevent cross-venue clustering
    const venueGroups = {};
    allMarkers.forEach(marker => {
        const mic = marker.options.micData || {};
        const normalizedVenue = window.MicFinderUtils.normalizeVenueName(mic.venue || '');
        const venueKey = `${normalizedVenue}__${mic.address}__${mic.lat}__${mic.lon}`;
        
        if (!venueGroups[venueKey]) {
            venueGroups[venueKey] = [];
        }
        venueGroups[venueKey].push(marker);
    });
    
    // Add each venue group separately to maintain venue separation
    console.log('🏢 [MAP] Adding markers by venue groups:');
    Object.entries(venueGroups).forEach(([venueKey, venueMarkers]) => {
        const venueName = venueMarkers[0].options.micData?.venue || 'Unknown';
        console.log(`🏢 [MAP] Adding ${venueMarkers.length} markers for venue: ${venueName}`);
        markerClusterGroup.addLayers(venueMarkers);
    });
    
    window.MicFinderState.setMarkers(markers);
    markerClusterGroup.refreshClusters();
    if (map) {
        map.invalidateSize();
    }
    console.log('✅ Map updated with', allMarkers.length, 'markers');
}

// Custom spiderfy cleanup
function clearCustomSpiderfy() {
    console.log('🧹 clearCustomSpiderfy called');
    const spiderfyElements = window.MicFinderState.getCurrentSpiderfyElements();
    if (!spiderfyElements) {
        console.log('🧹 No spiderfy elements to clear');
        return;
    }

    console.log('🧹 Clearing spiderfy elements:', spiderfyElements);
    const markersToAddBack = [];

    if (spiderfyElements.mainMarker) {
        spiderfyElements.mainMarker.remove();
        markersToAddBack.push(spiderfyElements.mainMarker);
    }
    if (spiderfyElements.markers) {
        spiderfyElements.markers.forEach(marker => {
            marker.remove();
            markersToAddBack.push(marker);
        });
    }
    
    if (markersToAddBack.length > 0) {
        console.log('🧹 Adding back', markersToAddBack.length, 'markers to cluster');
        // Reset marker positions to original before adding back to cluster
        markersToAddBack.forEach(marker => {
            if (marker._originalLatLng) {
                console.log('🧹 Resetting marker position to original:', marker._originalLatLng);
                marker.setLatLng(marker._originalLatLng);
            }
        });
        markerClusterGroup.addLayers(markersToAddBack);
    }

    if (spiderfyElements.legLines) {
        spiderfyElements.legLines.forEach(line => line.remove());
    }
    
    if (spiderfyElements.parentCluster) {
        const parentElement = spiderfyElements.parentCluster.getElement();
        if (parentElement) {
            console.log('👁️ Restoring parent cluster visibility');
            parentElement.style.opacity = 1;
            parentElement.style.display = '';
        }
    }

    window.MicFinderState.setCurrentSpiderfyElements(null);
}

// Ensure map visibility
function ensureMapVisibility() {
    if (map) {
        requestAnimationFrame(() => {
            map.invalidateSize();
        });
    }
}

// Handle map resize
function handleMapResize() {
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        
        resizeTimeout = setTimeout(() => {
            if (map) {
                requestAnimationFrame(() => {
                    map.invalidateSize();
                    markerClusterGroup.refreshClusters();
                });
            }
            resizeTimeout = null;
        }, 200);
    });
}

// Zoom to fit all mics
function zoomToFitAllMics() {
    const { MAP_CONFIG } = window.MicFinderConfig;
    if (map && MAP_CONFIG) {
        map.setView(MAP_CONFIG.defaultCenter, MAP_CONFIG.defaultZoom);
    }
}

// Geolocate user
function geolocateUser() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            map.setView([lat, lon], 14);
        }, function(error) {
            console.warn('Geolocation error:', error);
            alert('Unable to get your location. Please check your browser settings.');
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        });
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

// Find related mics at the same location and day
function findRelatedMics(mic) {
    const allMics = window.MicFinderState.getAllMics();
    return allMics.filter(m => 
        m.lat === mic.lat && 
        m.lon === mic.lon && 
        m.day === mic.day
    );
}

// Update map view to show mic location (no popup)
function showMicOnMap(mic) {
    if (!mic || !mic.lat || !mic.lon) return;
    
    console.log('📍 showMicOnMap called for:', mic.venue, 'at', mic.lat, mic.lon);
    
    // Pan to the location and zoom in
    map.setView([mic.lat, mic.lon], 18);
    
    // Clear any previously spiderfied elements
    clearCustomSpiderfy();
    
    // Just pan to location - no popup needed since user will interact with the venue marker directly
}

// Add this function near the top or after showMicOnMap
function showVenueClusterModal(mics) {
    const { fixApostropheS } = window.MicFinderUtils;
    if (!mics || mics.length === 0) return;
    const { getFavorites } = window.MicFinderState;
    const favorites = getFavorites();
    const venue = fixApostropheS(mics[0].venue);
    const address = mics[0].address;
    const modal = document.getElementById('mic-detail-modal');
    const modalContent = document.getElementById('mic-detail-modal-content');
    if (!modal || !modalContent) return;

    // Group by info (excluding time)
    function micInfoKey(mic) {
        return JSON.stringify({
            venue: mic.venue,
            address: mic.address,
            day: mic.day,
            cost: mic.cost,
            details: mic.details,
            borough: mic.borough
        });
    }
    const infoGroups = {};
    mics.forEach(mic => {
        const key = micInfoKey(mic);
        if (!infoGroups[key]) infoGroups[key] = [];
        infoGroups[key].push(mic);
    });
    const infoGroupKeys = Object.keys(infoGroups);

    // Show first group by default (earliest by time)
    const sortedInfoGroupKeys = [...infoGroupKeys].sort((a, b) => {
        // Sort by earliest time in each group
        const getEarliestMinutes = (group) => {
            const times = group.map(m => m.time);
            // Parse 'h:mm AM/PM' to minutes
            const toMinutes = (t) => {
                const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                if (!match) return 0;
                let [_, h, m, p] = match;
                h = parseInt(h, 10);
                m = parseInt(m, 10);
                if (p.toUpperCase() === 'PM' && h < 12) h += 12;
                if (p.toUpperCase() === 'AM' && h === 12) h = 0;
                return h * 60 + m;
            };
            return Math.min(...times.map(toMinutes));
        };
        return getEarliestMinutes(infoGroups[a]) - getEarliestMinutes(infoGroups[b]);
    });
    const firstMic = infoGroups[sortedInfoGroupKeys[0]][0];

    // Modal header
    let html = `<div class="modal-header">
        <h2 id="modal-title">${venue}</h2>
        <button class="modal-close-btn" id="modal-close-btn" aria-label="Close mic details">
            <i class="fa-solid fa-times" aria-hidden="true"></i>
        </button>
    </div>`;
    html += `<div class="modal-body">
        <div id="modal-description" class="sr-only">Details for ${venue} at ${address}</div>
        <div class="space-y-6">`;

    if (infoGroupKeys.length === 1) {
        // All info same, show one card with all times as plain text
        const group = infoGroups[infoGroupKeys[0]];
        const mic = group[0];
        html += `<div class="details-section" style="margin-bottom:2rem;">`;
        html += `<div style=\"margin-bottom:1em; font-size:1.1em; color:#fff;\"><b>Time(s):</b> ${group.map(m => m.time).join(', ')}</div>`;
        html += `<div class="details-grid" role="list">
            <div class="detail-item" role="listitem"><i class="fa-regular fa-calendar" aria-hidden="true"></i><span class="detail-label">Day:</span><span class="detail-value">${mic.day}</span></div>
            <div class="detail-item" role="listitem"><i class="fa-solid fa-tag" aria-hidden="true"></i><span class="detail-label">Cost:</span><span class="detail-value">${mic.cost}</span></div>
            <div class="detail-item" role="listitem"><i class="fa-solid fa-location-dot" aria-hidden="true"></i><span class="detail-label">Location:</span><span class="detail-value">${mic.borough ? mic.borough + ', ' : ''}${mic.address}</span></div>
            ${mic.signup ? (() => {
                const signup = mic.signup.trim();
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const isOnlyUrl = /^https?:\/\/[^\s]+$/.test(signup);
                if (isOnlyUrl) {
                    return `<div class=\"detail-item\" role=\"listitem\"><i class=\"fa-solid fa-clipboard-list\" aria-hidden=\"true\"></i><span class=\"detail-label\">Sign Up:</span><span class=\"detail-value\">Link</span></div>`;
                } else {
                    const linkedSignup = signup.replace(urlRegex, url => `<a class='ig-link' href='${url}' target='_blank' rel='noopener noreferrer'>${url}</a>`);
                    return `<div class=\"detail-item\" role=\"listitem\"><i class=\"fa-solid fa-clipboard-list\" aria-hidden=\"true\"></i><span class=\"detail-label\">Sign Up:</span><span class=\"detail-value\">${linkedSignup}</span></div>`;
                }
            })() : ''}
            ${mic.host ? (() => {
                const cleanHandle = mic.host.replace(/[^a-zA-Z0-9_\.]/g, '').replace(/^@/, '');
                return `<div class="detail-item" role="listitem"><i class="fa-brands fa-instagram" aria-hidden="true"></i><span class="detail-label">For Updates:</span><span class="detail-value"><a class='ig-link' href='https://instagram.com/${cleanHandle}' target='_blank' rel='noopener noreferrer'>@${cleanHandle}</a></span></div>`;
            })() : ''}
        </div>`;
        if (mic.details) {
            html += `<div class="details-section"><b>Details:</b> ${mic.details}</div>`;
        }
        html += `<div class="modal-actions" style="margin-top:1rem;">
            <button class="modal-btn secondary favorite-btn" data-mic-id="${mic.id}" aria-label="${favorites.includes(mic.id) ? 'Remove from favorites' : 'Add to favorites'}">
                <i class="${favorites.includes(mic.id) ? 'fa-solid' : 'fa-regular'} fa-star" aria-hidden="true"></i>
            </button>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mic.venue + ', ' + mic.address)}" target="_blank" rel="noopener noreferrer" class="modal-btn primary" aria-label="Get directions to ${mic.venue} (opens in new tab)">
                <i class="fa-solid fa-directions" aria-hidden="true"></i>
                Get Directions
            </a>
        </div>`;
        html += `</div>`;
    } else {
        // Info differs, show pills and a note
        html += `<div style='margin-bottom:0.5em;color:#fbbf24;font-weight:600;'>Multiple events at this location have different details. Select a time to see specific info.</div>`;
        html += `<div class="mic-times-pills" style="display:flex;flex-wrap:wrap;gap:0.5em;margin-bottom:1em;">`;
        sortedInfoGroupKeys.forEach((key, i) => {
            const group = infoGroups[key];
            const times = group.map(m => m.time).join(', ');
            html += `<span class="mic-time-pill" data-info-group="${i}" tabindex="0" style="display:inline-block;padding:0.5em 1.2em;border-radius:1.2em;background:linear-gradient(90deg,#444857 0%,#232533 100%);color:#fff;font-weight:500;margin:0.2em 0.5em 0.2em 0;cursor:pointer;">${times}</span>`;
        });
        html += `</div>`;
        // Show first group by default
        const firstMic = infoGroups[sortedInfoGroupKeys[0]][0];
        html += `<div class="mic-popup-details">`;
        html += `<div class="details-grid" role="list">
            <div class="detail-item" role="listitem"><i class="fa-regular fa-calendar" aria-hidden="true"></i><span class="detail-label">Day:</span><span class="detail-value">${firstMic.day}</span></div>
            <div class="detail-item" role="listitem"><i class="fa-solid fa-tag" aria-hidden="true"></i><span class="detail-label">Cost:</span><span class="detail-value">${firstMic.cost}</span></div>
            <div class="detail-item" role="listitem"><i class="fa-solid fa-location-dot" aria-hidden="true"></i><span class="detail-label">Location:</span><span class="detail-value">${firstMic.borough ? firstMic.borough + ', ' : ''}${firstMic.address}</span></div>
            ${firstMic.signup ? (() => {
                const signup = firstMic.signup.trim();
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const isOnlyUrl = /^https?:\/\/[^\s]+$/.test(signup);
                if (isOnlyUrl) {
                    return `<div class="detail-item" role="listitem"><i class="fa-solid fa-clipboard-list" aria-hidden="true"></i><span class="detail-label">Sign Up:</span><span class="detail-value">Link</span></div>`;
                } else {
                    const linkedSignup = signup.replace(urlRegex, url => `<a class='ig-link' href='${url}' target='_blank' rel='noopener noreferrer'>${url}</a>`);
                    return `<div class="detail-item" role="listitem"><i class="fa-solid fa-clipboard-list" aria-hidden="true"></i><span class="detail-label">Sign Up:</span><span class="detail-value">${linkedSignup}</span></div>`;
                }
            })() : ''}
            ${firstMic.host ? (() => {
                const cleanHandle = firstMic.host.replace(/[^a-zA-Z0-9_\.]/g, '').replace(/^@/, '');
                return `<div class="detail-item" role="listitem"><i class="fa-brands fa-instagram" aria-hidden="true"></i><span class="detail-label">For Updates:</span><span class="detail-value"><a class='ig-link' href='https://instagram.com/${cleanHandle}' target='_blank' rel='noopener noreferrer'>@${cleanHandle}</a></span></div>`;
            })() : ''}
        </div>`;
        html += `</div>`;
    }
    html += `</div></div>`;
    modalContent.innerHTML = html;
    modal.classList.remove('hidden');
    // Add close button handler
    const closeBtn = modalContent.querySelector('#modal-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', window.MicFinderApp.hideMicDetailsModal);
    }
    // Add favorite button handlers
    modalContent.querySelectorAll('.favorite-btn').forEach(favoriteBtn => {
        favoriteBtn.addEventListener('click', () => {
            const micId = favoriteBtn.getAttribute('data-mic-id');
            window.MicFinderFavorites.toggleFavorite(micId);
        });
    });
    // Add click handler for pills if info differs
    if (sortedInfoGroupKeys.length > 1) {
        setTimeout(() => {
            modalContent.querySelectorAll('.mic-time-pill').forEach((pill, i) => {
                pill.addEventListener('click', function() {
                    const groupIdx = this.getAttribute('data-info-group');
                    const group = infoGroups[sortedInfoGroupKeys[groupIdx]];
                    const mic = group[0];
                    const detailsDiv = modalContent.querySelector('.mic-popup-details');
                    if (detailsDiv && mic) {
                        let igHtml = '';
                        if (mic.host) {
                            const cleanHandle = mic.host.replace(/[^a-zA-Z0-9_\.]/g, '').replace(/^@/, '');
                            igHtml = `<div class=\"detail-item\" role=\"listitem\"><i class=\"fa-brands fa-instagram\" aria-hidden=\"true\"></i><span class=\"detail-label\">For Updates:</span><span class=\"detail-value\"><a class='ig-link' href='https://instagram.com/${cleanHandle}' target='_blank' rel='noopener noreferrer'>@${cleanHandle}</a></span></div>`;
                        }
                        let signupHtml = '';
                        if (mic.signup) {
                            const signup = mic.signup.trim();
                            const urlRegex = /(https?:\/\/[^\s]+)/g;
                            const isOnlyUrl = /^https?:\/\/[^\s]+$/.test(signup);
                            if (isOnlyUrl) {
                                signupHtml = `<div class=\"detail-item\" role=\"listitem\"><i class=\"fa-solid fa-clipboard-list\" aria-hidden=\"true\"></i><span class=\"detail-label\">Sign Up:</span><span class=\"detail-value\"><a class='ig-link' href='${signup}' target='_blank' rel='noopener noreferrer'>Link</a></span></div>`;
                            } else {
                                const linkedSignup = signup.replace(urlRegex, url => `<a class='ig-link' href='${url}' target='_blank' rel='noopener noreferrer'>${url}</a>`);
                                signupHtml = `<div class=\"detail-item\" role=\"listitem\"><i class=\"fa-solid fa-clipboard-list\" aria-hidden=\"true\"></i><span class=\"detail-label\">Sign Up:</span><span class=\"detail-value\">${linkedSignup}</span></div>`;
                            }
                        }
                        detailsDiv.innerHTML = `<div class=\"details-grid\" role=\"list\">\n<div class=\"detail-item\" role=\"listitem\"><i class=\"fa-regular fa-calendar\" aria-hidden=\"true\"></i><span class=\"detail-label\">Day:</span><span class=\"detail-value\">${mic.day}</span></div>\n<div class=\"detail-item\" role=\"listitem\"><i class=\"fa-solid fa-tag\" aria-hidden=\"true\"></i><span class=\"detail-label\">Cost:</span><span class=\"detail-value\">${mic.cost}</span></div>\n<div class=\"detail-item\" role=\"listitem\"><i class=\"fa-solid fa-location-dot\" aria-hidden=\"true\"></i><span class=\"detail-label\">Location:</span><span class=\"detail-value\">${mic.borough ? mic.borough + ', ' : ''}${mic.address}</span></div>\n${signupHtml}${igHtml}</div>`;
                    }
                });
            });
        }, 100);
    }
    // Allow closing modal by clicking outside content
    const modalClickHandler = function(e) {
        if (e.target === modal) {
            window.MicFinderApp.hideMicDetailsModal();
        }
    };
    modal.addEventListener('click', modalClickHandler);
    
    // Allow closing modal with Escape key
    const keydownHandler = function(e) {
        if (!modal.classList.contains('hidden') && e.key === 'Escape') {
            window.MicFinderApp.hideMicDetailsModal();
        }
    };
    window.addEventListener('keydown', keydownHandler);
    
    // Store event handlers for cleanup
    modal._clickHandler = modalClickHandler;
    modal._keydownHandler = keydownHandler;
}

// Export map functionality
window.MicFinderMap = {
    initializeMap: initializeMap,
    updateMapMarkers: updateMapMarkers,
    ensureMapVisibility: ensureMapVisibility,
    handleMapResize: handleMapResize,
    zoomToFitAllMics: zoomToFitAllMics,
    geolocateUser: geolocateUser,
    getMap: () => map,
    getMarkerClusterGroup: () => markerClusterGroup,
    showMicOnMap: showMicOnMap,
    highlightMapMarker: highlightMapMarker,
    clearMarkerHighlight: clearMarkerHighlight,
    clearAllMarkerHighlights: clearAllMarkerHighlights,
    scrollToListItem: scrollToListItem,
    spiderfyClusterContaining: (marker) => {
        console.log('🔍 Attempting to find and spiderfy cluster for marker:', marker);
        
        // Get the cluster group
        const mcg = markerClusterGroup;
        
        // Find the parent cluster of our marker
        const cluster = mcg.getVisibleParent(marker);
        console.log('Found visible parent cluster:', cluster);
        
        if (cluster && cluster !== marker) {
            console.log('🎯 Found cluster containing marker, attempting to spiderfy');
            // If we found a cluster (and it's not the marker itself)
            cluster.spiderfy();
            return true;
        }
        
        console.log('❌ No parent cluster found for marker');
        return false;
    },
    
    // Show venue choice popup for KGB Bar and New York Comedy Club East Village
    showVenueChoicePopup: function(lat, lon) {
        const popup = L.popup({
            closeButton: true,
            autoClose: false,
            className: 'venue-choice-popup'
        }).setLatLng([lat, lon]).setContent(`
            <div class="venue-choice-container">
                <h3>Which venue are you looking for?</h3>
                <div class="venue-choice-buttons">
                    <button class="venue-choice-btn" onclick="selectVenue('KGB Bar')">
                        <strong>KGB Bar</strong>
                        <small>Easy paradise mag @kgb</small>
                    </button>
                    <button class="venue-choice-btn" onclick="selectVenue('New York Comedy Club East Village')">
                        <strong>NY Comedy Club East Village</strong>
                        <small>Welcome To Nico York, Secret mic</small>
                    </button>
                </div>
            </div>
        `).openOn(map);
    }
};

// Handle venue selection from popup
function selectVenue(venueName) {
    // Close the popup
    map.closePopup();
    
    // Find all mics for the selected venue
    const allMics = window.MicFinderState.getAllMics();
    const venueMics = allMics.filter(mic => {
        const normalizedVenue = window.MicFinderUtils.normalizeVenueName(mic.venue);
        return normalizedVenue === venueName;
    });
    
    if (venueMics.length > 0) {
        // Show the venue details
        if (venueMics.length === 1) {
            scrollToListItem(venueMics[0].id);
            if (window.MicFinderUI && window.MicFinderUI.showMicDetails) {
                window.MicFinderUI.showMicDetails(venueMics[0].id);
            }
        } else {
            // Show venue cluster modal for multiple mics
            showVenueClusterModal(venueMics);
        }
    }
}

// Make selectVenue available globally for onclick handlers
window.selectVenue = selectVenue; 