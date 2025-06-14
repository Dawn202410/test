import { useNavigate } from 'react-router-dom';
import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie } from 'recharts';
import { useRepairData } from '@/hooks/useRepairData';
import { useExport } from '@/hooks/useExport';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Admin() {
  const navigate = useNavigate();
  const { 
    dateRange, 
    setDateRange, 
    stats, 
    byType, 
    byArea, 
    byTime, 
    finance, 
    performance,
    loading,
    error
  } = useRepairData();
  const { handleExport } = useExport();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
          <p className="text-gray-600">数据加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-red-50 p-6 rounded-xl max-w-md">
          <i className="fa-solid fa-triangle-exclamation text-4xl text-red-500 mb-4"></i>
          <h2 className="text-xl font-semibold text-red-600 mb-2">数据加载失败</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

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
          {stats.map((item, index) => (
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
              <BarChart data={byType}>
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
                  fill="#4A90E2" 
                  name="报修数量"
                  radius={[4, 4, 0, 0]}
                >
                  {byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
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
                  data={byArea}
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
                  {byArea.map((entry, index) => (
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
                {performance.map((item, index) => (
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
  );
}