import mongoose from 'mongoose';

const bankDetailSchema = new mongoose.Schema({
  accountHolderName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  ifsc: { type: String, required: true },
  bankName: { type: String, required: true },
  branch: { type: String },
});

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    kycVerified: { type: Boolean, default: false },
    bankDetail: bankDetailSchema,
    kiteAccessToken: { type: String },
    kiteUserId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);

