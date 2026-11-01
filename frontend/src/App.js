import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginDonor from "./pages/LoginDonor";
import SignupDonor from "./pages/SignupDonor";
import LoginBeneficiary from "./pages/LoginBeneficiary";
import SignupBeneficiary from "./pages/SignupBeneficiary";
import DonorDashboard from "./pages/DonorDashboard";
import BeneficiaryDashboard from "./pages/BeneficiaryDashboard";
import DonationConfirmation from "./pages/DonationConfirmation";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* Donor Routes */}
        <Route path="/login-donor" element={<LoginDonor />} />
        <Route path="/signup-donor" element={<SignupDonor />} />
        <Route
          path="/donor-dashboard"
          element={
            <ProtectedRoute role="donor">
              <DonorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donation-confirmation"
          element={
            <ProtectedRoute role="donor">
              <DonationConfirmation />
            </ProtectedRoute>
          }
        />

        {/* Beneficiary (NGO) Routes */}
        <Route path="/login-beneficiary" element={<LoginBeneficiary />} />
        <Route path="/signup-beneficiary" element={<SignupBeneficiary />} />
        <Route
          path="/beneficiary-dashboard"
          element={
            <ProtectedRoute role="ngo">
              <BeneficiaryDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
