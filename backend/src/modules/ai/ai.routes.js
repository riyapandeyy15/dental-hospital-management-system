const express = require('express');
const rateLimit = require('express-rate-limit');

const aiController = require('./ai.controller');
const requireAuth = require('../../middleware/auth');
const requireRole = require('../../middleware/role');

const router = express.Router();

// Cheap defense against accidental rapid-fire submissions (e.g. a stuck
// retry loop), not a full abuse-prevention system - keyed per IP like the
// rest of this app's rate limiting.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many messages. Please wait a moment and try again.' },
});

// Patient-only for now - role is read from the verified JWT via requireAuth,
// never trusted from the request body.
router.use(requireAuth, requireRole('PATIENT'));

router.post('/chat', chatLimiter, aiController.chat);

module.exports = router;
