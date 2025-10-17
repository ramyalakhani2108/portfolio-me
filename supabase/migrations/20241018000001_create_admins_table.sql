-- Create admins table for admin user management
CREATE TABLE IF NOT EXISTS admins (
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

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);

-- Insert default admin user if not exists
-- Password: Art@1204
-- Hash      generated with bcryptjs rounds=10
INSERT INTO admins (username, password_hash, full_name, is_active)
VALUES (
    'Art1204',
    '$2a$10$YourHashWillBeGeneratedByScript',
    'Admin User',
    true
)
ON CONFLICT (username) DO NOTHING;

-- Add comment
COMMENT ON TABLE admins IS 'Admin users table for portfolio dashboard access';
