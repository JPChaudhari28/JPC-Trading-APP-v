import { createChart } from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { api as baseApi } from "../api";

export default function Dashboard() {
  const [symbol, setSymbol] = useState("RELIANCE");
  const [exchange, setExchange] = useState("NSE");
  const [quote, setQuote] = useState(null);
  const [side, setSide] = useState("BUY");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [timeframe, setTimeframe] = useState("1minute"); // default 1m
  const chartContainerRef = useRef(null);
  const candleSeriesRef = useRef(null);

  const token = localStorage.getItem("token");
  const api = baseApi.create
    ? baseApi.create({ headers: { Authorization: `Bearer ${token}` } })
    : baseApi;
  api.defaults.headers.Authorization = `Bearer ${token}`;

  async function loadQuote() {
    const res = await api.get("/api/market/quote", {
      params: { symbol, exchange },
    });
    setQuote(res.data.quote);
  }

  async function loadOrders() {
    const res = await api.get("/api/orders");
    setOrders(res.data.orders);
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
        orderType: price ? "LIMIT" : "MARKET",
      });
      await loadOrders();
    } catch (err) {
      setError(err.response?.data?.error || "Order failed");
    }
  }

  // Load historical candles based on timeframe
  async function loadCandles() {
    const res = await api.get("/api/market/candles", {
      params: { symbol, exchange, interval: timeframe },
    });

    if (res.data.candles && candleSeriesRef.current) {
      const formatted = res.data.candles.map((c) => ({
        time: Math.floor(new Date(c[0]).getTime() / 1000),
        open: c[1],
        high: c[2],
        low: c[3],
        close: c[4],
      }));
      candleSeriesRef.current.setData(formatted);
    }
  }

  // Chart initialization
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: { background: { color: "#0f172a" }, textColor: "#cbd5e1" },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      timeScale: { borderColor: "#1e293b" },
      rightPriceScale: { borderColor: "#1e293b" },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#16a34a",
      downColor: "#dc2626",
      borderUpColor: "#16a34a",
      borderDownColor: "#dc2626",
      wickUpColor: "#16a34a",
      wickDownColor: "#dc2626",
    });

    candleSeriesRef.current = candleSeries;

    // Resize chart
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Reload candles when timeframe changes
  useEffect(() => {
    loadCandles();
  }, [timeframe]);

  // Live ticks update
  useEffect(() => {
    loadQuote();
    loadOrders();

    const socket = io("http://localhost:5000"); // backend socket
    socket.on("tick", (ticks) => {
      const t = ticks.find((x) => x.instrument_token === 738561); // RELIANCE token
      if (t && candleSeriesRef.current) {
        const candle = {
          time: Math.floor(Date.now() / 1000),
          open: t.ohlc.open,
          high: t.high,
          low: t.low,
          close: t.last_price,
        };
        candleSeriesRef.current.update(candle);

        setQuote({
          symbol: "RELIANCE",
          exchange: "NSE",
          ltp: t.last_price,
          change: ((t.last_price - t.ohlc.open) / t.ohlc.open) * 100,
        });
      }
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Market Section */}
      <section style={card}>
        <h3 style={{ marginTop: 0 }}>Market</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
            style={input}
          >
            <option>NSE</option>
            <option>BSE</option>
          </select>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            style={input}
          />
          <button onClick={loadQuote} style={btn}>
            Get Quote
          </button>
        </div>
        {quote && (
          <div style={{ marginTop: 8, color: "#cbd5e1" }}>
            {quote.exchange}:{quote.symbol} LTP: ₹{quote.ltp.toFixed(2)} (
            {quote.change.toFixed(2)}%)
          </div>
        )}
      </section>

      {/* Candlestick Chart */}
      <section style={card}>
        <h3 style={{ marginTop: 0 }}>Chart</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {["1minute", "5minute", "day"].map((tf) => (
            <button
              key={tf}
              style={{
                ...btn,
                background: timeframe === tf ? "#1e40af" : "#2563eb",
              }}
              onClick={() => setTimeframe(tf)}
            >
              {tf === "1minute" ? "1m" : tf === "5minute" ? "5m" : "1d"}
            </button>
          ))}
        </div>
        <div ref={chartContainerRef} style={{ width: "100%", height: 400 }} />
      </section>

      {/* Place Order */}
      <section style={card}>
        <h3 style={{ marginTop: 0 }}>Place Order</h3>
        <form
          onSubmit={placeOrder}
          style={{ display: "grid", gap: 8, maxWidth: 520 }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={side}
              onChange={(e) => setSide(e.target.value)}
              style={input}
            >
              <option>BUY</option>
              <option>SELL</option>
            </select>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              style={input}
              placeholder="Qty"
            />
            <input
              type="number"
              step="0.05"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={input}
              placeholder="Limit price (optional)"
            />
            <button type="submit" style={btn}>
              Submit
            </button>
          </div>
          {error && <div style={errBox}>{error}</div>}
        </form>
      </section>

      {/* Orders */}
      <section style={card}>
        <h3 style={{ marginTop: 0 }}>Orders</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {orders.map((o) => (
            <div
              key={o._id}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                color: "#cbd5e1",
              }}
            >
              <div
                style={{
                  width: 60,
                  color: o.side === "BUY" ? "#86efac" : "#fca5a5",
                }}
              >
                {o.side}
              </div>
              <div style={{ width: 160 }}>
                {o.exchange}:{o.symbol}
              </div>
              <div>Qty: {o.quantity}</div>
              <div>Status: {o.status}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const card = {
  background: "#0f172a",
  padding: 16,
  border: "1px solid #1f2937",
  borderRadius: 8,
};
const input = {
  background: "#0b1220",
  border: "1px solid #1f2937",
  color: "white",
  padding: 10,
  borderRadius: 6,
};
const btn = {
  background: "#2563eb",
  color: "white",
  border: 0,
  padding: "10px 12px",
  borderRadius: 6,
  cursor: "pointer",
};
const errBox = {
  color: "#fecaca",
  background: "#450a0a",
  border: "1px solid #7f1d1d",
  padding: 8,
  borderRadius: 6,
};
