import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ProcessRepairData, PROCESSED_BY_NAME } from '@/pages/Process';
import ProgressBar from '@/components/report/ProgressBar';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  { id: 1, label: '处理记录' },
  { id: 2, label: '收费信息' }
];

const noteSchema = z.object({
  content: z.string().min(1, '处理记录内容不能为空'),
  media: z.array(z.object({
    url: z.string(),
    type: z.enum(['image', 'video']),
    description: z.string().optional()
  })).optional()
});

export default function EditProcess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [repair, setRepair] = useState<ProcessRepairData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [mediaFiles, setMediaFiles] = useState<Array<{
    url: string;
    type: 'image' | 'video';
    description: string;
  }>>([]);
  const [paymentData, setPaymentData] = useState({
    services: [],
    parts: [],
    paymentMethod: '现金'
  });
  const [services, setServices] = useState([]);
  const [parts, setParts] = useState([]);

  // 加载工单数据
  useEffect(() => {
    const loadRepair = () => {
      try {
        const savedRepairs = localStorage.getItem('repairs');
        const savedServices = localStorage.getItem('servicePrices');
        const savedParts = localStorage.getItem('spareParts');
        
        if (!savedRepairs) {
          throw new Error('未找到工单数据');
        }

        const repairs = JSON.parse(savedRepairs);
        
        if (savedServices) {
          setServices(JSON.parse(savedServices));
        }
        
        if (savedParts) {
          setParts(JSON.parse(savedParts));
        }

        const foundRepair = repairs.find((r: any) => r.id === id);
        
        if (!foundRepair) {
          throw new Error(`未找到ID为 ${id} 的工单`);
        }

        // 转换日期字段
        const processedRepair = {
          ...foundRepair,
          date: new Date(foundRepair.date),
          completedAt: foundRepair.completedAt ? new Date(foundRepair.completedAt) : null,
          notes: (foundRepair.notes || []).map((note: any) => ({
            ...note,
            date: note.date ? new Date(note.date) : new Date()
          })),
          // 初始化payment数据
          payment: foundRepair.payment || {
            services: [],
            parts: [],
            paymentMethod: '现金',
            totalAmount: 0,
            isPaid: false
          }
        };

        setRepair(processedRepair);
        setPaymentData({
          services: processedRepair.payment.services,
          parts: processedRepair.payment.parts,
          paymentMethod: processedRepair.payment.paymentMethod
        });
      } catch (error) {
        console.error('加载工单失败:', error);
        toast.error(`加载工单失败: ${error instanceof Error ? error.message : '未知错误'}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadRepair();
  }, [id]);

  // 处理步骤切换
  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 添加处理记录
  const handleAddNote = () => {
    try {
      const validatedData = noteSchema.parse({
        content: newNote,
        media: mediaFiles.length > 0 ? mediaFiles : undefined
      });

      if (!repair) return;

      const updatedRepairs = [...repair.notes, {
        content: validatedData.content,
        date: new Date(),
        processedBy: PROCESSED_BY_NAME,
        media: validatedData.media
      }];

      setRepair({
        ...repair,
        notes: updatedRepairs
      });
      
      setNewNote('');
      setMediaFiles([]);
      toast.success('处理记录已添加');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  // 保存工单
  const [selectedStatus, setSelectedStatus] = useState<'处理中' | '已完成'>('已完成');

  const handleSave = () => {
    try {
      if (!repair) {
        throw new Error('工单数据为空');
      }

      // 计算总金额
      const totalAmount = paymentData.services.reduce((sum, s) => sum + s.price, 0) +
                         paymentData.parts.reduce((sum, p) => sum + (p.price * p.quantity), 0);

      // 更新工单数据，直接设为已完成状态
      const updatedRepair = {
        ...repair,
        status: '已完成',
        processedBy: PROCESSED_BY_NAME,
        completedAt: new Date(),
        payment: {
          ...paymentData,
          totalAmount,
          isPaid: false
        }
      };

      // 更新备件库存
      try {
        const savedParts = localStorage.getItem('spareParts');
        const savedRecords = localStorage.getItem('stockRecords');
        
        if (savedParts && savedRecords) {
          const parts = JSON.parse(savedParts);
          const records = JSON.parse(savedRecords);
          
          // 更新使用的备件库存
          paymentData.parts.forEach(part => {
            const partIndex = parts.findIndex(p => 
              p.name === part.name && p.model === part.model
            );
            
            if (partIndex >= 0) {
              parts[partIndex].quantity -= part.quantity;
              
              // 添加出库记录
              records.push({
                id: Date.now().toString(),
                partId: parts[partIndex].id,
                type: 'out',
                quantity: part.quantity,
                price: part.price,
                date: new Date(),
                operator: PROCESSED_BY_NAME,
                repairId: id,
                paymentId: updatedRepair.payment?.id
              });
            }
          });
          
          localStorage.setItem('spareParts', JSON.stringify(parts));
          localStorage.setItem('stockRecords', JSON.stringify(records));
        }
      } catch (error) {
        console.error('更新备件库存失败:', error);
        toast.error('备件库存更新失败，请手动检查');
      }

      // 更新本地存储
      const savedRepairs = localStorage.getItem('repairs');
      if (!savedRepairs) {
        throw new Error('未找到工单数据');
      }

      const repairs = JSON.parse(savedRepairs);
      const updatedRepairs = repairs.map((r: any) => 
        r.id === id ? updatedRepair : r
      );

      // 更新客户档案中的工单状态
      const customersData = localStorage.getItem('customers');
      if (customersData) {
        const customers = JSON.parse(customersData);
        const customerIndex = customers.findIndex((c: any) => c.id === repair.customerId);
        
        if (customerIndex >= 0) {
          const customer = customers[customerIndex];
          const repairIndex = customer.repairs.findIndex((r: any) => r.id === id);
          
          if (repairIndex >= 0) {
            customer.repairs[repairIndex].status = '已完成';
            customer.repairs[repairIndex].updatedAt = new Date();
          } else {
            customer.repairs.push({
              id: id,
              type: repair.type,
              status: '已完成',
              date: repair.date,
              priority: repair.priority,
              updatedAt: new Date()
            });
          }
          
          localStorage.setItem('customers', JSON.stringify(customers));
        }
      }

      localStorage.setItem('repairs', JSON.stringify(updatedRepairs));
      toast.success('工单更新成功');
      navigate('/process');
    } catch (error) {
      console.error('保存工单失败:', error);
      toast.error(`保存工单失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    if (!repair) return null;

    switch (currentStep) {
      case 1: // 处理记录步骤
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-6">处理记录</h2>
            <div className="space-y-6">
              {/* 添加处理记录表单 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">添加处理记录</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">处理内容</label>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="详细描述处理过程和结果..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">上传照片或视频</label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <i className="fa-solid fa-cloud-arrow-up text-3xl text-blue-400 mb-3"></i>
                          <p className="mb-2 text-sm text-gray-600">
                            <span className="font-semibold">点击上传</span> 或拖放文件到此处
                          </p>
                          <p className="text-xs text-gray-500">支持 JPG, PNG, MP4 (最大10MB)</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const files = Array.from(e.target.files);
                              const newMedia = files.map(file => ({
                                url: URL.createObjectURL(file),
                                type: file.type.startsWith('video') ? 'video' : 'image',
                                description: '',
                                file
                              }));
                              setMediaFiles([...mediaFiles, ...newMedia]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                    
                    {mediaFiles.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        {mediaFiles.map((file, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative group aspect-square"
                          >
                            {file.type === 'image' ? (
                              <img 
                                src={file.url} 
                                alt="处理记录图片"
                                className="w-full h-full object-cover rounded-lg border border-gray-200 shadow-sm"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                <i className="fa-solid fa-video text-2xl text-gray-500"></i>
                              </div>
                            )}
                            <button
                              onClick={() => {
                                setMediaFiles(mediaFiles.filter((_, i) => i !== index));
                                URL.revokeObjectURL(file.url);
                              }}
                              className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-500 p-1.5 rounded-full shadow-md transition-all"
                            >
                              <i className="fa-solid fa-xmark text-sm"></i>
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className={`px-5 py-2.5 rounded-lg flex items-center ${newNote.trim() ? 
                        'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg' : 
                        'bg-gray-200 text-gray-500 cursor-not-allowed'} transition-all`}
                    >
                      <i className="fa-solid fa-plus mr-2"></i>
                      添加处理记录
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 历史处理记录 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">历史处理记录</h3>
                <div className="max-h-96 overflow-y-auto">
                  {repair.notes.length > 0 ? (
                    <div className="space-y-4">
                      {[...repair.notes]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((note, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                          >
                            <div className="flex justify-between items-start">
                              <div className="font-medium text-gray-800">{note.processedBy || '系统'}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(note.date).toLocaleString()}
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-700">{note.content}</div>
                            {note.media && note.media.length > 0 && (
                              <div className="mt-3 grid grid-cols-3 gap-2">
                                {note.media.map((item, i) => (
                                  <div key={i} className="relative aspect-square group">
                                    {item.type === 'image' ? (
                                      <img 
                                        src={item.url} 
                                        alt="处理记录图片"
                                        className="w-full h-full object-cover rounded-lg border border-gray-200"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                        <i className="fa-solid fa-video text-xl text-gray-500"></i>
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <button 
                                        onClick={() => window.open(item.url, '_blank')}
                                        className="bg-white/80 text-gray-800 p-2 rounded-full hover:bg-white transition-all"
                                      >
                                        <i className="fa-solid fa-expand"></i>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                      <i className="fa-solid fa-note-sticky text-3xl text-gray-300 mb-3"></i>
                      <p className="text-sm text-gray-500">暂无处理记录</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 2: // 收费信息步骤
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-6">收费明细</h2>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 服务项目 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">服务项目</h3>
                  <div className="space-y-4">
                    <div className="flex">
                      <select
                        className="flex-1 p-2 border rounded-l-md"
                        id="service-select"
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
                          const select = document.getElementById('service-select') as HTMLSelectElement;
                          const selectedOption = select.options[select.selectedIndex];
                          if (selectedOption.value) {
                            const selected = services.find(s => s.id === selectedOption.value);
                            if (selected) {
                              setPaymentData({
                                ...paymentData,
                                services: [...paymentData.services, {
                                  name: selected.name,
                                  price: selected.price
                                }]
                              });
                              toast.success(`已添加服务: ${selected.name}`);
                              select.selectedIndex = 0;
                            }
                          }
                        }}
                      >
                        <i className="fa-solid fa-plus"></i>
                      </button>
                    </div>
                    
                    {paymentData.services.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">服务名称</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">价格</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {paymentData.services.map((service, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{service.name}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">¥{service.price.toFixed(2)}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                  <button 
                                    onClick={() => {
                                      setPaymentData({
                                        ...paymentData,
                                        services: paymentData.services.filter((_, i) => i !== index)
                                      });
                                      toast.success('已移除服务项目');
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <i className="fa-solid fa-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* 备件使用 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">备件使用</h3>
                  <div className="space-y-4">
                    <div className="flex">
                      <select
                        className="flex-1 p-2 border rounded-l-md"
                        id="part-select"
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
                          const select = document.getElementById('part-select') as HTMLSelectElement;
                          const selectedOption = select.options[select.selectedIndex];
                          if (selectedOption.value) {
                            const selected = parts.find(p => p.id === selectedOption.value);
                            if (selected) {
                              setPaymentData({
                                ...paymentData,
                                parts: [...paymentData.parts, {
                                  name: selected.name,
                                  model: selected.model,
                                  quantity: 1,
                                  price: selected.price
                                }]
                              });
                              toast.success(`已添加备件: ${selected.name}`);
                              select.selectedIndex = 0;
                            }
                          }
                        }}
                      >
                        <i className="fa-solid fa-plus"></i>
                      </button>
                    </div>
                    
                    {paymentData.parts.length > 0 && (
                      <div className="border rounded-lg overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">备件名称</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">型号</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">数量</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">单价</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">小计</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">操作</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {paymentData.parts.map((part, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{part.name}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{part.model}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                  <input
                                    type="number"
                                    min="1"
                                    value={part.quantity}
                                    onChange={(e) => {
                                      const newParts = [...paymentData.parts];
                                      newParts[index].quantity = Number(e.target.value);
                                      setPaymentData({
                                        ...paymentData,
                                        parts: newParts
                                      });
                                    }}
                                    className="w-16 p-1 border rounded text-sm"
                                  />
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">¥{part.price.toFixed(2)}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">¥{(part.price * part.quantity).toFixed(2)}</td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <button 
                                    onClick={() => {
                                      toast.custom((t) => (
                                        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                                          <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                              <i className="fa-solid fa-triangle-exclamation text-yellow-500 text-xl"></i>
                                            </div>
                                            <div className="ml-3">
                                              <h3 className="text-sm font-medium text-gray-900">确认删除</h3>
                                              <p className="mt-1 text-sm text-gray-500">确定要删除备件 {part.name} ({part.model}) 吗？</p>
                                              <div className="mt-4 flex justify-end space-x-3">
                                                <button
                                                  onClick={() => toast.dismiss(t)}
                                                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                                                >
                                                  取消
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setPaymentData({
                                                      ...paymentData,
                                                      parts: paymentData.parts.filter((_, i) => i !== index)
                                                    });
                                                    toast.success(`已删除备件 ${part.name}`);
                                                    toast.dismiss(t);
                                                  }}
                                                  className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                                                >
                                                  确认删除
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ));
                                    }}
                                    className="text-red-500 hover:text-red-700 flex items-center justify-center w-full px-2 py-1 rounded"
                                  >
                                    <i className="fa-solid fa-trash mr-1"></i>
                                    删除
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 支付信息 */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">支付方式</label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      paymentMethod: e.target.value
                    })}
                    className="w-full p-2 border rounded-md"
                  >
                   <option value="现金">现金</option>
                   <option value="微信支付">微信支付</option>
                   <option value="支付宝支付">支付宝支付</option>
                   <option value="内部结算">内部结算</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">总金额</label>
                  <div className="bg-gray-100 p-3 rounded-md font-bold text-lg">
                    ¥{(
                      paymentData.services.reduce((sum, s) => sum + s.price, 0) +
                      paymentData.parts.reduce((sum, p) => sum + (p.price * p.quantity), 0)
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6">
          <div className="text-center py-8">
            <i className="fa-solid fa-spinner fa-spin text-3xl text-blue-400 mb-3"></i>
            <p className="mt-2 text-gray-500">正在加载工单数据...</p>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (!repair) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6">
          <div className="text-center py-8">
            <i className="fa-solid fa-exclamation-circle text-3xl text-red-400 mb-3"></i>
            <h3 className="text-lg font-medium text-gray-700">加载工单失败</h3>
            <p className="text-gray-500 mt-2">无法加载指定的工单数据</p>
            <button
              onClick={() => navigate('/process')}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg transition-colors"
            >
              返回工单列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 主界面
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
        {/* 头部 */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <i className="fa-solid fa-file-pen text-blue-500 mr-3"></i>
              编辑工单 #{id}
            </h1>
            <button 
              onClick={() => navigate('/process')}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>

          {/* 进度条 */}
          <div className="mt-6 px-6">
            <ProgressBar currentStep={currentStep} steps={steps} />
          </div>
        </div>

        {/* 步骤内容 */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>

        {/* 操作按钮 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            {currentStep > 1 && (
              <button
                onClick={handlePrevStep}
                className="flex items-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                上一步
              </button>
            )}
            <div className="ml-auto flex space-x-4">
                   {currentStep < steps.length ? (
                     <button
                       onClick={handleNextStep}
                       className="flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                     >
                       下一步
                       <i className="fa-solid fa-arrow-right ml-2"></i>
                     </button>
                   ) : (
              <button
                onClick={handleSave}
                className="flex items-center px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                <i className="fa-solid fa-check mr-2"></i>
                标记为已完成
              </button>
                   )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}