# Database Setup Guide

This directory contains all the necessary files to set up and manage your PostgreSQL database for the JobHunt application.

## 📁 Directory Structure

```
database/
├── initilization/          # Table creation scripts
│   ├── 01_users.sql       # Users table
│   └── 02_bullets.sql     # Bullets table
├── feeder/                # Sample data scripts
│   ├── users_feeder.sql   # Sample users
│   └── bullets_feeder.sql # Sample bullets
├── init_db.sh            # Initialize tables
├── seed_db.sh            # Add sample data
├── reset_db.sh           # Drop and recreate everything
├── verify_db.sh          # Check database state and debug issues
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites
- PostgreSQL installed and running
- Database created (e.g., `jobhunt`)
- User with appropriate permissions

### Option 1: Using the Automation Scripts (Recommended)

1. **Initialize tables only:**
   ```bash
   cd backend/database
   ./init_db.sh
   ```

2. **Add sample data:**
   ```bash
   ./seed_db.sh
   ```

3. **Reset everything (drop + recreate + sample data):**
   ```bash
   ./reset_db.sh
   ```

4. **Verify database state and debug issues:**
   ```bash
   ./verify_db.sh
   ```

### Option 2: Manual Commands

1. **Initialize tables:**
   ```bash
   psql -U your_username -d your_database_name -f initilization/01_users.sql
   psql -U your_username -d your_database_name -f initilization/02_bullets.sql
   ```

2. **Add sample data:**
   ```bash
   psql -U your_username -d your_database_name -f feeder/users_feeder.sql
   psql -U your_username -d your_database_name -f feeder/bullets_feeder.sql
   ```

### Option 3: Batch Commands

```bash
# Initialize all tables
cat initilization/*.sql | psql -U your_username -d your_database_name

# Add all sample data
cat feeder/*.sql | psql -U your_username -d your_database_name
```

## ⚙️ Configuration

The automation scripts use environment variables for database connection:

```bash
export DB_HOST=localhost      # Default: localhost
export DB_PORT=5432          # Default: 5432
export DB_NAME=jobhunt       # Default: jobhunt
export DB_USER=postgres      # Default: postgres
```

You can also set these inline:
```bash
DB_NAME=my_database DB_USER=my_user ./init_db.sh
```

## 📊 Database Schema

### Users Table
| Column     | Type         | Notes                    |
|------------|--------------|--------------------------|
| id         | BIGSERIAL    | Primary key              |
| email      | VARCHAR(255) | Unique, not null         |
| password   | VARCHAR(255) | Not null                 |
| created_at | TIMESTAMPTZ  | Auto-generated           |
| updated_at | TIMESTAMPTZ  | Auto-updated on changes  |

### Bullets Table
| Column     | Type         | Notes                    |
|------------|--------------|--------------------------|
| id         | BIGSERIAL    | Primary key              |
| user_id    | BIGINT       | Foreign key to users.id  |
| text       | TEXT         | Not null                 |
| created_at | TIMESTAMPTZ  | Auto-generated           |
| updated_at | TIMESTAMPTZ  | Auto-updated on changes  |

## 🔗 Relationships
- `bullets.user_id` → `users.id` (CASCADE DELETE)

## 📝 Sample Data

After running the seeder scripts, you'll have:
- 5 test users with realistic email addresses
- 20 sample bullet points for resumes/experiences

## 🛠️ Troubleshooting

### Quick Debug Commands

1. **Check what's wrong:**
   ```bash
   ./verify_db.sh              # Basic verification
   ./verify_db.sh -v            # Detailed schemas
   ./seed_db.sh -v              # Verbose seeding with error details
   ```

### Common Issues

1. **Bullets not inserting:**
   - Run `./verify_db.sh` to check if users exist
   - Use `./seed_db.sh -v` to see detailed error messages
   - The new bullets feeder automatically finds user IDs

2. **Connection refused:**
   - Ensure PostgreSQL is running
   - Check your connection parameters
   - Verify the database exists

3. **Permission denied:**
   - Ensure your user has CREATE/INSERT permissions
   - Try connecting as a superuser first

4. **Table already exists:**
   - Use `./reset_db.sh` to drop and recreate tables
   - Or manually drop tables before running init scripts

5. **Foreign key constraint violations:**
   - The updated bullets feeder now prevents this issue
   - Verify users exist before running bullets feeder

### Useful Commands

```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql

# Connect to database
psql -U postgres -d jobhunt

# List tables
\dt

# Describe table structure
\d users
\d bullets
```

## 🔄 Development Workflow

1. **First time setup:**
   ```bash
   ./init_db.sh && ./seed_db.sh
   ```

2. **After schema changes:**
   ```bash
   ./reset_db.sh
   ```

3. **Add new sample data:**
   ```bash
   ./seed_db.sh
   ```

## 📚 Next Steps

Once your database is set up:
1. Configure your application's database connection
2. Set up database migrations for future schema changes
3. Implement proper authentication and password hashing
4. Add database indexing for performance optimization