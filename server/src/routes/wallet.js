// server/src/routes/wallet.js
import axios from "axios";
import crypto from "crypto";
import { Router } from "express";
import Razorpay from "razorpay";
import { requireAuth } from "../middleware/auth.js";
import Wallet from "../models/Wallet.js";

const router = Router();

// --- Initialize Razorpay Client ---
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- Unified Error Handler ---
function handleError(res, status = 500, message = "Something went wrong", err) {
  if (err) console.error(`❌ ${message}`, err);
  return res.status(status).json({ success: false, error: message });
}

// --- Emit Wallet Update ---
async function emitWalletUpdate(req, userId) {
  try {
    const io = req.app.get("io");
    if (!io) return;
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) return;

    io.to(`wallet:${userId}`).emit("wallet:update", {
      balance: wallet.balance,
      ledgerEntry: wallet.ledger[wallet.ledger.length - 1] || null,
    });
  } catch (err) {
    console.error("❌ Failed to emit wallet update:", err);
  }
}

// =============================
//  🔑 GET /public-key
// =============================
router.get("/public-key", (_req, res) => {
  return res.json({ success: true, keyId: process.env.RAZORPAY_KEY_ID });
});

// =============================
//  💰 GET /balance
// =============================
router.get("/balance", requireAuth, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user.id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user.id, balance: 0 });
    }

    return res.json({
      success: true,
      balance: wallet.balance,
      currency: wallet.currency || "INR",
      ledger: wallet.ledger,
    });
  } catch (err) {
    return handleError(res, 500, "Failed to fetch wallet balance", err);
  }
});

// =============================
//  🪙 POST /create-order
// =============================
router.post("/create-order", requireAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return handleError(res, 400, "Invalid amount");

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      payment_capture: 1,
      notes: { userId: req.user.id },
    });

    return res.json({ success: true, order });
  } catch (err) {
    return handleError(res, 500, "Failed to create order", err);
  }
});

// =============================
//  ✅ POST /verify-payment
// =============================
router.post("/verify-payment", requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return handleError(res, 400, "Invalid payment payload");
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return handleError(res, 400, "Signature verification failed");
    }

    // Fetch payment details
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.status !== "captured") {
      return handleError(res, 400, "Payment not captured");
    }

    const creditAmount = payment.amount / 100;

    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user.id },
      {
        $inc: { balance: creditAmount },
        $push: {
          ledger: {
            type: "CREDIT",
            amount: creditAmount,
            description: "Wallet top-up via Razorpay",
            reference: razorpay_payment_id,
            date: new Date(),
          },
        },
      },
      { upsert: true, new: true }
    );

    await emitWalletUpdate(req, req.user.id);

    return res.json({
      success: true,
      message: "Payment verified and wallet credited",
      balance: wallet.balance,
      ledger: wallet.ledger,
    });
  } catch (err) {
    return handleError(res, 500, "Failed to verify payment", err);
  }
});

// =============================
//  💸 POST /withdraw
// =============================
// (Uses Razorpay Payouts API to withdraw to user's bank or UPI ID)
router.post("/withdraw", requireAuth, async (req, res) => {
  try {
    const { amount, account, mode = "UPI", name = "User" } = req.body;
    if (!amount || amount <= 0) return handleError(res, 400, "Invalid amount");
    if (!account)
      return handleError(res, 400, "Missing payout account (e.g. UPI ID)");

    const wallet = await Wallet.findOne({ userId: req.user.id });
    if (!wallet || wallet.balance < amount) {
      return handleError(res, 400, "Insufficient wallet balance");
    }

    // Create payout via Razorpay X (Needs RazorpayX credentials)
    const payoutPayload = {
      account_number: process.env.RAZORPAYX_ACCOUNT, // virtual account number
      fund_account: {
        account_type: "vpa",
        vpa: { address: account },
        contact: { name },
      },
      amount: Math.round(amount * 100),
      currency: "INR",
      mode,
      purpose: "payout",
      queue_if_low_balance: true,
      narration: "Wallet Withdrawal",
    };

    const basicAuth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    const payoutRes = await axios.post(
      "https://api.razorpay.com/v1/payouts",
      payoutPayload,
      {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Deduct from wallet on successful payout creation
    wallet.balance -= amount;
    wallet.ledger.push({
      type: "DEBIT",
      amount,
      description: "Wallet withdrawal",
      reference: payoutRes.data.id,
      date: new Date(),
    });
    await wallet.save();

    await emitWalletUpdate(req, req.user.id);

    return res.json({
      success: true,
      message: "Withdrawal initiated successfully",
      payout: payoutRes.data,
      balance: wallet.balance,
      ledger: wallet.ledger,
    });
  } catch (err) {
    console.error(err.response?.data || err);
    return handleError(res, 500, "Failed to withdraw funds", err);
  }
});

// =============================
//  🧹 POST /clear
// =============================
router.post("/clear", requireAuth, async (req, res) => {
  try {
    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { balance: 0, ledger: [] } },
      { upsert: true, new: true }
    );

    await emitWalletUpdate(req, req.user.id);

    return res.json({
      success: true,
      message: "Wallet cleared",
      balance: wallet.balance,
      ledger: wallet.ledger,
    });
  } catch (err) {
    return handleError(res, 500, "Failed to clear wallet", err);
  }
});

export default router;
