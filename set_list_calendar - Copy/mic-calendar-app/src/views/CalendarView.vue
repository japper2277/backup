<template>
  <div class="calendar-view">
    <!-- Header Section -->
    <div class="calendar-header">
      <h2>Set History</h2>
      <button class="log-set-btn" @click="openSetLogModal">
        <i class="fas fa-plus"></i>
        Log Set
      </button>
    </div>

    <!-- Quick Stats -->
    <div class="quick-stats">
      <div class="stat-card">
        <div class="stat-number">{{ totalSets }}</div>
        <div class="stat-label">Total Sets</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ thisMonthSets }}</div>
        <div class="stat-label">This Month</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ totalJokes }}</div>
        <div class="stat-label">Jokes in Library</div>
      </div>
    </div>

    <!-- Recent Sets -->
    <div class="recent-sets">
      <h3>Recent Sets</h3>
      <div class="sets-list" v-if="sets.length">
        <div 
          v-for="set in sets" 
          :key="set.id" 
          class="set-card"
          @click="viewSetDetails(set)"
        >
          <div class="set-header">
            <div class="venue-name">{{ set.venue }}</div>
            <div class="set-date">{{ formatDate(set.performance_date) }}</div>
          </div>
          <div class="set-preview">{{ truncateText(set.brain_dump, 100) }}</div>
          <div class="set-tags" v-if="set.tags && set.tags.length">
            <span 
              v-for="tag in set.tags.slice(0, 3)" 
              :key="tag"
              class="tag"
            >
              {{ tag }}
            </span>
            <span v-if="set.tags.length > 3" class="tag-more">
              +{{ set.tags.length - 3 }}
            </span>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <i class="fas fa-calendar-plus"></i>
        <p>No sets logged yet. Click "Log Set" to get started!</p>
      </div>
    </div>

    <!-- Set Log Modal -->
    <SetLogModal 
      :is-open="isSetLogModalOpen"
      @close="closeSetLogModal"
      @saved="onSetSaved"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from '../services/supabase.js'
import SetLogModal from '../components/SetLogModal.vue'

// State
const sets = ref([])
const isSetLogModalOpen = ref(false)

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
const totalJokes = computed(() => 0) // TODO: Implement joke count

// Methods
function openSetLogModal() {
  isSetLogModalOpen.value = true
}

function closeSetLogModal() {
  isSetLogModalOpen.value = false
}

function onSetSaved(newSet) {
  sets.value.unshift(newSet)
}

function viewSetDetails(set) {
  // TODO: Implement set details view
  console.log('Viewing set:', set)
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  })
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Load data on mount
onMounted(async () => {
  try {
    const fetchedSets = await api.getSets()
    sets.value = fetchedSets
  } catch (error) {
    console.error('Error loading sets:', error)
    // For demo purposes, add some sample data
    sets.value = [
      {
        id: 1,
        venue: 'The Comedy Cellar',
        performance_date: '2024-01-15',
        brain_dump: 'Crowd was hot tonight! New airplane joke killed, but the tag needs work. #newmaterial #audition',
        tags: ['newmaterial', 'audition'],
        goal: 'Test new opener',
        notes: 'Great energy from the crowd'
      },
      {
        id: 2,
        venue: 'Open Mic Night',
        performance_date: '2024-01-10',
        brain_dump: 'Tried the coffee rant. Timing was off but the premise landed. Need to work on delivery. #practice #timing',
        tags: ['practice', 'timing'],
        goal: 'Work on timing',
        notes: 'Audience was supportive'
      }
    ]
  }
})
</script>

<style scoped>
.calendar-view {
  max-width: 800px;
  margin: 0 auto;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.calendar-header h2 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.log-set-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.log-set-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
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

.recent-sets h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
}

.sets-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.set-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.set-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.set-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.venue-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.125rem;
}

.set-date {
  color: #64748b;
  font-size: 0.875rem;
}

.set-preview {
  color: #475569;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.set-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.tag-more {
  background: #e2e8f0;
  color: #64748b;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #cbd5e1;
}

.empty-state p {
  font-size: 1.125rem;
  margin: 0;
}
</style>
