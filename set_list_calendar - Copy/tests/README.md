# Mic Calendar E2E Testing

This directory contains end-to-end tests for the Mic Calendar application using Playwright.

## Setup

1. Install Node.js (v16 or higher)
2. Navigate to the tests directory:
   ```bash
   cd tests
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

## Running Tests

### All Tests
```bash
npm test
```

### With UI Mode (Recommended for development)
```bash
npm run test:ui
```

### Headed Mode (See browser)
```bash
npm run test:headed
```

### Debug Mode
```bash
npm run test:debug
```

### Specific Test File
```bash
npx playwright test core-workflows.spec.js
```

### Mobile Testing
```bash
npx playwright test --project="Mobile Chrome"
```

## Test Structure

### `core-workflows.spec.js`
Tests the main user workflows:
- Application loading and onboarding
- Adding new sets
- Using mic finder
- Filtering and searching
- Stats visualization
- Setlist management
- Keyboard shortcuts
- Mobile responsiveness
- Settings persistence
- Data export

### `performance.spec.js`
Tests performance and reliability:
- Load time metrics
- Accessibility compliance
- Large dataset handling
- Interaction responsiveness
- Graceful degradation
- Network failure handling
- Storage quota handling

## Test Coverage

The tests cover:

✅ **Core Functionality**
- Calendar rendering and navigation
- Set creation, editing, and deletion
- Mic finder integration
- Search and filtering
- Statistics and analytics

✅ **User Experience**
- Onboarding flow
- Keyboard shortcuts
- Mobile responsiveness
- Settings persistence
- Visual feedback

✅ **Quality Assurance**
- Performance metrics
- Accessibility standards
- Error handling
- Edge cases
- Cross-browser compatibility

✅ **Data Management**
- LocalStorage operations
- Data export/import
- Large dataset performance
- Storage quota handling

## CI/CD Integration

To integrate with your CI/CD pipeline:

1. **GitHub Actions Example:**
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: cd tests && npm ci
      - name: Install Playwright browsers
        run: cd tests && npx playwright install --with-deps
      - name: Run tests
        run: cd tests && npm test
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: tests/playwright-report/
```

## Writing New Tests

### Test Structure
```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code
    await page.goto('/set_list_Calendar.html');
  });

  test('should do something specific', async ({ page }) => {
    // Test implementation
  });
});
```

### Best Practices

1. **Use Page Object Model for complex interactions**
2. **Add explicit waits for dynamic content**
3. **Clean up test data between tests**
4. **Use descriptive test names**
5. **Test both positive and negative scenarios**
6. **Include accessibility checks**
7. **Test on multiple browsers and devices**

### Common Patterns

**Waiting for elements:**
```javascript
await page.waitForSelector('.element');
await expect(page.locator('.element')).toBeVisible();
```

**Interacting with modals:**
```javascript
await page.click('#openModalBtn');
await expect(page.locator('#modal')).toBeVisible();
await page.fill('#input', 'value');
await page.click('#submitBtn');
```

**Testing localStorage:**
```javascript
await page.evaluate(() => {
  localStorage.setItem('key', JSON.stringify(data));
});
```

## Troubleshooting

### Common Issues

1. **Tests timeout**: Increase timeout or add explicit waits
2. **Elements not found**: Use proper selectors and wait for elements
3. **Flaky tests**: Add proper cleanup and stable selectors
4. **Browser crashes**: Update Playwright and browsers

### Debug Commands

```bash
# Run with debug mode
npx playwright test --debug

# Run specific test with trace
npx playwright test --trace on specific-test.spec.js

# Show test report
npx playwright show-report
```

## Continuous Improvement

Regular test maintenance:
- Review and update tests with new features
- Monitor test execution times
- Update selectors when UI changes
- Add tests for reported bugs
- Review test coverage reports

## Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

The report includes:
- Test results and timing
- Screenshots of failures
- Video recordings
- Trace files for debugging
- Performance metrics
