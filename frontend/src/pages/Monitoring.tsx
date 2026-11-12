import React, { useEffect, useState } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Clock,
  Radio,
  Server,
  Terminal,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Network,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { monitoringService } from '../services';
import { SystemMetrics, UserRole } from '../types';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { LiveTelemetryChart } from '../components/charts/LiveTelemetryChart';

interface MonitoringProps {
  userRole?: UserRole;
}

export const Monitoring: React.FC<MonitoringProps> = ({ userRole = 'staff' }) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [isUpdatingService, setIsUpdatingService] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const [mRes, hRes, pRes] = await Promise.all([
        monitoringService.getMetrics(),
        monitoringService.getHistory(),
        monitoringService.getProcesses(),
      ]);
      setMetrics(mRes);
      setHistory(hRes.history || []);
      setProcesses(pRes.processes || []);
    } catch (err) {
      console.error('Failed to fetch telemetry:', err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isAutoRefresh, refreshInterval]);

  const handleServiceAction = async (serviceName: string, action: 'restart' | 'reload') => {
    if (userRole !== 'admin') {
      alert('Only administrators can control system services');
      return;
    }
    setIsUpdatingService(`${serviceName}-${action}`);
    try {
      const res = await monitoringService.manageService(serviceName, action);
      alert(`Service ${serviceName}: ${res.message}`);
      fetchMetrics();
    } catch (err: any) {
      alert(err.message || 'Service operation failed');
    } finally {
      setIsUpdatingService(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold tracking-tight text-[#101410] flex items-center space-x-2">
            <Activity className="w-6 h-6 text-[#08482D]" />
            <span>Ubuntu System Monitoring & Daemon Telemetry</span>
          </h2>
          <p className="text-xs font-mono-tech text-[#5E5E61] mt-1">
            Real-time Linux kernel telemetry, hardware load averages, virtual memory pools, and systemd units
          </p>
        </div>

        {/* Polling / Refresh Control Bar */}
        <div className="flex items-center space-x-2 font-mono-tech text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#08482D]/20 text-[#101410] shadow-sm">
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className="flex items-center space-x-1 hover:text-[#08482D] cursor-pointer"
            >
              {isAutoRefresh ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pause Polling</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-[#08482D]" />
                  <span>Resume</span>
                </>
              )}
            </button>
            <span className="text-[#5E5E61]/40">|</span>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-[#08482D] font-bold focus:outline-none cursor-pointer"
            >
              <option value={3000}>3s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
            </select>
          </div>

          <button
            onClick={fetchMetrics}
            className="p-2 rounded-lg bg-white hover:bg-[#F5F8EF] border border-[#08482D]/20 text-[#101410] shadow-sm cursor-pointer"
            title="Manual Poll"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#08482D]" />
          </button>
        </div>
      </div>

      {/* Primary Hardware Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="CPU Utilization"
          value={`${metrics?.cpu?.percent ?? 24}%`}
          subtitle={`8 Cores • ${metrics?.cpu?.temperature_c ?? 44.5}°C`}
          icon={Cpu}
          accentColor="cyan"
        />
        <StatCard
          title="RAM Utilization"
          value={`${metrics?.memory?.percent ?? 43}%`}
          subtitle={
            metrics?.memory
              ? `${(metrics.memory.used_mb / 1024).toFixed(1)} / ${(metrics.memory.total_mb / 1024).toFixed(1)} GB Used`
              : '7.1 / 16.0 GB Used'
          }
          icon={HardDrive}
          accentColor="blue"
        />
        <StatCard
          title="Load Average (1m/5m/15m)"
          value={`${metrics?.load_average?.['1m'] ?? 0.42}`}
          subtitle={`${metrics?.load_average?.['5m'] ?? 0.55} / ${metrics?.load_average?.['15m'] ?? 0.61}`}
          icon={Activity}
          accentColor="emerald"
        />
        <StatCard
          title="Network Throughput"
          value={metrics?.network?.rx_speed_kbps ? `${metrics.network.rx_speed_kbps} KB/s` : '1.4 MB/s'}
          subtitle={metrics?.network?.interface || 'ens3 (10Gbps SFP+)'}
          icon={Network}
          accentColor="purple"
        />
      </div>

      {/* Live Chart Row */}
      <div className="bg-white border border-[#08482D]/12 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-[#08482D]" />
            <div>
              <h3 className="text-sm font-semibold font-heading text-[#101410]">Continuous CPU & Memory Telemetry Stream</h3>
              <p className="text-[11px] font-mono-tech text-[#5E5E61]">
                Samples polled from /proc/stat and /proc/meminfo at {refreshInterval / 1000}s intervals
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono-tech">
            <span className="flex items-center space-x-1.5 text-[#08482D] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#08482D] inline-block" />
              <span>CPU: {metrics?.cpu?.percent ?? 24}%</span>
            </span>
            <span className="flex items-center space-x-1.5 text-teal-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
              <span>RAM: {metrics?.memory?.percent ?? 43}%</span>
            </span>
          </div>
        </div>

        <LiveTelemetryChart data={history} />
      </div>

      {/* Running Daemons & Process Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Systemd Services Manager (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-[#08482D]/12 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-mono-tech text-[#08482D]">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4" />
              <h3 className="font-semibold font-heading text-[#101410]">Systemd Daemons & Services</h3>
            </div>
            <span className="text-[11px] text-[#5E5E61]">Allowlisted Controls</span>
          </div>

          <div className="space-y-2">
            {[
              { name: 'ssh', label: 'OpenSSH Server (sshd.service)', port: 22 },
              { name: 'ufw', label: 'UFW Firewall (ufw.service)', port: 0 },
              { name: 'cron', label: 'CRON Scheduler (cron.service)', port: 0 },
              { name: 'nginx', label: 'Nginx Web Server', port: 80 },
              { name: 'warehousex-api', label: 'WareHouseX API Daemon', port: 5000 },
              { name: 'systemd-journald', label: 'Systemd Log Journal', port: 0 },
            ].map((srv) => (
              <div
                key={srv.name}
                className="p-3 rounded-lg bg-[#FAFCF6] border border-[#08482D]/10 text-xs font-mono-tech flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-[#101410]">{srv.label}</div>
                  <div className="text-[10px] text-[#5E5E61] flex items-center space-x-2 mt-0.5">
                    <StatusBadge status="running" size="sm" />
                    {srv.port > 0 && <span>Port: {srv.port}</span>}
                  </div>
                </div>

                {userRole === 'admin' && (
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleServiceAction(srv.name, 'restart')}
                      disabled={isUpdatingService === `${srv.name}-restart`}
                      title="Restart Service (systemctl restart)"
                      className="px-2 py-1 rounded bg-white hover:bg-[#DAE7C7]/50 text-[#08482D] border border-[#08482D]/20 transition-colors text-[10px] cursor-pointer"
                    >
                      Restart
                    </button>
                    <button
                      onClick={() => handleServiceAction(srv.name, 'reload')}
                      disabled={isUpdatingService === `${srv.name}-reload`}
                      title="Reload Service Config (systemctl reload)"
                      className="px-2 py-1 rounded bg-white hover:bg-[#F5F8EF] text-[#5E5E61] border border-[#08482D]/20 transition-colors text-[10px] cursor-pointer"
                    >
                      Reload
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top Active Processes (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-[#08482D]/12 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-mono-tech text-[#08482D]">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4" />
              <h3 className="font-semibold font-heading text-[#101410]">Active Linux Kernel Processes</h3>
            </div>
            <span className="text-[11px] text-[#5E5E61]">Top by Resource Utilization</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono-tech text-xs">
              <thead className="bg-[#F5F8EF] border-b border-[#08482D]/10 text-[#5E5E61] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">PID</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Process Command</th>
                  <th className="py-2.5 px-3 text-right">CPU %</th>
                  <th className="py-2.5 px-3 text-right">MEM %</th>
                  <th className="py-2.5 px-3 text-center">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#08482D]/08">
                {processes.map((p, idx) => (
                  <tr key={idx} className="hover:bg-[#FAFCF6] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#08482D]">{p.pid}</td>
                    <td className="py-2.5 px-3 text-[#5E5E61]">{p.user}</td>
                    <td className="py-2.5 px-3 text-[#101410] truncate max-w-[200px]" title={p.name}>
                      {p.name}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#08482D] font-semibold">{p.cpu}%</td>
                    <td className="py-2.5 px-3 text-right text-teal-700 font-semibold">{p.mem}%</td>
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
