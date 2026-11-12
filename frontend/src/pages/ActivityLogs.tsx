import React, { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  User,
  Shield,
  Layers
} from 'lucide-react';
import { logsService } from '../services';
import { ActivityLog, UserRole } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

interface ActivityLogsProps {
  userRole?: UserRole;
}

export const ActivityLogs: React.FC<ActivityLogsProps> = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await logsService.getLogs({
        module: selectedModule,
        severity: selectedSeverity,
        search: searchQuery,
        limit: 200,
      });
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedModule, selectedSeverity, searchQuery]);

  const handleExportCSV = async () => {
    try {
      const csvData = await logsService.exportLogs();
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `warehousex_audit_log_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export audit logs');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold tracking-tight text-[#101410] flex items-center space-x-2">
            <FileText className="w-6 h-6 text-[#08482D]" />
            <span>Administrative Audit Trail & Activity Logs</span>
          </h2>
          <p className="text-xs font-mono-tech text-[#5E5E61] mt-1">
            Immutable system logs recording employee events, inventory modifications, TAR backups, and firewall actions
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadLogs}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#F5F8EF] border border-[#08482D]/20 text-xs font-mono-tech text-[#101410] shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#08482D] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Logs</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#08482D] hover:bg-[#063823] text-xs font-mono-tech font-semibold text-white shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-[#08482D]/12 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#5E5E61] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, details, user, IP..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-xs font-mono-tech text-[#101410] placeholder-[#5E5E61]/60 focus:outline-none focus:border-[#08482D]"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* Module Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono-tech text-[#5E5E61] uppercase hidden sm:inline">Module:</span>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg px-3 py-2 text-xs font-mono-tech text-[#101410] focus:outline-none focus:border-[#08482D] cursor-pointer"
            >
              <option value="all">All Modules</option>
              <option value="auth">Authentication</option>
              <option value="inventory">Inventory</option>
              <option value="employees">Employees</option>
              <option value="backup">Backup</option>
              <option value="recovery">Recovery</option>
              <option value="security">Security</option>
              <option value="storage">Storage</option>
              <option value="system">System</option>
              <option value="settings">Settings</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono-tech text-[#5E5E61] uppercase hidden sm:inline">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg px-3 py-2 text-xs font-mono-tech text-[#101410] focus:outline-none focus:border-[#08482D] cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="info">INFO</option>
              <option value="success">SUCCESS</option>
              <option value="warning">WARNING</option>
              <option value="critical">CRITICAL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-[#08482D]/12 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono-tech text-xs">
            <thead className="bg-[#F5F8EF] border-b border-[#08482D]/10 text-[#5E5E61] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-center">Severity</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Operator / User</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Details & Parameters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#08482D]/08">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5E5E61]">
                    Loading log journal...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5E5E61]">
                    No activity logs found matching filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-[#FAFCF6] transition-colors">
                    <td className="py-3 px-4 text-[#5E5E61] whitespace-nowrap text-[11px]">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={l.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4 uppercase text-[#08482D] font-semibold text-[11px]">
                      {l.module}
                    </td>
                    <td className="py-3 px-4 text-[#101410] font-bold">{l.action}</td>
                    <td className="py-3 px-4 text-[#5E5E61]">
                      <span className="px-2 py-0.5 rounded bg-[#FAFCF6] border border-[#08482D]/15 text-[#101410] text-[11px]">
                        {l.username}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#5E5E61] text-[11px]">{l.ip_address}</td>
                    <td className="py-3 px-4 text-[#5E5E61] leading-relaxed max-w-md">
                      {l.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
