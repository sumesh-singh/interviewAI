-- Create user question sets table
CREATE TABLE IF NOT EXISTS user_question_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  industry TEXT,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user question sets
CREATE INDEX IF NOT EXISTS idx_user_question_sets_user_id ON user_question_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_question_sets_updated_at ON user_question_sets(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_question_sets_difficulty ON user_question_sets(difficulty);

-- Enable Row Level Security
ALTER TABLE user_question_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their question sets" ON user_question_sets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their question sets" ON user_question_sets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their question sets" ON user_question_sets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their question sets" ON user_question_sets
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger to maintain updated_at column
CREATE TRIGGER update_user_question_sets_updated_at
  BEFORE UPDATE ON user_question_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create user questions table
CREATE TABLE IF NOT EXISTS user_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id UUID NOT NULL REFERENCES user_question_sets(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  follow_ups TEXT[] DEFAULT '{}'::TEXT[],
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_type TEXT NOT NULL CHECK (question_type IN ('behavioral', 'technical', 'situational')),
  time_limit INTEGER,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user questions
CREATE INDEX IF NOT EXISTS idx_user_questions_set_id ON user_questions(set_id);
CREATE INDEX IF NOT EXISTS idx_user_questions_difficulty ON user_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_user_questions_question_type ON user_questions(question_type);

-- Enable Row Level Security
ALTER TABLE user_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their questions" ON user_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_question_sets
      WHERE user_question_sets.id = user_questions.set_id
        AND user_question_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert questions into their sets" ON user_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_question_sets
      WHERE user_question_sets.id = user_questions.set_id
        AND user_question_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their questions" ON user_questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_question_sets
      WHERE user_question_sets.id = user_questions.set_id
        AND user_question_sets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_question_sets
      WHERE user_question_sets.id = user_questions.set_id
        AND user_question_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their questions" ON user_questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_question_sets
      WHERE user_question_sets.id = user_questions.set_id
        AND user_question_sets.user_id = auth.uid()
    )
  );

-- Trigger to maintain updated_at column
CREATE TRIGGER update_user_questions_updated_at
  BEFORE UPDATE ON user_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
