# ✅ Profile Management System - Complete Local Image Upload Implementation

## Problem Summary
The profile creation was failing because:
1. The profiles table had an incorrect foreign key constraint linking id to auth_users.id
2. Image uploads needed to be saved locally to /public/profile-images instead of using cloud storage
3. The ProfilesManager component needed to be updated to handle file uploads properly

## What Was Fixed

### 1. Server-Side Changes (server.js)

#### ✅ Added Multer Configuration
- Configured multer for file uploads with 10MB size limit
- Supported formats: JPEG, PNG, GIF, WebP
- Files saved to: `public/profile-images/`
- Unique filenames using UUID

#### ✅ Added File Upload Endpoint
```
POST /api/upload
```
- Accepts multipart/form-data with file field
- Saves to public/profile-images folder
- Returns URL: `/public/profile-images/{filename}`
- Stores path in database via avatar_url field

#### ✅ Fixed UUID Generation
- Replaced `require('crypto').randomUUID()` with proper `uuid v4` import
- UUIDs now generate correctly without null issues

#### ✅ Fixed POST /api/profiles Endpoint
- Uses proper UUID v4 generation
- Includes avatar_url in the insert statement
- All parameters properly validated

#### ✅ Added Migration Endpoint
```
GET /api/migrate/fix-profiles-fk
```
- Removes incorrect foreign key constraint
- Allows profiles table to have independent IDs

#### ✅ Static File Serving
- Added `app.use('/public', express.static())` 
- Allows serving uploaded images directly from `/public` folder

### 2. Frontend Changes (ProfilesManager.tsx)

#### ✅ Updated Form Data Interface
- Added `avatar_url: string` field to ProfileFormData
- Tracks image URL throughout form lifecycle

#### ✅ New handleImageUpload Function
- Uploads file to `/api/upload` endpoint
- Stores URL in form data
- Shows preview before save
- Validates file type and size
- User sees upload status messages

#### ✅ Updated API Endpoints
- Changed from `/api/db/profiles` to `/api/profiles`
- Uses proper REST endpoints:
  - GET /api/profiles (fetch all)
  - POST /api/profiles (create with avatar_url)
  - PUT /api/profiles/:id (update with avatar_url)

#### ✅ Fixed handleEdit Function
- Includes avatar_url when populating form
- Preview shows existing image

#### ✅ Fixed resetForm Function
- Clears avatar_url on reset
- Properly initializes all fields

### 3. Database & File Structure

#### Created Directories
- `/public/profile-images/` - Stores uploaded profile images locally

#### Database Schema
- profiles table ready with all required fields
- avatar_url stores relative path like `/public/profile-images/uuid.jpg`

---

## How to Complete Setup

### Step 1: Start Your Server
```bash
npm run dev
```

### Step 2: Fix Database Foreign Key (One-time only)
Open your browser and go to:
```
http://localhost:3001/api/migrate/fix-profiles-fk
```

Expected response:
```json
{
  "success": true,
  "message": "Foreign key constraint removed successfully",
  "status": "profiles table is now ready for independent profile records"
}
```

### Step 3: Test Profile Creation

Go to Admin Panel:
```
http://localhost:5173/admin
```

Click on **"Profile"** tab, then:

1. Click **"Add New Profile"**
2. Fill in form:
   - Full Name: "Your Name"
   - Role: "Your Title"
   - Bio: "Your bio"
   - Experience: (optional)
   - Status: (optional)
3. Click **"Upload Image"** to add a profile picture
4. Image uploads to server and shows preview
5. Click **"Save Profile"**

### Step 4: Verify Everything Works

**Landing Page Display:**
- Go to: `http://localhost:5173`
- Profile displays with image
- Experience and status badges visible

**Image Storage:**
- Images stored in: `/public/profile-images/`
- Accessible at: `http://localhost:3001/public/profile-images/{filename}`

---

## File Structure

```
project-root/
├── server.js (UPDATED)
│   ├── Multer configuration
│   ├── /api/upload endpoint
│   ├── /api/migrate/fix-profiles-fk endpoint
│   ├── Fixed UUID generation
│   └── Static file serving for /public
│
├── public/
│   └── profile-images/
│       └── (uploaded images stored here)
│
└── src/components/admin/
    └── ProfilesManager.tsx (UPDATED)
        ├── Image upload to /api/upload
        ├── Form includes avatar_url
        └── Uses /api/profiles endpoints
```

