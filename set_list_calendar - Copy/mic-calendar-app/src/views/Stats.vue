<template>
  <div class="stats-view">
    <div class="stats-header">
      <h2>Performance Stats</h2>
    </div>

    <div class="stats-content">
      <div class="stats-grid">
        <div class="stat-section">
          <h3>Performance Overview</h3>
          <div class="stat-cards">
            <div class="stat-card">
              <div class="stat-number">{{ totalSets }}</div>
              <div class="stat-label">Total Sets</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ thisMonthSets }}</div>
              <div class="stat-label">This Month</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ averageSetsPerMonth }}</div>
              <div class="stat-label">Avg/Month</div>
            </div>
          </div>
        </div>

        <div class="stat-section">
          <h3>Venue Performance</h3>
          <div class="venue-stats">
            <div 
              v-for="venue in topVenues" 
              :key="venue.name"
              class="venue-stat"
            >
              <div class="venue-name">{{ venue.name }}</div>
              <div class="venue-count">{{ venue.count }} sets</div>
            </div>
          </div>
        </div>

        <div class="stat-section">
          <h3>Tag Analysis</h3>
          <div class="tag-stats">
            <div 
              v-for="tag in topTags" 
              :key="tag.name"
              class="tag-stat"
            >
              <div class="tag-name">#{{ tag.name }}</div>
              <div class="tag-count">{{ tag.count }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// State
const sets = ref([])

// Computed
const totalSets = computed(() => sets.value.length)

const thisMonthSets = computed(() => {
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  
  return sets.value.filter(set => {
    const setDate = new Date(set.performance_date)
    return setDate.getMonth() === thisMonth && setDate.getFullYear() === thisYear
  }).length
})

const averageSetsPerMonth = computed(() => {
  if (sets.value.length === 0) return 0
  
  const firstSet = new Date(Math.min(...sets.value.map(s => new Date(s.performance_date))))
  const monthsDiff = (new Date() - firstSet) / (1000 * 60 * 60 * 24 * 30.44)
  
  return Math.round((sets.value.length / monthsDiff) * 10) / 10
})

const topVenues = computed(() => {
  const venueCounts = {}
  sets.value.forEach(set => {
    venueCounts[set.venue] = (venueCounts[set.venue] || 0) + 1
  })
  
  return Object.entries(venueCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

const topTags = computed(() => {
  const tagCounts = {}
  sets.value.forEach(set => {
    if (set.tags) {
      set.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    }
  })
  
  return Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

// Load data on mount
onMounted(() => {
  // TODO: Load sets from API
  sets.value = [
    {
      id: 1,
      venue: 'The Comedy Cellar',
      performance_date: '2024-01-15',
      tags: ['newmaterial', 'audition']
    },
    {
      id: 2,
      venue: 'Open Mic Night',
      performance_date: '2024-01-10',
      tags: ['practice', 'timing']
    },
    {
      id: 3,
      venue: 'The Comedy Cellar',
      performance_date: '2024-01-08',
      tags: ['newmaterial', 'clean']
    }
  ]
})
</script>

<style scoped>
.stats-view {
  max-width: 800px;
  margin: 0 auto;
}

.stats-header {
  margin-bottom: 2rem;
}

.stats-header h2 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stat-section h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  text-align: center;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.venue-stats,
.tag-stats {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
}

.venue-stat,
.tag-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.venue-stat:last-child,
.tag-stat:last-child {
  border-bottom: none;
}

.venue-name,
.tag-name {
  font-weight: 500;
  color: #1e293b;
}

.venue-count,
.tag-count {
  background: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}
</style>
