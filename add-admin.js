import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function addAdmin() {
  const pool = new Pool({
    host: process.env.VITE_DB_HOST || 'localhost',
    port: parseInt(process.env.VITE_DB_PORT || '5432'),
    database: process.env.VITE_DB_NAME || 'portfolio',
    user: process.env.VITE_DB_USER || 'postgres',
    password: process.env.VITE_DB_PASSWORD || '',
  });

  try {
    console.log('🔧 Add New Admin User\n');
    
    const username = await question('Username: ');
    const password = await question('Password: ');
    const fullName = await question('Full Name: ');
    const email = await question('Email (optional): ');
    
    if (!username || !password) {
      console.error('❌ Username and password are required!');
      process.exit(1);
    }
    
    console.log('\n🔐 Generating password hash...');
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('📊 Connecting to database...');
    
    // Check if admin already exists
    const checkResult = await pool.query(
      'SELECT username FROM admins WHERE username = $1',
      [username]
    );
    
    if (checkResult.rows.length > 0) {
      const update = await question(`\n⚠️  Admin '${username}' already exists. Update? (y/n): `);
      
      if (update.toLowerCase() === 'y') {
        await pool.query(
          'UPDATE admins SET password_hash = $1, full_name = $2, email = $3, updated_at = NOW() WHERE username = $4',
          [passwordHash, fullName || null, email || null, username]
        );
        console.log('✅ Admin updated successfully!');
      } else {
        console.log('❌ Operation cancelled.');
        process.exit(0);
      }
    } else {
      await pool.query(
        `INSERT INTO admins (username, password_hash, full_name, email, is_active)
         VALUES ($1, $2, $3, $4, $5)`,
        [username, passwordHash, fullName || null, email || null, true]
      );
      console.log('✅ Admin created successfully!');
    }
    
    // Display admin details
    const verifyResult = await pool.query(
      'SELECT username, full_name, email, is_active, created_at FROM admins WHERE username = $1',
      [username]
    );
    
    if (verifyResult.rows.length > 0) {
      const admin = verifyResult.rows[0];
      console.log('\n✨ Admin Details:');
      console.log('   Username:', admin.username);
      console.log('   Full Name:', admin.full_name || 'N/A');
      console.log('   Email:', admin.email || 'N/A');
      console.log('   Active:', admin.is_active);
      console.log('   Created:', admin.created_at);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

// Run the script
addAdmin();
