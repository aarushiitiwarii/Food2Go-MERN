import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { photoSrc } from "../api";

export default function DonationConfirmation() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.ngo || !state?.donation) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-center text-gray-700">
        <p className="text-lg">No donation data found.</p>
        <button
          onClick={() => navigate("/donor-dashboard")}
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { ngo, donation } = state;
  const address = [donation.building, donation.street, donation.city, donation.state].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center py-12 px-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold text-green-700 mb-4">
          🎉 Thank you for your generosity!
        </h1>
        <p className="text-gray-600 mb-6">
          Your donation has been sent to <span className="font-semibold">{ngo.name}</span>. They will
          contact you to arrange pickup. You can track its status under "My Donations".
        </p>

        {donation.photoUrl && (
          <img src={photoSrc(donation.photoUrl)} alt={donation.foodName} className="w-full h-48 object-cover rounded-xl mb-4" />
        )}

        <div className="border-t border-gray-200 pt-4 text-left">
          <h2 className="text-lg font-semibold text-green-700 mb-2">NGO Details</h2>
          <p><strong>Name:</strong> {ngo.name}</p>
          <p><strong>Location:</strong> {ngo.city}</p>
          <p><strong>Contact:</strong> {ngo.contact || "Not provided"}</p>
        </div>

        <div className="border-t border-gray-200 mt-4 pt-4 text-left">
          <h2 className="text-lg font-semibold text-green-700 mb-2">Donation Details</h2>
          <p><strong>Food:</strong> {donation.foodName}</p>
          <p><strong>Quantity:</strong> {donation.quantity}</p>
          <p><strong>Pickup Address:</strong> {address}</p>
          <p><strong>Status:</strong> {donation.status}</p>
        </div>

        <button
          onClick={() => navigate("/donor-dashboard")}
          className="mt-6 bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
