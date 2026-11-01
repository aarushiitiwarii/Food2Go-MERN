const Donation = require("../models/Donation");
const { ALLOWED_TRANSITIONS } = require("../models/Donation");
const Ngo = require("../models/Ngo");
const FoodRequest = require("../models/FoodRequest");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/donations  (donor, multipart/form-data with optional "photo")
exports.createDonation = asyncHandler(async (req, res) => {
  const ngo = await Ngo.findById(req.body.ngoId);
  if (!ngo) throw new ApiError(400, "Selected NGO does not exist");

  const { foodName, quantity, building, street, city, state, mapLink } = req.body;

  const donation = await Donation.create({
    donor: req.user._id,
    donorName: req.user.name,
    ngo: ngo._id,
    ngoName: ngo.name,
    foodName,
    quantity,
    building,
    street,
    city,
    state,
    mapLink,
    photoUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
  });

  console.log(`[donation] ${req.user.email} donated "${foodName}" to ${ngo.name}`);
  res.status(201).json(donation);
});

// GET /api/donations?status=Available
// Donors see their own donations; NGO users see donations made to their NGO
exports.listDonations = asyncHandler(async (req, res) => {
  const filter = req.user.role === "ngo" ? { ngo: req.user.ngo._id } : { donor: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const donations = await Donation.find(filter)
    .populate("foodRequest", "foodNeeded quantityNeeded quantityReceived unit status")
    .sort({ createdAt: -1 });
  res.json(donations);
});

// PATCH /api/donations/:id/status  (NGO that the donation belongs to)
exports.updateStatus = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation) throw new ApiError(404, "Donation not found");

  if (!donation.ngo.equals(req.user.ngo._id)) {
    throw new ApiError(403, "This donation was made to a different NGO");
  }

  const next = req.body.status;
  if (!ALLOWED_TRANSITIONS[donation.status].includes(next)) {
    throw new ApiError(400, `Cannot change status from ${donation.status} to ${next}`);
  }

  // For request donations, the NGO confirms how much actually arrived (defaults to the pledged amount)
  if (next === "Completed" && donation.foodRequest) {
    const received = req.body.receivedAmount ?? donation.pledgedAmount;
    if (received > donation.pledgedAmount) {
      throw new ApiError(400, `Received amount cannot be more than the ${donation.pledgedAmount} pledged`);
    }
    donation.receivedAmount = received;

    const request = await FoodRequest.findById(donation.foodRequest);
    request.quantityReceived = Math.min(request.quantityNeeded, request.quantityReceived + received);
    await request.save(); // pre-save hook updates Open / Partially Fulfilled / Fulfilled
  }

  donation.status = next;
  await donation.save();
  await donation.populate("foodRequest", "foodNeeded quantityNeeded quantityReceived unit status");
  res.json(donation);
});
