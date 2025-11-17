-- Update profiles table to support guest, premium, and admin roles

-- First, update the check constraint to allow the new roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('guest', 'premium', 'admin'));

-- Update existing users from 'user' to 'guest' if they're not premium and not admin
UPDATE profiles 
SET role = 'guest' 
WHERE role = 'user' 
  AND (is_premium = false OR is_premium IS NULL)
  AND role != 'admin';

-- Update existing users from 'user' to 'premium' if they have is_premium = true
UPDATE profiles 
SET role = 'premium' 
WHERE role = 'user' 
  AND is_premium = true
  AND role != 'admin';

-- For new user signups, the default role should be 'premium'
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'premium';

-- Update the handle_new_user function to set default role as 'guest'
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

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update RLS policies for the new role system (no changes needed, they work with any role value)
-- Policies remain the same as they check for specific roles or user ownership

-- Create a function to upgrade a user to premium
CREATE OR REPLACE FUNCTION upgrade_to_premium(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET role = 'premium', is_premium = true 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY definer;

-- Comments for clarity
COMMENT ON COLUMN profiles.role IS 'User role: premium (default for signups), or admin. Guest status is for non-authenticated users only.';
COMMENT ON COLUMN profiles.is_premium IS 'Legacy field - use role instead, but kept for backwards compatibility';

