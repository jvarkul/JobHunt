const { query } = require('../config/database');

class Job {
  constructor(jobData) {
    this.id = jobData.id;
    this.user_id = jobData.user_id;
    this.company_name = jobData.company_name;
    this.description = jobData.description;
    this.application_link = jobData.application_link;
    this.created_at = jobData.created_at;
    this.updated_at = jobData.updated_at;
  }

  // Create a new job
  static async create(jobData) {
    const { user_id, company_name, description, application_link } = jobData;

    const result = await query(
      `INSERT INTO jobs (user_id, company_name, description, application_link)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, company_name, description, application_link || null]
    );

    return new Job(result.rows[0]);
  }

  // Get all jobs for a user (sorted by updated_at DESC)
  static async findByUserId(userId, options = {}) {
    const { limit, offset } = options;

    let queryText = `
      SELECT * FROM jobs
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

    return result.rows.map(row => new Job(row));
  }

  // Get total count of jobs for a user
  static async countByUserId(userId) {
    const result = await query(
      'SELECT COUNT(*) as total FROM jobs WHERE user_id = $1',
      [userId]
    );

    return parseInt(result.rows[0].total);
  }

  // Find job by ID and user ID (for authorization)
  static async findByIdAndUserId(id, userId) {
    const result = await query(
      'SELECT * FROM jobs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new Job(result.rows[0]);
  }

  // Find job by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM jobs WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new Job(result.rows[0]);
  }

  // Update job
  async update(updateData) {
    const { company_name, description, application_link } = updateData;

    const result = await query(
      `UPDATE jobs
       SET company_name = $1, description = $2, application_link = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [company_name, description, application_link || null, this.id]
    );

    if (result.rows.length === 0) {
      throw new Error('Job not found');
    }

    Object.assign(this, result.rows[0]);
    return this;
  }

  // Delete job
  async delete() {
    await query('DELETE FROM jobs WHERE id = $1', [this.id]);
  }

  // Check if user owns this job
  belongsToUser(userId) {
    return this.user_id === parseInt(userId);
  }

  // Convert to plain object
  toObject() {
    return {
      id: this.id,
      user_id: this.user_id,
      company_name: this.company_name,
      description: this.description,
      application_link: this.application_link,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Search jobs by company name or description content
  static async search(userId, searchTerm, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const result = await query(
      `SELECT * FROM jobs
       WHERE user_id = $1 AND (company_name ILIKE $2 OR description ILIKE $2)
       ORDER BY updated_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, `%${searchTerm}%`, limit, offset]
    );

    return result.rows.map(row => new Job(row));
  }
}

module.exports = Job;
