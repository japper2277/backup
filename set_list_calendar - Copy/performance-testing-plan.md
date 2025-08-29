# Performance Testing Plan & Budget

## Performance Budgets - Production Targets

### Core Web Vitals (P95)
- **Largest Contentful Paint (LCP)**: ≤ 2.5s
- **First Input Delay (FID)**: ≤ 100ms  
- **Cumulative Layout Shift (CLS)**: ≤ 0.1

### Additional Metrics (P95)
- **First Contentful Paint (FCP)**: ≤ 1.8s
- **Time to Interactive (TTI)**: ≤ 5.0s
- **Speed Index**: ≤ 4.0s
- **Total Blocking Time (TBT)**: ≤ 300ms

### Resource Budgets
- **JavaScript Bundle (gzipped)**: ≤ 450KB initial, ≤ 200KB per chunk
- **CSS (gzipped)**: ≤ 75KB  
- **Images**: ≤ 500KB total per page
- **Fonts**: ≤ 150KB total
- **Total Page Weight**: ≤ 1.5MB

### API Performance (P99)
- **Search Query**: ≤ 800ms response time
- **Joke Creation**: ≤ 1200ms response time
- **Pagination**: ≤ 600ms response time
- **Database Queries**: ≤ 200ms (simulated)

### Network Conditions Testing
- **Fast 3G**: 1.6Mbps down, 750Kbps up, 300ms RTT
- **Slow 3G**: 400Kbps down, 400Kbps up, 400ms RTT  
- **2G**: 280Kbps down, 256Kbps up, 800ms RTT

## Testing Tools & Implementation

### 1. Lighthouse CI (Automated)
```bash
# Install
npm install --save-dev @lhci/cli

# Configuration (lighthouserc.js)
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      numberOfRuns: 5,
      settings: {
        throttling: {
          rttMs: 300,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        }
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }]
      }
    }
  }
}

# Run tests
npm run perf:ci
```

### 2. Real Device Testing
- **iPhone 8** (iOS Safari)
- **Samsung Galaxy S8** (Chrome Mobile)  
- **Google Pixel 4a** (Chrome Mobile)
- **Desktop**: Chrome 90+, Firefox 88+, Safari 14+

### 3. WebPageTest Integration
```javascript
// API testing with WebPageTest
const WPT_API_KEY = process.env.WPT_API_KEY;

const testConfig = {
  url: 'https://your-app.com',
  location: 'Dulles:Chrome',
  connectivity: '3G',
  runs: 3,
  firstViewOnly: false
};
```

### 4. Synthetic Monitoring (Datadog/New Relic)
- **Frequency**: Every 5 minutes from 3 global locations
- **Alerts**: P95 > budget thresholds
- **Synthetic Tests**: 
  - Homepage load
  - Search functionality  
  - Joke creation flow
  - Pagination performance

## Testing Scenarios

### 1. Cold Cache Performance
- Clear all caches
- Disable Service Worker
- Test initial load on 3G connection
- **Target**: LCP ≤ 3.5s, FCP ≤ 2.0s

### 2. Warm Cache Performance  
- Service Worker active
- Static resources cached
- **Target**: LCP ≤ 1.5s, FCP ≤ 1.0s

### 3. Data Loading Performance
- **500 jokes**: Search/filter ≤ 400ms
- **5,000 jokes**: Search/filter ≤ 600ms
- **50,000 jokes**: Search/filter ≤ 1000ms
- **500,000 jokes**: Search/filter ≤ 2000ms

### 4. Error Recovery Performance
- API timeout scenarios
- Network interruption
- **Target**: Graceful degradation, no white screens

## Monitoring & Alerting

### Real User Monitoring (RUM)
```javascript
// Performance Observer integration
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.entryType === 'largest-contentful-paint') {
      // Send to analytics
      sendMetric('lcp', entry.startTime);
    }
  });
});

observer.observe({entryTypes: ['largest-contentful-paint']});
```

### Alert Thresholds
- **P95 LCP > 3.0s**: Warning
- **P95 LCP > 4.0s**: Critical  
- **P99 API Response > 2.0s**: Warning
- **Error Rate > 1%**: Critical
- **Apdex Score < 0.85**: Warning

## CI/CD Integration

### Performance Gate
```yaml
# .github/workflows/performance.yml
- name: Lighthouse CI
  run: |
    npm run build
    npm run perf:ci
  
- name: Performance Budget Check
  run: |
    if [ $(cat lighthouse-results.json | jq '.categories.performance.score') < 0.8 ]; then
      echo "❌ Performance budget failed"
      exit 1
    fi
```

### Deployment Pipeline
1. **PR Creation**: Run Lighthouse on PR preview
2. **Staging Deploy**: Full performance test suite  
3. **Production Deploy**: Only if performance budgets pass
4. **Post-Deploy**: Monitor for 24h, rollback if metrics degrade

## Optimization Priorities

### Phase 1: Core Metrics (Week 1)
- [ ] Bundle size optimization (code splitting)
- [ ] Image optimization and lazy loading
- [ ] Critical CSS inlining
- [ ] Service Worker caching strategy

### Phase 2: API Performance (Week 2)  
- [ ] Database query optimization
- [ ] API response caching
- [ ] CDN configuration
- [ ] Compression (gzip/brotli)

### Phase 3: Advanced Optimizations (Week 3)
- [ ] Resource hints (preload, prefetch)
- [ ] HTTP/2 push optimization
- [ ] Third-party script optimization
- [ ] A/B test performance variants

## Success Criteria

### Performance Score Targets
- **Lighthouse Performance Score**: ≥ 85
- **PageSpeed Insights**: ≥ 90 (mobile), ≥ 95 (desktop)
- **WebPageTest Speed Index**: ≤ 4000ms
- **User Satisfaction (Apdex)**: ≥ 0.9

### Business Impact Metrics
- **Bounce Rate**: ≤ 40% (currently ~55%)
- **Session Duration**: ≥ 3:30 minutes  
- **Pages per Session**: ≥ 2.5
- **Conversion Rate**: ≥ 12% (free to paid)

### Technical Health Metrics
- **Error Rate**: ≤ 0.5%
- **99.9% Uptime SLA**
- **Mean Time to Recovery**: ≤ 5 minutes
- **Change Failure Rate**: ≤ 15%

## Reporting Schedule

### Daily (Automated)
- Performance dashboard updates
- Alert notifications
- Trend analysis

### Weekly (Manual Review)
- Performance budget compliance
- User experience metrics  
- Competitive benchmarking

### Monthly (Stakeholder Report)
- Performance ROI analysis
- Budget adjustments
- Roadmap prioritization

---

**This plan provides:**
✅ **Specific P95/P99 targets** (as requested by Maria)  
✅ **Real testing tools and implementation**  
✅ **Measurable success criteria**  
✅ **Business impact correlation**  
✅ **Actionable next steps with timeline**