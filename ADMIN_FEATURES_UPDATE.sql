-- Add last_login and visit_count to profiles table

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_login timestamptz,
ADD COLUMN IF NOT EXISTS visit_count integer DEFAULT 0;

-- Create site_settings table for admin-editable content
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings are viewable by everyone"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage site settings"
  ON site_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default homepage messages
INSERT INTO site_settings (key, value, description)
VALUES 
  ('homepage_subtitle', 'Comprehensive ETF dividend and return analysis. Price data sourced from market feeds.', 'Homepage subtitle/description message'),
  ('homepage_banner', 'The highest yielding dividend etf is GraniteShares YieldBOOST TSLA ETF (TSYY) with a dividend yield of 166.82%, followed by YieldMax SMCI Option Income Strategy ETF (SMCY) and YieldMax™ COIN Option Income Strategy ETF (CONY). Last updated Oct 31, 2025.', 'Homepage info banner message'),
  ('data_last_updated', '2025-11-19T07:08:00', 'EOD data last updated timestamp (shown in disclaimer)')
ON CONFLICT (key) DO NOTHING;

-- Function to track user login (callable via RPC)
CREATE OR REPLACE FUNCTION track_user_login()
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET 
    last_login = now(),
    visit_count = COALESCE(visit_count, 0) + 1
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY definer;

-- Function for admin to delete user
CREATE OR REPLACE FUNCTION delete_user_profile(user_id uuid)
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY definer;

COMMENT ON TABLE site_settings IS 'Admin-editable site content like homepage messages';
COMMENT ON COLUMN profiles.last_login IS 'Last time user logged in';
COMMENT ON COLUMN profiles.visit_count IS 'Total number of logins/visits';

