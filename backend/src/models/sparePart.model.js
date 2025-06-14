const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
  location: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SparePart', sparePartSchema);