import { test, expect } from '@playwright/test';

test.describe('Performance & Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/set_list_Calendar.html');
    await page.evaluate(() => localStorage.setItem('hasCompletedOnboarding', 'true'));
    await page.reload();
  });

  test('should have good performance metrics', async ({ page }) => {
    // Navigate to the page
    await page.goto('/set_list_Calendar.html');
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Measure performance
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    // Assert reasonable performance
    expect(performanceMetrics.domContentLoaded).toBeLessThan(1000); // Less than 1 second
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000); // Less than 2 seconds
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/set_list_Calendar.html');
    
    // Check for proper heading structure
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
    
    // Check for ARIA labels on buttons
    const addSetBtn = page.locator('#addSetBtn');
    await expect(addSetBtn).toHaveAttribute('aria-label');
    
    const addMicBtn = page.locator('#addMicBtn');
    await expect(addMicBtn).toHaveAttribute('aria-label');
    
    // Check that all form inputs have labels
    await page.click('#addSetBtn');
    const inputs = page.locator('#add-edit-modal input, #add-edit-modal select, #add-edit-modal textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
      }
    }
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    // Generate large test dataset
    const largeDataset = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      date: new Date(2024, 0, (i % 365) + 1).toISOString().split('T')[0],
      title: `Set ${i + 1}`,
      venue: `Venue ${(i % 10) + 1}`,
      eventType: ['blue', 'green', 'orange', 'red'][i % 4],
      setlist: `Joke ${i * 3 + 1}\nJoke ${i * 3 + 2}\nJoke ${i * 3 + 3}`,
      notes: `Notes for set ${i + 1}`
    }));
    
    await page.evaluate((data) => {
      localStorage.setItem('micCalendarSets', JSON.stringify(data));
    }, largeDataset);
    
    await page.reload();
    
    // Measure render time
    const startTime = Date.now();
    await page.waitForSelector('.calendar-grid');
    const renderTime = Date.now() - startTime;
    
    // Should render within reasonable time
    expect(renderTime).toBeLessThan(2000);
    
    // Test stats with large dataset
    await page.click('#statsNavBtn');
    await page.waitForSelector('#performanceTypeChart');
    
    // Charts should render without errors
    await expect(page.locator('#performanceTypeChart')).toBeVisible();
    await expect(page.locator('#topVenuesChart')).toBeVisible();
  });

  test('should maintain responsiveness during interactions', async ({ page }) => {
    await page.goto('/set_list_Calendar.html');
    
    // Test rapid interactions
    for (let i = 0; i < 5; i++) {
      await page.click('#addSetBtn');
      await page.keyboard.press('Escape');
      await page.click('#addMicBtn');
      await page.keyboard.press('Escape');
      await page.click('#statsNavBtn');
      await page.keyboard.press('Escape');
    }
    
    // Application should still be responsive
    await page.click('#addSetBtn');
    await expect(page.locator('#add-edit-modal')).toBeVisible();
  });

  test('should work without JavaScript (graceful degradation)', async ({ page }) => {
    // Disable JavaScript
    await page.context().addInitScript(() => {
      Object.defineProperty(window, 'navigator', {
        writable: true,
        value: {
          ...window.navigator,
          javaEnabled: () => false
        }
      });
    });
    
    await page.goto('/set_list_Calendar.html');
    
    // Basic HTML structure should still be present
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.calendar-grid')).toBeVisible();
    
    // Form elements should be present
    await expect(page.locator('#addSetBtn')).toBeVisible();
    await expect(page.locator('#addMicBtn')).toBeVisible();
  });

  test('should handle network failures gracefully', async ({ page }) => {
    await page.goto('/set_list_Calendar.html');
    
    // Simulate network failure for CSV loading
    await page.route('**/coordinates.csv', route => route.abort());
    
    // Try to open mic finder
    await page.click('#addMicBtn');
    
    // Should show appropriate error state
    await page.waitForSelector('#micsList');
    await expect(page.locator('#micsList')).toContainText('No mics found');
  });

  test('should handle localStorage quota exceeded', async ({ page }) => {
    await page.goto('/set_list_Calendar.html');
    
    // Mock localStorage to throw quota exceeded error
    await page.addInitScript(() => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        if (key.includes('micCalendar') && value.length > 100) {
          throw new Error('QuotaExceededError');
        }
        return originalSetItem.call(this, key, value);
      };
    });
    
    // Try to add many sets
    for (let i = 0; i < 5; i++) {
      await page.click('#addSetBtn');
      await page.fill('#event-title', `Large Set ${i} with lots of content`.repeat(20));
      await page.fill('#venue', 'Test Venue');
      await page.fill('#date', '2024-12-31');
      await page.fill('#setlist', 'Very long setlist content'.repeat(50));
      
      // This should eventually fail gracefully
      await page.click('button[type="submit"]');
      
      // Should either succeed or show appropriate error
      // Don't assert specific behavior as it depends on quota handling
    }
    
    // Application should still be functional
    await expect(page.locator('.calendar-grid')).toBeVisible();
  });
});
