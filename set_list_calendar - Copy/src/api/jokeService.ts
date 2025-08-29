/**
 * Joke Service API - Scalable Architecture for 500K+ Jokes
 * 
 * This simulates a real backend with proper pagination, search, and error handling.
 * In production, this would hit actual API endpoints with database queries.
 */

export interface Joke {
  id: string;
  text: string;
  setup?: string;
  punchline?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  authorId: string;
  isPublic: boolean;
  performanceStats?: {
    timesUsed: number;
    avgRating: number;
    venues: string[];
  };
}

export interface SetList {
  id: string;
  title: string;
  description: string;
  jokeIds: string[];
  createdAt: string;
  updatedAt: string;
  authorId: string;
  isPublic: boolean;
  venue?: string;
  performanceDate?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'performanceStats.avgRating' | 'text';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  query?: string;
  tags?: string[];
  authorId?: string;
  isPublic?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  meta: {
    requestTime: number;
    cached: boolean;
  };
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Simulate realistic network latency based on request type
const getNetworkDelay = (operation: string, dataSize: number = 0): number => {
  const baseDelays = {
    'search': 200,
    'fetch': 150,
    'create': 400,
    'update': 300,
    'delete': 200,
    'batch': 600
  };
  
  // Add variable delay based on data size (simulating database query time)
  const variableDelay = Math.min(dataSize * 2, 300);
  
  // Add network jitter (10-30ms)
  const jitter = Math.random() * 20 + 10;
  
  return (baseDelays[operation] || 200) + variableDelay + jitter;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate a large dataset - in production this would be your database
const generateMockJokes = (count: number): Joke[] => {
  const setups = [
    "Why don't scientists trust atoms?",
    "I told my wife she was drawing her eyebrows too high.",
    "I invented a new word:",
    "Why don't eggs tell jokes?",
    "What do you call a fake noodle?",
    "Why did the scarecrow win an award?",
    "I only know 25 letters of the alphabet.",
    "What's the best thing about Switzerland?",
    "How do you organize a space party?",
    "Why can't a bicycle stand up by itself?"
  ];
  
  const punchlines = [
    "Because they make up everything!",
    "She looked surprised.",
    "Plagiarism!",
    "They'd crack each other up!",
    "An impasta!",
    "He was outstanding in his field!",
    "I don't know Y.",
    "I don't know, but the flag is a big plus.",
    "You planet!",
    "It's two tired!"
  ];
  
  const tags = ['observational', 'wordplay', 'puns', 'family', 'work', 'technology', 'dating', 'food', 'travel', 'animals'];
  
  return Array.from({ length: count }, (_, i) => {
    const setupIndex = i % setups.length;
    const punchlineIndex = i % punchlines.length;
    const randomTags = tags.slice(0, Math.floor(Math.random() * 3) + 1);
    
    return {
      id: `joke-${i}`,
      text: `${setups[setupIndex]} ${punchlines[punchlineIndex]}`,
      setup: setups[setupIndex],
      punchline: punchlines[punchlineIndex],
      tags: randomTags,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      authorId: `user-${Math.floor(Math.random() * 100)}`,
      isPublic: Math.random() > 0.3,
      performanceStats: {
        timesUsed: Math.floor(Math.random() * 50),
        avgRating: Math.random() * 5,
        venues: [`Venue ${Math.floor(Math.random() * 20)}`]
      }
    };
  });
};

// Simulate 500K jokes for realistic testing
const ALL_JOKES = generateMockJokes(500000);

console.log(`🎭 Mock database initialized with ${ALL_JOKES.length.toLocaleString()} jokes`);

/**
 * Simulates fetching jokes with pagination, search, and filtering
 * This is what a real API endpoint would look like
 */
export async function getJokes(params: SearchParams): Promise<PaginatedResponse<Joke>> {
  const startTime = performance.now();
  
  // Simulate realistic network delay
  const delay = getNetworkDelay('search', params.limit);
  await sleep(delay);
  
  // Simulate 2% API failure rate
  if (Math.random() < 0.02) {
    throw new APIError({
      code: 'DATABASE_TIMEOUT',
      message: 'Database query timed out. Please try again.',
      details: { query: params.query, timeout: 5000 },
      timestamp: new Date().toISOString()
    });
  }
  
  let filteredJokes = ALL_JOKES;
  
  // Apply search filter
  if (params.query) {
    const query = params.query.toLowerCase();
    filteredJokes = filteredJokes.filter(joke => 
      joke.text.toLowerCase().includes(query) ||
      joke.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }
  
  // Apply tag filter
  if (params.tags && params.tags.length > 0) {
    filteredJokes = filteredJokes.filter(joke =>
      params.tags.some(tag => joke.tags.includes(tag))
    );
  }
  
  // Apply author filter
  if (params.authorId) {
    filteredJokes = filteredJokes.filter(joke => joke.authorId === params.authorId);
  }
  
  // Apply public filter
  if (params.isPublic !== undefined) {
    filteredJokes = filteredJokes.filter(joke => joke.isPublic === params.isPublic);
  }
  
  // Apply sorting
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || 'desc';
  
  filteredJokes.sort((a, b) => {
    let aValue: any = a[sortBy];
    let bValue: any = b[sortBy];
    
    if (sortBy.includes('.')) {
      const keys = sortBy.split('.');
      aValue = keys.reduce((obj, key) => obj?.[key], a);
      bValue = keys.reduce((obj, key) => obj?.[key], b);
    }
    
    if (typeof aValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortOrder === 'asc' 
      ? aValue - bValue
      : bValue - aValue;
  });
  
  // Apply pagination
  const page = Math.max(1, params.page);
  const limit = Math.min(100, Math.max(1, params.limit)); // Cap at 100 items per page
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedJokes = filteredJokes.slice(startIndex, endIndex);
  const total = filteredJokes.length;
  const totalPages = Math.ceil(total / limit);
  
  const endTime = performance.now();
  const requestTime = endTime - startTime;
  
  return {
    data: paginatedJokes,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    },
    meta: {
      requestTime: Math.round(requestTime),
      cached: false // In production, this would indicate if data came from cache
    }
  };
}

/**
 * Create a new joke
 */
export async function createJoke(jokeData: Partial<Joke>): Promise<Joke> {
  const delay = getNetworkDelay('create');
  await sleep(delay);
  
  // Simulate validation errors (5% chance)
  if (Math.random() < 0.05) {
    throw new APIError({
      code: 'VALIDATION_ERROR',
      message: 'Joke text is required and must be at least 10 characters long.',
      details: { field: 'text', value: jokeData.text },
      timestamp: new Date().toISOString()
    });
  }
  
  const newJoke: Joke = {
    id: `joke-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text: jokeData.text || '',
    setup: jokeData.setup,
    punchline: jokeData.punchline,
    tags: jokeData.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: jokeData.authorId || 'current-user',
    isPublic: jokeData.isPublic ?? false,
    performanceStats: {
      timesUsed: 0,
      avgRating: 0,
      venues: []
    }
  };
  
  // Simulate adding to database
  ALL_JOKES.unshift(newJoke);
  
  return newJoke;
}

/**
 * Update an existing joke
 */
export async function updateJoke(id: string, updates: Partial<Joke>): Promise<Joke> {
  const delay = getNetworkDelay('update');
  await sleep(delay);
  
  const jokeIndex = ALL_JOKES.findIndex(joke => joke.id === id);
  
  if (jokeIndex === -1) {
    throw new APIError({
      code: 'NOT_FOUND',
      message: `Joke with ID ${id} not found.`,
      details: { jokeId: id },
      timestamp: new Date().toISOString()
    });
  }
  
  const existingJoke = ALL_JOKES[jokeIndex];
  const updatedJoke = {
    ...existingJoke,
    ...updates,
    id: existingJoke.id, // Prevent ID changes
    createdAt: existingJoke.createdAt, // Prevent creation date changes
    updatedAt: new Date().toISOString()
  };
  
  ALL_JOKES[jokeIndex] = updatedJoke;
  
  return updatedJoke;
}

/**
 * Delete a joke
 */
export async function deleteJoke(id: string): Promise<void> {
  const delay = getNetworkDelay('delete');
  await sleep(delay);
  
  const jokeIndex = ALL_JOKES.findIndex(joke => joke.id === id);
  
  if (jokeIndex === -1) {
    throw new APIError({
      code: 'NOT_FOUND',
      message: `Joke with ID ${id} not found.`,
      details: { jokeId: id },
      timestamp: new Date().toISOString()
    });
  }
  
  // Simulate foreign key constraint check (5% chance of error)
  if (Math.random() < 0.05) {
    throw new APIError({
      code: 'CONSTRAINT_ERROR',
      message: 'Cannot delete joke: it is currently used in active setlists.',
      details: { jokeId: id, activeSetlists: ['setlist-123', 'setlist-456'] },
      timestamp: new Date().toISOString()
    });
  }
  
  ALL_JOKES.splice(jokeIndex, 1);
}

/**
 * Get joke by ID
 */
export async function getJoke(id: string): Promise<Joke> {
  const delay = getNetworkDelay('fetch');
  await sleep(delay);
  
  const joke = ALL_JOKES.find(j => j.id === id);
  
  if (!joke) {
    throw new APIError({
      code: 'NOT_FOUND',
      message: `Joke with ID ${id} not found.`,
      details: { jokeId: id },
      timestamp: new Date().toISOString()
    });
  }
  
  return joke;
}

/**
 * Batch operations for better performance
 */
export async function getJokesById(ids: string[]): Promise<Joke[]> {
  const delay = getNetworkDelay('batch', ids.length);
  await sleep(delay);
  
  return ALL_JOKES.filter(joke => ids.includes(joke.id));
}

// Custom error class for API errors
class APIError extends Error {
  public code: string;
  public details?: Record<string, any>;
  public timestamp: string;
  
  constructor(errorData: { code: string; message: string; details?: Record<string, any>; timestamp: string }) {
    super(errorData.message);
    this.name = 'APIError';
    this.code = errorData.code;
    this.details = errorData.details;
    this.timestamp = errorData.timestamp;
  }
}

export { APIError };