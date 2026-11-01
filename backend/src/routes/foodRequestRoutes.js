const router = require("express").Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { protect, requireRole } = require("../middleware/auth");
const requests = require("../controllers/foodRequestController");

router.use(protect);

router.post(
  "/",
  requireRole("ngo"),
  [
    body("foodNeeded").trim().notEmpty().withMessage("Tell donors what food you need"),
    body("location").trim().notEmpty().withMessage("Location is required"),
  ],
  validate,
  requests.createRequest
);

router.get("/", requests.listRequests);

module.exports = router;
