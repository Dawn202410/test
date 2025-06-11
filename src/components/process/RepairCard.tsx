import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProcessRepairData, PROCESSED_BY_NAME } from '@/pages/Process';
import StatusBadge from './StatusBadge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface RepairCardProps {
  repair: ProcessRepairData;
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
  onStatusChange: (status: '待处理' | '处理中' | '已完成') => void;
  onAddNote: (note: { content: string; media?: Array<{ url: string; type: 'image' | 'video'; description?: string }> }) => void;
  onDelete: () => void;
  showCheckboxes: boolean;
  services: Array<{ id: string; name: string; price: number }>;
  parts: Array<{ id: string; name: string; model: string; quantity: number; price: number }>;
  selectedPart: { id: string; quantity: number } | null;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  selectedServices: Array<{ name: string; price: number }>;
  selectedParts: Array<{ name: string; model: string; quantity: number; price: number }>;
  onAddPayment: (paymentData: {
    services: Array<{ name: string; price: number }>;
    parts: Array<{ name: string; model: string; quantity: number; price: number }>;
    paymentMethod: '现金' | '转账' | '月结' | 'other';
  }) => void;
}




const TAB_NAMES = ['处理记录', '收费信息', '操作'] as const;
type TabName = typeof TAB_NAMES[number];

export default function RepairCard({
  repair, 
  index,
  isSelected,
  onSelect,
  onStatusChange, 
  onAddNote,
  onDelete,
  showCheckboxes,
  services,
  parts,
  selectedPart,
  paymentMethod,
  setPaymentMethod,
  onAddPayment
}: RepairCardProps) {
  const [selectedServices, setSelectedServices] = useState<Array<{name: string; price: number}>>([]);
  const [selectedParts, setSelectedParts] = useState<Array<{name: string; model: string; quantity: number; price: number}>>([]);
  const navigate = useNavigate();
const [isExpanded, setIsExpanded] = useState(false);
const [activeTab, setActiveTab] = useState<TabName>('处理记录');
  const [newNote, setNewNote] = useState('');
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'搁置' | '终止' | '拒绝' | null>(null);
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [mediaFiles, setMediaFiles] = useState<Array<{
    url: string;
    type: 'image' | 'video';
    description: string;
    file?: File; // 保留原始文件引用
  }>>([]);

  const handleAddNote = () => {
    if (!newNote.trim()) {
      return;
    }

    // 严格验证mediaFiles结构
    const validatedMedia = (() => {
      if (!Array.isArray(mediaFiles)) return [];
      return mediaFiles
        .filter(file => file && typeof file === 'object' && file.url)
        .map(file => ({
          url: String(file.url),
          type: file.type === 'video' ? 'video' : 'image',
          description: typeof file.description === 'string' ? file.description : ''
        }));
    })();

    const noteWithMedia = {
      content: newNote.trim(),
      date: new Date(),
      processedBy: PROCESSED_BY_NAME,
      ...(validatedMedia.length > 0 ? { media: validatedMedia } : {})
    };
    
    if (typeof onAddNote === 'function') {
      try {
        // 严格验证note对象结构
        if (!noteWithMedia || typeof noteWithMedia !== 'object' || Array.isArray(noteWithMedia)) {
          throw new Error('无效的处理记录对象');
        }
        if (typeof noteWithMedia.content !== 'string' || !noteWithMedia.content.trim()) {
          throw new Error('处理记录内容不能为空');
        }
        if (noteWithMedia.media) {
          if (!Array.isArray(noteWithMedia.media)) {
            throw new Error('媒体文件必须是数组');
          }
          // 验证media数组中的每个对象
          noteWithMedia.media.forEach(item => {
            if (!item || typeof item !== 'object') {
              throw new Error('媒体文件对象无效');
            }
            if (typeof item.url !== 'string' || !item.url) {
              throw new Error('媒体文件URL无效');
            }
            if (item.type !== 'image' && item.type !== 'video') {
              throw new Error('媒体文件类型必须是image或video');
            }
          });
        }
        
        onAddNote(noteWithMedia);
        setNewNote('');
        setMediaFiles([]);
      } catch (error) {
        console.error('添加处理记录失败:', error);
        toast.error(error instanceof Error ? error.message : '添加处理记录失败');
      }
    }
  };

  return (
    <motion.div 
      className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg ${
        repair.priority === '高' ? 'border-2 border-red-500' 
        : repair.priority === '中' ? 'border-2 border-yellow-500' 
        : 'border-2 border-green-500'
      }`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            {showCheckboxes && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(index)}
                className="h-4 w-4 text-blue-600 rounded mr-3"
              />
            )}
            <div>

              <h3 className="font-bold text-gray-800">{repair.name} - {repair.type}</h3>
              <div className="text-xs text-blue-600 font-medium">工单号: {repair.id}</div>
              <div className="text-gray-600 text-sm mt-1">
  
                <div className="flex items-center mt-1">
                  <i className="fa-solid fa-phone text-xs mr-1"></i>
                  <span>{repair.phone}</span>
                </div>
                <div>{repair.area} {repair.community} {repair.building} {repair.address}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <StatusBadge status={repair.status} />
            <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} ml-2 text-gray-400`}></i>
          </div>
        </div>
        <p className="text-gray-700 mt-2">{repair.description}</p>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-500">
            {new Date(repair.date).toLocaleDateString()}
          </span>
          <span className={`text-sm font-medium ${repair.priority === '紧急' ? 'text-red-500' : 'text-blue-500'}`}>
            {repair.priority}
          </span>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px] overflow-y-auto' : 'max-h-0'}`}>
