#!/bin/bash

# Database Reset Script
# This script drops existing tables and recreates them with sample data

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
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Resetting database...${NC}"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql command not found. Please install PostgreSQL.${NC}"
    exit 1
fi

echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Warning prompt
echo -e "${RED}⚠️  WARNING: This will drop all existing tables and data!${NC}"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Operation cancelled.${NC}"
    exit 0
fi

echo ""

# Drop existing tables
echo -e "${BLUE}🗑️  Dropping existing tables...${NC}"

DROP_SQL="
-- Drop tables in reverse order due to foreign key constraints
DROP TABLE IF EXISTS experience_bullets CASCADE;
DROP TABLE IF EXISTS experience CASCADE;
DROP TABLE IF EXISTS bullets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop the trigger function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
"

echo "$DROP_SQL" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1

echo -e "   ${GREEN}✅ Tables dropped successfully${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run initialization
echo -e "${BLUE}🏗️  Running initialization...${NC}"
if "$SCRIPT_DIR/init_db.sh"; then
    echo -e "   ${GREEN}✅ Initialization completed${NC}"
else
    echo -e "   ${RED}❌ Initialization failed${NC}"
    exit 1
fi

# Run seeding
echo -e "${BLUE}🌱 Running seeding...${NC}"
if "$SCRIPT_DIR/seed_db.sh"; then
    echo -e "   ${GREEN}✅ Seeding completed${NC}"
else
    echo -e "   ${RED}❌ Seeding failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Database reset completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📊 Your database now contains:${NC}"
echo -e "   • Fresh table structure"
echo -e "   • 5 test users"
echo -e "   • 20 sample bullet points"
echo -e "   • 50 sample work experiences"
echo -e "   • Experience-bullet associations"