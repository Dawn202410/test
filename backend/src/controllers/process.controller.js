const Process = require('../models/process.model');
const mongoose = require('mongoose'); // 确保导入mongoose

const getAllProcesses = async (req, res) => {
  try {
    const processes = await Process.find().populate('customer assignedTo');
    if (processes.length === 0) {
      return res.status(404).json({ error: '工单数据为空' });
    }
    res.json(processes);
  } catch (err) {
    console.error('获取工单数据错误:', {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      message: '服务器内部错误',
      error: err.message 
    });
  }
};

const createProcess = async (req, res) => {
  console.log('Request body:', JSON.stringify(req.body, null, 2)); // 详细日志
  try {
    const process = new Process({
      ...req.body,
      createdAt: new Date()
    });
    const newProcess = await process.save();
    console.log('Process saved successfully:', newProcess._id);
    res.status(201).json({
      id: newProcess._id,
      ...newProcess._doc
    });
  } catch (error) {
    console.error('Save error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      errors: error.errors // Mongoose验证错误详情
    });
    // 返回更详细的错误信息给前端
    const errorDetails = error.errors ? 
      Object.values(error.errors).map(e => e.message).join(', ') : 
      error.message;
    res.status(400).json({
      message: '数据验证失败',
      details: errorDetails,
      code: error.name
    });
  }
};

const getProcess = async (req, res) => {
  try {
    const process = await Process.findById(req.params.id).populate('customer assignedTo');
    if (!process) {
      return res.status(404).json({ message: 'Process not found' });
    }
    res.json(process);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProcess = async (req, res) => {
  try {
    const process = await Process.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!process) {
      return res.status(404).json({ message: 'Process not found' });
    }
    res.json(process);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteProcess = async (req, res) => {
  try {
    const process = await Process.findByIdAndDelete(req.params.id);
    if (!process) {
      return res.status(404).json({ message: 'Process not found' });
    }
    res.json({ message: 'Process deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllProcesses,
  createProcess,
  getProcess,
  updateProcess,
  deleteProcess
};