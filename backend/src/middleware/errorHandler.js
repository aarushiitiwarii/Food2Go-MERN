const multer = require("multer");
const ApiError = require("../utils/ApiError");

const notFound = (req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// Single place that turns any error into a consistent JSON response
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  let status = err.statusCode || 500;
  let message = err.message || "Something went wrong";

  if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "Photo must be 5 MB or smaller" : err.message;
  } else if (err.name === "ValidationError") {
    status = 400; // mongoose schema validation
  } else if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = `${Object.keys(err.keyValue).join(", ")} already exists`;
  }

  if (status === 500) console.error(err);

  res.status(status).json({ message, ...(err.details && { details: err.details }) });
};

module.exports = { notFound, errorHandler };
