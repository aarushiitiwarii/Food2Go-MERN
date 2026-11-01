const mongoose = require("mongoose");

const ngoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    city: { type: String, trim: true },
    contact: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ngo", ngoSchema);
