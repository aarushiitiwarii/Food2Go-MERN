const mongoose = require("mongoose");

const foodRequestSchema = new mongoose.Schema(
  {
    ngo: { type: mongoose.Schema.Types.ObjectId, ref: "Ngo", required: true },
    ngoName: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    foodNeeded: { type: String, required: true, trim: true },
    quantity: { type: String, trim: true },
    location: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FoodRequest", foodRequestSchema);
