# PostgreSQL Migration Checklist

## ✅ Completed

- [x] Removed `@supabase/supabase-js` dependency
- [x] Installed PostgreSQL libraries (`pg`, `bcryptjs`, `dotenv`)
- [x] Created database connection file (`src/lib/db.ts`)
- [x] Created authentication system (`src/lib/auth.ts`)
- [x] Updated environment variables (`.env`)
- [x] Created migration runner script (`migrate.js`)
- [x] Added auth_users table migration
- [x] Updated package.json scripts
- [x] Updated tsconfig.json
- [x] Created compatibility layer in `supabase/supabase.ts`
- [x] Updated `supabase/auth.tsx` to use PostgreSQL
- [x] Updated `src/lib/connection-test.ts`
- [x] Created documentation (MIGRATION_GUIDE.md, MIGRATION_SUMMARY.md, QUICKSTART.md)

## 📋 Your Action Items

### Critical (Do These First)

- [ ] **Update `.env` with your PostgreSQL credentials**
  - Set `VITE_DB_HOST` (usually `localhost`)
  - Set `VITE_DB_PORT` (usually `5432`)
  - Set `VITE_DB_NAME` (e.g., `portfolio_db`)
  - Set `VITE_DB_USER` (e.g., `postgres`)
  - Set `VITE_DB_PASSWORD` (your PostgreSQL password)
  - Set `VITE_JWT_SECRET` (random secure string)

- [ ] **Create PostgreSQL database**
  ```bash
  psql -U postgres
  CREATE DATABASE portfolio_db;
  \q
  ```

- [ ] **Run migrations**
  ```bash
  npm run migrate
  ```

- [ ] **Test the application**
  ```bash
  npm run dev
  ```

### Optional (Improve Performance)

These files still import from `supabase/supabase.ts` (compatibility layer). Update them to import from `src/lib/db.ts` directly:

- [ ] Update `src/components/admin/AdminDashboard.tsx`
  ```typescript
  // Change this:
  import { supabase } from "../../../supabase/supabase";
  
  // To this:
  import { db } from "@/lib/db";
  
  // Then replace all supabase.from() with db.from()
  ```

- [ ] Update `src/components/admin/PortfolioCMS.tsx`
  ```typescript
  import { db } from "@/lib/db";
  ```

- [ ] Update `src/components/admin/HireViewEditor.tsx`
  ```typescript
  import { db } from "@/lib/db";
  ```

- [ ] Update `src/lib/resume-generator.ts`
  ```typescript
  import { db } from "./db";
  ```

- [ ] Update `src/components/ui/chat-widget.tsx`
  ```typescript
  import { db } from "@/lib/db";
  ```

- [ ] Update `src/components/auth/SignUpForm.tsx`
  ```typescript
  import { db, storage } from "@/lib/db";
  ```

### Important Features to Implement

- [ ] **File Storage System**
  - Current placeholder in `src/lib/db.ts`
  - Options:
    - Local filesystem storage
    - AWS S3
    - Cloudinary
    - Other cloud provider
  
- [ ] **Password Reset Flow**
  - Create reset token generation
  - Email sending service
  - Reset password endpoint

- [ ] **Production Database Setup**
  - Connection pooling configuration
  - Environment-specific settings
  - Backup strategy
  - SSL/TLS configuration

### Testing Checklist

- [ ] Authentication
  - [ ] Sign up new user
  - [ ] Sign in existing user
  - [ ] Sign out
  - [ ] Session persistence
  
- [ ] Admin Dashboard
  - [ ] View contacts
  - [ ] View analytics
  - [ ] Manage settings
  
- [ ] Portfolio CMS
  - [ ] Create project
  - [ ] Edit project
  - [ ] Delete project
  - [ ] Create skill
  - [ ] Edit skill
  - [ ] Create experience
  - [ ] Edit experience
  
- [ ] Hire View Editor
  - [ ] Edit sections
  - [ ] Edit skills
  - [ ] Edit experience
  - [ ] Edit contact fields
  
- [ ] Contact Forms
  - [ ] Submit contact form
  - [ ] View submissions in admin

## 📚 Documentation Reference

1. **QUICKSTART.md** - Fastest way to get started
2. **MIGRATION_GUIDE.md** - Detailed setup and troubleshooting
3. **MIGRATION_SUMMARY.md** - Complete list of changes

## 🆘 If You Get Stuck

### Database Connection Issues
```bash
# Test connection
psql -U postgres -d portfolio_db

# If connection fails, check:
# 1. PostgreSQL is running
# 2. Database exists: \l
# 3. Credentials are correct in .env
```

### Migration Errors
```bash
# Check which migrations ran
psql -U postgres -d portfolio_db
SELECT * FROM schema_migrations;

# If stuck, you can manually run a migration:
psql -U postgres -d portfolio_db -f supabase/migrations/[filename].sql
```

### Authentication Issues
```bash
# Check if auth_users table exists
psql -U postgres -d portfolio_db
\d auth_users

# Manually create a test user
INSERT INTO auth_users (email, password, full_name) 
VALUES ('test@example.com', 'hashed_password', 'Test User');
```

## 🎯 Success Criteria

You'll know the migration is complete when:

1. ✅ `npm run migrate` completes without errors
2. ✅ `npm run dev` starts the application
3. ✅ You can sign up a new user
4. ✅ You can sign in with the created user
5. ✅ Admin dashboard loads and displays data
6. ✅ No Supabase-related console errors

## 📞 Support

If you encounter issues:
1. Check the error message carefully
2. Look in the relevant documentation file
3. Search PostgreSQL/pg library documentation
4. Check console logs for detailed error info

---

**Current Status:** 🟡 Migration framework complete, configuration needed
**Next Step:** Update your `.env` file with PostgreSQL credentials!
