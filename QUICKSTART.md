# Quick Start Guide - PostgreSQL Setup

## 1. Update Your .env File

Open `.env` and update these values:

```env
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=portfolio_db
VITE_DB_USER=postgres
VITE_DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
VITE_JWT_SECRET=random_secure_string_at_least_32_characters_long
```

## 2. Ensure PostgreSQL is Running

### Check if PostgreSQL is running:
```bash
# macOS
brew services list | grep postgresql

# Or check with psql
psql -U postgres -c "SELECT version();"
```

### If not running, start it:
```bash
# macOS with Homebrew
brew services start postgresql@14

# Or use pgAdmin to start the server
```

## 3. Create the Database

### Option A: Using psql
```bash
psql -U postgres
CREATE DATABASE portfolio_db;
\q
```

### Option B: Using pgAdmin
1. Open pgAdmin
2. Right-click on "Databases"
3. Create → Database
4. Name it: `portfolio_db`
5. Click Save

## 4. Run Migrations

```bash
cd /Users/ramyalakhani/Documents/portfolio-next/portfolio-3/portfolio-me
npm run migrate
```

You should see output like:
```
✓ Connected to PostgreSQL database
✓ Migrations tracking table ready
▶ Running 20240322000001_create_portfolio_tables.sql...
✓ Completed 20240322000001_create_portfolio_tables.sql
...
✓ Migration complete! Executed X new migration(s).
```

## 5. Start Your App

```bash
npm run dev
```

## Troubleshooting

### "Cannot connect to database"
1. Check PostgreSQL is running: `psql -U postgres`
2. Verify password in `.env` matches your PostgreSQL password
3. Check port (default is 5432): `psql -U postgres -c "SHOW port;"`

### "Database does not exist"
```bash
createdb -U postgres portfolio_db
```

### "Migration failed"
1. Check error message in terminal
2. Manually run migrations in pgAdmin if needed
3. Verify user has permissions:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE portfolio_db TO postgres;
   ```

### "Authentication failed"
Your PostgreSQL password in `.env` might be wrong. To reset:
```bash
psql -U postgres
ALTER USER postgres PASSWORD 'new_password';
\q
```
Then update `.env` with the new password.

## Verify Setup

After migrations, verify tables were created:

```bash
psql -U postgres -d portfolio_db

# List all tables
\dt

# You should see:
# - auth_users
# - profiles
# - projects
# - skills
# - experiences
# - testimonials
# - hire_sections
# - hire_skills
# - hire_experience
# - hire_contact_fields
# - contact_submissions
# - visitor_analytics
# - resume_data
# - theme_settings
# - schema_migrations

# Exit psql
\q
```

## Common Commands

```bash
# Connect to database
psql -U postgres -d portfolio_db

# View table structure
\d table_name

# Query data
SELECT * FROM auth_users;

# Exit psql
\q
```

## Need Help?

Check the detailed guides:
- **Setup Instructions:** `MIGRATION_GUIDE.md`
- **Complete Changes:** `MIGRATION_SUMMARY.md`

---

**You're all set!** 🎉

Once migrations complete, your app will use PostgreSQL instead of Supabase.
