# Profiles Management System - Complete Guide

## Overview

The Profiles Management System allows you to create and manage multiple profiles that appear on your landing page. Each profile includes name, role, bio, experience, status, and avatar image.

## Features

### Admin Panel (Profiles Tab)
- ✅ Create, Read, Update, Delete profiles
- ✅ Image upload with preview
- ✅ Live preview of profile changes
- ✅ Full form validation
- ✅ Responsive design for all devices

### Landing Page
- ✅ Displays primary profile (first profile in database)
- ✅ Shows profile details: name, role, bio, experience, status
- ✅ Responsive profile card with avatar
- ✅ Dynamic data fetch from database

### Backend API
- ✅ REST API endpoints for all CRUD operations
- ✅ Proper error handling and validation
- ✅ PostgreSQL integration
- ✅ SSL-enabled database connection

## Database Schema

### profiles table

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'Full-Stack Developer',
  bio TEXT NOT NULL,
  experience TEXT,
  status TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Get All Profiles
```
GET /api/profiles
```
Returns all profiles from database.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "full_name": "Ramya Lakhani",
      "role": "Full-Stack Developer",
      "bio": "Passionate developer...",
      "experience": "5 years",
      "status": "Available for freelance",
      "avatar_url": "https://...",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Single Profile
```
GET /api/profiles/:id
```
Returns a specific profile by ID.

### Create Profile
```
POST /api/profiles

Body:
{
  "full_name": "Your Name",
  "role": "Your Role",
  "bio": "Your bio",
  "experience": "X years",
  "status": "Your status",
  "avatar_url": "https://..." (optional)
}
```

### Update Profile
```
PUT /api/profiles/:id

Body: (any of the fields above)
{
  "full_name": "Updated Name",
  "bio": "Updated bio"
}
```

### Delete Profile
```
DELETE /api/profiles/:id
```
Deletes a profile and returns the deleted data.

## How to Use

### In Admin Panel

1. **Go to Profiles Tab**
   - Click on "Profiles" tab in admin dashboard

2. **Create a New Profile**
   - Click "Add New Profile" button
   - Fill in Full Name (required)
   - Enter Role/Title (required)
   - Write Bio/Description (required)
   - Optionally add Experience and Status
   - Upload a profile image
   - Click "Save Profile"

3. **Edit an Existing Profile**
   - Click "Edit" on any profile card
   - Make changes in the form
   - Update profile image if needed
   - Click "Save Profile"

4. **Delete a Profile**
   - Click "Delete" on any profile card
   - Confirm deletion

### On Landing Page

The landing page automatically fetches and displays:
- Primary profile (first profile in database)
- Profile name, role, and bio in hero section
- Experience and status badges if available
- Profile avatar in the flip card

### Code Examples

#### Fetch Profiles (Frontend)
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const response = await fetch(`${API_URL}/profiles`);
const data = await response.json();

if (data.data && data.data.length > 0) {
  const primaryProfile = data.data[0];
  console.log(primaryProfile.full_name); // "Ramya Lakhani"
}
```

#### Create Profile (Frontend)
```typescript
const newProfile = await fetch(`${API_URL}/profiles`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    full_name: 'John Doe',
    role: 'Full-Stack Developer',
    bio: 'Passionate about web development',
    experience: '3 years',
    status: 'Available for hire'
  })
});

const result = await newProfile.json();
console.log(result.data[0].id); // New profile ID
```

## Frontend Components

### ProfilesManager.tsx
Location: `src/components/admin/ProfilesManager.tsx`

Main component for admin profiles management:
- Displays all profiles in a grid
- Form for creating/editing profiles
- Live preview of changes
- Image upload functionality
- CRUD operations

### Updated in AdminDashboard.tsx
Location: `src/components/admin/AdminDashboard.tsx`

Integrated ProfilesManager component in the "Profile" tab.

### Updated in home.tsx
Location: `src/components/pages/home.tsx`

Enhanced landing page to:
- Fetch all profiles from API
- Display primary profile details
- Show experience and status badges
- Load profile avatar dynamically

## Server Routes

Location: `server.js` (Lines: 161-254)

All profiles API routes include:
- Input validation
- Error handling
- Response formatting
- Database error catching

## Testing

### Test Database Connection
```bash
node test-app-connection.js
```

### Test Profiles API
```bash
node test-profiles-api.js
```

This will:
1. Fetch all profiles
2. Create a test profile
3. Update the profile
4. Fetch single profile
5. Delete the profile
6. Verify final state

## Features Detail

### Form Validation
- ✅ Full Name - Required, alphanumeric
- ✅ Role/Title - Required, text
- ✅ Bio - Required, textarea support
- ✅ Experience - Optional, text
- ✅ Status - Optional, text

### Image Handling
- ✅ Supported formats: JPEG, PNG, GIF, WebP
- ✅ Max file size: 10MB
- ✅ Auto-preview on select
- ✅ Optional field (profile can exist without image)
- ✅ URL stored in database

### Responsive Design
- ✅ Mobile: Single column layout
- ✅ Tablet: 2-column grid
- ✅ Desktop: 3-column grid
- ✅ Admin form: 2-column on desktop, single on mobile

## Environment Variables

Required for API to work:
```
VITE_API_URL=http://localhost:3001/api
```

Database credentials (automatically used):
```
VITE_DB_HOST=ep-polished-lab-adhp3zd2-pooler.c-2.us-east-1.aws.neon.tech
VITE_DB_PORT=5432
VITE_DB_NAME=neondb
VITE_DB_USER=neondb_owner
VITE_DB_PASSWORD=...
```

## Best Practices

1. **Always validate data** - The frontend validates before sending, server validates again
2. **Use meaningful descriptions** - Bio and experience should clearly describe the profile
3. **Consistent naming** - Keep profile names and roles professional
4. **Regular backups** - Make sure to backup profile data regularly
5. **Test before deploying** - Run test scripts before production deployment

## Troubleshooting

### Profiles not showing on landing page
1. Check if server is running on port 3001
2. Verify VITE_API_URL is set correctly
3. Check browser console for API errors
4. Ensure profiles exist in database

### API returns 404
1. Verify profile ID is correct
2. Check if profile was deleted
3. Look at server logs for details

### Image upload fails
1. Check file size (max 10MB)
2. Verify file format (JPEG, PNG, GIF, WebP)
3. Check storage permissions
4. Look at browser console for errors

### Database connection errors
1. Verify database credentials in .env
2. Check if database is online
3. Ensure SSL connection is working
4. Run `node test-app-connection.js` to diagnose

## Future Enhancements

- [ ] Multiple image gallery per profile
- [ ] Social media links per profile
- [ ] Profile categories/types
- [ ] Profile publish/draft status
- [ ] Profile search and filter
- [ ] Profile sharing/export
- [ ] Analytics on profile views

## Files Modified

1. **Created:**
   - `src/components/admin/ProfilesManager.tsx` - Main profiles management component
   - `test-profiles-api.js` - API testing script

2. **Updated:**
   - `server.js` - Added profiles API routes (GET, POST, PUT, DELETE)
   - `src/components/admin/AdminDashboard.tsx` - Integrated ProfilesManager
   - `src/components/pages/home.tsx` - Enhanced to fetch and display profiles

3. **Database:**
   - `profiles` table (already exists, optimized for new functionality)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the code comments
3. Check server logs for detailed errors
4. Run test scripts to diagnose issues
5. Review API responses in browser DevTools

---

**Last Updated:** October 24, 2025
**Version:** 1.0
