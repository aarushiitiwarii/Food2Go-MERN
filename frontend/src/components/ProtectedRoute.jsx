import React from "react";
import { Navigate } from "react-router-dom";
import { getToken, getUser } from "../api";

// Only renders the page if someone with the right role is logged in
export default function ProtectedRoute({ role, children }) {
  const user = getUser();
  if (!getToken() || !user || user.role !== role) {
    return <Navigate to={role === "ngo" ? "/login-beneficiary" : "/login-donor"} replace />;
  }
  return children;
}
