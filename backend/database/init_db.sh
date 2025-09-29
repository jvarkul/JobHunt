#!/bin/bash

# Database Initialization Script
# This script runs all initialization SQL files in the correct order

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
NC='\033[0m' # No Color

echo -e "${YELLOW}🗃️  Initializing database tables...${NC}"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql command not found. Please install PostgreSQL.${NC}"
    exit 1
fi

# Function to run SQL file
run_sql_file() {
    local file=$1
    local filename=$(basename "$file")

    echo -e "   📄 Running $filename..."

    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file" > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ $filename completed successfully${NC}"
    else
        echo -e "   ${RED}❌ Error running $filename${NC}"
        exit 1
    fi
}

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INIT_DIR="$SCRIPT_DIR/initilization"

# Check if initialization directory exists
if [ ! -d "$INIT_DIR" ]; then
    echo -e "${RED}❌ Error: Initialization directory not found at $INIT_DIR${NC}"
    exit 1
fi

echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Run all SQL files in the initialization directory in order
for sql_file in "$INIT_DIR"/*.sql; do
    if [ -f "$sql_file" ]; then
        run_sql_file "$sql_file"
    fi
done

echo ""
echo -e "${GREEN}🎉 Database initialization completed successfully!${NC}"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo -e "   • Run './seed_db.sh' to populate tables with sample data"
echo -e "   • Or run './reset_db.sh' to drop and recreate everything with sample data"