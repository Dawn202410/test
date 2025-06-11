import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, BarChart, PieChart, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, Bar, Pie, Cell, Legend, Line } from 'recharts';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';

// 模拟数据
const mockData = {
  byType: [
    { type: '楼宇对讲', count: 12 },
    { type: '楼道照明', count: 8 },
    { type: '电梯故障', count: 5 },
    { type: '水管漏水', count: 7 },
    { type: '电路问题', count: 3 },
  ],
  byArea: [
    { area: '朝阳区', count: 15 },
    { area: '海淀区', count: 10 },
    { area: '西城区', count: 5 },
    { area: '东城区', count: 5 },
  ],
  byTime: [
    { date: '05-01', count: 2 },
    { date: '05-02', count: 3 },
    { date: '05-03', count: 5 },
    { date: '05-04', count: 4 },
    { date: '05-05', count: 7 },
    { date: '05-06', count: 6 },
    { date: '05-07', count: 8 },
  ],
  performance: [
    { staff: '王师傅', completed: 12, avgTime: 2.5 },
    { staff: '李师傅', completed: 8, avgTime: 3.2 },
    { staff: '张师傅', completed: 6, avgTime: 4.1 },
    { staff: '赵师傅', completed: 4, avgTime: 2.8 },
  ],
  finance: [
    { date: '05-01', income: 1200, expense: 800 },
    { date: '05-02', income: 1500, expense: 900 },
    { date: '05-03', income: 1800, expense: 1000 },
    { date: '05-04', income: 1400, expense: 850 },
    { date: '05-05', income: 2000, expense: 1200 },
    { date: '05-06', income: 1700, expense: 950 },
    { date: '05-07', income: 2200, expense: 1100 },
  ],
};

const COLORS = ['#4A90E2', '#36A2EB', '#4DD0E1', '#00C853', '#FFC107'];

export default function Admin() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    start: '2025-05-01',
    end: '2025-05-07',
  });

  const handleExport = () => {
    try {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet([
        { 日期: '2025-05-01', 报修类型: '楼宇对讲', 数量: 12, 区域: '朝阳区' },
        { 日期: '2025-05-02', 报修类型: '楼道照明', 数量: 8, 区域: '海淀区' },
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, "报修数据");
      XLSX.writeFile(workbook, `报修数据_${dateRange.start}_${dateRange.end}.xlsx`);
      toast.success('数据导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('数据导出失败');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* 顶部导航 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent"
          >
            管理后台
          </motion.h1>
          
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm">
                <label className="text-sm text-gray-600">开始日期</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm">
                <label className="text-sm text-gray-600">结束日期</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExport}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center"
              >
                <i className="fa-solid fa-download mr-2"></i>
                导出Excel
              </motion.button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                返回首页
              </button>
            </div>
          </div>
        </div>

        {/* 数据统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { title: '总报修数', value: 56, color: 'from-blue-500 to-blue-600' },
            { title: '已完成', value: 42, color: 'from-green-500 to-green-600' },
            { title: '处理中', value: 8, color: 'from-yellow-500 to-yellow-600' },
            { title: '待处理', value: 6, color: 'from-red-500 to-red-600' },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow`}
            >
              <div className="text-sm text-gray-500">{item.title}</div>
              <div className={`text-2xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                {item.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* 数据看板 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 按类型分布 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fa-solid fa-chart-bar text-blue-500 mr-2"></i>
              报修类型分布
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockData.byType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="type" 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.96)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="url(#colorGradient)" 
                  name="报修数量"
                  radius={[4, 4, 0, 0]}
                >
                  {mockData.byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4A90E2" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* 按区域分布 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fa-solid fa-map-marked-alt text-green-500 mr-2"></i>
              区域报修分布
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockData.byArea}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="area"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {mockData.byArea.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.96)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* 时间趋势 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fa-solid fa-calendar-days text-purple-500 mr-2"></i>
              报修时间趋势
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockData.byTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.96)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#4A90E2" 
                  fill="url(#areaGradient)" 
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: '#4A90E2', stroke: '#fff', strokeWidth: 2 }}
                />
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4A90E2" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* 财务数据 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fa-solid fa-coins text-yellow-500 mr-2"></i>
              财务数据
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockData.finance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.96)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#4CAF50" 
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: '#4CAF50', stroke: '#fff', strokeWidth: 2 }}
                  name="收入"
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#F44336" 
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: '#F44336', stroke: '#fff', strokeWidth: 2 }}
                  name="支出"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* 维修人员绩效 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fa-solid fa-medal text-orange-500 mr-2"></i>
              维修人员绩效
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                      维修人员
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                      完成数量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                      平均处理时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                      客户评分
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockData.performance.map((item, index) => (
                    <motion.tr 
                      key={index}
                      whileHover={{ backgroundColor: '#f9fafb' }}
                      className="transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.staff}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.completed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.avgTime}天
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-yellow-400 h-2.5 rounded-full" 
                              style={{ width: `${Math.random() * 100}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm">{(Math.random() * 5).toFixed(1)}</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
