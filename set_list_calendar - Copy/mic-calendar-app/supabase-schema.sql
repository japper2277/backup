-- Supabase Database Schema for Mic Calendar Post-Set Intelligence App

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (links to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sets table (core of the app)
CREATE TABLE IF NOT EXISTS sets (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    venue TEXT NOT NULL,
    brain_dump TEXT NOT NULL, -- The raw notes from the comedian
    performance_date DATE NOT NULL,
    tags TEXT[] DEFAULT '{}', -- Array of tags
    goal TEXT, -- Performance goal
    notes TEXT -- Additional notes
);

-- Create jokes table (user's joke library)
CREATE TABLE IF NOT EXISTS jokes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    text TEXT NOT NULL, -- The actual joke
    notes TEXT, -- Notes about the joke
    tags TEXT[] DEFAULT '{}', -- Array of tags
    estimated_duration INTEGER DEFAULT 60, -- Duration in seconds
    is_archived BOOLEAN DEFAULT FALSE
);

-- Create set_jokes table (join table to link jokes to sets)
CREATE TABLE IF NOT EXISTS set_jokes (
    id BIGSERIAL PRIMARY KEY,
    set_id BIGINT NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
    joke_id BIGINT NOT NULL REFERENCES jokes(id) ON DELETE CASCADE,
    order_in_set INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sets_user_id ON sets(user_id);
CREATE INDEX IF NOT EXISTS idx_sets_performance_date ON sets(performance_date);
CREATE INDEX IF NOT EXISTS idx_sets_venue ON sets(venue);
CREATE INDEX IF NOT EXISTS idx_sets_tags ON sets USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_jokes_user_id ON jokes(user_id);
CREATE INDEX IF NOT EXISTS idx_jokes_tags ON jokes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_jokes_archived ON jokes(is_archived);

CREATE INDEX IF NOT EXISTS idx_set_jokes_set_id ON set_jokes(set_id);
CREATE INDEX IF NOT EXISTS idx_set_jokes_joke_id ON set_jokes(joke_id);

-- Create RLS (Row Level Security) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE jokes ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_jokes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Sets policies
CREATE POLICY "Users can view own sets" ON sets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sets" ON sets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sets" ON sets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sets" ON sets
    FOR DELETE USING (auth.uid() = user_id);

-- Jokes policies
CREATE POLICY "Users can view own jokes" ON jokes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jokes" ON jokes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jokes" ON jokes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jokes" ON jokes
    FOR DELETE USING (auth.uid() = user_id);

-- Set jokes policies
CREATE POLICY "Users can view own set jokes" ON set_jokes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sets WHERE sets.id = set_jokes.set_id AND sets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own set jokes" ON set_jokes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sets WHERE sets.id = set_jokes.set_id AND sets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own set jokes" ON set_jokes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sets WHERE sets.id = set_jokes.set_id AND sets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own set jokes" ON set_jokes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM sets WHERE sets.id = set_jokes.set_id AND sets.user_id = auth.uid()
        )
    );

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sets_updated_at BEFORE UPDATE ON sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jokes_updated_at BEFORE UPDATE ON jokes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- INSERT INTO profiles (id, username) VALUES 
--     ('00000000-0000-0000-0000-000000000001', 'demo_user');

-- INSERT INTO sets (user_id, venue, brain_dump, performance_date, tags, goal, notes) VALUES
--     ('00000000-0000-0000-0000-000000000001', 'The Comedy Cellar', 'Crowd was hot tonight! New airplane joke killed, but the tag needs work. #newmaterial #audition', '2024-01-15', ARRAY['newmaterial', 'audition'], 'Test new opener', 'Great energy from the crowd'),
--     ('00000000-0000-0000-0000-000000000001', 'Open Mic Night', 'Tried the coffee rant. Timing was off but the premise landed. Need to work on delivery. #practice #timing', '2024-01-10', ARRAY['practice', 'timing'], 'Work on timing', 'Audience was supportive');

-- INSERT INTO jokes (user_id, text, notes, tags, estimated_duration) VALUES
--     ('00000000-0000-0000-0000-000000000001', 'Why don''t scientists trust atoms? Because they make up everything!', 'Classic pun that always gets a laugh', ARRAY['puns', 'science'], 30),
--     ('00000000-0000-0000-0000-000000000001', 'I told my wife she was drawing her eyebrows too high. She looked surprised.', 'Good for relationship humor', ARRAY['puns', 'relationships'], 45);
