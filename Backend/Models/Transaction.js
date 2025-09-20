
// models/Transaction.js
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  provider: { type: String, required: true },        // e.g. 'paypal'
  paymentId: { type: String, required: true, index: true }, // PayPal payment id
  payerId: { type: String, index: true },            // sale id or payer id
  amount: { type: String },                          // stored as string '10.00'
  currency: { type: String, default: 'USD' },
  status: { type: String, default: 'pending' },     // pending | completed | failed
  email: { type: String, default: null },
  raw: { type: mongoose.Schema.Types.Mixed },        // full PayPal object (sale/payment)
  paidAt: { type: Date },
}, { timestamps: true });

// optional compound unique constraint to avoid duplicates
transactionSchema.index({ paymentId: 1, payerId: 1 }, { unique: true, sparse: true });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
