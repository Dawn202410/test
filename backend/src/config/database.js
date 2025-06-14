const mongoose = require('mongoose');
const { MONGODB_URI } = process.env;

// 连接池配置
const poolOptions = {
  maxPoolSize: 50,
  minPoolSize: 10,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000
};

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ...poolOptions
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// 事务支持
const runTransaction = async (operations) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const result = await operations(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = connectDB;