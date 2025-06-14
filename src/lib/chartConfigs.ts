export const chartConfigs = {
  barChart: {
    cartesianGrid: {
      strokeDasharray: "3 3",
      stroke: "#f0f0f0"
    },
    xAxis: {
      tick: { fill: '#6b7280' },
      axisLine: { stroke: '#e5e7eb' }
    },
    yAxis: {
      tick: { fill: '#6b7280' },
      axisLine: { stroke: '#e5e7eb' }
    },
    tooltip: {
      contentStyle: {
        background: 'rgba(255, 255, 255, 0.96)',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }
    },
    bar: {
      radius: [4, 4, 0, 0]
    }
  },
  pieChart: {
    pie: {
      cx: "50%",
      cy: "50%",
      labelLine: false,
      outerRadius: 80,
      innerRadius: 40,
      paddingAngle: 5,
      label: ({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`
    },
    tooltip: {
      contentStyle: {
        background: 'rgba(255, 255, 255, 0.96)',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }
    },
    legend: {
      layout: "horizontal",
      verticalAlign: "bottom",
      align: "center",
      wrapperStyle: { paddingTop: '20px' }
    }
  },
  areaChart: {
    cartesianGrid: {
      strokeDasharray: "3 3",
      stroke: "#f0f0f0"
    },
    xAxis: {
      tick: { fill: '#6b7280' },
      axisLine: { stroke: '#e5e7eb' }
    },
    yAxis: {
      tick: { fill: '#6b7280' },
      axisLine: { stroke: '#e5e7eb' }
    },
    tooltip: {
      contentStyle: {
        background: 'rgba(255, 255, 255, 0.96)',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }
    },
    area: {
      strokeWidth: 2,
      activeDot: { r: 6, fill: '#4A90E2', stroke: '#fff', strokeWidth: 2 }
    }
  },
  lineChart: {
    cartesianGrid: {
      strokeDasharray: "3 3",
      stroke: "#f0f0f0"
    },
    xAxis: {
      tick: { fill: '#6b7280' },
      axisLine: { stroke: '#e5e7eb' }
    },
    yAxis: {
      tick: { fill: '#6b7280' },
      axisLine: { stroke: '#e5e7eb' }
    },
    tooltip: {
      contentStyle: {
        background: 'rgba(255, 255, 255, 0.96)',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }
    },
    legend: {
      layout: "horizontal",
      verticalAlign: "bottom",
      align: "center",
      wrapperStyle: { paddingTop: '20px' }
    },
    line: {
      strokeWidth: 2,
      activeDot: { r: 6, fill: '#4CAF50', stroke: '#fff', strokeWidth: 2 }
    }
  }
};