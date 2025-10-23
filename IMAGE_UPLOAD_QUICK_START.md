# Quick Start: Image Upload Fix

## Steps to Fix Image Upload on Vercel

### 1. Update Your Code
All changes have been made to:
- ✅ `server.js` - Added `image_data` support to POST/PUT endpoints
- ✅ `ProfilesManager.tsx` - Changed to use `image_data` field
- ✅ Added migration endpoint for database schema

### 2. Run Migration (IMPORTANT!)
This creates the `image_data` column and removes the problematic index.

**Locally:**
```bash
npm run dev  # Start server if not running
curl "http://localhost:3001/api/migrate/fix-image-storage"
```

**On Vercel (after deployment):**
```bash
curl "https://your-vercel-domain.vercel.app/api/migrate/fix-image-storage"
```

### 3. Test Image Upload Locally

1. Start dev server: `npm run dev`
2. Go to: `http://localhost:5173/admin`
3. Login with credentials:
   - Username: `Art1204`
   - Password: `Art@1204`
4. Click "Profiles" tab
5. Click "Add New Profile" or edit existing
6. Upload an image
7. Verify preview shows image
8. Click "Save Profile"
9. **Expected:** Profile saves without errors, image displays ✅

### 4. Deploy to Vercel

1. Commit changes:
   ```bash
   git add .
   git commit -m "Fix: Use image_data column for base64 images (no index size limit)"
   git push
   ```

2. Vercel will auto-deploy

3. Once deployed, run migration on Vercel:
   ```bash
   curl "https://your-vercel-domain.vercel.app/api/migrate/fix-image-storage"
   ```

4. Test on Vercel:
   - Go to your Vercel domain + `/admin`
   - Try uploading an image
   - Should work without "index size" errors ✅

## What Changed?

| Component | Old Way | New Way |
|-----------|---------|---------|
| Storage | `avatar_url` column (indexed) | `image_data` column (NO index) |
| Data Type | Stored small URLs | Stores large base64 (up to 1GB) |
| Upload Process | File upload to filesystem | Direct base64 in request |
| Vercel Compatibility | ❌ Failed (no filesystem) | ✅ Works (database only) |
| Index Size Limit | ❌ 8KB limit hit | ✅ No index = no limit |

## Troubleshooting

### "Image not found" when saving
**Solution:** Run the migration endpoint if you haven't already
```bash
curl "http://localhost:3001/api/migrate/fix-image-storage"
```

### Image preview shows but save fails
**Solution:** This is likely the index size error. Migration fixes it.

### Images still not working after migration
**Solution:** Restart the server:
```bash
# Kill existing
pkill -f "npm run dev"
# Restart
npm run dev
```

## File References

- **Guide:** `IMAGE_UPLOAD_FIX.md` - Detailed technical documentation
- **Backend:** `server.js` - Lines ~260-340 (POST/PUT endpoints)
- **Frontend:** `src/components/admin/ProfilesManager.tsx` - handleImageUpload function
- **Database:** Migration endpoint at `/api/migrate/fix-image-storage`

## Success Criteria ✅

After following these steps, you should be able to:

1. ✅ Upload images in admin panel
2. ✅ See image preview immediately
3. ✅ Save profile with image without errors
4. ✅ View saved profile with image displayed
5. ✅ All of the above works on Vercel
6. ✅ No "index row requires X bytes" errors

---

**Need Help?** Check `IMAGE_UPLOAD_FIX.md` for detailed explanations!
