// routes/market.js
import express from "express";
import { zerodhaService } from "../services/zerodha.js"; // include .js extension

const router = express.Router();

/**
 * GET /api/market/candles?symbol=RELIANCE&exchange=NSE&interval=5minute
 */
router.get("/candles", async (req, res) => {
  try {
    const { symbol, exchange, interval } = req.query;

    if (!symbol || !exchange || !interval) {
      return res.status(400).json({ error: "Missing params" });
    }

    // Map symbols to instrument_token (you should maintain this in DB or static file)
    // Example: RELIANCE token is 738561 for NSE
    const instrumentMap = {
      NSE: {
        RELIANCE: 738561,
        TCS: 2953217,
        INFY: 408065,
      },
      BSE: {
        RELIANCE: 500325, // Example BSE code if needed
      },
    };

    const token = instrumentMap[exchange]?.[symbol];
    if (!token) {
      return res.status(404).json({ error: "Instrument token not found" });
    }

    // Define time range (last 5 days for intraday, else 6 months)
    const now = new Date();
    let from, to;

    if (interval.includes("minute")) {
      // intraday -> last 5 days
      from = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    } else {
      // daily -> last 6 months
      from = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    }
    to = now;

    // Call Kite API
    const candles = await zerodhaService.historicalData(
      token,
      interval,
      from.toISOString(),
      to.toISOString(),
      false
    );

    res.json({ candles });
  } catch (err) {
    console.error("Error fetching candles:", err);
    res.status(500).json({ error: "Failed to fetch candles" });
  }
});

export default router;
