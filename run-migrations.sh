#!/bin/bash

###############################################################################
# Production Migration Runner for PostgreSQL Portfolio Database
# 
# This script executes all database migrations in the correct order
# for a fresh PostgreSQL setup
#
# Usage: 
#   ./run-migrations.sh
#   
# Or with custom credentials:
#   PGHOST=your-host PGUSER=user PGPASSWORD=pass PGDATABASE=db ./run-migrations.sh
#
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MIGRATIONS_DIR="$SCRIPT_DIR/supabase/migrations"

# Migration files in execution order
declare -a MIGRATIONS=(
  "20240101000000_initial_setup.sql"
  "20240322000001_create_portfolio_tables.sql"
  "20241018000001_create_admins_table.sql"
  "20241220000001_fix_hire_view_tables.sql"
  "20241220000002_add_is_active_columns.sql"
  "20241220000003_add_resume_and_profile_tables.sql"
  "20241220000004_add_resume_rls_policies.sql"
  "20241220000005_fix_resume_rls_policies.sql"
  "20241220000006_create_profile_images_bucket.sql"
  "20241220000007_fix_analytics_and_profile_system.sql"
  "20250101000001_fix_duplicate_hero_section.sql"
  "20250102000001_remove_all_duplicate_sections.sql"
  "20250103000001_clean_duplicate_skills.sql"
  "20250104000001_clean_duplicate_experience.sql"
  "20250105000001_clean_duplicate_contact_fields.sql"
)

# Load environment variables from .env file
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  source "$SCRIPT_DIR/.env"
  set +a
fi

# Helper functions
print_header() {
  echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}$1${NC}"
  echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

# Validate environment
validate_environment() {
  print_header "VALIDATING ENVIRONMENT"
  
  # Check for required environment variables
  if [ -z "$PGHOST" ]; then
    PGHOST="${VITE_DB_HOST}"
  fi
  if [ -z "$PGPORT" ]; then
    PGPORT="${VITE_DB_PORT:-5432}"
  fi
  if [ -z "$PGUSER" ]; then
    PGUSER="${VITE_DB_USER}"
  fi
  if [ -z "$PGPASSWORD" ]; then
    PGPASSWORD="${VITE_DB_PASSWORD}"
  fi
  if [ -z "$PGDATABASE" ]; then
    PGDATABASE="${VITE_DB_NAME}"
  fi

  # Validate required variables
  local missing_vars=0
  
  if [ -z "$PGHOST" ]; then
    print_error "PGHOST is not set"
    missing_vars=1
  else
    print_success "PGHOST: $PGHOST"
  fi
  
  if [ -z "$PGPORT" ]; then
    print_error "PGPORT is not set"
    missing_vars=1
  else
    print_success "PGPORT: $PGPORT"
  fi
  
  if [ -z "$PGUSER" ]; then
    print_error "PGUSER is not set"
    missing_vars=1
  else
    print_success "PGUSER: $PGUSER"
  fi
  
  if [ -z "$PGPASSWORD" ]; then
    print_error "PGPASSWORD is not set"
    missing_vars=1
  else
    print_success "PGPASSWORD: ****"
  fi
  
  if [ -z "$PGDATABASE" ]; then
    print_error "PGDATABASE is not set"
    missing_vars=1
  else
    print_success "PGDATABASE: $PGDATABASE"
  fi
  
  if [ ! -d "$MIGRATIONS_DIR" ]; then
    print_error "Migrations directory not found: $MIGRATIONS_DIR"
    exit 1
  else
    print_success "Migrations directory found"
  fi
  
  if [ $missing_vars -eq 1 ]; then
    echo ""
    print_error "Missing required environment variables"
    echo "Please set: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE"
    exit 1
  fi
  
  echo ""
}

