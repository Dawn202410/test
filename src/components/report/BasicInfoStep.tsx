import { useState, useEffect } from 'react';
import { z } from 'zod';
import { ReportFormData } from '@/pages/Report';

const basicInfoSchema = z.object({
  date: z.date(),
  name: z.string().min(0).optional(), // 完全可选
  unit: z.string().min(2, '单位名称至少2个字符'),
  phone: z.string().min(0).optional() // 完全可选
});

interface BasicInfoStepProps {
  onNext: (data: Partial<ReportFormData>) => void;
  initialData: Partial<ReportFormData>;
}

export default function BasicInfoStep({ onNext, initialData }: BasicInfoStepProps) {
  const [formData, setFormData] = useState({
    date: initialData.date || new Date(),
    name: initialData.name || '',
    unit: initialData.unit || '',
    phone: initialData.phone || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unitSuggestions, setUnitSuggestions] = useState<string[]>([]);
  const [showUnitSuggestions, setShowUnitSuggestions] = useState(false);

  useEffect(() => {
    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      const customers = JSON.parse(savedCustomers);
      const units = Array.from(new Set(customers.map((c: any) => c.unit).filter(Boolean)));
      setUnitSuggestions(units);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'unit') {
      setShowUnitSuggestions(true);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, date: new Date(e.target.value) });
  };

  const handleUnitSelect = (unit: string) => {
    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      const customers = JSON.parse(savedCustomers);
      const customer = customers.find((c: any) => c.unit === unit);
      if (customer) {
        setFormData({
          ...formData,
          unit: customer.unit || '',
          name: customer.name || '',
          phone: customer.phone || ''
        });
      }
    }
    setShowUnitSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedData = basicInfoSchema.parse(formData);
      onNext(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">基本信息</h2>
      
      <div className="space-y-5">
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">报修日期</label>
          <input
            type="date"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={formData.date.toISOString().split('T')[0]}
            onChange={handleDateChange}
          />
        </div>

        <div className="form-group relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">报修单位</label>
          <div className="relative">
            <input
              type="text"
              name="unit"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="请输入报修单位名称"
              value={formData.unit}
              onChange={handleChange}
              onFocus={() => setShowUnitSuggestions(true)}
              onBlur={() => setTimeout(() => setShowUnitSuggestions(false), 200)}
            />
            <i className="fa-solid fa-building absolute right-3 top-3.5 text-gray-400"></i>
          </div>
          {errors.unit && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <i className="fa-solid fa-circle-exclamation mr-1"></i>
              {errors.unit}
            </p>
          )}
          {showUnitSuggestions && unitSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg max-h-60 overflow-auto border border-gray-200 divide-y divide-gray-100">
              {unitSuggestions
                .filter(unit => unit?.toLowerCase().includes(formData.unit.toLowerCase()))
                .map((unit, index) => {
                  const savedCustomers = localStorage.getItem('customers');
                  const customers = savedCustomers ? JSON.parse(savedCustomers) : [];
                  const customer = customers.find(c => c.unit === unit);
                  return (
                    <div
                      key={index}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => handleUnitSelect(unit)}
                    >
                      <div className="font-medium text-gray-900">{unit}</div>
                      {customer?.name && (
                        <div className="text-sm text-gray-500 mt-1">
                          <i className="fa-solid fa-user mr-1"></i>
                          {customer.name}
                        </div>
                      )}
                      {customer?.phone && (
                        <div className="text-sm text-gray-500 mt-1">
                          <i className="fa-solid fa-phone mr-1"></i>
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">联系人（选填）</label>
          <input
            type="text"
            name="name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="可不填，留空不影响提交"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">联系电话（选填）</label>
          <input
            type="tel"
            name="phone"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="可不填，留空不影响提交"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-md transition-all flex items-center"
        >
          下一步
          <i className="fa-solid fa-arrow-right ml-2"></i>
        </button>
      </div>
    </form>
  );
}
