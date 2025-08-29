// Performance Benchmark E2E Tests - Measure user interaction performance
import { test, expect } from '@playwright/test';

test.describe('User Interaction Performance Benchmarks', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('calendar rendering should be under 100ms', async ({ page }) => {
        const startTime = Date.now();
        
        // Trigger calendar re-render by changing view
        await page.click('#expandBtn');
        
        // Wait for calendar to finish rendering
        await page.waitForSelector('.calendar-grid', { state: 'visible' });
        
        const endTime = Date.now();
        const renderTime = endTime - startTime;
        
        console.log(`Calendar render time: ${renderTime}ms`);
        expect(renderTime).toBeLessThan(100);
    });

    test('search filtering should respond within 50ms', async ({ page }) => {
        // Add some test data first
        await page.evaluate(() => {
            const testSets = Array.from({ length: 50 }, (_, i) => ({
                id: i + 100,
                date: `2025-06-${String((i % 30) + 1).padStart(2, '0')}`,
                title: `Test Event ${i}`,
                venue: `Test Venue ${i}`,
                eventType: ['blue', 'green', 'orange', 'red'][i % 4],
                setlist: `Test joke ${i}`,
                notes: `Test notes ${i}`,
                tags: [`tag${i % 5}`],
                goal: `Test goal ${i}`
            }));
            
            const existing = JSON.parse(localStorage.getItem('micCalendarSets') || '[]');
            localStorage.setItem('micCalendarSets', JSON.stringify([...existing, ...testSets]));
        });
        
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        const startTime = Date.now();
        
        // Perform search
        await page.fill('#searchInput', 'Test Event');
        
        // Wait for search results to appear
        await page.waitForFunction(() => {
            const events = document.querySelectorAll('.event-pill');
            return Array.from(events).some(event => 
                event.textContent.includes('Test Event')
            );
        });
        
        const endTime = Date.now();
        const searchTime = endTime - startTime;
        
        console.log(`Search filter time: ${searchTime}ms`);
        expect(searchTime).toBeLessThan(50);
    });

    test('modal opening should be under 30ms', async ({ page }) => {
        const startTime = Date.now();
        
        await page.click('#addSetBtn');
        
        await page.waitForSelector('#add-edit-modal.is-visible');
        
        const endTime = Date.now();
        const modalTime = endTime - startTime;
        
        console.log(`Modal open time: ${modalTime}ms`);
        expect(modalTime).toBeLessThan(30);
    });

    test('form submission should complete within 200ms', async ({ page }) => {
        await page.click('#addSetBtn');
        
        // Fill form
        await page.fill('#event-title', 'Performance Test Event');
        await page.fill('#venue', 'Performance Test Venue');
        await page.fill('#date', '2025-12-31');
        await page.selectOption('#event-type', 'blue');
        await page.fill('#setlist', 'Performance test joke');
        
        const startTime = Date.now();
        
        await page.click('button[type="submit"]');
        
        // Wait for modal to close (indicating form submission completed)
        await page.waitForSelector('#add-edit-modal', { state: 'hidden' });
        
        const endTime = Date.now();
        const submitTime = endTime - startTime;
        
        console.log(`Form submission time: ${submitTime}ms`);
        expect(submitTime).toBeLessThan(200);
    });

    test('stats chart rendering should be under 500ms', async ({ page }) => {
        // Add data for charts
        await page.evaluate(() => {
            const chartData = Array.from({ length: 20 }, (_, i) => ({
                id: i + 200,
                date: `2025-0${Math.floor(i / 6) + 1}-${String((i % 6) + 1).padStart(2, '0')}`,
                title: `Chart Event ${i}`,
                venue: `Chart Venue ${i % 5}`,
                eventType: ['blue', 'green', 'orange', 'red'][i % 4],
                setlist: Array.from({ length: 5 }, (_, j) => `Chart joke ${i}-${j}`).join('\n'),
                notes: `Chart notes ${i}`,
                tags: [`chart-tag${i % 3}`],
                goal: `Chart goal ${i}`
            }));
            
            const existing = JSON.parse(localStorage.getItem('micCalendarSets') || '[]');
            localStorage.setItem('micCalendarSets', JSON.stringify([...existing, ...chartData]));
        });
        
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        const startTime = Date.now();
        
        await page.click('#statsNavBtn');
        
        // Wait for charts to be rendered (canvas elements should be present)
        await page.waitForSelector('#performanceTypeChart');
        await page.waitForSelector('#topVenuesChart');
        await page.waitForSelector('#performanceTimelineChart');
        
        const endTime = Date.now();
        const chartTime = endTime - startTime;
        
        console.log(`Chart rendering time: ${chartTime}ms`);
        expect(chartTime).toBeLessThan(500);
    });

    test('view switching should be under 75ms', async ({ page }) => {
        const measurements = [];
        
        // Test calendar to stats
        let startTime = Date.now();
        await page.click('#statsNavBtn');
        await page.waitForSelector('h3:has-text("Performance Statistics")');
        let endTime = Date.now();
        measurements.push(endTime - startTime);
        
        // Test stats to settings
        startTime = Date.now();
        await page.click('#settingsNavBtn');
        await page.waitForSelector('h3:has-text("Settings")');
        endTime = Date.now();
        measurements.push(endTime - startTime);
        
        // Test settings back to calendar
        startTime = Date.now();
        await page.click('.bottom-nav-item:first-child');
        await page.waitForSelector('.calendar-container');
        endTime = Date.now();
        measurements.push(endTime - startTime);
        
        const avgTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        console.log(`Average view switch time: ${avgTime}ms`, measurements);
        
        expect(avgTime).toBeLessThan(75);
    });

    test('memory usage should stay reasonable during extended use', async ({ page }) => {
        // Simulate extended app usage
        for (let i = 0; i < 10; i++) {
            // Add event
            await page.click('#addSetBtn');
            await page.fill('#event-title', `Memory Test ${i}`);
            await page.fill('#venue', `Memory Venue ${i}`);
            await page.fill('#date', '2025-12-31');
            await page.selectOption('#event-type', 'blue');
            await page.click('button[type="submit"]');
            
            // Switch views
            await page.click('#statsNavBtn');
            await page.click('#settingsNavBtn');
            await page.click('.bottom-nav-item:first-child');
            
            // Filter events
            await page.fill('#searchInput', `Memory Test ${i}`);
            await page.fill('#searchInput', '');
        }
        
        // Measure memory usage
        const metrics = await page.evaluate(() => {
            if (performance.memory) {
                return {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };
            }
            return null;
        });
        
        if (metrics) {
            console.log('Memory usage:', metrics);
            const memoryUsageMB = metrics.usedJSHeapSize / (1024 * 1024);
            console.log(`Memory usage: ${memoryUsageMB.toFixed(2)}MB`);
            
            // Should not exceed 50MB for basic usage
            expect(memoryUsageMB).toBeLessThan(50);
        }
    });

    test('keyboard shortcuts should respond within 20ms', async ({ page }) => {
        const startTime = Date.now();
        
        // Test keyboard shortcut (Ctrl+N for new set)
        await page.keyboard.press('Control+n');
        
        await page.waitForSelector('#add-edit-modal.is-visible');
        
        const endTime = Date.now();
        const shortcutTime = endTime - startTime;
        
        console.log(`Keyboard shortcut response time: ${shortcutTime}ms`);
        expect(shortcutTime).toBeLessThan(20);
    });

    test('large data set operations should complete within performance budget', async ({ page }) => {
        // Create large dataset (1000 events)
        await page.evaluate(() => {
            const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
                id: i + 1000,
                date: `2025-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
                title: `Large Dataset Event ${i}`,
                venue: `Large Venue ${i % 20}`, // 20 different venues
                eventType: ['blue', 'green', 'orange', 'red'][i % 4],
                setlist: Array.from({ length: 8 }, (_, j) => `Large joke ${i}-${j}`).join('\n'),
                notes: `Large notes ${i}`,
                tags: [`large-tag${i % 10}`, `category${i % 5}`],
                goal: `Large goal ${i}`
            }));
            
            localStorage.setItem('micCalendarSets', JSON.stringify(largeDataset));
        });
        
        const startTime = Date.now();
        
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.calendar-container');
        
        const loadTime = Date.now() - startTime;
        console.log(`Large dataset load time: ${loadTime}ms`);
        expect(loadTime).toBeLessThan(2000); // 2 seconds max
        
        // Test search performance with large dataset
        const searchStart = Date.now();
        await page.fill('#searchInput', 'Large Dataset Event 500');
        await page.waitForFunction(() => {
            const events = document.querySelectorAll('.event-pill');
            return events.length > 0;
        });
        const searchTime = Date.now() - searchStart;
        console.log(`Large dataset search time: ${searchTime}ms`);
        expect(searchTime).toBeLessThan(100);
        
        // Test stats calculation performance
        const statsStart = Date.now();
        await page.click('#statsNavBtn');
        await page.waitForSelector('h3:has-text("Performance Statistics")');
        const statsTime = Date.now() - statsStart;
        console.log(`Large dataset stats time: ${statsTime}ms`);
        expect(statsTime).toBeLessThan(1000); // 1 second max for stats calculation
    });
});

test.describe('Performance Regression Detection', () => {
    test('baseline performance benchmarks', async ({ page }) => {
        await page.goto('/');
        
        // Measure initial load performance
        const navigationTiming = await page.evaluate(() => {
            const timing = performance.getEntriesByType('navigation')[0];
            return {
                domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
                loadComplete: timing.loadEventEnd - timing.loadEventStart,
                domInteractive: timing.domInteractive - timing.fetchStart,
                firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0
            };
        });
        
        console.log('Navigation timing:', navigationTiming);
        
        // Set performance budgets
        expect(navigationTiming.domContentLoaded).toBeLessThan(100);
        expect(navigationTiming.loadComplete).toBeLessThan(200);
        expect(navigationTiming.domInteractive).toBeLessThan(500);
        
        if (navigationTiming.firstPaint > 0) {
            expect(navigationTiming.firstPaint).toBeLessThan(300);
        }
    });

    test('resource loading performance', async ({ page }) => {
        await page.goto('/');
        
        const resourceTimings = await page.evaluate(() => {
            return performance.getEntriesByType('resource').map(entry => ({
                name: entry.name,
                duration: entry.duration,
                transferSize: entry.transferSize || 0
            }));
        });
        
        console.log('Resource timings:', resourceTimings);
        
        // Check critical resource load times
        const criticalResources = resourceTimings.filter(resource => 
            resource.name.includes('calendar.css') || 
            resource.name.includes('main.js') ||
            resource.name.includes('chart.js')
        );
        
        criticalResources.forEach(resource => {
            console.log(`${resource.name}: ${resource.duration}ms`);
            expect(resource.duration).toBeLessThan(1000); // 1 second max for any critical resource
        });
    });
});
