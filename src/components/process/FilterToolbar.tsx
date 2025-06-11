import { Filters } from '@/pages/Process';
import { useState } from 'react';

interface FilterToolbarProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

export default function FilterToolbar({ filters, setFilters }: FilterToolbarProps) {
  const [dateType, setDateType] = useState<'report' | 'completed'>('report');

  const handleDateRangeChange = (value: string) => {
    let startDate = '';
    let endDate = '';
    
    if (value === 'today') {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      startDate = startOfDay.toISOString().split('T')[0];
      endDate = endOfDay.toISOString().split('T')[0];
      console.log('Today filter:', {
        startDate,
        endDate,
        startOfDay: startOfDay.toString(),
        startOfDayISO: startOfDay.toISOString(),
        endOfDay: endOfDay.toString(),
        endOfDayISO: endOfDay.toISOString()
      });
    } else if (value === 'week') {
      const today = new Date();
      const firstDay = new Date(today);
      firstDay.setDate(today.getDate() - today.getDay());
      firstDay.setHours(0, 0, 0, 0);
      const lastDay = new Date(today);
      lastDay.setDate(today.getDate() + (6 - today.getDay()));
      lastDay.setHours(23, 59, 59, 999);
      startDate = firstDay.toISOString().split('T')[0];
      endDate = lastDay.toISOString().split('T')[0];
      console.log('Week filter:', { 
        startDate, 
        endDate,
        firstDay: firstDay.toString(),
        firstDayISO: firstDay.toISOString(),
        lastDay: lastDay.toString(),
        lastDayISO: lastDay.toISOString()
      });
    } else if (value === 'month') {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      lastDay.setHours(23, 59, 59, 999);
      startDate = firstDay.toISOString().split('T')[0];
      endDate = lastDay.toISOString().split('T')[0];
      console.log('Month filter:', {
        startDate,
        endDate,
        firstDay: firstDay.toString(),
        firstDayISO: firstDay.toISOString(),
        lastDay: lastDay.toString(),
        lastDayISO: lastDay.toISOString()
      });
    }
    
    if (dateType === 'report') {
      setFilters({ 
        ...filters, 
        reportDateRange: value,
        startDate,
        endDate,
        completedDateRange: '',
        completedStartDate: '',
        completedEndDate: ''
      });
    } else {
      setFilters({ 
        ...filters, 
        completedDateRange: value,
        completedStartDate: startDate,
        completedEndDate: endDate,
        reportDateRange: '',
        startDate: '',
        endDate: ''
      });
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full p-2 border rounded-md"
          >
             <option value="">全部状态</option>
             <option value="待处理">待处理</option>
             <option value="处理中">处理中</option>
             <option value="已完成">已完成</option>
             <option value="搁置">搁置</option>
             <option value="终止">终止</option>
             <option value="拒绝">拒绝</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="w-full p-2 border rounded-md"
          >
            <option value="">全部优先级</option>
            <option value="高">高</option>
            <option value="中">中</option>
            <option value="低">低</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center mb-1">
            <label className="block text-sm font-medium text-gray-700 mr-2">日期类型</label>
            <div className="flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => setDateType('report')}
                className={`px-3 py-1 text-sm rounded-l-md ${dateType === 'report' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                报修日期
              </button>
              <button
                type="button"
                onClick={() => setDateType('completed')}
                className={`px-3 py-1 text-sm rounded-r-md ${dateType === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                完成日期
              </button>
            </div>
          </div>
          <select
            value={dateType === 'report' ? filters.reportDateRange || '' : filters.completedDateRange || ''}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">全部日期</option>
            <option value="today">今天</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="custom">自定义</option>
          </select>
        </div>

        {(filters.reportDateRange === 'custom' || filters.completedDateRange === 'custom') && (
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={dateType === 'report' ? filters.startDate || '' : filters.completedStartDate || ''}
                onChange={(e) => {
                  if (dateType === 'report') {
                    setFilters({ ...filters, startDate: e.target.value });
                  } else {
                    setFilters({ ...filters, completedStartDate: e.target.value });
                  }
                }}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                value={dateType === 'report' ? filters.endDate || '' : filters.completedEndDate || ''}
                onChange={(e) => {
                  if (dateType === 'report') {
                    setFilters({ ...filters, endDate: e.target.value });
                  } else {
                    setFilters({ ...filters, completedEndDate: e.target.value });
                  }
                }}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">综合检索</h3>
        <div className="relative">
          <div className="flex items-center border rounded-md overflow-hidden">
            <div className="flex-shrink-0">
              <select
                value={filters.searchType || 'general'}
                onChange={(e) => setFilters({ ...filters, searchType: e.target.value })}
                className="h-full px-3 py-2 border-r bg-gray-50 text-gray-700 focus:outline-none"
              >
                <option value="general">综合搜索</option>
                <option value="unit">报修单位</option>
                <option value="address">地址</option>
              </select>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className={`fa-solid ${
                  filters.searchType === 'unit' ? 'fa-building' : 
                  filters.searchType === 'address' ? 'fa-location-dot' : 
                  'fa-magnifying-glass'
                } text-gray-400`}></i>
              </div>
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder={
                  filters.searchType === 'unit' ? '搜索报修单位...' : 
                  filters.searchType === 'address' ? '搜索地址...' : 
                  '搜索姓名/描述/单位/地址...'
                }
                className="w-full pl-10 pr-8 py-2 focus:outline-none"
              />
              {(filters.search && filters.search.length > 0) && (
                <button
                  onClick={() => setFilters({ ...filters, search: '' })}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <i className="fa-solid fa-xmark text-gray-400 hover:text-gray-600"></i>
                </button>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {filters.searchType === 'unit' ? '按报修单位搜索' : 
             filters.searchType === 'address' ? '按地址搜索' : 
             '综合搜索姓名、描述、单位或地址'}
          </p>
        </div>
      </div>
    </div>
  );
}
