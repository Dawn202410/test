const SparePart = require('../models/sparePart.model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const getAllSpareParts = catchAsync(async (req, res) => {
  const spareParts = await SparePart.find();
  res.status(200).json({
    status: 'success',
    results: spareParts.length,
    data: {
      spareParts
    }
  });
});

const getSparePart = catchAsync(async (req, res, next) => {
  const sparePart = await SparePart.findById(req.params.id);
  
  if (!sparePart) {
    return next(new AppError('No spare part found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      sparePart
    }
  });
});

const createSparePart = catchAsync(async (req, res) => {
  const newSparePart = await SparePart.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      sparePart: newSparePart
    }
  });
});

const updateSparePart = catchAsync(async (req, res, next) => {
  const sparePart = await SparePart.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!sparePart) {
    return next(new AppError('No spare part found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      sparePart
    }
  });
});

const deleteSparePart = catchAsync(async (req, res, next) => {
  const sparePart = await SparePart.findByIdAndDelete(req.params.id);

  if (!sparePart) {
    return next(new AppError('No spare part found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

module.exports = {
  getAllSpareParts,
  getSparePart,
  createSparePart,
  updateSparePart,
  deleteSparePart
};