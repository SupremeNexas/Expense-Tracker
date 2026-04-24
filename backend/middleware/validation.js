const { body, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

// Expense validation rules
const expenseRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must be under 200 characters'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('category_id')
    .isMongoId()
    .withMessage('Valid category is required'),
  body('date')
    .isISO8601()
    .withMessage('Valid date is required (YYYY-MM-DD)'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be under 500 characters'),
];

// Category validation rules
const categoryRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 50 })
    .withMessage('Name must be under 50 characters'),
  body('color')
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color (e.g. #FF6B6B)'),
  body('icon')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Icon name cannot be empty'),
];

// Budget validation rules
const budgetRules = [
  body('category_id')
    .isMongoId()
    .withMessage('Valid category is required'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Budget amount must be a positive number'),
  body('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  body('year')
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Year must be between 2020 and 2100'),
  body('period')
    .optional()
    .isIn(['monthly', 'weekly'])
    .withMessage('Period must be monthly or weekly'),
];

module.exports = {
  validate,
  expenseRules,
  categoryRules,
  budgetRules,
};
