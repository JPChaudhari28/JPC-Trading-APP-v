import { useEffect, useState } from "react";
import { api } from "../api";

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [symbol, setSymbol] = useState("");
  const [exchange, setExchange] = useState("NSE");
  const [targetPrice, setTargetPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [notes, setNotes] = useState("");

  async function loadWatchlist() {
    try {
      const res = await api.get("/api/watchlist");
      setWatchlist(res.data.watchlist);
    } catch (err) {
      console.error("Failed to load watchlist:", err);
    }
  }

  async function addToWatchlist(e) {
    e.preventDefault();
    if (!symbol) return;

    try {
      await api.post("/api/watchlist/add", {
        symbol: symbol.toUpperCase(),
        exchange,
        targetPrice: targetPrice ? Number(targetPrice) : undefined,
        stopLoss: stopLoss ? Number(stopLoss) : undefined,
        notes,
      });
      setSymbol("");
      setTargetPrice("");
      setStopLoss("");
      setNotes("");
      await loadWatchlist();
    } catch (err) {
      console.error("Failed to add to watchlist:", err);
    }
  }

  async function removeFromWatchlist(id) {
    try {
      await api.delete(`/api/watchlist/remove/${id}`);
      await loadWatchlist();
    } catch (err) {
      console.error("Failed to remove from watchlist:", err);
    }
  }

  async function updateWatchlistItem(id, updates) {
    try {
      await api.put(`/api/watchlist/update/${id}`, updates);
      await loadWatchlist();
    } catch (err) {
      console.error("Failed to update watchlist item:", err);
    }
  }

  useEffect(() => {
    loadWatchlist();
  }, []);

  return (
    <div style={container}>
      <h2 style={{ marginBottom: 20 }}>Watchlist</h2>

      <div style={card}>
        <h3>Add to Watchlist</h3>
        <form onSubmit={addToWatchlist} style={form}>
          <div style={formRow}>
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Symbol (e.g., RELIANCE)"
              style={input}
              required
            />
            <select
              value={exchange}
              onChange={(e) => setExchange(e.target.value)}
              style={input}
            >
              <option value="NSE">NSE</option>
              <option value="BSE">BSE</option>
            </select>
          </div>
          <div style={formRow}>
            <input
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="Target Price (optional)"
              type="number"
              step="0.05"
              style={input}
            />
            <input
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="Stop Loss (optional)"
              type="number"
              step="0.05"
              style={input}
            />
          </div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            style={input}
          />
          <button type="submit" style={btn}>
            Add to Watchlist
          </button>
        </form>
      </div>

      <div style={card}>
        <h3>Your Watchlist</h3>
        {watchlist.length === 0 ? (
          <div style={empty}>No items in watchlist</div>
        ) : (
          <div style={table}>
            <div style={tableHeader}>
              <div style={tableCell}>Symbol</div>
              <div style={tableCell}>Exchange</div>
              <div style={tableCell}>Current Price</div>
              <div style={tableCell}>Change</div>
              <div style={tableCell}>Target</div>
              <div style={tableCell}>Stop Loss</div>
              <div style={tableCell}>Status</div>
              <div style={tableCell}>Actions</div>
            </div>
            {watchlist.map((item, index) => (
              <div key={index} style={tableRow}>
                <div style={tableCell}>{item.symbol}</div>
                <div style={tableCell}>{item.exchange}</div>
                <div style={tableCell}>₹{item.currentPrice.toFixed(2)}</div>
                <div
                  style={{
                    ...tableCell,
                    color: item.change >= 0 ? "#86efac" : "#fca5a5",
                  }}
                >
                  {item.change.toFixed(2)}%
                </div>
                <div style={tableCell}>
                  {item.targetPrice ? `₹${item.targetPrice}` : "-"}
                  {item.targetHit && <span style={alert}>🎯</span>}
                </div>
                <div style={tableCell}>
                  {item.stopLoss ? `₹${item.stopLoss}` : "-"}
                  {item.stopLossHit && <span style={alert}>⚠️</span>}
                </div>
                <div style={tableCell}>
                  {item.targetHit
                    ? "Target Hit"
                    : item.stopLossHit
                    ? "Stop Loss Hit"
                    : "Watching"}
                </div>
                <div style={tableCell}>
                  <button
                    onClick={() => removeFromWatchlist(item._id)}
                    style={btnSmall}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const container = { padding: 20 };
const card = {
  background: "#0f172a",
  padding: 20,
  borderRadius: 8,
  marginBottom: 20,
  border: "1px solid #1f2937",
};
const form = { display: "flex", flexDirection: "column", gap: 12 };
const formRow = { display: "flex", gap: 12 };
const input = {
  background: "#0b1220",
  border: "1px solid #1f2937",
  color: "white",
  padding: 10,
  borderRadius: 6,
  flex: 1,
};
const btn = {
  background: "#2563eb",
  color: "white",
  border: 0,
  padding: "10px 16px",
  borderRadius: 6,
  cursor: "pointer",
};
const btnSmall = {
  background: "#dc2626",
  color: "white",
  border: 0,
  padding: "4px 8px",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: "12px",
};
const empty = { textAlign: "center", color: "#94a3b8", padding: 40 };
const table = { display: "flex", flexDirection: "column" };
const tableHeader = {
  display: "grid",
  gridTemplateColumns: "repeat(8, 1fr)",
  gap: 8,
  padding: "12px 0",
  borderBottom: "1px solid #1f2937",
  fontWeight: "bold",
};
const tableRow = {
  display: "grid",
  gridTemplateColumns: "repeat(8, 1fr)",
  gap: 8,
  padding: "12px 0",
  borderBottom: "1px solid #1f2937",
};
const tableCell = { color: "#cbd5e1", display: "flex", alignItems: "center" };
const alert = { marginLeft: 4, fontSize: "16px" };
