# Vercel Production Deployment - Complete Setup Guide

## ✅ Changes Made for Production Readiness

### 1. **Environment Variables** (.env & .env.production)
- Added both prefixed (`DB_HOST`, `DB_PASSWORD`) and (`VITE_` prefixed) versions
- Backend now reads: `process.env.DB_HOST || process.env.VITE_DB_HOST`
- This ensures compatibility with both local dev and Vercel serverless

### 2. **Vercel Configuration** (vercel.json)
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/server.js" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "functions": {
    "api/server.js": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```
- `/api/*` routes now proxy to serverless function `api/server.js`
- Increased timeout from default 10s to 30s for database operations
- Memory set to 1024MB (Hobby plan limit)

### 3. **Backend Setup** (api/server.js)
- Exports app as default for Vercel: `export default app;`
- Uses `/tmp` directory for file uploads in production (Vercel specific)
- Improved database connection logging
- Health check endpoint with diagnostics
- Better error handling

### 4. **Frontend API URL** (src/lib/db.ts)
- Uses relative URL `/api` in production (routes to serverless function)
- Falls back to `http://localhost:3001/api` in local dev
- Eliminates CORS issues by keeping same-origin

### 5. **Database Connection**
- SSL certificate validation: `rejectUnauthorized: false`
- Connection timeout: 5s
- Idle timeout: 30s
- Pool size: 20 (appropriate for serverless)

## 🧪 Testing Your APIs

### Health Check
```bash
# Test database connection
curl https://ramya-portfolio-661993cqk-ramya-lakhani.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-10-24T18:25:00.123Z",
  "environment": "vercel",
  "dbHost": "ep-autumn-feather-...",
  "dbName": "koyebdb"
}
```

### Test POST Request
```bash
# Test profile creation
curl -X POST https://ramya-portfolio-661993cqk-ramya-lakhani.vercel.app/api/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "role": "Developer",
    "bio": "Test bio"
  }'
```

## 📋 Checklist for Production

- [x] Environment variables set in Vercel dashboard
- [x] Database credentials secured (not in git)
- [x] vercel.json configured with correct rewrites and functions
- [x] api/server.js exports app for serverless
- [x] Frontend uses relative `/api` URLs
- [x] Database SSL configured
- [x] Health check endpoint working
- [x] Memory and timeout limits appropriate for plan
- [x] CORS enabled in backend

## 🔧 Common Issues & Solutions

### Issue: "405 Method Not Allowed"
**Solution**: Make sure rewrites are in correct order in vercel.json:
```json
"rewrites": [
  { "source": "/api/(.*)", "destination": "/api/server.js" },
  { "source": "/(.*)", "destination": "/index.html" }
]
```

### Issue: Database Connection Error
**Check**:
1. Verify env vars in Vercel dashboard
2. Test health endpoint: `/api/health`
3. Check Vercel logs: `vercel logs`
4. Ensure DB is accessible from Vercel's IP range

### Issue: 503 Service Unavailable
**Solution**:
- Function timing out: increase `maxDuration` in vercel.json
- Out of memory: Check memory limit not exceeded
- Cold start issue: First request takes longer

### Issue: Image Upload Not Working
**Solution**: 
- Images saved to `/tmp/public/profile-images` in production
- Not persisted across cold starts (Vercel limitation)
- Use external storage (S3, Cloudinary) for production

## 📊 Monitoring

Check Vercel logs in real-time:
```bash
vercel logs --prod
```

Monitor database:
- Koyeb dashboard for connection stats
- Check active connections not exceeding pool max (20)

## 🚀 Deployment Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Pull env vars from Vercel
vercel env pull

# View production logs
vercel logs --prod
```

## 📝 Environment Variables Reference

| Variable | Dev Value | Prod Value | Purpose |
|----------|-----------|-----------|---------|
| DB_HOST | localhost | Koyeb endpoint | Backend database |
| DB_PORT | 5432 | 5432 | PostgreSQL port |
| DB_NAME | portfolio | koyebdb | Database name |
| VITE_API_URL | http://localhost:3001/api | /api | Frontend API endpoint |

---

**Last Updated**: October 24, 2025
**Deployment Status**: ✅ Production Ready
**Production URL**: https://ramya-portfolio-661993cqk-ramya-lakhani.vercel.app
