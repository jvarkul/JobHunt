const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.email = userData.email;
    this.password = userData.password;
    this.created_at = userData.created_at;
    this.updated_at = userData.updated_at;
  }

  // Create a new user
  static async create(userData) {
    const { email, password } = userData;

    // Hash password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await query(
      `INSERT INTO users (email, password)
       VALUES ($1, $2)
       RETURNING id, email, created_at, updated_at`,
      [email, hashedPassword]
    );

    return new User(result.rows[0]);
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new User(result.rows[0]);
  }

  // Find user by ID
  static async findById(id) {
    const result = await query(
      'SELECT id, email, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new User(result.rows[0]);
  }

  // Check if password matches
  async matchPassword(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  }

  // Generate JWT token
  getSignedJwtToken() {
    return jwt.sign(
      { id: this.id, email: this.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  // Convert to safe object (without password)
  toSafeObject() {
    return {
      id: this.id,
      email: this.email,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Update user
  async update(updateData) {
    const { email } = updateData;

    const result = await query(
      `UPDATE users
       SET email = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, email, created_at, updated_at`,
      [email, this.id]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    Object.assign(this, result.rows[0]);
    return this;
  }

  // Delete user
  async delete() {
    await query('DELETE FROM users WHERE id = $1', [this.id]);
  }
}

module.exports = User;