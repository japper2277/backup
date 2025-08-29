# Real-time Collaborative Architecture

## Overview
Transform the single-user setlist builder into a real-time collaborative system where multiple users can simultaneously edit jokes and setlists with instant updates.

## Data Models

### Firestore Document Structure
```
/setlists/{setlistId}
├── ownerId: string
├── title: string
├── description: string
├── createdAt: timestamp
├── updatedAt: timestamp
├── sharedWith: array<{userId, permission, joinedAt}>
├── isPublic: boolean

/setlists/{setlistId}/jokes/{jokeId}
├── id: string
├── text: string
├── setup?: string
├── punchline?: string
├── tags: array<string>
├── position: number (for ordering)
├── createdAt: timestamp
├── updatedAt: timestamp
├── authorId: string
├── lastEditedBy: string
├── lastEditedAt: timestamp

/setlists/{setlistId}/presence/{userId}
├── userId: string
├── displayName: string
├── avatar?: string
├── joinedAt: timestamp
├── lastSeen: timestamp
├── isActive: boolean
├── currentlyEditing?: jokeId
```

## Security Rules (Updated)

### Core Principles
1. **Owner Access**: Full CRUD on their setlists
2. **Shared Access**: Based on permission level (read, comment, edit)
3. **Presence Tracking**: All collaborators can read/update presence
4. **Real-time Validation**: Prevent concurrent edit conflicts

### Key Security Rules
```javascript
// Setlist access control
function hasSetlistAccess(setlist, accessType) {
  return isOwner(setlist.ownerId) || 
         (setlist.sharedWith != null && 
          setlist.sharedWith.any(share => 
            share.userId == request.auth.uid && 
            hasPermissionLevel(share.permission, accessType)
          )
         );
}

// Presence rules - collaborators can update their own presence
match /setlists/{setlistId}/presence/{userId} {
  allow read: if hasSetlistAccess(getSetlist(setlistId), 'read');
  allow write: if request.auth.uid == userId && 
                  hasSetlistAccess(getSetlist(setlistId), 'read');
}

// Joke edit tracking
match /setlists/{setlistId}/jokes/{jokeId} {
  allow update: if hasSetlistAccess(getSetlist(setlistId), 'edit') &&
                   request.resource.data.lastEditedBy == request.auth.uid;
}
```

## Real-time Data Flow

### 1. Connection & Presence
```
User joins setlist → Update presence document → Broadcast to all listeners
User leaves/disconnects → Auto-cleanup via onDisconnect → Update presence
```

### 2. Collaborative Editing
```
User edits joke → Optimistic UI update → Firestore write → Real-time broadcast → Other users see change
```

### 3. Conflict Resolution
- **Last Write Wins**: Simple conflict resolution for text edits
- **Edit Locking**: Optional field-level locking for focused edits
- **Activity Indicators**: Show who's currently editing what

## Technology Stack

### Firebase Services
- **Firestore**: Primary database with real-time listeners
- **Firebase Realtime Database**: Presence system (lower latency)
- **Firebase Auth**: User authentication and authorization
- **Firebase Hosting**: Static site hosting

### Client Architecture
- **React**: UI components with real-time state updates
- **Custom Hooks**: useFirestore, usePresence for data management
- **Optimistic Updates**: Immediate UI feedback before server confirmation

## Performance Considerations

### Data Optimization
- **Pagination**: Limit jokes per page to prevent excessive listeners
- **Selective Updates**: Only update changed fields to minimize bandwidth
- **Connection Pooling**: Reuse Firestore connections across components

### Offline Support
- **Firestore Offline**: Cached queries work offline
- **Conflict Resolution**: Handle conflicts when coming back online
- **Local State**: Optimistic updates persist during network issues

## Implementation Phases

### Phase 1: Basic Real-time (Current Sprint)
- ✅ Firebase configuration
- ✅ Security rules
- 🔄 Real-time joke updates
- 🔄 Basic presence system
- 🔄 Avatar stack component

### Phase 2: Enhanced Collaboration
- Edit conflict indicators
- User cursors/selections
- Real-time comments
- Activity feed

### Phase 3: Advanced Features
- Operational transforms for text
- Voice/video integration
- Advanced permissions
- Analytics dashboard

## Success Metrics
- **Latency**: Updates appear within 100ms for same-region users
- **Reliability**: 99.9% uptime for real-time features
- **Scalability**: Support 10+ concurrent users per setlist
- **User Experience**: Seamless collaboration feels natural