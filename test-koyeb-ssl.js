import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgres://koyeb-adm:npg_1dQiVXx3auMD@ep-autumn-feather-a1mi8hty.ap-southeast-1.pg.koyeb.app:5432/koyebdb?sslmode=require',
  ssl: true,
});

(async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version();');
    console.log('Connected! PostgreSQL version:', result.rows[0].version);
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
})();
