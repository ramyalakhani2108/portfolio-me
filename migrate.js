#!/usr/bin/env node

/**
 * PostgreSQL Migration Runner
 * 
 * This script runs all SQL migration files in the supabase/migrations directory
 * against your local PostgreSQL database.
 * 
 * Usage:
 *   npm run migrate
 * 
 * Make sure to set your database credentials in .env file:
 *   VITE_DB_HOST=localhost
 *   VITE_DB_PORT=5432
 *   VITE_DB_NAME=portfolio_db
 *   VITE_DB_USER=postgres
 *   VITE_DB_PASSWORD=your_password
 */

import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration
const pool = new Pool({
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432'),
  database: process.env.VITE_DB_NAME || 'portfolio_db',
  user: process.env.VITE_DB_USER || 'postgres',
  password: process.env.VITE_DB_PASSWORD || '',
});

// Create migrations tracking table
async function createMigrationsTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  await pool.query(createTableQuery);
  console.log('✓ Migrations tracking table ready');
}

// Get list of executed migrations
async function getExecutedMigrations() {
  const result = await pool.query('SELECT filename FROM schema_migrations ORDER BY filename');
  return result.rows.map(row => row.filename);
}

// Mark migration as executed
async function markMigrationExecuted(filename) {
  await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
}

// Run migrations
async function runMigrations() {
  try {
    console.log('Starting database migration...\n');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✓ Connected to PostgreSQL database\n');
    
    // Create migrations tracking table
    await createMigrationsTable();
    
    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();
    console.log(`Found ${executedMigrations.length} previously executed migrations\n`);
    
    // Read migration files
    const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.error(`❌ Migrations directory not found: ${migrationsDir}`);
      process.exit(1);
    }
    
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${files.length} migration files\n`);
    
    // Run pending migrations
    let executedCount = 0;
    
    for (const file of files) {
      if (executedMigrations.includes(file)) {
        console.log(`⊘ Skipping ${file} (already executed)`);
        continue;
      }
      
      console.log(`▶ Running ${file}...`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await pool.query(sql);
        await markMigrationExecuted(file);
        console.log(`✓ Completed ${file}\n`);
        executedCount++;
      } catch (error) {
        console.error(`❌ Error executing ${file}:`);
        console.error(error.message);
        console.error('\nMigration failed. Please fix the error and try again.');
        process.exit(1);
      }
    }
    
    console.log(`\n✓ Migration complete! Executed ${executedCount} new migration(s).`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migrations
runMigrations();
