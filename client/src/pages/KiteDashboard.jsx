// src/components/KiteDashboard.jsx
import { useEffect, useState } from "react";
import { api } from "../api";

export default function KiteDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/zerodha/profile");
      if (res.data.success) {
        setProfile(res.data.profile);
      } else {
        setError(res.data.error || "Failed to fetch profile");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      if (err.response?.status === 503) {
        setError(
          "⚠️ KiteConnect service is currently unavailable. Try again later."
        );
      } else if (err.response?.status === 401) {
        setError("⚠️ Unauthorized. Please login again.");
      } else {
        setError("⚠️ Failed to fetch profile. Check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handlePlaceOrder = async (orderParams) => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/zerodha/order", orderParams);
      if (res.data.success) {
        alert("✅ Order placed successfully!");
      } else {
        setError(res.data.error || "Failed to place order");
      }
    } catch (err) {
      console.error("Place order failed:", err);
      if (err.response?.status === 503) {
        setError("⚠️ KiteConnect service is unavailable. Try again later.");
      } else {
        setError("⚠️ Failed to place order. Check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Kite Dashboard</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {profile && (
        <div style={{ marginBottom: 20 }}>
          <p>
            <strong>User:</strong> {profile.name}
          </p>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          <p>
            <strong>Broker ID:</strong> {profile.user_id}
          </p>
        </div>
      )}

      <button
        onClick={() =>
          handlePlaceOrder({
            exchange: "NSE",
            tradingsymbol: "INFY",
            transaction_type: "BUY",
            quantity: 1,
            order_type: "MARKET",
            product: "MIS",
          })
        }
        disabled={loading}
        style={{
          background: "#2563eb",
          color: "white",
          padding: "10px 20px",
          borderRadius: 6,
          border: 0,
          cursor: "pointer",
        }}
      >
        Place Test Order
      </button>
    </div>
  );
}
