const express = require('express');
const { body, validationResult, query, param } = require('express-validator');
const Experience = require('../models/Experience');
const ExperienceBullet = require('../models/ExperienceBullet');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get all experiences for the authenticated user
// @route   GET /api/experience
// @access  Private
router.get('/', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  query('includeBullets')
    .optional()
    .isBoolean()
    .withMessage('includeBullets must be a boolean'),
  query('orderBy')
    .optional()
    .isIn(['start_date', 'end_date', 'company_name', 'job_title', 'created_at'])
    .withMessage('orderBy must be one of: start_date, end_date, company_name, job_title, created_at'),
  query('orderDirection')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('orderDirection must be ASC or DESC')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      limit,
      offset,
      includeBullets = false,
      orderBy = 'start_date',
      orderDirection = 'DESC'
    } = req.query;

    if (includeBullets === 'true') {
      // Get experiences with bullets
      const experiences = await ExperienceBullet.getExperienceWithBullets(req.user.id);
      res.status(200).json({
        success: true,
        experiences,
        total: experiences.length
      });
    } else {
      // Get experiences only
      const experiences = await Experience.findByUserId(req.user.id, {
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
        orderBy,
        orderDirection
      });

      const total = await Experience.getCountByUserId(req.user.id);

      res.status(200).json({
        success: true,
        experiences: experiences.map(exp => exp.toSafeObject()),
        total
      });
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Get a single experience by ID
// @route   GET /api/experience/:id
// @access  Private
router.get('/:id', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Experience ID must be a positive integer'),
  query('includeBullets')
    .optional()
    .isBoolean()
    .withMessage('includeBullets must be a boolean')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { includeBullets = false } = req.query;

    if (includeBullets === 'true') {
      // Get experience with bullets
      const experiences = await ExperienceBullet.getExperienceWithBullets(req.user.id, req.params.id);

      if (experiences.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Experience not found'
        });
      }

      res.status(200).json({
        success: true,
        experience: experiences[0]
      });
    } else {
      // Get experience only
      const experience = await Experience.findByIdAndUserId(req.params.id, req.user.id);

      if (!experience) {
        return res.status(404).json({
          success: false,
          error: 'Experience not found'
        });
      }

      res.status(200).json({
        success: true,
        experience: experience.toSafeObject()
      });
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Create a new experience
// @route   POST /api/experience
// @access  Private
router.post('/', [
  body('company_name')
    .notEmpty()
    .isLength({ min: 1, max: 255 })
    .withMessage('Company name is required and must be between 1 and 255 characters'),
  body('job_title')
    .notEmpty()
    .isLength({ min: 1, max: 255 })
    .withMessage('Job title is required and must be between 1 and 255 characters'),
  body('start_date')
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  body('end_date')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('End date must be a valid date (YYYY-MM-DD)'),
  body('isCurrentlyWorkingHere')
    .isBoolean()
    .withMessage('isCurrentlyWorkingHere must be a boolean'),
  body('end_date').custom((value, { req }) => {
    const { start_date, isCurrentlyWorkingHere } = req.body;

    // If currently working, end_date should not be provided or should be null
    if (isCurrentlyWorkingHere && value) {
      throw new Error('End date should not be provided when currently working');
    }

    // If not currently working, end_date is required
    if (!isCurrentlyWorkingHere && !value) {
      throw new Error('End date is required when not currently working');
    }

    // If both dates are provided, end_date should be after start_date
    if (value && start_date && new Date(value) <= new Date(start_date)) {
      throw new Error('End date must be after start date');
    }

    return true;
  })
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const experienceData = {
      user_id: req.user.id,
      ...req.body
    };

    const experience = await Experience.create(experienceData);

    res.status(201).json({
      success: true,
      experience: experience.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update an experience
// @route   PUT /api/experience/:id
// @access  Private
router.put('/:id', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Experience ID must be a positive integer'),
  body('company_name')
    .notEmpty()
    .isLength({ min: 1, max: 255 })
    .withMessage('Company name is required and must be between 1 and 255 characters'),
  body('job_title')
    .notEmpty()
    .isLength({ min: 1, max: 255 })
    .withMessage('Job title is required and must be between 1 and 255 characters'),
  body('start_date')
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  body('end_date')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('End date must be a valid date (YYYY-MM-DD)'),
  body('isCurrentlyWorkingHere')
    .isBoolean()
    .withMessage('isCurrentlyWorkingHere must be a boolean'),
  body('end_date').custom((value, { req }) => {
    const { start_date, isCurrentlyWorkingHere } = req.body;

    // If currently working, end_date should not be provided or should be null
    if (isCurrentlyWorkingHere && value) {
      throw new Error('End date should not be provided when currently working');
    }

    // If not currently working, end_date is required
    if (!isCurrentlyWorkingHere && !value) {
      throw new Error('End date is required when not currently working');
    }

    // If both dates are provided, end_date should be after start_date
    if (value && start_date && new Date(value) <= new Date(start_date)) {
      throw new Error('End date must be after start date');
    }

    return true;
  })
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Find the experience and verify ownership
    const experience = await Experience.findByIdAndUserId(req.params.id, req.user.id);

    if (!experience) {
      return res.status(404).json({
        success: false,
        error: 'Experience not found'
      });
    }

    // Update the experience
    await experience.update(req.body);

    res.status(200).json({
      success: true,
      experience: experience.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete an experience
// @route   DELETE /api/experience/:id
// @access  Private
router.delete('/:id', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Experience ID must be a positive integer')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Find the experience and verify ownership
    const experience = await Experience.findByIdAndUserId(req.params.id, req.user.id);

    if (!experience) {
      return res.status(404).json({
        success: false,
        error: 'Experience not found'
      });
    }

    // Delete the experience (this will cascade delete experience_bullets)
    await experience.delete();

    res.status(200).json({
      success: true,
      message: 'Experience deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Associate a bullet with an experience
// @route   POST /api/experience/:id/bullets
// @access  Private
router.post('/:id/bullets', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Experience ID must be a positive integer'),
  body('bullet_id')
    .isInt({ min: 1 })
    .withMessage('Bullet ID must be a positive integer')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const experienceId = req.params.id;
    const { bullet_id } = req.body;

    // Validate ownership of both experience and bullet
    await ExperienceBullet.validateOwnership(experienceId, bullet_id, req.user.id);

    // Create the association
    const association = await ExperienceBullet.create({
      experience_id: experienceId,
      bullet_id
    });

    res.status(201).json({
      success: true,
      association: association.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Remove a bullet association from an experience
// @route   DELETE /api/experience/:id/bullets/:bulletId
// @access  Private
router.delete('/:id/bullets/:bulletId', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Experience ID must be a positive integer'),
  param('bulletId')
    .isInt({ min: 1 })
    .withMessage('Bullet ID must be a positive integer')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const experienceId = req.params.id;
    const bulletId = req.params.bulletId;

    // Validate ownership of both experience and bullet
    await ExperienceBullet.validateOwnership(experienceId, bulletId, req.user.id);

    // Delete the association
    await ExperienceBullet.delete(experienceId, bulletId);

    res.status(200).json({
      success: true,
      message: 'Bullet association removed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user's experience statistics
// @route   GET /api/experience/stats
// @access  Private
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await ExperienceBullet.getUserStats(req.user.id);

    res.status(200).json({
      success: true,
      stats: {
        total_experiences: parseInt(stats.total_experiences) || 0,
        total_bullets_used: parseInt(stats.total_bullets_used) || 0,
        total_associations: parseInt(stats.total_associations) || 0,
        avg_bullets_per_experience: parseFloat(stats.avg_bullets_per_experience) || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;