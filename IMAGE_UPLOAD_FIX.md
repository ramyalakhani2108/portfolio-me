# Image Upload Fix - PostgreSQL Base64 Storage

## Problem
When uploading images and saving profiles, PostgreSQL was throwing:
```
index row requires X bytes, maximum size is 8191
```

This happened because base64-encoded images (typically 1-2MB when encoded) were being stored in the `avatar_url` column which had an index. PostgreSQL indexes have a size limit of 8191 bytes per row.

## Solution
We've implemented a solution that:

1. **Creates a new `image_data` TEXT column** without any indexes - for storing large base64 images
2. **Removes indexes from `avatar_url`** - allowing small text values only
3. **Stores base64 images in `image_data`** - avoiding index size limits
4. **Displays images from `image_data`** - in the admin panel and on the landing page

## Implementation Steps

### Step 1: Run Migration Endpoint
Before using the new image upload feature, you need to set up the database schema:

```bash
curl "http://localhost:3001/api/migrate/fix-image-storage"
```

Expected response:
```json
{
  "success": true,
  "message": "Image storage fixed: image_data column added, avatar_url index removed",
  "status": "Large base64 images can now be stored without index size errors"
}
```

### Step 2: How Image Upload Works

**Frontend (ProfilesManager.tsx):**
1. User selects image from file input
2. Image is converted to base64 using FileReader
3. Base64 data is stored in `formData.image_data`
4. Preview is shown immediately (no server round-trip needed)
5. When user clicks "Save Profile", the base64 is sent to backend

**Backend (server.js):**
1. Receives `image_data` field in POST/PUT request
2. Stores base64 directly in the `image_data` column (no indexing issues)
3. Returns profile data with image_data included

**Display:**
1. Frontend receives profile data with `image_data` field
2. Displays image directly using data URI: `<img src={profile.image_data} />`

### Step 3: Update ProfilesManager Display
To show images from the new `image_data` field:

```tsx
// In ProfilesManager.tsx, update image display:
const imageUrl = profile.image_data || profile.avatar_url;
<img src={imageUrl} alt="profile" />
```

## Database Schema Changes

### Before:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  full_name VARCHAR(255),
  avatar_url TEXT,  -- ❌ Had index, couldn't store large base64
  ...
);

CREATE INDEX idx_profiles_avatar_url ON profiles(avatar_url);  -- ❌ Caused errors
```

### After:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  full_name VARCHAR(255),
  avatar_url TEXT,      -- ✅ No index, small URLs only
  image_data TEXT,      -- ✅ No index, stores large base64
  ...
);

-- avatar_url index was dropped
-- image_data has NO index (intentionally)
```

## API Endpoints

### Upload Image (from admin panel)
```
POST /api/upload
Body: {
  "base64Data": "data:image/png;base64,iVBORw0KG...",
  "fileName": "profile.png",
  "fileType": "image/png"
}
```

### Create Profile with Image
```
POST /api/profiles
Body: {
  "full_name": "Ramya Lakhani",
  "role": "Full Stack Developer",
  "bio": "...",
  "image_data": "data:image/png;base64,iVBORw0KG...",
  ...
}
```

### Update Profile Image
```
PUT /api/profiles/{id}
Body: {
  "image_data": "data:image/png;base64,iVBORw0KG...",
  ...
}
```

### Get Profiles (with images)
```
GET /api/profiles
GET /api/profiles?activeOnly=true

Response:
{
  "success": true,
  "data": [
    {
      "id": "...",
      "full_name": "Ramya Lakhani",
      "image_data": "data:image/png;base64,iVBORw0KG...",
      ...
    }
  ]
}
```

## Testing

### Local Testing
1. Run migration: `curl "http://localhost:3001/api/migrate/fix-image-storage"`
2. Go to Admin Panel > Profiles
3. Create/Edit a profile
4. Upload an image
5. Verify preview shows correctly
6. Click Save
7. Verify profile was saved with image

### Vercel Testing
After deploying to Vercel:
1. No additional setup needed
2. The migration endpoint will work on Vercel (it's stateless)
3. Images will be stored in PostgreSQL (Neon)
4. No file system dependencies

## Benefits

✅ **Works on Vercel** - No file system dependency  
✅ **No index size limits** - Stores large base64 images  
✅ **Single database** - All data in PostgreSQL  
✅ **Efficient** - No round-trips for image display  
✅ **Portable** - Images move with profiles  
✅ **Backward compatible** - `avatar_url` still available for small URLs  

## Troubleshooting

### "Image not found" Error
- Ensure migration endpoint was run
- Check that `image_data` column exists in profiles table
- Verify images are being saved in `image_data` field

### Still getting index size error
- Run migration endpoint again: `curl "http://localhost:3001/api/migrate/fix-image-storage"`
- Verify index was dropped: `SELECT * FROM pg_indexes WHERE tablename='profiles'`
- If index still exists, drop manually: `DROP INDEX IF EXISTS idx_profiles_avatar_url`

### Images not displaying
- Check if `image_data` field is populated
- Verify base64 data starts with `data:image/`
- Check browser console for CORS or data URI issues

## Migration from Old System

If you have old images stored in `avatar_url`:

1. Run this query to move them:
```sql
UPDATE profiles 
SET image_data = avatar_url 
WHERE image_data IS NULL AND avatar_url LIKE 'data:image/%';
```

2. Clear old avatar URLs:
```sql
UPDATE profiles 
SET avatar_url = NULL 
WHERE avatar_url LIKE 'data:image/%';
```
