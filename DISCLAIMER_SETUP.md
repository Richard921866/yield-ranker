# Disclaimer Setup Guide

## Quick Setup (5 minutes)

### Step 1: Run SQL Migration
In Supabase SQL Editor, run the updated `ADMIN_FEATURES_UPDATE.sql` file:

```sql
-- This adds the data_last_updated field to site_settings
INSERT INTO site_settings (key, value, description)
VALUES 
  ('data_last_updated', '2025-11-19T07:08:00', 
   'EOD data last updated timestamp (shown in disclaimer)')
ON CONFLICT (key) DO NOTHING;
```

### Step 2: Test the Disclaimer
1. Open your site in a new browser window
2. You should see the disclaimer modal immediately
3. Try these tests:
   - Try to close it (ESC key) - should be blocked
   - Try clicking outside - should be blocked
   - Try to click "Accept" without checkbox - should be disabled
   - Check the box and click "Accept" - should enter site

### Step 3: Test Session Behavior
1. Accept the disclaimer and browse the site
2. Close the browser completely
3. Open the site again
4. Disclaimer should appear again ✓

### Step 4: Update the Timestamp (Admin)
1. Log in as admin
2. Go to Admin Panel (top right menu)
3. Click "Site Settings" in sidebar
4. Find "EOD Data Last Updated"
5. Use the datetime picker to set current date/time
6. Click "Save Changes"
7. Open new browser tab and visit site
8. Disclaimer should show your updated timestamp

## What Changed

### New Disclaimer Features:
- ✅ Appears on EVERY visit (not just signup)
- ✅ Shows for guests AND authenticated users
- ✅ Clear EOD data warnings
- ✅ "Last Updated" timestamp displayed
- ✅ Cannot be bypassed
- ✅ Session-based (reappears each session)

### Admin Panel Updates:
- ✅ New "EOD Data Last Updated" field in Site Settings
- ✅ Datetime picker for easy editing
- ✅ Updates disclaimer immediately

## Usage Instructions

### For Admins:

**Updating Data Timestamp:**
1. Each time you upload new DTR data to the site
2. Go to Admin Panel > Site Settings
3. Update "EOD Data Last Updated" to current time
4. Save changes
5. All users will see new timestamp in disclaimer

**Recommended Schedule:**
- Update timestamp whenever you upload new Excel file
- Or set to a daily schedule (e.g., "7:00 AM" each day)
- Timestamp format: MM/DD/YYYY H:MM AM/PM

### For Users:

**First Visit:**
1. Visit site
2. Disclaimer appears
3. Read all sections (scroll down)
4. Check "I have read and understood..." box
5. Click "I Accept - Continue to Site"
6. Browse normally

**Every Subsequent Visit:**
1. Close and reopen browser
2. Disclaimer appears again
3. Must accept again each session

## Troubleshooting

### Disclaimer not appearing?
- Clear browser cache and cookies
- Hard refresh (Ctrl+Shift+R)
- Try incognito/private window
- Check browser console for errors

### Can't accept disclaimer?
- Make sure checkbox is checked
- Button should become blue when enabled
- Try refreshing page

### Timestamp not updating?
- Check that SQL migration ran successfully
- Verify setting exists in Supabase `site_settings` table
- Clear browser cache
- Check Network tab for API errors

### Guests not seeing disclaimer?
- Disclaimer should appear for everyone
- Check if sessionStorage is enabled in browser
- Try different browser

## Customization

### To Change Disclaimer Text:
1. Edit `src/components/DisclaimerModal.tsx`
2. Modify the JSX content
3. Redeploy application

### To Add More Settings:
1. Add new row to `site_settings` table
2. Add field in `AdminPanel.tsx` settings section
3. Reference in appropriate component

### To Change Acceptance Duration:
Currently uses sessionStorage (clears on browser close).
To make it daily instead:
1. Use localStorage instead of sessionStorage
2. Store timestamp with acceptance
3. Check if 24 hours have passed

## Security Considerations

### Current Implementation:
- Session-based (most protective)
- Cannot be bypassed
- No server-side tracking (privacy-friendly)
- No user data collected

### Potential Enhancements:
- Log acceptance to database (with user ID if logged in)
- Add IP address logging for liability
- Store timestamp of each acceptance
- Generate acceptance reports for legal team

## Legal Compliance

### What This Provides:
✅ Clear notice of data limitations  
✅ Warning about EOD data  
✅ No real-time data claims  
✅ Explicit liability waiver  
✅ Investment risk disclosures  
✅ "Not financial advisor" statement  
✅ User acknowledgment required  
✅ Shows on every visit  

### Recommended Next Steps:
- Have legal counsel review all text
- Consider state-specific requirements
- May need additional disclosures for SEC compliance
- Consider arbitration clause
- May want terms of service link

## Support

### If Issues Occur:
1. Check browser console for errors
2. Verify SQL migration completed
3. Test in incognito mode
4. Clear all site data
5. Check Supabase database directly

### Common Issues:
- **Modal shows but can't interact**: Z-index conflict with other components
- **Timestamp shows default**: Database setting not created
- **Doesn't reappear**: sessionStorage being persisted somehow
- **Layout issues on mobile**: Check responsive breakpoints

## File Reference

### Disclaimer Component:
`src/components/DisclaimerModal.tsx`

### App Integration:
`src/App.tsx` (lines 43-44, 93-95)

### Admin Panel:
`src/pages/AdminPanel.tsx` (lines 767-842)

### Database Migration:
`ADMIN_FEATURES_UPDATE.sql` (line 38)

### Documentation:
- `DISCLAIMER_IMPLEMENTATION.md` - Full technical details
- `DISCLAIMER_SETUP.md` - This file (setup guide)

## Testing Commands

```bash
# Clear session storage
sessionStorage.clear()

# Check if accepted
sessionStorage.getItem('disclaimer_accepted')

# Manually set accepted (for testing)
sessionStorage.setItem('disclaimer_accepted', 'true')

# Force reload
location.reload()
```

## Deployment Checklist

Before going live:
- [ ] SQL migration run on production database
- [ ] Disclaimer text reviewed by legal counsel
- [ ] Tested in all major browsers
- [ ] Tested on mobile devices
- [ ] Admin can update timestamp successfully
- [ ] Timestamp displays correctly
- [ ] Session behavior works (reappears on new session)
- [ ] Cannot be bypassed
- [ ] Accessible (screen reader tested)
- [ ] Legal team sign-off obtained

