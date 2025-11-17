-- Complete Supabase Schema for Yield Ranker with Guest/Premium/Admin Tiers
-- Run this for NEW installations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table with three-tier system
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'premium' CHECK (role IN ('guest', 'premium', 'admin')),
  is_premium boolean DEFAULT true,
  display_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Focus sections (editable content)
CREATE TABLE focus_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE DEFAULT 'focus',
  title text NOT NULL,
  content_md text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE focus_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Focus sections are viewable by everyone"
  ON focus_sections FOR SELECT
  USING (true);

CREATE POLICY "Admins can edit focus sections"
  ON focus_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Resources table
CREATE TABLE resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('article','video','playlist','tool')),
  title text NOT NULL,
  url text NOT NULL,
  source text,
  tags text[] DEFAULT '{}',
  description text,
  is_featured boolean DEFAULT false,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resources are viewable by everyone"
  ON resources FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage resources"
  ON resources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Favorite lists table (Premium feature - Multiple lists)
CREATE TABLE favorite_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE favorite_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorite lists"
  ON favorite_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorite lists"
  ON favorite_lists FOR ALL
  USING (auth.uid() = user_id);

-- Favorites table (Premium feature)
CREATE TABLE favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  list_id uuid REFERENCES favorite_lists(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, symbol, list_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  USING (auth.uid() = user_id);

-- Create default favorite list for new users
CREATE OR REPLACE FUNCTION create_default_favorite_list()
RETURNS trigger AS $$
DECLARE
  default_list_id uuid;
BEGIN
  INSERT INTO favorite_lists (user_id, name, is_default)
  VALUES (NEW.id, 'My Favorites', true)
  RETURNING id INTO default_list_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY definer;

CREATE TRIGGER create_default_list_on_signup
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_favorite_list();

CREATE INDEX idx_favorites_list_id ON favorites(list_id);
CREATE INDEX idx_favorite_lists_user_id ON favorite_lists(user_id);

-- Saved screeners table (Premium feature)
CREATE TABLE saved_screeners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  filters jsonb NOT NULL,
  weights jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_screeners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own screeners"
  ON saved_screeners FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own screeners"
  ON saved_screeners FOR ALL
  USING (auth.uid() = user_id);

-- ETF data table
CREATE TABLE etfs (
  symbol text PRIMARY KEY,
  name text NOT NULL,
  issuer text,
  pay_day text,
  ipo_price numeric,
  price numeric,
  price_change numeric,
  dividend numeric,
  num_payments int,
  annual_dividend numeric,
  forward_yield numeric,
  standard_deviation numeric,
  weighted_rank int,
  data jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE etfs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ETFs are viewable by everyone"
  ON etfs FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage ETFs"
  ON etfs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role, is_premium)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'display_name',
    'premium',
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY definer;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Helper function to upgrade user to premium
CREATE OR REPLACE FUNCTION upgrade_to_premium(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET role = 'premium', is_premium = true 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY definer;

-- Helper function to make user admin
CREATE OR REPLACE FUNCTION make_admin(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET role = 'admin', is_premium = true 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY definer;

-- Comments for clarity
COMMENT ON TABLE profiles IS 'User profiles with three-tier system: guest, premium, admin';
COMMENT ON COLUMN profiles.role IS 'User tier: premium (default for signups), or admin. Guest status is for non-authenticated users only.';
COMMENT ON COLUMN profiles.is_premium IS 'Legacy field kept for backwards compatibility';
COMMENT ON TABLE favorites IS 'User favorites - Premium feature only';
COMMENT ON TABLE saved_screeners IS 'Custom saved rankings - Premium feature only';

