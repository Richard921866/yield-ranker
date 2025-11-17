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

ALTER TABLE favorites ADD COLUMN list_id uuid REFERENCES favorite_lists(id) ON DELETE CASCADE;

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

COMMENT ON TABLE favorite_lists IS 'User-created favorite lists for organizing ETFs';
COMMENT ON COLUMN favorites.list_id IS 'Optional foreign key to favorite_lists - if null, uses default list';

