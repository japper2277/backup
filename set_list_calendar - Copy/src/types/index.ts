/**
 * TypeScript Type Definitions
 * Comprehensive type safety for the entire application
 */

// Base Entity Types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// User Types
export interface User extends BaseEntity {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isAnonymous: boolean;
  emailVerified: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
}

export interface UserProfile extends BaseEntity {
  userId: string;
  username: string;
  bio?: string;
  location?: string;
  website?: string;
  preferences: UserPreferences;
  stats: UserStats;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto';
  defaultJokeStatus: JokeStatus;
  autoSave: boolean;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  setlistUpdates: boolean;
  comments: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  setlistVisibility: 'public' | 'private' | 'friends';
  allowComments: boolean;
}

export interface UserStats {
  totalJokes: number;
  totalSetlists: number;
  performanceCount: number;
  lastActive: Date;
}

// Joke Types
export type JokeStatus = 'Idea' | 'Workshopping' | 'Tight 5 Ready' | 'Show Ready';

export interface Joke extends BaseEntity {
  title: string;
  text: string; // Matches the component usage
  readinessStatus: JokeStatus; // Matches the component usage
  jokeType: string; // 'One-liner' | 'Story' | 'Observational' etc.
  isClean: boolean;
  estimated_duration: number; // in seconds
  tags: string[];
  notes?: string;
  userId: string;
  archived: boolean;
  performanceHistory: PerformanceRecord[];
}

// Legacy interface for backward compatibility
export interface JokeMetadata {
  wordCount: number;
  estimatedDuration: number; // in seconds
  difficulty: 1 | 2 | 3 | 4 | 5;
  audience: AudienceType[];
  venue: VenueType[];
}

// Joke filtering interface
export interface JokeFilters {
  jokeType?: string;
  readinessStatus?: string;
  isClean?: boolean;
  includeArchived?: boolean;
}

export interface JokeMetadata {
  wordCount: number;
  estimatedDuration: number; // in seconds
  difficulty: 1 | 2 | 3 | 4 | 5;
  audience: AudienceType[];
  venue: VenueType[];
}

export type AudienceType = 
  | 'general' 
  | 'adult' 
  | 'college' 
  | 'corporate' 
  | 'club' 
  | 'family';

export type VenueType = 
  | 'open-mic' 
  | 'club' 
  | 'theater' 
  | 'corporate' 
  | 'private-event' 
  | 'online';

export interface PerformanceRecord {
  date: Date;
  venue: string;
  audience: AudienceType;
  rating: number; // 1-10
  notes?: string;
  duration: number; // actual duration in seconds
}

// Setlist Types
export interface Setlist extends BaseEntity {
  title: string;
  description?: string;
  jokeIds: string[]; // Matches the component usage
  ownerId: string; // Matches the component usage
  isPublic: boolean;
  shareCode?: string;
  permissions: Record<string, SetlistPermission>;
  collaborators: string[]; // user IDs or emails
  tags: string[];
  venue?: string;
  performanceDate?: Date;
  duration: number; // in seconds
  notes?: string;
  status: SetlistStatus;
  version: number;
}

// Setlist permission types
export type SetlistPermission = 'view' | 'comment' | 'edit';

// Setlist sharing interface
export interface SetlistShare {
  setlistId: string;
  shareCode: string;
  permissions: Record<string, SetlistPermission>;
  isPublic: boolean;
  expiresAt?: Date;
}

export type SetlistStatus = 'draft' | 'ready' | 'performed' | 'archived';

export interface SetlistJoke {
  jokeId: string;
  position: number;
  notes?: string;
  estimatedDuration: number;
  isOpener?: boolean;
  isCloser?: boolean;
  transitionNotes?: string;
}

// Collaboration Types
export interface Comment extends BaseEntity {
  content: string;
  userId: string;
  targetType: 'joke' | 'setlist';
  targetId: string;
  parentId?: string; // for replies
  reactions: Reaction[];
  isResolved: boolean;
  mentions: string[]; // user IDs
}

export interface Reaction {
  userId: string;
  type: 'like' | 'laugh' | 'fire' | 'thinking' | 'heart';
  createdAt: Date;
}

export interface SharePermission {
  userId: string;
  role: 'viewer' | 'commenter' | 'editor' | 'owner';
  grantedAt: Date;
  grantedBy: string;
}

// Real-time Collaboration Types
export interface UserPresence {
  userId: string;
  displayName: string;
  photoURL?: string;
  status: 'active' | 'idle' | 'offline';
  currentPage: string;
  cursorPosition?: CursorPosition;
  lastSeen: Date;
}

export interface CursorPosition {
  x: number;
  y: number;
  elementId?: string;
}

