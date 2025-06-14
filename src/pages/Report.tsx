import React, { useState } from 'react';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import ProgressBar from '@/components/report/ProgressBar';
import BasicInfoStep from '@/components/report/BasicInfoStep';
import LocationStep from '@/components/report/locationstep';
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
  name: z.string().min(1, '姓名不能为空'),
  unit: z.string().min(2, '单位名称至少2个字符'),
  phone: z.string().min(1, '联系电话不能为空'),
  area: z.string().min(1, '请选择区域'),
  community: z.string().min(1, '请输入小区名称'),
  address: z.string().min(2, '详细地址至少2个字符'),
  type: z.string().min(1, '请选择故障类型'),
  priority: z.enum(['high', 'medium', 'low']),
  description: z.string().min(2, '故障描述至少2个字符'),
  repairId: z.string().min(1, 'Repair ID is required'), // 新增必需字段
  customerId: z.string().min(1, 'Customer ID is required') // 新增必需字段
});

export type ReportFormData = z.infer<typeof reportSchema> & {
  community: string;
  address: string;
  customerId?: string;
  repairId?: string;
};

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): {hasError: boolean, error: Error} {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Report组件捕获到错误:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-bold text-red-600 mb-2">发生错误</h2>
          <p className="text-red-500 mb-4">{this.state.error?.message || '未知错误导致页面无法加载'}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })} 
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            尝试恢复
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function Report() {
  console.log('Report组件开始渲染');
  // 检查导入的组件是否存在
  console.log('导入的组件:', { ProgressBar, BasicInfoStep, LocationStep, IssueDetailStep });
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<ReportFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleNext = (data: Partial<ReportFormData>) => {
    setFormData({ ...formData, ...data });
    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  // 生成工单ID: YYYYMMDD-TYPE-XXX
  const generateRepairId = (date: Date, type: string) => {
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const typeAbbr = REPAIR_TYPE_MAP[type] || 'OT'; // OT for Other
    
    // 这里简化处理，实际应从服务器获取序列
    const seq = '001';
    return `${dateStr}-${typeAbbr}-${seq}`;
  };

  // 生成符合MongoDB ObjectId格式的ID (24位十六进制字符)
  const generateCustomerId = () => {
    const chars = '0123456789abcdef';
    let id = '';
    for (let i = 0; i < 24; i++) {
      id += chars[Math.floor(Math.random() * 16)];
    }
    return id;
  };
  
  // 修改保存逻辑
  const handleSubmit = async (data: Partial<ReportFormData>) => {
    setIsSubmitting(true);
    
    try {
      console.log('开始提交报修工单:', data);
      
      // 确保所有必要字段都存在
      const completeData = {
        ...formData,
        ...data,
        date: new Date(), // 确保有日期
        repairId: generateRepairId(new Date(), data.type || formData.type || ''),
        customerId: generateCustomerId()
      };
      
      // 验证数据
      // 前端已传递英文优先级，直接使用
const validatedData = reportSchema.parse(completeData);
      
      const response = await api.post('/api/processes', validatedData);
      
      if (!response.data.id) {
        console.error('工单保存失败: 服务器响应无效', response);
        throw new Error('未能获取工单ID');
      }
      
      console.log('工单保存成功:', response.data);
      toast.success('报修工单提交成功！');
      
      // 导航到成功页面
      navigate('/success', { state: { repairId: validatedData.repairId } });
      
      return true;
    } catch (error) {
      console.error('工单保存失败:', {
        error,
        requestData: data,
        timestamp: new Date().toISOString()
      });
      
      if (error instanceof z.ZodError) {
        // 处理表单验证错误
        const errors = error.errors.map(err => err.message).join(', ');
        toast.error(`表单验证失败: ${errors}`);
      } else {
        toast.error('提交失败，请重试');
      }
      
      return false;
    } finally {
      setIsSubmitting(false);
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
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}
