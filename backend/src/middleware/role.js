const ApiError = require('../utils/apiError');

// requireRole('ADMIN') or requireRole('ADMIN', 'DOCTOR') for a route shared
// between roles. Must run after requireAuth, since it reads req.user.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }

    next();
  };
}

module.exports = requireRole;
