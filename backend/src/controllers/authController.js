const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Ngo = require("../models/Ngo");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { jwtSecret, jwtExpiresIn } = require("../config/env");

const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });

// POST /api/auth/signup
exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password, role, ngoId } = req.body;

  if (await User.exists({ email: email.toLowerCase() })) {
    throw new ApiError(409, "An account with this email already exists");
  }

  let ngo;
  if (role === "ngo") {
    ngo = await Ngo.findById(ngoId);
    if (!ngo) throw new ApiError(400, "Please select a valid NGO");
  }

  const user = await User.create({ name, email, password, role, ngo: ngo?._id });
  if (ngo) user.ngo = ngo;

  res.status(201).json({ token: signToken(user), user });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password").populate("ngo");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Incorrect email or password");
  }
  // The donor and NGO login pages are separate, so make sure the account matches the page
  if (role && user.role !== role) {
    throw new ApiError(403, `This account is registered as ${user.role === "ngo" ? "an NGO" : "a donor"}`);
  }

  res.json({ token: signToken(user), user });
});

// GET /api/auth/me
exports.me = (req, res) => res.json({ user: req.user });
