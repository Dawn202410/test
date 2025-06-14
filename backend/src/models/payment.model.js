const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Payment must belong to a customer']
  },
  amount: {
    type: Number,
    required: [true, 'Payment must have an amount']
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment must have a method'],
    enum: {
      values: ['cash', 'credit_card', 'bank_transfer', 'other'],
      message: 'Payment method is either: cash, credit_card, bank_transfer, other'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  description: String
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;