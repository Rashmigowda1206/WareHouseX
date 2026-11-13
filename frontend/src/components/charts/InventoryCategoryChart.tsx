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

export const DEFAULT_CATEGORY_DATA: CategoryData[] = [
  { category: 'Machinery', count: 5, value: 152000, quantity: 52 },
  { category: 'Electronics', count: 5, value: 98500, quantity: 235 },
  { category: 'IT Hardware', count: 4, value: 58200, quantity: 37 },
  { category: 'Storage', count: 4, value: 36800, quantity: 240 },
  { category: 'Packaging', count: 5, value: 24500, quantity: 3950 },
  { category: 'Safety Gear', count: 5, value: 14500, quantity: 1147 },
];

export const InventoryCategoryChart: React.FC<InventoryCategoryChartProps> = ({
  data,
  mode = 'value',
}) => {
  const chartData = data && data.length > 0 ? data : DEFAULT_CATEGORY_DATA;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(8, 72, 45, 0.08)" vertical={false} />
          <XAxis
            dataKey="category"
            stroke="#5E5E61"
            tick={{ fontSize: 11, fill: '#5E5E61', fontFamily: 'Inter' }}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={40}
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
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
