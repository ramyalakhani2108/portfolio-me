#!/usr/bin/env node

/**
 * Database Connection Tester
 * Validates PostgreSQL connection before running migrations
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = pg;

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

function log(message, type = 'info') {
  let prefix = '';
  switch(type) {
    case 'success':
      prefix = `${colors.green}✓${colors.reset}`;
      break;
    case 'error':
      prefix = `${colors.red}✗${colors.reset}`;
      break;
    case 'warning':
      prefix = `${colors.yellow}⚠${colors.reset}`;
      break;
    case 'info':
      prefix = `${colors.blue}ℹ${colors.reset}`;
      break;
    default:
      prefix = '';
  }
  console.log(`${prefix} ${message}`);
}

async function testConnection() {
  console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}PostgreSQL Connection Test${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════${colors.reset}\n`);

  // Get database credentials from environment
  const dbConfig = {
    host: process.env.PGHOST || process.env.VITE_DB_HOST,
    port: process.env.PGPORT || process.env.VITE_DB_PORT || 5432,
    database: process.env.PGDATABASE || process.env.VITE_DB_NAME,
    user: process.env.PGUSER || process.env.VITE_DB_USER,
    password: process.env.PGPASSWORD || process.env.VITE_DB_PASSWORD,
    ssl: process.env.PGSSL !== 'false' ? { rejectUnauthorized: false } : false
  };

  // Validate configuration
  if (!dbConfig.host) {
    log('Missing PGHOST or VITE_DB_HOST', 'error');
    process.exit(1);
  }
  if (!dbConfig.user) {
    log('Missing PGUSER or VITE_DB_USER', 'error');
    process.exit(1);
  }
  if (!dbConfig.password) {
    log('Missing PGPASSWORD or VITE_DB_PASSWORD', 'error');
    process.exit(1);
  }
  if (!dbConfig.database) {
    log('Missing PGDATABASE or VITE_DB_NAME', 'error');
    process.exit(1);
  }

  // Display connection info
  log('Connection Configuration:', 'info');
  log(`  Host:     ${dbConfig.host}`, 'info');
  log(`  Port:     ${dbConfig.port}`, 'info');
  log(`  Database: ${dbConfig.database}`, 'info');
  log(`  User:     ${dbConfig.user}`, 'info');
  log(`  SSL:      ${dbConfig.ssl ? 'Enabled' : 'Disabled'}`, 'info');

  const client = new Client(dbConfig);

  try {
    log('\nConnecting to database...', 'info');
    await client.connect();
    log('Connected successfully!', 'success');

    // Get PostgreSQL version
    const versionResult = await client.query('SELECT version();');
    log(`PostgreSQL Version: ${versionResult.rows[0].version.split(',')[0]}`, 'success');

    // Check for required extensions
    log('\nChecking required extensions...', 'info');
    
    const extensions = ['uuid-ossp', 'pgcrypto'];
    for (const ext of extensions) {
      try {
        await client.query(`CREATE EXTENSION IF NOT EXISTS "${ext}";`);
        log(`Extension '${ext}' available`, 'success');
      } catch (error) {
        log(`Extension '${ext}' not available`, 'warning');
      }
    }

    // List existing tables
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    log(`\nExisting tables in 'public' schema: ${tablesResult.rows.length}`, 'info');
    if (tablesResult.rows.length > 0) {
      log('Tables:', 'info');
      tablesResult.rows.forEach(row => {
        log(`  - ${row.table_name}`, 'info');
      });
    } else {
      log('  (No tables exist - ready for fresh migration)', 'warning');
    }

    // Check for schema_migrations table
    const migrationTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      );
    `);

    if (migrationTableResult.rows[0].exists) {
      const migrationRecords = await client.query('SELECT * FROM public.schema_migrations ORDER BY version;');
      log(`\nExecuted migrations: ${migrationRecords.rows.length}`, 'success');
      if (migrationRecords.rows.length > 0) {
        log('Migrations:', 'info');
        migrationRecords.rows.forEach(row => {
          log(`  - ${row.version} (${new Date(row.executed_at).toLocaleString()})`, 'info');
        });
      }
    } else {
      log('\nNo migrations executed yet', 'warning');
    }

    console.log(`\n${colors.green}${colors.bright}✓ Connection test successful!${colors.reset}`);
    console.log(`${colors.bright}Ready to run migrations.${colors.reset}\n`);

  } catch (error) {
    log(`Connection failed: ${error.message}`, 'error');
    console.log(`\nError details:`, 'info');
    console.log(`  Code: ${error.code}`);
    console.log(`  Message: ${error.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testConnection();
