-- Create scheduled_sessions table for storing scheduled interview practice sessions
CREATE TABLE IF NOT EXISTS scheduled_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_config JSONB NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  calendar_event_id TEXT,
  google_calendar_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_user_id ON scheduled_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_status ON scheduled_sessions(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_start_time ON scheduled_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_calendar_event_id ON scheduled_sessions(calendar_event_id);

-- Enable Row Level Security
ALTER TABLE scheduled_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for scheduled sessions
CREATE POLICY "Users can view their own scheduled sessions" ON scheduled_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled sessions" ON scheduled_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled sessions" ON scheduled_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled sessions" ON scheduled_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_scheduled_sessions_updated_at
  BEFORE UPDATE ON scheduled_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
