const Ngo = require("../models/Ngo");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/ngos?search=pune
exports.listNgos = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) {
    const re = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: re }, { city: re }];
  }
  const ngos = await Ngo.find(filter).sort({ name: 1 });
  res.json(ngos);
});
