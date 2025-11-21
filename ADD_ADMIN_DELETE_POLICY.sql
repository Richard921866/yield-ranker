-- Add DELETE policy for admins to delete user profiles
-- This allows admin users to delete profiles from the admin panel

-- Check if policy already exists and drop it if it does
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Create the DELETE policy for admins
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles' AND policyname = 'Admins can delete profiles';

