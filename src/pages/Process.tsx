import React, { useState, useEffect } from 'react'; // 移除未使用的React导入
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import RepairCard from '@/components/process/RepairCard';
import FilterToolbar from '@/components/process/FilterToolbar';
import { ReportFormData } from '@/pages/Report';

import { api } from '@/lib/utils';
// 移除未使用的ErrorBoundary和Empty导入

export const PROCESSED_BY_NAME = "Dawn";

export type Filters = {
  status: string;
  priority: string;
  search: string;
  startDate: string;
  endDate: string;
  completedStartDate: string;
  completedEndDate: string;
  reportDateRange: string;
  completedDateRange: string;
};

export type ProcessRepairData = ReportFormData & {
  id: string; // 新增id属性
   status: '待处理' | '处理中' | '已完成' | '搁置' | '终止' | '拒绝';
   notes: {
     content: string;
     date: Date;
     processedBy: string;
     statusChangeReason?: string;
     media?: Array<{
       url: string;
       type: 'image' | 'video';
       description?: string;
     }>;
   }[];
   community: string;
   address: string;
   customerId: string;
   processedBy: string;
   completedAt: Date | null;
   userId: string | null;
   payment?: {
    services: Array<{
      name: string;
      price: number;
    }>;
    parts: Array<{
      name: string;
      model: string;
      quantity: number;
      price: number;
    }>;
    paymentMethod: '现金' | '转账' | '月结' | '其他';
    totalAmount: number;
    isPaid: boolean;
    paidAt?: Date;
  }
};

// 错误回退组件（当前未使用，已注释以解决作用域问题）




export default function Process() {
  console.log('Process组件已挂载');
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [repairs, setRepairs] = useState<ProcessRepairData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
    startDate: '',
    endDate: '',
    completedStartDate: '',
    completedEndDate: '',
    reportDateRange: '',
    completedDateRange: ''
  });

  // 移除数据库连接检查代码（不再需要）

  
  const handleStatusChange = (index: number, status: '待处理' | '处理中' | '已完成', reason?: string): void => {
    void (async () => {
      try {
          console.log('开始加载工单数据...');
        console.log('正在更新工单状态:', { index, status });
        const updatedRepairs = [...repairs];
        updatedRepairs[index].status = status;
        
        if (reason) {
          updatedRepairs[index].notes.push({
            content: `状态变更为${status}`,
            date: new Date(),
            processedBy: PROCESSED_BY_NAME,
            statusChangeReason: reason,
          });
        }
        
        const response = await api.put(`/api/processes/${updatedRepairs[index].id}`, updatedRepairs[index]);
        console.log('工单状态更新响应:', {
          status: response.status,
          data: response.data,
          config: response.config
        });
        setRepairs(updatedRepairs);
      } catch (error) {
        console.error('更新工单状态失败:', error);
        toast.error('更新工单状态失败');
      }
    })();
  };

  const handleAddNote = async (index: number, note: any) => {
    try {
      console.log('正在添加工单备注:', { index, note });
      const updatedRepairs = [...repairs];
      updatedRepairs[index].notes.push(note);
      const response = await api.put(`/api/processes/${updatedRepairs[index].id}`, updatedRepairs[index]);
      console.log('添加备注响应:', {
        status: response.status,
        data: response.data,
        config: response.config
      });
      setRepairs(updatedRepairs);
    } catch (error) {
      console.error('添加备注失败:', error);
      toast.error('添加备注失败');
    }
  };

  const handleDeleteRepairs = async (indices: number[]) => {
    try {
      const deletePromises = indices.map((i: number) => api.delete(`/api/processes/${repairs[i].id}`));
      await Promise.all(deletePromises);
      const updatedRepairs = repairs.filter((_: ProcessRepairData, i: number) => !indices.includes(i));
      setRepairs(updatedRepairs);
    } catch (error) {
      console.error('删除工单失败:', error);
      toast.error('删除工单失败');
    }
  };

