import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    symbol: { type: String, required: true },
    exchange: { type: String, enum: ['NSE', 'BSE'], required: true },
    quantity: { type: Number, required: true },
    averagePrice: { type: Number, required: true },
    currentPrice: { type: Number, default: 0 },
    totalInvested: { type: Number, required: true },
    currentValue: { type: Number, default: 0 },
    unrealizedPnL: { type: Number, default: 0 },
    realizedPnL: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for efficient queries
portfolioSchema.index({ userId: 1, symbol: 1, exchange: 1 }, { unique: true });

export default mongoose.model('Portfolio', portfolioSchema);