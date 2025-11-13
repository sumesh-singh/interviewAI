-- Create user scoring weights table
CREATE TABLE IF NOT EXISTS user_scoring_weights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  -- Weight scores (0-1 scale)
  technical_accuracy DECIMAL(3,2) DEFAULT 0.15,
  communication_skills DECIMAL(3,2) DEFAULT 0.20,
  problem_solving DECIMAL(3,2) DEFAULT 0.15,
  confidence DECIMAL(3,2) DEFAULT 0.10,
  relevance DECIMAL(3,2) DEFAULT 0.15,
  clarity DECIMAL(3,2) DEFAULT 0.10,
  structure DECIMAL(3,2) DEFAULT 0.10,
  examples DECIMAL(3,2) DEFAULT 0.05,
  -- Preset used (if any)
  preset_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_scoring_weights_user_id ON user_scoring_weights(user_id);

-- Enable Row Level Security
ALTER TABLE user_scoring_weights ENABLE ROW LEVEL SECURITY;

-- Create policies for user scoring weights
CREATE POLICY "Users can view their own scoring weights" ON user_scoring_weights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own scoring weights" ON user_scoring_weights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scoring weights" ON user_scoring_weights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_scoring_weights_updated_at
  BEFORE UPDATE ON user_scoring_weights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create default weights after user signup
CREATE OR REPLACE FUNCTION create_default_scoring_weights()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_scoring_weights (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-create weights on user signup
DROP TRIGGER IF EXISTS create_weights_on_signup ON auth.users;
CREATE TRIGGER create_weights_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_scoring_weights();
