const express = require('express');
  const mongoose = require('mongoose');
const routes = require('./src/routes');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.use(express.json());
const processesRouter = require('./src/routes/processes');
app.use('/api', routes);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`Port ${port} is already in use`);
    process.exit(1);
  }
});