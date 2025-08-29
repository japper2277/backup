/**
 * Lighthouse CI Configuration
 * Automated performance testing and regression detection
 */

module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3003/react-demo.html'],
      startServerCommand: 'npm run dev',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-gpu',
      },
    },
    assert: {
      assertions: {
        // Performance budgets - Google-level standards
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.85 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['error', { minScore: 0.8 }],
        
        // Core Web Vitals - Enterprise standards
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 4000 }],
        
        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 500000 }], // 500KB JS
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 100000 }], // 100KB CSS
        'resource-summary:image:size': ['error', { maxNumericValue: 1000000 }], // 1MB images
        'resource-summary:font:size': ['error', { maxNumericValue: 150000 }], // 150KB fonts
        'resource-summary:total:size': ['error', { maxNumericValue: 2000000 }], // 2MB total
        
        // Network requests
        'resource-summary:total:count': ['error', { maxNumericValue: 50 }],
        'resource-summary:third-party:count': ['error', { maxNumericValue: 10 }],
        
        // Service Worker and PWA requirements
        'service-worker': 'error',
        'installable-manifest': 'error',
        'works-offline': 'warn', // Warn instead of error during development
        
        // Security
        'is-on-https': 'off', // Development only
        'uses-http2': 'warn',
        
        // Modern web standards
        'uses-webp-images': 'warn',
        'efficient-animated-content': 'warn',
        'uses-optimized-images': 'warn',
        'modern-image-formats': 'warn',
        
        // JavaScript performance
        'unused-javascript': ['warn', { maxNumericValue: 100000 }], // 100KB unused JS
        'unminified-javascript': 'error',
        'unused-css-rules': ['warn', { maxNumericValue: 50000 }], // 50KB unused CSS
        'unminified-css': 'error',
        
        // React-specific optimizations
        'legacy-javascript': 'warn',
        'duplicated-javascript': 'error',
        'no-document-write': 'error',
        
        // User Experience
        'interactive': ['error', { maxNumericValue: 5000 }],
        'max-potential-fid': ['error', { maxNumericValue: 130 }],
        'errors-in-console': 'warn',
        
        // Comedy app specific (custom metrics)
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 4000 }],
        'bootup-time': ['warn', { maxNumericValue: 2000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
      // In production, you'd use:
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: 'your-build-token'
    },
    server: {
      // Local LHCI server configuration (optional)
      // port: 9001,
      // storage: {
      //   storageMethod: 'filesystem',
      //   storagePath: './lighthouse-reports'
      // }
    },
  },
};

/**
 * Performance Budget Rationale:
 * 
 * Performance Score ≥ 80: Google's "Good" threshold
 * Accessibility Score ≥ 90: WCAG AA compliance
 * Best Practices Score ≥ 85: Modern web standards
 * SEO Score ≥ 90: Search engine optimization
 * PWA Score ≥ 80: Progressive Web App features
 * 
 * Core Web Vitals:
 * - FCP ≤ 2s: Fast content display
 * - LCP ≤ 3s: Main content loads quickly
 * - CLS ≤ 0.1: Minimal layout shift
 * - TBT ≤ 300ms: Responsive to user input
 * - Speed Index ≤ 4s: Visual completeness
 * 
 * Resource Budgets:
 * - JavaScript: 500KB (industry standard for SPA)
 * - CSS: 100KB (comprehensive styling)
 * - Images: 1MB (comedy photos/avatars)
 * - Fonts: 150KB (Inter font family)
 * - Total: 2MB (modern broadband friendly)
 * 
 * Network Requests:
 * - Total: ≤50 requests (efficient loading)
 * - Third-party: ≤10 requests (minimal external deps)
 */