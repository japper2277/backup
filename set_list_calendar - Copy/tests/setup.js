// Vitest setup file
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    reload: vi.fn()
  }
});

// Mock window.open
Object.defineProperty(window, 'open', {
  value: vi.fn()
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock Chart.js
global.Chart = vi.fn().mockImplementation(() => ({
  destroy: vi.fn(),
  update: vi.fn(),
  render: vi.fn()
}));

// Mock Papa Parse (CSV parser)
global.Papa = {
  parse: vi.fn((data, config) => {
    // Mock CSV parsing
    const mockResults = {
      data: [
        ['Name', 'Address', 'City', 'State', 'Zip', 'Phone', 'Website', 'Day', 'Time', 'lat', 'lng'],
        ['Test Venue 1', '123 Test St', 'Test City', 'NY', '12345', '555-0123', 'test1.com', 'Monday', '8:00 PM', '40.7128', '-74.0060'],
        ['Test Venue 2', '456 Test Ave', 'Test City', 'NY', '12346', '555-0124', 'test2.com', 'Tuesday', '9:00 PM', '40.7589', '-73.9851']
      ],
      errors: [],
      meta: { delimiter: ',', linebreak: '\n', aborted: false, truncated: false, cursor: 100 }
    };
    
    if (config && config.complete) {
      config.complete(mockResults);
    }
    
    return mockResults;
  })
};

// Mock Shepherd.js (onboarding)
global.Shepherd = {
  Tour: vi.fn().mockImplementation(() => ({
    addStep: vi.fn(),
    start: vi.fn(),
    complete: vi.fn(),
    cancel: vi.fn(),
    next: vi.fn(),
    back: vi.fn(),
    on: vi.fn()
  }))
};

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
});

// Clean up after each test
afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});