<div className="border-t border-gray-200 p-4">
          <div className="flex border-b border-gray-200 mb-4 bg-white sticky top-0 z-10 shadow-sm">
            {TAB_NAMES.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === '处理记录' && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">处理记录</h4>
                   {repair.notes && repair.notes.length > 0 ? (
                     <ul className="space-y-2">
                      {repair.notes.map((note, index) => (
                          <li key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                            <div className="font-medium">{note.processedBy}</div>
                            <div className="text-gray-500 text-xs">{new Date(note.date).toLocaleString()}</div>
                            <div className="mt-1">
                              {note.content}
                            {note.statusChangeReason && note.statusChangeReason.trim() && (
                                   <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100 text-blue-700 shadow-sm">
                                     <div className="font-medium flex items-center">
                                       <i className="fa-solid fa-circle-info mr-2"></i>
                                       状态变更原因
                                     </div>
                                     <div className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{note.statusChangeReason}</div>
                                   </div>
                                )}
                            </div>
                           {note.media && note.media.length > 0 && (
                             <div className="mt-2 grid grid-cols-3 gap-2">
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
                         </li>
                      ))}
                    </ul>
                   ) : (
                     <p className="text-sm text-gray-400">暂无处理记录</p>
                  )}
                </div>
              )}
              {activeTab === '收费信息' && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">收费信息</h4>
                  {repair.payment ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium text-gray-700">服务项目</h5>
                          {repair.payment.services.map((service, i) => (
                            <div key={i} className="text-sm text-gray-600">
                               <div>{service.name} - ¥{service.price.toFixed(2)}</div>
                               {service.description && (
                                 <div className="text-xs text-gray-400 mt-1">{service.description}</div>
                               )}
                             </div>
                           ))}
                        </div>
                        <div>

                          <ul className="space-y-1">
                            {repair.payment.parts.map((part, i) => (
                              <li key={i} className="text-sm text-gray-600">
                                {part.name} ({part.model}) ×{part.quantity} - ¥{(part.price * part.quantity).toFixed(2)}
                              </li>
                            ))}
                          </ul>

                        </div>
                      </div>
                      <div className="mt-2 text-sm font-medium">
                        总金额: ¥{repair.payment.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                         支付方式: {repair.payment.paymentMethod === '现金' ? '现金' : 
                         repair.payment.paymentMethod === '转账' ? '对公转账' : 
                         repair.payment.paymentMethod === '月结' ? '周期性结算' : 
                         repair.payment.paymentMethod === '微信支付' ? '微信支付' : 
                         repair.payment.paymentMethod === '支付宝支付' ? '支付宝支付' : 
                         repair.payment.paymentMethod === '内部结算' ? '内部结算' : '现金'}
                      </div>

                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">暂无收费信息</p>
                  )}
                </div>
              )}
                  {activeTab === '操作' && (
                    <div className="flex justify-end space-x-2">
                      {(repair.status === '待处理' || repair.status === '处理中') && (
                        <button
                          onClick={onDelete}
                          className="bg-red-100 text-red-800 px-4 py-2 rounded-md hover:bg-red-200 transition-colors"
                        >
                          <i className="fa-solid fa-trash mr-2"></i>
                          删除
                        </button>
                      )}
                    {repair.status === '待处理' && (
                      <button
                        onClick={() => {
                          if (typeof onStatusChange === 'function') {
                            onStatusChange('处理中', '');
                          } else {
                            toast.error('状态变更功能不可用');
                          }
                        }}
                        className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md hover:bg-yellow-200 transition-colors"
                      >
                        <i className="fa-solid fa-play mr-2"></i>
                        开始处理
                      </button>
                    )}

                   {(repair.status === '已完成' || repair.status === '搁置') && (
                      <button
                        onClick={() => onStatusChange('处理中')}
                        className="bg-purple-100 text-purple-800 px-4 py-2 rounded-md hover:bg-purple-200 transition-colors"
                      >
                        <i className="fa-solid fa-rotate-left mr-2"></i>
                        {repair.status === '搁置' ? '重新处理' : '重新处理'}
                      </button>
                    )}

                  {repair.status === '处理中' && (
                    <button
                      onClick={() => navigate(`/edit-process/${repair.id}`)}
                      className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      <i className="fa-solid fa-pen-to-square mr-2"></i>
                      处理工单
                    </button>
                  )}
                  {repair.status === '处理中' && (
                    <button
                      onClick={() => {
                        if (!repair.payment) {
                          toast.warning('请先添加收费信息');
                        } else {
                          onStatusChange('已完成');
                        }
                      }}
                      className="bg-green-100 text-green-800 px-4 py-2 rounded-md hover:bg-green-200 transition-colors"
                    >
                      <i className="fa-solid fa-check mr-2"></i>
                      标记为已完成
                    </button>
                  )}
                   {repair.status === '处理中' && (
                     <button
                       onClick={() => {
                         setTargetStatus('搁置');
                         setShowStatusChangeModal(true);
                         setStatusChangeReason(''); // 清空之前填写的变更原因
                       }}
                       className="bg-purple-100 text-purple-800 px-4 py-2 rounded-md hover:bg-purple-200 transition-colors"
                       title="点击后会弹出填写搁置原因的对话框"
                     >
                       <i className="fa-solid fa-pause mr-2"></i>
                       搁置工单
                     </button>
                   )}
                  {repair.status === '处理中' && (
                    <button
                      onClick={() => {
                        setTargetStatus('终止');
                        setShowStatusChangeModal(true);
                      }}
                      className="bg-red-100 text-red-800 px-4 py-2 rounded-md hover:bg-red-200 transition-colors"
                    >
                      <i className="fa-solid fa-ban mr-2"></i>
                      终止工单
                    </button>
                  )}
                  {repair.status === '处理中' && (
                    <button
                      onClick={() => {
                        setTargetStatus('拒绝');
                        setShowStatusChangeModal(true);
                      }}
                      className="bg-pink-100 text-pink-800 px-4 py-2 rounded-md hover:bg-pink-200 transition-colors"
                    >
                      <i className="fa-solid fa-xmark mr-2"></i>
                      拒绝工单
                    </button>
                  )}

                </div>
              )}
            </motion.div>
          </AnimatePresence>
          {/* 处理记录区域 - 已根据需求移除 */}

            {/* 状态变更原因模态框 - 用于搁置/终止/拒绝工单时填写原因 */}
            {showStatusChangeModal && targetStatus && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg max-w-md w-full">
                  <h3 className="text-lg font-semibold mb-4">将工单变更为{targetStatus}状态</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {targetStatus}原因 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={statusChangeReason}
                      onChange={(e) => setStatusChangeReason(e.target.value)}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      rows={4}
                      placeholder={`请详细说明${targetStatus}原因（必填）`}
                      required
                    />
                    {!statusChangeReason.trim() && (
                      <p className="mt-1 text-sm text-red-500">请填写{targetStatus}原因</p>
                    )}
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => {
                        setShowStatusChangeModal(false);
                        setStatusChangeReason('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                       onClick={() => {
                         if (!statusChangeReason.trim()) {
                           toast.error(`请填写${targetStatus}原因`);
                           return;
                         }
                         // 传递状态变更原因给父组件
                         onStatusChange(targetStatus as '搁置' | '终止' | '拒绝', statusChangeReason.trim());
                         setShowStatusChangeModal(false);
                         setStatusChangeReason('');
                         toast.success(`状态已变更为${targetStatus}，变更原因已记录`);
                       }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <i className="fa-solid fa-check mr-2"></i>
                      确认变更
                    </button>
                  </div>
                </div>
              </div>
            )}


            </div>
          </div>
        </motion.div>
  );
}
