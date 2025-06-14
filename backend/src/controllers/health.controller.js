// 数据库健康检查控制器实现
const mongoose = require('mongoose');

const checkDbConnection = async (req, res) => {
  try {
    const readyState = mongoose.connection.readyState;
    const isConnected = readyState === 1;
    
    res.json({
      connected: isConnected,
      readyState: readyState,
      status: isConnected ? '已连接' : '未连接',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('数据库连接检查错误:', error);
    res.status(500).json({
      connected: false,
      error: error.message,
      status: '连接错误'
    });
  }
};

module.exports = {
  checkDbConnection
};