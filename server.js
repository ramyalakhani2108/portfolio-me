import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432'),
  database: process.env.VITE_DB_NAME || 'portfolio',
  user: process.env.VITE_DB_USER || 'postgres',
  password: process.env.VITE_DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

// Helper function to execute queries
const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return { success: true, data: result.rows, error: null };
  } catch (error) {
    console.error('Database query error:', error);
    return { success: false, data: null, error: error.message };
  }
};

// ============= AUTHENTICATION ROUTES =============

// Sign up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Check if user exists
    const existing = await query('SELECT id FROM auth_users WHERE email = $1', [email]);
    if (existing.data.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      'INSERT INTO auth_users (email, password, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, created_at',
      [email, hashedPassword, fullName]
    );

    const user = result.data[0];
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sign in
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      'SELECT id, email, password, full_name, created_at FROM auth_users WHERE email = $1',
      [email]
    );

    if (result.data.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.data[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    delete user.password;
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin sign in
app.post('/api/auth/admin/signin', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await query(
      'SELECT id, username, password_hash, full_name, email, is_active, created_at FROM admins WHERE username = $1',
      [username]
    );

    if (result.data.length === 0) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const admin = result.data[0];

    if (!admin.is_active) {
      return res.status(403).json({ error: 'Admin account is disabled' });
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Update last login
    await query('UPDATE admins SET last_login = NOW() WHERE id = $1', [admin.id]);

    delete admin.password_hash;
    const token = Buffer.from(`admin:${admin.id}:${Date.now()}`).toString('base64');

    res.json({ 
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        full_name: admin.full_name,
        role: 'admin'
      }, 
      token 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= GENERIC DATABASE ROUTES =============

// GET - Select from table
app.get('/api/db/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { limit, order_by, order_dir = 'ASC' } = req.query;

    let sql = `SELECT * FROM ${table}`;
    
    if (order_by) {
      sql += ` ORDER BY ${order_by} ${order_dir}`;
    }
    
    if (limit) {
      sql += ` LIMIT ${parseInt(limit)}`;
    }

    const result = await query(sql);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Insert into table
app.post('/api/db/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const data = req.body;

    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const result = await query(sql, values);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT - Update table
app.put('/api/db/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    const data = req.body;

    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');

    const sql = `UPDATE ${table} SET ${setClause} WHERE id = $${columns.length + 1} RETURNING *`;
    const result = await query(sql, [...values, id]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE - Delete from table
app.delete('/api/db/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;

    const sql = `DELETE FROM ${table} WHERE id = $1 RETURNING *`;
    const result = await query(sql, [id]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= SPECIFIC ROUTES FOR COMPLEX QUERIES =============

// Get profiles with user data
app.get('/api/profiles', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, au.email 
       FROM profiles p 
       LEFT JOIN auth_users au ON p.id = au.id`
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.VITE_DB_NAME || 'portfolio'}`);
  console.log(`🔌 Health check: http://localhost:${PORT}/api/health\n`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  pool.end();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});
