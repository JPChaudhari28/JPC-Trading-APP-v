import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export function useLiveQuote({ exchange, symbol }) {
  const [data, setData] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!exchange || !symbol) return;
    const url = (
      import.meta.env.VITE_API_URL || "http://localhost:4000"
    ).replace(/\/$/, "");
    const socket = io(url, {
      transports: ["websocket"],
      withCredentials: false,
    });
    socketRef.current = socket;

    socket.emit("subscribe_quote", { exchange, symbol });
    socket.on("quote", (payload) => {
      if (payload.symbol === symbol && payload.exchange === exchange) {
        setData(payload.quote);
      }
    });

    return () => {
      socket.emit("unsubscribe_quote", { exchange, symbol });
      socket.disconnect();
    };
  }, [exchange, symbol]);

  return data;
}
