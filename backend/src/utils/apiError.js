// A thrown ApiError carries the HTTP status it should produce. The central
// error handler in app.js already reads `err.status`, so any service or
// middleware can just `throw new ApiError(401, 'message')` and the right
// status code comes out the other end without extra plumbing.
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = ApiError;
