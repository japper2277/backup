<template>
  <div class="joke-library">
    <div class="library-header">
      <h2>Joke Library</h2>
      <button class="add-joke-btn" @click="openAddJokeModal">
        <i class="fas fa-plus"></i>
        Add Joke
      </button>
    </div>

    <div class="library-content">
      <div class="jokes-grid" v-if="jokes.length">
        <div 
          v-for="joke in jokes" 
          :key="joke.id" 
          class="joke-card"
          @click="viewJokeDetails(joke)"
        >
          <div class="joke-text">{{ truncateText(joke.text, 150) }}</div>
          <div class="joke-meta">
            <span class="duration">{{ formatDuration(joke.estimated_duration) }}</span>
            <div class="joke-tags" v-if="joke.tags && joke.tags.length">
              <span 
                v-for="tag in joke.tags.slice(0, 2)" 
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <i class="fas fa-lightbulb"></i>
        <p>No jokes in your library yet. Start building your collection!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// State
const jokes = ref([])

// Methods
function openAddJokeModal() {
  // TODO: Implement add joke modal
  console.log('Opening add joke modal')
}

function viewJokeDetails(joke) {
  // TODO: Implement joke details view
  console.log('Viewing joke:', joke)
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Load data on mount
onMounted(() => {
  // TODO: Load jokes from API
  jokes.value = [
    {
      id: 1,
      text: "Why don't scientists trust atoms? Because they make up everything!",
      estimated_duration: 30,
      tags: ['puns', 'science']
    },
    {
      id: 2,
      text: "I told my wife she was drawing her eyebrows too high. She looked surprised.",
      estimated_duration: 45,
      tags: ['puns', 'relationships']
    }
  ]
})
</script>

<style scoped>
.joke-library {
  max-width: 800px;
  margin: 0 auto;
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.library-header h2 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.add-joke-btn {
  background: #10b981;
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

.add-joke-btn:hover {
  background: #059669;
  transform: translateY(-1px);
}

.jokes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.joke-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.joke-card:hover {
  border-color: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
}

.joke-text {
  color: #1e293b;
  line-height: 1.6;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.joke-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.duration {
  background: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.joke-tags {
  display: flex;
  gap: 0.5rem;
}

.tag {
  background: #e0f2fe;
  color: #0369a1;
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
