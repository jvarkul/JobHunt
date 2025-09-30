const { query } = require('../config/database');

class Bullet {
  constructor(bulletData) {
    this.id = bulletData.id;
    this.user_id = bulletData.user_id;
    this.text = bulletData.text;
    this.created_at = bulletData.created_at;
    this.updated_at = bulletData.updated_at;
  }

  // Create a new bullet
  static async create(bulletData) {
    const { user_id, text } = bulletData;

    const result = await query(
      `INSERT INTO bullets (user_id, text)
       VALUES ($1, $2)
       RETURNING *`,
      [user_id, text]
    );

    return new Bullet(result.rows[0]);
  }

  // Get all bullets for a user (sorted by updated_at DESC)
  static async findByUserId(userId, options = {}) {
    const { limit, offset } = options;

    let queryText = `
      SELECT * FROM bullets
      WHERE user_id = $1
      ORDER BY updated_at DESC
    `;
    let queryParams = [userId];

    if (limit) {
      queryText += ` LIMIT $${queryParams.length + 1}`;
      queryParams.push(limit);
    }

    if (offset) {
      queryText += ` OFFSET $${queryParams.length + 1}`;
      queryParams.push(offset);
    }

    const result = await query(queryText, queryParams);

    return result.rows.map(row => new Bullet(row));
  }

  // Get total count of bullets for a user
  static async countByUserId(userId) {
    const result = await query(
      'SELECT COUNT(*) as total FROM bullets WHERE user_id = $1',
      [userId]
    );

    return parseInt(result.rows[0].total);
  }

  // Find bullet by ID and user ID (for authorization)
  static async findByIdAndUserId(id, userId) {
    const result = await query(
      'SELECT * FROM bullets WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new Bullet(result.rows[0]);
  }

  // Find bullet by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM bullets WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new Bullet(result.rows[0]);
  }

  // Update bullet
  async update(updateData) {
    const { text } = updateData;

    const result = await query(
      `UPDATE bullets
       SET text = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [text, this.id]
    );

    if (result.rows.length === 0) {
      throw new Error('Bullet not found');
    }

    Object.assign(this, result.rows[0]);
    return this;
  }

  // Delete bullet
  async delete() {
    await query('DELETE FROM bullets WHERE id = $1', [this.id]);
  }

  // Check if user owns this bullet
  belongsToUser(userId) {
    return this.user_id === parseInt(userId);
  }

  // Convert to plain object
  toObject() {
    return {
      id: this.id,
      user_id: this.user_id,
      text: this.text,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Search bullets by text content
  static async search(userId, searchTerm, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const result = await query(
      `SELECT * FROM bullets
       WHERE user_id = $1 AND text ILIKE $2
       ORDER BY updated_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, `%${searchTerm}%`, limit, offset]
    );

    return result.rows.map(row => new Bullet(row));
  }
}

module.exports = Bullet;