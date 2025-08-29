import { createClient } from '@supabase/supabase-js'

// Replace with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database operations
export const api = {
  // Save a new set
  async saveSet(setData) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("User not logged in.")

    const { data, error } = await supabase
      .from('sets')
      .insert({ 
        user_id: user.id,
        venue: setData.venue, 
        brain_dump: setData.brainDump,
        performance_date: setData.performanceDate || new Date(),
        tags: setData.tags || [],
        goal: setData.goal || '',
        notes: setData.notes || ''
      })
      .select()

    if (error) {
      console.error('Error saving set:', error)
      return null
    }

    return data[0]
  },

  // Get all sets for a user
  async getSets() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("User not logged in.")

    const { data, error } = await supabase
      .from('sets')
      .select('*')
      .eq('user_id', user.id)
      .order('performance_date', { ascending: false })

    if (error) {
      console.error('Error fetching sets:', error)
      return []
    }

    return data || []
  },

  // Save a new joke
  async saveJoke(jokeData) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("User not logged in.")

    const { data, error } = await supabase
      .from('jokes')
      .insert({ 
        user_id: user.id,
        text: jokeData.text,
        notes: jokeData.notes || '',
        tags: jokeData.tags || [],
        estimated_duration: jokeData.estimatedDuration || 60
      })
      .select()

    if (error) {
      console.error('Error saving joke:', error)
      return null
    }

    return data[0]
  },

  // Get all jokes for a user
  async getJokes() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("User not logged in.")

    const { data, error } = await supabase
      .from('jokes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching jokes:', error)
      return []
    }

    return data || []
  }
}
