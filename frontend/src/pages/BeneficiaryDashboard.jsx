// src/pages/BeneficiaryDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Utensils,
  Package,
  PlusCircle,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiFetch, clearSession, getUser, photoSrc } from "../api";
import RequestProgress, { REQUEST_STATUS_STYLES } from "../components/RequestProgress";

const EMPTY_REQUEST = { foodNeeded: "", quantityNeeded: "", unit: "", location: "", notes: "" };

/**
 * BeneficiaryDashboard (NGO users)
 *
 * - "Your Donations" with 3 subtabs: Available / Pending / Completed
 * - The backend only returns donations made to the logged-in user's NGO
 * - Accept / Mark as Done / Cancel are saved to the database via PATCH /donations/:id/status
 * - "Food Request" form posts to /food-requests so donors can see it
 */

export default function BeneficiaryDashboard() {
  const user = getUser();
  const ngoName = user?.ngo?.name || "";
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState("donations"); // donations | request
  const [donations, setDonations] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [donationsSubtab, setDonationsSubtab] = useState("available"); // available | pending | completed
  const [error, setError] = useState("");

  const [reqForm, setReqForm] = useState(EMPTY_REQUEST);

  const [loading, setLoading] = useState(true);

  const loadRequests = () => apiFetch("/food-requests").then(setMyRequests).catch(() => {});

  useEffect(() => {
    apiFetch("/donations")
      .then(setDonations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    loadRequests();
  }, []);

  const available = donations.filter((d) => d.status === "Available");
  const pending = donations.filter((d) => d.status === "Pending");
  const completed = donations.filter((d) => d.status === "Completed");

  // Saves the new status, then swaps the updated donation into the list
  // receivedAmount is only sent when completing a donation made for a food request
  const changeStatus = async (donationId, status, nextTab, receivedAmount) => {
    try {
      const updated = await apiFetch(`/donations/${donationId}/status`, {
        method: "PATCH",
        body: receivedAmount != null ? { status, receivedAmount } : { status },
      });
      setDonations((prev) => prev.map((d) => (d._id === donationId ? updated : d)));
      setDonationsSubtab(nextTab);
      if (updated.foodRequest) loadRequests(); // request progress changed
      toast.success(
        receivedAmount != null
          ? `Received ${receivedAmount} ${updated.foodRequest.unit} - request updated`
          : `Donation marked as ${status}`
      );
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReqChange = (e) =>
    setReqForm({ ...reqForm, [e.target.name]: e.target.value });

  const handleReqSubmit = async (e) => {
    e.preventDefault();
    try {
      const created = await apiFetch("/food-requests", { method: "POST", body: reqForm });
      setMyRequests((prev) => [created, ...prev]);
      setReqForm(EMPTY_REQUEST);
      toast.success("✅ Food request submitted! Donors can now see it.");
    } catch (err) {
      toast.error(`⚠️ ${err.message}`);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const renderList = (list, emptyText, cardProps) =>
    list.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((d) => (
          <DonationCard key={d._id} donation={d} {...cardProps(d)} />
        ))}
      </div>
    ) : (
      <p className="text-gray-500">{emptyText}</p>
    );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ToastContainer position="top-center" autoClose={2500} />
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-green-700 text-white transition-all ${
          sidebarOpen ? "w-64" : "w-16"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-green-600">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-white/10 p-2">
              <Utensils className="text-white" />
            </div>
            {sidebarOpen && <h2 className="text-lg font-bold">Food2Go</h2>}
          </div>
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="p-2 rounded-md hover:bg-white/10"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X /> : <Menu />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-6">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveMainTab("donations")}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/10 transition ${
                  activeMainTab === "donations" ? "bg-white/10" : ""
                }`}
              >
                <FaIconWrapper>
                  <PlusCircle />
                </FaIconWrapper>
                {sidebarOpen && <span>Your Donations</span>}
              </button>
            </li>

            <li>
              <button
                onClick={() => setActiveMainTab("request")}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/10 transition ${
                  activeMainTab === "request" ? "bg-white/10" : ""
                }`}
              >
                <FaIconWrapper>
                  <Package />
                </FaIconWrapper>
                {sidebarOpen && <span>Your Requests</span>}
              </button>
            </li>
          </ul>
        </nav>

        <div className="px-4 py-4 border-t border-green-600">
          <div className="text-sm text-green-200 mb-2">
            {sidebarOpen ? `Logged in as ${user?.name || ""}` : null}
          </div>
          <div className="text-white font-semibold">
            {sidebarOpen ? ngoName : <MapPin />}
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex items-center gap-2 text-sm text-green-100 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-green-700">Beneficiary Dashboard</h1>
          <div className="text-sm text-gray-600">
            NGO: <span className="font-semibold">{ngoName || "—"}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left / center */}
          <section className="lg:col-span-2">
            {activeMainTab === "donations" ? (
              <div className="bg-white rounded-2xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Your Donations</h2>

                  <div className="flex items-center gap-2">
                    <SubtabButton active={donationsSubtab === "available"} activeClass="bg-green-600 text-white" onClick={() => setDonationsSubtab("available")}>
                      Available ({available.length})
                    </SubtabButton>
                    <SubtabButton active={donationsSubtab === "pending"} activeClass="bg-yellow-500 text-white" onClick={() => setDonationsSubtab("pending")}>
                      Pending ({pending.length})
                    </SubtabButton>
                    <SubtabButton active={donationsSubtab === "completed"} activeClass="bg-green-100 text-green-800" onClick={() => setDonationsSubtab("completed")}>
                      Completed ({completed.length})
                    </SubtabButton>
                  </div>
                </div>

                <div className="mt-4">
                  {loading ? (
                    <p className="text-gray-500">Loading donations...</p>
                  ) : error ? (
                    <p className="text-red-600">{error}</p>
                  ) : donationsSubtab === "available" ? (
                    renderList(available, "No available donations.", (d) => ({
                      onPrimary: () => changeStatus(d._id, "Pending", "pending"),
                      primaryLabel: "Accept Donation",
                    }))
                  ) : donationsSubtab === "pending" ? (
                    renderList(pending, "No pending donations.", (d) => ({
                      onPrimary: (received) => changeStatus(d._id, "Completed", "completed", received),
                      primaryLabel: d.foodRequest ? "Mark as Received" : "Mark as Done",
                      onSecondary: () => changeStatus(d._id, "Available", "available"),
                      secondaryLabel: "Cancel",
                    }))
                  ) : (
                    renderList(completed, "No completed donations yet.", () => ({ completed: true }))
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Food Requests</h2>
                {myRequests.length > 0 ? (
                  <div className="space-y-4">
                    {myRequests.map((r) => {
                      const contributions = donations.filter((d) => d.foodRequest?._id === r._id);
                      return (
                        <div key={r._id} className="border rounded-xl p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                {r.foodNeeded} · {r.quantityNeeded} {r.unit}
                              </h3>
                              <p className="text-sm text-gray-600">{r.location}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${REQUEST_STATUS_STYLES[r.status]}`}>
                              {r.status}
                            </span>
                          </div>
                          {r.notes && <p className="text-sm text-gray-500 italic mt-1">"{r.notes}"</p>}

                          <div className="mt-3">
                            <RequestProgress request={r} />
                          </div>

                          <div className="mt-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                              Contributions ({contributions.length})
                            </p>
                            {contributions.length > 0 ? (
                              <ul className="divide-y text-sm">
                                {contributions.map((d) => (
                                  <li key={d._id} className="flex items-center justify-between py-1.5">
                                    <span className="text-gray-700">{d.donorName}</span>
                                    <span className="text-gray-600">
                                      {d.status === "Completed"
                                        ? `${d.receivedAmount} of ${d.pledgedAmount} ${r.unit} received`
                                        : `${d.pledgedAmount} ${r.unit} pledged · ${d.status}`}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-400">No donors yet.</p>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Posted {new Date(r.createdAt).toLocaleString()}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">You haven't posted any requests yet.</p>
                )}
              </div>
            )}
          </section>

          {/* Right: Request form */}
          <aside>
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <PlusCircle className="text-green-600" />
                <h3 className="text-lg font-semibold">Food Request</h3>
              </div>

              <form onSubmit={handleReqSubmit} className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">What do you need?</label>
                  <input
                    name="foodNeeded"
                    value={reqForm.foodNeeded}
                    onChange={handleReqChange}
                    placeholder="e.g., Lunch boxes, Rice"
                    className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-300"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label className="text-sm font-medium text-gray-700">Quantity</label>
                    <input
                      name="quantityNeeded"
                      type="number"
                      min={1}
                      value={reqForm.quantityNeeded}
                      onChange={handleReqChange}
                      placeholder="e.g., 50"
                      className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-300"
                      required
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="text-sm font-medium text-gray-700">Unit</label>
                    <input
                      name="unit"
                      value={reqForm.unit}
                      onChange={handleReqChange}
                      placeholder="boxes, kg..."
                      className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <input
                    name="location"
                    value={reqForm.location}
                    onChange={handleReqChange}
                    placeholder="Area / locality"
                    className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-300"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
                  <textarea
                    name="notes"
                    value={reqForm.notes}
                    onChange={handleReqChange}
                    rows={3}
                    placeholder="Any special instructions..."
                    className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-300"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Submit Request
                </button>
              </form>
            </div>

            <div className="mt-4 bg-white rounded-2xl shadow p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Quick info</h4>
              <p className="text-xs text-gray-500">
                Requests you submit are visible to all donors in their "Food Requests" tab.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

/* ---------- Helper components ---------- */

function FaIconWrapper({ children }) {
  return <div className="w-6 h-6 text-white/90">{children}</div>;
}

function SubtabButton({ active, activeClass, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm ${active ? activeClass : "bg-gray-100 text-gray-700"}`}
    >
      {children}
    </button>
  );
}

function DonationCard({ donation, onPrimary, primaryLabel, onSecondary, secondaryLabel, completed }) {
  const pickup = [donation.building, donation.street, donation.city].filter(Boolean).join(", ");
  const request = donation.foodRequest;
  // For request donations the NGO confirms how much actually arrived before completing
  const needsReceivedAmount = request && donation.status === "Pending";
  const [confirming, setConfirming] = useState(false);
  const [received, setReceived] = useState(String(donation.pledgedAmount || ""));

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {donation.photoUrl && (
        <img src={photoSrc(donation.photoUrl)} alt={donation.foodName} className="w-full h-36 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{donation.foodName}</h3>
            <p className="text-sm text-gray-500">{donation.donorName}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">{new Date(donation.createdAt).toLocaleString()}</span>
            <div className="mt-2">
              <span className={`px-2 py-1 text-xs rounded-full ${donation.status === "Pending" ? "bg-yellow-100 text-yellow-800" : donation.status === "Completed" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                {donation.status}
              </span>
            </div>
          </div>
        </div>

        {request && (
          <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700">
            For your request: {request.foodNeeded} ({request.quantityNeeded} {request.unit})
          </span>
        )}

        <div className="mt-3 text-sm text-gray-600">
          <p><strong>Quantity:</strong> {donation.quantity}</p>
          {completed && donation.receivedAmount != null && (
            <p className="text-green-700"><strong>Received:</strong> {donation.receivedAmount} {request?.unit}</p>
          )}
          <p className="mt-1"><strong>Pickup:</strong> {pickup || "Not specified"}</p>
          {donation.mapLink && (
            <a href={donation.mapLink} target="_blank" rel="noreferrer" className="text-blue-500 underline">
              View on map
            </a>
          )}
        </div>

        {confirming && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How many {request.unit} did you receive?
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={donation.pledgedAmount}
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                className="w-24 border rounded-lg p-1.5"
              />
              <span className="text-xs text-gray-500">of {donation.pledgedAmount} pledged</span>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => onPrimary(Number(received))}
                disabled={!(Number(received) >= 1 && Number(received) <= donation.pledgedAmount)}
                className="flex-1 text-sm bg-green-600 text-white py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 text-sm border border-gray-200 py-1.5 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </div>
        )}

        <div className={`mt-4 flex items-center gap-3 ${confirming ? "hidden" : ""}`}>
          {!completed && onPrimary && (
            <button
              onClick={() => (needsReceivedAmount ? setConfirming(true) : onPrimary())}
              className={`flex-1 text-sm font-medium py-2 rounded-lg ${donation.status === "Available" ? "bg-green-600 text-white hover:bg-green-700" : "bg-yellow-500 text-white"}`}
            >
              {primaryLabel}
            </button>
          )}

          {onSecondary && (
            <button
              onClick={onSecondary}
              className="flex-1 text-sm border border-gray-200 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {secondaryLabel}
            </button>
          )}

          {completed && (
            <div className="flex-1 text-sm text-center text-green-700 font-medium">Completed ✓</div>
          )}
        </div>
      </div>
    </div>
  );
}
