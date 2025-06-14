const Process = require('../models/process.model');
const Finance = require('../models/finance.model');

const getReports = async (req, res) => {
  try {
    const processStats = await Process.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const financeStats = await Finance.aggregate([
      { 
        $group: { 
          _id: '$type', 
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      processStats,
      financeStats
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getReports };