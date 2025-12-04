import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: "",
    },
    reference: {
      type: String, // e.g., Razorpay payment/order ID
      default: null,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed, // any extra info
      default: {},
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false } // prevent automatic _id for ledger items
);

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    ledger: {
      type: [ledgerSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);
