#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up JobHunt API for development...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from .env.example...');

  try {
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envExample);
    console.log('✅ .env file created successfully!');
    console.log('⚠️  Please update the database credentials and JWT secret in .env file\n');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Please run "npm install" in the backend directory to install dependencies\n');
}

console.log('🎯 Next steps:');
console.log('1. Update database credentials in .env file');
console.log('2. Run "npm install" if you haven\'t already');
console.log('3. Ensure PostgreSQL is running and database exists');
console.log('4. Run database initialization: npm run init-db (or manually execute SQL files)');
console.log('5. Start the server: npm run dev');
console.log('6. Start the Angular frontend with: npm start (in frontend directory)');
console.log('\n🔗 The Angular proxy will forward /api/* requests to http://localhost:3000');
console.log('💡 You can test the API at http://localhost:3000/health');