import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import ProgressBar from '@/components/report/ProgressBar';
import BasicInfoStep from '@/components/report/BasicInfoStep';
import LocationStep from '@/components/report/LocationStep';
import IssueDetailStep from '@/components/report/IssueDetailStep';

// 报修类型到英文缩写的映射
const REPAIR_TYPE_MAP: Record<string, string> = {
  '楼宇对讲系统': 'AC',  // Access Control
  '楼道照明系统': 'HL',  // Hallway Lighting
  '监控安防系统': 'SS',  // Security System
  '道闸系统': 'BG',     // Barrier Gate
  '电梯故障': 'EL',     // Elevator
  '水管漏水': 'PL',     // Plumbing
  '电路问题': 'EC'      // Electrical Circuit
};

const reportSchema = z.object({
  date: z.date(),
  name: z.string().min(0).optional(), // 完全可选
  unit: z.string().min(2, '单位名称至少2个字符'),
  phone: z.string().min(0).optional(), // 完全可选，不再验证格式
  area: z.string().min(1, '请选择区域'),
  community: z.string().min(1, '请输入小区名称'),
  address: z.string().min(2, '详细地址至少2个字符'),
  type: z.string().min(1, '请选择故障类型'),
  priority: z.enum(['高', '中', '低']),
  description: z.string().min(1, '请输入故障描述')
});

export type ReportFormData = z.infer<typeof reportSchema> & {
  community: string;
  address: string;
  customerId?: string;
};

