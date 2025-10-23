import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.VITE_DB_HOST,
  port: parseInt(process.env.VITE_DB_PORT || '5432'),
  database: process.env.VITE_DB_NAME,
  user: process.env.VITE_DB_USER,
  password: process.env.VITE_DB_PASSWORD,
  ssl: process.env.VITE_DB_HOST && process.env.VITE_DB_HOST.includes('neon') 
    ? { rejectUnauthorized: false } 
    : false,
  connectionTimeoutMillis: 5000,
});

async function fixDatabase() {
  try {
    console.log('🔧 Fixing profiles table...\n');
    
    // Drop all foreign key constraints on profiles table
    console.log('Removing foreign key constraints...');
    
    try {
      await pool.query(`ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey`);
      console.log('  ✅ Removed: profiles_id_fkey');
    } catch (e) {
      console.log('  ℹ️  profiles_id_fkey not found');
    }

    try {
      await pool.query(`ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_profiles_user_id`);
      console.log('  ✅ Removed: fk_profiles_user_id');
    } catch (e) {
      console.log('  ℹ️  fk_profiles_user_id not found');
    }

    try {
      await pool.query(`ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_profiles_auth_users`);
      console.log('  ✅ Removed: fk_profiles_auth_users');
    } catch (e) {
      console.log('  ℹ️  fk_profiles_auth_users not found');
    }

    // Verify table structure
    console.log('\n📋 Verifying table structure...');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'profiles'
      ORDER BY ordinal_position
    `);

    console.log('\n✅ Profile table columns:');
    result.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
      console.log(`  • ${row.column_name.padEnd(15)} ${row.data_type.padEnd(20)} ${nullable}`);
    });

    // Test profile creation
    console.log('\n🧪 Testing profile creation...');
    const testResult = await pool.query(`
      INSERT INTO profiles (id, full_name, role, bio, avatar_url, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, full_name, role
    `, [
      'test-' + Date.now(),
      'Test User',
      'Test Role',
      'Test Bio',
      '/public/profile-images/test.jpg'
    ]);

    console.log('  ✅ Test profile created successfully!');
    console.log(`  ID: ${testResult.rows[0].id}`);

    // Delete test profile
    await pool.query(`DELETE FROM profiles WHERE id = $1`, [testResult.rows[0].id]);
    console.log('  ✅ Test profile cleaned up');

    console.log('\n✅ Database is now ready for profile management!');
    console.log('\n📝 You can now:');
    console.log('   1. Start server: npm run dev');
    console.log('   2. Go to admin panel: http://localhost:5173/admin');
    console.log('   3. Click Profile tab');
    console.log('   4. Create profiles with images!\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

fixDatabase();
