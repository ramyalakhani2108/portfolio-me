# Admin User Management

## Overview

The admin authentication system uses a dedicated `admins` table in PostgreSQL to manage admin users dynamically. Admin credentials are securely hashed using bcryptjs.

## Database Schema

```sql
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Default Admin User

- **Username**: `Art1204`
- **Password**: `Art@1204`
- **Full Name**: Admin User

## Managing Admin Users

### Seed Default Admin

Run this command to create/update the default admin user:

```bash
npm run seed:admin
```

This script:
- Creates the `admins` table if it doesn't exist
- Generates a secure bcrypt hash of the password
- Inserts or updates the admin user
- Displays the admin user details

### Manual Admin Management

You can manage admin users directly via PostgreSQL:

#### Create a new admin user

```sql
-- First, generate password hash using bcryptjs (run in Node.js)
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('YourPassword', 10);

INSERT INTO admins (username, password_hash, full_name, email, is_active)
VALUES ('newadmin', '$2a$10$...hash...', 'New Admin', 'admin@example.com', true);
```

#### Update admin password

```bash
# Use the seed-admin.js script as a template or run SQL:
UPDATE admins 
SET password_hash = '$2a$10$...new_hash...', 
    updated_at = NOW() 
WHERE username = 'Art1204';
```

#### Disable an admin user

```sql
UPDATE admins SET is_active = false WHERE username = 'Art1204';
```

#### List all admin users

```sql
SELECT username, full_name, is_active, last_login, created_at FROM admins;
```

## API Endpoint

### Admin Login

**Endpoint**: `POST /api/auth/admin/signin`

**Request Body**:
```json
{
  "username": "Art1204",
  "password": "Art@1204"
}
```

**Success Response**:
```json
{
  "user": {
    "id": "uuid",
    "username": "Art1204",
    "email": null,
    "full_name": "Admin User",
    "role": "admin"
  },
  "token": "base64_encoded_token"
}
```

**Error Responses**:
- `401`: Invalid credentials
- `403`: Admin account is disabled
- `500`: Server error

## Security Features

1. **Password Hashing**: All passwords are hashed using bcryptjs with 10 rounds
2. **Account Status**: Admins can be disabled without deletion
3. **Last Login Tracking**: Automatically updates on successful login
4. **Token-based Auth**: Returns a token for session management
5. **No Hardcoded Credentials**: All credentials stored securely in database

## Frontend Integration

The `AdminLogin.tsx` component now:
- Calls the `/api/auth/admin/signin` endpoint
- Stores the admin token and user data in localStorage
- Displays admin full name on successful login
- Shows appropriate error messages

## Adding More Admin Users

To add additional admin users, you can:

1. **Create a script** (similar to `seed-admin.js`):
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('NewPassword123', 10);

await pool.query(
  `INSERT INTO admins (username, password_hash, full_name, email)
   VALUES ($1, $2, $3, $4)`,
  ['newuser', hash, 'New User', 'newuser@example.com']
);
```

2. **Or use psql** with a pre-generated hash

## Migration

The admin system was created with migration file:
- `supabase/migrations/20241018000001_create_admins_table.sql`

The seeding script is:
- `seed-admin.js`

## Testing

Test the admin login:
```bash
curl -X POST http://localhost:3001/api/auth/admin/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"Art1204","password":"Art@1204"}'
```

Expected output:
```json
{
  "user": {
    "id": "...",
    "username": "Art1204",
    "full_name": "Admin User",
    "role": "admin"
  },
  "token": "..."
}
```
