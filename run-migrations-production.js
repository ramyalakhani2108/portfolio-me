#!/usr/bin/env node

/**
 * Production Migration Runner for PostgreSQL Portfolio Database
 * This script executes all migrations in the correct order for a fresh setup
 * 
 * Usage: node run-migrations-production.js
 * 
 * Environment Variables Required:
 * - PGHOST: PostgreSQL host
 * - PGPORT: PostgreSQL port (default: 5432)
 * - PGUSER: PostgreSQL username
 * - PGPASSWORD: PostgreSQL password
 * - PGDATABASE: PostgreSQL database name
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

// Migration files in execution order
const migrations = [
  '20240101000000_initial_setup.sql',
  '20240322000001_create_portfolio_tables.sql',
  '20241018000001_create_admins_table.sql',
  '20241220000001_fix_hire_view_tables.sql',
  '20241220000002_add_is_active_columns.sql',
  '20241220000003_add_resume_and_profile_tables.sql',
  '20241220000004_add_resume_rls_policies.sql',
  '20241220000005_fix_resume_rls_policies.sql',
  '20241220000006_create_profile_images_bucket.sql',
  '20241220000007_fix_analytics_and_profile_system.sql',
  '20250101000001_fix_duplicate_hero_section.sql',
  '20250102000001_remove_all_duplicate_sections.sql',
  '20250103000001_clean_duplicate_skills.sql',
  '20250104000001_clean_duplicate_experience.sql',
  '20250105000001_clean_duplicate_contact_fields.sql'
];

// Create schema_migrations table if it doesn't exist
const createMigrationsTable = `
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version TEXT PRIMARY KEY,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

/**
 * Log formatted messages to console
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
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
      console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════${colors.reset}`);
      console.log(`${colors.bright}${message}${colors.reset}`);
      console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════${colors.reset}\n`);
      return;
    default:
      prefix = '';
  }
  
  console.log(`${prefix} ${message}`);
}

/**
 * Read migration file content
 */
function readMigration(filename) {
  const filepath = path.join(__dirname, 'supabase/migrations', filename);
  try {
    return fs.readFileSync(filepath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read migration file ${filename}: ${error.message}`);
  }
}

/**
 * Check if migration has already been executed
 */
async function isMigrationExecuted(client, version) {
  try {
    const result = await client.query(
      'SELECT version FROM public.schema_migrations WHERE version = $1',
      [version]
    );
    return result.rows.length > 0;
  } catch (error) {
    // Table might not exist yet, that's ok
    return false;
  }
}

/**
 * Record migration execution
 */
async function recordMigration(client, version) {
  await client.query(
    'INSERT INTO public.schema_migrations (version) VALUES ($1)',
    [version]
  );
}

/**
 * Execute single migration
 */
async function executeMigration(client, version, content) {
  try {
    await client.query(content);
    return true;
  } catch (error) {
    throw new Error(`Migration ${version} failed: ${error.message}`);
  }
}

/**
 * Main migration runner
 */
async function runMigrations() {
  log('PRODUCTION MIGRATION RUNNER FOR POSTGRESQL', 'section');
  
  // Validate environment variables
  const requiredEnvVars = ['PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    log(`Missing required environment variables: ${missingVars.join(', ')}`, 'error');
    log('Please set the following environment variables:', 'info');
    log('  - PGHOST: PostgreSQL host', 'info');
    log('  - PGPORT: PostgreSQL port (optional, default: 5432)', 'info');
    log('  - PGUSER: PostgreSQL username', 'info');
    log('  - PGPASSWORD: PostgreSQL password', 'info');
    log('  - PGDATABASE: PostgreSQL database name', 'info');
    process.exit(1);
  }
  
  // Display connection info
  log('Database Connection Information:', 'info');
  log(`  Host: ${process.env.PGHOST}`, 'info');
  log(`  Port: ${process.env.PGPORT || 5432}`, 'info');
  log(`  Database: ${process.env.PGDATABASE}`, 'info');
  log(`  User: ${process.env.PGUSER}`, 'info');
  
  const client = new Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT || 5432,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: process.env.PGSSL !== 'false' ? { rejectUnauthorized: false } : false
  });
  
  try {
    log('Connecting to database...', 'info');
    await client.connect();
    log('Database connection successful!', 'success');
    
    // Create schema_migrations table
    log('Creating schema_migrations table...', 'info');
    await client.query(createMigrationsTable);
    log('schema_migrations table ready', 'success');
    
    log(`\nExecuting ${migrations.length} migrations...`, 'section');
    
    let executedCount = 0;
    let skippedCount = 0;
    
    for (const migration of migrations) {
      const version = migration.replace('.sql', '');
      
      try {
        // Check if migration already executed
        const alreadyExecuted = await client.query(
          'SELECT version FROM public.schema_migrations WHERE version = $1',
          [version]
        );
        
        if (alreadyExecuted.rows.length > 0) {
          log(`Skipping ${migration} (already executed)`, 'warning');
          skippedCount++;
          continue;
        }
        
        log(`Executing migration: ${colors.bright}${migration}${colors.reset}`, 'info');
        
        // Read migration content
        const content = readMigration(migration);
        
        // Execute migration
        await executeMigration(client, version, content);
        
        // Record migration
        await recordMigration(client, version);
        
        log(`  ✓ Migration ${version} completed successfully`, 'success');
        executedCount++;
        
      } catch (error) {
        log(`Migration failed: ${migration}`, 'error');
        log(`Error: ${error.message}`, 'error');
        
        await client.end();
        process.exit(1);
      }
    }
    
    // Display final summary
    log('MIGRATION SUMMARY', 'section');
    log(`Total migrations: ${migrations.length}`, 'info');
    log(`Executed: ${executedCount}`, 'success');
    log(`Skipped: ${skippedCount}`, 'warning');
    log(`Status: ${executedCount > 0 ? 'SUCCESS' : 'NO NEW MIGRATIONS'}`, executedCount > 0 ? 'success' : 'warning');
    
    // Execute verification queries
    log('VERIFICATION', 'section');
    
    // Count tables
    const tablesResult = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    log(`Total tables created: ${tablesResult.rows[0].count}`, 'success');
    
    // List all tables
    const tableListResult = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    log('Tables:', 'info');
    tableListResult.rows.forEach(row => {
      log(`  - ${row.table_name}`, 'info');
    });
    
    // Count hire view records
    const hireViewCount = await client.query('SELECT COUNT(*) as count FROM public.hire_sections');
    const hireSkillsCount = await client.query('SELECT COUNT(*) as count FROM public.hire_skills');
    const hireExpCount = await client.query('SELECT COUNT(*) as count FROM public.hire_experience');
    const hireContactCount = await client.query('SELECT COUNT(*) as count FROM public.hire_contact_fields');
    
    log('\nHire View Data:', 'info');
    log(`  - Hire Sections: ${hireViewCount.rows[0].count}`, 'success');
    log(`  - Hire Skills: ${hireSkillsCount.rows[0].count}`, 'success');
    log(`  - Hire Experiences: ${hireExpCount.rows[0].count}`, 'success');
    log(`  - Hire Contact Fields: ${hireContactCount.rows[0].count}`, 'success');
    
    log('\n✓✓✓ ALL MIGRATIONS COMPLETED SUCCESSFULLY! ✓✓✓', 'success');
    log('Your database is now ready for production use.', 'info');
    
  } catch (error) {
    log(`Database connection failed: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migrations
runMigrations().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});
