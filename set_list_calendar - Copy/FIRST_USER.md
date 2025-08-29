# First User Journey

This document defines the critical path that every new user must complete to become activated in the Mic Calendar application. This journey is instrumented with analytics tracking to measure conversion at each step.

## The 5-Step User Journey

### 1. **Discovery**
User discovers the landing page via a link on Twitter, Reddit, comedy forums, or word-of-mouth.

**Entry Point:** `landing/index.html` (Marketing Landing Page)  
**Key Elements:** 
- Headline: "Craft Your Perfect Set. In Real-Time."
- Sub-headline: "The professional, real-time collaborative setlist builder for stand-up comedians."
- CTA Button: "Sign Up For Free"

### 2. **Consideration**
User reads the headline and evaluates the three key features to understand the value proposition.

**Key Features Displayed:**
- **Collaborative Editing:** Work together with other comedians in real-time
- **Timed Sets:** Track your performance timing down to the second  
- **Performance Mode:** Clean, distraction-free performance view

**Success Criteria:** User spends >10 seconds on landing page and clicks primary CTA

### 3. **Action**
User clicks "Sign Up For Free" button and is redirected to the application signup flow.

**Redirect:** `react-demo.html?signup=true` → Firebase Authentication signup form  
**Analytics Event:** Track click-through from landing page

### 4. **Onboarding** 
User completes the Firebase Authentication email/password signup form successfully.

**Process:**
- User enters: Display Name, Email, Password, Confirm Password
- Firebase creates user account
- User is automatically signed in

**Analytics Event:** `Account Created` (with method: 'email')  
**Success Criteria:** User account created in Firebase Auth

### 5. **Activation** ⭐ **CRITICAL MILESTONE**
User is redirected to the dashboard, clicks "Create New Setlist," navigates to `/setlist/{newId}`, and successfully drags at least **three** jokes into their setlist.

**Activation Flow:**
1. User lands on dashboard (`/` route)
2. User clicks "Create New Setlist" button
3. User is taken to `/setlist/{newId}` (new empty setlist)
4. User drags 3 jokes from the joke bank into their setlist
5. **ACTIVATION ACHIEVED** 🎉

**Analytics Events:**
- `Setlist Created` (when user creates new setlist)
- `User Activated` (when setlist reaches 3 jokes for the first time)

## Success Metrics

### Conversion Funnel
1. **Discovery → Consideration:** Landing page visits
2. **Consideration → Action:** CTA click-through rate
3. **Action → Onboarding:** Signup completion rate  
4. **Onboarding → Activation:** 3-joke setlist completion rate

### Key Performance Indicators (KPIs)
- **Time to Activation:** How long from signup to first 3-joke setlist
- **Activation Rate:** % of signups who complete the 3-joke milestone
- **Drop-off Points:** Where users abandon the journey

## Technical Implementation

### Landing Page Routing
- **Marketing Site:** `landing/index.html` (Astro static build)
- **Application Entry:** `react-demo.html?signup=true` (React app with signup modal)

### Analytics Tracking
All events tracked via Mixpanel with user identification:

```typescript
// After successful signup
identifyUser(user.uid);
trackEvent('Account Created', { method: 'email' });

// When user creates setlist
trackEvent('Setlist Created');

// When user reaches 3 jokes (ACTIVATION)
trackEvent('User Activated');
```

### Data Storage
- **User Data:** Firebase Auth + Firestore `/users/{userId}`
- **Setlists:** Firestore `/users/{userId}/setlists/{setlistId}`  
- **Jokes:** Firestore `/users/{userId}/jokes/{jokeId}`

## Optimization Notes

### Critical Success Factors
1. **Landing Page Performance:** Must load in <2 seconds
2. **Signup Friction:** Minimal form fields, clear value prop
3. **Onboarding UX:** Immediate value, clear next steps
4. **Drag & Drop UX:** Intuitive, responsive, satisfying interaction

### Common Drop-off Points
1. **Landing Page:** Unclear value proposition
2. **Signup Form:** Too many fields, unclear benefits  
3. **Empty Dashboard:** No clear next action
4. **Empty Setlist:** Confusing drag & drop interface

This journey represents the **minimum viable activation** - once a user has created their first setlist with 3 jokes, they have experienced the core value of the product and are likely to return.