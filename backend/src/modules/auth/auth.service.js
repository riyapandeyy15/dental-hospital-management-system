const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../../models/User');
const env = require('../../config/env');
const ApiError = require('../../utils/apiError');

const SALT_ROUNDS = 10;

async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

// Never include passwordHash in anything returned to a client.
function toSafeUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role,
    isActive: userDoc.isActive,
    createdAt: userDoc.createdAt,
  };
}

function generateToken(userDoc) {
  return jwt.sign({ sub: userDoc._id.toString(), role: userDoc.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

async function login(email, password) {
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });

  // Same message for "no such user" and "wrong password" - this avoids
  // revealing which emails have accounts.
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (!user.isActive) {
    throw new ApiError(401, 'This account has been deactivated.');
  }

  const token = generateToken(user);
  return { token, user: toSafeUser(user) };
}

async function getSafeUserById(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }
  return toSafeUser(user);
}

module.exports = {
  hashPassword,
  generateToken,
  login,
  getSafeUserById,
  toSafeUser,
};
