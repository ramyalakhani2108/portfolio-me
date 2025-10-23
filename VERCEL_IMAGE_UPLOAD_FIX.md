# Vercel Image Upload Fix - Base64 Database Storage

## Problem Identified
When uploading profile images on Vercel, the images were appearing to upload successfully but showed "image not found" when saved. This happened because:

1. **Vercel is serverless** - No persistent file system between function invocations
2. **Local file storage doesn't work** - Files written to `/public` during function execution are not persisted
3. **Each deployment resets** - The filesystem is ephemeral and gets cleaned up

## Solution Implemented
Images are now stored as **Base64 data URIs directly in the PostgreSQL database** in the `avatar_url` column.

### Benefits
✅ Works on both local and Vercel deployments  
✅ No file system dependency  
✅ Images persist in database  
✅ Direct data URI display (no extra requests)  
✅ Supports JPEG, PNG, GIF, WebP (10MB max)  

## How It Works

### Frontend (ProfilesManager.tsx)
1. User selects image file
2. File converted to Base64 data URI using `FileReader.readAsDataURL()`
3. Preview displayed immediately (for UX)
4. Base64 data sent to `/api/upload` endpoint
5. Returned Base64 data URI stored in form state
6. When profile saved, Base64 data URI stored in database

### Backend (server.js)
1. `/api/upload` endpoint receives JSON with `base64Data`, `fileName`, `fileType`
2. Validates Base64 format starts with `data:image/`
3. Returns Base64 data URI directly (no file system operations)
4. Data stored in PostgreSQL `profiles.avatar_url` column
5. No local file system operations

### Display (home.tsx)
1. Profile fetched from database with `avatar_url` containing Base64 data URI
2. Data URI can be used directly in `<img src=""` attribute
3. Browser renders the image without additional HTTP requests

## Database Schema
The `profiles` table `avatar_url` column now stores:
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...
```

This is a valid Data URI that can be used directly in HTML.

## Testing the Fix

### Local Testing
```bash
# Start the development servers
npm run dev

# Go to admin panel at http://localhost:5173/admin
# Upload a profile image
# Click Save Profile
# Verify image displays on landing page (http://localhost:5173)
```

### Vercel Testing
1. Push changes to GitHub
2. Vercel auto-deploys
3. Go to your Vercel domain `/admin`
4. Upload a profile image
5. Save profile
6. Verify image displays on landing page
7. Refresh page - image should still display ✓

## Migration from Old System
If you have existing profiles with image URLs like `/public/profile-images/filename.png`:

These will need to be migrated. Create a migration endpoint if needed:
```
GET /api/migrate/convert-images-to-base64
```

However, for a fresh start, simply re-upload images through the admin panel.

## API Endpoints

### POST /api/upload
Converts image to Base64 and returns data URI

**Request:**
```json
{
  "base64Data": "data:image/png;base64,iVBORw0KGgo...",
  "fileName": "profile.png",
  "fileType": "image/png"
}
```

**Response:**
```json
{
  "success": true,
  "url": "data:image/png;base64,iVBORw0KGgo...",
  "fileName": "profile.png",
  "fileType": "image/png",
  "message": "Image processed successfully"
}
```

### POST /api/profiles
Creates/updates profile with Base64 image

**Request:**
```json
{
  "full_name": "Ramya Lakhani",
  "role": "Full Stack Developer",
  "bio": "Passionate developer",
  "avatar_url": "data:image/png;base64,iVBORw0KGgo...",
  "experience": "5 years",
  "status": "Available"
}
```

## Limitations & Considerations

1. **Database Size** - Base64 encoded images are ~33% larger than binary
   - 1MB image ≈ 1.4MB in database
   - Consider compressing before upload if needed

2. **Data URI Size** - Browser/database limits on URI length
   - Most DBs support >100MB text fields
   - 10MB file limit enforced on frontend

3. **Bandwidth** - Full image sent with every profile fetch
   - For large images, consider CDN in future
   - Base64 faster for small images (<2MB) than HTTP requests

## Troubleshooting

**Image not displaying:**
- Check browser console for errors
- Verify `avatar_url` contains valid Base64 data
- Try refreshing the page
- Check PostgreSQL database directly

**Upload failing:**
- Check file size (<10MB)
- Verify file type (JPEG, PNG, GIF, WebP)
- Check network tab in browser DevTools

**Database query slow:**
- Monitor query performance with large images
- Consider storing images in PostgreSQL `bytea` column instead if needed

## Future Improvements

1. **Compression** - Compress images before Base64 encoding
2. **Resizing** - Resize images to standard dimensions
3. **CDN Storage** - For production, consider Cloudinary, AWS S3, etc.
4. **Database Optimization** - Use `bytea` PostgreSQL type instead of text
