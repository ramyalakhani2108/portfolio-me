# Admin Credentials Quick Reference

## Default Admin Account

```
Username: Art1204
Password: Art@1204
```

## Quick Commands

### Seed Default Admin
```bash
npm run seed:admin
```

### Add New Admin (Interactive)
```bash
npm run admin:add
```

### Check Admin Users
```bash
psql -h localhost -U postgres -d portfolio -c "SELECT username, full_name, is_active, last_login FROM admins;"
```

### Test Admin Login API
```bash
curl -X POST http://localhost:3001/api/auth/admin/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"Art1204","password":"Art@1204"}'
```

## Admin Page
- **URL**: http://localhost:5173/admin
- **Production**: https://yourdomain.com/admin

## Database Table
```sql
-- View all admins
SELECT * FROM admins;

-- Disable admin
UPDATE admins SET is_active = false WHERE username = 'username';

-- Enable admin
UPDATE admins SET is_active = true WHERE username = 'username';
```

## Files
- Migration: `supabase/migrations/20241018000001_create_admins_table.sql`
- Seed script: `seed-admin.js`
- Add admin script: `add-admin.js`
- API endpoint: `server.js` - `/api/auth/admin/signin`
- Login component: `src/components/admin/AdminLogin.tsx`

## Notes
- Passwords are hashed with bcrypt (10 rounds)
- Admin tokens stored in localStorage as `admin_token`
- Admin user data stored in localStorage as `admin_user`
- Last login timestamp automatically updated on successful login
