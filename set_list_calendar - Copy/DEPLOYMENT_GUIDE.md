# Go-to-Market Deployment Guide

This guide covers deploying your comedy calendar application's go-to-market foundation with analytics tracking, production security, and optimized performance.

## 🚀 Quick Start Checklist

### 1. **Set Up Mixpanel Analytics**
1. Create a Mixpanel project at [mixpanel.com](https://mixpanel.com)
2. Get your Project Token from the project settings
3. Add to your environment variables:
   ```bash
   VITE_MIXPANEL_TOKEN=YOUR_MIXPANEL_PROJECT_TOKEN
   ```

### 2. **Configure Firebase for Production**
1. Update your `.env.local` with production Firebase config:
   ```bash
   VITE_FIREBASE_API_KEY=your_production_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_USE_FIREBASE_EMULATOR=false
   ```

2. Deploy the production Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

3. Deploy the database indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```

### 3. **Deploy Landing Page**
1. Build the Astro landing page:
   ```bash
   cd landing
   npm install
   npm run build
   cd ..
   ```

2. Deploy to Firebase Hosting:
   ```bash
   firebase deploy --only hosting:mic-calendar-landing
   ```

### 4. **Deploy Main Application**
1. Build the React application:
   ```bash
   npm run build
   ```

2. Deploy to Firebase Hosting:
   ```bash
   firebase deploy --only hosting:mic-calendar-app
   ```

## 📊 Analytics Implementation

### Key Events Tracked

Your application now tracks these critical funnel events:

1. **`Account Created`** - User completes signup
   - Method: 'email' or 'google'  
   - Location: `SignupForm.jsx` after successful authentication

2. **`Setlist Created`** - User creates a new setlist
   - Location: `collaborationService.ts` in `createSetlist()` function

3. **`User Activated`** ⭐ - User drags 3 jokes into a setlist
   - Location: `UnifiedSetlist.jsx` in drag-and-drop handler
   - This is your key activation milestone

### Funnel Analysis in Mixpanel

Create these funnels in your Mixpanel dashboard:

**User Activation Funnel:**
1. Account Created → Setlist Created → User Activated

**Conversion Metrics:**
- Landing page visits → Account Created (signup conversion)
- Account Created → Setlist Created (onboarding success)  
- Setlist Created → User Activated (product value realization)

## 🔒 Security Implementation

### Production Firestore Rules

Your application now uses production-ready security rules that ensure:

- **Complete data isolation** between users
- **Authentication-based access control** for all operations
- **Owner-only access** to setlists, jokes, and user data
- **Secure subcollection access** for jokes and comments within setlists

### Database Indexes

Optimized composite indexes for:
- User setlists sorted by creation date (`ownerId` + `createdAt`)  
- User setlists sorted by update date (`ownerId` + `updatedAt`)
- User jokes sorted by creation date (`authorId` + `createdAt`)

## 🎯 First User Journey

The complete user journey is documented in `FIRST_USER.md`:

1. **Discovery** → Landing page visit
2. **Consideration** → Feature evaluation  
3. **Action** → Signup button click
4. **Onboarding** → Account creation
5. **Activation** → 3-joke setlist completion

## 🌐 Routing & URLs

### Landing Page Routes
- **Root**: `/` → Marketing landing page
- **All paths**: `/**` → Redirects to landing page

### Application Routes  
- **Signup**: `/signup` → Opens React app with signup modal
- **Setlists**: `/setlist/**` → Setlist builder interface
- **Default**: `/**` → Main calendar application

## 📈 Performance Optimization

### Bundle Splitting
- **React vendor chunk**: React, React-DOM
- **Firebase chunk**: Firebase services  
- **Optimized assets**: Images, CSS with content hashing

### Loading Strategy
- **Critical CSS inlined** in landing page
- **Font preloading** for Inter font family
- **Service worker** ready for caching (when enabled)

## 🛠 Development Commands

### Landing Page Development
```bash
cd landing
npm run dev    # Start Astro dev server on port 3001
npm run build  # Build static site
```

### Main Application Development
```bash
npm run dev     # Start Vite dev server on port 3000
npm run build   # Build production bundle
npm run preview # Preview production build
```

### Testing & Quality
```bash
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests  
npm run perf         # Run Lighthouse performance audit
npm run lint         # Run ESLint
```

### Firebase Deployment
```bash
# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only hosting:mic-calendar-landing
firebase deploy --only hosting:mic-calendar-app
```

## 🎯 Success Metrics

### Primary KPIs
- **Activation Rate**: % of signups who complete 3-joke setlist
- **Time to Activation**: Average time from signup to activation
- **Signup Conversion**: Landing page visits → Account created

### Secondary Metrics
- **Feature Adoption**: Drag-and-drop usage, setlist management
- **User Retention**: 1-day, 7-day, 30-day return rates
- **Performance**: Page load times, error rates

## 🔧 Environment Configuration

Copy `env.example` to `.env.local` and configure:

### Required for Production
- `VITE_MIXPANEL_TOKEN` - Your Mixpanel project token
- Firebase configuration variables
- `FEATURE_ANALYTICS=true` - Enable analytics tracking

### Optional for Enhanced Features  
- Sentry DSN for error tracking
- Stripe keys for subscription billing
- Push notification VAPID keys

## 🚀 Go-Live Checklist

- [ ] Mixpanel project configured and token added
- [ ] Firebase production config deployed
- [ ] Security rules deployed and tested
- [ ] Database indexes created
- [ ] Landing page deployed and accessible
- [ ] Main application deployed and functional
- [ ] Analytics events firing correctly
- [ ] First user journey tested end-to-end
- [ ] Performance benchmarks met (Lighthouse scores)
- [ ] Error tracking configured

## 🎉 You're Ready for Launch!

Your comedy calendar application now has a professional go-to-market foundation with:
- ✅ **Conversion-optimized landing page**
- ✅ **Complete analytics funnel tracking**  
- ✅ **Production-ready security**
- ✅ **Scalable database architecture**
- ✅ **Performance-optimized hosting**

Focus on driving traffic to your landing page and measuring the user activation funnel to optimize for growth!