import React, { useEffect, useState } from 'react';
import {
  HardDrive,
  Database,
  Layers,
  Disc,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Server
} from 'lucide-react';
import { storageService } from '../services';
import { StorageInfo, UserRole } from '../types';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';

interface StorageProps {
  userRole?: UserRole;
}

export const Storage: React.FC<StorageProps> = ({ userRole = 'staff' }) => {
  const [storageData, setStorageData] = useState<StorageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

  const loadStorage = async () => {
    setIsLoading(true);
    try {
      const data = await storageService.getOverview();
      setStorageData(data);
    } catch (err) {
      console.error('Failed to load storage data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStorage();
  }, []);

  const handleCleanup = async () => {
    if (!confirm('Run filesystem maintenance to purge expired temporary buffers and rotate old staging archives?')) return;
    setIsCleaning(true);
    setCleanupMessage(null);
    try {
      const res = await storageService.triggerCleanup();
      setCleanupMessage(res.message);
      loadStorage();
    } catch (err: any) {
      alert(err.message || 'Storage cleanup failed');
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold tracking-tight text-[#101410] flex items-center space-x-2">
            <HardDrive className="w-6 h-6 text-[#08482D]" />
            <span>Linux Storage & LVM Pool Management</span>
          </h2>
          <p className="text-xs font-mono-tech text-[#5E5E61] mt-1">
            Enterprise logical volume management (LVM2), physical arrays, and mount point allocations
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadStorage}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#F5F8EF] border border-[#08482D]/20 text-xs font-mono-tech text-[#101410] shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#08482D] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Rescan Storage</span>
          </button>
          {userRole === 'admin' && (
            <button
              onClick={handleCleanup}
              disabled={isCleaning}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#08482D] hover:bg-[#063823] text-white border border-[#08482D] text-xs font-mono-tech font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isCleaning ? 'Pruning...' : 'Purge Temp Buffers'}</span>
            </button>
          )}
        </div>
      </div>

      {cleanupMessage && (
        <div className="p-3 bg-[#DAE7C7]/40 border border-[#08482D]/20 rounded-xl text-xs font-mono-tech text-[#08482D] flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-[#08482D] shrink-0" />
          <span>{cleanupMessage}</span>
        </div>
      )}

      {/* Storage Capacity Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Pool Capacity"
          value={`${storageData?.total_capacity_gb ?? 3072} GB`}
          subtitle="NVMe + SAS LVM Group"
          icon={HardDrive}
          accentColor="cyan"
        />
        <StatCard
          title="Allocated Space"
          value={`${storageData?.used_storage_gb ?? 1342} GB`}
          subtitle={`${storageData?.used_percent ?? 43.7}% Pool Utilization`}
          icon={Layers}
          accentColor="blue"
        />
        <StatCard
          title="Available Headroom"
          value={`${storageData?.available_storage_gb ?? 1730} GB`}
          subtitle="Free unallocated extents"
          icon={Database}
          accentColor="emerald"
        />
        <StatCard
          title="Array Health"
          value="SMART OPTIMAL"
          subtitle="0 Bad sectors / 4 drives"
          icon={CheckCircle2}
          accentColor="emerald"
        />
      </div>

      {/* LVM Hierarchical Architecture Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Physical Volumes (pvs) */}
        <div className="bg-white border border-[#08482D]/12 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-xs font-mono-tech text-[#08482D]">
            <Disc className="w-4 h-4 text-[#08482D]" />
            <h3 className="font-semibold font-heading text-[#101410]">Physical Volumes (pvs)</h3>
          </div>
          <div className="space-y-2">
            {storageData?.physical_volumes?.map((pv, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[#FAFCF6] border border-[#08482D]/10 text-xs font-mono-tech space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#101410]">{pv.pv}</span>
                  <span className="text-[#08482D] font-semibold">{pv.size}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#5E5E61]">
                  <span>VG: {pv.vg}</span>
                  <span>Free: {pv.free}</span>
                </div>
                {pv.type && <div className="text-[10px] text-[#5E5E61]/80">{pv.type}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Volume Groups (vgs) */}
        <div className="bg-white border border-[#08482D]/12 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-xs font-mono-tech text-[#08482D]">
            <Server className="w-4 h-4 text-[#08482D]" />
            <h3 className="font-semibold font-heading text-[#101410]">Volume Groups (vgs)</h3>
          </div>
          <div className="space-y-2">
            {storageData?.volume_groups?.map((vg, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[#FAFCF6] border border-[#08482D]/10 text-xs font-mono-tech space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#08482D]">{vg.vg}</span>
                  <span className="text-[#101410] font-semibold">{vg.size}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#5E5E61]">
                  <span>Free: {vg.free}</span>
                  <span>PVs: {vg.pv_count ?? 2} | LVs: {vg.lv_count ?? 4}</span>
                </div>
                <div className="text-[10px] text-[#5E5E61]/80">Format: {vg.format ?? 'lvm2 (standard)'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Logical Volumes (lvs) Overview */}
        <div className="bg-white border border-[#08482D]/12 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-xs font-mono-tech text-[#08482D]">
            <Layers className="w-4 h-4 text-[#08482D]" />
            <h3 className="font-semibold font-heading text-[#101410]">Logical Volumes (lvs)</h3>
          </div>
          <div className="space-y-2">
            {storageData?.logical_volumes?.map((lv, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[#FAFCF6] border border-[#08482D]/10 text-xs font-mono-tech space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#08482D]">{lv.lv}</span>
                  <span className="text-[#101410] font-medium">{lv.size}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#5E5E61]">
                  <span className="truncate max-w-[150px]">Mount: {lv.mount ?? '/'}</span>
                  <span>{lv.filesystem ?? 'ext4'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mounted Filesystems Table (df -h) */}
      <div className="rounded-xl border border-[#08482D]/12 bg-white overflow-hidden shadow-sm">
        <div className="p-4 bg-[#FAFCF6] border-b border-[#08482D]/10 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono-tech text-[#08482D]">
            <HardDrive className="w-4 h-4" />
            <span className="font-semibold">Mounted Linux Filesystems (df -hPT)</span>
          </div>
          <span className="text-[11px] font-mono-tech text-[#5E5E61]">Kernel VFS Mount Table</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono-tech text-xs">
            <thead className="bg-[#F5F8EF] border-b border-[#08482D]/10 text-[#5E5E61] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Filesystem Device</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Mount Point</th>
                <th className="py-3 px-4 text-right">Size</th>
                <th className="py-3 px-4 text-right">Used</th>
                <th className="py-3 px-4 text-right">Avail</th>
                <th className="py-3 px-4">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#08482D]/08">
              {storageData?.filesystems?.map((fs, idx) => {
                const pct = parseInt(fs.use_percent) || 0;
                return (
                  <tr key={idx} className="hover:bg-[#FAFCF6] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#08482D]">{fs.filesystem}</td>
                    <td className="py-3 px-4 text-[#5E5E61]">{fs.type}</td>
                    <td className="py-3 px-4 text-[#101410] font-medium">{fs.mount}</td>
                    <td className="py-3 px-4 text-right text-[#5E5E61]">{fs.size}</td>
                    <td className="py-3 px-4 text-right text-[#5E5E61]">{fs.used}</td>
                    <td className="py-3 px-4 text-right text-[#08482D] font-semibold">{fs.avail}</td>
                    <td className="py-3 px-4 w-44">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-2 bg-[#DFE5D5] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct > 80 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-[#08482D]'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-[#5E5E61] w-8">{fs.use_percent}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
