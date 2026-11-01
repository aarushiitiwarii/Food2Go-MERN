import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiFetch, clearSession, getUser, photoSrc } from "../api";

const EMPTY_DONATION = {
  foodName: "",
  quantity: "",
  building: "",
  street: "",
  city: "",
  state: "",
  mapLink: "",
};

const STATUS_STYLES = {
  Available: "bg-gray-100 text-gray-700",
  Pending: "bg-yellow-100 text-yellow-800",
  Completed: "bg-green-100 text-green-800",
};

export default function DonorDashboard() {
  const user = getUser();
  const navigate = useNavigate();

  const [ngos, setNgos] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedNgo, setSelectedNgo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [donationData, setDonationData] = useState(EMPTY_DONATION);
  const [photo, setPhoto] = useState(null);

  const [activeTab, setActiveTab] = useState("donate"); // donate | mine | requests
  const [myDonations, setMyDonations] = useState([]);
  const [foodRequests, setFoodRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch NGOs
  useEffect(() => {
    apiFetch("/ngos")
      .then(setNgos)
      .catch(() => toast.error("Error fetching NGO list"))
      .finally(() => setLoading(false));
  }, []);

  // Fetch this donor's donations
  const loadMyDonations = () =>
    apiFetch("/donations")
      .then(setMyDonations)
      .catch(() => toast.error("Error fetching your donations"));

  useEffect(() => {
    loadMyDonations();
  }, []);

  // Fetch Food Requests (newest first from the API)
  useEffect(() => {
    apiFetch("/food-requests")
      .then((data) => {
        setFoodRequests(data);
        // badge shows requests posted since the donor last opened the tab
        const lastSeen = localStorage.getItem("food2go_requests_seen");
        setUnseenCount(lastSeen ? data.filter((r) => r.createdAt > lastSeen).length : data.length);
      })
      .catch(() => toast.error("Error fetching food requests"))
      .finally(() => setLoadingRequests(false));
  }, []);

  const handleDonateClick = (ngo) => {
    setSelectedNgo(ngo);
    setDonationData(EMPTY_DONATION);
    setPhoto(null);
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    setDonationData({ ...donationData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // multipart form so the optional food photo can be uploaded with the donation
    const form = new FormData();
    form.append("ngoId", selectedNgo._id);
    Object.entries(donationData).forEach(([key, value]) => form.append(key, value));
    if (photo) form.append("photo", photo);

    try {
      const donation = await apiFetch("/donations", { method: "POST", body: form });
      toast.success("✅ Donation submitted successfully!");
      loadMyDonations();
      setTimeout(() => {
        setIsModalOpen(false);
        navigate("/donation-confirmation", { state: { ngo: selectedNgo, donation } });
      }, 1200);
    } catch (err) {
      toast.error(`❌ ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const filteredNgos = search.trim()
    ? ngos.filter(
        (ngo) =>
          ngo.name.toLowerCase().includes(search.toLowerCase()) ||
          (ngo.city || "").toLowerCase().includes(search.toLowerCase())
      )
    : ngos;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "requests") {
      setUnseenCount(0);
      localStorage.setItem("food2go_requests_seen", new Date().toISOString());
    }
  };

  const tabClass = (tab) =>
    `px-4 py-2 rounded-full relative ${activeTab === tab ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"}`;

  const inputClass = "w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-400";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 py-10 px-6">
      <ToastContainer position="top-center" autoClose={2500} />

      <div className="max-w-6xl mx-auto flex items-center justify-between mb-6">
        <p className="text-gray-600">
          Hi, <span className="font-semibold">{user?.name}</span>
        </p>
        <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-red-500">
          Logout
        </button>
      </div>

      <h1 className="text-3xl font-bold text-center text-green-700 mb-8">
        🍱 Donate Food
      </h1>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-6">
        <button className={tabClass("donate")} onClick={() => handleTabChange("donate")}>
          Donate
        </button>
        <button className={tabClass("mine")} onClick={() => handleTabChange("mine")}>
          My Donations
        </button>
        <button className={tabClass("requests")} onClick={() => handleTabChange("requests")}>
          Food Requests
          {unseenCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {unseenCount}
            </span>
          )}
        </button>
      </div>

      {/* Donate Tab: NGO list */}
      {activeTab === "donate" && (
        <>
          <div className="flex justify-center mb-6">
            <input
              type="text"
              placeholder="Search NGO by name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {loading ? (
            <p className="text-center text-gray-500">Loading NGOs...</p>
          ) : filteredNgos.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {filteredNgos.map((ngo) => (
                <div
                  key={ngo._id}
                  className="bg-white shadow-lg rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl transition"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-green-700 mb-2">
                      {ngo.name}
                    </h2>
                    <p className="text-gray-600 mb-1">
                      📍 <strong>Location:</strong> {ngo.city || "Unknown"}
                    </p>
                    <p className="text-gray-600 mb-1">
                      ☎️ <strong>Contact:</strong> {ngo.contact || "Not available"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDonateClick(ngo)}
                    className="mt-4 bg-green-600 text-white py-2 rounded-full hover:bg-green-700 transition"
                  >
                    Donate
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 mt-10">No NGOs found.</p>
          )}
        </>
      )}

      {/* My Donations Tab */}
      {activeTab === "mine" && (
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {myDonations.length > 0 ? (
            myDonations.map((d) => (
              <div key={d._id} className="bg-white shadow rounded-xl border overflow-hidden">
                {d.photoUrl && (
                  <img src={photoSrc(d.photoUrl)} alt={d.foodName} className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-green-700">{d.foodName}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${STATUS_STYLES[d.status]}`}>{d.status}</span>
                  </div>
                  <p className="text-gray-600 mt-1"><strong>To:</strong> {d.ngoName}</p>
                  <p className="text-gray-600 mt-1"><strong>Quantity:</strong> {d.quantity}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(d.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-full">You haven't donated yet.</p>
          )}
        </div>
      )}

      {/* Food Requests Tab */}
      {activeTab === "requests" && (
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {loadingRequests ? (
            <p className="text-center text-gray-500">Loading food requests...</p>
          ) : foodRequests.length > 0 ? (
            foodRequests.map((req) => (
              <div
                key={req._id}
                className="bg-white shadow rounded-xl p-4 border flex flex-col justify-between"
              >
                <h3 className="text-lg font-semibold text-green-700">
                  {req.foodNeeded}
                </h3>
                <p className="text-gray-600 mt-1">
                  <strong>Quantity:</strong> {req.quantity || "—"}
                </p>
                <p className="text-gray-600 mt-1">
                  <strong>Location:</strong> {req.location}
                </p>
                <p className="text-gray-600 mt-1">
                  <strong>NGO:</strong> {req.ngoName}
                </p>
                {req.notes && (
                  <p className="text-gray-500 mt-2 italic">"{req.notes}"</p>
                )}
                <p className="text-xs text-gray-400 mt-2">{new Date(req.createdAt).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-full">No food requests at the moment.</p>
          )}
        </div>
      )}

      {/* Donation Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-lg"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-green-700 mb-4 text-center">
              🥗 Donate to {selectedNgo?.name}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" name="foodName" placeholder="Food Name" value={donationData.foodName} onChange={handleChange} required className={inputClass} />
              <input type="text" name="quantity" placeholder="Quantity (e.g., 5 plates, 2kg)" value={donationData.quantity} onChange={handleChange} required className={inputClass} />
              <input type="text" name="building" placeholder="Building / Apartment Name" value={donationData.building} onChange={handleChange} required className={inputClass} />
              <input type="text" name="street" placeholder="Street / Locality" value={donationData.street} onChange={handleChange} required className={inputClass} />
              <input type="text" name="city" placeholder="City" value={donationData.city} onChange={handleChange} required className={inputClass} />
              <input type="text" name="state" placeholder="State" value={donationData.state} onChange={handleChange} className={inputClass} />
              <input type="url" name="mapLink" placeholder="Google Maps Link (optional)" value={donationData.mapLink} onChange={handleChange} className={inputClass} />

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Food photo (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files[0] || null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-green-50 file:text-green-700"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-full hover:bg-green-700 transition ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "Submitting..." : "Confirm Donation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
