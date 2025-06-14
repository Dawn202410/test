const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

// Load env vars
dotenv.config();

// Connect to database
const { connectDB } = require('./config/database');
connectDB();

// Route files
const processes = require('./routes/processes');

const app = express();

// Auth middleware
const authMiddleware = (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized: Please login first' 
    });
  }
  next();
};

// 其他中间件和配置...

module.exports = app;