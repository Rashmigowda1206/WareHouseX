import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  Users,
  HardDrive,
  Archive,
  ShieldAlert,
  Activity,
  ShieldCheck,
  FileText,
  Settings,
  Server,
  Radio
} from 'lucide-react';
import { UserRole } from '../../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userRole?: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, userRole = 'staff' }) => {
  const navItems = [
    { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'staff'] },
    { id: 'inventory', label: 'Inventory Center', icon: Boxes, roles: ['admin', 'manager', 'staff'] },
    { id: 'employees', label: 'Employee & Linux Users', icon: Users, roles: ['admin', 'manager'] },
    { id: 'storage', label: 'Storage & LVM', icon: HardDrive, roles: ['admin', 'manager', 'staff'] },
    { id: 'backups', label: 'Backup Center', icon: Archive, roles: ['admin', 'manager'] },
    { id: 'recovery', label: 'Disaster Recovery', icon: ShieldAlert, roles: ['admin', 'manager'] },
    { id: 'monitoring', label: 'System Monitoring', icon: Activity, roles: ['admin', 'manager', 'staff'] },
    { id: 'security', label: 'Security & Firewall', icon: ShieldCheck, roles: ['admin'] },
    { id: 'logs', label: 'Activity Logs', icon: FileText, roles: ['admin', 'manager', 'staff'] },
    { id: 'settings', label: 'System Settings', icon: Settings, roles: ['admin', 'manager', 'staff'] },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-[#FFFFFF] border-r border-[#08482D]/12 flex flex-col h-screen select-none shrink-0 shadow-[1px_0_4px_rgba(8,72,45,0.03)]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#08482D]/12 flex items-center space-x-3 bg-[#FAFCF6]">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-[#08482D] flex items-center justify-center text-white shadow-sm border border-[#08482D]">
            <Server className="w-5 h-5 text-[#DAE7C7]" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-white flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-1 font-heading">
            <span className="font-extrabold text-lg tracking-wider text-[#101410]">WAREHOUSE</span>
            <span className="font-black text-lg text-[#08482D]">X</span>
          </div>
          <div className="text-[10px] font-mono-tech tracking-widest text-[#5E5E61] uppercase font-medium">
            Linux Server & Logistics
          </div>
        </div>
      </div>

      {/* Tagline Banner */}
      <div className="px-4 py-2 bg-[#DAE7C7]/30 border-b border-[#08482D]/10 text-[10.5px] font-mono-tech text-[#08482D] text-center font-semibold tracking-wider">
        SECURE • AUTOMATE • MONITOR • RECOVER
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono-tech uppercase text-[#5E5E61] font-bold tracking-wider">
          Operations & Infrastructure
        </div>
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#DAE7C7] text-[#08482D] border border-[#08482D]/25 font-bold shadow-xs'
                  : 'text-[#5E5E61] hover:text-[#101410] hover:bg-[#F5F8EF]'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-[#08482D]' : 'text-[#5E5E61]'
                }`}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#08482D]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Server Status Footer Widget */}
      <div className="p-4 border-t border-[#08482D]/12 bg-[#FAFCF6]">
        <div className="bg-[#FFFFFF] border border-[#08482D]/15 rounded-xl p-3 text-xs space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#5E5E61] font-mono-tech text-[11px] font-medium">UBUNTU DAEMON</span>
            <span className="flex items-center space-x-1 text-[#08482D] text-[11px] font-mono-tech font-bold">
              <Radio className="w-3 h-3 text-[#10B981] animate-pulse" />
              <span>ONLINE</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-[#5E5E61] font-mono-tech text-[11px]">
            <span>UPTIME</span>
            <span className="text-[#101410] font-semibold">14d 7h 42m</span>
          </div>
          <div className="flex items-center justify-between text-[#5E5E61] font-mono-tech text-[11px]">
            <span>SSH / UFW</span>
            <span className="text-[#08482D] font-bold">PORT 22 / ACTIVE</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
