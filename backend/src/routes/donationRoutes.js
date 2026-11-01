const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middleware/validate");
const { protect, requireRole } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { STATUSES } = require("../models/Donation");
const donations = require("../controllers/donationController");

router.use(protect);

router.post(
  "/",
  requireRole("donor"),
  upload.single("photo"), // must run before validation so req.body is parsed from multipart
  [
    body("ngoId").isMongoId().withMessage("Select an NGO"),
    body("foodName").trim().notEmpty().withMessage("Food name is required"),
    body("quantity").trim().notEmpty().withMessage("Quantity is required"),
    body("building").trim().notEmpty().withMessage("Building is required"),
    body("street").trim().notEmpty().withMessage("Street is required"),
    body("city").trim().notEmpty().withMessage("City is required"),
    body("mapLink").optional({ values: "falsy" }).isURL().withMessage("Map link must be a valid URL"),
  ],
  validate,
  donations.createDonation
);

router.get("/", [query("status").optional().isIn(STATUSES)], validate, donations.listDonations);

router.patch(
  "/:id/status",
  requireRole("ngo"),
  [
    param("id").isMongoId().withMessage("Invalid donation id"),
    body("status").isIn(STATUSES).withMessage(`Status must be one of ${STATUSES.join(", ")}`),
  ],
  validate,
  donations.updateStatus
);

module.exports = router;
