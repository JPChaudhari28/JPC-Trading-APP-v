import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    exchange: { type: String, enum: ['NSE', 'BSE'], required: true },
    symbol: { type: String, required: true },
    side: { type: String, enum: ['BUY', 'SELL'], required: true },
    quantity: { type: Number, required: true },
    price: { type: Number },
    orderType: { type: String, enum: ['MARKET', 'LIMIT'], default: 'MARKET' },
    status: { type: String, enum: ['PENDING', 'PLACED', 'REJECTED', 'FILLED', 'CANCELLED'], default: 'PENDING' },
    providerOrderId: { type: String },
    averagePrice: { type: Number },
    placedAt: { type: Date },
    filledAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);

