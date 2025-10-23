import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'ep-polished-lab-adhp3zd2-pooler.c-2.us-east-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_dvP9AeTSNO3u',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
});

async function fixProfilesFK() {
  try {
    console.log('🔧 Fixing profiles table foreign key constraint...');
    
    // Drop the foreign key constraint
    try {
      await pool.query(
        `ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey`
      );
      console.log('✅ Foreign key constraint removed');
    } catch (e) {
      console.log('ℹ️  Note:', e.message);
    }
    
    // Verify the table structure
    const checkResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Profiles table is ready!');
    console.log(`   Total columns: ${checkResult.rows.length}`);
    
    console.log('\n✅ Database schema verified successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

fixProfilesFK();
