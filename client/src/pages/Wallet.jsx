// src/components/Wallet.jsx
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { api } from "../api";

export default function Wallet({ userId }) {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // 🔔 Toast Helper
  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  };

  // ❌ Error Handling
  const handleApiError = (err, fallback = "Something went wrong") => {
    console.error(err);
    if (err.response?.status === 503)
      showToast("⚠️ Wallet service temporarily unavailable", "error");
    else if (err.response?.status === 401)
      showToast("⚠️ Unauthorized. Please login again", "error");
    else showToast(err.response?.data?.error || fallback, "error");
  };

  // 💰 Load Wallet
  const loadWallet = async () => {
    try {
      const res = await api.get("/api/wallet/balance", {
        headers: { "Cache-Control": "no-cache" },
        params: { _t: Date.now() },
      });
      if (res.data.success) {
        setBalance(Number(res.data.balance || 0));
        setLedger(res.data.ledger || []);
      } else {
        showToast(res.data.error || "Failed to fetch wallet", "error");
      }
    } catch (err) {
      handleApiError(err, "Failed to load wallet balance");
    }
  };

  // 🪙 Add Funds using Razorpay
  const addFunds = async (e) => {
    e.preventDefault();
    if (loading) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return showToast("Enter valid amount", "error");

    setLoading(true);
    try {
      // 🔑 Fetch Razorpay Public Key
      const { data: keyData } = await api.get("/api/wallet/public-key");

      // 🧾 Create Order
      const { data: orderData } = await api.post("/api/wallet/create-order", {
        amount: amt,
      });

      const options = {
        key: keyData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        order_id: orderData.order.id,
        name: "Trading Wallet",
        description: "Add funds to wallet",
        handler: async (response) => {
          try {
            await api.post("/api/wallet/verify-payment", response);
            showToast(`✅ Added ₹${amt.toLocaleString()}`, "success");
            setAmount("");
            loadWallet();
          } catch (err) {
            handleApiError(err, "Payment verification failed");
          }
        },
        prefill: { name: "User", email: "user@example.com" },
        theme: { color: "#2563eb" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      handleApiError(err, "Failed to start payment process");
    } finally {
      setLoading(false);
    }
  };

  // 💸 Withdraw Funds
  const withdrawFunds = async () => {
    if (loading) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return showToast("Enter valid amount", "error");
    if (amt > balance)
      return showToast("Cannot withdraw more than balance", "error");

    setLoading(true);
    try {
      await axios.post("http://localhost:4000/api/wallet/withdraw", {
        amount: withdrawAmount,
        accountNumber: account,
        ifsc: ifscCode,
      });
    } catch (err) {
      handleApiError(err, "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  // 🧹 Clear Wallet (Admin / Demo)
  const clearWallet = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await api.post("/api/wallet/clear");
      showToast("🧹 Wallet cleared", "success");
      setAmount("");
      loadWallet();
    } catch (err) {
      handleApiError(err, "Failed to clear wallet");
    } finally {
      setLoading(false);
    }
  };

  // 📡 Socket.io Real-time updates
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:4000");
    socket.emit("joinWalletRoom", userId);
    socket.on("wallet:update", ({ balance: newBal, ledgerEntry }) => {
      if (newBal !== undefined) setBalance(newBal);
      if (ledgerEntry) setLedger((prev) => [ledgerEntry, ...prev]);
    });
    return () => socket.disconnect();
  }, [userId]);

  useEffect(() => {
    loadWallet();
  }, []);

  return (
    <div style={container}>
      <div style={card}>
        <h3>💼 Wallet</h3>

        <div style={balanceDisplay}>
          <div style={balanceLabel}>Current Balance</div>
          <div style={balanceAmount}>₹{balance.toFixed(2)}</div>
        </div>

        <form onSubmit={addFunds} style={form}>
          <div style={formGroup}>
            <label>Add / Withdraw Amount (INR)</label>
            <input
              type="number"
              step="1"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              style={input}
              disabled={loading}
            />
          </div>
          <div style={actionsRow}>
            <button type="submit" style={btn} disabled={loading}>
              {loading ? "Processing..." : "Add Funds"}
            </button>
            <button
              type="button"
              onClick={withdrawFunds}
              style={withdrawBtn}
              disabled={loading}
            >
              Withdraw
            </button>
            <button
              type="button"
              onClick={clearWallet}
              style={dangerBtn}
              disabled={loading}
            >
              Clear
            </button>
          </div>
        </form>

        <div style={{ marginTop: 20, overflowX: "auto" }}>
          <h4>Transaction History</h4>
          {ledger.length === 0 ? (
            <p>No transactions yet.</p>
          ) : (
            <table style={table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((tx, idx) => (
                  <tr
                    key={idx}
                    style={{
                      backgroundColor:
                        tx.type === "CREDIT" ? "#dcfce7" : "#fee2e2",
                    }}
                  >
                    <td>
                      {new Date(tx.date || tx.createdAt).toLocaleString()}
                    </td>
                    <td>{tx.type}</td>
                    <td>₹{Number(tx.amount).toFixed(2)}</td>
                    <td>{tx.description || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 20px",
            borderRadius: 8,
            backgroundColor: toast.type === "error" ? "#fee2e2" : "#dcfce7",
            color: toast.type === "error" ? "#b91c1c" : "#166534",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            zIndex: 9999,
            maxWidth: "90%",
            textAlign: "center",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

// --- Styles ---
const container = { padding: 20 };
const card = {
  background: "#fff",
  color: "#0f172a",
  padding: "24px 16px",
  borderRadius: 16,
  maxWidth: 700,
  margin: "0 auto",
  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
};
const balanceDisplay = {
  textAlign: "center",
  marginBottom: 24,
  padding: 20,
  borderRadius: 12,
  border: "1px solid #e2e8f0",
};
const balanceLabel = { color: "#475569", fontSize: 14, marginBottom: 8 };
const balanceAmount = { fontSize: 32, fontWeight: 700 };
const form = { display: "flex", flexDirection: "column", gap: 16 };
const formGroup = { display: "flex", flexDirection: "column", gap: 8 };
const input = {
  padding: 12,
  fontSize: 16,
  borderRadius: 8,
  border: "1px solid #e2e8f0",
};
const btn = {
  background: "#2563eb",
  color: "#fff",
  border: 0,
  padding: "10px 20px",
  borderRadius: 8,
  cursor: "pointer",
  flex: 1,
};
const withdrawBtn = {
  background: "#16a34a",
  color: "#fff",
  border: 0,
  padding: "10px 20px",
  borderRadius: 8,
  cursor: "pointer",
  flex: 1,
};
const dangerBtn = {
  background: "#dc2626",
  color: "#fff",
  border: 0,
  padding: "10px 20px",
  borderRadius: 8,
  cursor: "pointer",
  flex: 1,
};
const actionsRow = { display: "flex", gap: 12, flexWrap: "wrap" };
const table = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
