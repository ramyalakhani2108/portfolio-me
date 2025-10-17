# Migration from Supabase to PostgreSQL - Setup Guide

This project has been migrated from Supabase to use a local PostgreSQL database. Follow the steps below to set up and run the application.

## Prerequisites

1. **PostgreSQL** installed locally via pgAdmin or command line
2. **Node.js** (v16 or higher)
3. **npm** package manager

## Setup Steps

### 1. Configure PostgreSQL Database

First, make sure PostgreSQL is running on your machine. You can use pgAdmin or the command line.

#### Option A: Using pgAdmin
1. Open pgAdmin
2. Create a new database called `portfolio_db` (or any name you prefer)
3. Note your connection details (host, port, username, password)

#### Option B: Using Command Line
```bash
# Create a new database
createdb portfolio_db

# Or use psql
psql -U postgres
CREATE DATABASE portfolio_db;
\q
```

### 2. Configure Environment Variables

Update the `.env` file in the project root with your PostgreSQL credentials:

```env
# PostgreSQL Database Configuration
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=portfolio_db
VITE_DB_USER=postgres
VITE_DB_PASSWORD=your_password_here

# Gemini API Key (keep this as is)
VITE_GEMINI_API_KEY=AIzaSyDwjDIYVeBqtMun4PG76Jmcwg6kVw26iKc

# JWT Secret for authentication (change to a secure random string)
VITE_JWT_SECRET=your_jwt_secret_here_change_this_to_something_secure
```

**Important:** Replace the placeholder values with your actual PostgreSQL credentials.

### 3. Run Database Migrations

After configuring your environment variables, run the migrations to set up the database schema:

```bash
npm run migrate
```

This will:
- Connect to your PostgreSQL database
- Create all necessary tables (profiles, projects, skills, experiences, etc.)
- Set up the authentication system
- Insert sample data

### 4. Install Dependencies

If you haven't already:

```bash
npm install
```

### 5. Start the Development Server

```bash
npm run dev
```

The application should now be running on `http://localhost:5173` (or your configured Vite port).

## Key Changes Made

### 1. Database Connection
- **Before:** Supabase client (`@supabase/supabase-js`)
- **After:** PostgreSQL client (`pg`) with custom database wrapper in `src/lib/db.ts`

### 2. Authentication
- **Before:** Supabase Auth
- **After:** Custom authentication system using bcrypt for password hashing
  - Auth logic in `src/lib/auth.ts`
  - Session management via localStorage
  - User table: `auth_users`

### 3. Database Queries
The `src/lib/db.ts` file provides a Supabase-like API for PostgreSQL:

```typescript
// SELECT
await db.from('table').select('*')
await db.from('table').select('column1, column2', { limit: 10 })

// INSERT
await db.from('table').insert({ column: 'value' })
await db.from('table').insert([{ ... }, { ... }])

// UPDATE
await db.from('table').update({ column: 'value' }).eq('id', '123')
await db.from('table').update({ column: 'value' }).match({ id: '123' })

// UPSERT
await db.from('table').upsert({ id: '123', column: 'value' })

// DELETE
await db.from('table').delete().eq('id', '123')
```

### 4. File Storage
**Note:** File storage (profile images) needs to be configured separately. The current implementation includes a placeholder. You have options:
- Local file system storage
- AWS S3
- Cloudinary
- Other cloud storage providers

Update `src/lib/db.ts` in the `storage` object to implement your preferred solution.

## Database Schema

The migrations create the following main tables:

- `auth_users` - User authentication
- `profiles` - User profiles
- `projects` - Portfolio projects
- `skills` - Technical skills
- `experiences` - Work experience
- `testimonials` - Client testimonials
- `hire_sections` - Hire view sections
- `hire_skills` - Hire view skills
- `hire_experience` - Hire view experience
- `hire_contact_fields` - Hire view contact fields
- `contact_submissions` - Contact form submissions
- `visitor_analytics` - Analytics data
- `resume_data` - Resume information
- `theme_settings` - Theme configurations

## Troubleshooting

### Connection Issues
1. Make sure PostgreSQL is running
2. Verify your credentials in `.env`
3. Check firewall settings
4. Ensure database exists: `psql -U postgres -l`

### Migration Errors
1. Check migration logs for specific errors
2. Verify PostgreSQL user has necessary permissions:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE portfolio_db TO your_user;
   ```
3. You can manually run migrations from pgAdmin if needed

### Authentication Issues
1. Make sure `auth_users` table was created
2. Check JWT_SECRET is set in `.env`
3. Clear localStorage and try again

## Components Updated

The following components have been updated to use PostgreSQL:

- ✅ `supabase/auth.tsx` - Authentication provider
- ✅ `supabase/supabase.ts` - Database client (now a compatibility layer)
- ✅ `src/lib/connection-test.ts` - Connection testing
- ⚠️ `src/components/admin/AdminDashboard.tsx` - Still uses old Supabase imports (needs update)
- ⚠️ `src/components/admin/PortfolioCMS.tsx` - Still uses old Supabase imports (needs update)
- ⚠️ `src/components/admin/HireViewEditor.tsx` - Still uses old Supabase imports (needs update)
- ⚠️ `src/lib/resume-generator.ts` - Still uses old Supabase imports (needs update)
- ⚠️ `src/components/ui/chat-widget.tsx` - Still uses old Supabase imports (needs update)

**Note:** Components marked with ⚠️ still import from `supabase/supabase.ts` but should work due to the compatibility layer. For optimal performance, you should update these to import from `src/lib/db.ts` directly.

## Next Steps

1. **Update remaining components** to use `src/lib/db.ts` instead of `supabase/supabase.ts`
2. **Implement file storage** solution for profile images
3. **Set up proper JWT authentication** with refresh tokens (optional)
4. **Configure backup strategy** for your PostgreSQL database
5. **Set up connection pooling** in production

## Commands Reference

```bash
# Run migrations
npm run migrate

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Access PostgreSQL via psql
psql -U postgres -d portfolio_db
```

## Support

If you encounter any issues during setup:
1. Check the console for error messages
2. Verify PostgreSQL connection with: `psql -U postgres -d portfolio_db`
3. Ensure all environment variables are set correctly
4. Check that migrations completed successfully

---

**Migration completed on:** October 17, 2025
**Previous system:** Supabase
**Current system:** PostgreSQL with pg library
