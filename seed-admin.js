import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const ADMIN_USERNAME = 'Art1204';
const ADMIN_PASSWORD = 'Art@1204';

async function seedAdmin() {
  const pool = new Pool({
    host: process.env.VITE_DB_HOST || 'localhost',
    port: parseInt(process.env.VITE_DB_PORT || '5432'),
    database: process.env.VITE_DB_NAME || 'portfolio',
    user: process.env.VITE_DB_USER || 'postgres',
    password: process.env.VITE_DB_PASSWORD || '',
  });

  try {
    console.log('🔐 Generating admin password hash...');
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    
    console.log('📊 Connecting to database...');
    
    // Create admins table if it doesn't exist
    await pool.query(`
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
    `);
    
    console.log('✅ Admins table ready');
    
    // Create index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
    `);
    
    // Check if admin already exists
    const checkResult = await pool.query(
      'SELECT username FROM admins WHERE username = $1',
      [ADMIN_USERNAME]
    );
    
    if (checkResult.rows.length > 0) {
      console.log('ℹ️  Admin user already exists, updating password...');
      await pool.query(
        'UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE username = $2',
        [passwordHash, ADMIN_USERNAME]
      );
      console.log('✅ Admin password updated');
    } else {
      console.log('➕ Creating new admin user...');
      await pool.query(
        `INSERT INTO admins (username, password_hash, full_name, is_active)
         VALUES ($1, $2, $3, $4)`,
        [ADMIN_USERNAME, passwordHash, 'Admin User', true]
      );
      console.log('✅ Admin user created');
    }
    
    // Verify the admin exists
    const verifyResult = await pool.query(
      'SELECT username, full_name, is_active, created_at FROM admins WHERE username = $1',
      [ADMIN_USERNAME]
    );
    
    if (verifyResult.rows.length > 0) {
      console.log('\n✨ Admin user details:');
      console.log('   Username:', verifyResult.rows[0].username);
      console.log('   Full Name:', verifyResult.rows[0].full_name);
      console.log('   Active:', verifyResult.rows[0].is_active);
      console.log('   Created:', verifyResult.rows[0].created_at);
      console.log('\n🎉 Admin seeding completed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the seeding
seedAdmin();
