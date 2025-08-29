# Comedy Setlist Builder - Integration Test Plan

## Executive Summary
This test plan defines the acceptance criteria for consolidating the fragmented demo applications into a single, production-ready comedy setlist builder with both drag-and-drop functionality and real-time collaborative features.

## Critical User Workflows

### Core Drag & Drop Functionality
**UC-001: Add Joke from Bank to Setlist**
- **Given:** User has jokes in their joke bank
- **When:** User drags a joke from bank to setlist
- **Then:** Joke appears in setlist at correct position
- **Then:** Joke remains in bank (copy, not move)
- **Then:** Change persists after page refresh
- **Then:** Other users see the change in real-time

**UC-002: Reorder Jokes in Setlist**
- **Given:** User has multiple jokes in setlist
- **When:** User drags a joke to different position
- **Then:** Joke moves to new position with smooth animation
- **Then:** Other jokes adjust positions appropriately
- **Then:** Order persists after page refresh
- **Then:** Other users see reordering in real-time

**UC-003: Remove Joke from Setlist**
- **Given:** User has joke in setlist
- **When:** User clicks remove/delete button
- **Then:** Joke is removed from setlist
- **Then:** Remaining jokes adjust positions
- **Then:** Change persists and syncs to other users

### Real-Time Collaborative Features
**UC-004: View Comments on Joke**
- **Given:** User clicks on a joke in setlist
- **When:** Joke detail modal opens
- **Then:** All existing comments display correctly
- **Then:** Comments show author and timestamp
- **Then:** Comments load within 2 seconds

**UC-005: Add Comment to Joke**
- **Given:** User is viewing joke details
- **When:** User types comment and clicks submit
- **Then:** Comment appears immediately with "sending" indicator
- **Then:** Comment persists and syncs to Firebase
- **Then:** Other users see new comment within 3 seconds
- **Then:** Comment shows correct author attribution

**UC-006: Multi-User Real-Time Sync**
- **Given:** Two users have app open simultaneously
- **When:** User A adds/moves/removes a joke
- **Then:** User B sees change within 3 seconds
- **When:** User B adds a comment
- **Then:** User A sees comment within 3 seconds
- **Then:** No data conflicts or race conditions occur

### State Persistence & Error Handling
**UC-007: Offline/Online State Management**
- **Given:** User makes changes while offline
- **When:** Connection is restored
- **Then:** Changes sync to Firebase correctly
- **Then:** Conflicts resolve without data loss

**UC-008: Firebase Connection Errors**
- **Given:** Firebase connection fails during operation
- **When:** User attempts drag operation
- **Then:** User sees appropriate error message
- **Then:** Local state remains consistent
- **Then:** Operation retries when connection restored

**UC-009: Data Validation & Consistency**
- **Given:** Multiple users editing simultaneously
- **When:** Conflicting operations occur
- **Then:** Firebase rules prevent invalid states
- **Then:** UI shows consistent data to all users
- **Then:** No jokes are lost or duplicated

### Performance & UX Requirements
**UC-010: Drag Performance**
- **Given:** Setlist with 20+ jokes
- **When:** User drags joke to new position
- **Then:** Animation completes within 300ms
- **Then:** No UI lag or stuttering occurs
- **Then:** Smooth "parting waters" effect

**UC-011: Firebase Sync Performance**
- **Given:** Large setlist with extensive comments
- **When:** User opens application
- **Then:** Initial data loads within 3 seconds
- **Then:** Real-time updates process within 3 seconds
- **Then:** UI remains responsive during sync

### Cross-Browser & Device Support
**UC-012: Mobile Drag Operations**
- **Given:** User on mobile device
- **When:** User performs touch drag operations
- **Then:** Drag works smoothly with touch input
- **Then:** No conflicts with mobile scrolling
- **Then:** Visual feedback appropriate for touch

**UC-013: Browser Compatibility**
- **Given:** User on Chrome, Firefox, Safari, Edge
- **When:** User performs all core operations
- **Then:** All functionality works identically
- **Then:** No browser-specific bugs occur

## Integration-Specific Test Cases

### Firebase State Integration
**INT-001: @dnd-kit + Firebase State Sync**
- **Given:** Drag operation completes
- **When:** Component calls Firebase update
- **Then:** Local state updates optimistically
- **Then:** Firebase confirms write within 2 seconds
- **Then:** Other users receive real-time update
- **Then:** No state inconsistencies occur

**INT-002: Comment System + Drag Operations**
- **Given:** User has joke detail modal open
- **When:** Another user moves that joke in setlist
- **Then:** Modal updates to reflect new position
- **Then:** Comments remain associated with correct joke
- **Then:** No data corruption occurs

**INT-003: Concurrent Drag Operations**
- **Given:** Two users drag different jokes simultaneously
- **When:** Both operations complete
- **Then:** Both changes persist correctly
- **Then:** No race conditions or data loss
- **Then:** Final state consistent across all clients

## Regression Prevention
**REG-001: No Broken Demos**
- **Given:** Unified app is deployed
- **When:** Accessing any URL (root, with parameters)
- **Then:** User sees single, consistent application
- **Then:** No 404 errors or broken functionality
- **Then:** No references to removed demo versions

**REG-002: Feature Flag Methodology**
- **Given:** Future feature development
- **When:** New feature is added
- **Then:** Feature uses feature flag, not separate demo
- **Then:** Main branch remains stable
- **Then:** No architectural fragmentation occurs

## Definition of Done
- [ ] All UC-### user stories pass
- [ ] All INT-### integration tests pass
- [ ] All REG-### regression tests pass
- [ ] Performance benchmarks met
- [ ] Cross-browser testing complete
- [ ] Mobile device testing complete
- [ ] Firebase security rules validate correctly
- [ ] Error handling covers all failure modes
- [ ] Code review completed
- [ ] Documentation updated

## Test Environment Setup
1. Firebase project: comedyapp-eef2d
2. Test accounts: Create 2+ test users for multi-user scenarios
3. Test data: Populate joke bank with 10+ jokes
4. Browser testing: Chrome, Firefox, Safari, Edge latest versions
5. Mobile testing: iOS Safari, Android Chrome
6. Network conditions: Test offline/online transitions

## Success Metrics
- Zero critical bugs in production
- Sub-3 second real-time sync performance
- 99.9% uptime for drag operations
- No user-reported data loss incidents
- Clean, maintainable codebase with single app architecture