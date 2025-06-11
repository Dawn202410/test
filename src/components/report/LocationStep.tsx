import { useState, useEffect } from 'react';
import { z } from 'zod';
import { ReportFormData } from '@/pages/Report';
import { toast } from 'sonner';

const locationSchema = z.object({
  area: z.string().min(1, '请选择区域'),
  community: z.string().min(1, '请输入小区名称'),
  address: z.string().min(5, '详细地址格式应为楼号-单元号-门牌号')
});

const areas = [
  '河东区',
  '河西区',
  '南开区',
  '河北区',
  '和平区',
  '红桥区',
  '东丽区',
  '西青区',
  '津南区',
  '北辰区',
  '武清区',
  '宝坻区',
  '滨海新区',
  '宁河区',
  '静海区'
];

interface LocationStepProps {
  onNext: (data: Partial<ReportFormData>) => void;
  onPrev: () => void;
  initialData: Partial<ReportFormData>;
}

interface RepairHistory {
  id: string;
  date: string;
  type: string;
  status: string;
  description: string;
}

export default function LocationStep({ onNext, onPrev, initialData }: LocationStepProps) {
  const [formData, setFormData] = useState({
    area: initialData.area || '',
    community: initialData.community || '',
    address: initialData.address || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [communitySuggestions, setCommunitySuggestions] = useState<string[]>([]);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showCommunitySuggestions, setShowCommunitySuggestions] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [repairHistory, setRepairHistory] = useState<RepairHistory[]>([]);
  const [showHistoryAlert, setShowHistoryAlert] = useState(false);

  useEffect(() => {
    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      const customers = JSON.parse(savedCustomers);
      const communities = Array.from(new Set(customers.map((c: any) => c.community).filter(Boolean)));
      setCommunitySuggestions(communities);
    }
  }, []);

  useEffect(() => {
    if (formData.community) {
      const savedCustomers = localStorage.getItem('customers');
      if (savedCustomers) {
        const customers = JSON.parse(savedCustomers);
        const addresses = Array.from(
          new Set(
            customers
              .filter((c: any) => c.community === formData.community)
              .map((c: any) => c.address)
              .filter(Boolean)
          )
        );
        setAddressSuggestions(addresses);
      }
    }
  }, [formData.community]);

  const checkRepairHistory = (community: string, address: string) => {
    const savedRepairs = localStorage.getItem('repairs');
    if (!savedRepairs) return;

    const repairs = JSON.parse(savedRepairs);
    const matchedRepairs = repairs.filter((repair: any) => 
      repair.community === community && 
      repair.address === address
    ).map((repair: any) => ({
      id: repair.id,
      date: new Date(repair.date).toLocaleDateString(),
      type: repair.type,
      status: repair.status,
      description: repair.description
    }));

    if (matchedRepairs.length > 0) {
      setRepairHistory(matchedRepairs);
      setShowHistoryAlert(true);
    } else {
      setRepairHistory([]);
      setShowHistoryAlert(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      // 当区域或小区改变时，重置下级选项
      if (name === 'area') {
        return { ...prev, area: value, community: '', address: '' };
      }
      if (name === 'community') {
        return { ...prev, community: value, address: '' };
      }
      return { ...prev, [name]: value };
    });

    if (name === 'community') {
      setShowCommunitySuggestions(true);
    }
    if (name === 'address') {
      setShowAddressSuggestions(true);
    }
  };

  const handleCommunitySelect = (community: string) => {
    setFormData({ ...formData, community, address: '' });
    setShowCommunitySuggestions(false);
  };

  const handleAddressSelect = (address: string) => {
    setFormData({ ...formData, address });
    setShowAddressSuggestions(false);
    checkRepairHistory(formData.community, address);
  };

  const handleAddressBlur = () => {
    setTimeout(() => {
      setShowAddressSuggestions(false);
      if (formData.community && formData.address) {
        checkRepairHistory(formData.community, formData.address);
      }
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedData = locationSchema.parse(formData);
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">位置信息</h2>
      
      {showHistoryAlert && repairHistory.length > 0 && (
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-blue-800 flex items-center">
                <i className="fa-solid fa-circle-info mr-2"></i>
                该地址已有 {repairHistory.length} 条历史报修记录
              </p>
              <ul className="mt-2 space-y-2 text-sm text-blue-700">
                {repairHistory.slice(0, 3).map(repair => (
                  <li key={repair.id} className="flex items-start">
                    <i className="fa-solid fa-clock-rotate-left text-xs mt-1 mr-2"></i>
                    <div>
                      <span className="font-medium">{repair.date}</span> - {repair.type} 
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        repair.status === '已完成' ? 'bg-green-100 text-green-800' :
                        repair.status === '处理中' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {repair.status}
                      </span>
                    </div>
                  </li>
                ))}
                {repairHistory.length > 3 && (
                  <li className="text-blue-600">...还有 {repairHistory.length - 3} 条记录</li>
                )}
              </ul>
            </div>
            <button 
              onClick={() => setShowHistoryAlert(false)}
              className="text-blue-500 hover:text-blue-700 p-1"
            >
              <i className="fa-solid fa-times text-lg"></i>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">区域</label>
          <div className="relative">
            <select
              name="area"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
              value={formData.area}
              onChange={handleChange}
            >
              <option value="">请选择区域</option>
              {areas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-3 top-3.5 text-gray-400 pointer-events-none"></i>
          </div>
          {errors.area && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <i className="fa-solid fa-circle-exclamation mr-1"></i>
              {errors.area}
            </p>
          )}
        </div>

        <div className="form-group relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">小区</label>
          <div className="relative">
            <input
              type="text"
              name="community"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="请输入小区名称"
              value={formData.community}
              onChange={handleChange}
              onFocus={() => setShowCommunitySuggestions(true)}
              onBlur={() => setTimeout(() => setShowCommunitySuggestions(false), 200)}
            />
            <i className="fa-solid fa-location-dot absolute right-3 top-3.5 text-gray-400"></i>
          </div>
          {errors.community && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <i className="fa-solid fa-circle-exclamation mr-1"></i>
              {errors.community}
            </p>
          )}
          {showCommunitySuggestions && communitySuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg max-h-60 overflow-auto border border-gray-200 divide-y divide-gray-100">
              {communitySuggestions
                .filter(community => community?.toLowerCase().includes(formData.community.toLowerCase()))
                .map((community, index) => {
                  const savedCustomers = localStorage.getItem('customers');
                  const customers = savedCustomers ? JSON.parse(savedCustomers) : [];
                  const customer = customers.find(c => c.community === community);
                  return (
                    <div
                      key={index}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => handleCommunitySelect(community)}
                    >
                      <div className="font-medium text-gray-900">{community}</div>
                      {customer?.address && (
                        <div className="text-sm text-gray-500 mt-1">
                          <i className="fa-solid fa-map-marker-alt mr-1"></i>
                          {customer.address}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="form-group relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">详细地址</label>
          <div className="relative">
            <input
              type="text"
              name="address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="例如：5-3-502 (楼号-单元号-门牌号)"
              value={formData.address}
              onChange={handleChange}
              onFocus={() => setShowAddressSuggestions(true)}
              onBlur={handleAddressBlur}
            />
            <i className="fa-solid fa-house-chimney absolute right-3 top-3.5 text-gray-400"></i>
          </div>
          {errors.address && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <i className="fa-solid fa-circle-exclamation mr-1"></i>
              {errors.address}
            </p>
          )}
          {showAddressSuggestions && addressSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg max-h-60 overflow-auto border border-gray-200 divide-y divide-gray-100">
              {addressSuggestions
                .filter(address => address?.toLowerCase()?.includes(formData.address.toLowerCase() ?? ''))
                .map((address, index) => {
                  const savedCustomers = localStorage.getItem('customers');
                  const customers = savedCustomers ? JSON.parse(savedCustomers) : [];
                  const customer = customers.find(c => c.address === address);
                  return (
                    <div
                      key={index}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => handleAddressSelect(address)}
                    >
                      <div className="font-medium text-gray-900">{address}</div>
                      {customer?.community && (
                        <div className="text-sm text-gray-500 mt-1">
                          <i className="fa-solid fa-location-dot mr-1"></i>
                          {customer.community}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
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
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-md transition-all flex items-center"
        >
          下一步
          <i className="fa-solid fa-arrow-right ml-2"></i>
        </button>
      </div>
    </form>
  );
}