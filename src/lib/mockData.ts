// 定义数据类型接口
export interface RepairType {
  type: string;
  count: number;
}

export interface RepairArea {
  area: string;
  count: number;
}

export interface RepairTime {
  date: string;
  count: number;
}

export interface StaffPerformance {
  staff: string;
  completed: number;
  avgTime: number;
}

export interface FinanceData {
  date: string;
  income: number;
  expense: number;
}

// 导出模拟数据
export const mockData = {
  byType: [
    { type: '楼宇对讲', count: 12 },
    { type: '楼道照明', count: 8 },
    { type: '电梯故障', count: 5 },
    { type: '水管漏水', count: 7 },
    { type: '电路问题', count: 3 },
  ] as RepairType[],
  
  byArea: [
    { area: '朝阳区', count: 15 },
    { area: '海淀区', count: 10 },
    { area: '西城区', count: 5 },
    { area: '东城区', count: 5 },
  ] as RepairArea[],
  
  byTime: [
    { date: '05-01', count: 2 },
    { date: '05-02', count: 3 },
    { date: '05-03', count: 5 },
    { date: '05-04', count: 4 },
    { date: '05-05', count: 7 },
    { date: '05-06', count: 6 },
    { date: '05-07', count: 8 },
  ] as RepairTime[],
  
  performance: [
    { staff: '王师傅', completed: 12, avgTime: 2.5 },
    { staff: '李师傅', completed: 8, avgTime: 3.2 },
    { staff: '张师傅', completed: 6, avgTime: 4.1 },
    { staff: '赵师傅', completed: 4, avgTime: 2.8 },
  ] as StaffPerformance[],
  
  finance: [
    { date: '05-01', income: 1200, expense: 800 },
    { date: '05-02', income: 1500, expense: 900 },
    { date: '05-03', income: 1800, expense: 1000 },
    { date: '05-04', income: 1400, expense: 850 },
    { date: '05-05', income: 2000, expense: 1200 },
    { date: '05-06', income: 1700, expense: 950 },
    { date: '05-07', income: 2200, expense: 1100 },
  ] as FinanceData[],
};

export const COLORS = ['#4A90E2', '#36A2EB', '#4DD0E1', '#00C853', '#FFC107'];