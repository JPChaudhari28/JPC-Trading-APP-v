import { useEffect, useState } from "react";
import { api } from "../api";
import { useLiveQuote } from "../hooks/useLiveQuote";

export default function EnhancedDashboard() {
  const [symbol, setSymbol] = useState("RELIANCE");
  const [exchange, setExchange] = useState("NSE");
  const [quote, setQuote] = useState(null);
  const [side, setSide] = useState("BUY");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [orderType, setOrderType] = useState("MARKET");
  const [triggerPrice, setTriggerPrice] = useState("");
  const [segment, setSegment] = useState("NSE Cash");
  const [product, setProduct] = useState("CNC");
  const [validity, setValidity] = useState("DAY");
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("trading");
  const [marketData, setMarketData] = useState([]);

  const live = useLiveQuote({ exchange, symbol });
  useEffect(() => {
    if (live) setQuote(live);
  }, [live]);

  // Manual fetch (used by Get Quote button)
  async function loadQuote() {
    try {
      const res = await api.get("/api/market/quote", {
        params: { symbol, exchange },
      });
      setQuote(res.data.quote);
    } catch (err) {
      console.error("Failed to load quote:", err);
    }
  }

  async function loadOrders() {
    try {
      const res = await api.get("/api/orders");
      setOrders(res.data.orders);
    } catch (err) {
      console.error("Failed to load orders:", err);
    }
  }

  async function loadMarketData() {
    try {
      const symbols = [
        "RELIANCE",
        "TCS",
        "HDFC",
        "INFY",
        "HINDUNILVR",
        "ITC",
        "SBIN",
        "BHARTIARTL",
      ];
      const promises = symbols.map((sym) =>
        api
          .get("/api/market/quote", {
            params: { symbol: sym, exchange: "NSE" },
          })
          .then((res) => ({ ...res.data.quote, symbol: sym }))
          .catch(() => ({ symbol: sym, ltp: 0, change: 0 }))
      );
      const data = await Promise.all(promises);
      setMarketData(data);
    } catch (err) {
      console.error("Failed to load market data:", err);
    }
  }

  async function placeOrder(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/orders/place", {
        symbol,
        exchange,
        side,
        quantity,
        price: price ? Number(price) : undefined,
        orderType,
        stopLoss: stopLoss ? Number(stopLoss) : undefined,
        takeProfit: takeProfit ? Number(takeProfit) : undefined,
        validity,
      });
      setPrice("");
      setStopLoss("");
      setTakeProfit("");
      await loadOrders();
    } catch (err) {
      setError(err.response?.data?.error || "Order failed");
    }
  }

  async function cancelOrder(orderId) {
    try {
      await api.post("/api/orders/cancel", { orderId });
      await loadOrders();
    } catch (err) {
      console.error("Failed to cancel order:", err);
    }
  }

  async function clearOrderHistory() {
    try {
      await api.post("/api/orders/clear");
      await loadOrders();
    } catch (err) {
      console.error("Failed to clear orders:", err);
    }
  }

  useEffect(() => {
    loadOrders();
    loadMarketData();

    // Auto-refresh market data every 30 seconds
    const interval = setInterval(() => {
      loadMarketData();
    }, 30000);

    return () => clearInterval(interval);
  }, [symbol, exchange]);

  return (
    <div style={container}>
      <div style={header}>
        <h2 style={{ margin: 0 }}>Trading Dashboard</h2>
        <div style={tabs}>
          <button
            style={{
              ...tab,
              ...(activeTab === "trading" ? activeTabStyle : {}),
            }}
            onClick={() => setActiveTab("trading")}
          >
            Trading
          </button>
          <button
            style={{
              ...tab,
              ...(activeTab === "market" ? activeTabStyle : {}),
            }}
            onClick={() => setActiveTab("market")}
          >
            Market
          </button>
          <button
            style={{
              ...tab,
              ...(activeTab === "orders" ? activeTabStyle : {}),
            }}
            onClick={() => setActiveTab("orders")}
          >
            Orders
          </button>
        </div>
      </div>

      {activeTab === "trading" && (
        <div style={grid}>
          <div style={card}>
            <h3>Market Quote</h3>
            <div style={quoteSection}>
              <div style={quoteInputs}>
                <select
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value)}
                  style={input}
                >
                  <option value="NSE">NSE</option>
                  <option value="BSE">BSE</option>
                  <option value="MCX">MCX</option>
                </select>
                <input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  style={input}
                  placeholder="Enter symbol"
                />
                <button onClick={loadQuote} style={btn}>
                  Get Quote
                </button>
              </div>
              <div style={formRow}>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  style={input}
                >
                  <option value="NSE Cash">NSE Cash</option>
                  <option value="BSE Cash">BSE Cash</option>
                  <option value="NSE F&O">NSE F&O</option>
                  <option value="BSE F&O">BSE F&O</option>
                  <option value="CDS">CDS</option>
                  <option value="MCX">MCX</option>
                </select>
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  style={input}
                >
                  <option value="CNC">CNC</option>
                  <option value="MIS">MIS</option>
                  <option value="NRML">NRML</option>
                  <option value="BO">BO</option>
                  <option value="CO">CO</option>
                </select>
              </div>
              {quote && (
                <div style={quoteDisplay}>
                  <div style={quoteMain}>
                    <div style={quoteSymbol}>
                      {quote.exchange}:{quote.symbol}
                    </div>
                    <div style={quotePrice}>₹{quote.ltp.toFixed(2)}</div>
                    <div
                      style={{
                        ...quoteChange,
                        color: quote.change >= 0 ? "#86efac" : "#fca5a5",
                      }}
                    >
                      {quote.change >= 0 ? "+" : ""}
                      {quote.change.toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={card}>
            <h3>Place Order</h3>
            <form onSubmit={placeOrder} style={orderForm}>
              <div style={formRow}>
                <select
                  value={side}
                  onChange={(e) => setSide(e.target.value)}
                  style={input}
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  style={input}
                  placeholder="Quantity"
                />
              </div>

              <div style={formRow}>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  style={input}
                >
                  <option value="MARKET">Market</option>
                  <option value="LIMIT">Limit</option>
                  <option value="SL">SL</option>
                  <option value="SL-M">SL-M</option>
                </select>
                <select
                  value={validity}
                  onChange={(e) => setValidity(e.target.value)}
                  style={input}
                >
                  <option value="DAY">Day</option>
                  <option value="IOC">IOC</option>
                </select>
              </div>

              {orderType === "LIMIT" && (
                <input
                  type="number"
                  step="0.05"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={input}
                  placeholder="Limit Price"
                />
              )}

              {(orderType === "SL" || orderType === "SL-M") && (
                <input
                  type="number"
                  step="0.05"
                  value={triggerPrice}
                  onChange={(e) => setTriggerPrice(e.target.value)}
                  style={input}
                  placeholder="Trigger Price"
                />
              )}

              <div style={formRow}>
                <input
                  type="number"
                  step="0.05"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  style={input}
                  placeholder="Stop Loss (optional)"
                />
                <input
                  type="number"
                  step="0.05"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  style={input}
                  placeholder="Take Profit (optional)"
                />
              </div>

              {error && <div style={errBox}>{error}</div>}

              <button type="submit" style={submitBtn}>
                {side} {quantity} {symbol}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "market" && (
        <div style={card}>
          <h3>Market Overview</h3>
          <div style={marketGrid}>
            {marketData.map((stock, index) => (
              <div key={index} style={marketItem}>
                <div style={marketSymbol}>{stock.symbol}</div>
                <div style={marketPrice}>₹{stock.ltp.toFixed(2)}</div>
                <div
                  style={{
                    ...marketChange,
                    color: stock.change >= 0 ? "#86efac" : "#fca5a5",
                  }}
                >
                  {stock.change >= 0 ? "+" : ""}
                  {stock.change.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: 0 }}>Order History</h3>
            <button onClick={clearOrderHistory} style={btn}>
              Clear History
            </button>
          </div>
          <div style={table}>
            <div style={tableHeader}>
              <div style={tableCell}>Time</div>
              <div style={tableCell}>Symbol</div>
              <div style={tableCell}>Side</div>
              <div style={tableCell}>Qty</div>
              <div style={tableCell}>Price</div>
              <div style={tableCell}>Type</div>
              <div style={tableCell}>Status</div>
              <div style={tableCell}>Actions</div>
            </div>
            {orders.map((order) => (
              <div key={order._id} style={tableRow}>
                <div style={tableCell}>
                  {new Date(order.createdAt).toLocaleTimeString()}
                </div>
                <div style={tableCell}>{order.symbol}</div>
                <div
                  style={{
                    ...tableCell,
                    color: order.side === "BUY" ? "#86efac" : "#fca5a5",
                  }}
                >
                  {order.side}
                </div>
                <div style={tableCell}>{order.quantity}</div>
                <div style={tableCell}>
                  {order.price ? `₹${order.price.toFixed(2)}` : "Market"}
                </div>
                <div style={tableCell}>{order.orderType}</div>
                <div style={tableCell}>{order.status}</div>
                <div style={tableCell}>
                  {order.status === "PENDING" && (
                    <button
                      onClick={() => cancelOrder(order._id)}
                      style={cancelBtn}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const container = { padding: 20 };
const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
};
const tabs = { display: "flex", gap: 8 };
const tab = {
  background: "linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)",
  color: "#334155",
  border: "1px solid #e2e8f0",
  padding: "8px 16px",
  borderRadius: 8,
  cursor: "pointer",
  boxShadow: "0 1px 2px rgba(16,24,40,0.06)",
};
const activeTabStyle = {
  background: "linear-gradient(180deg,#e0f2fe 0%,#bfdbfe 100%)",
  color: "#0f172a",
  borderColor: "#93c5fd",
};
const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
  gap: 20,
};
const card = {
  background: "rgba(255,255,255,0.9)",
  color: "#0f172a",
  padding: 20,
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 30px rgba(2,6,23,0.06), 0 2px 6px rgba(2,6,23,0.04)",
  backdropFilter: "saturate(180%) blur(6px)",
};
const quoteSection = { display: "flex", flexDirection: "column", gap: 16 };
const quoteInputs = { display: "flex", gap: 8 };
const quoteDisplay = {
  background: "linear-gradient(180deg,#ffffff,#f1f5f9)",
  padding: 16,
  borderRadius: 12,
  border: "1px solid #e2e8f0",
};
const quoteMain = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const quoteSymbol = { color: "#475569", fontSize: "14px" };
const quotePrice = {
  color: "#0f172a",
  fontSize: "26px",
  fontWeight: "800",
  letterSpacing: "-0.02em",
};
const quoteChange = {
  fontSize: "14px",
  fontWeight: "700",
  padding: "4px 8px",
  borderRadius: 999,
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  boxShadow: "inset 0 -1px 0 rgba(2,6,23,0.04)",
};
const orderForm = { display: "flex", flexDirection: "column", gap: 12 };
const formRow = { display: "flex", gap: 8 };
const input = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  color: "#0f172a",
  padding: 10,
  borderRadius: 8,
  flex: 1,
  outline: "none",
  boxShadow: "0 1px 2px rgba(16,24,40,0.06)",
  transition: "box-shadow .2s, border-color .2s",
};
const btn = {
  background: "linear-gradient(180deg,#3b82f6,#2563eb)",
  color: "white",
  border: 0,
  padding: "10px 16px",
  borderRadius: 8,
  cursor: "pointer",
  boxShadow: "0 6px 16px rgba(37,99,235,0.25)",
  transition: "transform .08s ease-in-out",
};
const submitBtn = {
  background: "linear-gradient(180deg,#22c55e,#16a34a)",
  color: "white",
  border: 0,
  padding: "12px 24px",
  borderRadius: 10,
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "bold",
  boxShadow: "0 10px 24px rgba(22,163,74,0.25)",
};
const errBox = {
  color: "#b91c1c",
  background: "#fff1f2",
  border: "1px solid #fecdd3",
  padding: 8,
  borderRadius: 8,
};
const marketGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: 16,
};
const marketItem = {
  background: "linear-gradient(180deg,#ffffff,#f8fafc)",
  padding: 16,
  borderRadius: 12,
  textAlign: "center",
  border: "1px solid #e2e8f0",
};
const marketSymbol = { color: "#475569", fontSize: "14px", marginBottom: 4 };
const marketPrice = {
  color: "#0f172a",
  fontSize: "18px",
  fontWeight: "bold",
  marginBottom: 4,
};
const marketChange = { fontSize: "13px", fontWeight: "700" };
const table = { display: "flex", flexDirection: "column" };
const tableHeader = {
  display: "grid",
  gridTemplateColumns: "repeat(8, 1fr)",
  gap: 8,
  padding: "12px 0",
  borderBottom: "1px solid #e2e8f0",
  fontWeight: "bold",
  color: "#334155",
};
const tableRow = {
  display: "grid",
  gridTemplateColumns: "repeat(8, 1fr)",
  gap: 8,
  padding: "12px 0",
  borderBottom: "1px solid #f1f5f9",
};
const tableCell = { color: "#0f172a", display: "flex", alignItems: "center" };
const cancelBtn = {
  background: "linear-gradient(180deg,#ef4444,#dc2626)",
  color: "white",
  border: 0,
  padding: "6px 10px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: "12px",
  boxShadow: "0 6px 16px rgba(239,68,68,0.25)",
};
