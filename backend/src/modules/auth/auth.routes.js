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

router.get('/me', requireAuth, authController.me);

module.exports = router;
