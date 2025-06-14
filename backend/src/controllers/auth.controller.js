const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { signToken } = require('../config/jwt');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) 检查邮箱和密码是否存在
  if (!email || !password) {
    return next(new AppError('请提供邮箱和密码', 400));
  }

  // 2) 检查用户是否存在 && 密码是否正确
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('邮箱或密码错误', 401));
  }

  // 3) 如果一切正常，发送token给客户端
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token
  });
});

module.exports = {
  signup,
  login
};