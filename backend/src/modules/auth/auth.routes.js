const express = require('express');
const { body } = require('express-validator');

const authController = require('./auth.controller');
const requireAuth = require('../../middleware/auth');

const router = express.Router();

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password').isString().notEmpty().withMessage('Password is required.'),
  ],
  authController.login
);

router.post(
  '/register',
  [
    body('name').isString().trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('A valid email is required.'),
    body('phone').isString().trim().notEmpty().withMessage('Phone number is required.'),
    body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  ],
  authController.register
);

router.get('/me', requireAuth, authController.me);

module.exports = router;
