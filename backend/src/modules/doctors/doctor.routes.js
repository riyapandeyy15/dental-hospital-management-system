const express = require('express');
const { body } = require('express-validator');

const doctorController = require('./doctor.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

const router = express.Router();

// Every doctor-management endpoint requires a valid JWT and the ADMIN role.
// Doctors have no access to any route in this router.
router.use(requireAuth, requireRole('ADMIN'));

router.get('/', doctorController.list);
router.get('/:id', doctorController.getById);

router.post(
  '/',
  [
    body('name').isString().trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password')
      .isString()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters.'),
    body('specialization').isString().trim().notEmpty().withMessage('Specialization is required.'),
    body('phone').optional({ checkFalsy: true }).isString(),
    body('experienceYears')
      .optional({ checkFalsy: true })
      .isFloat({ min: 0 })
      .withMessage('Experience must be a positive number.'),
  ],
  doctorController.create
);

router.put(
  '/:id',
  [
    body('name').optional().isString().trim().notEmpty().withMessage('Name cannot be empty.'),
    body('email').optional().isEmail().withMessage('A valid email is required.'),
    body('specialization')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Specialization cannot be empty.'),
    body('phone').optional({ checkFalsy: true }).isString(),
    body('experienceYears')
      .optional({ checkFalsy: true })
      .isFloat({ min: 0 })
      .withMessage('Experience must be a positive number.'),
  ],
  doctorController.update
);

router.patch(
  '/:id/status',
  [body('isActive').isBoolean().withMessage('isActive must be true or false.')],
  doctorController.setStatus
);

module.exports = router;
