const mongoose = require('mongoose');

const processSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  description: { type: String, required: true, minlength: 10 },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'cancelled'], 
    default: 'pending'
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startDate: { type: Date },
  endDate: { type: Date },
  notes: [{
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  createdAt: { type: Date, default: Date.now }
});

const Process = mongoose.model('Process', processSchema);
module.exports = Process;