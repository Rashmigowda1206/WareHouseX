import React from 'react';
import { User } from '../../types';
import { Terminal, LogOut, Cpu, HardDrive } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  serverMode: 'live' | 'simulated';
  onModeToggle: () => void;
  onLogout: () => void;
  cpuPercent?: number;
  memPercent?: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  serverMode,
  onModeToggle,
  onLogout,
  cpuPercent = 22,
  memPercent = 43,
}) => {
  return (
    <header className="h-16 border-b border-[#08482D]/12 bg-[#FFFFFF]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 shadow-[0_1px_3px_rgba(8,72,45,0.04)]">
      {/* Left: Host telemetry pill */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-xs font-mono-tech bg-[#DAE7C7]/40 border border-[#08482D]/20 px-3 py-1.5 rounded-lg text-[#08482D]">
          <Terminal className="w-3.5 h-3.5 text-[#08482D] animate-pulse" />
          <span className="font-semibold text-[#08482D]">HOST:</span>
          <span className="text-[#101410] font-bold">warehousex-core-srv01</span>
          <span className="text-[#08482D]/40">|</span>
          <span className="text-[#5E5E61]">Ubuntu 24.04 LTS</span>
        </div>

        {/* Live Resource Mini-Gauges */}
        <div className="hidden lg:flex items-center space-x-4 text-xs font-mono-tech text-[#5E5E61]">
          <div className="flex items-center space-x-1.5 bg-[#F5F8EF] px-2.5 py-1 rounded-md border border-[#08482D]/10">
            <Cpu className="w-3.5 h-3.5 text-[#08482D]" />
            <span>CPU</span>
            <span className={`font-bold ${cpuPercent > 80 ? 'text-[#DC2626]' : 'text-[#08482D]'}`}>
              {cpuPercent}%
            </span>
          </div>
          <div className="flex items-center space-x-1.5 bg-[#F5F8EF] px-2.5 py-1 rounded-md border border-[#08482D]/10">
            <HardDrive className="w-3.5 h-3.5 text-[#08482D]" />
            <span>RAM</span>
            <span className={`font-bold ${memPercent > 80 ? 'text-[#DC2626]' : 'text-[#08482D]'}`}>
              {memPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Right: Operational Mode Badge + User Profile */}
      <div className="flex items-center space-x-4">
        {/* Environment Mode Switcher Button */}
        <button
          onClick={onModeToggle}
          title="Click to toggle between Live Linux Server data and Demo Mode"
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 border cursor-pointer ${
            serverMode === 'live'
              ? 'bg-[#DAE7C7] border-[#08482D]/30 text-[#08482D] shadow-sm hover:bg-[#CFDEC0]'
              : 'bg-[#FEF3C7] border-[#F59E0B]/40 text-[#92400E] shadow-sm hover:bg-[#FDE68A]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              serverMode === 'live' ? 'bg-[#08482D] animate-ping' : 'bg-[#D97706] animate-pulse'
            }`}
          />
          <span className="font-bold uppercase tracking-wider">
            {serverMode === 'live' ? 'LIVE UBUNTU HOST' : 'DEMO MODE (SIMULATED)'}
          </span>
          <span className="text-[10px] opacity-75 underline">Toggle</span>
        </button>

        {/* User Card */}
        {user && (
          <div className="flex items-center space-x-3 pl-3 border-l border-[#08482D]/15">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-[#101410]">{user.full_name}</div>
              <div className="text-[11px] font-mono-tech uppercase text-[#08482D] font-bold tracking-wider">
                {user.role}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#08482D] flex items-center justify-center font-bold text-xs text-white shadow-sm border border-[#08482D]">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <button
              onClick={onLogout}
              title="Logout session"
              className="p-1.5 text-[#5E5E61] hover:text-[#DC2626] hover:bg-[#FEE2E2]/60 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
