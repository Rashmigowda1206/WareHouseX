import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status.toLowerCase();

  let styles = 'bg-[#F1F5EB] text-[#5E5E61] border-[#C4CEBA]';

  if (['in stock', 'active', 'verified', 'running', 'success', 'completed', 'online', 'allow'].includes(norm)) {
    styles = 'bg-[#DAE7C7] text-[#08482D] border-[#08482D]/25 font-bold';
  } else if (['low stock', 'warning', 'verifying', 'processing', 'in_progress'].includes(norm)) {
    styles = 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/30 font-bold';
  } else if (['out of stock', 'corrupt', 'failed', 'suspended', 'critical', 'danger', 'inactive', 'deny'].includes(norm)) {
    styles = 'bg-[#FEE2E2] text-[#B91C1C] border-[#EF4444]/30 font-bold';
  } else if (['overstocked', 'info', 'shipped'].includes(norm)) {
    styles = 'bg-[#E0F2FE] text-[#0369A1] border-[#0284C7]/30 font-bold';
  } else if (['admin'].includes(norm)) {
    styles = 'bg-[#F3E8FF] text-[#7E22CE] border-[#A855F7]/30 font-bold';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-mono-tech font-bold rounded-full border uppercase tracking-wider ${sizeClasses} ${styles}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-90" />
      {status}
    </span>
  );
};
