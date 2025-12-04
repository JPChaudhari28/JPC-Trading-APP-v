import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    type: { type: String, enum: ['BUY', 'SELL', 'DIVIDEND', 'BONUS', 'SPLIT'], required: true },
    symbol: { type: String, required: true },
    exchange: { type: String, enum: ['NSE', 'BSE'], required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    charges: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
    transactionDate: { type: Date, default: Date.now },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);