# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack job hunting application with Angular 20+ frontend and Express.js backend, using PostgreSQL for data persistence. The application helps users manage job applications, work experience, and bullet points for resumes.

## Development Commands

### Backend (Express.js API)
```bash
cd backend
npm run dev           # Start development server with nodemon (auto-reload)
npm start             # Start production server
npm run init-db       # Initialize database (alternative to bash scripts)
node scripts/setup-dev.js  # Create .env file from template
```

### Frontend (Angular)
```bash
cd frontend
npm start             # Start dev server with API proxy (recommended)
npm run start:no-proxy  # Start dev server without proxy
npm run build         # Production build
npm test              # Run Jasmine/Karma tests
```

### Database Management
All scripts are located in `backend/database/` and require PostgreSQL to be running:
```bash
cd backend/database
./init_db.sh          # Initialize all tables (users, bullets, experience, experience_bullets)
./seed_db.sh          # Populate tables with sample data
./reset_db.sh         # Drop all tables, recreate, and seed with sample data
./verify_db.sh        # Verify database structure and data
```

SQL files are executed in order:
- `initilization/01_users.sql` - Users table with bcrypt password hashing
- `initilization/02_bullets.sql` - Bullet points table with user foreign key
- `initilization/03_experience.sql` - Work experience with date validation
- `initilization/04_experience_bullets.sql` - Many-to-many junction table

## Architecture

### Backend Structure

**Stack**: Express.js + PostgreSQL with `pg` connection pooling

**Request Flow**:
1. Security middleware (helmet, rate-limit, CORS)
2. Body parser (JSON/URL-encoded)
3. Route handlers (`/api/auth`, `/api/bullets`, `/api/experience`)
4. Auth middleware (`protect`) validates JWT from Authorization header
5. Model layer queries PostgreSQL via connection pool
6. Global error handler returns standardized JSON responses

**Key Files**:
- `server.js` - Express app setup, middleware chain, route registration
- `config/database.js` - PostgreSQL pool configuration with helper methods (`query`, `getClient` for transactions)
- `middleware/auth.js` - JWT verification, attaches `req.user` to protected routes
- `middleware/errorHandler.js` - Handles PostgreSQL errors (23505 duplicate, 23503 foreign key), JWT errors, validation errors
- `models/` - Database models with static methods (User, Bullet, Experience, ExperienceBullet)
- `routes/` - Express routers with express-validator validation

**Authentication**: JWT tokens with configurable expiry (default 24h), bcrypt password hashing (12 rounds)

### Frontend Structure

**Stack**: Angular 20+ with standalone components, RxJS, Tailwind CSS

**Routing Architecture**:
- Public routes: `/login` (with loginGuard to redirect authenticated users)
- Protected routes: `/dashboard` with child routes (experience, bullets, jobs)
- Auth guards: `authGuard` verifies session validity via API call before allowing access

**Key Files**:
- `app.routes.ts` - Route definitions with guard protection
- `guards/auth.guard.ts` - authGuard and loginGuard (functional guards using inject())
- `interceptors/auth.interceptor.ts` - Functional interceptor that auto-attaches JWT token to requests, handles 401 by logging out
- `services/auth.service.ts` - Authentication state management, token storage in localStorage
- `services/bullets.service.ts` - Bullet CRUD operations
- `services/experience.service.ts` - Experience and experience-bullet association CRUD
- `components/` - Feature components (homepage, login, bullets, experience, jobs)

**API Communication**: All `/api/*` requests are proxied to `http://localhost:3000` via `proxy.conf.json` to avoid CORS issues in development.

### Database Schema

**users**
- id (BIGSERIAL PK), email (unique), password (bcrypt hashed)
- Cascade deletes to bullets and experience

**bullets**
- id (BIGSERIAL PK), user_id (FK → users.id), text
- Reusable bullet points that can be associated with multiple experiences

**experience**
- id (BIGSERIAL PK), user_id (FK → users.id), company_name, job_title, start_date, end_date, isCurrentlyWorkingHere
- Constraints: start_date ≤ end_date, if currently working then end_date must be NULL
- Cascade deletes to experience_bullets

**experience_bullets** (junction table)
- id (BIGSERIAL PK), experience_id (FK → experience.id), bullet_id (FK → bullets.id)
- Unique constraint on (experience_id, bullet_id) pair
- Enables many-to-many relationship between experience and bullets

### Authentication Flow

1. User submits email/password to `POST /api/auth/login`
2. Backend validates credentials, generates JWT with user ID payload
3. Frontend stores token in localStorage via AuthService
4. HTTP interceptor automatically attaches `Authorization: Bearer <token>` header to all API requests
5. Protected routes use `protect` middleware to verify JWT and attach user to `req.user`
6. On 401 response, interceptor calls logout() and redirects to login

## Key Development Patterns

### Adding New Protected API Endpoints

1. Create model in `backend/models/` with static methods for CRUD operations
2. Create route file in `backend/routes/`
3. Import `protect` middleware: `const { protect } = require('../middleware/auth');`
4. Apply to routes: `router.get('/endpoint', protect, validationMiddleware, controllerFunction);`
5. Access authenticated user via `req.user.id` in route handlers
6. Register route in `server.js`: `app.use('/api/resource', resourceRoutes);`

### Working with Database Models

All models use the shared `query` function from `config/database.js`:
```javascript
const { query } = require('../config/database');

// Simple query
const result = await query('SELECT * FROM table WHERE id = $1', [id]);

// Transaction (use getClient)
const { getClient } = require('../config/database');
const client = await getClient();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO ...');
  await client.query('UPDATE ...');
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

### Frontend Service Pattern

Services use HttpClient with RxJS observables. The auth interceptor automatically handles token injection:
```typescript
// No need to manually add auth headers
this.http.get<ResponseType>('/api/resource')
  .subscribe(data => { /* handle data */ });
```

### Environment Variables

Backend requires `.env` file (create from `.env.example`):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jobhuntdb
DB_USER=your_username
DB_PASSWORD=your_password

PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:4200

JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=24h

BCRYPT_SALT_ROUNDS=12
```

## Testing

- API health check: `GET http://localhost:3000/health`
- Verify backend is running before starting frontend
- Use `npm start` (with proxy) in frontend to avoid CORS issues
- Frontend runs on `http://localhost:4200`, backend on `http://localhost:3000`
