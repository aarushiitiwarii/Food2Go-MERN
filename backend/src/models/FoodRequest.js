const mongoose = require("mongoose");

const REQUEST_STATUSES = ["Open", "Partially Fulfilled", "Fulfilled"];

const foodRequestSchema = new mongoose.Schema(
  {
    ngo: { type: mongoose.Schema.Types.ObjectId, ref: "Ngo", required: true },
    ngoName: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    foodNeeded: { type: String, required: true, trim: true },
    quantityNeeded: { type: Number, required: true, min: 1 },
    unit: { type: String, trim: true, default: "units" },
    // Only goes up when the NGO confirms a donation actually arrived
    quantityReceived: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: REQUEST_STATUSES, default: "Open" },
    location: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// Keep status in sync with how much has been received
foodRequestSchema.pre("save", function syncStatus(next) {
  if (this.quantityReceived >= this.quantityNeeded) this.status = "Fulfilled";
  else if (this.quantityReceived > 0) this.status = "Partially Fulfilled";
  else this.status = "Open";
  next();
});

module.exports = mongoose.model("FoodRequest", foodRequestSchema);
module.exports.REQUEST_STATUSES = REQUEST_STATUSES;
