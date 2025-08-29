/**
 * Performance Budget Configuration
 * Enforces performance standards in CI/CD pipeline
 */

export const performanceBudget = {
  // Bundle Size Limits
  bundles: {
    // Main application bundle
    'main': {
      maxSize: '250kb',      // Gzipped
      maxSizeUncompressed: '800kb',
      warning: '200kb'
    },
    
    // Vendor/dependencies bundle
    'vendor': {
      maxSize: '150kb',      // React, Firebase, etc.
      maxSizeUncompressed: '500kb', 
      warning: '120kb'
    },
    
    // Individual route chunks
    'chunk': {
      maxSize: '50kb',       // Each lazy-loaded component
      maxSizeUncompressed: '150kb',
      warning: '40kb'
    },
    
    // CSS bundle
    'styles': {
      maxSize: '30kb',       // All styles combined
      maxSizeUncompressed: '100kb',
      warning: '25kb'
    }
  },

  // Core Web Vitals Thresholds
  coreWebVitals: {
    // Largest Contentful Paint (LCP)
    lcp: {
      good: 2500,      // milliseconds
      needsImprovement: 4000,
      poor: 4000
    },
    
    // First Input Delay (FID) 
    fid: {
      good: 100,       // milliseconds
      needsImprovement: 300,
      poor: 300
    },
    
    // Cumulative Layout Shift (CLS)
    cls: {
      good: 0.1,       // unitless score
      needsImprovement: 0.25,
      poor: 0.25
    },
    
    // Interaction to Next Paint (INP) - New metric
    inp: {
      good: 200,       // milliseconds
      needsImprovement: 500,
      poor: 500
    }
  },

  // Loading Performance
  loading: {
    // Time to First Byte
    ttfb: {
      target: 600,     // milliseconds
      warning: 1000
    },
    
    // First Contentful Paint
    fcp: {
      target: 1800,    // milliseconds
      warning: 3000
    },
    
    // Speed Index
    speedIndex: {
      target: 3000,    // milliseconds
      warning: 5800
    },
    
    // Time to Interactive
    tti: {
      target: 3800,    // milliseconds
      warning: 7300
    }
  },

  // Resource Limits
  resources: {
    // Total resource count
    totalRequests: {
      target: 25,
      warning: 35,
      critical: 50
    },
    
    // Image optimization
    images: {
      maxSize: '500kb',    // Per image
      totalSize: '2mb',    // All images
      formats: ['webp', 'avif', 'jpg', 'png'],
      quality: 85
    },
    
    // Font loading
    fonts: {
      maxSize: '200kb',    // Total font files
      maxFamilies: 2,      // Number of font families
      preload: true        // Critical fonts should be preloaded
    },
    
    // JavaScript execution
    javascript: {
      mainThreadBlocking: 200,  // milliseconds
      longTasks: 50,            // Number of long tasks
      unusedCode: 20            // Percentage of unused JS
    }
  },

  // Memory Usage (for SPA health)
  memory: {
    heapSize: {
      warning: '100mb',
      critical: '200mb'
    },
    
    memoryLeaks: {
      componentUnmountCleanup: true,
      eventListenerRemoval: true,
      intervalCleanup: true
    }
  },

  // Accessibility Performance
  accessibility: {
    // Keyboard navigation
    focusIndicators: true,
    tabOrder: true,
    skipLinks: true,
    
    // Screen reader
    ariaLabels: true,
    semanticMarkup: true,
    
    // Color contrast
    contrastRatio: 4.5,      // WCAG AA standard
    colorDependency: false   // Don't rely solely on color
  },

  // Device-Specific Budgets
  devices: {
    // Mobile (3G connection, mid-tier device)
    mobile: {
      lcp: 3000,
      fid: 150,
      cls: 0.15,
      bundleSize: '200kb',
      totalRequests: 20
    },
    
    // Desktop (Fast connection, powerful device)
    desktop: {
      lcp: 2000,
      fid: 75,
      cls: 0.1,
      bundleSize: '300kb',
      totalRequests: 30
    },
    
    // Low-end devices
    lowEnd: {
      lcp: 4000,
      fid: 200,
      cls: 0.2,
      bundleSize: '150kb',
      totalRequests: 15,
      javascript: {
        mainThreadBlocking: 150
      }
    }
  },

  // CI/CD Integration Settings
  ci: {
    // Fail build if critical thresholds exceeded
    failOnCritical: true,
    
    // Warn on threshold breaches  
    warnOnThreshold: true,
    
    // Performance regression detection
    regressionThreshold: 10,  // Percentage degradation
    
    // Lighthouse CI configuration
    lighthouse: {
      performance: 90,     // Minimum Lighthouse performance score
      accessibility: 95,   // Minimum accessibility score  
      bestPractices: 90,   // Minimum best practices score
      seo: 85,            // Minimum SEO score
      pwa: 80             // Minimum PWA score
    }
  },

  // Monitoring Configuration
  monitoring: {
    // Real User Monitoring (RUM)
    rum: {
      enabled: true,
      sampleRate: 0.1,     // 10% of users
      trackCoreWebVitals: true,
      trackLongTasks: true,
      trackMemoryUsage: true
    },
    
    // Synthetic Monitoring
    synthetic: {
      enabled: true,
      frequency: 'hourly',
      locations: ['us-east', 'eu-west', 'asia-pacific'],
      devices: ['mobile', 'desktop'],
      connections: ['3g', 'cable']
    },
    
    // Alert Thresholds
    alerts: {
      lcp: {
        warning: 3000,
        critical: 4500
      },
      errorRate: {
        warning: 0.01,       // 1%
        critical: 0.05       // 5%
      },
      availability: {
        warning: 0.995,      // 99.5%
        critical: 0.99       // 99%
      }
    }
  }
};

