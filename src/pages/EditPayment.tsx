import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price: number;
}

interface PartItem {
  id: string;
  name: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
}

interface PaymentData {
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
  paymentMethod: string;
  totalAmount: number;
}

const steps = [
  { id: 1, label: '服务项目' },
  { id: 2, label: '备件使用' },
  { id: 3, label: '支付信息' }
];

export default function EditPayment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    services: [],
    parts: [],
    paymentMethod: '现金',
    totalAmount: 0
  });

  // 从本地存储获取服务项目和备件数据
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [parts, setParts] = useState<PartItem[]>([]);

  useEffect(() => {
    // 加载服务项目和备件数据
    const savedServices = localStorage.getItem('servicePrices');
    const savedParts = localStorage.getItem('spareParts');
    
    if (savedServices) {
      setServices(JSON.parse(savedServices));
    }
    
    if (savedParts) {
      setParts(JSON.parse(savedParts));
    }

    // 从URL参数中解析初始数据
    const urlParams = new URLSearchParams(window.location.search);
    const servicesParam = urlParams.get('services');
    const partsParam = urlParams.get('parts');
    const methodParam = urlParams.get('method');

    if (servicesParam && partsParam) {
      try {
        const parsedServices = JSON.parse(decodeURIComponent(servicesParam));
        const parsedParts = JSON.parse(decodeURIComponent(partsParam));
        
        const total = parsedServices.reduce((sum: number, s: any) => sum + s.price, 0) +
                     parsedParts.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);

        setPaymentData({
          services: parsedServices,
          parts: parsedParts,
          paymentMethod: methodParam || '现金',
          totalAmount: total
        });
      } catch (error) {
        console.error('解析URL参数失败:', error);
      }
    }
  }, [id]);

  const handleAddService = (service: { name: string; price: number }) => {
    const newServices = [...paymentData.services, service];
    const newTotal = newServices.reduce((sum, s) => sum + s.price, 0) +
                    paymentData.parts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    
    setPaymentData({
      ...paymentData,
      services: newServices,
      totalAmount: newTotal
    });
    toast.success(`已添加服务: ${service.name}`);
  };

  const handleAddPart = (part: { name: string; model: string; quantity: number; price: number }) => {
    const newParts = [...paymentData.parts, part];
    const newTotal = paymentData.services.reduce((sum, s) => sum + s.price, 0) +
                    newParts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    
    setPaymentData({
      ...paymentData,
      parts: newParts,
      totalAmount: newTotal
    });
    toast.success(`已添加备件: ${part.name}`);
  };

  const handleRemoveService = (index: number) => {
    const newServices = [...paymentData.services];
    const removed = newServices.splice(index, 1);
    const newTotal = newServices.reduce((sum, s) => sum + s.price, 0) +
                    paymentData.parts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    
    setPaymentData({
      ...paymentData,
      services: newServices,
      totalAmount: newTotal
    });
    toast.success(`已移除服务: ${removed[0].name}`);
  };

  const handleRemovePart = (index: number) => {
    const newParts = [...paymentData.parts];
    const removed = newParts.splice(index, 1);
    const newTotal = paymentData.services.reduce((sum, s) => sum + s.price, 0) +
                    newParts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    
    setPaymentData({
      ...paymentData,
      parts: newParts,
      totalAmount: newTotal
    });
    toast.success(`已移除备件: ${removed[0].name}`);
  };

  const handleNextStep = () => {
    // 验证当前步骤是否完成
    if (currentStep === 1 && paymentData.services.length === 0) {
      toast.error('请至少添加一个服务项目');
      return;
    }
    if (currentStep === 2 && paymentData.parts.length === 0) {
      toast.warning('您还没有添加任何备件，确定要继续吗？');
    }
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    try {
      // 严格验证工单ID
      if (!id || typeof id !== 'string' || id.trim() === '' || id === 'undefined' || id === 'null') {
        throw new Error('未找到有效工单ID，请从工单列表重新进入编辑页面');
      }
      
      // 验证ID格式
      if (!/^[a-zA-Z0-9-]+$/.test(id)) {
        throw new Error('工单ID格式无效，包含非法字符');
      }

      // 从本地存储获取工单数据
      const savedRepairs = localStorage.getItem('repairs');
      if (!savedRepairs) {
        throw new Error('系统中暂无任何工单数据');
      }

      let repairs;
      try {
        repairs = JSON.parse(savedRepairs);
      } catch (e) {
        throw new Error('工单数据格式错误，无法解析');
      }

      // 验证repairs是否为数组
      if (!Array.isArray(repairs)) {
        throw new Error('工单数据格式错误，应为数组');
      }

      const repairIndex = repairs.findIndex((r: any) => r.id === id);
      if (repairIndex === -1) {
        throw new Error(`未找到ID为 ${id} 的工单，可能已被删除`);
      }

      // 验证找到的工单是否有效
      const targetRepair = repairs[repairIndex];
      if (!targetRepair || typeof targetRepair !== 'object') {
        throw new Error('找到的工单数据无效');
      }

      // 计算总金额
      const totalAmount = paymentData.services.reduce((sum, s) => sum + s.price, 0) +
                        paymentData.parts.reduce((sum, p) => sum + (p.price * p.quantity), 0);

      // 获取当前选择的支付方式
      const paymentMethod = paymentData.paymentMethod || '现金';

      // 更新工单的payment信息
      const updatedRepairs = [...repairs];
      updatedRepairs[repairIndex] = {
        ...updatedRepairs[repairIndex],
          payment: {
            services: paymentData.services,
            parts: paymentData.parts,
            paymentMethod: paymentMethod,
            totalAmount: totalAmount,
            isPaid: updatedRepairs[repairIndex].payment?.isPaid || false,
            // 添加支付方式同步信息
            paymentDetails: {
              method: paymentMethod,
              synchronized: true,
              synchronizedAt: new Date().toISOString(),
              statusFlow: paymentMethod === '转账' ? ['pending_invoice', 'pending_payment', 'paid'] : 
                       paymentMethod === '内部结算' ? ['settled'] : ['pending', 'paid']
            },
            // 设置结算状态
            settlementStatus: paymentMethod === '内部结算' ? 'settled' : 'unsettled'
          }
      };

      // 更新财务记录中的支付方式
      if (financeRecords && existingRecordIndex >= 0) {
        financeRecords[existingRecordIndex].paymentMethod = paymentMethod;
        financeRecords[existingRecordIndex].paymentDetails = {
          method: paymentMethod,
          updatedAt: new Date().toISOString(),
          synchronized: true
        };
      }

      // 更新财务记录
      const financeRecords = JSON.parse(localStorage.getItem('financeRecords') || '[]');
      const existingRecordIndex = financeRecords.findIndex((r: any) => r.repairId === id);
      
      const newFinanceRecord = {
        id: existingRecordIndex >= 0 ? financeRecords[existingRecordIndex].id : Date.now().toString(),
        repairId: id,
        date: new Date(),
        type: 'service',
        amount: totalAmount,
        paymentMethod: paymentMethod, // 确保支付方式同步
        status: paymentMethod === '转账' ? 'pending_invoice' : 'pending',
        settlementStatus: paymentMethod === '内部结算' ? 'settled' : null,
        paymentDetails: {
          method: paymentMethod,
          updatedAt: new Date().toISOString(),
          synchronized: true,
          statusFlow: paymentMethod === '转账' ? ['pending_invoice', 'pending_payment', 'paid'] : 
                   paymentMethod === '内部结算' ? ['settled'] : ['pending', 'paid']
        },
        services: paymentData.services,
        parts: paymentData.parts
      };

      if (existingRecordIndex >= 0) {
        // 更新现有记录时保持原有ID不变
        newFinanceRecord.id = financeRecords[existingRecordIndex].id;
        financeRecords[existingRecordIndex] = newFinanceRecord;
      } else {
        financeRecords.push(newFinanceRecord);
      }

      // 保存回本地存储
      try {
        localStorage.setItem('repairs', JSON.stringify(updatedRepairs));
        localStorage.setItem('financeRecords', JSON.stringify(financeRecords));
        toast.success('收费信息已保存');
        navigate(-1); // 返回上一页
      } catch (storageError) {
        throw new Error('保存数据失败，请重试');
      }
     } catch (error) {
      console.error('保存收费信息失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast.error(`保存失败: ${errorMessage}`, {
        duration: 10000,
        action: {
          label: '返回工单列表',
          onClick: () => navigate('/process')
        },
        cancel: {
          label: '查看详情',
          onClick: () => {
            // 在控制台显示详细错误
            console.group('收费信息保存错误详情');
            console.error('工单ID:', id);
            console.error('错误:', error);
            console.groupEnd();
          }
        }
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">服务项目</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 添加服务项目 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">添加服务项目</h3>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">服务分类</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="">所有分类</option>
                    {Array.from(new Set(services.map(s => s.category))).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex">
                  <select
                    className="flex-1 p-2 border rounded-l-md"
                    id={`service-select-${id}`}
                  >
                    <option value="">选择服务项目</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} (¥{service.price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                  <button 
                    className="bg-blue-500 text-white px-3 rounded-r-md"
                    onClick={() => {
                      const select = document.getElementById(`service-select-${id}`) as HTMLSelectElement;
                      const selectedOption = select.options[select.selectedIndex];
                      if (selectedOption.value) {
                        const selected = services.find(s => s.id === selectedOption.value);
                        if (selected) {
                          handleAddService({
                            name: selected.name,
                            price: selected.price
                          });
                        }
                      }
                    }}
                  >
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>
              </div>
              
              {/* 已选服务项目列表 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">已选服务项目</h3>
                
                {paymentData.services.length === 0 ? (
                  <p className="text-gray-500 text-sm">暂无服务项目</p>
                ) : (
                  <ul className="space-y-2">
                    {paymentData.services.map((service, index) => (
                      <li key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                        <span>{service.name} - ¥{service.price.toFixed(2)}</span>
                        <button 
                          onClick={() => handleRemoveService(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">备件使用</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 添加备件 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">添加备件</h3>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">备件分类</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="">所有分类</option>
                    {Array.from(new Set(parts.map(p => p.category))).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-3">
                  <div className="flex">
                    <select
                      className="flex-1 p-2 border rounded-l-md"
                      id={`part-select-${id}`}
                    >
                      <option value="">选择备件</option>
                      {parts.map(part => (
                        <option key={part.id} value={part.id}>
                          {part.name} ({part.model}) - ¥{part.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <button 
                      className="bg-blue-500 text-white px-3 rounded-r-md"
                      onClick={() => {
                        const select = document.getElementById(`part-select-${id}`) as HTMLSelectElement;
                        const selectedOption = select.options[select.selectedIndex];
                        if (selectedOption.value) {
                          const selected = parts.find(p => p.id === selectedOption.value);
                          if (selected) {
                            handleAddPart({
                              name: selected.name,
                              model: selected.model,
                              quantity: 1,
                              price: selected.price
                            });
                          }
                        }
                      }}
                    >
                      <i className="fa-solid fa-plus"></i>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 已选备件列表 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">已选备件</h3>
                
                {paymentData.parts.length === 0 ? (
                  <p className="text-gray-500 text-sm">暂无备件</p>
                ) : (
                  <ul className="space-y-2">
                    {paymentData.parts.map((part, index) => (
                      <li key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                        <div>
                          <div>{part.name} ({part.model})</div>
                          <div className="text-sm text-gray-500">×{part.quantity} - ¥{(part.price * part.quantity).toFixed(2)}</div>
                        </div>
                        <button 
                          onClick={() => handleRemovePart(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">支付信息</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">支付方式</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                   <option value="现金">现金（默认）</option>
                   <option value="微信支付">微信支付</option>
                   <option value="支付宝支付">支付宝支付</option>
                   <option value="内部结算">内部结算</option>


                </select>

              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">总金额</label>
                <div className="bg-gray-100 p-3 rounded-md text-lg font-bold">
                  ¥{paymentData.totalAmount.toFixed(2)}
                </div>
              </div>
            </div>

            {/* 摘要信息 */}
            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">收费信息摘要</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-medium text-gray-600 mb-1">服务项目</h4>
                   {paymentData.services.length > 0 ? (
                     <ul className="space-y-1">
                       {paymentData.services.map((service, i) => (
                         <li key={i} className="text-sm text-gray-600">
                           <div>{service.name} - ¥{service.price.toFixed(2)}</div>
                           {service.description && (
                             <div className="text-xs text-gray-400 mt-1">{service.description}</div>
                           )}
                         </li>
                       ))}
                     </ul>
                   ) : (
                     <p className="text-sm text-gray-400">无服务项目</p>
                   )}
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-600 mb-1">备件使用</h4>
                  {paymentData.parts.length > 0 ? (
                    <ul className="space-y-1">
                      {paymentData.parts.map((part, i) => (
                        <li key={i} className="text-sm text-gray-600">
                          {part.name} ({part.model}) ×{part.quantity} - ¥{(part.price * part.quantity).toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400">无备件使用</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">编辑收费信息</h1>
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <div className="flex justify-between">
            {steps.map((stepItem) => (
              <div key={stepItem.id} className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    currentStep >= stepItem.id ? 'bg-[#4A90E2] text-white' : 'bg-gray-200 text-gray-600'
                  )}
                >
                  {stepItem.id}
                </div>
                <span
                  className={cn(
                    'mt-2 text-sm',
                    currentStep === stepItem.id ? 'text-[#4A90E2] font-medium' : 'text-gray-500'
                  )}
                >
                  {stepItem.label}
                </span>
              </div>
            ))}
          </div>
          <div className="relative mt-4">
            <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full"></div>
            <div
              className="absolute top-0 left-0 h-1 bg-[#4A90E2] transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 步骤内容 */}
        {renderStepContent()}

        {/* 操作按钮 */}
        <div className="flex justify-between">
          {currentStep > 1 && (
            <button
              onClick={handlePrevStep}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              上一步
            </button>
          )}
          <div className="ml-auto flex space-x-4">
            {currentStep < steps.length ? (
              <button
                onClick={handleNextStep}
                className="bg-[#4A90E2] text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                下一步
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="bg-[#4A90E2] text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                保存收费信息
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