export interface CollaborationEvent {
  type: 'join' | 'leave' | 'edit' | 'comment' | 'cursor-move';
  userId: string;
  timestamp: Date;
  data: any;
}

// UI State Types
export interface AppState {
  jokes: Joke[];
  setlists: Setlist[];
  activeSetlist?: Setlist;
  filters: FilterState;
  ui: UIState;
  user: UserProfile | null;
  collaboration: CollaborationState;
}

export interface FilterState {
  search: string;
  status: JokeStatus | 'all';
  tags: string[];
  dateRange: DateRange;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
}

export type SortOption = 
  | 'title' 
  | 'createdAt' 
  | 'updatedAt' 
  | 'status' 
  | 'performance-count';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface UIState {
  sidebarOpen: boolean;
  modalOpen: string | null; // modal type
  selectedJokes: string[];
  draggedJoke: string | null;
  contextMenu: ContextMenuState | null;
  notifications: Notification[];
  loading: LoadingState;
}

export interface ContextMenuState {
  x: number;
  y: number;
  targetId: string;
  targetType: 'joke' | 'setlist';
  actions: ContextAction[];
}

export interface ContextAction {
  label: string;
  icon: string;
  action: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  primary?: boolean;
}

export interface LoadingState {
  global: boolean;
  jokes: boolean;
  setlists: boolean;
  saving: boolean;
  auth: boolean;
}

export interface CollaborationState {
  activeUsers: UserPresence[];
  comments: Comment[];
  pendingChanges: Change[];
  isOnline: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
}

export interface Change {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'joke' | 'setlist' | 'comment';
  entityId: string;
  changes: any;
  timestamp: Date;
  userId: string;
  applied: boolean;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: APIMetadata;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface APIMetadata {
  total?: number;
  page?: number;
  limit?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

// Form Types
export interface JokeFormData {
  title: string;
  content: string;
  status: JokeStatus;
  tags: string[];
  notes?: string;
  isPrivate: boolean;
  metadata: Partial<JokeMetadata>;
}

export interface SetlistFormData {
  title: string;
  description?: string;
  tags: string[];
  targetAudience: AudienceType;
  venue?: string;
  performanceDate?: Date;
  isPublic: boolean;
}

// Event Types
export interface DragEvent {
  jokeId: string;
  sourceIndex: number;
  targetIndex: number;
  sourceContainer: 'joke-bank' | 'setlist';
  targetContainer: 'joke-bank' | 'setlist';
}

// Hook Return Types
export interface UseJokesReturn {
  jokes: Joke[];
  loading: boolean;
  error: Error | null;
  createJoke: (data: JokeFormData) => Promise<Joke>;
  updateJoke: (id: string, data: Partial<JokeFormData>) => Promise<Joke>;
  deleteJoke: (id: string) => Promise<void>;
  searchJokes: (query: string) => Joke[];
  filterJokes: (filters: FilterState) => Joke[];
}

export interface UseSetlistsReturn {
  setlists: Setlist[];
  activeSetlist: Setlist | null;
  loading: boolean;
  error: Error | null;
  createSetlist: (data: SetlistFormData) => Promise<Setlist>;
  updateSetlist: (id: string, data: Partial<SetlistFormData>) => Promise<Setlist>;
  deleteSetlist: (id: string) => Promise<void>;
  setActiveSetlist: (id: string | null) => void;
  addJokeToSetlist: (jokeId: string, position?: number) => Promise<void>;
  removeJokeFromSetlist: (jokeId: string) => Promise<void>;
  reorderSetlist: (fromIndex: number, toIndex: number) => Promise<void>;
}

// Component Props Types
export interface JokeCardProps {
  joke: Joke;
  selected?: boolean;
  draggable?: boolean;
  onClick?: (joke: Joke) => void;
  onEdit?: (joke: Joke) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: JokeStatus) => void;
}

export interface SetlistProps {
  setlist: Setlist;
  editable?: boolean;
  onJokeAdd?: (jokeId: string, position: number) => void;
  onJokeRemove?: (jokeId: string) => void;
  onJokeReorder?: (fromIndex: number, toIndex: number) => void;
}

// Configuration Types
export interface AppConfig {
  firebase: FirebaseConfig;
  features: FeatureFlags;
  limits: AppLimits;
  analytics: AnalyticsConfig;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface FeatureFlags {
  collaboration: boolean;
  comments: boolean;
  sharing: boolean;
  analytics: boolean;
  notifications: boolean;
}

export interface AppLimits {
  maxJokesPerUser: number;
  maxSetlistsPerUser: number;
  maxJokesPerSetlist: number;
  maxCommentLength: number;
  maxTagsPerJoke: number;
}

export interface AnalyticsConfig {
  enabled: boolean;
  trackingId?: string;
  events: string[];
}