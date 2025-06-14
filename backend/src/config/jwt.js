const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const verifyToken = async (token) => {
  return await promisify(jwt.verify)(token, process.env.JWT_SECRET);
};

module.exports = {
  signToken,
  verifyToken
};