export default function Report() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<ReportFormData>>({});
  const navigate = useNavigate();

  const handleNext = (data: Partial<ReportFormData>) => {
    setFormData({ ...formData, ...data });
    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  // 生成工单ID: YYYYMMDD-TYPE-XXX
  const generateRepairId = (date: Date, type: string, existingRepairs: any[]) => {
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const typeAbbr = REPAIR_TYPE_MAP[type] || 'OT'; // OT for Other
    
    // 获取当天同类型工单数量
    const sameDaySameTypeCount = existingRepairs.filter(repair => {
      const repairDate = new Date(repair.date).toISOString().split('T')[0].replace(/-/g, '');
      return repairDate === dateStr && repair.type === type;
    }).length;
    
    const seq = String(sameDaySameTypeCount + 1).padStart(3, '0');
    return `${dateStr}-${typeAbbr}-${seq}`;
  };

  const generateCustomerId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleSubmit = async (data: Partial<ReportFormData>) => {
    try {
      // 合并表单数据
      const completeData = { ...formData, ...data };
      
      // 严格验证表单数据
      try {
        reportSchema.parse(completeData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const firstError = error.errors[0];
          toast.error(`表单验证失败: ${firstError.message}`, {
            position: 'top-center',
            duration: 5000,
            action: {
              label: '前往填写',
              onClick: () => {
                const element = document.querySelector(`[name="${firstError.path[0]}"]`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  (element as HTMLElement).focus();
                }
              }
            }
          });
        } else {
          toast.error('表单数据不完整或格式错误');
        }
        throw error;
      }

      // 获取现有数据
      let repairs = [];
      let customers = [];
      try {
        const existingRepairs = localStorage.getItem('repairs');
        const existingCustomers = localStorage.getItem('customers') || '[]';
        
        // 初始化变量确保是数组
        repairs = [];
        customers = [];
        
        // 验证JSON格式
        try {
          repairs = existingRepairs ? JSON.parse(existingRepairs) : [];
          customers = JSON.parse(existingCustomers);
        } catch (e) {
          throw new Error('数据格式错误，请尝试清除浏览器缓存');
        }
        
        // 验证数据格式
        if (!Array.isArray(repairs) || !Array.isArray(customers)) {
          throw new Error('本地存储数据格式错误');
        }
      } catch (storageError) {
        console.error('读取本地存储失败:', storageError);
        toast.error(`读取系统数据失败: ${storageError instanceof Error ? storageError.message : '未知错误'}`, {
          action: {
            label: '刷新页面',
            onClick: () => window.location.reload()
          }
        });
        throw storageError;
      }
      
      // 生成工单ID
      const repairId = generateRepairId(completeData.date, completeData.type, repairs);
      
      // 创建新工单
      const newRepair = {
        ...completeData,
        id: repairId,
        status: '待处理',
        notes: [],
        processedBy: '',
        completedAt: null,
        customerId: generateCustomerId(),
        community: completeData.community,
        address: completeData.address
      };
      
          // 更新客户信息
          try {
          // 查找是否已存在相同小区和地址的客户
          const existingCustomerIndex = customers.findIndex(c => 
            c.community === completeData.community && 
            c.address === completeData.address
          );
          
          if (existingCustomerIndex >= 0) {
            // 更新现有客户
            const customer = customers[existingCustomerIndex];
            customer.repairCount += 1;
            customer.lastRepairDate = new Date();
              
              // 确保repairs数组存在且是数组
              if (!customer.repairs || !Array.isArray(customer.repairs)) {
                customer.repairs = [];
              }
              
              // 检查是否已存在相同工单ID，避免重复添加
              const existingRepairIndex = customer.repairs.findIndex(r => r.id === repairId);
              if (existingRepairIndex === -1) {
                // 添加新工单
                customer.repairs.push({
                  id: repairId,
                  type: completeData.type,
                  status: '待处理',
                  date: completeData.date,
                  priority: completeData.priority
                });
                // 立即更新本地存储
                localStorage.setItem('customers', JSON.stringify(customers));
              }
            } else {
              // 创建新客户
              const newCustomer = {
                id: newRepair.customerId,
                name: completeData.name,
                phone: completeData.phone,
                unit: completeData.unit,
                community: completeData.community,
                address: completeData.address,
                fullAddress: `${completeData.community} ${completeData.address}`.trim(),
                repairCount: 1,
                lastRepairDate: new Date(),
                repairs: [{
                  id: repairId,
                  type: completeData.type,
                  status: '待处理',
                  date: completeData.date,
                  priority: completeData.priority
                }]
              };
              // 确保新客户的repairs数组有效
              if (!newCustomer.repairs || !Array.isArray(newCustomer.repairs)) {
                newCustomer.repairs = [];
              }
              customers.push(newCustomer);
            }
            
            // 确保新工单有正确的customerId
            newRepair.customerId = existingCustomerIndex >= 0 
              ? customers[existingCustomerIndex].id 
              : newRepair.customerId;
        
        // 保存数据
        try {
          localStorage.setItem('repairs', JSON.stringify([...repairs, newRepair]));
          localStorage.setItem('customers', JSON.stringify(customers));
          localStorage.setItem('latestReport', JSON.stringify(completeData));
          
          toast.success('报修工单已成功保存', {
            position: 'top-center',
            duration: 2000
          });
          navigate('/process');
          return true;
        } catch (saveError) {
          console.error('保存数据失败:', saveError);
          toast.error('保存数据失败，请检查存储空间或重试', {
            action: {
              label: '重试',
              onClick: () => handleSubmit(data)
            }
          });
          throw saveError;
        }
      } catch (customerError) {
        console.error('更新客户数据失败:', customerError);
        toast.error(`更新客户信息失败: ${customerError instanceof Error ? customerError.message : '未知错误'}`);
        throw customerError;
      }
    } catch (error) {
      console.error('保存报修工单失败:', error);
      if (!(error instanceof z.ZodError)) {
        toast.error(`保存报修工单失败: ${error instanceof Error ? error.message : '请重试'}`, {
          position: 'top-center',
          action: {
            label: '刷新页面',
            onClick: () => window.location.reload()
          }
        });
      }
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">报修登记</h1>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-[#4A90E2] hover:text-blue-600 transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>
            返回首页
          </button>
        </div>
        <div className="mb-4">
          <ProgressBar currentStep={step} />
        </div>

        
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          {step === 1 && <BasicInfoStep onNext={handleNext} initialData={formData} />}
          {step === 2 && (
            <LocationStep 
              onNext={handleNext} 
              onPrev={handlePrev} 
              initialData={formData} 
            />
          )}
          {step === 3 && (
            <IssueDetailStep 
              onSubmit={handleSubmit} 
              onPrev={handlePrev} 
              initialData={formData} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
