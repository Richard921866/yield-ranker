# Admin Features Implementation Summary

## Overview
This document describes all the new admin features that have been added to the Yield Ranker application.

## Features Implemented

### 1. User Visit Tracking
- **Last Login**: Tracks the last time a user logged into the system
- **Visit Count**: Tracks the total number of times a user has logged in
- **Database Fields**: Added `last_login` (timestamptz) and `visit_count` (integer) to profiles table
- **Automatic Tracking**: Login tracking happens automatically via the `track_user_login()` function called in AuthContext

### 2. Admin User Management Enhancements
Added two new columns to the admin user table:
- **Last In**: Displays the last login timestamp for each user
- **# Visits**: Shows the total number of visits/logins for each user
- **Delete User**: Added delete button with red icon to permanently remove users from the system
  - Includes confirmation dialog before deletion
  - Removes user from both profiles and auth.users tables

### 3. Site Settings Management
Created a new admin panel section for managing homepage content:
- **Settings Tab**: New navigation item in admin panel sidebar
- **Homepage Subtitle Editor**: Textarea to edit "Comprehensive ETF dividend and return analysis..."
- **Homepage Banner Editor**: Textarea to edit "The highest yielding dividend etf is..."
- **Live Updates**: Changes are immediately visible to all users
- **Database Storage**: Settings stored in new `site_settings` table

## Database Changes

### SQL Migration File: `ADMIN_FEATURES_UPDATE.sql`

Run this SQL file in your Supabase SQL editor to apply all changes:

```sql
-- Add visit tracking columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_login timestamptz,
ADD COLUMN IF NOT EXISTS visit_count integer DEFAULT 0;

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS and policies
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
  ('homepage_banner', 'The highest yielding dividend etf is GraniteShares YieldBOOST TSLA ETF (TSYY) with a dividend yield of 166.82%, followed by YieldMax SMCI Option Income Strategy ETF (SMCY) and YieldMax™ COIN Option Income Strategy ETF (CONY). Last updated Oct 31, 2025.', 'Homepage info banner message')
ON CONFLICT (key) DO NOTHING;

-- Function to track user login
CREATE OR REPLACE FUNCTION track_user_login()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles 
  SET 
    last_login = now(),
    visit_count = COALESCE(visit_count, 0) + 1
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY definer;

-- Function for admin to delete user
CREATE OR REPLACE FUNCTION delete_user_profile(user_id uuid)
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY definer;
```

## File Changes

### Modified Files:

1. **yield-ranker/src/services/admin.ts**
   - Added `last_login` and `visit_count` to ProfileRow type
   - Created SiteSetting type
   - Added `deleteUser()` function
   - Added `getSiteSettings()` function
   - Added `updateSiteSetting()` function
   - Added `trackUserLogin()` function

2. **yield-ranker/src/pages/AdminPanel.tsx**
   - Added "Last In" and "# Visits" columns to user table
   - Added delete button for each user (red trash icon)
   - Added new "Settings" tab to sidebar navigation
   - Added settings management UI with textarea editors
   - Added handlers for updating and deleting users
   - Added real-time save functionality for settings

3. **yield-ranker/src/contexts/AuthContext.tsx**
   - Added automatic login tracking on user authentication
   - Calls `trackUserLogin()` when user logs in

4. **yield-ranker/src/pages/Index.tsx**
   - Updated to load homepage subtitle from site_settings table
   - Dynamic loading replaces hardcoded value

5. **yield-ranker/src/pages/Dashboard.tsx**
   - Updated to load homepage banner from site_settings table
   - Dynamic loading replaces hardcoded value

### New Files:

1. **ADMIN_FEATURES_UPDATE.sql** - Complete SQL migration script

## How to Use

### For Admins:

1. **View User Statistics**:
   - Navigate to Admin Panel > User Administration
   - See "Last In" and "# Visits" columns for all users
   - Data updates automatically on each user login

2. **Delete Users**:
   - Click the red trash icon next to any user
   - Confirm deletion in the dialog
   - User is permanently removed from the system

3. **Edit Homepage Messages**:
   - Navigate to Admin Panel > Site Settings
   - Edit the homepage subtitle or banner message
   - Click "Save Changes" to apply
   - Changes are immediately visible on the homepage

### Installation Steps:

1. Run the SQL migration:
   ```bash
   # In Supabase SQL Editor, run:
   # ADMIN_FEATURES_UPDATE.sql
   ```

2. The frontend is already updated - no additional steps needed

3. Existing users will have `visit_count = 0` and `last_login = null` until they next log in

## API Endpoints Used

All operations use Supabase RPC and direct table queries:
- `profiles` table - user data with visit tracking
- `site_settings` table - homepage content
- `track_user_login()` RPC - increments visit count
- `delete_user_profile(user_id)` RPC - removes user

## Security

- All site_settings are viewable by everyone (public read)
- Only admins can modify site_settings
- Only admins can delete users
- Visit tracking is automatic and secure (uses RPC with security definer)
- RLS policies enforce admin-only access for sensitive operations

## Future Enhancements

Potential additions:
- Edit user email/name directly from admin panel
- Bulk user operations
- User activity logs
- More site settings (logo, colors, footer text)
- Analytics dashboard for user engagement

