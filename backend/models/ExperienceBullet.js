const { query } = require('../config/database');

class ExperienceBullet {
  constructor(experienceBulletData) {
    this.id = experienceBulletData.id;
    this.experience_id = experienceBulletData.experience_id;
    this.bullet_id = experienceBulletData.bullet_id;
    this.created_at = experienceBulletData.created_at;
  }

  // Create a new experience-bullet association
  static async create(experienceBulletData) {
    const { experience_id, bullet_id } = experienceBulletData;

    try {
      const result = await query(
        `INSERT INTO experience_bullets (experience_id, bullet_id)
         VALUES ($1, $2)
         RETURNING *`,
        [experience_id, bullet_id]
      );

      return new ExperienceBullet(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('This bullet is already associated with this experience');
      }
      if (error.code === '23503') { // Foreign key constraint violation
        throw new Error('Invalid experience or bullet ID');
      }
      throw error;
    }
  }

  // Find association by experience and bullet IDs
  static async findByExperienceAndBullet(experienceId, bulletId) {
    const result = await query(
      'SELECT * FROM experience_bullets WHERE experience_id = $1 AND bullet_id = $2',
      [experienceId, bulletId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new ExperienceBullet(result.rows[0]);
  }

  // Find all associations for an experience
  static async findByExperienceId(experienceId) {
    const result = await query(
      'SELECT * FROM experience_bullets WHERE experience_id = $1 ORDER BY created_at ASC',
      [experienceId]
    );

    return result.rows.map(row => new ExperienceBullet(row));
  }

  // Find all associations for a bullet
  static async findByBulletId(bulletId) {
    const result = await query(
      'SELECT * FROM experience_bullets WHERE bullet_id = $1 ORDER BY created_at ASC',
      [bulletId]
    );

    return result.rows.map(row => new ExperienceBullet(row));
  }

  // Get experience details with bullets for a user
  static async getExperienceWithBullets(userId, experienceId = null) {
    let queryText = `
      SELECT
        e.id as experience_id,
        e.company_name,
        e.job_title,
        e.start_date,
        e.end_date,
        e.isCurrentlyWorkingHere,
        e.created_at as experience_created_at,
        e.updated_at as experience_updated_at,
        b.id as bullet_id,
        b.text as bullet_text,
        b.created_at as bullet_created_at,
        b.updated_at as bullet_updated_at,
        eb.created_at as association_created_at
      FROM experience e
      LEFT JOIN experience_bullets eb ON e.id = eb.experience_id
      LEFT JOIN bullets b ON eb.bullet_id = b.id
      WHERE e.user_id = $1
    `;

    const queryParams = [userId];

    if (experienceId) {
      queryText += ' AND e.id = $2';
      queryParams.push(experienceId);
    }

    queryText += ' ORDER BY e.start_date DESC, b.created_at ASC';

    const result = await query(queryText, queryParams);

    // Group results by experience
    const experiencesMap = new Map();

    result.rows.forEach(row => {
      const expId = row.experience_id;

      if (!experiencesMap.has(expId)) {
        experiencesMap.set(expId, {
          id: row.experience_id,
          company_name: row.company_name,
          job_title: row.job_title,
          start_date: row.start_date,
          end_date: row.end_date,
          isCurrentlyWorkingHere: row.iscurrentlyworkinghere,
          created_at: row.experience_created_at,
          updated_at: row.experience_updated_at,
          bullets: []
        });
      }

      // Add bullet if it exists
      if (row.bullet_id) {
        experiencesMap.get(expId).bullets.push({
          id: row.bullet_id,
          text: row.bullet_text,
          created_at: row.bullet_created_at,
          updated_at: row.bullet_updated_at,
          association_created_at: row.association_created_at
        });
      }
    });

    return Array.from(experiencesMap.values());
  }

  // Delete an association
  static async delete(experienceId, bulletId) {
    const result = await query(
      'DELETE FROM experience_bullets WHERE experience_id = $1 AND bullet_id = $2 RETURNING *',
      [experienceId, bulletId]
    );

    if (result.rows.length === 0) {
      throw new Error('Association not found');
    }

    return true;
  }

  // Delete all associations for an experience
  static async deleteByExperienceId(experienceId) {
    const result = await query(
      'DELETE FROM experience_bullets WHERE experience_id = $1 RETURNING *',
      [experienceId]
    );

    return result.rows.length;
  }

  // Delete all associations for a bullet
  static async deleteByBulletId(bulletId) {
    const result = await query(
      'DELETE FROM experience_bullets WHERE bullet_id = $1 RETURNING *',
      [bulletId]
    );

    return result.rows.length;
  }

  // Get statistics for user's experience-bullet associations
  static async getUserStats(userId) {
    const result = await query(
      `SELECT
        COUNT(DISTINCT e.id) as total_experiences,
        COUNT(DISTINCT b.id) as total_bullets_used,
        COUNT(eb.id) as total_associations,
        AVG(bullet_count.bullet_count) as avg_bullets_per_experience
      FROM experience e
      LEFT JOIN experience_bullets eb ON e.id = eb.experience_id
      LEFT JOIN bullets b ON eb.bullet_id = b.id
      LEFT JOIN (
        SELECT experience_id, COUNT(*) as bullet_count
        FROM experience_bullets
        GROUP BY experience_id
      ) bullet_count ON e.id = bullet_count.experience_id
      WHERE e.user_id = $1`,
      [userId]
    );

    return result.rows[0];
  }

  // Validate that user owns both experience and bullet before creating association
  static async validateOwnership(experienceId, bulletId, userId) {
    const result = await query(
      `SELECT
        e.user_id as experience_user_id,
        b.user_id as bullet_user_id
      FROM experience e, bullets b
      WHERE e.id = $1 AND b.id = $2`,
      [experienceId, bulletId]
    );

    if (result.rows.length === 0) {
      throw new Error('Experience or bullet not found');
    }

    const { experience_user_id, bullet_user_id } = result.rows[0];

    if (experience_user_id !== userId || bullet_user_id !== userId) {
      throw new Error('Access denied: You can only associate your own experiences and bullets');
    }

    return true;
  }

  // Convert to safe object (for API responses)
  toSafeObject() {
    return {
      id: this.id,
      experience_id: this.experience_id,
      bullet_id: this.bullet_id,
      created_at: this.created_at
    };
  }
}

module.exports = ExperienceBullet;