// Performance Test Configuration
export const performanceTests = {
  // Load Testing
  load: {
    users: {
      rampUp: 100,         // Users per minute
      target: 1000,        // Peak concurrent users
      duration: '10m'      // Test duration
    },
    
    scenarios: [
      {
        name: 'browse_jokes',
        weight: 40,
        actions: [
          'visit_home',
          'search_jokes',
          'filter_by_status',
          'view_joke_details'
        ]
      },
      {
        name: 'create_setlist', 
        weight: 30,
        actions: [
          'login',
          'create_setlist',
          'add_jokes',
          'reorder_setlist',
          'save_setlist'
        ]
      },
      {
        name: 'collaboration',
        weight: 20,
        actions: [
          'login',
          'share_setlist',
          'add_comment',
          'real_time_editing'
        ]
      },
      {
        name: 'performance_mode',
        weight: 10,
        actions: [
          'login',
          'open_setlist',
          'enter_performance_mode',
          'navigate_jokes'
        ]
      }
    ]
  },

  // Stress Testing
  stress: {
    users: {
      rampUp: 200,         // Users per minute  
      target: 2000,        // Peak concurrent users
      duration: '5m'       // Test duration
    },
    
    thresholds: {
      responseTime: {
        p95: 2000,         // 95th percentile response time
        p99: 5000          // 99th percentile response time
      },
      
      errorRate: 0.02,     // Maximum 2% error rate
      
      throughput: {
        min: 100           // Minimum requests per second
      }
    }
  }
};

// Development Performance Tools
export const devTools = {
  // Bundle Analysis
  bundleAnalyzer: {
    enabled: true,
    openBrowser: false,
    reportFilename: 'bundle-report.html'
  },
  
  // Performance Profiling
  profiling: {
    react: {
      enabled: process.env.NODE_ENV === 'development',
      showInlineWarnings: true
    },
    
    lighthouse: {
      enabled: true,
      config: 'desktop',
      outputPath: './lighthouse-results.json'
    }
  },
  
  // Code Quality
  quality: {
    eslint: {
      performance: true,   // Enable performance-related ESLint rules
      a11y: true          // Enable accessibility linting
    },
    
    sonarqube: {
      coverage: 80,       // Minimum code coverage
      maintainability: 'A', // Maintainability rating
      reliability: 'A',   // Reliability rating
      security: 'A'       // Security rating
    }
  }
};

export default performanceBudget;