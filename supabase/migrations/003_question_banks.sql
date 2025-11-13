-- Create question_banks table
CREATE TABLE IF NOT EXISTS question_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_bank_id UUID NOT NULL REFERENCES question_banks(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('behavioral', 'technical', 'situational')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question TEXT NOT NULL,
  follow_up TEXT[], -- Array of follow-up questions
  tags TEXT[],
  time_limit INTEGER, -- in seconds
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_question_banks_user_id ON question_banks(user_id);
CREATE INDEX idx_questions_bank_id ON questions(question_bank_id);
CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);

-- Enable Row Level Security
ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for question_banks
CREATE POLICY "Users can view their own question banks"
  ON question_banks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public question banks"
  ON question_banks FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert their own question banks"
  ON question_banks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own question banks"
  ON question_banks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own question banks"
  ON question_banks FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for questions
CREATE POLICY "Users can view questions in their banks"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM question_banks
      WHERE question_banks.id = questions.question_bank_id
      AND question_banks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view questions in public banks"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM question_banks
      WHERE question_banks.id = questions.question_bank_id
      AND question_banks.is_public = true
    )
  );

CREATE POLICY "Users can insert questions in their banks"
  ON questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM question_banks
      WHERE question_banks.id = questions.question_bank_id
      AND question_banks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions in their banks"
  ON questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM question_banks
      WHERE question_banks.id = questions.question_bank_id
      AND question_banks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions in their banks"
  ON questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM question_banks
      WHERE question_banks.id = questions.question_bank_id
      AND question_banks.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_question_banks_updated_at
  BEFORE UPDATE ON question_banks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
