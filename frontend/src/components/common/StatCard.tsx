import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  accentColor?: 'cyan' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive,
  accentColor = 'emerald',
}) => {
  const colorStyles = {
    cyan: {
      iconBg: 'bg-[#DAE7C7] text-[#08482D] border-[#08482D]/20',
    },
    blue: {
      iconBg: 'bg-[#E0F2FE] text-[#0369A1] border-[#0284C7]/20',
    },
    emerald: {
      iconBg: 'bg-[#DAE7C7] text-[#08482D] border-[#08482D]/20',
    },
    amber: {
      iconBg: 'bg-[#FEF3C7] text-[#B45309] border-[#F59E0B]/20',
    },
    rose: {
      iconBg: 'bg-[#FEE2E2] text-[#B91C1C] border-[#EF4444]/20',
    },
    purple: {
      iconBg: 'bg-[#F3E8FF] text-[#7E22CE] border-[#A855F7]/20',
    },
  }[accentColor];

  return (
    <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#08482D]/12 hover:border-[#08482D]/30 shadow-xs hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono-tech font-bold uppercase tracking-wider text-[#5E5E61]">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border ${colorStyles.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline space-x-2">
        <div className="text-2xl font-heading font-extrabold tracking-tight text-[#101410] font-mono-tech">
          {value}
        </div>
        {trend && (
          <span
            className={`text-xs font-mono-tech font-bold ${
              trendPositive ? 'text-[#08482D]' : 'text-[#DC2626]'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && <div className="mt-1 text-xs text-[#5E5E61] font-mono-tech">{subtitle}</div>}
    </div>
  );
};
