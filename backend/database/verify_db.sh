#!/bin/bash

# Database Verification Script
# This script checks the current state of the database tables

set -e  # Exit on any error

# Default database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-jobhuntdb}
DB_USER=${DB_USER:-jessevarkul}

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verifying database state...${NC}"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql command not found. Please install PostgreSQL.${NC}"
    exit 1
fi

# Function to run SQL query and display results
run_query() {
    local query=$1
    local description=$2

    echo -e "${CYAN}$description${NC}"
    echo -e "${YELLOW}Query: $query${NC}"

    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$query" 2>/dev/null; then
        echo ""
    else
        echo -e "${RED}❌ Error running query${NC}"
        echo ""
    fi
}

# Check if database exists and is accessible
echo -e "${YELLOW}📡 Testing database connection...${NC}"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to database${NC}"
    exit 1
fi
echo ""

# Check if tables exist
echo -e "${YELLOW}📋 Checking table existence...${NC}"
run_query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" "Tables in database:"

# Check users table
echo -e "${YELLOW}👥 Users table analysis:${NC}"
run_query "SELECT COUNT(*) as user_count FROM users;" "Total users:"
run_query "SELECT id, email, created_at FROM users ORDER BY id;" "All users:"

# Check bullets table
echo -e "${YELLOW}🔸 Bullets table analysis:${NC}"
run_query "SELECT COUNT(*) as bullet_count FROM bullets;" "Total bullets:"
run_query "SELECT COUNT(*) as users_with_bullets FROM (SELECT DISTINCT user_id FROM bullets) as unique_users;" "Users with bullets:"

# Check for foreign key constraint issues
echo -e "${YELLOW}🔗 Foreign key constraint check:${NC}"
run_query "SELECT b.user_id, COUNT(*) as bullet_count, u.email FROM bullets b LEFT JOIN users u ON b.user_id = u.id GROUP BY b.user_id, u.email ORDER BY b.user_id;" "Bullets by user (showing any orphaned bullets):"

# Check user ID sequence
echo -e "${YELLOW}🔢 User ID sequence analysis:${NC}"
run_query "SELECT MIN(id) as min_id, MAX(id) as max_id, COUNT(*) as total_users FROM users;" "User ID range:"

# Show sample bullets if any exist
echo -e "${YELLOW}📝 Sample bullets (first 5):${NC}"
run_query "SELECT b.id, b.user_id, u.email, LEFT(b.text, 50) || '...' as text_preview FROM bullets b JOIN users u ON b.user_id = u.id ORDER BY b.id LIMIT 5;" "Sample bullets:"

# Check for any constraint violations or issues
echo -e "${YELLOW}⚠️  Constraint and integrity checks:${NC}"
run_query "SELECT conname, contype FROM pg_constraint WHERE conrelid = 'bullets'::regclass;" "Constraints on bullets table:"

# Show detailed table schemas
if [[ "$1" == "-v" || "$1" == "--verbose" ]]; then
    echo -e "${YELLOW}📊 Detailed table schemas:${NC}"
    run_query "\d users" "Users table schema:"
    run_query "\d bullets" "Bullets table schema:"
fi

echo -e "${GREEN}🎉 Database verification completed!${NC}"

# Provide next steps based on findings
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo -e "   • Run with -v flag for detailed schema information"
echo -e "   • If bullets are missing, run: ./seed_db.sh -v"
echo -e "   • To reset everything: ./reset_db.sh"