const router = require("express").Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const auth = require("../controllers/authController");

router.post(
  "/signup",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Enter a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").isIn(["donor", "ngo"]).withMessage("Role must be donor or ngo"),
    body("ngoId").if(body("role").equals("ngo")).isMongoId().withMessage("Please select your NGO"),
  ],
  validate,
  auth.signup
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Enter a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
    body("role").optional().isIn(["donor", "ngo"]),
  ],
  validate,
  auth.login
);

router.get("/me", protect, auth.me);

module.exports = router;
