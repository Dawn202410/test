const getAdminData = (req, res) => {
  const { start, end } = req.query;
  
  if (!start || !end) {
    return res.status(400).json({ 
      error: '需要提供start和end日期参数',
      example: '/admin?start=2025-05-01&end=2025-05-07'
    });
  }

  // 模拟数据 - 实际项目中应替换为数据库查询
  const stats = [
    { title: '总报修数', value: 56, color: 'from-blue-500 to-blue-600' },
    { title: '已完成', value: 42, color: 'from-green-500 to-green-600' },
    { title: '处理中', value: 8, color: 'from-yellow-500 to-yellow-600' },
    { title: '待处理', value: 6, color: 'from-red-500 to-red-600' }
  ];

  const byType = [
    { type: '水电维修', count: 15 },
    { type: '门窗维修', count: 10 },
    { type: '墙面维修', count: 8 },
    { type: '其他', count: 23 }
  ];

  const byArea = [
    { area: 'A区', count: 20 },
    { area: 'B区', count: 15 },
    { area: 'C区', count: 10 },
    { area: 'D区', count: 11 }
  ];

  const byTime = [
    { time: '08:00', count: 5 },
    { time: '10:00', count: 12 },
    { time: '12:00', count: 8 },
    { time: '14:00', count: 10 },
    { time: '16:00', count: 15 },
    { time: '18:00', count: 6 }
  ];

  const performance = [
    { name: '张三', completed: 15, rating: 4.8 },
    { name: '李四', completed: 12, rating: 4.5 },
    { name: '王五', completed: 8, rating: 4.2 },
    { name: '赵六', completed: 7, rating: 4.0 }
  ];

  const finance = [
    { date: '2025-05-01', income: 1500, expense: 800 },
    { date: '2025-05-02', income: 1200, expense: 700 },
    { date: '2025-05-03', income: 1800, expense: 900 },
    { date: '2025-05-04', income: 900, expense: 500 },
    { date: '2025-05-05', income: 2000, expense: 1000 },
    { date: '2025-05-06', income: 1500, expense: 800 },
    { date: '2025-05-07', income: 1700, expense: 850 }
  ];

  res.json({
    status: 'success',
    dateRange: { start, end },
    stats,
    byType,
    byArea,
    byTime,
    performance,
    finance
  });
};

module.exports = {
  getAdminData
};