const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../../models/User');
const Patient = require('../../models/Patient');
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

// Public self-registration for patients only - admin and doctor accounts
// are always created by an admin (see modules/doctors), never through this
// endpoint, so there is no way to self-register as staff.
async function registerPatient({ name, email, phone, password }) {
  if (!name || !email || !phone || !password) {
    throw new ApiError(400, 'name, email, phone and password are required.');
  }
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long.');
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const trimmedPhone = String(phone).trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists.');
  }
  const existingPatientPhone = await Patient.findOne({ phone: trimmedPhone });
  if (existingPatientPhone) {
    throw new ApiError(409, 'An account with this phone number already exists.');
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    role: 'PATIENT',
  });

  try {
    await Patient.create({
      userId: user._id,
      name: String(name).trim(),
      phone: trimmedPhone,
      email: normalizedEmail,
    });
  } catch (err) {
    // Roll back the User we just created so a failed Patient profile never
    // leaves behind an orphaned login account with no profile.
    await User.deleteOne({ _id: user._id });
    if (err.code === 11000) {
      throw new ApiError(409, 'An account with this phone number already exists.');
    }
    throw err;
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
  registerPatient,
  getSafeUserById,
  toSafeUser,
};
