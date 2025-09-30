const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Job = require('../models/Job');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get all jobs for the authenticated user
// @route   GET /api/jobs
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
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
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

    const { limit, offset, search } = req.query;
    const userId = req.user.id;

    let jobs;
    let total;

    if (search) {
      // Search jobs
      jobs = await Job.search(userId, search, {
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0
      });
      total = jobs.length; // For simplicity, not implementing search count
    } else {
      // Get all jobs
      jobs = await Job.findByUserId(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      total = await Job.countByUserId(userId);
    }

    res.status(200).json({
      success: true,
      jobs: jobs.map(job => job.toObject()),
      total,
      count: jobs.length
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUserId(req.params.id, req.user.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      job: job.toObject()
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private
router.post('/', [
  body('company_name')
    .notEmpty()
    .isLength({ min: 2, max: 255 })
    .withMessage('Company name must be between 2 and 255 characters')
    .trim(),
  body('description')
    .notEmpty()
    .isLength({ min: 3, max: 2000 })
    .withMessage('Job description must be between 3 and 2000 characters')
    .trim(),
  body('application_link')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Application link must be a valid URL')
    .trim()
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

    const { company_name, description, application_link } = req.body;
    const userId = req.user.id;

    const job = await Job.create({
      user_id: userId,
      company_name,
      description,
      application_link
    });

    res.status(201).json({
      success: true,
      job: job.toObject()
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private
router.put('/:id', [
  body('company_name')
    .notEmpty()
    .isLength({ min: 2, max: 255 })
    .withMessage('Company name must be between 2 and 255 characters')
    .trim(),
  body('description')
    .notEmpty()
    .isLength({ min: 3, max: 2000 })
    .withMessage('Job description must be between 3 and 2000 characters')
    .trim(),
  body('application_link')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Application link must be a valid URL')
    .trim()
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

    const job = await Job.findByIdAndUserId(req.params.id, req.user.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const { company_name, description, application_link } = req.body;
    await job.update({ company_name, description, application_link });

    res.status(200).json({
      success: true,
      job: job.toObject()
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUserId(req.params.id, req.user.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    await job.delete();

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
