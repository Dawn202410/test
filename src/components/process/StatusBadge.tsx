import { motion } from 'framer-motion';

interface StatusBadgeProps {
  status: '待处理' | '处理中' | '已完成' | '搁置' | '终止' | '拒绝';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusColors = {
    '待处理': 'bg-gray-100 text-gray-800',
    '处理中': 'bg-yellow-100 text-yellow-800',
    '已完成': 'bg-green-100 text-green-800',
    '搁置': 'bg-purple-100 text-purple-800',
    '终止': 'bg-red-100 text-red-800',
    '拒绝': 'bg-pink-100 text-pink-800'
  };

  return (
    <motion.span 
      className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[status]}`}
      whileHover={{ scale: 1.05 }}
    >
      {status}
    </motion.span>
  );
}
