# Newsletter Management System Implementation

## Overview
Complete newsletter management system integrated with MailerLite API, allowing admins to create, edit, send newsletters and manage subscribers, while premium users can view newsletter archives.

## Features Implemented

### Backend (Server)

1. **Extended MailerLite Service** (`server/src/services/mailerlite.ts`)
   - `createCampaign()` - Create new newsletter
   - `updateCampaign()` - Edit existing newsletter
   - `sendCampaign()` - Send newsletter to subscribers
   - `getCampaign()` - Get single campaign details
   - `listCampaigns()` - List all campaigns with pagination
   - `removeSubscriber()` - Unsubscribe user from newsletter

2. **Admin API Routes** (`server/src/routes/admin/newsletters.ts`)
   - `GET /api/admin/newsletters` - List all campaigns
   - `GET /api/admin/newsletters/:id` - Get single campaign
   - `POST /api/admin/newsletters` - Create campaign
   - `PUT /api/admin/newsletters/:id` - Update campaign
   - `POST /api/admin/newsletters/:id/send` - Send campaign
   - `POST /api/admin/newsletters/subscribers` - Add subscriber
   - `DELETE /api/admin/newsletters/subscribers/:email` - Remove subscriber
   - All routes require admin authentication

3. **Public Newsletter Routes** (`server/src/routes/newsletter.ts`)
   - `POST /api/newsletter/subscribe` - Public subscription
   - `POST /api/newsletter/unsubscribe` - Public unsubscription

### Frontend (Client)

1. **Admin Newsletter Management** (`src/components/NewsletterManagement.tsx`)
   - Full CRUD interface for newsletters
   - Create/Edit newsletter with HTML and plain text content
   - Send newsletters with confirmation
   - View newsletter history
   - Manage subscribers (add/remove)

2. **Admin Panel Integration** (`src/pages/AdminPanel.tsx`)
   - Added "Newsletters" tab in admin sidebar
   - Integrated NewsletterManagement component
   - Route: `/admin/newsletters`

3. **Public Newsletter Archive** (`src/pages/Newsletters.tsx`)
   - Premium users can view sent newsletters
   - Newsletter archive with date sorting
   - Individual newsletter viewing
   - Route: `/newsletters` (premium only)

4. **Navigation Bar** (`src/components/Header.tsx`)
   - Added "Newsletters" link (premium users only)
   - Visible in both desktop and mobile navigation

5. **Newsletter Admin Service** (`src/services/newsletterAdmin.ts`)
   - Frontend API client for newsletter operations
   - Handles authentication automatically

## Setup Requirements

1. **Environment Variables**
   - `MAILERLITE_API_KEY` - Your MailerLite API key (required)
   - Get from: MailerLite Dashboard → Integrations → API

2. **Dependencies**
   - `@mailerlite/mailerlite-nodejs` v1.5.0 (already installed)

## Testing the API Endpoints

### Prerequisites
1. Server must be running
2. You need an admin user account
3. MailerLite API key must be configured

### Manual Testing Steps

1. **Get Admin Token**
   - Login as admin user in the frontend
   - Open browser DevTools → Application → Local Storage
   - Find the Supabase session token

2. **Test Endpoints Using curl**

```bash
# Set your token
TOKEN="your_admin_token_here"
API_URL="http://localhost:3000"  # or your production URL

# List campaigns
curl -X GET "${API_URL}/api/admin/newsletters" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"

# Create campaign
curl -X POST "${API_URL}/api/admin/newsletters" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Newsletter",
    "subject": "Test Subject",
    "type": "regular",
    "content": {
      "html": "<p>Test HTML content</p>",
      "plain": "Test plain text content"
    },
    "from_name": "Your Name",
    "from_email": "newsletter@yourdomain.com",
    "reply_to": "reply@yourdomain.com"
  }'

# Add subscriber
curl -X POST "${API_URL}/api/admin/newsletters/subscribers" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Remove subscriber
curl -X DELETE "${API_URL}/api/admin/newsletters/subscribers/user@example.com" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

### Testing via Frontend

1. **Admin Panel**
   - Navigate to `/admin/newsletters`
   - Click "New Newsletter" to create
   - Fill in form and save
   - Click "Send" to send newsletter
   - Click "Manage Subscribers" to add/remove subscribers

2. **Public Archive**
   - Login as premium user
   - Click "Newsletters" in nav bar
   - View sent newsletters
   - Click on newsletter to view full content

## API Response Formats

### Campaign Response
```json
{
  "success": true,
  "campaign": {
    "id": "123",
    "name": "Newsletter Name",
    "subject": "Email Subject",
    "type": "regular",
    "content": {
      "html": "<p>HTML content</p>",
      "plain": "Plain text content"
    },
    "status": "draft",
    "created_at": "2025-01-15T10:00:00Z",
    "sent_at": null
  },
  "message": "Campaign created successfully"
}
```

### Campaign List Response
```json
{
  "success": true,
  "campaigns": [
    {
      "id": "123",
      "name": "Newsletter 1",
      "subject": "Subject 1",
      "status": "sent",
      "sent_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

## Notes

- **MailerLite SDK Methods**: The implementation uses the MailerLite Node.js SDK methods. If you encounter errors, verify the SDK version and method names match the official documentation.

- **Campaign Content**: Both HTML and plain text content are supported. HTML is preferred for rich formatting.

- **Subscriber Management**: Admins can add/remove subscribers directly. Public users can subscribe/unsubscribe via the newsletter subscription form.

- **Premium Access**: Newsletter archive is only visible to premium users. Admin functions require admin role.

## Troubleshooting

1. **"Newsletter service is not configured"**
   - Check `MAILERLITE_API_KEY` is set in `.env`
   - Restart server after adding API key

2. **"Admin access required"**
   - Verify user has `role: 'admin'` in profiles table
   - Check authentication token is valid

3. **Campaign methods not working**
   - Verify MailerLite SDK version matches implementation
   - Check MailerLite API documentation for method names
   - Review server logs for detailed error messages

4. **Frontend not loading newsletters**
   - Check user is premium (`is_premium: true`)
   - Verify API URL is correct in frontend
   - Check browser console for errors

## Next Steps

1. Test all endpoints with actual MailerLite account
2. Verify campaign creation and sending works
3. Test subscriber management
4. Verify premium user access to archive
5. Test newsletter viewing on frontend

