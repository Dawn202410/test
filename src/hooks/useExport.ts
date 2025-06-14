import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { api } from '@/lib/utils';

export const useExport = () => {
  const handleExport = async (startDate: string, endDate: string) => {
    try {
      const response = await api.get('/api/stats/export', {
        params: {
          startDate,
          endDate
        }
      });
      
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(response.data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "报修数据");
      XLSX.writeFile(workbook, `报修数据_${startDate}_${endDate}.xlsx`);
      toast.success('数据导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('数据导出失败');
    }
  };

  return { handleExport };
};