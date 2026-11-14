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
import { Boxes, ChevronRight } from 'lucide-react';

export interface CategoryData {
  category: string;
  count: number;
  value: number;
  quantity: number;
}

interface InventoryCategoryChartProps {
  data: CategoryData[];
  mode?: 'value' | 'quantity';
  totalValue?: number;
  totalSkus?: number;
  lowStockCount?: number;
  outOfStockCount?: number;
  onManageCatalog?: () => void;
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
  totalValue,
  totalSkus,
  lowStockCount = 5,
  outOfStockCount = 1,
  onManageCatalog,
}) => {
  const chartData = data && data.length > 0 ? data : DEFAULT_CATEGORY_DATA;

  const calculatedTotalValue =
    totalValue !== undefined
      ? totalValue
      : chartData.reduce((acc, c) => acc + (c.value || 0), 0);

  const calculatedTotalSkus =
    totalSkus !== undefined
      ? totalSkus
      : chartData.reduce((acc, c) => acc + (c.count || 0), 0);

  return (
    <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#08482D]/12 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#F5F8EF] border border-[#08482D]/15 flex items-center justify-center text-[#08482D]">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-heading font-extrabold text-[#101410]">
              Inventory Valuation by Category
            </h3>
            <p className="text-[11px] font-mono-tech text-[#5E5E61]">
              Asset allocation across logistics fulfillment zones
            </p>
          </div>
        </div>

        {onManageCatalog && (
          <button
            onClick={onManageCatalog}
            className="flex items-center space-x-1 text-xs font-mono-tech font-bold text-[#08482D] hover:underline cursor-pointer"
          >
            <span>Manage Catalog</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-60">
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

      {/* Footer Metrics */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#08482D]/10">
        <div className="p-3 rounded-2xl bg-[#FAFCF6] border border-[#08482D]/10">
          <div className="text-[10px] font-mono-tech text-[#5E5E61] uppercase font-bold tracking-wider">
            Total Assets
          </div>
          <div className="text-sm font-mono-tech font-bold text-[#08482D] mt-0.5">
            ${calculatedTotalValue.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#FAFCF6] border border-[#08482D]/10">
          <div className="text-[10px] font-mono-tech text-[#5E5E61] uppercase font-bold tracking-wider">
            Active SKUs
          </div>
          <div className="text-sm font-mono-tech font-bold text-[#101410] mt-0.5">
            {calculatedTotalSkus} SKUs
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#FAFCF6] border border-[#08482D]/10">
          <div className="text-[10px] font-mono-tech text-[#5E5E61] uppercase font-bold tracking-wider">
            Stock Alerts
          </div>
          <div className="text-sm font-mono-tech font-bold text-[#B45309] mt-0.5">
            {lowStockCount} Low / {outOfStockCount} Out
          </div>
        </div>
      </div>
    </div>
  );
};
