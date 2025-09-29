#!/bin/bash

# Database Seeding Script
# This script populates the database with sample data

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

echo -e "${YELLOW}🌱 Seeding database with sample data...${NC}"

# Show usage if help is requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -v, --verbose    Show detailed SQL output"
    echo "  -h, --help       Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  DB_HOST          Database host (default: localhost)"
    echo "  DB_PORT          Database port (default: 5432)"
    echo "  DB_NAME          Database name (default: jobhuntdb)"
    echo "  DB_USER          Database user (default: jessevarkul)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Normal mode"
    echo "  $0 -v                 # Verbose mode"
    echo "  VERBOSE=true $0       # Verbose mode via environment"
    exit 0
fi

# Set verbose mode if requested
if [[ "$1" == "-v" || "$1" == "--verbose" ]]; then
    export VERBOSE=true
fi

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

    # Store the output and error for debugging
    local output
    local exit_code

    if [[ "${VERBOSE:-false}" == "true" ]]; then
        # Verbose mode: show all output
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"
        exit_code=$?
    else
        # Normal mode: capture output but show errors
        output=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file" 2>&1)
        exit_code=$?
    fi

    if [[ $exit_code -eq 0 ]]; then
        echo -e "   ${GREEN}✅ $filename completed successfully${NC}"
    else
        echo -e "   ${RED}❌ Error running $filename${NC}"
        echo -e "   ${RED}Error details:${NC}"
        echo "$output" | sed 's/^/   /'
        exit 1
    fi
}

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FEEDER_DIR="$SCRIPT_DIR/feeder"

# Check if feeder directory exists
if [ ! -d "$FEEDER_DIR" ]; then
    echo -e "${RED}❌ Error: Feeder directory not found at $FEEDER_DIR${NC}"
    exit 1
fi

echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Run all SQL files in the feeder directory in order
for sql_file in "$FEEDER_DIR"/*.sql; do
    if [ -f "$sql_file" ]; then
        run_sql_file "$sql_file"
    fi
done

echo ""
echo -e "${GREEN}🎉 Database seeding completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📊 Sample data added:${NC}"
echo -e "   • 5 test users"
echo -e "   • 20 sample bullet points"
echo ""
echo -e "${YELLOW}💡 You can now:${NC}"
echo -e "   • Connect to your database and verify the data"
echo -e "   • Start developing your application"