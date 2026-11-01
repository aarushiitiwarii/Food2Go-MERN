const FoodRequest = require("../models/FoodRequest");
const Donation = require("../models/Donation");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { withProgress, openPledgesByRequest } = require("../services/requestProgress");

// POST /api/food-requests  (NGO)
exports.createRequest = asyncHandler(async (req, res) => {
  const { foodNeeded, quantityNeeded, unit, location, notes } = req.body;

  const request = await FoodRequest.create({
    ngo: req.user.ngo._id,
    ngoName: req.user.ngo.name,
    createdBy: req.user._id,
    foodNeeded,
    quantityNeeded,
    unit,
    location,
    notes,
  });

  const [withNumbers] = await withProgress([request]);
  res.status(201).json(withNumbers);
});

// GET /api/food-requests  (any logged-in user; NGOs only see their own)
exports.listRequests = asyncHandler(async (req, res) => {
  const filter = req.user.role === "ngo" ? { ngo: req.user.ngo._id } : {};
  const requests = await FoodRequest.find(filter).sort({ createdAt: -1 });
  res.json(await withProgress(requests));
});

// POST /api/food-requests/:id/donations  (donor fulfils all or part of a request)
exports.fulfilRequest = asyncHandler(async (req, res) => {
  const request = await FoodRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, "Food request not found");
  if (request.status === "Fulfilled") throw new ApiError(400, "This request is already fulfilled");

  // Amounts promised by other donors (not yet received) count against what is left
  const pledged = (await openPledgesByRequest([request._id]))[request._id.toString()] || 0;
  const remaining = request.quantityNeeded - request.quantityReceived - pledged;
  const amount = Number(req.body.amount);

  if (remaining <= 0) throw new ApiError(400, "Other donors have already pledged the full amount");
  if (amount > remaining) {
    throw new ApiError(400, `Only ${remaining} ${request.unit} still needed`);
  }

  const { building, street, city, state, mapLink } = req.body;
  const donation = await Donation.create({
    donor: req.user._id,
    donorName: req.user.name,
    ngo: request.ngo,
    ngoName: request.ngoName,
    foodName: request.foodNeeded,
    quantity: `${amount} ${request.unit}`,
    building,
    street,
    city,
    state,
    mapLink,
    photoUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
    foodRequest: request._id,
    pledgedAmount: amount,
  });

  console.log(`[pledge] ${req.user.email} pledged ${amount} ${request.unit} for "${request.foodNeeded}" (${request.ngoName})`);
  res.status(201).json(donation);
});
