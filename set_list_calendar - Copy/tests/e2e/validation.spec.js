// Unhappy Path E2E Tests - Test edge cases and error handling
import { test, expect } from '@playwright/test';

test.describe('Form Validation Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should handle extremely long input values', async ({ page }) => {
        // Click Add Set button
        await page.click('#addSetBtn');
        
        // Test extremely long title (over 100 characters)
        const longTitle = 'A'.repeat(150);
        await page.fill('#event-title', longTitle);
        
        // Test extremely long venue (over 100 characters)
        const longVenue = 'B'.repeat(150);
        await page.fill('#venue', longVenue);
        
        // Test extremely long setlist (over 5000 characters)
        const longSetlist = 'Very long joke that goes on and on and on...'.repeat(200);
        await page.fill('#setlist', longSetlist);
        
        // Test extremely long notes
        const longNotes = 'Very long notes that go on and on...'.repeat(100);
        await page.fill('#notes', longNotes);
        
        // Test extremely long tags
        const longTags = 'verylongtag, '.repeat(50);
        await page.fill('#tags', longTags);
        
        // Test extremely long goal
        const longGoal = 'Very long goal that goes on and on...'.repeat(20);
        await page.fill('#goal', longGoal);
        
        // Fill required fields
        await page.fill('#date', '2025-12-31');
        await page.selectOption('#event-type', 'blue');
        
        // Submit form
        await page.click('button[type="submit"]');
        
        // Should show validation errors for fields that are too long
        await expect(page.locator('.field-error')).toBeVisible();
    });

    test('should handle special characters and emoji input', async ({ page }) => {
        await page.click('#addSetBtn');
        
        // Test special characters in various fields
        await page.fill('#event-title', '🎭 Special "Characters" & <script>alert(1)</script>');
        await page.fill('#venue', 'Café España 🇪🇸 & "Comedy" <Club>');
        await page.fill('#setlist', 'Joke about 💩 and "quotes" & <html> tags\n🚀 Space joke & more "quotes"');
        await page.fill('#notes', 'Notes with 📝 emoji & "special" characters <br/>');
        await page.fill('#tags', '🏷️ emoji-tag, "quoted-tag", <script>tag');
        await page.fill('#goal', 'Goal with 🎯 emoji & "quotes" <test>');
        
        await page.fill('#date', '2025-12-31');
        await page.selectOption('#event-type', 'green');
        
        await page.click('button[type="submit"]');
        
        // Form should submit successfully (XSS protection should be handled)
        await expect(page.locator('#add-edit-modal')).not.toBeVisible();
        
        // Verify data was saved (click on the event to check)
        await page.click('.event-pill');
        await expect(page.locator('#summary-title')).toHaveValue('🎭 Special "Characters" & <script>alert(1)</script>');
    });

    test('should handle invalid date inputs', async ({ page }) => {
        await page.click('#addSetBtn');
        
        await page.fill('#event-title', 'Test Event');
        await page.fill('#venue', 'Test Venue');
        
        // Test invalid date formats
        await page.fill('#date', '2025-13-40'); // Invalid month/day
        await page.selectOption('#event-type', 'blue');
        
        await page.click('button[type="submit"]');
        
        // Should show validation error
        await expect(page.locator('.field-error')).toBeVisible();
    });

    test('should handle whitespace-only input', async ({ page }) => {
        await page.click('#addSetBtn');
        
        // Fill fields with only whitespace
        await page.fill('#event-title', '   ');
        await page.fill('#venue', '\t\n  ');
        await page.fill('#setlist', '   \n\n   ');
        await page.fill('#notes', '     ');
        
        await page.fill('#date', '2025-12-31');
        await page.selectOption('#event-type', 'blue');
        
        await page.click('button[type="submit"]');
        
        // Should show validation errors for required fields
        const errorMessages = page.locator('.field-error');
        await expect(errorMessages).toHaveCount(2); // Title and venue errors
    });

    test('should handle rapid form submissions', async ({ page }) => {
        await page.click('#addSetBtn');
        
        await page.fill('#event-title', 'Rapid Submit Test');
        await page.fill('#venue', 'Test Venue');
        await page.fill('#date', '2025-12-31');
        await page.selectOption('#event-type', 'blue');
        
        // Rapidly click submit multiple times
        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();
        await submitButton.click();
        await submitButton.click();
        
        // Should only create one event (prevent duplicate submissions)
        await page.waitForTimeout(1000);
        const eventPills = page.locator('.event-pill');
        await expect(eventPills).toHaveCount(7); // 6 default + 1 new = 7 total
    });
});

