# JobHunt Application

A full-stack job hunting application with Angular frontend and Express.js backend.

## 🏗️ Project Structure

```
JobHunt/
├── frontend/          # Angular application
├── backend/           # Express.js API
│   ├── config/        # Database configuration
│   ├── middleware/    # Express middleware
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── scripts/       # Setup and utility scripts
│   └── database/      # Database initialization files
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL
- npm

### 1. Database Setup

```bash
# Navigate to backend directory
cd backend

# Set up PostgreSQL database (ensure it's running)
createdb jobhuntdb

# Run database initialization
psql -U your_username -d jobhuntdb -f database/initilization/01_users.sql
psql -U your_username -d jobhuntdb -f database/initilization/02_bullets.sql

# Optional: Add sample data
psql -U your_username -d jobhuntdb -f database/feeder/users_feeder.sql
psql -U your_username -d jobhuntdb -f database/feeder/bullets_feeder.sql
```

### 2. Backend Setup

```bash
# Install dependencies
cd backend
npm install

# Set up environment variables
node scripts/setup-dev.js
# Edit .env file with your database credentials

# Start the backend server
npm run dev
```

The API will be available at `http://localhost:3000`

### 3. Frontend Setup

```bash
# Install dependencies
cd frontend
npm install

# Start the Angular development server (with proxy)
npm start
```

The frontend will be available at `http://localhost:4200` with API proxy configured.

## 🔧 Development

### Backend Development

- **Server**: `npm run dev` (with nodemon for auto-reload)
- **Health Check**: `GET http://localhost:3000/health`
- **Database**: Uses PostgreSQL with connection pooling

### Frontend Development

- **Development Server**: `npm start` (includes API proxy)
- **Without Proxy**: `npm run start:no-proxy`
- **Build**: `npm run build`

### API Proxy Configuration

The Angular development server is configured to proxy `/api/*` requests to `http://localhost:3000`. This eliminates CORS issues during development.

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Bullets Endpoints

- `GET /api/bullets` - Get user's bullets
- `POST /api/bullets` - Create new bullet
- `PUT /api/bullets/:id` - Update bullet
- `DELETE /api/bullets/:id` - Delete bullet

## 🔒 Authentication

The application uses JWT (JSON Web Tokens) for authentication:

1. User logs in with email/password
2. Server returns JWT token
3. Frontend stores token in localStorage
4. Token is automatically attached to API requests via HTTP interceptor
5. Backend validates token on protected routes

## 🗄️ Database Schema

### Users Table
- `id` (BIGSERIAL, Primary Key)
- `email` (VARCHAR, Unique)
- `password` (VARCHAR, Hashed)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### Bullets Table
- `id` (BIGSERIAL, Primary Key)
- `user_id` (BIGINT, Foreign Key → users.id)
- `text` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

## 🛠️ Available Scripts

### Backend Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run init-db    # Initialize database (if implemented)
```

### Frontend Scripts
```bash
npm start          # Start dev server with proxy
npm run start:no-proxy  # Start dev server without proxy
npm run build      # Build for production
npm test           # Run tests
```

## 🌟 Features

### Current Features
- ✅ User authentication (register/login)
- ✅ Session management with JWT
- ✅ CRUD operations for bullet points
- ✅ Real-time UI updates
- ✅ Form validation
- ✅ Responsive design
- ✅ Error handling

### Planned Features
- 🔄 Experience management
- 🔄 Job applications tracking
- 🔄 Resume builder
- 🔄 Cover letter templates

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Verify database exists

2. **API Not Found (404)**
   - Ensure backend server is running on port 3000
   - Check proxy configuration in `proxy.conf.json`

3. **Authentication Issues**
   - Check JWT secret in `.env`
   - Verify token storage in browser localStorage

4. **CORS Errors**
   - Use `npm start` (with proxy) instead of `npm run start:no-proxy`
   - Check CORS configuration in backend server

## 📝 Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jobhuntdb
DB_USER=your_username
DB_PASSWORD=your_password

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:4200

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=24h

# Security
BCRYPT_SALT_ROUNDS=12
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.