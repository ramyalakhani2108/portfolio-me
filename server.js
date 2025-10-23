import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Static file serving for uploaded images
app.use('/public', express.static(path.join(__dirname, 'public')));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'public/profile-images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432'),
  database: process.env.VITE_DB_NAME || 'portfolio',
  user: process.env.VITE_DB_USER || 'postgres',
  password: process.env.VITE_DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.VITE_DB_HOST && process.env.VITE_DB_HOST.includes('neon') ? { rejectUnauthorized: false } : false,
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

// ============= FILE UPLOAD ROUTE =============

// Upload profile image
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Generate URL for the uploaded file
    const fileUrl = `/public/profile-images/${req.file.filename}`;
    
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to upload file' 
    });
  }
});

// Admin sign out
app.post('/api/auth/admin/signout', async (req, res) => {
  try {
    const { token, userId } = req.body;

    // Optional: Log the logout in a future admin_logs table
    if (userId) {
      // You can add logging here later
      console.log(`Admin logout: ${userId}`);
    }

    res.json({ success: true, message: 'Admin signed out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= PROFILES MANAGEMENT ROUTES =============

// GET - All profiles (or active only if activeOnly=true)
app.get('/api/profiles', async (req, res) => {
  try {
    const { activeOnly } = req.query;
    
    let sql = 'SELECT * FROM profiles';
    if (activeOnly === 'true') {
      sql += ' WHERE is_active = true';
    }
    sql += ' ORDER BY created_at DESC';
    
    const result = await query(sql);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Single profile by ID
app.get('/api/profiles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM profiles WHERE id = $1', [id]);
    
    if (!result.success || result.data.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json({ success: true, data: [result.data[0]] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Create new profile
app.post('/api/profiles', async (req, res) => {
  try {
    const { full_name, role, bio, experience, status, avatar_url } = req.body;

    if (!full_name || !role || !bio) {
      return res.status(400).json({ 
        error: 'Missing required fields: full_name, role, bio' 
      });
    }

    // Use uuid v4 for proper UUID generation
    const id = uuidv4();
    console.log("id", id);
    const result = await query(
      `INSERT INTO profiles (id, full_name, role, bio, experience, status, avatar_url, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
      [id, full_name, role, bio, experience || null, status || null, avatar_url || null]
    );

    if (result.success && result.data) {
      res.status(201).json({ success: true, data: result.data });
    } else {
      throw new Error('Failed to create profile');
    }
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT - Update profile
app.put('/api/profiles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, bio, experience, status, avatar_url } = req.body;

    // Check if profile exists
    const checkResult = await query('SELECT id FROM profiles WHERE id = $1', [id]);
    if (!checkResult.success || checkResult.data.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (full_name !== undefined) {
      updateFields.push(`full_name = $${paramCount++}`);
      updateValues.push(full_name);
    }
    if (role !== undefined) {
      updateFields.push(`role = $${paramCount++}`);
      updateValues.push(role);
    }
    if (bio !== undefined) {
      updateFields.push(`bio = $${paramCount++}`);
      updateValues.push(bio);
    }
    if (experience !== undefined) {
      updateFields.push(`experience = $${paramCount++}`);
      updateValues.push(experience);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      updateValues.push(status);
    }
    if (avatar_url !== undefined) {
      updateFields.push(`avatar_url = $${paramCount++}`);
      updateValues.push(avatar_url);
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);

    const sql = `UPDATE profiles SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await query(sql, updateValues);

    if (result.success && result.data) {
      res.json({ success: true, data: result.data });
    } else {
      throw new Error('Failed to update profile');
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE - Delete profile
app.delete('/api/profiles/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if profile exists
    const checkResult = await query('SELECT id FROM profiles WHERE id = $1', [id]);
    if (!checkResult.success || checkResult.data.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const result = await query('DELETE FROM profiles WHERE id = $1 RETURNING *', [id]);

    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      throw new Error('Failed to delete profile');
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

// Fix foreign key constraint (migration endpoint)
app.get('/api/migrate/fix-profiles-fk', async (req, res) => {
  try {
    // Drop ALL foreign key constraints on profiles table
    const constraints = [
      'profiles_id_fkey',
      'fk_profiles_user_id',
      'fk_profiles_auth_users',
      'profiles_fk_user_id'
    ];
    
    let removedCount = 0;
    for (const constraint of constraints) {
      try {
        await pool.query(`ALTER TABLE profiles DROP CONSTRAINT IF EXISTS ${constraint}`);
        removedCount++;
      } catch (e) {
        // constraint doesn't exist, continue
      }
    }
    
    res.json({
      success: true,
      message: `Foreign key constraints removed (${removedCount} total)`,
      status: 'profiles table is now ready for independent profile records'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add is_active column to profiles table
app.get('/api/migrate/add-is-active-profiles', async (req, res) => {
  try {
    // Add is_active column if it doesn't exist
    await pool.query(`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
    `);
    
    // Set all existing profiles to active
    await pool.query(`
      UPDATE profiles 
      SET is_active = true 
      WHERE is_active IS NULL
    `);
    
    // Create index for better query performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active)
    `);
    
    res.json({
      success: true,
      message: 'is_active column added to profiles table',
      status: 'All profiles set to active by default'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
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
