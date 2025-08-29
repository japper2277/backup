<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Log Your Set</h3>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>
      
      <div class="modal-body">
        <!-- Brain Dump Section -->
        <div class="form-group">
          <label for="brainDump">Brain Dump</label>
          <textarea 
            id="brainDump"
            v-model="brainDump" 
            @input="parseBrainDump"
            placeholder="Venue was The Cellar. Crowd hot. Opener killed. New airplane joke worked but tag needs work. #newmaterial #audition"
            rows="4"
          ></textarea>
        </div>

        <!-- Intelligent Parsing Results -->
        <div class="parsing-results" v-if="brainDump">
          <div class="parsed-item" v-if="parsedVenue">
            <label>Venue:</label>
            <input v-model="parsedVenue" type="text" class="parsed-input">
          </div>
          
          <div class="parsed-item" v-if="parsedTags.length">
            <label>Tags:</label>
            <div class="tags-container">
              <span 
                v-for="tag in parsedTags" 
                :key="tag"
                class="tag"
              >
                {{ tag }}
                <button @click="removeTag(tag)" class="remove-tag">&times;</button>
              </span>
            </div>
          </div>

          <div class="parsed-item">
            <label>Performance Date:</label>
            <input v-model="performanceDate" type="date" class="parsed-input">
          </div>
        </div>

        <!-- Additional Fields -->
        <div class="form-group">
          <label for="goal">Performance Goal</label>
          <input 
            id="goal"
            v-model="goal" 
            type="text" 
            placeholder="e.g., Test new opener, Work on timing"
          >
        </div>

        <div class="form-group">
          <label for="notes">Additional Notes</label>
          <textarea 
            id="notes"
            v-model="notes" 
            placeholder="Any other thoughts about the performance..."
            rows="3"
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeModal">Cancel</button>
        <button class="btn btn-primary" @click="saveSet" :disabled="!brainDump.trim()">
          Save Set
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { api } from '../services/supabase.js'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close', 'saved'])

// Form data
const brainDump = ref('')
const parsedVenue = ref('')
const parsedTags = ref([])
const performanceDate = ref(new Date().toISOString().split('T')[0])
const goal = ref('')
const notes = ref('')

// Intelligent parsing function
function parseBrainDump() {
  const text = brainDump.value.toLowerCase()
  
  // Parse venue (look for common venue patterns)
  const venuePatterns = [
    /the\s+(\w+)/i,
    /at\s+(\w+)/i,
    /(\w+)\s+comedy/i,
    /(\w+)\s+club/i,
    /(\w+)\s+bar/i
  ]
  
  for (const pattern of venuePatterns) {
    const match = brainDump.value.match(pattern)
    if (match) {
      parsedVenue.value = match[0]
      break
    }
  }
  
  // Parse hashtags
  const tagRegex = /#(\w+)/g
  const matches = [...brainDump.value.matchAll(tagRegex)]
  parsedTags.value = matches.map(match => match[1])
}

// Remove a tag
function removeTag(tagToRemove) {
  parsedTags.value = parsedTags.value.filter(tag => tag !== tagToRemove)
}

// Save the set
async function saveSet() {
  try {
    const setData = {
      venue: parsedVenue.value || 'Unknown Venue',
      brainDump: brainDump.value,
      tags: parsedTags.value,
      performanceDate: performanceDate.value,
      goal: goal.value,
      notes: notes.value
    }
    
    const savedSet = await api.saveSet(setData)
    
    if (savedSet) {
      // Reset form
      brainDump.value = ''
      parsedVenue.value = ''
      parsedTags.value = []
      goal.value = ''
      notes.value = ''
      
      emit('saved', savedSet)
      closeModal()
    }
  } catch (error) {
    console.error('Error saving set:', error)
    alert('Failed to save set. Please try again.')
  }
}

// Close modal
function closeModal() {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  padding: 0.25rem;
  border-radius: 0.25rem;
}

.close-btn:hover {
  background: #f1f5f9;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.parsing-results {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.parsed-item {
  margin-bottom: 1rem;
}

.parsed-item:last-child {
  margin-bottom: 0;
}

.parsed-item label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.parsed-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.remove-tag {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.remove-tag:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-footer {
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  color: #374151;
}

.btn-secondary:hover {
  background: #e2e8f0;
}
</style>
