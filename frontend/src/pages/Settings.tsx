import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Sliders,
  Server,
  Lock,
  Save,
  CheckCircle2,
  HardDrive,
  LogOut,
  RefreshCw,
  Terminal,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { settingsService } from '../services';
import { SystemSettings, User as UserType, UserRole } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

interface SettingsProps {
  currentUser: UserType | null;
  onLogout: () => void;
  onModeChanged?: (mode: 'live' | 'simulated') => void;
}

export const Settings: React.FC<SettingsProps> = ({ currentUser, onLogout, onModeChanged }) => {
  const [settingsData, setSettingsData] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // App settings form
  const [appForm, setAppForm] = useState({
    warehouse_name: 'WareHouseX Alpha Central - Hub 01',
    currency: 'USD ($)',
    timezone: 'UTC+00:00',
    low_stock_threshold_default: '15',
    backup_storage_path: '/var/backups/warehousex',
    backup_retention_days: '14',
    ssh_port: '22',
  });

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    full_name: currentUser?.full_name || '',
    email: currentUser?.email || '',
    current_password: '',
    new_password: '',
  });

  const canEditConfig = currentUser?.role === 'admin';

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await settingsService.getSettings();
      setSettingsData(data);
      if (data.settings) {
        setAppForm((prev) => ({
          ...prev,
          ...data.settings,
        }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveAppConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await settingsService.updateSettings(appForm);
      setSuccessMsg('Facility configuration saved successfully');
      setTimeout(() => setSuccessMsg(null), 3500);
      loadSettings();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await settingsService.updateProfile(profileForm);
      setSuccessMsg('Profile credentials updated');
      setProfileForm((prev) => ({ ...prev, current_password: '', new_password: '' }));
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    }
  };

  const handleToggleMode = async (targetMode: 'live' | 'demo') => {
    try {
      const res = await settingsService.toggleMode(targetMode);
      setSuccessMsg(`Switched system mode to: ${res.current_mode.toUpperCase()}`);
      if (onModeChanged) {
        onModeChanged(res.current_mode === 'live' ? 'live' : 'simulated');
      }
      setTimeout(() => setSuccessMsg(null), 3500);
      loadSettings();
    } catch (err: any) {
      alert(err.message || 'Failed to switch system mode');
    }
  };

  const isLiveMode = settingsData?.system_info?.current_mode === 'live';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold tracking-tight text-[#101410] flex items-center space-x-2">
            <SettingsIcon className="w-6 h-6 text-[#08482D]" />
            <span>WareHouseX System & Profile Configuration</span>
          </h2>
          <p className="text-xs font-mono-tech text-[#5E5E61] mt-1">
            Global facility parameters, backup retention policies, user credentials, and host runtime environment
          </p>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-mono-tech font-semibold text-rose-700 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Session</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-[#DAE7C7]/50 border border-[#08482D]/30 rounded-xl text-xs font-mono-tech text-[#08482D] flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-[#08482D] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Operational Mode Card */}
      <div className="p-5 rounded-2xl bg-white border border-[#08482D]/12 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono-tech text-[#08482D]">
            <Server className="w-4 h-4" />
            <h3 className="font-semibold font-heading text-[#101410]">System Runtime & Operational Mode</h3>
          </div>
          <StatusBadge status={isLiveMode ? 'active' : 'warning'} size="sm" />
        </div>

        <p className="text-xs text-[#5E5E61] font-mono-tech leading-relaxed">
          WareHouseX features dual-engine architecture: <span className="text-[#101410] font-bold">Live Ubuntu Server Mode</span> executes authorized Bash scripts directly against systemd, LVM, and UFW; while <span className="text-[#08482D] font-bold">Demo Mode</span> runs the high-fidelity Ubuntu emulator with safe sample telemetry.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#08482D]/10">
          <div className="text-xs font-mono-tech text-[#101410]">
            Current Active Engine:{' '}
            <span className={`font-bold uppercase ${isLiveMode ? 'text-[#08482D]' : 'text-amber-700'}`}>
              {settingsData?.system_info?.current_mode || 'demo'} Mode
            </span>
          </div>

          {canEditConfig && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleToggleMode('demo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-tech cursor-pointer transition-all ${
                  !isLiveMode
                    ? 'bg-[#08482D] text-white font-bold shadow-sm'
                    : 'bg-[#FAFCF6] border border-[#08482D]/15 text-[#5E5E61] hover:text-[#101410]'
                }`}
              >
                Demo Simulation Mode
              </button>
              <button
                type="button"
                onClick={() => handleToggleMode('live')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-tech cursor-pointer transition-all ${
                  isLiveMode
                    ? 'bg-[#08482D] text-white font-bold shadow-sm'
                    : 'bg-[#FAFCF6] border border-[#08482D]/15 text-[#5E5E61] hover:text-[#101410]'
                }`}
              >
                Live Ubuntu Host Mode
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Configuration */}
        <div className="bg-white border border-[#08482D]/12 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono-tech text-[#08482D]">
            <Sliders className="w-4 h-4" />
            <h3 className="font-semibold font-heading text-[#101410]">Warehouse & Backup Configuration</h3>
          </div>

          <form onSubmit={handleSaveAppConfig} className="space-y-4 font-mono-tech text-xs">
            <div>
              <label className="block text-[#5E5E61] font-semibold mb-1">Warehouse Facility Name</label>
              <input
                type="text"
                value={appForm.warehouse_name}
                onChange={(e) => setAppForm({ ...appForm, warehouse_name: e.target.value })}
                disabled={!canEditConfig}
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-[#08482D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#5E5E61] font-semibold mb-1">Currency Code</label>
                <input
                  type="text"
                  value={appForm.currency}
                  onChange={(e) => setAppForm({ ...appForm, currency: e.target.value })}
                  disabled={!canEditConfig}
                  className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-[#08482D]"
                />
              </div>
              <div>
                <label className="block text-[#5E5E61] font-semibold mb-1">Timezone Alignment</label>
                <input
                  type="text"
                  value={appForm.timezone}
                  onChange={(e) => setAppForm({ ...appForm, timezone: e.target.value })}
                  disabled={!canEditConfig}
                  className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-[#08482D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#5E5E61] font-semibold mb-1">Backup Storage Directory</label>
                <input
                  type="text"
                  value={appForm.backup_storage_path}
                  onChange={(e) => setAppForm({ ...appForm, backup_storage_path: e.target.value })}
                  disabled={!canEditConfig}
                  className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-[#08482D]"
                />
              </div>
              <div>
                <label className="block text-[#5E5E61] font-semibold mb-1">Retention Cycle (Days)</label>
                <input
                  type="number"
                  value={appForm.backup_retention_days}
                  onChange={(e) => setAppForm({ ...appForm, backup_retention_days: e.target.value })}
                  disabled={!canEditConfig}
                  className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-[#08482D]"
                />
              </div>
            </div>

            {canEditConfig && (
              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#08482D] hover:bg-[#063823] font-semibold text-white cursor-pointer shadow-sm"
                >
                  Save Facility Parameters
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Profile Settings */}
        <div className="bg-white border border-[#08482D]/12 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono-tech text-[#08482D]">
            <User className="w-4 h-4" />
            <h3 className="font-semibold font-heading text-[#101410]">Operator Profile & Security Credentials</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 font-mono-tech text-xs">
            <div>
              <label className="block text-[#5E5E61] font-semibold mb-1">Full Legal Name</label>
              <input
                type="text"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                required
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] focus:outline-none focus:ring-1 focus:ring-[#08482D]"
              />
            </div>

            <div>
              <label className="block text-[#5E5E61] font-semibold mb-1">Email Address</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                required
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] focus:outline-none focus:ring-1 focus:ring-[#08482D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#08482D]/10">
              <div>
                <label className="block text-[#5E5E61] font-semibold mb-1">Current Password</label>
                <input
                  type="password"
                  value={profileForm.current_password}
                  onChange={(e) => setProfileForm({ ...profileForm, current_password: e.target.value })}
                  placeholder="Verify password"
                  className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] focus:outline-none focus:ring-1 focus:ring-[#08482D]"
                />
              </div>
              <div>
                <label className="block text-[#5E5E61] font-semibold mb-1">New Password</label>
                <input
                  type="password"
                  value={profileForm.new_password}
                  onChange={(e) => setProfileForm({ ...profileForm, new_password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] focus:outline-none focus:ring-1 focus:ring-[#08482D]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#08482D] hover:bg-[#063823] font-semibold text-white cursor-pointer shadow-sm"
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Host Architecture & System Telemetry Info */}
      <div className="rounded-xl border border-[#08482D]/12 bg-white p-5 shadow-sm space-y-3 font-mono-tech text-xs">
        <div className="flex items-center space-x-2 text-[#08482D]">
          <Terminal className="w-4 h-4" />
          <h3 className="font-semibold font-heading text-[#101410]">Host Architecture & Runtime Specifications</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-[#FAFCF6] rounded-lg border border-[#08482D]/10">
            <span className="text-[#5E5E61] block text-[10px]">PYTHON RUNTIME</span>
            <span className="text-[#101410] font-semibold">
              Python {settingsData?.system_info?.python_version || '3.13.14'}
            </span>
          </div>
          <div className="p-3 bg-[#FAFCF6] rounded-lg border border-[#08482D]/10">
            <span className="text-[#5E5E61] block text-[10px]">HOST OS & PLATFORM</span>
            <span className="text-[#101410] font-semibold truncate block">
              {settingsData?.system_info?.platform || 'Ubuntu 24.04 x86_64'}
            </span>
          </div>
          <div className="p-3 bg-[#FAFCF6] rounded-lg border border-[#08482D]/10">
            <span className="text-[#5E5E61] block text-[10px]">DATABASE ENGINE</span>
            <span className="text-[#08482D] font-semibold">
              {settingsData?.system_info?.database_engine || 'SQLite 3 (WAL)'}
            </span>
          </div>
          <div className="p-3 bg-[#FAFCF6] rounded-lg border border-[#08482D]/10">
            <span className="text-[#5E5E61] block text-[10px]">DATABASE FOOTPRINT</span>
            <span className="text-teal-700 font-semibold">
              {settingsData?.system_info?.database_size || '128.0 KB'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
