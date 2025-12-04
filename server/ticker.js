// server/ticker.js
import { KiteTicker } from "kiteconnect";
import { Server } from "socket.io";

export function initTicker(server) {
  const io = new Server(server, { cors: { origin: "*" } });

  const ticker = new KiteTicker({
    api_key: process.env.KITE_API_KEY,
    access_token: process.env.KITE_ACCESS_TOKEN,
  });

  ticker.connect();

  ticker.on("connect", () => {
    console.log("Ticker connected ✅");
    // Example: Reliance token (add dynamically)
    ticker.subscribe([738561]); // instrument_token for RELIANCE
    ticker.setMode(ticker.modeFull, [738561]);
  });

  ticker.on("ticks", (ticks) => {
    io.emit("tick", ticks);
  });
}
