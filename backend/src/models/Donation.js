const mongoose = require("mongoose");

const STATUSES = ["Available", "Pending", "Completed"];

// Allowed status changes an NGO can make on a donation
const ALLOWED_TRANSITIONS = {
  Available: ["Pending"], // NGO accepts the donation
  Pending: ["Completed", "Available"], // picked up, or acceptance cancelled
  Completed: [],
};

const donationSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    donorName: { type: String, required: true },
    ngo: { type: mongoose.Schema.Types.ObjectId, ref: "Ngo", required: true },
    ngoName: { type: String, required: true },
    foodName: { type: String, required: true, trim: true },
    quantity: { type: String, required: true, trim: true },
    building: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    mapLink: { type: String, trim: true },
    photoUrl: { type: String },
    status: { type: String, enum: STATUSES, default: "Available" },
    // Set when the donation fulfils (part of) an NGO's food request
    foodRequest: { type: mongoose.Schema.Types.ObjectId, ref: "FoodRequest" },
    pledgedAmount: { type: Number, min: 1 },
    receivedAmount: { type: Number, min: 0 },
  },
  { timestamps: true }
);

donationSchema.index({ ngo: 1, status: 1 });
donationSchema.index({ donor: 1 });
donationSchema.index({ foodRequest: 1, status: 1 });

module.exports = mongoose.model("Donation", donationSchema);
module.exports.STATUSES = STATUSES;
module.exports.ALLOWED_TRANSITIONS = ALLOWED_TRANSITIONS;
