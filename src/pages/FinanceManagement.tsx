import { useState, useEffect } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, BarChart, PieChart, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, Bar, Pie, Cell, Legend, Line } from 'recharts';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface PaymentRecord {
   id: string;
   date: Date;
   type: 'service' | 'part';
   amount: number;
   paymentMethod: string;
   relatedId: string;
   customerId: string;
   status: 'pending' | 'paid';
   settlementStatus?: 'unsettled' | 'settled'; // 内部结算状态
}

  // 验证记录是否有效
  const isValidRecord = (record: any): boolean => {
    return (
      record && 
      typeof record === 'object' &&
      record.id && typeof record.id === 'string' &&
      record.date && !isNaN(new Date(record.date).getTime()) &&
      (record.type === 'service' || record.type === 'part') &&
      typeof record.amount === 'number' && record.amount > 0 &&
      record.paymentMethod && typeof record.paymentMethod === 'string' &&
      record.relatedId && typeof record.relatedId === 'string' &&
      (record.status === 'paid' || record.status === 'pending')
    );
  };

export default function FinanceManagement() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [servicesIncome, setServicesIncome] = useState(0);
  const [partsIncome, setPartsIncome] = useState(0);
  const [expandedRecords, setExpandedRecords] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    paymentMethod: ''
  });

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date()
  });
  const navigate = useNavigate();

  // 导出Excel
  const handleExport = () => {
    try {
      // 创建工作簿
      const workbook = XLSX.utils.book_new();
      
      // 准备数据
      const exportData = filteredRecords.map(record => ({
        '日期': new Date(record.date).toLocaleDateString(),
        '类型': record.type === 'service' ? '服务费' : '备件费',
        '金额': record.amount,
        '支付方式': record.paymentMethod === '现金' ? '现金' : 
                  record.paymentMethod === '转账' ? '对公转账' : 
                  record.paymentMethod === '月结' ? '周期性结算' : 
                  record.paymentMethod === '微信支付' ? '微信支付' : 
                  record.paymentMethod === '支付宝支付' ? '支付宝支付' : 
                  record.paymentMethod === '内部结算' ? '内部结算' : '现金',
        '状态': record.status === 'paid' ? '已支付' : '待支付',
        '关联单号': record.relatedId,
        '结算状态': record.settlementStatus === 'settled' ? '已结算' : '未结算'
      }));

      // 创建工作表
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, "财务数据");
      
      // 生成文件名
      const startDate = dateRange.start.toISOString().split('T')[0];
      const endDate = dateRange.end.toISOString().split('T')[0];
      const fileName = `财务数据_${startDate}_${endDate}.xlsx`;
      
      // 导出Excel文件
      XLSX.writeFile(workbook, fileName);
      
      toast.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败');
    }
  };

  // 加载财务数据
  const loadData = () => {
    try {
      // 从工单和备件记录中计算财务数据
      const repairs = JSON.parse(localStorage.getItem('repairs') || '[]');
      const partsRecords = JSON.parse(localStorage.getItem('stockRecords') || '[]');
      
      // 计算服务收入
      const services = repairs
        .filter((r: any) => r.payment)
        .map((r: any) => ({
          id: r.id,
          date: new Date(r.completedAt || r.date),
          type: 'service' as const,
          amount: r.payment.totalAmount,
          paymentMethod: r.payment.paymentMethod,
          relatedId: r.id,
          customerId: r.customerId,
          status: r.payment.isPaid ? 'paid' : 'pending'

        }))
        .filter(isValidRecord);
      
      // 计算备件收入
      const parts = partsRecords
        .filter((r: any) => r.type === 'out' && r.repairId)
        .map((r: any) => {
          const repair = repairs.find((rep: any) => rep.id === r.repairId);
          if (!repair || !repair.payment) return null;
          
          const partItem = repair.payment.parts.find((p: any) => p.model === r.model);
          return {
            id: r.id,
            date: new Date(r.date),
            type: 'part' as const,
            amount: partItem ? partItem.price * partItem.quantity : 0,
            paymentMethod: repair.payment.paymentMethod,
            relatedId: r.id,
            customerId: repair.customerId,
          status: repair.payment.isPaid ? 'paid' : 'pending'

          };
        })
        .filter(isValidRecord);
      
      const allRecords = [...services, ...parts as PaymentRecord[]].filter(isValidRecord);
      setRecords(allRecords);
      
      // 计算总收入
      setServicesIncome(services.reduce((sum, s) => sum + s.amount, 0));
      setPartsIncome(parts.reduce((sum, p) => sum + (p ? p.amount : 0), 0));

      // 检查是否有数据，如果没有则尝试从工单数据重建
      if (allRecords.length === 0) {
        toast.info('正在尝试从工单数据重建财务记录...');
        const newFinanceRecords = repairs
          .filter((r: any) => r.payment)
          .map((r: any) => ({
            id: r.id,
            repairId: r.id,
            date: new Date(r.completedAt || r.date),
            type: 'service',
            amount: r.payment.totalAmount,
            paymentMethod: r.payment.paymentMethod,
          status: r.payment.isPaid ? 'paid' : 'pending',

            paymentDetails: {
              synchronized: true,
              synchronizedAt: new Date().toISOString()
            }
          }));
        localStorage.setItem('financeRecords', JSON.stringify(newFinanceRecords));
        setRecords(newFinanceRecords.filter(isValidRecord));
      }
    } catch (error) {
      console.error('加载财务数据失败:', error);
      toast.error('加载财务数据失败');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 按日期筛选记录
  const filteredRecords = records.filter(r => {
    const dateMatch = r.date >= dateRange.start && r.date <= dateRange.end;
    const paymentMethodMatch = !filters.paymentMethod || r.paymentMethod === filters.paymentMethod;
    const settlementStatusMatch = !filters.settlementStatus || 
      (r.paymentMethod === '内部结算' && r.settlementStatus === filters.settlementStatus);
    return dateMatch && paymentMethodMatch && settlementStatusMatch;
  });

  // 按类型分组的数据
  const typeData = [
    { name: '服务收入', value: servicesIncome },
    { name: '备件收入', value: partsIncome }
  ];

  // 按时间分组的收入数据
  const timeData = () => {
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const data = [];
    
    if (days <= 7) {
      // 按天分组
      for (let i = 0; i <= days; i++) {
        const date = new Date(dateRange.start);
        date.setDate(date.getDate() + i);
        const dayRecords = records.filter(r => 
          r.date.toDateString() === date.toDateString()
        );
        data.push({
          date: date.toLocaleDateString(),
          income: dayRecords.reduce((sum, r) => sum + r.amount, 0)
        });
      }
    } else {
      // 按周分组
      const weeks = Math.ceil(days / 7);
      for (let i = 0; i < weeks; i++) {
        const start = new Date(dateRange.start);
        start.setDate(start.getDate() + i * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const weekRecords = records.filter(r => 
          r.date >= start && r.date <= end
        );
        data.push({
          date: `第${i+1}周`,
          income: weekRecords.reduce((sum, r) => sum + r.amount, 0)
        });
      }
    }
    
    return data;
  };

  // 删除记录
  const handleDeleteRecord = (recordId: string) => {
    toast.custom((t) => (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <i className="fa-solid fa-triangle-exclamation text-yellow-500 text-xl"></i>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">确认删除</h3>
            <p className="mt-1 text-sm text-gray-500">确定要删除这条收支记录吗？此操作不可恢复。</p>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => toast.dismiss(t)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  toast.dismiss(t);
                  try {
                    const repairs = JSON.parse(localStorage.getItem('repairs') || '[]');
                    const partsRecords = JSON.parse(localStorage.getItem('stockRecords') || '[]');
                    const financeRecords = JSON.parse(localStorage.getItem('financeRecords') || '[]');

                    // 验证记录是否存在
                    const recordIndex = financeRecords.findIndex((r: any) => r.id === recordId);
                    if (recordIndex === -1) {
                      throw new Error('未找到要删除的记录');
                    }

                    const recordToDelete = financeRecords[recordIndex];
                    
                    // 更新关联数据状态
                    if (recordToDelete.type === 'service') {
                      const repairIndex = repairs.findIndex((r: any) => r.id === recordToDelete.relatedId);
                      if (repairIndex !== -1) {
                        repairs[repairIndex].payment = {
                          ...repairs[repairIndex].payment,
                          isPaid: false,
                          paymentDetails: {
                            ...repairs[repairIndex].payment?.paymentDetails,
                            synchronized: false
                          }
                        };
                      }
                    } else {
                      const partRecordIndex = partsRecords.findIndex((r: any) => r.id === recordToDelete.relatedId);
                      if (partRecordIndex !== -1) {
                        partsRecords[partRecordIndex].isPaid = false;
                      }
                    }

                    // 更新财务记录
                    const updatedFinanceRecords = financeRecords.filter((r: any) => r.id !== recordId);

                    // 保存所有更新
                    localStorage.setItem('repairs', JSON.stringify(repairs));
                    localStorage.setItem('stockRecords', JSON.stringify(partsRecords));
                    localStorage.setItem('financeRecords', JSON.stringify(updatedFinanceRecords));

                    // 重新加载数据
                    loadData();
                    toast.success('收支记录已删除');
                  } catch (error) {
                    console.error('删除记录失败:', error);
                    const errorMessage = error instanceof Error ? error.message : '未知错误';
                    toast.error(`删除失败: ${errorMessage}`, {
                      duration: 10000,
                      action: {
                        label: '刷新页面',
                        onClick: () => window.location.reload()
                      }
                    });
                  }
                }}
                className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      </div>
    ));
  };
  const handleStatusChange = async (recordId: string, newStatus: string) => {
    try {
      // 增强ID验证
      if (!recordId || typeof recordId !== 'string' || recordId.trim() === '' || recordId === 'undefined' || recordId === 'null') {
        throw new Error('未找到有效工单ID，请从工单列表重新进入编辑页面');
      }
      
      // 增强ID格式验证
      if (!/^[a-zA-Z0-9-]+$/.test(recordId)) {
        throw new Error('工单ID格式无效，包含非法字符');
      }

      // 检查记录是否存在
      const record = records.find(r => r.id === recordId);
      if (!record) {
        throw new Error('未找到该记录，可能已被删除');
      }

      // 对于现金、微信支付、支付宝支付，状态不可更改
      const immutableMethods = ['现金', '微信支付', '支付宝支付'];
      if (immutableMethods.includes(record.paymentMethod)) {
        const statusNames = {
          'paid': '已支付',
          'pending': '待支付'
        };
        toast.info(`支付方式为${record.paymentMethod}的记录状态不可更改，当前状态: ${statusNames[record.status] || record.status}`, {
          position: 'top-center',
          duration: 3000
        });
        return;
      }

      // 验证状态值
      const validStatuses = ['paid', 'pending'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`无效的状态值: ${newStatus}`);
      }

      // 检查状态是否已改变
      if (record.status === newStatus) {
        const statusNames = {
          'paid': '已支付',
          'pending': '待支付'
        };
        toast.info(`当前状态已是${statusNames[newStatus] || newStatus}，无需重复变更`, {
          duration: 3000,
          position: 'top-center'
        });
        return;
      }

      // 获取所有相关数据
      const savedFinanceRecords = localStorage.getItem('financeRecords');
      const savedRepairs = localStorage.getItem('repairs');
      if (!savedFinanceRecords || !savedRepairs) {
        throw new Error('系统中没有可用的完整数据');
      }

      // 解析数据
      let financeRecords = JSON.parse(savedFinanceRecords);
      let repairs = JSON.parse(savedRepairs);
      
      if (!Array.isArray(financeRecords) || !Array.isArray(repairs)) {
        throw new Error('数据格式错误');
      }

      // 查找财务记录
      const recordIndex = financeRecords.findIndex((r: any) => r.id === recordId);
      if (recordIndex === -1) {
        throw new Error('财务记录不存在或已被删除');
      }

      // 查找关联工单
      const repairId = financeRecords[recordIndex].repairId;
      const repairIndex = repairs.findIndex((r: any) => r.id === repairId);
      
      // 更新财务记录状态
      const updatedFinanceRecord = {
        ...financeRecords[recordIndex],
        status: newStatus,
        updatedAt: new Date().toISOString(),
        paymentDetails: {
          ...(financeRecords[recordIndex].paymentDetails || {}),
          synchronized: true,
          updatedAt: new Date().toISOString(),
          status: newStatus
        }
      };

      // 更新关联工单支付状态
      let updatedRepairs = [...repairs];
      if (repairIndex !== -1) {
        updatedRepairs[repairIndex] = {
          ...repairs[repairIndex],
          payment: {
            ...repairs[repairIndex].payment,
            isPaid: newStatus === 'paid',
            ...(newStatus === 'paid' ? { paidAt: new Date() } : {})
          }
        };
      }

      // 更新所有数据存储
      localStorage.setItem('financeRecords', JSON.stringify([
        ...financeRecords.slice(0, recordIndex),
        updatedFinanceRecord,
        ...financeRecords.slice(recordIndex + 1)
      ]));
      
      localStorage.setItem('repairs', JSON.stringify(updatedRepairs));

      // 强制重新加载数据
      loadData();
      
      const statusNames = {
        'paid': '已支付',
        'pending': '待支付'
      };
      
      toast.success(`记录状态已更新为: ${statusNames[newStatus] || newStatus}`, {
        duration: 2000,
        position: 'top-center'
      });
    } catch (error) {
      console.error('状态更新失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast.error(`状态更新失败: ${errorMessage}`, {
        duration: 5000,
        action: {
          label: '刷新页面',
          onClick: () => window.location.reload()
        }
      });
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">财务管理</h1>
          <div className="flex space-x-4">
            <button 
              onClick={handleExport}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center"
            >
              <i className="fa-solid fa-file-export mr-2"></i>
              导出Excel
            </button>
            <button 
              onClick={() => navigate('/')}
              className="flex items-center text-[#4A90E2] hover:text-blue-600 transition-colors"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i>
              返回首页
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">财务管理</h1>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">¥{(servicesIncome + partsIncome).toFixed(2)}</div>
            <div className="text-gray-500">总收入</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">¥{servicesIncome.toFixed(2)}</div>
            <div className="text-gray-500">服务收入</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-purple-600">¥{partsIncome.toFixed(2)}</div>
            <div className="text-gray-500">备件收入</div>
          </div>
        </div>

         {/* 筛选表单 */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({...dateRange, start: new Date(e.target.value)})}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({...dateRange, end: new Date(e.target.value)})}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">支付方式</label>
              <select
                className="w-full p-2 border rounded-md"
                onChange={(e) => setFilters({...filters, paymentMethod: e.target.value})}
              >
                <option value="">全部</option>
                <option value="现金">现金</option>
                <option value="微信支付">微信支付</option>
                <option value="支付宝支付">支付宝支付</option>
                <option value="内部结算">内部结算</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结算状态</label>
                            <select
                              className="w-full p-2 border rounded-md"
                              onChange={(e) => setFilters({...filters, settlementStatus: e.target.value})}
                            >
                              <option value="">全部</option>
                              <option value="unsettled">未支付</option>
                              <option value="settled">已支付</option>
                            </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setDateRange({
                    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
                    end: new Date()
                  });
                  setFilters({paymentMethod: '', settlementStatus: ''});
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                重置筛选
              </button>
            </div>
           </div>
         </div>

        {/* 数据可视化 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">收入构成</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#4A90E2" />
                  <Cell fill="#8884d8" />
                </Pie>
                <Tooltip formatter={(value) => [`¥${value}`, '金额']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
           <div className="bg-white p-6 rounded-lg shadow-sm">
             <h2 className="text-lg font-semibold text-gray-800 mb-4">收入趋势</h2>
             <ResponsiveContainer width="100%" height={300}>
               <AreaChart data={timeData()}>
                 <CartesianGrid strokeDasharray="3 3" />
                 <XAxis dataKey="date" />
                 <YAxis />
                 <Tooltip 
                   formatter={(value) => [`¥${value}`, '金额']}
                   contentStyle={{
                     background: 'rgba(255, 255, 255, 0.9)',
                     border: '1px solid #e5e7eb',
                     borderRadius: '0.5rem',
                     boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                   }}
                 />
                 <Area 
                   type="monotone" 
                   dataKey="income" 
                   stroke="#4A90E2" 
                   fill="#4A90E2" 
                   fillOpacity={0.2}
                   activeDot={{ r: 6 }}
                 />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* 详细记录 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">收支记录</h2>
          


          {filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <i className="fa-solid fa-file-circle-exclamation text-3xl text-gray-400 mb-3"></i>
              <p className="text-gray-500">当前筛选条件下没有收支记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支付方式</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联单号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => {
                      const isExpanded = expandedRecords.includes(record.id);
                      const repair = records.find(r => r.relatedId === record.relatedId);
                    
                    return (
                      <>
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.type === 'service' ? '服务费' : '备件费'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ¥{record.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {record.paymentMethod === '现金' ? '现金' : 
                               record.paymentMethod === '转账' ? '对公转账' : 
                               record.paymentMethod === '月结' ? '周期性结算' : 
                               record.paymentMethod === '微信支付' ? '微信支付' : 
                              record.paymentMethod === '支付宝支付' ? '支付宝支付' : 
                              record.paymentMethod === '内部结算' ? '内部结算' : '现金'}
                          </td>

                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {record.paymentMethod === '内部结算' ? (
                                  <select
                                    value={record.settlementStatus || 'unsettled'}
                                    onChange={(e) => {
                                      const statusNames = {
                                        'settled': '已支付',
                                        'unsettled': '未支付'
                                      };
                                      
                                      if (confirm(`确定要将支付状态变更为"${statusNames[e.target.value] || e.target.value}"吗？`)) {
                                        handleStatusChange(record.id, e.target.value === 'settled' ? 'paid' : 'pending');
                                        // 更新结算状态
                                        const updatedRecords = records.map(r => 
                                          r.id === record.id ? {...r, settlementStatus: e.target.value as 'unsettled' | 'settled'} : r
                                        );
                                        setRecords(updatedRecords);
                                        localStorage.setItem('financeRecords', JSON.stringify(updatedRecords));
                                      } else {
                                        e.target.value = record.settlementStatus || 'unsettled';
                                      }
                                    }}
                                    className={`px-2 py-1 rounded-full text-xs border ${
                                      record.settlementStatus === 'settled' ? 'bg-green-100 text-green-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    <option value="unsettled">未支付</option>
                                    <option value="settled">已支付</option>
                                  </select>
                                ) : ['现金', '微信支付', '支付宝支付', '转账', '月结'].includes(record.paymentMethod) ? (
                                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 border border-green-200">
                                    已支付
                                  </span>
                                ) : (
                                  <select
                                    value={record.status}
                                    onChange={(e) => {
                                      const statusNames = {
                                        'paid': '已支付',
                                        'pending': '待支付'
                                      };
                                      
                                      if (confirm(`确定要将记录状态变更为"${statusNames[e.target.value] || e.target.value}"吗？`)) {
                                        handleStatusChange(record.id, e.target.value);
                                      } else {
                                        e.target.value = record.status;
                                      }
                                    }}
                                    className={`px-2 py-1 rounded-full text-xs border ${
                                      record.status === 'paid' ? 'bg-green-100 text-green-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    <option value="pending">待支付</option>
                                    <option value="paid">已支付</option>
                                  </select>
                                )}
                              </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500 hover:underline cursor-pointer"
                            onClick={() => {
                              if (record.type === 'service') {
                                navigate(`/process/${record.relatedId}`);
                              } else {
                                toast.info('备件记录查看功能开发中');
                              }
                            }}
                          >
                            {record.relatedId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex space-x-2">
                              <button
                                onClick={() => {
                                  setExpandedRecords(prev => 
                                    prev.includes(record.id) 
                                      ? prev.filter(id => id !== record.id) 
                                      : [...prev, record.id]
                                  );
                                }}
                                className="text-blue-500 hover:text-blue-700"
                              title="查看详情"
                            >
                              <i className={`fa-solid fa-${isExpanded ? 'minus' : 'plus'}`}></i>
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(record.id)}
                              className="text-red-500 hover:text-red-700"
                              title="删除记录"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="px-6 py-4 bg-gray-50">
                                {(() => {
                                  // 从本地存储获取工单数据
                                  const savedRepairs = localStorage.getItem('repairs');
                                  const repairs = savedRepairs ? JSON.parse(savedRepairs) : [];
                                  
                                  // 查找关联工单
                                  const relatedRepair = repairs.find((r: any) => r.id === record.relatedId);
                                  
                                  if (!relatedRepair || !relatedRepair.payment) {
                                    return (
                                      <div className="text-center py-4 bg-gray-100 rounded">
                                        <p className="text-sm text-gray-500">未找到关联工单数据</p>
                                      </div>
                                    );
                                  }
                                  
                                  return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div className="bg-white p-4 rounded-lg shadow-sm">
                                        <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                                          <i className="fa-solid fa-list-check mr-2 text-blue-500"></i>
                                          服务项目
                                        </h4>
                                        {relatedRepair.payment.services?.length > 0 ? (
                                          <div className="space-y-3">
                                            {relatedRepair.payment.services.map((service: any, i: number) => (
                                              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                                                <div>
                                                  <div className="font-medium text-gray-800">{service.name}</div>
                                                  {service.description && (
                                                    <div className="text-xs text-gray-500 mt-1">{service.description}</div>
                                                  )}
                                                </div>
                                                <div className="font-medium text-blue-600">¥{service.price.toFixed(2)}</div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-center py-4 bg-gray-100 rounded">
                                            <p className="text-sm text-gray-500">无服务项目</p>
                                          </div>
                                        )}
                                      </div>
                                      <div className="bg-white p-4 rounded-lg shadow-sm">
                                        <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                                          <i className="fa-solid fa-box-open mr-2 text-green-500"></i>
                                          备件使用
                                        </h4>
                                        {relatedRepair.payment.parts?.length > 0 ? (
                                          <div className="space-y-3">
                                            {relatedRepair.payment.parts.map((part: any, i: number) => (
                                              <div key={i} className="p-3 bg-gray-50 rounded border">
                                                <div className="flex justify-between items-center">
                                                  <div>
                                                    <div className="font-medium text-gray-800">{part.name}</div>
                                                    <div className="text-xs text-gray-500">{part.model}</div>
                                                  </div>
                                                  <div className="text-sm text-gray-600">
                                                    ×{part.quantity}
                                                  </div>
                                                </div>
                                                <div className="mt-2 text-right font-medium text-green-600">
                                                  ¥{(part.price * part.quantity).toFixed(2)}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-center py-4 bg-gray-100 rounded">
                                            <p className="text-sm text-gray-500">无备件使用</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </td>
                            </tr>
                          )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
