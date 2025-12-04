import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import Portfolio from "../models/Portfolio.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { zerodhaService } from "../services/zerodha.js";

const router = Router();

// Get user's complete portfolio
router.get("/", requireAuth, async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ userId: req.user.id });

    // Calculate total portfolio value
    const totalInvested = portfolio.reduce(
      (sum, item) => sum + item.totalInvested,
      0
    );
    const totalCurrentValue = portfolio.reduce(
      (sum, item) => sum + item.currentValue,
      0
    );
    const totalUnrealizedPnL = portfolio.reduce(
      (sum, item) => sum + item.unrealizedPnL,
      0
    );
    const totalRealizedPnL = portfolio.reduce(
      (sum, item) => sum + item.realizedPnL,
      0
    );

    return res.json({
      portfolio,
      summary: {
        totalInvested,
        totalCurrentValue,
        totalUnrealizedPnL,
        totalRealizedPnL,
        totalPnL: totalUnrealizedPnL + totalRealizedPnL,
        returnPercentage:
          totalInvested > 0
            ? ((totalCurrentValue - totalInvested) / totalInvested) * 100
            : 0,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch portfolio" });
  }
});

// Update portfolio with current market prices
router.post("/update-prices", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const kite = zerodhaService(user);
    const portfolio = await Portfolio.find({ userId: req.user.id });

    for (const item of portfolio) {
      try {
        const quote = await kite.getQuote({
          exchange: item.exchange,
          symbol: item.symbol,
        });
        item.currentPrice = quote.ltp;
        item.currentValue = item.quantity * quote.ltp;
        item.unrealizedPnL = item.currentValue - item.totalInvested;
        item.lastUpdated = new Date();
        await item.save();
      } catch (err) {
        console.error(`Failed to update price for ${item.symbol}:`, err);
      }
    }

    return res.json({ message: "Portfolio prices updated successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update portfolio prices" });
  }
});

// Get transaction history
router.get("/transactions", requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, type, symbol } = req.query;
    const filter = { userId: req.user.id };

    if (type) filter.type = type;
    if (symbol) filter.symbol = symbol;

    const transactions = await Transaction.find(filter)
      .sort({ transactionDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(filter);

    return res.json({
      transactions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Get portfolio performance analytics
router.get("/analytics", requireAuth, async (req, res) => {
  try {
    const { period = "30d" } = req.query;
    const days =
      period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const transactions = await Transaction.find({
      userId: req.user.id,
      transactionDate: { $gte: startDate },
      status: "COMPLETED",
    }).sort({ transactionDate: 1 });

    // Calculate daily P&L
    const dailyPnL = {};
    let runningPnL = 0;

    transactions.forEach((tx) => {
      const date = tx.transactionDate.toISOString().split("T")[0];
      if (tx.type === "BUY") {
        runningPnL -= tx.netAmount;
      } else if (tx.type === "SELL") {
        runningPnL += tx.netAmount;
      }
      dailyPnL[date] = runningPnL;
    });

    // Calculate top performing stocks
    const stockPerformance = {};
    transactions.forEach((tx) => {
      const key = `${tx.symbol}-${tx.exchange}`;
      if (!stockPerformance[key]) {
        stockPerformance[key] = {
          symbol: tx.symbol,
          exchange: tx.exchange,
          invested: 0,
          realized: 0,
        };
      }
      if (tx.type === "BUY") {
        stockPerformance[key].invested += tx.netAmount;
      } else if (tx.type === "SELL") {
        stockPerformance[key].realized += tx.netAmount;
      }
    });

    const topPerformers = Object.values(stockPerformance)
      .map((stock) => ({
        ...stock,
        pnl: stock.realized - stock.invested,
        returnPercentage:
          stock.invested > 0
            ? ((stock.realized - stock.invested) / stock.invested) * 100
            : 0,
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 10);

    return res.json({
      dailyPnL,
      topPerformers,
      period,
      totalTransactions: transactions.length,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;
