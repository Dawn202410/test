const mongoose = require('mongoose');

const processSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['待处理', '处理中', '已完成', '搁置', '终止', '拒绝'],
    default: '待处理'
  },
  notes: [{
    content: String,
    date: Date,
    processedBy: String,
    statusChangeReason: String,
    media: [{
      url: String,
      type: String,
      description: String
    }]
  }],
  processedBy: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required']
  },
  phone: {
    type: String,
    required: [true, 'Phone is required']
  },
  area: {
    type: String,
    required: [true, 'Area is required']
  },
  community: {
    type: String,
    required: [true, 'Community is required']
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  type: {
    type: String,
    required: [true, 'Type is required']
  },
  priority: {
    type: String,
    required: [true, 'Priority is required'],
    enum: { values: ['high', 'medium', 'low'], message: 'Priority must be high, medium, or low' }
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [2, 'Description must be at least 2 characters']
  },
  repairId: {
    type: String,
    required: [true, 'Repair ID is required']
  },
  customerId: {
    type: String,
    required: [true, 'Customer ID is required']
  }});

module.exports = mongoose.model('Process', processSchema);