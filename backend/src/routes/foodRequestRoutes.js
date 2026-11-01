const router = require("express").Router();
const { body, param } = require("express-validator");
const validate = require("../middleware/validate");
const { protect, requireRole } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const requests = require("../controllers/foodRequestController");

router.use(protect);

router.post(
  "/",
  requireRole("ngo"),
  [
    body("foodNeeded").trim().notEmpty().withMessage("Tell donors what food you need"),
    body("quantityNeeded").isInt({ min: 1 }).withMessage("Quantity needed must be a whole number of at least 1").toInt(),
    body("unit").optional({ values: "falsy" }).trim().isLength({ max: 30 }),
    body("location").trim().notEmpty().withMessage("Location is required"),
  ],
  validate,
  requests.createRequest
);

router.get("/", requests.listRequests);

// Donor fulfils all or part of a request; creates a donation linked to it
router.post(
  "/:id/donations",
  requireRole("donor"),
  upload.single("photo"),
  [
    param("id").isMongoId().withMessage("Invalid request id"),
    body("amount").isInt({ min: 1 }).withMessage("Enter how many you can give (at least 1)").toInt(),
    body("building").trim().notEmpty().withMessage("Building is required"),
    body("street").trim().notEmpty().withMessage("Street is required"),
    body("city").trim().notEmpty().withMessage("City is required"),
    body("mapLink").optional({ values: "falsy" }).isURL().withMessage("Map link must be a valid URL"),
  ],
  validate,
  requests.fulfilRequest
);

module.exports = router;