test.describe('Data Corruption and Recovery', () => {
    test('should handle corrupted localStorage data', async ({ page }) => {
        // Inject corrupted data into localStorage
        await page.addInitScript(() => {
            localStorage.setItem('micCalendarSets', 'invalid json data {');
            localStorage.setItem('micCalendarSetlists', '{"malformed": json}');
            localStorage.setItem('micCalendarSettings', 'not json at all');
        });
        
        await page.goto('/');
        
        // App should still load with default data
        await expect(page.locator('.calendar-container')).toBeVisible();
        await expect(page.locator('.event-pill')).toHaveCount(6); // Should have default events
    });

    test('should handle missing required DOM elements', async ({ page }) => {
        await page.goto('/');
        
        // Remove critical DOM elements via JavaScript
        await page.evaluate(() => {
            document.getElementById('calendarGrid')?.remove();
            document.getElementById('add-edit-modal')?.remove();
        });
        
        // App should not crash - navigation should still work
        await page.click('#statsNavBtn');
        await expect(page.locator('.bottom-nav-item.active')).toContainText('Stats');
    });
});

test.describe('Network and Resource Failures', () => {
    test('should handle Chart.js loading failure', async ({ page }) => {
        // Block Chart.js from loading
        await page.route('**/chart.js', route => route.abort());
        
        await page.goto('/');
        await page.click('#statsNavBtn');
        
        // Stats modal should still open without charts
        await expect(page.locator('h3')).toContainText('Performance Statistics');
        
        // Console should show appropriate warning
        const logs = [];
        page.on('console', msg => logs.push(msg.text()));
        await page.waitForTimeout(1000);
        
        expect(logs.some(log => log.includes('Chart.js not available'))).toBeTruthy();
    });

    test('should handle CSV data loading failure', async ({ page }) => {
        // Block CSV file from loading
        await page.route('**/coordinates.csv', route => route.abort());
        
        await page.goto('/');
        await page.click('#addMicBtn');
        
        // Mic modal should still open with error message
        await expect(page.locator('#mic-selection-modal')).toBeVisible();
        await expect(page.locator('#micsList')).toContainText('No mics found');
    });
});

test.describe('Accessibility Edge Cases', () => {
    test('should handle keyboard navigation with missing focus targets', async ({ page }) => {
        await page.goto('/');
        
        // Remove some focusable elements
        await page.evaluate(() => {
            document.querySelector('.add-set-btn')?.remove();
            document.getElementById('addSetBtn')?.remove();
        });
        
        // Tab navigation should still work for remaining elements
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Enter');
        
        // Should not crash the application
        await expect(page.locator('.calendar-container')).toBeVisible();
    });

    test('should handle screen reader announcements with empty data', async ({ page }) => {
        // Clear all data
        await page.addInitScript(() => {
            localStorage.setItem('micCalendarSets', '[]');
        });
        
        await page.goto('/');
        
        // Verify aria-labels are present even with no data
        await expect(page.locator('[aria-label]')).toHaveCount(13); // Minimum expected aria-labels
        
        // Check that empty states have proper accessibility
        await expect(page.locator('.empty-day-message')).toHaveCount(7); // One for each visible day
    });
});

test.describe('Performance Stress Tests', () => {
    test('should handle large datasets without freezing', async ({ page }) => {
        // Generate large dataset
        const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
            id: i + 1,
            date: `2025-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
            title: `Event ${i + 1}`,
            venue: `Venue ${i + 1}`,
            eventType: ['blue', 'green', 'orange', 'red'][i % 4],
            setlist: Array.from({ length: 10 }, (_, j) => `Joke ${i}-${j}`).join('\n'),
            notes: `Notes for event ${i + 1}`,
            tags: [`tag${i % 10}`, `category${i % 5}`],
            goal: `Goal for event ${i + 1}`
        }));
        
        await page.addInitScript((data) => {
            localStorage.setItem('micCalendarSets', JSON.stringify(data));
        }, largeDataset);
        
        await page.goto('/');
        
        // Page should load within reasonable time
        await expect(page.locator('.calendar-container')).toBeVisible({ timeout: 10000 });
        
        // Navigation should still be responsive
        await page.click('#statsNavBtn');
        await expect(page.locator('h3')).toContainText('Performance Statistics', { timeout: 5000 });
        
        // Stats should show large numbers correctly
        await expect(page.locator('[style*="font-size: 2rem"]')).toContainText('1000');
    });
});

test.describe('Browser Compatibility Edge Cases', () => {
    test('should handle localStorage quota exceeded', async ({ page }) => {
        await page.goto('/');
        
        // Try to exceed localStorage quota
        await page.evaluate(() => {
            try {
                const hugeData = 'x'.repeat(10 * 1024 * 1024); // 10MB string
                localStorage.setItem('testHugeData', hugeData);
            } catch (e) {
                // Storage quota exceeded - this is expected
                console.log('Storage quota exceeded as expected');
            }
        });
        
        // App should still function normally
        await page.click('#addSetBtn');
        await expect(page.locator('#add-edit-modal')).toBeVisible();
        
        // Clean up
        await page.evaluate(() => {
            localStorage.removeItem('testHugeData');
        });
    });

    test('should handle disabled JavaScript features', async ({ page }) => {
        await page.goto('/');
        
        // Disable some modern JavaScript features
        await page.evaluate(() => {
            // Mock missing modern features
            delete window.fetch;
            delete Array.prototype.flatMap;
        });
        
        // Core functionality should still work
        await page.click('#addSetBtn');
        await expect(page.locator('#add-edit-modal')).toBeVisible();
    });
});
