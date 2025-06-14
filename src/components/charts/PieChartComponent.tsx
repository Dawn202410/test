import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { COLORS } from '@/lib/mockData';

interface PieChartProps {
  data: Array<{ area: string; count: number }>;
  title: string;
  icon: string;
}

export const PieChartComponent: React.FC<PieChartProps> = ({ data, title, icon }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <i className={`${icon} mr-2`}></i>
        {title}
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={40}
            paddingAngle={5}
            dataKey="count"
            nameKey="area"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              background: 'rgba(255, 255, 255, 0.96)',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend 
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};