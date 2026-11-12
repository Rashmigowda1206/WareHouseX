import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TelemetryPoint {
  time: string;
  cpu: number;
  memory: number;
}

interface LiveTelemetryChartProps {
  data: TelemetryPoint[];
}

export const LiveTelemetryChart: React.FC<LiveTelemetryChartProps> = ({ data }) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#08482D" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#08482D" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0284C7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(8, 72, 45, 0.08)" />
          <XAxis dataKey="time" stroke="#5E5E61" tick={{ fontSize: 11, fill: '#5E5E61', fontFamily: 'JetBrains Mono' }} />
          <YAxis stroke="#5E5E61" domain={[0, 100]} tick={{ fontSize: 11, fill: '#5E5E61', fontFamily: 'JetBrains Mono' }} unit="%" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: 'rgba(8, 72, 45, 0.2)',
              borderRadius: '12px',
              fontFamily: 'JetBrains Mono',
              fontSize: '12px',
              color: '#101410',
              boxShadow: '0 4px 16px rgba(8, 72, 45, 0.08)',
            }}
          />
          <Area
            type="monotone"
            dataKey="cpu"
            name="CPU Utilization"
            stroke="#08482D"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#cpuGradient)"
          />
          <Area
            type="monotone"
            dataKey="memory"
            name="RAM Utilization"
            stroke="#0284C7"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#memGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
