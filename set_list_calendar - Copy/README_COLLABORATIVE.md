# Collaborative Setlist Builder

A React-based collaborative joke and setlist management application with real-time sharing and commenting features powered by Firebase.

## 🚀 Features

### Phase 1: Core Infrastructure
- ✅ **Firebase Authentication** - Secure user registration and login
- ✅ **Firestore Database** - Cloud-based data storage with real-time sync
- ✅ **User Management** - Profile creation and management
- ✅ **Joke Management** - Add, edit, archive, and organize comedy material
- ✅ **Setlist Creation** - Build and save multiple setlists

### Phase 2: Collaboration (In Progress)
- 🚧 **Setlist Sharing** - Share setlists with other users via email or link
- 🚧 **Real-time Sync** - Live updates when collaborators edit shared setlists
- 🚧 **Permission Levels** - Read-only, comment, or edit access control

### Phase 3: Comment System (Planned)
- 📋 **Comment Mode** - Click jokes to open comment threads
- 📋 **Real-time Chat** - Instant messaging on specific jokes
- 📋 **@Mentions** - Notify specific collaborators
- 📋 **Comment Threading** - Organized discussion threads

### Phase 4: Advanced Features (Planned)
- 📋 **Presence Indicators** - See who's currently viewing/editing
- 📋 **Activity Feed** - Track recent changes and collaborator actions
- 📋 **Offline Support** - Work offline with sync when reconnected
- 📋 **Mobile Optimization** - Touch-friendly collaborative interface

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 16+ and npm 8+
- Firebase project (free tier works fine)

### 1. Firebase Project Setup

1. Go to the [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use an existing one
3. Enable Authentication with Email/Password and Google providers
4. Create a Firestore database in production mode
5. Get your Firebase configuration from Project Settings

### 2. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Firebase configuration in `.env.local`:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_actual_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   # ... other Firebase config values
   ```

### 3. Firestore Security Rules

Deploy the security rules to your Firebase project:

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (select Firestore)
firebase init firestore

# Deploy the security rules
firebase deploy --only firestore:rules
```

The rules are defined in `firestore.rules` and implement:
- Users can only access their own jokes
- Setlist access controlled by owner and shared permissions
- Comment access tied to setlist permissions

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## 🏗️ Architecture Overview

### Frontend (React)
- **Component-based** architecture with hooks
- **CSS-in-JS** styling for consistency
- **Real-time state** management via Firebase listeners
- **Optimistic updates** for better UX

### Backend (Firebase)
```
Firestore Structure:
├── users/{userId}
│   ├── profile data
│   └── jokes/{jokeId}
├── setlists/{setlistId}
│   ├── ownerId, title, jokeIds[]
│   ├── sharedWith[{userId, permission}]
│   └── jokes/{jokeId}/comments/{commentId}
```

### Authentication Flow
1. User signs up/in via Firebase Auth
2. User profile created in Firestore
3. All data operations authenticated and authorized
4. Real-time listeners provide live updates

### Collaboration Model
- **Setlists** can be shared with multiple users
- **Permission levels**: read, comment, edit
- **Real-time sync** via Firestore listeners
- **Conflict resolution** with optimistic updates

## 🔒 Security

- **Authentication required** for all operations
- **Row-level security** via Firestore rules
- **Input validation** on client and server
- **Rate limiting** for comments and sharing
- **No sensitive data** in client-side code

## 🧪 Testing

The app includes comprehensive testing:

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## 🚀 Deployment

### Firebase Hosting (Recommended)

1. Build the production app:
   ```bash
   npm run build
   ```

2. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

### Alternative Deployments
- Vercel, Netlify, or any static hosting service
- Update environment variables for production
- Ensure Firebase project is in production mode

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Check the [Issues](./issues) for common problems
- Review Firebase documentation for configuration help
- Contact the development team for collaboration features

---

**Note**: This is a demonstration of collaborative application architecture. The sharing and commenting features showcase real-time multi-user functionality patterns that can be applied to various collaborative tools.