const { query } = require('../config/database');

class Experience {
  constructor(experienceData) {
    this.id = experienceData.id;
    this.user_id = experienceData.user_id;
    this.company_name = experienceData.company_name;
    this.job_title = experienceData.job_title;
    this.start_date = experienceData.start_date;
    this.end_date = experienceData.end_date;
    this.isCurrentlyWorkingHere = experienceData.iscurrentlyworkinghere || experienceData.isCurrentlyWorkingHere;
    this.created_at = experienceData.created_at;
    this.updated_at = experienceData.updated_at;
  }

  // Create a new experience
  static async create(experienceData) {
    const { user_id, company_name, job_title, start_date, end_date, isCurrentlyWorkingHere } = experienceData;

    // Validate that if currently working, end_date should be null
    const finalEndDate = isCurrentlyWorkingHere ? null : end_date;

    const result = await query(
      `INSERT INTO experience (user_id, company_name, job_title, start_date, end_date, isCurrentlyWorkingHere)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, company_name, job_title, start_date, finalEndDate, isCurrentlyWorkingHere]
    );

    return new Experience(result.rows[0]);
  }

  // Find all experiences for a user
  static async findByUserId(userId, options = {}) {
    const { limit, offset, orderBy = 'start_date', orderDirection = 'DESC' } = options;

    let queryText = `
      SELECT * FROM experience
      WHERE user_id = $1
      ORDER BY ${orderBy} ${orderDirection}
    `;
    const queryParams = [userId];

    if (limit) {
      queryText += ` LIMIT $${queryParams.length + 1}`;
      queryParams.push(limit);
    }

    if (offset) {
      queryText += ` OFFSET $${queryParams.length + 1}`;
      queryParams.push(offset);
    }

    const result = await query(queryText, queryParams);
    return result.rows.map(row => new Experience(row));
  }

  // Find experience by ID and verify ownership
  static async findByIdAndUserId(experienceId, userId) {
    const result = await query(
      'SELECT * FROM experience WHERE id = $1 AND user_id = $2',
      [experienceId, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new Experience(result.rows[0]);
  }

  // Find experience by ID
  static async findById(experienceId) {
    const result = await query(
      'SELECT * FROM experience WHERE id = $1',
      [experienceId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new Experience(result.rows[0]);
  }

  // Update experience
  async update(updateData) {
    const { company_name, job_title, start_date, end_date, isCurrentlyWorkingHere } = updateData;

    // Validate that if currently working, end_date should be null
    const finalEndDate = isCurrentlyWorkingHere ? null : end_date;

    const result = await query(
      `UPDATE experience
       SET company_name = $1, job_title = $2, start_date = $3, end_date = $4,
           isCurrentlyWorkingHere = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [company_name, job_title, start_date, finalEndDate, isCurrentlyWorkingHere, this.id, this.user_id]
    );

    if (result.rows.length === 0) {
      throw new Error('Experience not found or access denied');
    }

    Object.assign(this, result.rows[0]);
    return this;
  }

  // Delete experience
  async delete() {
    const result = await query(
      'DELETE FROM experience WHERE id = $1 AND user_id = $2 RETURNING id',
      [this.id, this.user_id]
    );

    if (result.rows.length === 0) {
      throw new Error('Experience not found or access denied');
    }

    return true;
  }

  // Get experience with associated bullets
  async getBullets() {
    const result = await query(
      `SELECT b.* FROM bullets b
       INNER JOIN experience_bullets eb ON b.id = eb.bullet_id
       WHERE eb.experience_id = $1
       ORDER BY b.created_at ASC`,
      [this.id]
    );

    return result.rows;
  }

  // Associate a bullet with this experience
  async addBullet(bulletId) {
    // First verify the bullet belongs to the same user
    const bulletCheck = await query(
      'SELECT user_id FROM bullets WHERE id = $1',
      [bulletId]
    );

    if (bulletCheck.rows.length === 0) {
      throw new Error('Bullet not found');
    }

    if (bulletCheck.rows[0].user_id !== this.user_id) {
      throw new Error('Cannot associate bullet from different user');
    }

    // Insert the association (will fail if already exists due to unique constraint)
    try {
      const result = await query(
        'INSERT INTO experience_bullets (experience_id, bullet_id) VALUES ($1, $2) RETURNING *',
        [this.id, bulletId]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Bullet is already associated with this experience');
      }
      throw error;
    }
  }

  // Remove bullet association from this experience
  async removeBullet(bulletId) {
    const result = await query(
      'DELETE FROM experience_bullets WHERE experience_id = $1 AND bullet_id = $2 RETURNING *',
      [this.id, bulletId]
    );

    if (result.rows.length === 0) {
      throw new Error('Bullet association not found');
    }

    return true;
  }

  // Get count of experiences for a user
  static async getCountByUserId(userId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM experience WHERE user_id = $1',
      [userId]
    );

    return parseInt(result.rows[0].count);
  }

  // Convert to safe object (for API responses)
  toSafeObject() {
    return {
      id: this.id,
      user_id: this.user_id,
      company_name: this.company_name,
      job_title: this.job_title,
      start_date: this.start_date,
      end_date: this.end_date,
      isCurrentlyWorkingHere: this.isCurrentlyWorkingHere,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Experience;