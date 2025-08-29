// Data Store Module - Handles all data operations
export const dataStore = {
    sets: [], // The main data array
    savedSetlists: [], // Saved setlist templates
    jokes: [], // Joke Bank - centralized repository for comedy material
    userSettings: {}, // User preferences and settings

    // Method to load data from localStorage or use defaults
    load() {
        const savedData = localStorage.getItem('micCalendarSets');
        if (savedData) {
            this.sets = JSON.parse(savedData);
        } else {
            // Default data if nothing is saved
            this.sets = [
                { id: 1, date: '2025-08-19', title: 'Open Mic', venue: 'The Laugh Factory', eventType: 'green', setlist: 'Airplane food joke', notes: 'Good crowd.', tags: ['new-material', 'practice'], goal: 'Test new opener', imageUrl: 'https://picsum.photos/400/300?random=1' },
                { id: 2, date: '2025-08-20', title: 'Showcase', venue: 'The Comedy Store', eventType: 'blue', setlist: 'Cat joke\nDog joke', notes: '', tags: ['audition'], goal: 'Get weekend spot', imageUrl: 'https://picsum.photos/400/300?random=2' },
                { id: 3, date: '2025-08-21', title: 'Corporate Gig', venue: 'Microsoft HQ', eventType: 'orange', setlist: 'Clean material only', notes: 'Paid well.', tags: ['corporate', 'clean'], goal: 'Network for more gigs', imageUrl: '' },
                { id: 4, date: '2025-08-22', title: 'Late Show', venue: 'The Comedy Cellar', eventType: 'red', setlist: 'New 5 minutes', notes: 'Felt a bit rusty.', tags: ['late-night'], goal: 'Work on timing', imageUrl: '' },
                { id: 5, date: '2025-08-23', title: 'Weekend Special', venue: 'The Comedy Store', eventType: 'blue', setlist: 'Best 10 minutes', notes: 'Killed it.', tags: ['headlining'], goal: 'Perfect closer', imageUrl: 'https://picsum.photos/400/300?random=3' },
                { id: 6, date: '2025-07-04', title: 'July 4th Bash', venue: 'Town Hall', eventType: 'orange', setlist: 'Patriotic humor', notes: 'Fireworks were loud.', tags: ['holiday', 'themed'], goal: 'Connect with audience', imageUrl: '' },
            ];
        }
        
        // Load saved setlists
        const savedSetlists = localStorage.getItem('micCalendarSetlists');
        if (savedSetlists) {
            this.savedSetlists = JSON.parse(savedSetlists);
        } else {
            // Default setlists
            this.savedSetlists = [
                { id: 1, name: 'Quick 3-Minute', jokes: ['Airplane food joke', 'Cat joke', 'Coffee shop observation'] },
                { id: 2, name: 'Weekend 5-Minute', jokes: ['Cat joke', 'Dog joke', 'Dating app story', 'Traffic rant', 'Weather bit'] },
                { id: 3, name: 'Clean Corporate', jokes: ['Office humor', 'Meeting jokes', 'Email observations'] }
            ];
        }
        
        // Load jokes
        const savedJokes = localStorage.getItem('micCalendarJokes');
        if (savedJokes) {
            this.jokes = JSON.parse(savedJokes);
        } else {
            // Default jokes (empty for new installations)
            this.jokes = [];
        }
        
        // Load user settings
        const savedSettings = localStorage.getItem('micCalendarSettings');
        if (savedSettings) {
            this.userSettings = JSON.parse(savedSettings);
        } else {
            // Default settings
            this.userSettings = {
                defaultView: 'week',
                theme: 'dark',
                notifications: true,
                autoSave: true,
                showOnboarding: true
            };
        }
    },

    // Method to save the current data to localStorage
    save() {
        localStorage.setItem('micCalendarSets', JSON.stringify(this.sets));
        localStorage.setItem('micCalendarSetlists', JSON.stringify(this.savedSetlists));
        localStorage.setItem('micCalendarJokes', JSON.stringify(this.jokes));
        localStorage.setItem('micCalendarSettings', JSON.stringify(this.userSettings));
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
    },

    // Joke Management Methods
    
    // Method to add a new joke
    addJoke(jokeData) {
        const newJoke = {
            id: Date.now(), // Simple unique ID
            text: jokeData.text || '',
            tags: jokeData.tags || [],
            notes: jokeData.notes || '',
            estimated_duration: jokeData.estimated_duration || 60,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            archived: jokeData.archived || false
        };
        this.jokes.push(newJoke);
        this.save(); // Save after adding
        return newJoke;
    },

    // Method to update an existing joke
    updateJoke(id, updatedData) {
        const index = this.jokes.findIndex(joke => joke.id === id);
        if (index !== -1) {
            this.jokes[index] = { 
                ...this.jokes[index], 
                ...updatedData, 
                updated_at: new Date().toISOString() 
            };
            this.save(); // Save after updating
            return this.jokes[index];
        }
        return null;
    },

    // Method to archive/unarchive a joke
    archiveJoke(id, isArchived = true) {
        const index = this.jokes.findIndex(joke => joke.id === id);
        if (index !== -1) {
            this.jokes[index].archived = isArchived;
            this.jokes[index].updated_at = new Date().toISOString();
            this.save(); // Save after updating
            return this.jokes[index];
        }
        return null;
    },

    // Method to permanently delete a joke
    deleteJoke(id) {
        this.jokes = this.jokes.filter(joke => joke.id !== id);
        this.save(); // Save after deleting
        return true;
    },

    // Method to get a single joke by ID
    getJokeById(id) {
        // Try exact match first
        let joke = this.jokes.find(joke => joke.id === id);
        
        // If no exact match, try various conversion strategies
        if (!joke) {
            // Try loose equality (handles type coercion)
            joke = this.jokes.find(joke => joke.id == id);
        }
        
        if (!joke && typeof id === 'number') {
            // Try string comparison
            joke = this.jokes.find(joke => joke.id.toString() === id.toString());
            
            // Try parseFloat for decimal handling
            if (!joke) {
                joke = this.jokes.find(joke => parseFloat(joke.id) === parseFloat(id));
            }
            
            // Try floor comparison for truncated decimals
            if (!joke) {
                joke = this.jokes.find(joke => Math.floor(joke.id) === Math.floor(id));
            }
        }
        
        if (!joke && typeof id === 'string' && !isNaN(parseFloat(id))) {
            // Try numeric comparison with parseFloat
            joke = this.jokes.find(joke => joke.id === parseFloat(id));
            
            // Try parseInt for integer matching
            if (!joke && !isNaN(parseInt(id))) {
                joke = this.jokes.find(joke => joke.id === parseInt(id));
            }
        }
        
        return joke || null;
    },

    // Method to get all jokes
    getAllJokes(includeArchived = false) {
        if (includeArchived) {
            return this.jokes;
        }
        return this.jokes.filter(joke => !joke.archived);
    },

    // Method to get jokes by tags
    getJokesByTags(tags) {
        if (!Array.isArray(tags) || tags.length === 0) {
            return this.getAllJokes();
        }
        return this.jokes.filter(joke => 
            !joke.archived && 
            tags.some(tag => joke.tags.includes(tag))
        );
    },

    // Method to search jokes by text content
    searchJokes(searchTerm, includeArchived = false) {
        const jokes = includeArchived ? this.jokes : this.getAllJokes();
        if (!searchTerm || searchTerm.trim() === '') {
            return jokes;
        }
        
        const term = searchTerm.toLowerCase();
        return jokes.filter(joke =>
            joke.text.toLowerCase().includes(term) ||
            joke.notes.toLowerCase().includes(term) ||
            joke.tags.some(tag => tag.toLowerCase().includes(term))
        );
    },

    // Method to get joke performance data
    getJokePerformanceData(jokeId) {
        const performances = [];
        
        this.sets.forEach(set => {
            // Handle both old string format and new array format
            let setJokes = [];
            if (typeof set.setlist === 'string') {
                setJokes = set.setlist.split('\n').filter(line => line.trim());
            } else if (Array.isArray(set.setlist)) {
                setJokes = set.setlist;
            }
            
            if (setJokes.includes(jokeId) || setJokes.includes(jokeId.toString())) {
                performances.push({
                    date: set.date,
                    venue: set.venue,
                    title: set.title,
                    eventType: set.eventType
                });
            }
        });
        
        return performances.sort((a, b) => a.date.localeCompare(b.date));
    },

    // Method to get last performed date for a joke
    getJokeLastPerformed(jokeId) {
        const performances = this.getJokePerformanceData(jokeId);
        return performances.length > 0 ? performances[performances.length - 1].date : null;
    },

    // Migration Logic for V2 Joke Bank
    runMigrationV2() {
        // Check if migration has already been completed
        const migrationComplete = localStorage.getItem('migration_jokebank_v2_complete');
        if (migrationComplete === 'true') {
            return; // Migration already completed
        }

        console.log('Starting Joke Bank V2 migration...');
        
        // Create a map to track unique joke strings and their newly assigned IDs
        const jokeTextToIdMap = new Map();
        
        // Helper function to process joke text and get/create joke ID
        const processJokeText = (jokeString) => {
            const trimmedJoke = jokeString.trim();
            if (!trimmedJoke) return null;
            
            // Check if we've already created this joke
            if (jokeTextToIdMap.has(trimmedJoke)) {
                return jokeTextToIdMap.get(trimmedJoke);
            }
            
            // Create a new joke object
            const newJoke = {
                id: Date.now() + Math.random(), // Ensure uniqueness during migration
                text: trimmedJoke,
                tags: [],
                notes: '',
                estimated_duration: 60,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                archived: false
            };
            
            // Add to jokes array
            this.jokes.push(newJoke);
            
            // Store in our mapping
            jokeTextToIdMap.set(trimmedJoke, newJoke.id);
            
            return newJoke.id;
        };

        // Migrate sets
        this.sets.forEach(set => {
            if (typeof set.setlist === 'string' && set.setlist.trim()) {
                const jokeStrings = set.setlist.split('\n').filter(line => line.trim());
                const newSetlistIds = [];
                
                jokeStrings.forEach(jokeString => {
                    const jokeId = processJokeText(jokeString);
                    if (jokeId) {
                        newSetlistIds.push(jokeId);
                    }
                });
                
                // Update the set with the new array of IDs
                set.setlist = newSetlistIds;
            }
        });

        // Migrate saved setlists
        this.savedSetlists.forEach(setlist => {
            if (Array.isArray(setlist.jokes)) {
                // Check if jokes are strings (old format) vs numbers (already migrated)
                const firstJoke = setlist.jokes[0];
                if (typeof firstJoke === 'string') {
                    const newJokeIds = [];
                    
                    setlist.jokes.forEach(jokeString => {
                        const jokeId = processJokeText(jokeString);
                        if (jokeId) {
                            newJokeIds.push(jokeId);
                        }
                    });
                    
                    // Update the setlist with the new array of IDs
                    setlist.jokes = newJokeIds;
                }
            }
        });

        // Save all updated data
        this.save();
        
        // Mark migration as complete
        localStorage.setItem('migration_jokebank_v2_complete', 'true');
        
        console.log(`Migration complete. Created ${this.jokes.length} jokes from existing setlists.`);
    },

    // Enhanced analytics methods for Phase 3
    getJokeFrequency() {
        const jokeMap = new Map();
        this.sets.forEach(set => {
            if (set.setlist) {
                let jokes = [];
                
                // Handle both old string format and new array format
                if (typeof set.setlist === 'string') {
                    jokes = set.setlist.split('\n').filter(line => line.trim());
                } else if (Array.isArray(set.setlist)) {
                    // Get joke objects from IDs and use their text
                    jokes = set.setlist.map(jokeId => {
                        const joke = this.getJokeById(jokeId);
                        return joke ? joke.text : null;
                    }).filter(text => text);
                }
                
                jokes.forEach(jokeText => {
                    const count = jokeMap.get(jokeText) || 0;
                    jokeMap.set(jokeText, count + 1);
                });
            }
        });
        return Array.from(jokeMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Top 10 most used jokes
    },

    getTopVenues() {
        const venueMap = new Map();
        this.sets.forEach(set => {
            const count = venueMap.get(set.venue) || 0;
            venueMap.set(set.venue, count + 1);
        });
        return Array.from(venueMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // Top 5 venues
    },

    getPerformanceCountByType() {
        const typeMap = new Map();
        this.sets.forEach(set => {
            const count = typeMap.get(set.eventType) || 0;
            typeMap.set(set.eventType, count + 1);
        });
        return Array.from(typeMap.entries());
    },

    getPerformanceStats() {
        const totalSets = this.sets.length;
        const venues = [...new Set(this.sets.map(s => s.venue))];
        const totalJokes = this.sets.reduce((total, set) => {
            if (!set.setlist) return total;
            
            // Handle both old string format and new array format
            if (typeof set.setlist === 'string') {
                return total + set.setlist.split('\n').filter(line => line.trim()).length;
            } else if (Array.isArray(set.setlist)) {
                return total + set.setlist.length;
            }
            
            return total;
        }, 0);
        
        return {
            totalSets,
            uniqueVenues: venues.length,
            totalJokes,
            averageJokesPerSet: totalSets > 0 ? Math.round(totalJokes / totalSets) : 0
        };
    },

    // Setlist management methods
    getAllSetlists() {
        return this.savedSetlists;
    },

    getSetlistById(id) {
        return this.savedSetlists.find(setlist => setlist.id === id);
    },

    addSetlist(name, jokes) {
        const newSetlist = {
            id: Date.now(),
            name,
            jokes: Array.isArray(jokes) ? jokes : jokes.split('\n').filter(line => line.trim())
        };
        this.savedSetlists.push(newSetlist);
        this.save();
        return newSetlist;
    },

    updateSetlist(id, name, jokes) {
        const index = this.savedSetlists.findIndex(s => s.id === id);
        if (index !== -1) {
            this.savedSetlists[index] = {
                id,
                name,
                jokes: Array.isArray(jokes) ? jokes : jokes.split('\n').filter(line => line.trim())
            };
            this.save();
            return this.savedSetlists[index];
        }
        return null;
    },

    deleteSetlist(id) {
        this.savedSetlists = this.savedSetlists.filter(setlist => setlist.id !== id);
        this.save();
    },

    // Settings management methods
    getSetting(key) {
        return this.userSettings[key];
    },

    setSetting(key, value) {
        this.userSettings[key] = value;
        this.save();
    },

    getSettings() {
        return { ...this.userSettings };
    },

    updateSettings(newSettings) {
        this.userSettings = { ...this.userSettings, ...newSettings };
        this.save();
    },

    // Tags and Goals management methods
    getAllTags() {
        const tags = new Set();
        this.sets.forEach(set => {
            if (set.tags && Array.isArray(set.tags)) {
                set.tags.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags).sort();
    },

    getTagStats() {
        const tagCounts = {};
        this.sets.forEach(set => {
            if (set.tags && Array.isArray(set.tags)) {
                set.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });
        return Object.entries(tagCounts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count);
    },

    getSetsByTag(tag) {
        return this.sets.filter(set => 
            set.tags && Array.isArray(set.tags) && set.tags.includes(tag)
        );
    },

    getSetsWithGoals() {
        return this.sets.filter(set => set.goal && set.goal.trim() !== '');
    },

    // Ensure backward compatibility with sets that don't have tags/goals/images
    ensureSetFormat(set) {
        return {
            ...set,
            tags: set.tags || [],
            goal: set.goal || '',
            imageUrl: set.imageUrl || ''
        };
    },

    // Trend analysis methods
    getPerformanceOverTime() {
        const monthlyData = {};
        
        this.sets.forEach(set => {
            const date = new Date(set.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    sets: 0,
                    jokes: 0,
                    venues: new Set(),
                    types: {}
                };
            }
            
            monthlyData[monthKey].sets++;
            monthlyData[monthKey].venues.add(set.venue);
            
            if (set.setlist) {
                let jokeCount = 0;
                
                // Handle both old string format and new array format
                if (typeof set.setlist === 'string') {
                    jokeCount = set.setlist.split('\n').filter(line => line.trim()).length;
                } else if (Array.isArray(set.setlist)) {
                    jokeCount = set.setlist.length;
                }
                
                monthlyData[monthKey].jokes += jokeCount;
            }
            
            monthlyData[monthKey].types[set.eventType] = (monthlyData[monthKey].types[set.eventType] || 0) + 1;
        });
        
        // Convert to array and sort by month
        return Object.entries(monthlyData)
            .map(([month, data]) => ({
                month,
                sets: data.sets,
                jokes: data.jokes,
                uniqueVenues: data.venues.size,
                avgJokesPerSet: data.jokes > 0 ? Math.round(data.jokes / data.sets) : 0,
                types: data.types
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
    },

    getJokePerformanceOverTime() {
        const jokeFreq = {};
        const jokeTimeline = {};
        
        this.sets.forEach(set => {
            if (!set.setlist) return;
            
            let jokes = [];
            
            // Handle both old string format and new array format
            if (typeof set.setlist === 'string') {
                jokes = set.setlist.split('\n').filter(line => line.trim());
            } else if (Array.isArray(set.setlist)) {
                // Get joke text from IDs
                jokes = set.setlist.map(jokeId => {
                    const joke = this.getJokeById(jokeId);
                    return joke ? joke.text : null;
                }).filter(text => text);
            }
            
            const date = new Date(set.date);
            
            jokes.forEach(jokeText => {
                const cleanJoke = jokeText.trim().toLowerCase();
                if (!cleanJoke) return;
                
                jokeFreq[cleanJoke] = (jokeFreq[cleanJoke] || 0) + 1;
                
                if (!jokeTimeline[cleanJoke]) {
                    jokeTimeline[cleanJoke] = [];
                }
                
                jokeTimeline[cleanJoke].push({
                    date: set.date,
                    venue: set.venue,
                    title: set.title
                });
            });
        });
        
        // Return top jokes with their performance history
        return Object.entries(jokeFreq)
            .map(([joke, count]) => ({
                joke,
                totalCount: count,
                performances: jokeTimeline[joke].sort((a, b) => a.date.localeCompare(b.date)),
                lastPerformed: jokeTimeline[joke][jokeTimeline[joke].length - 1].date,
                daysSinceLastUsed: Math.floor((Date.now() - new Date(jokeTimeline[joke][jokeTimeline[joke].length - 1].date)) / (1000 * 60 * 60 * 24))
            }))
            .sort((a, b) => b.totalCount - a.totalCount);
    }
};
