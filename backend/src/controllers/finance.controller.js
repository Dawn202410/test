const Finance = require('../models/finance.model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const getAllFinances = catchAsync(async (req, res) => {
  const finances = await Finance.find();
  res.status(200).json({
    status: 'success',
    results: finances.length,
    data: {
      finances
    }
  });
});

const getFinance = catchAsync(async (req, res, next) => {
  const finance = await Finance.findById(req.params.id);
  
  if (!finance) {
    return next(new AppError('No finance record found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      finance
    }
  });
});

const createFinance = catchAsync(async (req, res) => {
  const newFinance = await Finance.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      finance: newFinance
    }
  });
});

const updateFinance = catchAsync(async (req, res, next) => {
  const finance = await Finance.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!finance) {
    return next(new AppError('No finance record found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      finance
    }
  });
});

const deleteFinance = catchAsync(async (req, res, next) => {
  const finance = await Finance.findByIdAndDelete(req.params.id);

  if (!finance) {
    return next(new AppError('No finance record found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

module.exports = {
  getAllFinances,
  getFinance,
  createFinance,
  updateFinance,
  deleteFinance
};