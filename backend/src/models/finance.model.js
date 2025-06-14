const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
  process: { type: mongoose.Schema.Types.ObjectId, ref: 'Process', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String },
  description: { type: String },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Finance', financeSchema);