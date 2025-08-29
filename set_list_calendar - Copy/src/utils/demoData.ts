/**
 * Demo Data Initialization for Google Team Performance Demo
 * Loads sample jokes into Zustand store to demonstrate performance improvements
 */

import { useSetlistStore } from '../store/useSetlistStore'

export const DEMO_JOKES = [
  {
    id: 'demo-1',
    title: 'Airplane Food Classic',
    content: 'What\'s the deal with airplane food? I mean, come on!',
    duration: 45,
    tags: ['observational', 'travel', 'food'],
    avgRating: 4.2,
    venuePerformances: [
      { venueId: 'venue-1', rating: 4, date: new Date('2024-01-15') },
      { venueId: 'venue-2', rating: 4.5, date: new Date('2024-02-20') }
    ]
  },
  {
    id: 'demo-2', 
    title: 'Dating App Disasters',
    content: 'My dating profile says I\'m 6 feet tall... if you count my hair.',
    duration: 90,
    tags: ['dating', 'self-deprecating', 'modern life'],
    avgRating: 3.8,
    venuePerformances: [
      { venueId: 'venue-3', rating: 4, date: new Date('2024-01-20') }
    ]
  },
  {
    id: 'demo-3',
    title: 'Coffee Shop Psychology', 
    content: 'The barista asked for my name and I said "Batman". She wrote "Kevin".',
    duration: 60,
    tags: ['coffee', 'miscommunication', 'superhero'],
    avgRating: 4.5,
    venuePerformances: []
  },
  {
    id: 'demo-4',
    title: 'Gym Membership Reality',
    content: 'I have a gym membership for the same reason I have a fire extinguisher - just in case.',
    duration: 75,
    tags: ['fitness', 'procrastination', 'health'],
    avgRating: 4.1,
    venuePerformances: [
      { venueId: 'venue-1', rating: 4, date: new Date('2024-02-10') }
    ]
  },
  {
    id: 'demo-5',
    title: 'Smart Home Struggles',
    content: 'My smart home is so smart, it judges my life choices.',
    duration: 120,
    tags: ['technology', 'home', 'artificial intelligence'],
    avgRating: 3.9,
    venuePerformances: [
      { venueId: 'venue-2', rating: 3.5, date: new Date('2024-01-05') },
      { venueId: 'venue-4', rating: 4.2, date: new Date('2024-02-15') }
    ]
  }
]

// Generate additional jokes for performance testing
export const generateDemoJokes = (count: number = 50) => {
  const templates = [
    { title: 'Technology Joke #', content: 'A joke about modern technology...', tags: ['technology', 'modern'] },
    { title: 'Relationship Bit #', content: 'A story about relationships...', tags: ['dating', 'relationships'] },
    { title: 'Work Comedy #', content: 'Something funny about work...', tags: ['work', 'office'] },
    { title: 'Food Humor #', content: 'A bit about food and eating...', tags: ['food', 'eating'] },
    { title: 'Travel Tale #', content: 'A travel experience gone wrong...', tags: ['travel', 'adventure'] }
  ]

  const types = ['One-liner', 'Story', 'Observational'] as const
  const ratings = [3.2, 3.5, 3.8, 4.1, 4.4, 4.7, 5.0]
  const durations = [30, 45, 60, 75, 90, 120, 150, 180]

  return Array.from({ length: count }, (_, i) => {
    const template = templates[i % templates.length]
    return {
      id: `generated-${i + 1}`,
      title: template.title.replace('#', String(i + 1)),
      content: template.content,
      duration: durations[Math.floor(Math.random() * durations.length)],
      tags: [...template.tags, i % 2 === 0 ? 'clean' : 'adult'],
      avgRating: ratings[Math.floor(Math.random() * ratings.length)],
      venuePerformances: Math.random() > 0.5 ? [
        { 
          venueId: `venue-${Math.floor(Math.random() * 5) + 1}`, 
          rating: ratings[Math.floor(Math.random() * ratings.length)], 
          date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) 
        }
      ] : []
    }
  })
}

/**
 * Initialize demo data in Zustand store
 * Call this when performance mode is first enabled
 */
export const initializeDemoData = () => {
  const store = useSetlistStore.getState()
  
  // Check if we already have jokes
  if (Object.keys(store.jokes).length > 0) {
    console.log('Demo data already loaded')
    return
  }
  
  // Add core demo jokes
  console.log('🎭 Loading Google Team Performance Demo Data...')
  store.importJokes(DEMO_JOKES)
  
  // Add additional jokes for performance testing
  const additionalJokes = generateDemoJokes(100)
  store.importJokes(additionalJokes)
  
  // Create a demo setlist
  const demoSetlistId = store.createSetlist('Demo Performance Set')
  
  // Add a few jokes to the setlist
  store.addJokeToSetlist('demo-1', demoSetlistId)
  store.addJokeToSetlist('demo-3', demoSetlistId) 
  store.addJokeToSetlist('demo-5', demoSetlistId)
  
  store.setActiveSetlist(demoSetlistId)
  
  console.log('✅ Demo data loaded:', {
    jokes: Object.keys(store.jokes).length,
    setlists: Object.keys(store.setlists).length,
    activeSetlist: store.activeSetlistId
  })
}

/**
 * Clear all demo data from Zustand store
 */
export const clearDemoData = () => {
  const store = useSetlistStore.getState()
  store.resetStore()
  console.log('🧹 Demo data cleared')
}

/**
 * Check if demo data is loaded
 */
export const isDemoDataLoaded = () => {
  const store = useSetlistStore.getState()
  return Object.keys(store.jokes).length > 0
}