import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface CategoryData {
  category: string;
  count: number;
  value: number;
  quantity: number;
}

interface InventoryCategoryChartProps {
  data: CategoryData[];
  mode?: 'value' | 'quantity';
}

const COLORS = ['#08482D', '#059669', '#0284C7', '#7C3AED', '#D97706', '#DB2777'];

export const InventoryCategoryChart: React.FC<InventoryCategoryChartProps> = ({
  data,
  mode = 'value',
}) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(8, 72, 45, 0.08)" vertical={false} />
          <XAxis
            dataKey="category"
            stroke="#5E5E61"
            tick={{ fontSize: 11, fill: '#5E5E61', fontFamily: 'Inter' }}
            interval={0}
            angle={-15}
            textAnchor="end"
          />
          <YAxis
            stroke="#5E5E61"
            tick={{ fontSize: 11, fill: '#5E5E61', fontFamily: 'JetBrains Mono' }}
            tickFormatter={(val) => (mode === 'value' ? `$${(val / 1000).toFixed(0)}k` : val)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: 'rgba(8, 72, 45, 0.2)',
              borderRadius: '12px',
              fontFamily: 'Inter',
              fontSize: '12px',
              color: '#101410',
              boxShadow: '0 4px 16px rgba(8, 72, 45, 0.08)',
            }}
            formatter={(value: any) => [
              mode === 'value' ? `$${Number(value).toLocaleString()}` : `${Number(value)} units`,
              mode === 'value' ? 'Inventory Value' : 'Stock Quantity',
            ]}
          />
          <Bar dataKey={mode === 'value' ? 'value' : 'quantity'} radius={[6, 6, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
