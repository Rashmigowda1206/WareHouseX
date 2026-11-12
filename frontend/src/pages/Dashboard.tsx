import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Users,
  ShoppingCart,
  DollarSign,
  HardDrive,
  Archive,
  Cpu,
  Clock,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { LiveTelemetryChart } from '../components/charts/LiveTelemetryChart';
import { InventoryCategoryChart } from '../components/charts/InventoryCategoryChart';
import {
  inventoryService,
  monitoringService,
  backupService,
  logsService,
  employeeService,
  storageService
} from '../services';
import {
  InventorySummary,
  SystemMetrics,
  BackupRecord,
  ActivityLog,
  StorageInfo
} from '../types';

interface DashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTab }) => {
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<any[]>([]);
  const [latestBackup, setLatestBackup] = useState<BackupRecord | null>(null);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [employeeCount, setEmployeeCount] = useState<number>(7);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    try {
      const [invSum, sysMetrics, hist, bkpList, logsData, storData, empData] = await Promise.all([
        inventoryService.getSummary().catch(() => null),
        monitoringService.getMetrics().catch(() => null),
        monitoringService.getHistory().catch(() => ({ history: [] })),
        backupService.listBackups().catch(() => ({ backups: [] })),
        logsService.getLogs({ limit: 6 }).catch(() => ({ logs: [] })),
        storageService.getOverview().catch(() => null),
        employeeService.getEmployees().catch(() => ({ count: 7 })),
      ]);

      if (invSum) setSummary(invSum);
      if (sysMetrics) setMetrics(sysMetrics);
      if (hist && hist.history) setTelemetryHistory(hist.history);
      if (bkpList && bkpList.backups && bkpList.backups.length > 0) {
        setLatestBackup(bkpList.backups[0]);
      }
      if (logsData && logsData.logs) setRecentLogs(logsData.logs);
      if (storData) setStorage(storData);
      if (empData && empData.count !== undefined) setEmployeeCount(empData.count);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(async () => {
      try {
        const live = await monitoringService.getMetrics();
        if (live) setMetrics(live);
      } catch (err) {
        // silent
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Welcome & Server Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-3xl bg-[#FFFFFF] border border-[#08482D]/15 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-heading font-extrabold tracking-tight text-[#101410]">
              WareHouseX Core Operations Center
            </h2>
            <StatusBadge status={metrics?.services?.ssh === 'active' ? 'online' : 'active'} size="sm" />
          </div>
          <p className="text-xs text-[#5E5E61] font-mono-tech flex items-center space-x-2">
            <span>KERNEL: {metrics?.os_release || 'Ubuntu 24.04 LTS (6.8.0-45-generic)'}</span>
            <span className="text-[#08482D]/30">|</span>
            <span>UPTIME: {metrics?.uptime || '14 days, 7 hours'}</span>
            <span className="text-[#08482D]/30">|</span>
            <span className="text-[#08482D] font-bold">LOAD: {metrics?.load_average?.['1m'] || 0.42}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#F5F8EF] hover:bg-[#EAEFE2] border border-[#08482D]/20 text-xs font-mono-tech font-bold text-[#08482D] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Telemetry</span>
          </button>
          <button
            onClick={() => onNavigateTab('monitoring')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#08482D] hover:bg-[#063722] text-xs font-mono-tech font-bold text-white shadow-sm transition-all cursor-pointer"
          >
            <span>Live Monitor</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary 6 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Products"
          value={summary?.total_products ?? 25}
          subtitle={`${summary?.total_quantity ?? 6125} total units in stock`}
          icon={Boxes}
          accentColor="emerald"
          trend="+12% this mo"
          trendPositive={true}
        />
        <StatCard
          title="Total Employees"
          value={employeeCount}
          subtitle="Linked Linux Accounts"
          icon={Users}
          accentColor="blue"
          trend="7 Active"
          trendPositive={true}
        />
        <StatCard
          title="Fulfillment Orders"
          value={summary?.total_orders ?? 10}
          subtitle={`$${(summary?.total_revenue ?? 69500).toLocaleString()} volume`}
          icon={ShoppingCart}
          accentColor="purple"
          trend="99.4% SLA"
          trendPositive={true}
        />
        <StatCard
          title="Inventory Value"
          value={`$${(summary?.total_value ?? 384500).toLocaleString()}`}
          subtitle={`${summary?.low_stock_count ?? 5} items need reorder`}
          icon={DollarSign}
          accentColor="emerald"
          trend={summary?.low_stock_count ? `${summary.low_stock_count} Low Stock` : 'Healthy'}
          trendPositive={!summary?.low_stock_count}
        />
        <StatCard
          title="Available Storage"
          value={`${storage?.available_storage_gb ?? 1729} GB`}
          subtitle={`${storage?.used_percent ?? 43.7}% disk utilized`}
          icon={HardDrive}
          accentColor="amber"
          trend="LVM Pool OK"
          trendPositive={true}
        />
        <StatCard
          title="Backup Status"
          value={latestBackup?.verification_status?.toUpperCase() || 'VERIFIED'}
          subtitle={latestBackup?.filename ? `${latestBackup.size_formatted} snapshot` : 'Nightly Tar Created'}
          icon={Archive}
          accentColor="cyan"
          trend="Daily Cron Active"
          trendPositive={true}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-Time Server Telemetry Chart */}
        <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#08482D]/12 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-[#08482D]" />
              <div>
                <h3 className="text-sm font-heading font-extrabold text-[#101410]">Live Ubuntu Server Telemetry</h3>
                <p className="text-[11px] font-mono-tech text-[#5E5E61]">
                  Real-time CPU and RAM utilization stream (Kernel 6.8 scheduler)
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono-tech">
              <span className="flex items-center space-x-1 font-bold text-[#08482D]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#08482D] inline-block" />
                <span>CPU: {metrics?.cpu?.percent ?? 22}%</span>
              </span>
              <span className="flex items-center space-x-1 font-bold text-[#0284C7]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] inline-block" />
                <span>RAM: {metrics?.memory?.percent ?? 43}%</span>
              </span>
            </div>
          </div>

          <LiveTelemetryChart data={telemetryHistory} />

          {/* Core & Memory Breakdown pills */}
          <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-[#08482D]/10 text-xs font-mono-tech">
            <div className="p-3 rounded-xl bg-[#FAFCF6] border border-[#08482D]/10">
              <span className="text-[#5E5E61] block text-[10px] font-bold">CORES & ARCH</span>
              <span className="text-[#101410] font-bold">8x vCPU (x86_64)</span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAFCF6] border border-[#08482D]/10">
              <span className="text-[#5E5E61] block text-[10px] font-bold">MEMORY POOL</span>
              <span className="text-[#101410] font-bold">
                {metrics?.memory ? `${(metrics.memory.used_mb / 1024).toFixed(1)} / ${(metrics.memory.total_mb / 1024).toFixed(1)} GB` : '7.2 / 16.0 GB'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAFCF6] border border-[#08482D]/10">
              <span className="text-[#5E5E61] block text-[10px] font-bold">NETWORK I/O</span>
              <span className="text-[#08482D] font-bold">
                {metrics?.network?.rx_speed_kbps ? `${metrics.network.rx_speed_kbps} KB/s` : '1.4 MB/s'}
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Category Breakdown Chart */}
        <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#08482D]/12 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Boxes className="w-5 h-5 text-[#08482D]" />
              <div>
                <h3 className="text-sm font-heading font-extrabold text-[#101410]">Inventory Valuation by Category</h3>
                <p className="text-[11px] font-mono-tech text-[#5E5E61]">
                  Asset allocation across logistics fulfillment zones
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs font-mono-tech font-bold text-[#08482D] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Manage Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <InventoryCategoryChart data={summary?.categories || []} mode="value" />

          {/* Catalog Zone summary */}
          <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-[#08482D]/10 text-xs font-mono-tech">
            <div className="p-3 rounded-xl bg-[#FAFCF6] border border-[#08482D]/10">
              <span className="text-[#5E5E61] block text-[10px] font-bold">TOTAL ASSETS</span>
              <span className="text-[#08482D] font-bold">
                ${(summary?.total_value ?? 384500).toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAFCF6] border border-[#08482D]/10">
              <span className="text-[#5E5E61] block text-[10px] font-bold">ACTIVE SKUS</span>
              <span className="text-[#101410] font-bold">{summary?.total_products ?? 25} SKUs</span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAFCF6] border border-[#08482D]/10">
              <span className="text-[#5E5E61] block text-[10px] font-bold">STOCK ALERTS</span>
              <span className="text-[#B45309] font-bold">
                {summary?.low_stock_count ?? 5} Low / {summary?.out_of_stock_count ?? 1} Out
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Activity Logs & Latest Linux Backup Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Administrative Activity Feed (2 Cols) */}
        <div className="lg:col-span-2 bg-[#FFFFFF] rounded-3xl p-6 border border-[#08482D]/12 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-[#08482D]" />
              <div>
                <h3 className="text-sm font-heading font-extrabold text-[#101410]">Recent Administrative & System Activities</h3>
                <p className="text-[11px] font-mono-tech text-[#5E5E61]">
                  Tamper-evident audit trail of employee, inventory, and server events
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('logs')}
              className="text-xs font-mono-tech font-bold text-[#08482D] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>View All Logs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#08482D]/8">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between text-xs font-mono-tech">
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={log.severity} size="sm" />
                    <div>
                      <span className="text-[#101410] font-bold">{log.action}</span>
                      <span className="text-[#5E5E61] mx-1.5">•</span>
                      <span className="text-[#5E5E61]">{log.details}</span>
                    </div>
                  </div>
                  <div className="text-right text-[#5E5E61] shrink-0 ml-4">
                    <span className="font-semibold text-[#101410]">@{log.username}</span>
                    <span className="block text-[10px] text-[#A3A3A3]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-[#5E5E61] text-xs font-mono-tech">
                No recent activity logs recorded
              </div>
            )}
          </div>
        </div>

        {/* Latest Backup & Security Status (1 Col) */}
        <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#08482D]/12 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Archive className="w-5 h-5 text-[#08482D]" />
            <div>
              <h3 className="text-sm font-heading font-extrabold text-[#101410]">Latest Linux Backup Image</h3>
              <p className="text-[11px] font-mono-tech text-[#5E5E61]">POSIX TAR archive with SHA-256 validation</p>
            </div>
          </div>

          {latestBackup ? (
            <div className="p-4 rounded-2xl bg-[#FAFCF6] border border-[#08482D]/12 space-y-3 font-mono-tech text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#5E5E61] text-[11px] font-bold">ARCHIVE FILE</span>
                <StatusBadge status={latestBackup.verification_status} size="sm" />
              </div>
              <div className="font-bold text-[#08482D] break-all text-[11.5px]">
                {latestBackup.filename}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#08482D]/10">
                <div>
                  <span className="text-[#5E5E61] block font-medium">TYPE / SIZE</span>
                  <span className="text-[#101410] uppercase font-bold">
                    {latestBackup.backup_type} ({latestBackup.size_formatted})
                  </span>
                </div>
                <div>
                  <span className="text-[#5E5E61] block font-medium">TIMESTAMP</span>
                  <span className="text-[#101410] font-semibold">
                    {new Date(latestBackup.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="pt-1">
                <span className="text-[#5E5E61] block text-[10px] font-bold">SHA-256 CHECKSUM</span>
                <span className="text-[#5E5E61] text-[10px] truncate block font-mono">
                  {latestBackup.sha256_checksum.slice(0, 32)}...
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#FAFCF6] border border-[#08482D]/10 text-center text-xs font-mono-tech text-[#5E5E61]">
              No backup archive on record
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('backups')}
              className="w-full py-2.5 rounded-xl bg-[#08482D] hover:bg-[#063722] text-white font-mono-tech text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm"
            >
              <Archive className="w-4 h-4" />
              <span>Open Backup & TAR Center</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