# Test database connection
test_connection() {
  print_header "TESTING DATABASE CONNECTION"
  
  export PGHOST PGPORT PGUSER PGDATABASE PGPASSWORD
  
  print_info "Connecting to $PGHOST:$PGPORT/$PGDATABASE as $PGUSER..."
  
  if psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT version();" > /dev/null 2>&1; then
    print_success "Database connection successful!"
    
    # Get version info
    local version=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c "SELECT version();")
    echo "PostgreSQL: $(echo $version | cut -d' ' -f1-3)"
    echo ""
  else
    print_error "Failed to connect to database"
    print_info "Please verify your connection parameters:"
    echo "  Host: $PGHOST"
    echo "  Port: $PGPORT"
    echo "  Database: $PGDATABASE"
    echo "  User: $PGUSER"
    exit 1
  fi
}

# Create schema_migrations table
create_migrations_table() {
  print_info "Creating schema_migrations table..."
  
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" << 'EOF'
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version TEXT PRIMARY KEY,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
EOF
  
  print_success "schema_migrations table ready"
}

# Check if migration has been executed
is_migration_executed() {
  local version=$1
  local count=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c "SELECT COUNT(*) FROM public.schema_migrations WHERE version = '$version';")
  [ "$count" -gt 0 ]
}

# Record migration execution
record_migration() {
  local version=$1
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "INSERT INTO public.schema_migrations (version) VALUES ('$version');"
}

# Execute single migration
execute_migration() {
  local migration_file=$1
  local migration_path="$MIGRATIONS_DIR/$migration_file"
  local version="${migration_file%.sql}"
  
  if [ ! -f "$migration_path" ]; then
    print_error "Migration file not found: $migration_path"
    return 1
  fi
  
  print_info "Executing: $migration_file"
  
  if psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$migration_path" > /dev/null 2>&1; then
    record_migration "$version"
    print_success "Migration completed: $migration_file"
    return 0
  else
    print_error "Migration failed: $migration_file"
    return 1
  fi
}

# Run all migrations
run_migrations() {
  print_header "EXECUTING MIGRATIONS (${#MIGRATIONS[@]} total)"
  
  local executed=0
  local skipped=0
  local failed=0
  
  for migration in "${MIGRATIONS[@]}"; do
    local version="${migration%.sql}"
    
    if is_migration_executed "$version"; then
      print_warning "Skipping $migration (already executed)"
      ((skipped++))
    else
      if execute_migration "$migration"; then
        ((executed++))
      else
        print_error "Failed to execute: $migration"
        ((failed++))
        exit 1
      fi
    fi
  done
  
  echo ""
  print_header "MIGRATION SUMMARY"
  print_info "Total migrations: ${#MIGRATIONS[@]}"
  print_success "Executed: $executed"
  print_warning "Skipped: $skipped"
  
  if [ $failed -gt 0 ]; then
    print_error "Failed: $failed"
    exit 1
  fi
}

# Verify database
verify_database() {
  print_header "VERIFICATION"
  
  # Count tables
  local table_count=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
  print_success "Total tables created: $table_count"
  
  # List tables
  echo ""
  print_info "Tables in public schema:"
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;" | tail -n +3 | head -n -2 | sed 's/^ */  - /'
  
  # Check hire view data
  echo ""
  print_info "Hire View Data Summary:"
  local hire_sections=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c "SELECT COUNT(*) FROM public.hire_sections;")
  local hire_skills=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c "SELECT COUNT(*) FROM public.hire_skills;")
  local hire_exp=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c "SELECT COUNT(*) FROM public.hire_experience;")
  local hire_contact=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c "SELECT COUNT(*) FROM public.hire_contact_fields;")
  
  print_success "Hire Sections: $hire_sections"
  print_success "Hire Skills: $hire_skills"
  print_success "Hire Experiences: $hire_exp"
  print_success "Hire Contact Fields: $hire_contact"
}

# Main execution
main() {
  echo ""
  print_header "PRODUCTION MIGRATION RUNNER FOR POSTGRESQL"
  
  validate_environment
  test_connection
  create_migrations_table
  run_migrations
  verify_database
  
  echo ""
  echo -e "${GREEN}${BOLD}✓✓✓ ALL MIGRATIONS COMPLETED SUCCESSFULLY! ✓✓✓${NC}"
  echo -e "${BOLD}Your database is now ready for production use.${NC}"
  echo ""
}

# Run main function
main
