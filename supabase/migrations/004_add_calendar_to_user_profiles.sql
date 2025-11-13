-- Add calendar connection fields to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS google_calendar_email TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT ENCRYPTED;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS google_calendar_access_token TEXT ENCRYPTED;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS google_calendar_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for calendar queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_calendar_connected ON user_profiles(google_calendar_connected);

-- Create a function to safely clear calendar tokens
CREATE OR REPLACE FUNCTION clear_calendar_tokens(user_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET 
    google_calendar_connected = FALSE,
    google_calendar_email = NULL,
    google_calendar_refresh_token = NULL,
    google_calendar_access_token = NULL,
    google_calendar_token_expires_at = NULL
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
