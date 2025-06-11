import { useState, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import RepairCard from '@/components/process/RepairCard';
import FilterToolbar from '@/components/process/FilterToolbar';
import { ReportFormData } from '@/pages/Report';
import { Empty } from '@/components/Empty';

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
  };
};

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="bg-red-50 p-4 rounded-lg">
      <h3 className="text-red-600 font-medium">加载工单数据时出错</h3>
      <pre className="text-red-500 text-sm mt-2">{error.message}</pre>
      <div className="mt-4 space-y-2">
        <button 
          onClick={resetErrorBoundary}
          className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm mr-2"
        >
          <i className="fa-solid fa-rotate-right mr-1"></i>
          重试加载
        </button>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm"
        >
          <i className="fa-solid fa-power-off mr-1"></i>
          刷新页面
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-4">
        如果问题持续存在，请联系管理员并提供以下错误信息:
      </p>
      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
        {error.stack || '无堆栈信息'}
      </pre>
    </div>
  );
}

export default function Process() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [repairs, setRepairs] = useState<ProcessRepairData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
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

  const handleStatusChange = (index: number, status: string, reason?: string) => {
    const updatedRepairs = [...repairs];
    updatedRepairs[index].status = status;
    if (reason) {
      updatedRepairs[index].notes.push({
        content: `状态变更为${status}`,
        date: new Date(),
        processedBy: PROCESSED_BY_NAME,
        statusChangeReason: reason
      });
    }
    setRepairs(updatedRepairs);
    localStorage.setItem('repairs', JSON.stringify(updatedRepairs));
  };

  const handleAddNote = (index: number, note: any) => {
    const updatedRepairs = [...repairs];
    updatedRepairs[index].notes.push(note);
    setRepairs(updatedRepairs);
    localStorage.setItem('repairs', JSON.stringify(updatedRepairs));
  };

  const handleDeleteRepairs = (indices: number[]) => {
    const updatedRepairs = repairs.filter((_, i) => !indices.includes(i));
    setRepairs(updatedRepairs);
    localStorage.setItem('repairs', JSON.stringify(updatedRepairs));
  };

  const handleAddPayment = (index: number, paymentData: any) => {
    const updatedRepairs = [...repairs];
    updatedRepairs[index].payment = {
      ...paymentData,
      totalAmount: paymentData.services.reduce((sum: number, s: any) => sum + s.price, 0) +
                  paymentData.parts.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0),
      isPaid: false
    };
    setRepairs(updatedRepairs);
    localStorage.setItem('repairs', JSON.stringify(updatedRepairs));
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setCustomerId(urlParams.get('customerId'));
    
    const loadRepairs = () => {
      try {
        const savedRepairs = localStorage.getItem('repairs');
        if (savedRepairs) {
          const parsedRepairs = JSON.parse(savedRepairs);
          setRepairs(parsedRepairs);
          
          if (id) {
            const foundRepair = parsedRepairs.find((r: ProcessRepairData) => r.id === id);
            if (!foundRepair) {
              toast.error(`未找到ID为 ${id} 的工单`);
            }
          }
        } else {
          const exampleRepairs = [
            {
              id: '20250602-AC-001',
              date: new Date(),
              name: '示例用户',
              unit: '示例单位',
              phone: '13800138000',
              area: '河东区',
              community: '示例小区',
              address: '1-1-101',
              type: '楼宇对讲系统',
              priority: '中',
              description: '这是一个示例报修工单',
              status: '待处理',
              notes: [],
              processedBy: '',
              completedAt: null
            }
          ];
          setRepairs(exampleRepairs);
          localStorage.setItem('repairs', JSON.stringify(exampleRepairs));
        }
      } catch (error) {
        console.error('加载工单数据失败:', error);
        toast.error('加载工单数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadRepairs();
  }, [id]);

  const renderSingleRepair = () => {
    if (!id) return null;
    
    const repair = repairs.find(r => r.id === id);
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
    const repairIndex = repairs.findIndex(r => r.id === id);

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
          onStatusChange={(status, reason) => handleStatusChange(repairIndex, status, reason)}
          onAddNote={(note) => handleAddNote(repairIndex, note)}
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
          onAddPayment={(paymentData) => handleAddPayment(repairIndex, paymentData)}
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
            .filter(repair => {
              if (filters.status && repair.status !== filters.status) return false;
              if (filters.priority && repair.priority !== filters.priority) return false;
              return true;
            })
            .map((repair, index) => (
              <RepairCard
                key={repair.id}
                repair={repair}
                index={index}
                isSelected={false}
                onSelect={() => {}}
                onStatusChange={(status, reason) => handleStatusChange(index, status, reason)}
                onAddNote={(note) => handleAddNote(index, note)}
                onDelete={() => handleDeleteRepairs([index])}
                showCheckboxes={false}
                services={[]}
                parts={[]}
                selectedPart={null}
                paymentMethod="现金"
                onAddPayment={() => {}}
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
