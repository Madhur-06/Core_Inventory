const { body, param, query } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) break;
    }

    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    return res.status(400).json({ errors: errors.array() });
  };
};

const signupValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role').optional().isIn(['INVENTORY_MANAGER', 'WAREHOUSE_STAFF']).withMessage('Invalid role'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('unitOfMeasure').optional().trim().notEmpty(),
  body('reorderPoint').optional().isInt({ min: 0 }),
  body('reorderQty').optional().isInt({ min: 0 }),
];

const operationLineValidation = [
  body('lines').isArray({ min: 1 }).withMessage('At least one line item is required'),
  body('lines.*.productId').isUUID().withMessage('Valid product ID required'),
  body('lines.*.expectedQty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

module.exports = {
  validate,
  signupValidation,
  loginValidation,
  productValidation,
  operationLineValidation,
};
