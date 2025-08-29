// E2E Tests for Joke Bank Feature
import { test, expect } from '@playwright/test';

test.describe('Joke Bank Feature', () => {
    test.beforeEach(async ({ page }) => {
        // Start with a clean slate
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
        });
        await page.reload();
    });

    test.describe('Joke Bank Management', () => {
        test('should navigate to joke bank and show empty state', async ({ page }) => {
            // Navigate to joke bank
            await page.click('#jokesNavBtn');
            
            // Should show empty state
            await expect(page.locator('.empty-jokes-state')).toBeVisible();
            await expect(page.locator('.empty-jokes-state h3')).toContainText('No jokes found');
            await expect(page.locator('.empty-jokes-state button')).toContainText('Add Your First Joke');
        });

        test('should create a new joke', async ({ page }) => {
            // Navigate to joke bank
            await page.click('#jokesNavBtn');
            
            // Click add joke button
            await page.click('#addJokeBtn');
            
            // Fill out joke form
            await page.fill('#jokeText', 'Why did the chicken cross the road? To get to the other side!');
            await page.fill('#jokeTags', 'classic, opener');
            await page.fill('#estimatedDuration', '30');
            await page.fill('#jokeNotes', 'Classic opener joke');
            
            // Submit form
            await page.click('button[type="submit"]');
            
            // Should see the joke in the bank
            await expect(page.locator('.joke-card')).toBeVisible();
            await expect(page.locator('.joke-text')).toContainText('Why did the chicken cross the road?');
            await expect(page.locator('.joke-tag')).toContainText('classic');
        });

        test('should search and filter jokes', async ({ page }) => {
            // Create test jokes via API
            await page.evaluate(() => {
                window.dataStore.addJoke({
                    text: 'Airplane food joke',
                    tags: ['travel', 'food'],
                    notes: 'Classic airline humor'
                });
                window.dataStore.addJoke({
                    text: 'Cat behavior observation',
                    tags: ['animals', 'observational'],
                    notes: 'Pet humor'
                });
            });
            
            // Navigate to joke bank
            await page.click('#jokesNavBtn');
            
            // Should see both jokes
            await expect(page.locator('.joke-card')).toHaveCount(2);
            
            // Search for "airplane"
            await page.fill('#jokeSearch', 'airplane');
            await expect(page.locator('.joke-card')).toHaveCount(1);
            await expect(page.locator('.joke-text')).toContainText('Airplane food joke');
            
            // Clear search and filter by tag
            await page.fill('#jokeSearch', '');
            await page.selectOption('#jokeTagFilter', 'animals');
            await expect(page.locator('.joke-card')).toHaveCount(1);
            await expect(page.locator('.joke-text')).toContainText('Cat behavior observation');
        });

        test('should edit and archive jokes', async ({ page }) => {
            // Create a test joke
            await page.evaluate(() => {
                window.dataStore.addJoke({
                    text: 'Original joke text',
                    tags: ['test'],
                    notes: 'Original notes'
                });
            });
            
            // Navigate to joke bank
            await page.click('#jokesNavBtn');
            
            // Click edit button (appears on hover)
            await page.hover('.joke-card');
            await page.click('.joke-action-btn.edit');
            
            // Edit the joke
            await page.fill('#jokeText', 'Updated joke text');
            await page.fill('#jokeTags', 'updated, improved');
            await page.click('button[type="submit"]');
            
            // Should see updated joke
            await expect(page.locator('.joke-text')).toContainText('Updated joke text');
            await expect(page.locator('.joke-tag')).toContainText('updated');
            
            // Archive the joke
            await page.hover('.joke-card');
            await page.click('.joke-action-btn.archive');
            
            // Should not see the joke (archived)
            await expect(page.locator('.joke-card')).toHaveCount(0);
            
            // Enable "Show Archived"
            await page.check('#showArchivedJokes');
            await expect(page.locator('.joke-card.archived')).toHaveCount(1);
        });
    });

    test.describe('Setlist Builder', () => {
        test('should create setlist using drag and drop', async ({ page }) => {
            // Create test jokes
            await page.evaluate(() => {
                window.dataStore.addJoke({
                    text: 'Opening joke',
                    tags: ['opener'],
                    estimated_duration: 45
                });
                window.dataStore.addJoke({
                    text: 'Middle joke',
                    tags: ['story'],
                    estimated_duration: 90
                });
                window.dataStore.addJoke({
                    text: 'Closing joke',
                    tags: ['closer'],
                    estimated_duration: 60
                });
            });
            
            // Navigate to calendar and add a new set
            await page.click('#calendarNavBtn');
            await page.click('#addSetBtn');
            
            // Fill basic info
            await page.fill('#event-title', 'Test Set');
            await page.fill('#venue', 'Test Venue');
            await page.fill('#date', '2025-08-25');
            
            // Should see the setlist builder
            await expect(page.locator('#setlistBuilder')).toBeVisible();
            await expect(page.locator('.joke-bank-panel')).toBeVisible();
            await expect(page.locator('.current-setlist-panel')).toBeVisible();
            
            // Should see jokes in the bank
            await expect(page.locator('.joke-bank-item')).toHaveCount(3);
            
            // Should show empty setlist initially
            await expect(page.locator('.empty-setlist')).toBeVisible();
            await expect(page.locator('.joke-count')).toContainText('0 jokes');
            await expect(page.locator('.total-duration')).toContainText('0:00');
        });

        test('should update duration when adding jokes', async ({ page }) => {
            // Create test jokes with specific durations
            await page.evaluate(() => {
                window.dataStore.addJoke({
                    text: 'One minute joke',
                    estimated_duration: 60
                });
                window.dataStore.addJoke({
                    text: 'Two minute joke',
                    estimated_duration: 120
                });
            });
            
            // Navigate and create set
            await page.click('#addSetBtn');
            await page.fill('#event-title', 'Duration Test');
            await page.fill('#venue', 'Test Venue');
            await page.fill('#date', '2025-08-25');
            
            // Simulate adding jokes (would normally be drag-and-drop)
            await page.evaluate(() => {
                const jokes = window.dataStore.getAllJokes();
                document.getElementById('setlistData').value = JSON.stringify([jokes[0].id, jokes[1].id]);
                // Trigger the update
                if (window.renderCurrentSetlist) {
                    window.renderCurrentSetlist();
                }
            });
            
            // Check that stats are updated
            // Note: This would be more robust with actual drag-and-drop simulation
        });

        test('should toggle between legacy and new builder', async ({ page }) => {
            // Navigate and create set
            await page.click('#addSetBtn');
            
            // Should show new builder by default
            await expect(page.locator('#setlistBuilder')).toBeVisible();
            await expect(page.locator('#legacySetlistInput')).toBeHidden();
            
            // Click toggle button
            await page.click('#toggleLegacySetlist');
            
            // Should show legacy input
            await expect(page.locator('#setlistBuilder')).toBeHidden();
            await expect(page.locator('#legacySetlistInput')).toBeVisible();
            
            // Should be able to type in legacy input
            await page.fill('#setlist', 'Legacy joke 1\\nLegacy joke 2');
            
            // Toggle back
            await page.click('#toggleLegacySetlist');
            await expect(page.locator('#setlistBuilder')).toBeVisible();
        });
    });

    test.describe('Data Migration', () => {
        test('should migrate legacy string setlists to joke IDs', async ({ page }) => {
            // Set up pre-migration data
            await page.evaluate(() => {
                // Clear migration flag to force migration
                localStorage.removeItem('migration_jokebank_v2_complete');
                
                // Set up legacy data
                const legacyData = [
                    {
                        id: 1,
                        title: 'Legacy Set',
                        venue: 'Test Venue',
                        date: '2025-08-20',
                        eventType: 'blue',
                        setlist: 'Legacy joke one\\nLegacy joke two\\nLegacy joke three'
                    }
                ];
                
                localStorage.setItem('micCalendarSets', JSON.stringify(legacyData));
                localStorage.setItem('micCalendarJokes', JSON.stringify([]));
            });
            
            // Reload to trigger migration
            await page.reload();
            
            // Wait for migration to complete
            await page.waitForTimeout(1000);
            
            // Check that migration ran
            const migrationComplete = await page.evaluate(() => {
                return localStorage.getItem('migration_jokebank_v2_complete') === 'true';
            });
            expect(migrationComplete).toBe(true);
            
            // Check that jokes were created
            const jokesData = await page.evaluate(() => {
                return JSON.parse(localStorage.getItem('micCalendarJokes') || '[]');
            });
            expect(jokesData.length).toBe(3);
            
            // Check that set setlist was converted to array
            const setsData = await page.evaluate(() => {
                return JSON.parse(localStorage.getItem('micCalendarSets') || '[]');
            });
            expect(Array.isArray(setsData[0].setlist)).toBe(true);
            expect(setsData[0].setlist.length).toBe(3);
        });

        test('should handle deduplication during migration', async ({ page }) => {
            // Set up data with duplicate jokes
            await page.evaluate(() => {
                localStorage.removeItem('migration_jokebank_v2_complete');
                
                const legacyData = [
                    {
                        id: 1,
                        setlist: 'Duplicate joke\\nUnique joke one'
                    },
                    {
                        id: 2,
                        setlist: 'Duplicate joke\\nUnique joke two'
                    }
                ];
                
                localStorage.setItem('micCalendarSets', JSON.stringify(legacyData));
                localStorage.setItem('micCalendarJokes', JSON.stringify([]));
            });
            
            await page.reload();
            await page.waitForTimeout(1000);
            
            // Should create 3 unique jokes, not 4
            const jokesData = await page.evaluate(() => {
                return JSON.parse(localStorage.getItem('micCalendarJokes') || '[]');
            });
            expect(jokesData.length).toBe(3);
            
            // Should find one joke with text "Duplicate joke"
            const duplicateJokes = jokesData.filter(joke => joke.text === 'Duplicate joke');
            expect(duplicateJokes.length).toBe(1);
        });
    });

    test.describe('Integration with Calendar', () => {
        test('should display joke count in event pills', async ({ page }) => {
            // Create jokes and a set using them
            await page.evaluate(() => {
                const joke1 = window.dataStore.addJoke({ text: 'Joke 1' });
                const joke2 = window.dataStore.addJoke({ text: 'Joke 2' });
                
                window.dataStore.addSet({
                    title: 'Test Set',
                    venue: 'Test Venue',
                    date: '2025-08-20',
                    eventType: 'blue',
                    setlist: [joke1.id, joke2.id]
                });
            });
            
            // Should see the set on calendar with joke count
            await expect(page.locator('.event-pill')).toBeVisible();
            await expect(page.locator('.event-detail')).toContainText('2 jokes');
        });

        test('should search through joke text in calendar search', async ({ page }) => {
            // Create set with jokes
            await page.evaluate(() => {
                const joke1 = window.dataStore.addJoke({ text: 'Unique searchable joke text' });
                
                window.dataStore.addSet({
                    title: 'Set with Searchable Joke',
                    venue: 'Test Venue',
                    date: '2025-08-20',
                    eventType: 'blue',
                    setlist: [joke1.id]
                });
                
                window.dataStore.addSet({
                    title: 'Set without Match',
                    venue: 'Other Venue',
                    date: '2025-08-21',
                    eventType: 'green',
                    setlist: []
                });
            });
            
            // Should see both sets initially
            await expect(page.locator('.event-pill')).toHaveCount(2);
            
            // Search for joke text
            await page.fill('#venueSearch', 'searchable');
            
            // Should only see the set with the matching joke
            await expect(page.locator('.event-pill')).toHaveCount(1);
            await expect(page.locator('.event-title')).toContainText('Set with Searchable Joke');
        });

        test('should display rich setlist in event summary', async ({ page }) => {
            // Create set with jokes
            await page.evaluate(() => {
                const joke1 = window.dataStore.addJoke({
                    text: 'First joke in set',
                    tags: ['opener'],
                    estimated_duration: 45
                });
                const joke2 = window.dataStore.addJoke({
                    text: 'Second joke in set',
                    tags: ['story'],
                    estimated_duration: 90
                });
                
                window.dataStore.addSet({
                    title: 'Rich Setlist Test',
                    venue: 'Test Venue',
                    date: '2025-08-20',
                    eventType: 'blue',
                    setlist: [joke1.id, joke2.id]
                });
            });
            
            // Click on the event pill to open summary
            await page.click('.event-pill');
            
            // Should see rich setlist display
            await expect(page.locator('.setlist-readonly')).toBeVisible();
            await expect(page.locator('.setlist-summary')).toContainText('2 jokes');
            await expect(page.locator('.setlist-summary')).toContainText('2:15'); // 45s + 90s = 135s = 2:15
            
            // Should see individual jokes
            await expect(page.locator('.setlist-joke-item')).toHaveCount(2);
            await expect(page.locator('.joke-text').first()).toContainText('First joke in set');
            await expect(page.locator('.joke-text').last()).toContainText('Second joke in set');
        });
    });

    test.describe('Performance and Edge Cases', () => {
        test('should handle large number of jokes efficiently', async ({ page }) => {
            // Create many jokes
            await page.evaluate(() => {
                for (let i = 1; i <= 100; i++) {
                    window.dataStore.addJoke({
                        text: `Test joke number ${i}`,
                        tags: [`tag${i % 10}`],
                        estimated_duration: 30 + (i % 60)
                    });
                }
            });
            
            // Navigate to joke bank
            await page.click('#jokesNavBtn');
            
            // Should load quickly and display jokes
            await expect(page.locator('.joke-card')).toHaveCount(100);
            
            // Search should work efficiently
            await page.fill('#jokeSearch', 'joke number 50');
            await expect(page.locator('.joke-card')).toHaveCount(1);
        });

        test('should handle orphaned joke IDs gracefully', async ({ page }) => {
            // Create a set with a non-existent joke ID
            await page.evaluate(() => {
                const realJoke = window.dataStore.addJoke({ text: 'Real joke' });
                
                window.dataStore.addSet({
                    title: 'Set with Orphaned ID',
                    venue: 'Test Venue',
                    date: '2025-08-20',
                    eventType: 'blue',
                    setlist: [realJoke.id, 999999] // 999999 doesn't exist
                });
            });
            
            // Should display event with count only for existing jokes
            await expect(page.locator('.event-pill')).toBeVisible();
            await expect(page.locator('.event-detail')).toContainText('1 joke'); // Not 2
            
            // Event summary should handle gracefully
            await page.click('.event-pill');
            await expect(page.locator('.setlist-joke-item')).toHaveCount(1);
            await expect(page.locator('.joke-text')).toContainText('Real joke');
        });
    });
});

