/**
 * Demo data utilities for performance testing
 */

let demoDataInitialized = false;

export const isDemoDataLoaded = () => demoDataInitialized;

export const initializeDemoData = () => {
  if (demoDataInitialized) return;
  
  const demoJokes = [
    {
      id: 'demo-1',
      title: 'Airport Security',
      content: 'I love how airport security makes you take your shoes off. Like terrorists are going to hide bombs in their Crocs.',
      duration: 45,
      tags: ['travel', 'observational'],
      jokeType: 'Observational',
      readinessStatus: 'Show Ready',
      isClean: true,
      createdAt: new Date('2024-01-15').toISOString()
    },
    {
      id: 'demo-2', 
      title: 'Gym Membership',
      content: 'I bought a gym membership. I use it as an expensive key chain.',
      duration: 30,
      tags: ['fitness', 'self-deprecating'],
      jokeType: 'One-liner',
      readinessStatus: 'Tight 5 Ready',
      isClean: true,
      createdAt: new Date('2024-02-01').toISOString()
    },
    {
      id: 'demo-3',
      title: 'Dating Apps',
      content: 'Dating apps are like job interviews, except you lie about different things.',
      duration: 35,
      tags: ['dating', 'technology'],
      jokeType: 'Observational',
      readinessStatus: 'Workshopping',
      isClean: true,
      createdAt: new Date('2024-02-10').toISOString()
    },
    {
      id: 'demo-4',
      title: 'Cooking Shows',
      content: 'Watching cooking shows while eating cereal is the adult equivalent of watching porn.',
      duration: 40,
      tags: ['food', 'adult'],
      jokeType: 'Observational',
      readinessStatus: 'Idea',
      isClean: false,
      createdAt: new Date('2024-02-15').toISOString()
    },
    {
      id: 'demo-5',
      title: 'Self-Checkout',
      content: 'Self-checkout machines are just grocery stores making customers do unpaid labor while pretending its convenient.',
      duration: 50,
      tags: ['retail', 'society'],
      jokeType: 'Observational',
      readinessStatus: 'Show Ready',
      isClean: true,
      createdAt: new Date('2024-03-01').toISOString()
    }
  ];
  
  // Add demo jokes to Zustand store if available
  if (typeof window !== 'undefined' && window.useSetlistStore) {
    const store = window.useSetlistStore.getState();
    demoJokes.forEach(joke => {
      store.addJoke(joke);
    });
  }
  
  demoDataInitialized = true;
  console.log('🎭 Demo data initialized with', demoJokes.length, 'jokes');
  
  return demoJokes;
};

export const getDemoJokes = () => {
  if (!demoDataInitialized) {
    return initializeDemoData();
  }
  
  // Return from store if available
  if (typeof window !== 'undefined' && window.useSetlistStore) {
    const store = window.useSetlistStore.getState();
    return Object.values(store.jokes);
  }
  
  return [];
};