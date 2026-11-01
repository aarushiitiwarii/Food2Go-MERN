const Donation = require("../models/Donation");

// Donations that are promised for a request but not yet confirmed as received
const OPEN_STATUSES = ["Available", "Pending"];

// Returns { [requestId]: totalOpenPledged } for the given request ids
async function openPledgesByRequest(requestIds) {
  const rows = await Donation.aggregate([
    { $match: { foodRequest: { $in: requestIds }, status: { $in: OPEN_STATUSES } } },
    { $group: { _id: "$foodRequest", total: { $sum: "$pledgedAmount" } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id.toString(), r.total]));
}

// Adds quantityPledged / quantityRemaining to each request for the API response
async function withProgress(requests) {
  const pledges = await openPledgesByRequest(requests.map((r) => r._id));
  return requests.map((r) => {
    const quantityPledged = pledges[r._id.toString()] || 0;
    const quantityRemaining = Math.max(0, r.quantityNeeded - r.quantityReceived - quantityPledged);
    return { ...r.toObject(), quantityPledged, quantityRemaining };
  });
}

module.exports = { openPledgesByRequest, withProgress };
