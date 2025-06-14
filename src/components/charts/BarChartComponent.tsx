import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { COLORS } from '@/lib/mockData';

interface BarChartProps {
  data: Array<{ type: string; count: number }>;
  title: string;
  icon: string;
}

export const BarChartComponent: React.FC<BarChartProps> = ({ data, title, icon }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <i className={`${icon} mr-2`}></i>
        {title}
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="type" 
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
          <Bar 
            dataKey="count" 
            fill="url(#colorGradient)" 
            name="报修数量"
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#4A90E2" stopOpacity={0.2}/>
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};