interface Service { name: string; price: number; }
interface Part { name: string; model: string; quantity: number; price: number; }
interface PaymentData {
  services: Service[];
  parts: Part[];
  paymentMethod: '现金' | '转账' | '月结' | '其他';
}

  const handleAddPayment = async (index: number, paymentData: PaymentData) => {
    try {
      const updatedRepairs = [...repairs];
      updatedRepairs[index].payment = {
        ...paymentData,
        totalAmount: paymentData.services.reduce((sum: number, s: Service) => sum + s.price, 0) +
                    paymentData.parts.reduce((sum: number, p: Part) => sum + (p.price * p.quantity), 0),
        isPaid: false
      };
      await api.put(`/api/processes/${updatedRepairs[index].id}`, updatedRepairs[index]);
      setRepairs(updatedRepairs);
    } catch (error) {
      console.error('添加支付信息失败:', error);
      toast.error('添加支付信息失败');
    }
  };



  useEffect(() => {
    console.log('[USE_EFFECT] 开始执行useEffect钩子');
    console.log('[USE_EFFECT] 当前id值:', id);
    console.log('[USE_EFFECT] 调用loadRepairs函数:', !id);
    
    const loadRepairs = async () => {
      console.log('[LOAD_REPAIRS] 函数开始执行');
    console.log('[1/8] loadRepairs函数已调用');
    try {
      console.log('[2/8] 准备请求/api/processes接口');
      const response = await api.get('/api/processes').catch(error => {
        console.error('[API ERROR] 请求失败详情:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
          config: error.config,
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          } : '无响应数据',
          isAxiosError: error.isAxiosError,
          isNetworkError: error.isAxiosError && !error.response
        });
        throw error;
      });
      console.log('[3/8] 已收到API响应:', { status: response.status, statusText: response.statusText });
          // 首先检查数据有效性
          if (response.data === null || response.data === undefined) {
            throw new Error('服务器返回无效数据: ' + JSON.stringify(response.data));
          }
          if (!Array.isArray(response.data)) {
            throw new Error('服务器返回数据格式错误，预期数组: ' + JSON.stringify(response.data));
          }
          // 然后再进行日志打印
          // 响应接收后立即记录原始数据
          console.log('原始API响应:', { response, data: response.data, dataType: typeof response.data, isArray: Array.isArray(response.data) });
          console.log('API响应状态码:', response.status);
          console.log('API响应数据类型:', typeof response.data);
          console.log('API响应数据是否为数组:', Array.isArray(response.data));
          console.log('API响应数据值:', response.data);
          console.log('完整响应对象:', response);
          console.log('接口响应:', {
            status: response.status,
            data: response.data,
            config: response.config,
            headers: response.headers
          });
          // 详细记录服务器返回数据以便调试
          console.log('服务器原始返回数据:', JSON.stringify(response.data));
          // 数据为空数组时正常处理
          if (response.data.length === 0) {
            console.log('当前没有工单数据');
            toast.info('暂无工单数据');
            setRepairs([]);
            setIsLoading(false);
            return;
          }
          // 最终安全检查，确保数据有效
          // 先检查数据是否存在且是数组
          if (response.data === undefined || response.data === null || !Array.isArray(response.data)) {
            throw new Error('服务器返回数据格式错误，预期数组: ' + JSON.stringify(response.data));
          }
          // 再检查数组长度
          if (response.data.length === 0) {
            throw new Error('工单数据为空数组');
          }
          // 检查数组第一个元素是否存在
          if (response.data[0] === undefined) {
            throw new Error('工单数据数组第一个元素未定义');
          }
          console.log('进入数据处理流程，response.data状态:', { data: response.data, length: response.data.length });
          // 非空数组才进行数据类型检查
          // 非空数组才进行数据类型检查
          console.log('即将访问response.data[0]前的数据状态:', { data: response.data, dataType: typeof response.data, isArray: Array.isArray(response.data), length: response.data?.length });
          // 使用可选链作为最后一道安全防线
          console.log('数据类型检查:', { _idType: typeof response.data?.[0]?._id, hasToString: typeof response.data?.[0]?._id?.toString === 'function' });
          console.log('转换前_id值:', response.data[0]?._id);
          const convertedData = response.data.map(item => ({ ...item, id: item._id.toString() }));
          console.log('成功加载工单数据:', { count: convertedData.length, firstItemId: convertedData[0]?.id });
          setRepairs(convertedData);
        
        if (id) {
          const foundRepair = response.data.find((r: ProcessRepairData) => r.id === id);
          if (!foundRepair) {
            console.error('未找到指定工单:', { searchId: id, availableIds: response.data.map((r: ProcessRepairData) => r.id) });
            toast.error(`未找到ID为 ${id} 的工单`);
          }
        }
      } catch (error) {
          const errorResponse = (error as { response?: { data: { error: string } } }).response;
          const errorMsg = errorResponse?.data?.error || (error as Error).message;
          
          if (errorMsg === '工单数据为空') {
            console.log('当前没有工单数据');
            toast.info('暂无工单数据');
            setRepairs([]);
          } else if (errorMsg === '未授权访问') {
            console.log('用户未授权');
            toast.error('请先登录系统');
            navigate('/login');
          } else {
            console.error('加载工单数据失败:', {
              error: errorMsg,
              requestUrl: '/api/processes',
              timestamp: new Date().toISOString(),
              userId: localStorage.getItem('userId')
            });
            toast.error('加载工单数据失败');
          }
      } finally {
        setIsLoading(false);
      }
    };

    loadRepairs();
  }, [id]);

  const renderSingleRepair = () => {
    if (!id) return null;
    
    const repair = repairs.find((r: ProcessRepairData) => r.id === id);
    if (!repair) {
      return (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <i className="fa-solid fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-700">未找到工单</h3>
          <p className="text-gray-500 mt-2">工单ID: {id}</p>
          <button
            onClick={() => navigate('/process')}
            className="mt-4 bg-[#4A90E2] text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            返回工单列表
          </button>
        </div>
      );
    }

    const services = JSON.parse(localStorage.getItem('servicePrices') || '[]');
    const parts = JSON.parse(localStorage.getItem('spareParts') || '[]');
    const repairIndex = repairs.findIndex((r: ProcessRepairData) => r.id === id);

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">工单详情</h1>
          <button 
            onClick={() => navigate('/process')}
            className="flex items-center text-[#4A90E2] hover:text-blue-600 transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>
            返回列表
          </button>
        </div>
        
        <RepairCard
          repair={repair}
          index={repairIndex}
          isSelected={false}
          onSelect={() => {}}
          onStatusChange={(status: '待处理' | '处理中' | '已完成') => handleStatusChange(repairIndex, status, '')}
          onAddNote={(note) => handleAddNote(repairIndex, note)}
          setPaymentMethod={() => {}}
          selectedServices={[]}
          selectedParts={[]}
          onDelete={() => {
            if (confirm('确定要删除这个工单吗？')) {
              handleDeleteRepairs([repairIndex]);
              navigate('/process');
            }
          }}
          showCheckboxes={false}
          services={services}
          parts={parts}
          selectedPart={null}
          paymentMethod="现金"
          onAddPayment={(paymentData) => handleAddPayment(repairIndex, {...paymentData, paymentMethod: paymentData.paymentMethod === 'other' ? '其他' : paymentData.paymentMethod})}
        />
      </div>
    );
  };

  const renderRepairList = () => {
    if (isLoading) {
      return (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-blue-400 mb-4"></i>
          <p className="text-gray-500">正在加载工单数据...</p>
        </div>
      );
    }

    if (repairs.length === 0) {
      return (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <i className="fa-solid fa-clipboard-list text-4xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-700">暂无工单数据</h3>
          <p className="text-gray-500 mt-2">当前没有可显示的工单</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <FilterToolbar filters={filters} setFilters={setFilters} />
        <div className="mt-4 space-y-4">
          {repairs
            .filter((repair: ProcessRepairData) => {
              if (filters.status && repair.status !== filters.status) return false;
              if (filters.priority && repair.priority !== filters.priority) return false;
              return true;
            })
            .map((repair: ProcessRepairData, index: number) => (
              <RepairCard
                key={repair.id}
                repair={repair}
                index={index}
                isSelected={false}
                onSelect={() => {}}
                onStatusChange={(status: '待处理' | '处理中' | '已完成') => handleStatusChange(index, status)}
                onAddNote={(note) => handleAddNote(index, note)}
                onDelete={() => handleDeleteRepairs([index])}
                showCheckboxes={false}
                services={[]}
                parts={[]}
                selectedPart={null}
                paymentMethod={"现金" as const}
                onAddPayment={() => {}}
                setPaymentMethod={() => {}}
                selectedServices={[]}
                selectedParts={[]}
              />
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {id ? (
          renderSingleRepair()
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">报修处理</h1>
              <button 
                onClick={() => navigate('/')}
                className="flex items-center text-[#4A90E2] hover:text-blue-600 transition-colors"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                返回首页
              </button>
            </div>
            {renderRepairList()}
          </>
        )}
      </div>
    </div>
  );
}
