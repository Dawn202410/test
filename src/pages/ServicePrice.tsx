import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { AreaChart, BarChart, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, Bar, Line } from 'recharts';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate } from 'react-router-dom';

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  duration: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PriceHistory {
  id: string;
  serviceId: string;
  oldPrice: number;
  newPrice: number;
  changedAt: Date;
  operator: string;
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="bg-red-50 p-4 rounded-lg">
      <h3 className="text-red-600 font-medium">加载服务数据时出错</h3>
      <pre className="text-red-500 text-sm mt-2">{error.message}</pre>
      <button 
        onClick={resetErrorBoundary}
        className="mt-2 bg-red-100 text-red-700 px-3 py-1 rounded text-sm"
      >
        重试
      </button>
    </div>
  );
}

export default function ServicePrice() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [priceHistories, setPriceHistories] = useState<PriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentService, setCurrentService] = useState<ServiceItem | null>(null);
  const [formData, setFormData] = useState<Omit<ServiceItem, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    category: '维修服务',
    price: 0,
    description: '',
    duration: '1小时'
  });

  const navigate = useNavigate();

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) {
        toast.error('请选择要导入的文件');
        return;
      }

      // 验证文件类型
      if (!['.xlsx', '.xls'].some(ext => file.name.endsWith(ext))) {
        toast.error('仅支持.xlsx和.xls格式的文件');
        return;
      }

      // 检查文件大小(最大5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('文件大小不能超过5MB');
        return;
      }

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // 检查是否有工作表
      if (workbook.SheetNames.length === 0) {
        toast.error('Excel文件中没有工作表');
        return;
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Partial<ServiceItem>>(worksheet);

      if (jsonData.length === 0) {
        toast.error('Excel文件中没有有效数据');
        return;
      }

      // 验证Excel数据
      const validatedServices = jsonData
        .map((item, index) => {
          // 收集错误信息
          const errors: string[] = [];
          
          // 验证必填字段 - 名称
          const name = item.name?.toString()?.trim();
          if (!name || name.length === 0) {
            errors.push('服务名称不能为空');
          }
          
          // 验证必填字段 - 价格
          const price = Number(item.price);
          if (isNaN(price) || price <= 0) {
            errors.push('价格必须是大于0的数字');
          }
          
          // 验证可选字段 - 分类
          const category = item.category?.toString()?.trim() || '维修服务';
          
          // 如果有错误，显示详细提示
          if (errors.length > 0) {
            const rowNumber = index + 2; // Excel行号从1开始，标题行占1行
            const errorDetails = errors.map(err => {
              if (err.includes('名称')) return `服务名称: ${name || '空'}`;
              if (err.includes('价格')) return `价格: ${item.price || '空'}`;
              return err;
            }).join('；');

            toast.error(`Excel导入错误 - 第${rowNumber}行`, {
              description: `问题: ${errorDetails}\n请检查该行数据或下载模板参考格式`,
              duration: 10000,
              action: {
                label: '下载模板',
                onClick: () => document.querySelector('.download-template-btn')?.click()
              }
            });
            return null;
          }
          
          return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: String(item.name).trim(),
            category: item.category && typeof item.category === 'string' ? item.category.trim() : '维修服务',
            price: Number(item.price),
            description: item.description && typeof item.description === 'string' ? item.description.trim() : '',
            duration: item.duration && typeof item.duration === 'string' ? item.duration.trim() : '1小时',
            createdAt: new Date(),
            updatedAt: new Date()
          };
        })
        .filter(item => item !== null) as ServiceItem[];

      if (validatedServices.length === 0) {
        toast.error('没有有效的服务数据可以导入，请检查Excel文件格式');
        return;
      }

      setServices(validatedServices);
      localStorage.setItem('servicePrices', JSON.stringify(validatedServices));
      toast.success(`成功导入 ${validatedServices.length} 条服务数据`, {
        action: {
          label: '查看',
          onClick: () => {
            // 滚动到表格顶部
            document.querySelector('.overflow-x-auto')?.scrollIntoView({ behavior: 'smooth' });
          }
        },
        duration: 5000
      });
    } catch (error) {
      console.error('导入Excel失败:', error);
      toast.error(`导入失败: ${error instanceof Error ? error.message : '文件格式错误或损坏'}`, {
        duration: 5000,
        action: {
          label: '重试',
          onClick: () => document.getElementById('excel-upload')?.click()
        }
      });
    } finally {
      e.target.value = ''; // 重置文件输入
    }
  };

  useEffect(() => {
    const loadData = () => {
      try {
        const savedServices = localStorage.getItem('servicePrices');
        const savedHistories = localStorage.getItem('priceHistories');
        
        if (savedServices) {
          setServices(JSON.parse(savedServices));
        } else {
          // 初始化示例数据
          const exampleServices = [
            {
              id: '1',
              name: '基础维修',
              category: '维修服务',
              price: 80,
              description: '包含1小时基础维修服务',
              duration: '1小时',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: '2',
              name: '电路维修',
              category: '维修服务',
              price: 120,
              description: '电路检测与维修',
              duration: '1-2小时',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ];
          setServices(exampleServices);
          localStorage.setItem('servicePrices', JSON.stringify(exampleServices));
        }

        if (savedHistories) {
          setPriceHistories(JSON.parse(savedHistories));
        }
      } catch (error) {
        console.error('加载服务数据失败:', error);
        toast.error('加载服务数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddService = () => {
    try {
      const newService = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const updatedServices = [...services, newService];
      setServices(updatedServices);
      localStorage.setItem('servicePrices', JSON.stringify(updatedServices));
      
      setShowAddForm(false);
      setFormData({
        name: '',
        category: '维修服务',
        price: 0,
        description: '',
        duration: '1小时'
      });
      toast.success('服务项目添加成功');
    } catch (error) {
      toast.error('添加服务项目失败');
    }
  };

  const handleUpdatePrice = (id: string, newPrice: number) => {
    try {
      const service = services.find(s => s.id === id);
      if (!service) return;
      
      // 记录价格变更历史
      const newHistory = {
        id: Date.now().toString(),
        serviceId: id,
        oldPrice: service.price,
        newPrice,
        changedAt: new Date(),
        operator: 'Dawn'
      };

      // 更新服务价格
      const updatedServices = services.map(s => 
        s.id === id ? { ...s, price: newPrice, updatedAt: new Date() } : s
      );

      // 更新历史记录
      const updatedHistories = [...priceHistories, newHistory];

      setServices(updatedServices);
      setPriceHistories(updatedHistories);
      localStorage.setItem('servicePrices', JSON.stringify(updatedServices));
      localStorage.setItem('priceHistories', JSON.stringify(updatedHistories));
      
      toast.success('价格更新成功');
    } catch (error) {
      toast.error('价格更新失败');
    }
  };

  const handleDeleteService = (id: string) => {
    if (confirm('确定要删除这个服务项目吗？')) {
      const updatedServices = services.filter(service => service.id !== id);
      setServices(updatedServices);
      localStorage.setItem('servicePrices', JSON.stringify(updatedServices));
      toast.success('服务项目删除成功');
    }
  };

  // 分类改为自定义输入，不再使用预设分类

  const handleDownloadTemplate = async (e: React.MouseEvent) => {
    e.preventDefault();
    const toastId = toast.loading('正在生成模板文件...');
    
    try {
      // 创建工作簿
      const workbook = XLSX.utils.book_new();
      
      // 创建数据表
      const data = [
        ['*名称', '*分类', '*价格', '说明', '时长', '单位'],
        ['屋面防水层损坏（小面积）', '防水维修', 445, '每处维修面积 5 ㎡（不足 5 ㎡按 5 ㎡计）', '2小时', '次'],
        ['电路检修', '电气维修', 120, '基础电路检测与维修', '1小时', '小时'],
        ['', '', '', '', '', ''],
        ['导入说明：', '', '', '', '', ''],
        ['1. 带*号为必填字段', '', '', '', '', ''],
        ['2. 价格必须是大于0的数字', '', '', '', '', ''],
        ['3. 说明、时长和单位是可选字段', '', '', '', '', ''],
        ['4. 请勿修改标题行', '', '', '', '', ''],
        ['5. 删除示例数据后填写您的数据', '', '', '', '', '']
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      
      // 设置列宽
      worksheet['!cols'] = [
        { wch: 20 }, // 名称
        { wch: 15 }, // 分类
        { wch: 10 }, // 价格
        { wch: 30 }, // 说明
        { wch: 10 }, // 时长
        { wch: 10 }  // 单位
      ];
      
      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, "服务模板");
      
      // 生成文件名带日期
      const today = new Date();
      const dateStr = `${today.getFullYear()}${(today.getMonth()+1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
      const fileName = `服务标准模板_${dateStr}.xlsx`;
      
      // 直接使用XLSX.writeFile导出
      XLSX.writeFile(workbook, fileName);
      
      toast.success('模板下载已完成', { 
        id: toastId,
        description: `文件"${fileName}"已保存到您的默认下载目录`,
        duration: 5000
      });
      
    } catch (error) {
      console.error('模板保存失败:', error);
      toast.error(`模板保存失败: ${error instanceof Error ? error.message : '未知错误'}`, { 
        id: toastId,
        description: '请检查浏览器设置或尝试使用其他浏览器',
        action: {
          label: '重试',
          onClick: () => handleDownloadTemplate(e)
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">服务收费标准</h1>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-[#4A90E2] hover:text-blue-600 transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>
            返回首页
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">服务项目列表</h2>
            <div className="flex space-x-2">
               <button
                 onClick={() => {
                   setShowAddForm(true);
                   setCurrentService(null);
                 }}
                 className="bg-[#4A90E2] text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
               >
                 <i className="fa-solid fa-plus mr-2"></i>
                 添加服务
               </button>
                 <div className="flex flex-wrap gap-2">
                   <button
                     onClick={handleDownloadTemplate}
                     className="download-template-btn bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center"
                   >
                     <i className="fa-solid fa-file-download mr-2"></i>
                     保存模板
                   </button>
                   <button
                     onClick={() => document.getElementById('excel-upload').click()}
                     className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center"
                   >
                     <i className="fa-solid fa-file-import mr-2"></i>
                     导入Excel
                   </button>
                   <input
                     id="excel-upload"
                     type="file"
                     accept=".xlsx,.xls"
                     className="hidden"
                     onChange={(e) => handleExcelImport(e)}
                   />
                 </div>
                 <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                   <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                     <i className="fa-solid fa-circle-info mr-2"></i>
                     导入说明
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
                     <div>
                       <h4 className="font-medium mb-1">必填字段</h4>
                       <ul className="list-disc pl-5 space-y-1">
                         <li>名称 - 文本格式</li>
                         <li>分类 - 文本格式</li>
                         <li>价格 - 数字格式</li>
                       </ul>
                     </div>
                     <div>
                       <h4 className="font-medium mb-1">可选字段</h4>
                       <ul className="list-disc pl-5 space-y-1">
                         <li>说明 - 文本格式</li>
                         <li>时长 - 文本格式</li>
                         <li>单位 - 文本格式</li>
                       </ul>
                     </div>
                     <div>
                       <h4 className="font-medium mb-1">文件要求</h4>
                       <ul className="list-disc pl-5 space-y-1">
                         <li>.xlsx或.xls格式</li>
                         <li>文件≤5MB</li>
                         <li>保留标题行</li>
                       </ul>
                     </div>
                   </div>
                 </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <i className="fa-solid fa-spinner fa-spin text-2xl text-gray-400"></i>
              <p className="mt-2 text-gray-500">正在加载服务数据...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-8">
              <i className="fa-solid fa-tags text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-700">暂无服务项目</h3>
              <p className="text-gray-500 mt-2">点击上方按钮添加服务项目</p>
            </div>
           ) : (
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              onReset={() => window.location.reload()}
            >
              <div className="mt-4 overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-gray-50">
                     <tr>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">名称</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">分类</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">价格</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">说明</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">操作</th>
                     </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-200">
                     {services.map((service) => (
                       <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                         <td className="px-6 py-4 text-sm font-medium text-gray-900">
                           <div className="font-medium">{service.name}</div>
                         </td>
                         <td className="px-6 py-4 text-sm text-gray-500">
                           <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                             {service.category}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                           ¥{service.price.toFixed(2)}
                         </td>
                         <td className="px-6 py-4 text-sm text-gray-500">
                           {service.description && (
                             <div className="line-clamp-2" title={service.description}>
                               {service.description}
                             </div>
                           )}
                         </td>
                         <td className="px-6 py-4 text-sm text-gray-500">
                           <div className="flex space-x-3">
                             <button
                               onClick={() => {
                                 setCurrentService(service);
                                 setShowHistory(true);
                               }}
                               className="text-blue-500 hover:text-blue-700 flex items-center"
                               title="查看价格历史"
                             >
                               <i className="fa-solid fa-history"></i>
                             </button>
                             <button
                               onClick={() => handleDeleteService(service.id)}
                               className="text-red-500 hover:text-red-700 flex items-center"
                               title="删除服务"
                             >
                               <i className="fa-solid fa-trash"></i>
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
            </ErrorBoundary>

          )}
        </div>

        {/* 添加服务表单 */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">添加新服务</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">服务名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="输入服务名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="输入分类名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full p-2 border rounded-md"
                  placeholder="输入价格"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">单位</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="例如: 次、小时"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">服务说明</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="输入服务详细说明"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddService}
                className="bg-[#4A90E2] text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                确认添加
              </button>
            </div>
          </div>
        )}

        {/* 价格历史记录 */}
        {showHistory && currentService && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              价格历史 - {currentService.name}
            </h2>
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">当前价格: ¥{currentService.price.toFixed(2)}</span>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={currentService.price}
                    onBlur={(e) => handleUpdatePrice(currentService.id, Number(e.target.value))}
                    className="w-24 p-2 border rounded-md mr-2"
                  />
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">旧价格</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">新价格</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作人</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {priceHistories
                    .filter(history => history.serviceId === currentService.id)
                    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
                    .map((history) => (
                      <tr key={history.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(history.changedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ¥{history.oldPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ¥{history.newPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {history.operator}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );

}