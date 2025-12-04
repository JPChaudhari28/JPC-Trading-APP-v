// server/src/routes/zerodhaRoutes.js
import express from "express";
import { zerodhaService } from "../services/zerodha.js"; // use wrapper service

const router = express.Router();

/**
 * Health check
 * GET /api/zerodha/ping
 */
router.get("/ping", (req, res) => {
  res.json({ status: "ok", message: "Zerodha route working!" });
});

/**
 * Generate login URL for Zerodha
 * GET /api/zerodha/login
 */
router.get("/login", (req, res) => {
  try {
    const loginUrl = zerodhaService.getLoginURL();
    if (!loginUrl) {
      return res
        .status(503)
        .json({ error: "Zerodha service unavailable. API key missing?" });
    }
    res.json({ url: loginUrl });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to generate login URL", details: err.message });
  }
});

/**
 * Handle post-login request_token from Zerodha
 * GET /api/zerodha/callback?request_token=...
 */
router.get("/callback", async (req, res) => {
  const { request_token } = req.query;
  if (!request_token) {
    return res.status(400).json({ error: "Missing request_token" });
  }

  try {
    const session = await zerodhaService.generateSession(request_token);
    if (!session) {
      return res.status(503).json({ error: "Failed to create session" });
    }
    res.json({ message: "Login successful", session });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to generate session", details: err.message });
  }
});

/**
 * Get quotes for a given stock
 * GET /api/zerodha/quote?symbol=RELIANCE&exchange=NSE
 */
router.get("/quote", async (req, res) => {
  const { symbol, exchange = "NSE" } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: "Missing stock symbol" });
  }

  const result = await zerodhaService.call((kite) =>
    kite.getQuote([`${exchange}:${symbol}`])
  );

  if (!result) {
    return res.status(503).json({ error: "Failed to fetch quote" });
  }
  res.json({ success: true, quote: result });
});

/**
 * Get user profile
 * GET /api/zerodha/profile
 */
router.get("/profile", async (req, res) => {
  const result = await zerodhaService.call((kite) => kite.getProfile());

  if (!result) {
    return res.status(503).json({ error: "Failed to fetch profile" });
  }
  res.json({ success: true, profile: result });
});

/**
 * Get all orders
 * GET /api/zerodha/orders
 */
router.get("/orders", async (req, res) => {
  const result = await zerodhaService.call((kite) => kite.getOrders());

  if (!result) {
    return res.status(503).json({ error: "Failed to fetch orders" });
  }

  res.json({ success: true, orders: result });
});

/**
 * Place order (Buy/Sell equity)
 * POST /api/zerodha/order
 * Body: { symbol, exchange, quantity, transaction_type }
 * transaction_type = "BUY" | "SELL"
 */
router.post("/order", async (req, res) => {
  const { symbol, exchange = "NSE", quantity, transaction_type } = req.body;

  if (!symbol || !quantity || !transaction_type) {
    return res.status(400).json({
      error: "Missing required fields: symbol, quantity, transaction_type",
    });
  }

  const result = await zerodhaService.call((kite) =>
    kite.placeOrder("regular", {
      tradingsymbol: symbol,
      exchange,
      transaction_type, // "BUY" or "SELL"
      order_type: "MARKET", // default
      quantity: parseInt(quantity),
      product: "CNC", // CNC for delivery equity
    })
  );

  if (!result) {
    return res.status(503).json({ error: "Failed to place order" });
  }
  res.json({ success: true, order: result });
});

/**
 * Cancel order
 * POST /api/zerodha/cancel
 * Body: { order_id }
 */
router.post("/cancel", async (req, res) => {
  const { order_id } = req.body;
  if (!order_id) {
    return res.status(400).json({ error: "Missing order_id" });
  }

  const result = await zerodhaService.call((kite) =>
    kite.cancelOrder("regular", order_id)
  );

  if (!result) {
    return res.status(503).json({ error: "Failed to cancel order" });
  }
  res.json({ success: true, message: "Order cancelled", result });
});

export default router;
