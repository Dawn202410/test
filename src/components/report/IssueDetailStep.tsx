import React from 'react';
import { useState, ChangeEvent } from 'react';
import { z } from 'zod';
import type { ReportFormData } from '@/pages/Report';
import { toast } from 'sonner';

import { useNavigate } from 'react-router-dom';




const issueDetailSchema = z.object({
  type: z.string().min(1, '请选择故障类型'),
  priority: z.enum(['high', 'medium', 'low']),
  description: z.string().min(1, '请输入故障描述')
});

interface IssueFormData extends Partial<ReportFormData> {
  type?: string;
  priority?: 'high' | 'medium' | 'low';
  description?: string;
  images?: string[];
}

interface IssueDetailStepProps {
  onSubmit: (data: Partial<ReportFormData>) => void;
  onPrev: () => void;
  initialData: IssueFormData;
  isSubmitting?: boolean;
}

export default function IssueDetailStep({ onSubmit, onPrev, initialData }: IssueDetailStepProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<IssueFormData>({    type: initialData.type || '',    priority: initialData.priority || 'medium',    description: initialData.description || '',    images: initialData.images || []  });
  const [errors, setErrors] = useState<Record<string, string>>({});


  const faultTypes = [
    '楼宇对讲系统',
    '楼道照明系统',
    '监控安防系统',
    '道闸系统'
  ];

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 重置错误状态
    setErrors({});

    // 基础验证
    if (!formData.type || !formData.description) {
      const newErrors: Record<string, string> = {};
      const missingFields = [];
      
      if (!formData.type) {
        missingFields.push('故障类型');
        newErrors['type'] = '请选择故障类型';
      }
      if (!formData.description) {
        missingFields.push('故障描述');
        newErrors['description'] = '请输入故障描述';
      }
      
      setErrors(newErrors);
      
      // 更明显的错误提示
      toast.error(`表单填写不完整`, {
        description: `请填写${missingFields.join('和')}`,
        position: 'top-center',
        duration: 5000,
        action: {
          label: '前往填写',
          onClick: () => {
            const firstErrorField = !formData.type ? 'type' : 'description';
            const element = document.querySelector(`[name="${firstErrorField}"]`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              (element as HTMLElement).focus();
            }
          }
        }
      });

      // 滚动到第一个错误字段
      const firstErrorField = Object.keys(newErrors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (element as HTMLElement).focus();
        }
      }
      return;
    }

    setIsSubmitting(true);
    
    try {
      const validatedData: Partial<ReportFormData> = issueDetailSchema.parse(formData);
      try {
        const result = await onSubmit(validatedData as Partial<ReportFormData>);
        if (typeof result === 'undefined') {
          throw new Error('提交失败，请重试');
        }
        toast.success('报修工单已成功保存', {
          position: 'top-center',
          duration: 3000
        });
        navigate('/');
        // 重置表单
        setFormData({
          type: '',
          priority: 'medium',
          description: ''
        });
        // 返回第一步
        onPrev();
      } catch (error) {
        console.error('保存工单失败:', error);
        toast.error(`保存工单失败: ${error instanceof Error ? error.message : '请重试'}`);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
        
        toast.error('表单验证失败', {
          description: '请检查并修正表单中的错误',
          position: 'top-center',
          duration: 5000,
          action: {
            label: '查看错误',
            onClick: () => {
              const firstErrorField = Object.keys(newErrors)[0];
              if (firstErrorField) {
                const element = document.querySelector(`[name="${firstErrorField}"]`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  (element as HTMLElement).focus();
                }
              }
            }
          }
        });

        // 滚动到第一个错误字段
        const firstErrorField = Object.keys(newErrors)[0];
        if (firstErrorField) {
          const element = document.querySelector(`[name="${firstErrorField}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            (element as HTMLElement).focus();
          }
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">故障详情</h2>
      
      <div className="space-y-5">
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">故障类型</label>
          <div className="relative">
            <select
              name="type"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
              value={formData.type}
              onChange={(e) => handleChange(e as unknown as ChangeEvent<HTMLInputElement>)}
            >
              <option value="">请选择故障类型</option>
              {faultTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-3 top-3.5 text-gray-400 pointer-events-none"></i>
          </div>
          {errors.type && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <i className="fa-solid fa-circle-exclamation mr-1"></i>
              {errors.type}
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">优先级</label>
          <div className="flex space-x-6">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="priority"
                value="high"
                checked={formData.priority === 'high'}
                onChange={handleChange}
                className="h-5 w-5 text-red-500 focus:ring-red-500 border-gray-300"
              />
              <span className="ml-2 text-red-600 font-medium">高</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="priority"
                value="medium"
                checked={formData.priority === 'medium'}
                onChange={handleChange}
                className="h-5 w-5 text-yellow-500 focus:ring-yellow-500 border-gray-300"
              />
              <span className="ml-2 text-yellow-600 font-medium">中</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="priority"
                value="low"
                checked={formData.priority === 'low'}
                onChange={handleChange}
                className="h-5 w-5 text-green-500 focus:ring-green-500 border-gray-300"
              />
              <span className="ml-2 text-green-600 font-medium">低</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">故障描述</label>
          <textarea
            name="description"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all h-40"
            placeholder="请详细描述故障情况（包括故障现象、发生时间等）"
            value={formData.description}
            onChange={handleChange}
          />
          {errors.description && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <i className="fa-solid fa-circle-exclamation mr-1"></i>
              {errors.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
        >
          <i className="fa-solid fa-arrow-left mr-2"></i>
          上一步
        </button>
        <button
          type="submit"
          disabled={!formData.type || !formData.description || isSubmitting}
          className={`px-6 py-3 rounded-lg transition-all flex items-center justify-center min-w-32 ${
            !formData.type || !formData.description
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : isSubmitting
                ? 'bg-blue-400 text-white'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-md'
          }`}
        >
          {isSubmitting ? (
            <>
              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              提交中...
            </>
          ) : !formData.type || !formData.description ? (
            <div className="flex items-center">
              <i className="fa-solid fa-circle-exclamation mr-2"></i>
              请填写完整
            </div>
          ) : (
            <>
              <i className="fa-solid fa-paper-plane mr-2"></i>
              提交报修
            </>
          )}
        </button>
      </div>
    </form>
  );
}
