// src/components/LiveTicker.jsx
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function LiveTicker() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [prices, setPrices] = useState({});

  useEffect(() => {
    let s;
    let retryTimeout;

    const connectSocket = () => {
      s = io(SERVER_URL, {
        path: "/socket.io",
        transports: ["websocket"],
        reconnectionAttempts: 5, // retries
        reconnectionDelay: 2000, // 2s delay between retries
        withCredentials: true,
      });

      s.on("connect", () => {
        console.log("✅ Connected to live ticker");
        setConnected(true);
      });

      s.on("disconnect", () => {
        console.log("❌ Disconnected, retrying...");
        setConnected(false);
      });

      s.on("connect_error", (err) => {
        console.warn("⚠️ Socket connect error:", err.message);
        retryTimeout = setTimeout(connectSocket, 5000); // retry after 5s
      });

      s.on("ticker", (data) => {
        // Example: { symbol: "RELIANCE", price: 2543 }
        setPrices((prev) => ({ ...prev, [data.symbol]: data.price }));
      });

      setSocket(s);
    };

    connectSocket();

    return () => {
      if (s) s.disconnect();
      clearTimeout(retryTimeout);
    };
  }, []);

  return (
    <div className="p-4 rounded-xl bg-gray-800 text-white">
      <h2 className="text-lg font-bold">
        Live Market Ticker {connected ? "🟢" : "🔴"}
      </h2>
      <ul>
        {Object.entries(prices).map(([symbol, price]) => (
          <li key={symbol}>
            {symbol}: <span className="font-mono">{price}</span>
          </li>
        ))}
      </ul>
      {!connected && (
        <p className="text-sm text-gray-400">Waiting for server...</p>
      )}
    </div>
  );
}
