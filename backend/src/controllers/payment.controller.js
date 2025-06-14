const Payment = require('../models/payment.model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const getAllPayments = catchAsync(async (req, res) => {
  const payments = await Payment.find();
  res.status(200).json({
    status: 'success',
    results: payments.length,
    data: {
      payments
    }
  });
});

const getPayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id);
  
  if (!payment) {
    return next(new AppError('No payment found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      payment
    }
  });
});

const createPayment = catchAsync(async (req, res) => {
  const newPayment = await Payment.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      payment: newPayment
    }
  });
});

const updatePayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!payment) {
    return next(new AppError('No payment found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      payment
    }
  });
});

const deletePayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findByIdAndDelete(req.params.id);

  if (!payment) {
    return next(new AppError('No payment found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

module.exports = {
  getAllPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment
};