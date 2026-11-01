const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

// Runs after express-validator rules; responds 400 with the list of field errors
module.exports = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
  next(new ApiError(400, details[0].message, details));
};
