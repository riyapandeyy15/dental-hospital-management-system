const jwt = require('jsonwebtoken');

const env = require('../config/env');
const ApiError = require('../utils/apiError');
const User = require('../models/User');

// Verifies the "Authorization: Bearer <token>" header and attaches a safe,
// minimal user object to req.user. Never attaches passwordHash.
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'Missing or malformed Authorization header.');
    }

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired token.');
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'Account no longer active.');
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = requireAuth;
