import { Server } from "socket.io";
import User from "./models/User.js";
import { zerodhaService } from "./services/zerodha.js";

// Simple in-memory subscription mapping: symbol key -> set of socket ids
const symbolKey = (exchange, symbol) => `${exchange}:${symbol.toUpperCase()}`;

export function attachRealtime(server, { corsOrigin }) {
  const io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Map of subscription key -> Set of socket ids
  const subscriptions = new Map();

  io.on("connection", (socket) => {
    console.log("⚡ Socket connected:", socket.id);

    // --- Wallet: join wallet room ---
    // Expect userId to be sent immediately after connection
    socket.on("wallet:join", ({ userId }) => {
      if (!userId) return;
      socket.join(`wallet:${userId}`);
      console.log(
        `🟢 Socket ${socket.id} joined wallet room for user ${userId}`
      );
    });

    // --- Market quote subscriptions ---
    socket.on("subscribe_quote", ({ exchange = "NSE", symbol }) => {
      if (!symbol) return;
      const key = symbolKey(exchange, symbol);
      if (!subscriptions.has(key)) subscriptions.set(key, new Set());
      subscriptions.get(key).add(socket.id);
      socket.join(key);
    });

    socket.on("unsubscribe_quote", ({ exchange = "NSE", symbol }) => {
      if (!symbol) return;
      const key = symbolKey(exchange, symbol);
      subscriptions.get(key)?.delete(socket.id);
      socket.leave(key);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
      for (const set of subscriptions.values()) set.delete(socket.id);
    });
  });

  // --- Poll market quotes periodically ---
  async function pollAndBroadcast() {
    try {
      const keys = Array.from(subscriptions.keys());
      if (keys.length === 0) return;

      const demoUser = await User.findOne();
      const kite = zerodhaService(demoUser || {});

      for (const key of keys) {
        const [exchange, symbol] = key.split(":");
        try {
          const quote = await kite.getQuote({ exchange, symbol });
          io.to(key).emit("quote", { exchange, symbol, quote, ts: Date.now() });
        } catch (_) {}
      }
    } catch (_) {}
  }

  const interval = setInterval(pollAndBroadcast, 1500);

  /**
   * Utility function to emit wallet updates to a specific user
   * @param {string} userId - ID of the user
   * @param {Object} payload - { balance, ledgerEntry }
   */
  function emitWalletUpdate(userId, payload) {
    io.to(`wallet:${userId}`).emit("wallet:update", payload);
  }

  return {
    io,
    emitWalletUpdate,
    close: () => {
      clearInterval(interval);
      io.close();
    },
  };
}
