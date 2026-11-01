// Error with an HTTP status code; thrown from controllers and turned into a JSON response by errorHandler
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = ApiError;
