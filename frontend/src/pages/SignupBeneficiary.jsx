import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, saveSession } from "../api";

const SignUpBeneficiary = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    ngoId: "",
  });
  const [ngoOptions, setNgoOptions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // NGO list now comes from the database instead of being hardcoded
  useEffect(() => {
    apiFetch("/ngos")
      .then(setNgoOptions)
      .catch(() => setError("Could not load NGOs. Is the backend running?"));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const session = await apiFetch("/auth/signup", {
        method: "POST",
        body: { ...formData, role: "ngo" },
      });
      saveSession(session);
      navigate("/beneficiary-dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50 p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-orange-600 mb-6">
          Beneficiary Sign Up
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border rounded-lg p-2"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full border rounded-lg p-2"
          />

          <input
            type="password"
            name="password"
            placeholder="Password (min 6 characters)"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className="w-full border rounded-lg p-2"
          />

          <select
            name="ngoId"
            value={formData.ngoId}
            onChange={handleChange}
            required
            className="w-full border rounded-lg p-2"
          >
            <option value="">Select your NGO</option>
            {ngoOptions.map((ngo) => (
              <option key={ngo._id} value={ngo._id}>
                {ngo.name}
              </option>
            ))}
          </select>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white rounded-lg py-2 hover:bg-orange-600 transition disabled:opacity-50"
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Already done this?{" "}
          <span
            onClick={() => navigate("/login-beneficiary")}
            className="text-orange-600 font-semibold cursor-pointer"
          >
            Log in
          </span>
        </p>
      </div>
    </div>
  );
};

export default SignUpBeneficiary;
