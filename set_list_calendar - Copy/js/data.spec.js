// Vitest Unit Tests for Data Store
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dataStore } from './data.js';

describe('DataStore', () => {
    beforeEach(() => {
        // Reset localStorage mock
        localStorage.clear();
        
        // Reset dataStore to clean state
        dataStore.sets = [];
        dataStore.savedSetlists = [];
        dataStore.userSettings = {};
    });

    describe('Basic CRUD Operations', () => {
        it('should add a new set', () => {
            const newSet = {
                id: 1,
                title: 'Test Event',
                venue: 'Test Venue',
                date: '2025-06-15',
                eventType: 'blue',
                setlist: 'Test joke',
                notes: 'Test notes',
                tags: ['test'],
                goal: 'Test goal'
            };

            dataStore.addSet(newSet);
            
            expect(dataStore.sets).toHaveLength(1);
            expect(dataStore.sets[0]).toEqual(newSet);
        });

        it('should update an existing set', () => {
            const originalSet = {
                id: 1,
                title: 'Original Event',
                venue: 'Original Venue',
                date: '2025-06-15',
                eventType: 'blue',
                setlist: 'Original joke',
                notes: 'Original notes',
                tags: ['original'],
                goal: 'Original goal'
            };

            dataStore.addSet(originalSet);

            const updatedData = {
                title: 'Updated Event',
                venue: 'Updated Venue',
                tags: ['updated'],
                goal: 'Updated goal'
            };

            const updatedSet = dataStore.updateSet(1, updatedData);

            expect(updatedSet.title).toBe('Updated Event');
            expect(updatedSet.venue).toBe('Updated Venue');
            expect(updatedSet.tags).toEqual(['updated']);
            expect(updatedSet.goal).toBe('Updated goal');
            expect(updatedSet.date).toBe('2025-06-15'); // Should preserve unchanged fields
        });

        it('should delete a set', () => {
            const set1 = { id: 1, title: 'Set 1', venue: 'Venue 1', date: '2025-06-15', eventType: 'blue' };
            const set2 = { id: 2, title: 'Set 2', venue: 'Venue 2', date: '2025-06-16', eventType: 'green' };

            dataStore.addSet(set1);
            dataStore.addSet(set2);

            expect(dataStore.sets).toHaveLength(2);

            dataStore.deleteSet(1);

            expect(dataStore.sets).toHaveLength(1);
            expect(dataStore.sets[0].id).toBe(2);
        });

        it('should get a set by ID', () => {
            const testSet = {
                id: 1,
                title: 'Test Event',
                venue: 'Test Venue',
                date: '2025-06-15',
                eventType: 'blue'
            };

            dataStore.addSet(testSet);

            const retrievedSet = dataStore.getSetById(1);
            expect(retrievedSet).toEqual(testSet);

            const nonExistentSet = dataStore.getSetById(999);
            expect(nonExistentSet).toBeNull();
        });
    });

    describe('Data Persistence', () => {
        it('should save data to localStorage', () => {
            const testSet = {
                id: 1,
                title: 'Test Event',
                venue: 'Test Venue',
                date: '2025-06-15',
                eventType: 'blue'
            };

            dataStore.addSet(testSet);

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'micCalendarSets',
                JSON.stringify([testSet])
            );
        });

        it('should load data from localStorage', () => {
            const testData = [
                { id: 1, title: 'Event 1', venue: 'Venue 1', date: '2025-06-15', eventType: 'blue' },
                { id: 2, title: 'Event 2', venue: 'Venue 2', date: '2025-06-16', eventType: 'green' }
            ];

            localStorage.getItem.mockReturnValue(JSON.stringify(testData));

            dataStore.load();

            expect(dataStore.sets).toEqual(testData);
        });

        it('should use default data when localStorage is empty', () => {
            localStorage.getItem.mockReturnValue(null);

            dataStore.load();

            expect(dataStore.sets).toHaveLength(6); // Default data has 6 sets
            expect(dataStore.sets[0].title).toBe('Open Mic');
        });

        it('should handle corrupted localStorage data gracefully', () => {
            localStorage.getItem.mockReturnValue('invalid json');

            expect(() => dataStore.load()).not.toThrow();
            expect(dataStore.sets).toHaveLength(6); // Should fall back to default data
        });
    });

    describe('Statistics and Analytics', () => {
        beforeEach(() => {
            // Add test data for statistics
            const testSets = [
                {
                    id: 1,
                    title: 'Event 1',
                    venue: 'Venue A',
                    date: '2025-06-15',
                    eventType: 'blue',
                    setlist: 'Joke 1\nJoke 2\nJoke 3',
                    tags: ['new-material', 'practice']
                },
                {
                    id: 2,
                    title: 'Event 2',
                    venue: 'Venue B',
                    date: '2025-06-16',
                    eventType: 'green',
                    setlist: 'Joke 1\nJoke 4',
                    tags: ['audition']
                },
                {
                    id: 3,
                    title: 'Event 3',
                    venue: 'Venue A',
                    date: '2025-06-17',
                    eventType: 'blue',
                    setlist: 'Joke 5\nJoke 6\nJoke 7\nJoke 8',
                    tags: ['new-material']
                }
            ];

            testSets.forEach(set => dataStore.addSet(set));
        });

        it('should calculate performance statistics', () => {
            const stats = dataStore.getPerformanceStats();

            expect(stats.totalSets).toBe(3);
            expect(stats.uniqueVenues).toBe(2);
            expect(stats.totalJokes).toBe(9); // 3 + 2 + 4 jokes
            expect(stats.averageJokesPerSet).toBe(3); // 9 / 3 = 3
        });

        it('should get top venues', () => {
            const topVenues = dataStore.getTopVenues();

            expect(topVenues).toHaveLength(2);
            expect(topVenues[0]).toEqual(['Venue A', 2]); // 2 sets at Venue A
            expect(topVenues[1]).toEqual(['Venue B', 1]); // 1 set at Venue B
        });

        it('should get joke frequency', () => {
            const jokeFreq = dataStore.getJokeFrequency();

            expect(jokeFreq).toContainEqual(['joke 1', 2]); // Appears in 2 sets
            expect(jokeFreq).toContainEqual(['joke 2', 1]); // Appears in 1 set
            expect(jokeFreq).toContainEqual(['joke 3', 1]);
            expect(jokeFreq).toContainEqual(['joke 4', 1]);
        });

        it('should get performance count by type', () => {
            const performanceByType = dataStore.getPerformanceCountByType();

            expect(performanceByType).toContainEqual(['blue', 2]);
            expect(performanceByType).toContainEqual(['green', 1]);
        });
    });

    describe('Tags and Goals Management', () => {
        beforeEach(() => {
            const testSets = [
                {
                    id: 1,
                    title: 'Event 1',
                    venue: 'Venue A',
                    date: '2025-06-15',
                    eventType: 'blue',
                    tags: ['new-material', 'practice'],
                    goal: 'Test new opener'
                },
                {
                    id: 2,
                    title: 'Event 2',
                    venue: 'Venue B',
                    date: '2025-06-16',
                    eventType: 'green',
                    tags: ['audition', 'practice'],
                    goal: 'Get weekend spot'
                },
                {
                    id: 3,
                    title: 'Event 3',
                    venue: 'Venue C',
                    date: '2025-06-17',
                    eventType: 'orange',
                    tags: ['corporate'],
                    goal: ''
                }
            ];

            testSets.forEach(set => dataStore.addSet(set));
        });

        it('should get all unique tags', () => {
            const tags = dataStore.getAllTags();

            expect(tags).toEqual(['audition', 'corporate', 'new-material', 'practice']);
        });

        it('should get tag statistics', () => {
            const tagStats = dataStore.getTagStats();

            expect(tagStats).toContainEqual({ tag: 'practice', count: 2 });
            expect(tagStats).toContainEqual({ tag: 'new-material', count: 1 });
            expect(tagStats).toContainEqual({ tag: 'audition', count: 1 });
            expect(tagStats).toContainEqual({ tag: 'corporate', count: 1 });
        });

        it('should get sets by tag', () => {
            const practiceSets = dataStore.getSetsByTag('practice');

            expect(practiceSets).toHaveLength(2);
            expect(practiceSets[0].id).toBe(1);
            expect(practiceSets[1].id).toBe(2);
        });

        it('should get sets with goals', () => {
            const setsWithGoals = dataStore.getSetsWithGoals();

            expect(setsWithGoals).toHaveLength(2);
            expect(setsWithGoals[0].goal).toBe('Test new opener');
            expect(setsWithGoals[1].goal).toBe('Get weekend spot');
        });

        it('should ensure backward compatibility with sets without tags/goals', () => {
            const oldSet = {
                id: 999,
                title: 'Old Event',
                venue: 'Old Venue',
                date: '2025-06-20',
                eventType: 'blue'
                // No tags or goal properties
            };

            const formattedSet = dataStore.ensureSetFormat(oldSet);

            expect(formattedSet.tags).toEqual([]);
            expect(formattedSet.goal).toBe('');
            expect(formattedSet.title).toBe('Old Event'); // Original properties preserved
        });
    });

    describe('Trend Analysis', () => {
        beforeEach(() => {
            const testSets = [
                {
                    id: 1,
                    title: 'Event 1',
                    venue: 'Venue A',
                    date: '2025-01-15',
                    eventType: 'blue',
                    setlist: 'Joke 1\nJoke 2'
                },
                {
                    id: 2,
                    title: 'Event 2',
                    venue: 'Venue B',
                    date: '2025-01-20',
                    eventType: 'green',
                    setlist: 'Joke 3\nJoke 4\nJoke 5'
                },
                {
                    id: 3,
                    title: 'Event 3',
                    venue: 'Venue A',
                    date: '2025-02-10',
                    eventType: 'blue',
                    setlist: 'Joke 1\nJoke 6'
                }
            ];

            testSets.forEach(set => dataStore.addSet(set));
        });

        it('should get performance over time', () => {
            const timelineData = dataStore.getPerformanceOverTime();

            expect(timelineData).toHaveLength(2); // January and February
            
            const januaryData = timelineData.find(data => data.month === '2025-01');
            expect(januaryData.sets).toBe(2);
            expect(januaryData.jokes).toBe(5); // 2 + 3 jokes
            expect(januaryData.uniqueVenues).toBe(2); // Venue A and B
            expect(januaryData.avgJokesPerSet).toBe(3); // 5 / 2 = 2.5, rounded to 3

            const februaryData = timelineData.find(data => data.month === '2025-02');
            expect(februaryData.sets).toBe(1);
            expect(februaryData.jokes).toBe(2);
            expect(februaryData.uniqueVenues).toBe(1); // Only Venue A
        });

        it('should get joke performance over time', () => {
            const jokePerformance = dataStore.getJokePerformanceOverTime();

            const joke1Data = jokePerformance.find(j => j.joke === 'joke 1');
            expect(joke1Data.totalCount).toBe(2);
            expect(joke1Data.performances).toHaveLength(2);
            expect(joke1Data.lastPerformed).toBe('2025-02-10');
            expect(joke1Data.daysSinceLastUsed).toBeGreaterThan(0);
        });
    });

    describe('Setlist Management', () => {
        it('should add a new setlist', () => {
            const newSetlist = {
                id: 1,
                name: 'Test Setlist',
                jokes: ['Joke 1', 'Joke 2', 'Joke 3']
            };

            dataStore.addSetlist(newSetlist);

            expect(dataStore.savedSetlists).toHaveLength(1);
            expect(dataStore.savedSetlists[0]).toEqual(newSetlist);
        });

        it('should update an existing setlist', () => {
            const originalSetlist = {
                id: 1,
                name: 'Original Setlist',
                jokes: ['Joke 1', 'Joke 2']
            };

            dataStore.addSetlist(originalSetlist);

            const updatedSetlist = dataStore.updateSetlist(1, 'Updated Setlist', 'Joke 1\nJoke 2\nJoke 3');

            expect(updatedSetlist.name).toBe('Updated Setlist');
            expect(updatedSetlist.jokes).toEqual(['Joke 1', 'Joke 2', 'Joke 3']);
        });

        it('should delete a setlist', () => {
            const setlist1 = { id: 1, name: 'Setlist 1', jokes: ['Joke 1'] };
            const setlist2 = { id: 2, name: 'Setlist 2', jokes: ['Joke 2'] };

            dataStore.addSetlist(setlist1);
            dataStore.addSetlist(setlist2);

            expect(dataStore.savedSetlists).toHaveLength(2);

            dataStore.deleteSetlist(1);

            expect(dataStore.savedSetlists).toHaveLength(1);
            expect(dataStore.savedSetlists[0].id).toBe(2);
        });
    });

    describe('Settings Management', () => {
        it('should get and set individual settings', () => {
            dataStore.setSetting('theme', 'light');
            expect(dataStore.getSetting('theme')).toBe('light');

            dataStore.setSetting('notifications', false);
            expect(dataStore.getSetting('notifications')).toBe(false);
        });

        it('should get all settings', () => {
            dataStore.setSetting('theme', 'dark');
            dataStore.setSetting('defaultView', 'month');

            const settings = dataStore.getSettings();

            expect(settings.theme).toBe('dark');
            expect(settings.defaultView).toBe('month');
        });

        it('should update multiple settings at once', () => {
            const newSettings = {
                theme: 'light',
                notifications: true,
                autoSave: false
            };

            dataStore.updateSettings(newSettings);

            expect(dataStore.getSetting('theme')).toBe('light');
            expect(dataStore.getSetting('notifications')).toBe(true);
            expect(dataStore.getSetting('autoSave')).toBe(false);
        });

        it('should save settings to localStorage', () => {
            dataStore.setSetting('theme', 'light');

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'micCalendarSettings',
                expect.stringContaining('"theme":"light"')
            );
        });
    });

    describe('Joke Bank Management', () => {
        describe('Basic Joke CRUD Operations', () => {
            it('should add a new joke', () => {
                const jokeData = {
                    text: 'Why did the chicken cross the road?',
                    tags: ['classic', 'opener'],
                    notes: 'Works well as opener',
                    estimated_duration: 30
                };

                const newJoke = dataStore.addJoke(jokeData);

                expect(newJoke.id).toBeDefined();
                expect(newJoke.text).toBe(jokeData.text);
                expect(newJoke.tags).toEqual(jokeData.tags);
                expect(newJoke.notes).toBe(jokeData.notes);
                expect(newJoke.estimated_duration).toBe(jokeData.estimated_duration);
                expect(newJoke.created_at).toBeDefined();
                expect(newJoke.updated_at).toBeDefined();
                expect(newJoke.archived).toBe(false);
                
                expect(dataStore.jokes).toHaveLength(1);
                expect(dataStore.jokes[0]).toEqual(newJoke);
            });

            it('should add a joke with minimal data', () => {
                const jokeData = { text: 'Simple joke' };
                const newJoke = dataStore.addJoke(jokeData);

                expect(newJoke.text).toBe('Simple joke');
                expect(newJoke.tags).toEqual([]);
                expect(newJoke.notes).toBe('');
                expect(newJoke.estimated_duration).toBe(60);
                expect(newJoke.archived).toBe(false);
            });

            it('should update an existing joke', () => {
                const originalJoke = dataStore.addJoke({
                    text: 'Original joke',
                    tags: ['old'],
                    notes: 'Original notes'
                });

                const updateData = {
                    text: 'Updated joke',
                    tags: ['new', 'improved'],
                    notes: 'Updated notes',
                    estimated_duration: 45
                };

                const updatedJoke = dataStore.updateJoke(originalJoke.id, updateData);

                expect(updatedJoke.text).toBe('Updated joke');
                expect(updatedJoke.tags).toEqual(['new', 'improved']);
                expect(updatedJoke.notes).toBe('Updated notes');
                expect(updatedJoke.estimated_duration).toBe(45);
                expect(updatedJoke.updated_at).not.toBe(originalJoke.updated_at);
                expect(updatedJoke.created_at).toBe(originalJoke.created_at);
            });

            it('should return null when updating non-existent joke', () => {
                const result = dataStore.updateJoke(999, { text: 'Updated' });
                expect(result).toBeNull();
            });

            it('should archive and unarchive a joke', () => {
                const joke = dataStore.addJoke({ text: 'Test joke' });

                const archivedJoke = dataStore.archiveJoke(joke.id, true);
                expect(archivedJoke.archived).toBe(true);
                expect(archivedJoke.updated_at).not.toBe(joke.updated_at);

                const unarchivedJoke = dataStore.archiveJoke(joke.id, false);
                expect(unarchivedJoke.archived).toBe(false);
            });

            it('should delete a joke permanently', () => {
                const joke1 = dataStore.addJoke({ text: 'Joke 1' });
                const joke2 = dataStore.addJoke({ text: 'Joke 2' });

                expect(dataStore.jokes).toHaveLength(2);

                const result = dataStore.deleteJoke(joke1.id);
                expect(result).toBe(true);
                expect(dataStore.jokes).toHaveLength(1);
                expect(dataStore.jokes[0].id).toBe(joke2.id);
            });

            it('should get a joke by ID', () => {
                const joke = dataStore.addJoke({ text: 'Test joke' });
                
                const retrievedJoke = dataStore.getJokeById(joke.id);
                expect(retrievedJoke).toEqual(joke);

                const nonExistentJoke = dataStore.getJokeById(999);
                expect(nonExistentJoke).toBeNull();
            });
        });

        describe('Joke Filtering and Search', () => {
            beforeEach(() => {
                // Add test jokes
                dataStore.addJoke({
                    text: 'Airplane food joke',
                    tags: ['travel', 'food'],
                    notes: 'Classic opener'
                });
                dataStore.addJoke({
                    text: 'Cat behavior observation',
                    tags: ['animals', 'observational'],
                    notes: 'Great for pet lovers'
                });
                dataStore.addJoke({
                    text: 'Corporate meeting humor',
                    tags: ['corporate', 'work'],
                    notes: 'Clean for business events',
                    archived: true
                });
            });

            it('should get all non-archived jokes by default', () => {
                const jokes = dataStore.getAllJokes();
                expect(jokes).toHaveLength(2);
                expect(jokes.every(joke => !joke.archived)).toBe(true);
            });

            it('should get all jokes including archived when requested', () => {
                const jokes = dataStore.getAllJokes(true);
                expect(jokes).toHaveLength(3);
                expect(jokes.some(joke => joke.archived)).toBe(true);
            });

            it('should filter jokes by tags', () => {
                const travelJokes = dataStore.getJokesByTags(['travel']);
                expect(travelJokes).toHaveLength(1);
                expect(travelJokes[0].text).toBe('Airplane food joke');

                const multiTagSearch = dataStore.getJokesByTags(['animals', 'corporate']);
                expect(multiTagSearch).toHaveLength(1); // Only non-archived animal joke
                expect(multiTagSearch[0].text).toBe('Cat behavior observation');
            });

            it('should search jokes by text content', () => {
                let results = dataStore.searchJokes('airplane');
                expect(results).toHaveLength(1);
                expect(results[0].text).toBe('Airplane food joke');

                results = dataStore.searchJokes('food');
                expect(results).toHaveLength(1);

                results = dataStore.searchJokes('cat');
                expect(results).toHaveLength(1);
                expect(results[0].text).toBe('Cat behavior observation');
            });

            it('should search jokes in notes', () => {
                const results = dataStore.searchJokes('opener');
                expect(results).toHaveLength(1);
                expect(results[0].text).toBe('Airplane food joke');
            });

            it('should search jokes in tags', () => {
                const results = dataStore.searchJokes('observational');
                expect(results).toHaveLength(1);
                expect(results[0].text).toBe('Cat behavior observation');
            });

            it('should return all jokes for empty search term', () => {
                const results = dataStore.searchJokes('');
                expect(results).toHaveLength(2); // Non-archived only
            });

            it('should include archived jokes in search when requested', () => {
                const results = dataStore.searchJokes('corporate', true);
                expect(results).toHaveLength(1);
                expect(results[0].archived).toBe(true);
            });
        });

        describe('Joke Performance Tracking', () => {
            beforeEach(() => {
                // Add test jokes
                const joke1 = dataStore.addJoke({ text: 'Popular joke' });
                const joke2 = dataStore.addJoke({ text: 'Rare joke' });
                
                // Add test sets with joke IDs
                dataStore.addSet({
                    title: 'Set 1',
                    venue: 'Venue A',
                    date: '2025-01-15',
                    eventType: 'blue',
                    setlist: [joke1.id, joke2.id]
                });
                
                dataStore.addSet({
                    title: 'Set 2',
                    venue: 'Venue B',
                    date: '2025-02-15',
                    eventType: 'green',
                    setlist: [joke1.id] // Only popular joke
                });
            });

            it('should get performance data for a joke', () => {
                const joke = dataStore.jokes.find(j => j.text === 'Popular joke');
                const performances = dataStore.getJokePerformanceData(joke.id);
                
                expect(performances).toHaveLength(2);
                expect(performances[0].date).toBe('2025-01-15');
                expect(performances[0].venue).toBe('Venue A');
                expect(performances[1].date).toBe('2025-02-15');
                expect(performances[1].venue).toBe('Venue B');
            });

            it('should get last performed date for a joke', () => {
                const joke = dataStore.jokes.find(j => j.text === 'Popular joke');
                const lastPerformed = dataStore.getJokeLastPerformed(joke.id);
                
                expect(lastPerformed).toBe('2025-02-15');
            });

            it('should return null for joke never performed', () => {
                const newJoke = dataStore.addJoke({ text: 'Never performed' });
                const lastPerformed = dataStore.getJokeLastPerformed(newJoke.id);
                
                expect(lastPerformed).toBeNull();
            });
        });
    });

    describe('Data Migration V2', () => {
        beforeEach(() => {
            // Clear migration flag
            localStorage.removeItem('migration_jokebank_v2_complete');
        });

        it('should migrate string setlists to joke IDs', () => {
            // Set up pre-migration data
            dataStore.sets = [
                {
                    id: 1,
                    title: 'Test Set',
                    venue: 'Test Venue',
                    date: '2025-01-15',
                    eventType: 'blue',
                    setlist: 'Joke one\nJoke two\nJoke three'
                }
            ];

            dataStore.savedSetlists = [
                {
                    id: 1,
                    name: 'Test Setlist',
                    jokes: ['Joke one', 'Joke two', 'Joke four']
                }
            ];

            // Run migration
            dataStore.runMigrationV2();

            // Check that jokes were created
            expect(dataStore.jokes).toHaveLength(4); // 4 unique jokes
            
            // Check that set setlist was converted to IDs
            expect(Array.isArray(dataStore.sets[0].setlist)).toBe(true);
            expect(dataStore.sets[0].setlist).toHaveLength(3);
            
            // Check that saved setlist was converted to IDs
            expect(dataStore.savedSetlists[0].jokes).toHaveLength(3);
            expect(typeof dataStore.savedSetlists[0].jokes[0]).toBe('number');

            // Check migration flag was set
            expect(localStorage.getItem('migration_jokebank_v2_complete')).toBe('true');
        });

        it('should deduplicate jokes during migration', () => {
            dataStore.sets = [
                {
                    id: 1,
                    setlist: 'Duplicate joke\nUnique joke'
                },
                {
                    id: 2,
                    setlist: 'Duplicate joke\nAnother unique joke'
                }
            ];

            dataStore.runMigrationV2();

            // Should create 3 unique jokes, not 4
            expect(dataStore.jokes).toHaveLength(3);
            
            const duplicateJokes = dataStore.jokes.filter(j => j.text === 'Duplicate joke');
            expect(duplicateJokes).toHaveLength(1);
        });

        it('should skip migration if already completed', () => {
            localStorage.setItem('migration_jokebank_v2_complete', 'true');
            
            dataStore.sets = [{ id: 1, setlist: 'Should not migrate' }];
            
            dataStore.runMigrationV2();
            
            expect(dataStore.jokes).toHaveLength(0);
        });

        it('should handle empty setlists gracefully', () => {
            dataStore.sets = [
                { id: 1, setlist: '' },
                { id: 2, setlist: '\n\n' },
                { id: 3, setlist: 'Valid joke' }
            ];

            dataStore.runMigrationV2();

            expect(dataStore.jokes).toHaveLength(1);
            expect(dataStore.jokes[0].text).toBe('Valid joke');
        });

        it('should handle sets that already have array setlists', () => {
            dataStore.sets = [
                { id: 1, setlist: [1, 2, 3] }, // Already migrated
                { id: 2, setlist: 'New joke' }   // Needs migration
            ];

            dataStore.runMigrationV2();

            expect(dataStore.jokes).toHaveLength(1);
            expect(dataStore.jokes[0].text).toBe('New joke');
            expect(dataStore.sets[0].setlist).toEqual([1, 2, 3]); // Unchanged
        });
    });

    describe('Updated Analytics with V2 Data Model', () => {
        beforeEach(() => {
            // Add jokes
            const joke1 = dataStore.addJoke({ text: 'Frequent joke' });
            const joke2 = dataStore.addJoke({ text: 'Rare joke' });
            const joke3 = dataStore.addJoke({ text: 'Medium joke' });

            // Add sets with new format
            dataStore.addSet({
                title: 'Set 1',
                venue: 'Venue A',
                date: '2025-01-15',
                eventType: 'blue',
                setlist: [joke1.id, joke2.id]
            });

            dataStore.addSet({
                title: 'Set 2',
                venue: 'Venue A',
                date: '2025-01-20',
                eventType: 'green',
                setlist: [joke1.id, joke3.id]
            });

            // Add a set with old string format (pre-migration)
            dataStore.sets.push({
                id: 999,
                title: 'Old Set',
                venue: 'Venue B',
                date: '2024-12-15',
                eventType: 'red',
                setlist: 'Old string joke\nAnother old joke'
            });
        });

        it('should calculate joke frequency with mixed formats', () => {
            const frequency = dataStore.getJokeFrequency();
            
            expect(frequency).toContainEqual(['Frequent joke', 2]);
            expect(frequency).toContainEqual(['Rare joke', 1]);
            expect(frequency).toContainEqual(['Medium joke', 1]);
            expect(frequency).toContainEqual(['Old string joke', 1]);
            expect(frequency).toContainEqual(['Another old joke', 1]);
        });

        it('should calculate performance stats with mixed formats', () => {
            const stats = dataStore.getPerformanceStats();
            
            expect(stats.totalSets).toBe(3);
            expect(stats.totalJokes).toBe(6); // 2 + 2 + 2 jokes across all sets
            expect(stats.averageJokesPerSet).toBe(2);
        });

        it('should track performance over time with mixed formats', () => {
            const timeline = dataStore.getPerformanceOverTime();
            
            const dec2024 = timeline.find(t => t.month === '2024-12');
            expect(dec2024.jokes).toBe(2); // Old string format set

            const jan2025 = timeline.find(t => t.month === '2025-01');
            expect(jan2025.jokes).toBe(4); // 2 sets with 2 jokes each
        });
    });
});
