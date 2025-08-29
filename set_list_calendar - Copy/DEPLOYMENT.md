# 🚀 Mic Calendar Production Deployment Guide

## ⚠️ CRITICAL: You Must Use the Production Build

**DO NOT** deploy the raw source files. The application must be built for production first.

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
```bash
# Copy environment file
cp env.production .env.production

# Install dependencies (if using npm/node setup)
npm install
```

### 2. Build for Production
```bash
# Create optimized production build
npm run build

# This creates a 'dist' folder with:
# - Minified and bundled JavaScript
# - Optimized CSS
# - Compressed assets
# - Environment variables injected
```

### 3. Test Production Build Locally
```bash
# Preview the production build
npm run preview

# Opens http://localhost:3000 with the ACTUAL production files
# Test all functionality before deploying
```

## 🌐 Deployment Options

### Option 1: Static Hosting (Recommended)
Deploy the **entire `dist` folder** to:
- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Connect repo and set build command to `npm run build`
- **GitHub Pages**: Upload `dist` contents to gh-pages branch
- **Surge.sh**: `surge dist/`

### Option 2: Traditional Web Server
1. Copy the entire `dist` folder to your web server
2. Configure server to serve `index.html` for all routes
3. Ensure proper MIME types for `.js` and `.css` files

## 🔧 Production Configuration

### Environment Variables
Edit `.env.production` before building:

```bash
# Production API endpoints
VITE_API_BASE_URL=https://api.micfinderapp.com

# Feature flags for production
VITE_FEATURE_COLLABORATION=false
VITE_FEATURE_ANALYTICS=false

# Performance optimization
VITE_CHART_ANIMATION_DURATION=500
VITE_NOTIFICATION_DURATION=2000

# Disable debug features
VITE_DEBUG_ENABLED=false
VITE_LOG_LEVEL=error
```

### Build Script Commands
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && npm run preview"
  }
}
```

## 📊 Performance Verification

After deployment, verify:

### ✅ Bundle Size Optimization
- Main bundle < 100KB gzipped
- Vendor chunks properly split
- Assets compressed and optimized

### ✅ Loading Performance
- First Contentful Paint < 2s
- Largest Contentful Paint < 2.5s
- Cumulative Layout Shift < 0.1

### ✅ Functionality Tests
- All features work correctly
- Charts load with skeleton animations
- Keyboard shortcuts functional
- Mobile responsiveness maintained

## 🚨 Common Deployment Mistakes

### ❌ DON'T DO THIS:
- Upload raw source files to production
- Skip the build process
- Deploy from the root directory
- Use development environment variables

### ✅ DO THIS:
- Always run `npm run build` first
- Deploy only the `dist` folder contents
- Use production environment variables
- Test with `npm run preview` before deployment

## 🔍 Post-Deployment Testing

### Required Tests:
1. **Functionality**: All features work
2. **Performance**: Fast loading times
3. **Accessibility**: Keyboard navigation works
4. **Mobile**: Responsive on all devices
5. **Data**: localStorage persistence works
6. **Offline**: App works without network

### Browser Compatibility:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📈 Monitoring & Analytics

### Production Monitoring:
- Set up error tracking (e.g., Sentry)
- Monitor Core Web Vitals
- Track user engagement metrics
- Monitor API response times

### Performance Budgets:
- JavaScript bundle: < 100KB
- CSS bundle: < 30KB
- Image assets: < 500KB total
- Third-party libraries: < 50KB

## 🛠️ Troubleshooting

### Build Errors:
```bash
# Clear cache and rebuild
rm -rf node_modules/.vite
npm run build
```

### Environment Variable Issues:
```bash
# Verify variables are being injected
npm run build -- --mode production
```

### Runtime Errors:
- Check browser console for errors
- Verify all assets are loading correctly
- Test localStorage functionality
- Confirm CSP headers allow necessary resources

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] Production build created (`npm run build`)
- [ ] Build tested locally (`npm run preview`)
- [ ] All features tested in production build
- [ ] Performance verified (Lighthouse score > 90)
- [ ] SEO meta tags updated
- [ ] Error monitoring set up
- [ ] HTTPS configured
- [ ] CDN configured (if applicable)
- [ ] Analytics tracking enabled

---

## 🚀 Ready for Launch!

Once you've completed this checklist, your Mic Calendar application is ready for production deployment with:
- ⚡ Optimized performance
- 🔒 Production security
- 📱 Mobile optimization
- ♿ Full accessibility
- 🎭 Professional user experience

**Remember: Always deploy the `dist` folder, never the source code!**
