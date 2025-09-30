const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Bullet = require('../models/Bullet');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get all bullets for the authenticated user
// @route   GET /api/bullets
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

    let bullets;
    let total;

    if (search) {
      // Search bullets
      bullets = await Bullet.search(userId, search, {
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0
      });
      total = bullets.length; // For simplicity, not implementing search count
    } else {
      // Get all bullets
      bullets = await Bullet.findByUserId(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      total = await Bullet.countByUserId(userId);
    }

    res.status(200).json({
      success: true,
      bullets: bullets.map(bullet => bullet.toObject()),
      total,
      count: bullets.length
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single bullet
// @route   GET /api/bullets/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const bullet = await Bullet.findByIdAndUserId(req.params.id, req.user.id);

    if (!bullet) {
      return res.status(404).json({
        success: false,
        error: 'Bullet not found'
      });
    }

    res.status(200).json({
      success: true,
      bullet: bullet.toObject()
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new bullet
// @route   POST /api/bullets
// @access  Private
router.post('/', [
  body('text')
    .notEmpty()
    .isLength({ min: 3, max: 500 })
    .withMessage('Bullet text must be between 3 and 500 characters')
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

    const { text } = req.body;
    const userId = req.user.id;

    const bullet = await Bullet.create({
      user_id: userId,
      text
    });

    res.status(201).json({
      success: true,
      bullet: bullet.toObject()
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update bullet
// @route   PUT /api/bullets/:id
// @access  Private
router.put('/:id', [
  body('text')
    .notEmpty()
    .isLength({ min: 3, max: 500 })
    .withMessage('Bullet text must be between 3 and 500 characters')
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

    const bullet = await Bullet.findByIdAndUserId(req.params.id, req.user.id);

    if (!bullet) {
      return res.status(404).json({
        success: false,
        error: 'Bullet not found'
      });
    }

    const { text } = req.body;
    await bullet.update({ text });

    res.status(200).json({
      success: true,
      bullet: bullet.toObject()
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete bullet
// @route   DELETE /api/bullets/:id
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const bullet = await Bullet.findByIdAndUserId(req.params.id, req.user.id);

    if (!bullet) {
      return res.status(404).json({
        success: false,
        error: 'Bullet not found'
      });
    }

    await bullet.delete();

    res.status(200).json({
      success: true,
      message: 'Bullet deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;