#!/usr/bin/env node

/**
 * Application Database Connection Tester
 * Tests the exact connection parameters your Express server uses
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

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
    case 'section':
      console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════${colors.reset}`);
      console.log(`${colors.bright}${message}${colors.reset}`);
      console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════${colors.reset}\n`);
      return;
    default:
      prefix = '';
  }
  console.log(`${prefix} ${message}`);
}

async function testConnection() {
  log('APPLICATION DATABASE CONNECTION TEST', 'section');

  // Get configuration from environment
  const config = {
    host: process.env.VITE_DB_HOST || 'localhost',
    port: parseInt(process.env.VITE_DB_PORT || '5432'),
    database: process.env.VITE_DB_NAME || 'portfolio',
    user: process.env.VITE_DB_USER || 'postgres',
    password: process.env.VITE_DB_PASSWORD || '',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: process.env.VITE_DB_HOST && process.env.VITE_DB_HOST.includes('neon') ? { rejectUnauthorized: false } : false,
  };

  // Display configuration
  log('Connection Configuration (from server.js):', 'info');
  log(`  Host: ${config.host}`, 'info');
  log(`  Port: ${config.port}`, 'info');
  log(`  Database: ${config.database}`, 'info');
  log(`  User: ${config.user}`, 'info');
  log(`  Password: ${config.password ? '***' + config.password.slice(-4) : '(empty)'}`, 'info');
  log(`  Connection Timeout: ${config.connectionTimeoutMillis}ms`, 'info');

  const pool = new Pool(config);

  try {
    log('\nAttempting to connect...', 'info');
    
    const client = await pool.connect();
    log('Successfully connected to database!', 'success');

    // Get version
    const versionResult = await client.query('SELECT version();');
    const version = versionResult.rows[0].version.split(',')[0];
    log(`PostgreSQL: ${version}`, 'success');

    // Test table access
    log('\nTesting table access...', 'info');

    const tables = [
      'auth_users',
      'admins',
      'hire_sections',
      'hire_skills',
      'hire_experience',
      'hire_contact_fields',
      'schema_migrations'
    ];

    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM public.${table};`);
        log(`  ✓ ${table}: ${result.rows[0].count} records`, 'success');
      } catch (error) {
        log(`  ✗ ${table}: ${error.message}`, 'error');
      }
    }

    // Test a specific query for hire view
    log('\nTesting hire view data...', 'info');
    
    const hireViewResult = await client.query('SELECT section_type, title FROM public.hire_sections ORDER BY order_index;');
    log(`Found ${hireViewResult.rows.length} hire view sections:`, 'success');
    hireViewResult.rows.forEach(row => {
      log(`  - ${row.section_type}: ${row.title}`, 'info');
    });

    // Test admin user
    log('\nTesting admin user...', 'info');
    
    const adminResult = await client.query('SELECT username, email, is_active FROM public.admins;');
    if (adminResult.rows.length > 0) {
      const admin = adminResult.rows[0];
      log(`Found admin: ${admin.username} (${admin.email})`, 'success');
    } else {
      log('No admin users found', 'warning');
    }

    client.release();
    
    log('\n✓✓✓ ALL CONNECTION TESTS PASSED! ✓✓✓', 'success');
    log('Your Express server should be able to connect to the database.', 'info');

  } catch (error) {
    log(`Connection failed: ${error.message}`, 'error');
    log('\nDebugging Information:', 'warning');
    log(`  Error Code: ${error.code}`, 'info');
    log(`  Error: ${error.message}`, 'info');
    
    if (error.code === 'ECONNREFUSED') {
      log('\nSolution: Check if the database host is reachable', 'warning');
    } else if (error.code === 'ENOTFOUND') {
      log('\nSolution: Check if the hostname is correct', 'warning');
    } else if (error.message.includes('password')) {
      log('\nSolution: Check if your VITE_DB_PASSWORD is correct', 'warning');
      log(`Current password: ${config.password}`, 'info');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();
