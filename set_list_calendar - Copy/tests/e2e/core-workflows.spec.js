import { test, expect } from '@playwright/test';

test.describe('Mic Calendar Core Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/set_list_Calendar.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should load the application successfully', async ({ page }) => {
    await page.goto('/set_list_Calendar.html');
    
    // Check that the main elements are present
    await expect(page.locator('h1')).toContainText('Mic Calendar');
    await expect(page.locator('.calendar-grid')).toBeVisible();
    await expect(page.locator('#addSetBtn')).toBeVisible();
    await expect(page.locator('#addMicBtn')).toBeVisible();
  });

  test('should run onboarding tour for new users', async ({ page }) => {
    await page.goto('/set_list_Calendar.html');
    
    // Wait for onboarding to start
    await expect(page.locator('.shepherd-modal')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.shepherd-title')).toContainText('Welcome to Mic Calendar!');
    
    // Go through the onboarding steps
    await page.click('.shepherd-button-primary');
    await expect(page.locator('.shepherd-title')).toContainText('Your Comedy Calendar');
    
    // Skip through remaining steps
    for (let i = 0; i < 5; i++) {
      await page.click('.shepherd-button-primary');
    }
    
    // Onboarding should be complete
    await expect(page.locator('.shepherd-modal')).not.toBeVisible();
  });

  test('should add a new set successfully', async ({ page }) => {
    await page.goto('/set_list_Calendar.html');
    
    // Skip onboarding if present
    await page.evaluate(() => localStorage.setItem('hasCompletedOnboarding', 'true'));
    await page.reload();
    
    // Click Add Set button
    await page.click('#addSetBtn');
    
    // Fill out the form
    await page.fill('#event-title', 'Test Comedy Set');
    await page.fill('#venue', 'Test Venue');
    await page.fill('#date', '2024-12-31');
    await page.selectOption('#event-type', 'green');
    await page.fill('#setlist', 'Joke 1\nJoke 2\nJoke 3');
    await page.fill('#notes', 'Test notes for the set');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for success notification
    await expect(page.locator('.notification')).toContainText('Set added successfully');
    
    // Verify the set appears on the calendar
    await page.waitForSelector('.event-pill');
    await expect(page.locator('.event-pill')).toContainText('Test Comedy Set');
  });

  test('should open and use mic finder', async ({ page }) => {
    await page.goto('/set_list_Calendar.html');
    
    // Skip onboarding
    await page.evaluate(() => localStorage.setItem('hasCompletedOnboarding', 'true'));
    await page.reload();
    
    // Click Add Mic button
    await page.click('#addMicBtn');
    
    // Wait for mic modal to open
    await expect(page.locator('#mic-selection-modal')).toBeVisible();
    
    // Wait for mics to load
    await page.waitForSelector('.mic-item', { timeout: 5000 });
    
    // Click on first mic
    await page.click('.mic-item:first-child');
    
    // Should open the add set modal with pre-filled venue
    await expect(page.locator('#add-edit-modal')).toBeVisible();
    await expect(page.locator('#venue')).not.toHaveValue('');
    await expect(page.locator('#event-title')).toHaveValue('Open Mic');
  });

  test('should filter calendar by venue search', async ({ page }) => {
    await page.goto('/set_list_Calendar.html');
    
    // Skip onboarding and add test data
    await page.evaluate(() => {
      localStorage.setItem('hasCompletedOnboarding', 'true');
      const testData = [
        {
          id: 1,
          date: '2024-12-25',
          title: 'Christmas Show',
          venue: 'Comedy Club A',
          eventType: 'blue',
          setlist: 'Holiday jokes',
          notes: 'Great crowd'
        },
        {
          id: 2,
          date: '2024-12-26',
          title: 'Boxing Day',
          venue: 'Laugh Track',
          eventType: 'green',
          setlist: 'Post-holiday material',
          notes: 'Smaller crowd'
        }
      ];
      localStorage.setItem('micCalendarSets', JSON.stringify(testData));
    });
    await page.reload();
    
    // Wait for calendar to render
    await page.waitForSelector('.event-pill');
    
    // Should see both events initially
    await expect(page.locator('.event-pill')).toHaveCount(2);
    
    // Search for specific venue
    await page.fill('#venueSearch', 'Comedy Club');
    
    // Should only see one event
    await expect(page.locator('.event-pill')).toHaveCount(1);
    await expect(page.locator('.event-pill')).toContainText('Christmas Show');
  });

  test('should open stats modal and display charts', async ({ page }) => {
    await page.goto('/set_list_Calendar.html');
    
    // Skip onboarding and add test data
    await page.evaluate(() => {
      localStorage.setItem('hasCompletedOnboarding', 'true');
      const testData = [
        {
          id: 1,
          date: '2024-12-25',
          title: 'Show 1',
          venue: 'Venue A',
          eventType: 'blue',
          setlist: 'Joke 1\nJoke 2',
          notes: ''
        },
        {
          id: 2,
          date: '2024-12-26',
          title: 'Show 2',
          venue: 'Venue B',
          eventType: 'green',
          setlist: 'Joke 3\nJoke 4\nJoke 5',
          notes: ''
        }
      ];
      localStorage.setItem('micCalendarSets', JSON.stringify(testData));
    });
    await page.reload();
    
    // Click stats button
    await page.click('#statsNavBtn');
    
    // Wait for stats modal to open
    await expect(page.locator('#event-summary-modal')).toBeVisible();
    await expect(page.locator('h3')).toContainText('Performance Stats');
    
    // Check that stats are displayed
    await expect(page.locator('.stats-grid')).toBeVisible();
    
    // Check for chart canvases
    await expect(page.locator('#performanceTypeChart')).toBeVisible();
    await expect(page.locator('#topVenuesChart')).toBeVisible();
  });

  test('should create and use saved setlist', async ({ page }) => {
    await page.goto('/set_list_Calendar.html');
    
    // Skip onboarding
    await page.evaluate(() => localStorage.setItem('hasCompletedOnboarding', 'true'));
    await page.reload();
    
    // Open add set modal
    await page.click('#addSetBtn');
    
    // Click manage setlists
    await page.click('button:has-text("Manage")');
    
    // Wait for setlist management modal
    await expect(page.locator('#setlist-management-modal')).toBeVisible();
    
    // Create new setlist
    await page.fill('#newSetlistName', 'Test Setlist');
    await page.fill('#newSetlistJokes', 'Test Joke 1\nTest Joke 2\nTest Joke 3');
    await page.click('#newSetlistForm button[type="submit"]');
    
    // Should see success notification
    await expect(page.locator('.notification')).toContainText('created successfully');
    
    // Close setlist modal
    await page.click('#setlist-management-modal button:has-text("Close")');
    
    // Should be back to add set modal
    await expect(page.locator('#add-edit-modal')).toBeVisible();
    
    // Select the new setlist
    await page.selectOption('#setlistTemplate', 'Test Setlist');
    
    // Setlist should be populated
    await expect(page.locator('#setlist')).toContainText('Test Joke 1');
  });

  test('keyboard shortcuts should work correctly', async ({ page }) => {
    await page.goto('/set_list_Calendar.html');
    
    // Skip onboarding
    await page.evaluate(() => localStorage.setItem('hasCompletedOnboarding', 'true'));
    await page.reload();
    
    // Test Ctrl+N (Add Set)
    await page.keyboard.press('Control+n');
    await expect(page.locator('#add-edit-modal')).toBeVisible();
    await page.keyboard.press('Escape');
    
    // Test Ctrl+M (Mic Finder)
    await page.keyboard.press('Control+m');
    await expect(page.locator('#mic-selection-modal')).toBeVisible();
    await page.keyboard.press('Escape');
    
    // Test Ctrl+S (Stats)
    await page.keyboard.press('Control+s');
    await expect(page.locator('#event-summary-modal')).toBeVisible();
    await page.keyboard.press('Escape');
    
    // Test ? (Help)
    await page.keyboard.press('?');
    await expect(page.locator('#event-summary-modal')).toBeVisible();
    await expect(page.locator('h3')).toContainText('Keyboard Shortcuts');
  });

  test('should work on mobile viewports', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/set_list_Calendar.html');
    
    // Skip onboarding
    await page.evaluate(() => localStorage.setItem('hasCompletedOnboarding', 'true'));
    await page.reload();
    
    // Check that mobile layout is applied
    await expect(page.locator('.calendar-grid')).toBeVisible();
    
    // Test mobile navigation
    await page.click('#addSetBtn');
    await expect(page.locator('#add-edit-modal')).toBeVisible();
    
    // Modal should be properly sized for mobile
    const modal = page.locator('.modal-content');
    const modalBox = await modal.boundingBox();
    expect(modalBox.width).toBeLessThan(400);
  });

  test('should persist settings across sessions', async ({ page }) => {
    await page.goto('/set_list_Calendar.html');
    
    // Skip onboarding
    await page.evaluate(() => localStorage.setItem('hasCompletedOnboarding', 'true'));
    await page.reload();
    
    // Open settings
    await page.click('#settingsNavBtn');
    
    // Change theme to light
    await page.selectOption('#theme', 'light');
    await page.click('button[type="submit"]');
    
    // Wait for settings to save
    await page.waitForTimeout(1500);
    
    // Reload page
    await page.reload();
    
    // Check that light theme is still applied
    const rootStyle = await page.evaluate(() => 
      getComputedStyle(document.documentElement).getPropertyValue('--bg-main')
    );
    expect(rootStyle.trim()).toBe('#ffffff');
  });

  test('should export data successfully', async ({ page }) => {
    await page.goto('/set_list_Calendar.html');
    
    // Skip onboarding and add test data
    await page.evaluate(() => {
      localStorage.setItem('hasCompletedOnboarding', 'true');
      const testData = [{ id: 1, title: 'Test Set', venue: 'Test Venue' }];
      localStorage.setItem('micCalendarSets', JSON.stringify(testData));
    });
    await page.reload();
    
    // Set up download handler
    const downloadPromise = page.waitForEvent('download');
    
    // Trigger export
    await page.evaluate(() => window.exportData());
    
    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('mic-calendar-backup.json');
  });
});
