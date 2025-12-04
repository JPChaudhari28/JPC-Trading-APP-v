import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import Order from "../models/Order.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import { zerodhaService } from "../services/zerodha.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const orders = await Order.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(100);
  return res.json({ orders });
});

router.get("/orders", async (req, res) => {
  const data = await zerodhaService.call((kite) => kite.getOrders());
  if (!data)
    return res.status(503).json({ error: "Zerodha service unavailable" });
  res.json(data);
});

router.post("/place", requireAuth, async (req, res) => {
  const {
    exchange = "NSE",
    symbol,
    side,
    quantity = 1,
    price,
    orderType = "MARKET",
    stopLoss,
    takeProfit,
    validity = "DAY",
  } = req.body;

  if (!symbol || !side)
    return res.status(400).json({ error: "Missing fields" });

  const user = await User.findById(req.user.id);
  const wallet = await Wallet.findOne({ userId: req.user.id });
  if (!wallet) return res.status(400).json({ error: "Wallet not found" });

  const kite = zerodhaService(user);
  const resp = await kite.placeOrder({
    exchange,
    symbol,
    side,
    quantity,
    price,
    orderType,
  });

  const order = await Order.create({
    userId: req.user.id,
    exchange,
    symbol,
    side,
    quantity,
    price,
    orderType,
    status: "PLACED",
    providerOrderId: resp.order_id,
    placedAt: new Date(),
    stopLoss,
    takeProfit,
    validity,
  });

  // Create transaction record
  const transactionAmount = (price || 100) * quantity;
  const charges = transactionAmount * 0.001; // 0.1% charges
  const netAmount =
    side === "BUY" ? transactionAmount + charges : transactionAmount - charges;

  await Transaction.create({
    userId: req.user.id,
    type: side,
    symbol,
    exchange,
    quantity,
    price: price || 100,
    totalAmount: transactionAmount,
    charges,
    netAmount,
    orderId: order._id,
    status: "PENDING",
  });

  // Handle wallet balance for BUY orders
  if (side === "BUY") {
    if (wallet.balance < netAmount) {
      return res.status(400).json({ error: "Insufficient balance for order" });
    }
    wallet.balance -= netAmount;
    wallet.ledger.push({
      type: "debit",
      amount: netAmount,
      description: `Order: ${side} ${quantity} ${symbol}`,
      meta: { orderId: order._id },
    });
    await wallet.save();
  }

  return res.status(201).json({ order });
});

router.post("/cancel", requireAuth, async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findOne({ _id: orderId, userId: req.user.id });
  if (!order) return res.status(404).json({ error: "Order not found" });
  const user = await User.findById(req.user.id);
  const kite = zerodhaService(user);
  await kite.cancelOrder(order.providerOrderId || "");
  order.status = "CANCELLED";
  await order.save();
  return res.json({ order });
});

// Clear all orders for current user (order history)
router.post("/clear", requireAuth, async (req, res) => {
  await Order.deleteMany({ userId: req.user.id });
  const orders = await Order.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(100);
  return res.json({ cleared: true, orders });
});

export default router;