---

## API Endpoints

### Upload Image
```
POST /api/upload
Content-Type: multipart/form-data

Returns:
{
  "success": true,
  "url": "/public/profile-images/uuid.jpg",
  "filename": "uuid.jpg",
  "size": 102400
}
```

### Create Profile with Image
```
POST /api/profiles
Content-Type: application/json

{
  "full_name": "Name",
  "role": "Title",
  "bio": "Description",
  "experience": "Years",
  "status": "Status",
  "avatar_url": "/public/profile-images/uuid.jpg"
}

Returns:
{
  "success": true,
  "data": [{
    "id": "uuid",
    "full_name": "Name",
    "role": "Title",
    "bio": "Description",
    "experience": "Years",
    "status": "Status",
    "avatar_url": "/public/profile-images/uuid.jpg",
    "created_at": "2025-10-24T...",
    "updated_at": "2025-10-24T..."
  }]
}
```

### Update Profile
```
PUT /api/profiles/:id
Content-Type: application/json

{
  "full_name": "Updated Name",
  "avatar_url": "/public/profile-images/new-uuid.jpg",
  ...
}
```

### Get All Profiles
```
GET /api/profiles

Returns:
{
  "success": true,
  "data": [...]
}
```

### Delete Profile
```
DELETE /api/profiles/:id

Returns:
{
  "success": true,
  "data": [...]
}
```

---

## Image Upload Flow

```
User selects file
    ↓
Frontend validates (type, size)
    ↓
File sent to /api/upload via FormData
    ↓
Server saves to /public/profile-images/
    ↓
Server returns URL: /public/profile-images/{uuid}.{ext}
    ↓
URL stored in form data (avatar_url)
    ↓
User clicks "Save Profile"
    ↓
Profile created with avatar_url in database
    ↓
Image displayed from /public path
```

---

## Testing Profile Creation

### Test 1: Create via API
```bash
curl -X POST http://localhost:3001/api/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "role": "Developer",
    "bio": "Test bio",
    "avatar_url": "/public/profile-images/test.jpg"
  }'
```

### Test 2: Create via Admin Panel
1. Go to Admin → Profile tab
2. Fill form
3. Upload image
4. Save

### Test 3: Verify Landing Page
1. Go to home page
2. See profile displayed
3. Image loads correctly

---

## Troubleshooting

### Problem: Image upload fails
**Solution:**
- Check file size < 10MB
- Check file format (JPEG, PNG, GIF, WebP)
- Check if /public/profile-images/ directory exists
- Check server logs for multer errors

### Problem: Profile not saving
**Solution:**
- Run migration endpoint: `/api/migrate/fix-profiles-fk`
- Check server logs for database errors
- Verify .env database credentials

### Problem: Image not displaying
**Solution:**
- Check if image file exists in /public/profile-images/
- Check browser console for 404 errors
- Verify avatar_url path is correct in database

### Problem: Cannot find profiles
**Solution:**
- Check if server is running on port 3001
- Check if database is connected
- Run test: `curl http://localhost:3001/api/health`

---

## Important Notes

✅ **All images stored locally** - No cloud dependencies  
✅ **Public folder serving enabled** - Images accessible via HTTP  
✅ **UUID for unique filenames** - No collisions  
✅ **10MB file size limit** - Prevents large uploads  
✅ **Proper error handling** - User sees clear messages  
✅ **Database integration** - URLs persisted with profiles  

---

## Environment Variables Required

In your `.env` file:
```
VITE_DB_HOST=your-host
VITE_DB_PORT=5432
VITE_DB_NAME=neondb
VITE_DB_USER=your-user
VITE_DB_PASSWORD=your-password
VITE_API_URL=http://localhost:3001/api
```

---

## Summary

Your portfolio now has:
✅ **Local Image Storage** - Images saved to /public/profile-images/
✅ **Dynamic Profile Creation** - From admin panel
✅ **Image Upload** - Direct to server folder
✅ **Database Persistence** - All data stored in PostgreSQL
✅ **Landing Page Display** - Profiles show with images
✅ **No Cloud Dependencies** - 100% self-hosted

**Ready to use!** Start with: `npm run dev`

Then:
1. Fix database via: `/api/migrate/fix-profiles-fk`
2. Create profiles in admin panel
3. See them on landing page with images

---

*All files updated: server.js, ProfilesManager.tsx*  
*Packages installed: multer, uuid*  
*Ready for production!*
