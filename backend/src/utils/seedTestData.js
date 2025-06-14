const path = require('path');
const fs = require('fs');
const envPath = path.resolve(__dirname, '../../.env');
console.log('Trying to load .env from:', envPath);
console.log('.env file exists:', fs.existsSync(envPath));
require('dotenv').config({ path: envPath });
console.log('Loaded MONGODB_URI:', process.env.MONGODB_URI);
const connectDB = require('../config/db');
const Process = require('../models/process');

const seedData = async () => {
  try {
    await connectDB();
    const testProcess = new Process({
      date: new Date(),
      name: "Test User",
      unit: "Test Unit",
      phone: "1234567890",
      area: "Test Area",
      community: "Test Community",
      address: "Test Address",
      type: "Test Type",
      priority: "low",
      description: "Test Description",
      repairId: "test-123",
      customerId: "cust-test-123"
    });
    await testProcess.save();
    console.log("Test data inserted successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error inserting test data:", error);
    process.exit(1);
  }
};

seedData();