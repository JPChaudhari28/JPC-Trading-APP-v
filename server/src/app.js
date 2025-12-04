// server/src/app.js
import axios from "axios";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import morgan from "morgan";
import Razorpay from "razorpay";
import { Server as SocketServer } from "socket.io";

/* 

TEST */

// Routes
import authRoutes from "./routes/auth.js";
import marketRoutes from "./routes/market.js";
import orderRoutes from "./routes/orders.js";
import portfolioRoutes from "./routes/portfolio.js";
import walletRoutes from "./routes/wallet.js";
import watchlistRoutes from "./routes/watchlist.js";
import zerodhaRoutes from "./routes/zerodhaRoutes.js";

// Models
import Wallet from "./models/Wallet.js";

dotenv.config();

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/jpc_trading";

// --- Razorpay Instance ---
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- Express App ---
const app = express();
const server = http.createServer(app);

// --- Middleware ---
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/zerodha", zerodhaRoutes);

// --- Axios Instance ---
export const api = axios.create({
  baseURL: `http://localhost:${PORT}/api`,
});

// --- Socket.IO Setup ---
const io = new SocketServer(server, { cors: { origin: "*" } });
app.set("io", io);

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("joinWalletRoom", (userId) => {
    socket.join(`wallet_${userId}`);
    console.log(`Socket ${socket.id} joined wallet_${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

// --- Emit Wallet Update ---
export const emitWalletUpdate = async (userId) => {
  try {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) return;
    io.to(`wallet_${userId}`).emit("wallet:update", {
      balance: wallet.balance,
      ledgerEntry: wallet.ledger[wallet.ledger.length - 1] || null,
    });
  } catch (err) {
    console.error("❌ Failed to emit wallet update:", err);
  }
};

// --- DB Connection ---
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: "jpc_trading" });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ DB connection error:", err);
    process.exit(1);
  }
}

// --- Start Server ---
async function startServer() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

startServer();

export default app;
