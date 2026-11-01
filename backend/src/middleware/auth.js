const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// Verifies "Authorization: Bearer <token>" and attaches the user to req.user
const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new ApiError(401, "Not logged in");

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }

  const user = await User.findById(payload.id).populate("ngo");
  if (!user) throw new ApiError(401, "User no longer exists");

  req.user = user;
  next();
});

// Role-based access: requireRole("ngo"), requireRole("donor"), ...
const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Only ${roles.join(" / ")} accounts can do this`));
    }
    next();
  };

module.exports = { protect, requireRole };
