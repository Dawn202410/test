import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineChartProps {
  data: Array<{ date: string; income: number; expense: number }>;
  title: string;
  icon: string;
}

export const LineChartComponent: React.FC<LineChartProps> = ({ data, title, icon }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <i className={`${icon} mr-2`}></i>
        {title}
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            tick={{ fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
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
          <Line 
            type="monotone" 
            dataKey="income" 
            stroke="#4CAF50" 
            strokeWidth={2}
            activeDot={{ r: 6, fill: '#4CAF50', stroke: '#fff', strokeWidth: 2 }}
            name="收入"
          />
          <Line 
            type="monotone" 
            dataKey="expense" 
            stroke="#F44336" 
            strokeWidth={2}
            activeDot={{ r: 6, fill: '#F44336', stroke: '#fff', strokeWidth: 2 }}
            name="支出"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};