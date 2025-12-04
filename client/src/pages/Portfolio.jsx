import { useEffect, useState } from "react";
import { api } from "../api";

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  async function loadPortfolio() {
    try {
      const res = await api.get("/api/portfolio");
      setPortfolio(res.data);
    } catch (err) {
      console.error("Failed to load portfolio:", err);
    }
  }

  async function loadTransactions() {
    try {
      const res = await api.get("/api/portfolio/transactions");
      setTransactions(res.data.transactions);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    }
  }

  async function loadAnalytics() {
    try {
      const res = await api.get("/api/portfolio/analytics");
      setAnalytics(res.data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    }
  }

  async function updatePrices() {
    try {
      await api.post("/api/portfolio/update-prices");
      await loadPortfolio();
    } catch (err) {
      console.error("Failed to update prices:", err);
    }
  }

  useEffect(() => {
    loadPortfolio();
    loadTransactions();
    loadAnalytics();
  }, []);

  if (!portfolio) return <div style={loading}>Loading portfolio...</div>;

  return (
    <div style={container}>
      <div style={header}>
        <h2 style={{ margin: 0 }}>Portfolio</h2>
        <button onClick={updatePrices} style={btn}>
          Update Prices
        </button>
      </div>

      <div style={tabs}>
        <button
          style={{
            ...tab,
            ...(activeTab === "overview" ? activeTabStyle : {}),
          }}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          style={{
            ...tab,
            ...(activeTab === "holdings" ? activeTabStyle : {}),
          }}
          onClick={() => setActiveTab("holdings")}
        >
          Holdings
        </button>
        <button
          style={{
            ...tab,
            ...(activeTab === "transactions" ? activeTabStyle : {}),
          }}
          onClick={() => setActiveTab("transactions")}
        >
          Transactions
        </button>
        <button
          style={{
            ...tab,
            ...(activeTab === "analytics" ? activeTabStyle : {}),
          }}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>
      </div>

      {activeTab === "overview" && (
        <div style={card}>
          <h3>Portfolio Summary</h3>
          <div style={summaryGrid}>
            <div style={summaryItem}>
              <div style={summaryLabel}>Total Invested</div>
              <div style={summaryValue}>
                ₹{portfolio.summary.totalInvested.toFixed(2)}
              </div>
            </div>
            <div style={summaryItem}>
              <div style={summaryLabel}>Current Value</div>
              <div style={summaryValue}>
                ₹{portfolio.summary.totalCurrentValue.toFixed(2)}
              </div>
            </div>
            <div style={summaryItem}>
              <div style={summaryLabel}>Unrealized P&L</div>
              <div
                style={{
                  ...summaryValue,
                  color:
                    portfolio.summary.totalUnrealizedPnL >= 0
                      ? "#86efac"
                      : "#fca5a5",
                }}
              >
                ₹{portfolio.summary.totalUnrealizedPnL.toFixed(2)}
              </div>
            </div>
            <div style={summaryItem}>
              <div style={summaryLabel}>Realized P&L</div>
              <div
                style={{
                  ...summaryValue,
                  color:
                    portfolio.summary.totalRealizedPnL >= 0
                      ? "#86efac"
                      : "#fca5a5",
                }}
              >
                ₹{portfolio.summary.totalRealizedPnL.toFixed(2)}
              </div>
            </div>
            <div style={summaryItem}>
              <div style={summaryLabel}>Total P&L</div>
              <div
                style={{
                  ...summaryValue,
                  color:
                    portfolio.summary.totalPnL >= 0 ? "#86efac" : "#fca5a5",
                }}
              >
                ₹{portfolio.summary.totalPnL.toFixed(2)}
              </div>
            </div>
            <div style={summaryItem}>
              <div style={summaryLabel}>Return %</div>
              <div
                style={{
                  ...summaryValue,
                  color:
                    portfolio.summary.returnPercentage >= 0
                      ? "#86efac"
                      : "#fca5a5",
                }}
              >
                {portfolio.summary.returnPercentage.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "holdings" && (
        <div style={card}>
          <h3>Holdings</h3>
          <div style={table}>
            <div style={tableHeader}>
              <div style={tableCell}>Symbol</div>
              <div style={tableCell}>Exchange</div>
              <div style={tableCell}>Quantity</div>
              <div style={tableCell}>Avg Price</div>
              <div style={tableCell}>Current Price</div>
              <div style={tableCell}>P&L</div>
              <div style={tableCell}>Value</div>
            </div>
            {portfolio.portfolio.map((holding, index) => (
              <div key={index} style={tableRow}>
                <div style={tableCell}>{holding.symbol}</div>
                <div style={tableCell}>{holding.exchange}</div>
                <div style={tableCell}>{holding.quantity}</div>
                <div style={tableCell}>₹{holding.averagePrice.toFixed(2)}</div>
                <div style={tableCell}>₹{holding.currentPrice.toFixed(2)}</div>
                <div
                  style={{
                    ...tableCell,
                    color: holding.unrealizedPnL >= 0 ? "#86efac" : "#fca5a5",
                  }}
                >
                  ₹{holding.unrealizedPnL.toFixed(2)}
                </div>
                <div style={tableCell}>₹{holding.currentValue.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div style={card}>
          <h3>Transaction History</h3>
          <div style={table}>
            <div style={tableHeader}>
              <div style={tableCell}>Date</div>
              <div style={tableCell}>Type</div>
              <div style={tableCell}>Symbol</div>
              <div style={tableCell}>Quantity</div>
              <div style={tableCell}>Price</div>
              <div style={tableCell}>Amount</div>
              <div style={tableCell}>Status</div>
            </div>
            {transactions.map((tx, index) => (
              <div key={index} style={tableRow}>
                <div style={tableCell}>
                  {new Date(tx.transactionDate).toLocaleDateString()}
                </div>
                <div
                  style={{
                    ...tableCell,
                    color: tx.type === "BUY" ? "#86efac" : "#fca5a5",
                  }}
                >
                  {tx.type}
                </div>
                <div style={tableCell}>{tx.symbol}</div>
                <div style={tableCell}>{tx.quantity}</div>
                <div style={tableCell}>₹{tx.price.toFixed(2)}</div>
                <div style={tableCell}>₹{tx.netAmount.toFixed(2)}</div>
                <div style={tableCell}>{tx.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "analytics" && analytics && (
        <div style={card}>
          <h3>Performance Analytics</h3>
          <div style={analyticsGrid}>
            <div style={analyticsItem}>
              <h4>Top Performers</h4>
              {analytics.topPerformers.map((stock, index) => (
                <div key={index} style={performerItem}>
                  <div>
                    {stock.symbol} ({stock.exchange})
                  </div>
                  <div
                    style={{ color: stock.pnl >= 0 ? "#86efac" : "#fca5a5" }}
                  >
                    ₹{stock.pnl.toFixed(2)} ({stock.returnPercentage.toFixed(2)}
                    %)
                  </div>
                </div>
              ))}
            </div>
            <div style={analyticsItem}>
              <h4>Statistics</h4>
              <div>Total Transactions: {analytics.totalTransactions}</div>
              <div>Period: {analytics.period}</div>
            </div>
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
const loading = { padding: 20, textAlign: "center", color: "#cbd5e1" };
const card = {
  background: "#0f172a",
  padding: 20,
  borderRadius: 8,
  marginBottom: 20,
  border: "1px solid #1f2937",
};
const btn = {
  background: "#2563eb",
  color: "white",
  border: 0,
  padding: "8px 16px",
  borderRadius: 6,
  cursor: "pointer",
};
const tabs = { display: "flex", gap: 8, marginBottom: 20 };
const tab = {
  background: "transparent",
  color: "#cbd5e1",
  border: "1px solid #1f2937",
  padding: "8px 16px",
  borderRadius: 6,
  cursor: "pointer",
};
const activeTabStyle = { background: "#2563eb", color: "white" };
const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 16,
};
const summaryItem = { textAlign: "center" };
const summaryLabel = { color: "#94a3b8", fontSize: "14px", marginBottom: 4 };
const summaryValue = { color: "white", fontSize: "18px", fontWeight: "bold" };
const table = { display: "flex", flexDirection: "column" };
const tableHeader = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 8,
  padding: "12px 0",
  borderBottom: "1px solid #1f2937",
  fontWeight: "bold",
};
const tableRow = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 8,
  padding: "12px 0",
  borderBottom: "1px solid #1f2937",
};
const tableCell = { color: "#cbd5e1" };
const analyticsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 20,
};
const analyticsItem = { background: "#1e293b", padding: 16, borderRadius: 8 };
const performerItem = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px solid #334155",
};
