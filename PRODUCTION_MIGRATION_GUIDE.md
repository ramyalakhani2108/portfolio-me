# Production Migration Setup Guide

## Step 1: Update Your Environment Variables

Your hosted database credentials have been configured. Update your `.env` file with your database details:

```bash
# PostgreSQL Database Configuration
PGHOST=your-hosted-db-host.com
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=your_database_name

# Optional: Set SSL mode
PGSSL=true  # Set to 'false' to disable SSL
```

## Step 2: Install PostgreSQL Client (if not already installed)

For local migration execution, you need PostgreSQL client tools:

### macOS
```bash
brew install postgresql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install postgresql-client
```

### Windows
Download from: https://www.postgresql.org/download/windows/

## Step 3: Install Node Dependencies

```bash
npm install pg
```

## Step 4: Execute All Migrations

### Option A: Using the Migration Runner Script (Recommended)

```bash
# Set environment variables and run migrations
export PGHOST="your-host"
export PGPORT="5432"
export PGUSER="your_username"
export PGPASSWORD="your_password"
export PGDATABASE="your_database"

node run-migrations-production.js
```

### Option B: Using psql directly

```bash
psql -h your-host -U your_username -d your_database < supabase/migrations/20240101000000_initial_setup.sql
psql -h your-host -U your_username -d your_database < supabase/migrations/20240322000001_create_portfolio_tables.sql
# ... and so on for all migrations
```

### Option C: Using a shell script (batch execution)

Create `run-all-migrations.sh`:

```bash
#!/bin/bash

PGHOST="your-host"
PGPORT=5432
PGUSER="your_username"
PGPASSWORD="your_password"
PGDATABASE="your_database"

export PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE

MIGRATIONS=(
  "20240101000000_initial_setup.sql"
  "20240322000001_create_portfolio_tables.sql"
  "20241018000001_create_admins_table.sql"
  "20241220000001_fix_hire_view_tables.sql"
  "20241220000002_add_is_active_columns.sql"
  "20241220000003_add_resume_and_profile_tables.sql"
  "20241220000004_add_resume_rls_policies.sql"
  "20241220000005_fix_resume_rls_policies.sql"
  "20241220000006_create_profile_images_bucket.sql"
  "20241220000007_fix_analytics_and_profile_system.sql"
  "20250101000001_fix_duplicate_hero_section.sql"
  "20250102000001_remove_all_duplicate_sections.sql"
  "20250103000001_clean_duplicate_skills.sql"
  "20250104000001_clean_duplicate_experience.sql"
  "20250105000001_clean_duplicate_contact_fields.sql"
)

for migration in "${MIGRATIONS[@]}"
do
  echo "Executing: $migration"
  psql -h $PGHOST -U $PGUSER -d $PGDATABASE < "supabase/migrations/$migration"
  if [ $? -ne 0 ]; then
    echo "Migration failed: $migration"
    exit 1
  fi
done

echo "All migrations completed successfully!"
```

Then run:
```bash
chmod +x run-all-migrations.sh
./run-all-migrations.sh
```

## Step 5: Verify Migration Success

Connect to your database and verify:

```bash
psql -h your-host -U your_username -d your_database

# List all tables
\dt public.*

# Check schema_migrations
SELECT * FROM public.schema_migrations;

# Count records in key tables
SELECT COUNT(*) FROM public.hire_sections;
SELECT COUNT(*) FROM public.hire_skills;
SELECT COUNT(*) FROM public.auth_users;
SELECT COUNT(*) FROM public.admins;
```

## Database Structure Overview

### Core Tables Created:

1. **Authentication**
   - `auth_users` - Custom authentication users
   - `admins` - Admin dashboard users

2. **Portfolio Content**
   - `profiles` - User profile information
   - `skills` - Portfolio skills
   - `projects` - Portfolio projects
   - `experiences` - Work experiences
   - `testimonials` - Client testimonials
   - `theme_settings` - Theme customization

3. **Hire View System**
   - `hire_view_settings` - Settings for hire view page
   - `hire_sections` - Section content (hero, skills, experience, contact, resume)
   - `hire_skills` - Skills for hire view
   - `hire_experience` - Experiences for hire view
   - `hire_contact_fields` - Contact form fields

4. **Resume Management**
   - `resume_data` - Structured resume information

5. **Analytics & Contact**
   - `visitor_analytics` - Visitor tracking
   - `contact_submissions` - Contact form submissions
   - `schema_migrations` - Migration tracking

### Default Data Inserted:

- **Admin User**: Username `Art1204` (password hash provided)
- **Skills**: 8 default skills (React, TypeScript, Node.js, Python, PostgreSQL, AWS, Docker, GraphQL)
- **Experiences**: 3 default positions
- **Contact Fields**: 5 contact form fields
- **Hire Sections**: 5 sections (hero, skills, experience, contact, resume)

## Troubleshooting

### Connection Issues

```bash
# Test connection
psql -h your-host -U your_username -d your_database -c "SELECT version();"
```

### Migration Failures

1. **Check PostgreSQL version** (requires 12+):
```bash
SELECT version();
```

2. **Check user permissions**:
```bash
\du your_username
```

3. **Enable required extensions**:
```bash
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### SSL Connection Issues

If using SSL, update connection string:
```bash
PGSSL=require
# or
PGSSL=prefer
```

## Migration Files Details

All migration files are in `supabase/migrations/` directory:

| File | Purpose |
|------|---------|
| 20240101000000_initial_setup.sql | Create base tables and extensions |
| 20240322000001_create_portfolio_tables.sql | Create portfolio-related tables |
| 20241018000001_create_admins_table.sql | Create admin user table |
| 20241220000001_fix_hire_view_tables.sql | Setup hire view tables |
| 20241220000002_add_is_active_columns.sql | Add is_active columns |
| 20241220000003_add_resume_and_profile_tables.sql | Resume and profile setup |
| 20241220000004_add_resume_rls_policies.sql | Resume access control |
| 20241220000005_fix_resume_rls_policies.sql | Fix resume policies |
| 20241220000006_create_profile_images_bucket.sql | Profile image URLs |
| 20241220000007_fix_analytics_and_profile_system.sql | Analytics setup |
| 20250101000001_fix_duplicate_hero_section.sql | Remove duplicates |
| 20250102000001_remove_all_duplicate_sections.sql | Clean duplicates |
| 20250103000001_clean_duplicate_skills.sql | Clean skill duplicates |
| 20250104000001_clean_duplicate_experience.sql | Clean experience duplicates |
| 20250105000001_clean_duplicate_contact_fields.sql | Clean contact field duplicates |

## Next Steps

After successful migration:

1. Update your API server connection string
2. Test API endpoints
3. Verify admin login with credentials
4. Load sample data if needed
5. Run application tests

## Support

For issues or questions, check:
- PostgreSQL logs
- Migration script output
- Database connection parameters
- File permissions on migration SQL files
