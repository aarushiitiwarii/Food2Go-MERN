const FoodRequest = require("../models/FoodRequest");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/food-requests  (NGO)
exports.createRequest = asyncHandler(async (req, res) => {
  const { foodNeeded, quantity, location, notes } = req.body;

  const request = await FoodRequest.create({
    ngo: req.user.ngo._id,
    ngoName: req.user.ngo.name,
    createdBy: req.user._id,
    foodNeeded,
    quantity,
    location,
    notes,
  });

  res.status(201).json(request);
});

// GET /api/food-requests  (any logged-in user; NGOs only see their own)
exports.listRequests = asyncHandler(async (req, res) => {
  const filter = req.user.role === "ngo" ? { ngo: req.user.ngo._id } : {};
  const requests = await FoodRequest.find(filter).sort({ createdAt: -1 });
  res.json(requests);
});
