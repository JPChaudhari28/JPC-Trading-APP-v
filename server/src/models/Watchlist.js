import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    symbol: { type: String, required: true },
    exchange: { type: String, enum: ['NSE', 'BSE'], required: true },
    addedAt: { type: Date, default: Date.now },
    targetPrice: { type: Number },
    stopLoss: { type: Number },
    notes: { type: String },
  },
  { timestamps: true }
);

// Ensure unique combination of user, symbol, and exchange
watchlistSchema.index({ userId: 1, symbol: 1, exchange: 1 }, { unique: true });

export default mongoose.model('Watchlist', watchlistSchema);