import { useState, useEffect } from 'react';
import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Line 
} from 'recharts';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface SparePart {
  id: string;
  name: string;
  model: string;
  quantity: number;
  price: number;
  priceHistory: Array<{
    price: number;
    date: Date;
    supplier: string;
    quantity: number;
  }>;
  supplier: string;
  location: string;
  minQuantity: number;
}

interface StockRecord {
  id: string;
  partId: string;
  type: 'in' | 'out';
  quantity: number;
  price: number;
  date: Date;
  operator: string;
  repairId?: string;
  paymentId?: string;
  stockInNo?: string; // 入库单号
  supplier?: string; // 供应商
  remark?: string; // 备注
}

export default function SpareParts() {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [records, setRecords] = useState<StockRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentPart, setCurrentPart] = useState<SparePart | null>(null);
  const [formData, setFormData] = useState<Omit<SparePart, 'id'>>({
    name: '',
    model: '',
    quantity: 0,
    costPrice: 0,
    price: 0,
    supplier: '',
    location: '',
    minQuantity: 0,
    category: {
      main: '电气类',
      sub: '开关插座'
    },
    tags: []
  });
  const [stockForm, setStockForm] = useState({
    type: 'in' as 'in' | 'out',
    quantity: 0,
    repairId: '',
    supplier: '',
    remark: ''
  });

  // 生成入库单号
  const generateStockInNo = () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${(today.getMonth()+1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `IN-${dateStr}-${randomNum}`;
  };

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = () => {
      try {
        const savedParts = localStorage.getItem('spareParts');
        const savedRecords = localStorage.getItem('stockRecords');
        
        if (savedParts) {
          setParts(JSON.parse(savedParts));
        } else {
          // 初始化示例数据
          const exampleParts = [
            {
              id: '1',
              name: '空气开关',
              model: 'DZ47-63 C16',
              quantity: 20,
              price: 15.8,
              supplier: '天津电气',
              location: 'A区1排3号',
              minQuantity: 5
            },
            {
              id: '2',
              name: 'LED灯泡',
              model: 'E27 9W',
              quantity: 50,
              price: 12.5,
              supplier: '佛山照明',
              location: 'B区2排1号',
              minQuantity: 10
            }
          ];
          setParts(exampleParts);
          localStorage.setItem('spareParts', JSON.stringify(exampleParts));
        }

        if (savedRecords) {
          setRecords(JSON.parse(savedRecords));
        }
      } catch (error) {
        console.error('加载备件数据失败:', error);
        toast.error('加载备件数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddPart = () => {
    try {
      // 检查是否已存在相同名称和型号的备件
      const existingPartIndex = parts.findIndex(
        part => part.name === formData.name && part.model === formData.model
      );

      let updatedParts;
      let message = '备件添加成功';

      if (existingPartIndex >= 0) {
        // 合并已有备件
        const existingPart = parts[existingPartIndex];
        const newPriceHistory = {
          date: new Date(),
          price: Number(formData.price),
          costPrice: Number(formData.costPrice),
          supplier: formData.supplier,
          quantity: Number(formData.quantity)
        };

        updatedParts = [...parts];
        updatedParts[existingPartIndex] = {
          ...existingPart,
          quantity: existingPart.quantity + Number(formData.quantity),
          // 保留原价格或使用新价格
          price: existingPart.price, 
          costPrice: existingPart.costPrice,
          supplier: formData.supplier || existingPart.supplier,
          location: formData.location || existingPart.location,
          minQuantity: Number(formData.minQuantity) || existingPart.minQuantity,
          priceHistory: [
            ...(existingPart.priceHistory || []),
            newPriceHistory
          ]
        };
        message = `备件已合并，当前数量: ${updatedParts[existingPartIndex].quantity}`;
      } else {
        // 添加新备件
        const newPart = {
          ...formData,
          id: Date.now().toString(),
          quantity: Number(formData.quantity),
          costPrice: Number(formData.costPrice),
          price: Number(formData.price),
          minQuantity: Number(formData.minQuantity),
          priceHistory: [{
            date: new Date(),
            price: Number(formData.price),
            costPrice: Number(formData.costPrice),
            supplier: formData.supplier,
            quantity: Number(formData.quantity)
          }]
        };
        updatedParts = [...parts, newPart];
      }

      setParts(updatedParts);
      localStorage.setItem('spareParts', JSON.stringify(updatedParts));
      
      setShowAddForm(false);
      setFormData({
        name: '',
        model: '',
        quantity: 0,
        price: 0,
        supplier: '',
        location: '',
        minQuantity: 0
      });
      toast.success(message);
    } catch (error) {
      toast.error('备件操作失败');
    }
  };

  const handleStockOperation = () => {
    if (!currentPart) return;
    
    if (stockForm.quantity <= 0) {
      toast.error('请输入有效的数量');
      return;
    }

    const operation = stockForm.type === 'in' ? '入库' : '出库';
    const confirmMessage = `确认要将 ${currentPart.name} (${currentPart.model}) ${operation} ${stockForm.quantity} 个吗？`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const newRecord = {
        id: Date.now().toString(),
        partId: currentPart.id,
        type: stockForm.type,
        quantity: Number(stockForm.quantity),
        date: new Date(),
        operator: 'Dawn',
        repairId: stockForm.type === 'out' ? stockForm.repairId : undefined,
        stockInNo: stockForm.type === 'in' ? generateStockInNo() : undefined,
        supplier: stockForm.supplier,
        remark: stockForm.remark
      };

      // 更新备件库存
      const updatedParts = parts.map(part => {
        if (part.id === currentPart.id) {
          const newQuantity = stockForm.type === 'in' 
            ? part.quantity + Number(stockForm.quantity)
            : part.quantity - Number(stockForm.quantity);
            
          if (newQuantity < 0) {
            toast.error('库存不足，无法完成出库操作');
            throw new Error('库存不足');
          }
          
          return {
            ...part,
            quantity: newQuantity
          };
        }
        return part;
      });

      // 更新记录
      const updatedRecords = [...records, newRecord];

      setParts(updatedParts);
      setRecords(updatedRecords);
      localStorage.setItem('spareParts', JSON.stringify(updatedParts));
      localStorage.setItem('stockRecords', JSON.stringify(updatedRecords));
      
      setShowStockForm(false);
      setStockForm({
        type: 'in',
        quantity: 0,
        repairId: ''
      });
      toast.success(`${operation}操作成功，当前库存: ${updatedParts.find(p => p.id === currentPart.id)?.quantity}`);
    } catch (error) {
      if (error instanceof Error && error.message !== '库存不足') {
        toast.error('库存操作失败');
      }
    }
  };

  const handleDeletePart = (id: string) => {
    if (confirm('确定要删除这个备件吗？')) {
      const updatedParts = parts.filter(part => part.id !== id);
      setParts(updatedParts);
      localStorage.setItem('spareParts', JSON.stringify(updatedParts));
      toast.success('备件删除成功');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">备件库管理</h1>
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
            <h2 className="text-lg font-semibold text-gray-800">备件列表</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setCurrentPart(null);
                }}
                className="bg-[#4A90E2] text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                <i className="fa-solid fa-plus mr-2"></i>
                添加备件
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <i className="fa-solid fa-spinner fa-spin text-2xl text-gray-400"></i>
              <p className="mt-2 text-gray-500">正在加载备件数据...</p>
            </div>
          ) : parts.length === 0 ? (
            <div className="text-center py-8">
              <i className="fa-solid fa-box-open text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-700">暂无备件数据</h3>
              <p className="text-gray-500 mt-2">点击上方按钮添加备件</p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
                <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">型号</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成本价</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">售价</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">库存</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">供应商</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {parts.map((part) => (
                         <tr key={part.id} className={part.quantity <= part.minQuantity ? 'bg-red-50' : ''}>
                           <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                             {part.name}
                             {part.priceHistory?.length > 1 && (
                               <span className="ml-2 text-xs text-blue-500" title="有价格变更历史">
                                 <i className="fa-solid fa-clock-rotate-left"></i>
                               </span>
                             )}
                           </td>
                           <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                             <Link 
                               to={`/finance-management?partId=${part.id}`}
                               className="text-blue-500 hover:text-blue-700"
                             >
                               {part.model}
                             </Link>
                           </td>
                           <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                             {part.costPrice ? `¥${part.costPrice.toFixed(2)}` : '-'}
                           </td>
                           <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                             ¥{part.price.toFixed(2)}
                             {part.priceHistory?.length > 1 && (
                               <button 
                                 onClick={() => {
                                   setCurrentPart(part);
                                   setShowHistory(true);
                                 }}
                                 className="ml-2 text-blue-500 hover:text-blue-700"
                                 title="查看价格历史"
                               >
                                 <i className="fa-solid fa-history text-xs"></i>
                               </button>
                             )}
                           </td>
                           <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                             {part.quantity} {part.quantity <= part.minQuantity && <span className="text-red-500">(需补货)</span>}
                           </td>
                           <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">{part.supplier}</td>
                           <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setCurrentPart(part);
                                  setStockForm({
                                    type: 'in',
                                    quantity: 0,
                                    repairId: '',
                                    supplier: part.supplier || '',
                                    remark: ''
                                  });
                                  setShowStockForm(true);
                                }}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <i className="fa-solid fa-boxes-stacked mr-1"></i>
                                库存操作
                              </button>
                              <button
                                onClick={() => handleDeletePart(part.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <i className="fa-solid fa-trash mr-1"></i>
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
               
                {/* 进出库日志 */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">进出库日志</h3>
                    <div className="text-sm text-gray-500">
                      共 {records.filter(r => parts.some(p => p.id === r.partId)).length} 条记录
                    </div>
                  </div>
                  <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备件</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单价</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联单号</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作人</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {records
                          .filter(record => parts.some(p => p.id === record.partId))
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((record) => {
                            const part = parts.find(p => p.id === record.partId);
                            return (
                              <tr key={record.id}>
                                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                                  {new Date(record.date).toLocaleString()}
                                </td>
                                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    record.type === 'in' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {record.type === 'in' ? '入库' : '出库'}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                                  {part?.name} ({part?.model})
                                </td>
                                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                                  {record.quantity}
                                </td>
                                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                                  ¥{(record.price || 0).toFixed(2)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-4 text-sm text-blue-500">
                                  {record.type === 'in' ? (
                                    <span title={`入库单号: ${record.stockInNo}\n供应商: ${record.supplier}\n备注: ${record.remark}`}>
                                      {record.stockInNo}
                                    </span>
                                  ) : (
                                    <Link 
                                      to={`/process/${record.repairId}`}
                                      className="hover:underline"
                                      title="查看关联工单"
                                    >
                                      {record.repairId}
                                    </Link>
                                  )}
                                </td>
                                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                                  {record.operator}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
            </div>
          )}
        </div>

        {/* 添加备件表单 */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">添加新备件</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备件名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="输入备件名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">型号</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="输入型号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">初始数量</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full p-2 border rounded-md"
                  placeholder="输入数量"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">成本价</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                  className="w-full p-2 border rounded-md"
                  placeholder="输入成本价"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">售价</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full p-2 border rounded-md"
                  placeholder="输入售价"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">供应商</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="输入供应商"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">存放位置</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="输入存放位置"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最低库存</label>
                <input
                  type="number"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
                  className="w-full p-2 border rounded-md"
                  placeholder="输入最低库存"
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
                onClick={handleAddPart}
                className="bg-[#4A90E2] text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                确认添加
              </button>
            </div>
          </div>
        )}

         {/* 价格历史记录 */}
         {showHistory && currentPart && (
           <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold text-gray-800">
                 {currentPart.name} ({currentPart.model}) 价格历史
               </h3>
               <button 
                 onClick={() => setShowHistory(false)}
                 className="text-gray-500 hover:text-gray-700"
               >
                 <i className="fa-solid fa-times"></i>
               </button>
             </div>
             
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成本价</th>
                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">售价</th>
                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">供应商</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {currentPart.priceHistory
                     ?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                     .map((history, index) => (
                       <tr key={index}>
                         <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                           {new Date(history.date).toLocaleDateString()}
                         </td>
                         <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                           ¥{history.costPrice?.toFixed(2) || '-'}
                         </td>
                         <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                           ¥{history.price?.toFixed(2)}
                         </td>
                         <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                           {history.quantity}
                         </td>
                         <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                           {history.supplier}
                         </td>
                       </tr>
                     ))}
                 </tbody>
               </table>
             </div>
           </div>
         )}

         {/* 库存操作表单 */}
        {showStockForm && currentPart && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {stockForm.type === 'in' ? '备件入库' : '备件出库'} - {currentPart.name} ({currentPart.model})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">操作类型</label>
                <select
                  value={stockForm.type}
                  onChange={(e) => setStockForm({ ...stockForm, type: e.target.value as 'in' | 'out' })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="in">入库</option>
                  <option value="out">出库</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
                <input
                  type="number"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm({ ...stockForm, quantity: Number(e.target.value) })}
                  className="w-full p-2 border rounded-md"
                  placeholder="输入数量"
                />
              </div>
              {stockForm.type === 'in' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">供应商</label>
                    <input
                      type="text"
                      value={stockForm.supplier}
                      onChange={(e) => setStockForm({ ...stockForm, supplier: e.target.value })}
                      className="w-full p-2 border rounded-md"
                      placeholder="输入供应商"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                    <input
                      type="text"
                      value={stockForm.remark}
                      onChange={(e) => setStockForm({ ...stockForm, remark: e.target.value })}
                      className="w-full p-2 border rounded-md"
                      placeholder="输入备注信息"
                    />
                  </div>
                </>
              )}
              {stockForm.type === 'out' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">关联维修单号 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={stockForm.repairId}
                    onChange={(e) => setStockForm({ ...stockForm, repairId: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    placeholder="输入维修单号"
                    required
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setShowStockForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleStockOperation}
                className="bg-[#4A90E2] text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                确认操作
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}