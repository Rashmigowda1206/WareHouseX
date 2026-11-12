import React, { useEffect, useState } from 'react';
import {
  Archive,
  Plus,
  CheckCircle,
  Clock,
  ShieldCheck,
  Calendar,
  Terminal,
  Trash2,
  RefreshCw,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { backupService } from '../services';
import { BackupRecord, BackupSchedule, UserRole } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { TerminalView } from '../components/common/TerminalView';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

interface BackupsProps {
  userRole?: UserRole;
}

export const Backups: React.FC<BackupsProps> = ({ userRole = 'staff' }) => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Manual Backup Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [backupType, setBackupType] = useState('full');
  const [backupNotes, setBackupNotes] = useState('Manual administrative snapshot');
  const [isCreating, setIsCreating] = useState(false);

  // Schedule Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState<{
    id?: number;
    schedule_type: 'daily' | 'weekly' | 'hourly';
    time_utc: string;
    cron_expr: string;
    retention_days: number;
    backup_type: string;
    enabled: number;
  }>({
    id: undefined,
    schedule_type: 'daily',
    time_utc: '02:00',
    cron_expr: '0 2 * * *',
    retention_days: 14,
    backup_type: 'full',
    enabled: 1,
  });

  // Verify and Delete state
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackupRecord | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const canManage = userRole === 'admin' || userRole === 'manager';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bkpRes, logsRes] = await Promise.all([
        backupService.listBackups(),
        backupService.getBackupLogs(),
      ]);
      setBackups(bkpRes.backups || []);
      setSchedules(bkpRes.schedules || []);
      setLogs(logsRes.logs || []);
    } catch (err) {
      console.error('Failed to load backup data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await backupService.createBackup(backupType, backupNotes);
      setIsCreateModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Backup creation failed');
    } finally {
      setIsCreating(false);
    }
  };

  const handleVerify = async (backup: BackupRecord) => {
    setVerifyingId(backup.id);
    try {
      const res = await backupService.verifyBackup(backup.id);
      alert(`Archive integrity status: ${res.status.toUpperCase()}\n${res.details?.message || 'Tar stream intact'}`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await backupService.saveSchedule(scheduleData);
      setIsScheduleModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update schedule');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await backupService.deleteBackup(deleteTarget.id);
      setIsDeleteDialogOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete backup archive');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold tracking-tight text-[#101410] flex items-center space-x-2">
            <Archive className="w-6 h-6 text-[#08482D]" />
            <span>Automated Backup Center & TAR Engine</span>
          </h2>
          <p className="text-xs font-mono-tech text-[#5E5E61] mt-1">
            POSIX TAR.GZ archive generation with SHA-256 cryptographic verification and Cron automation
          </p>
        </div>

        {canManage && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#F5F8EF] border border-[#08482D]/20 text-xs font-mono-tech text-[#101410] shadow-sm transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#08482D]" />
              <span>Configure Schedule</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#08482D] hover:bg-[#063823] text-xs font-mono-tech font-semibold text-white shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Manual Backup</span>
            </button>
          </div>
        )}
      </div>

      {/* Backup Schedule Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {schedules.map((sch) => (
          <div key={sch.id} className="p-4 bg-white border border-[#08482D]/12 rounded-xl shadow-sm space-y-2 font-mono-tech text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#101410] uppercase font-heading">{sch.schedule_type} Backup</span>
              <StatusBadge status={sch.enabled ? 'active' : 'inactive'} size="sm" />
            </div>
            <div className="flex items-center space-x-2 text-[#08482D]">
              <Clock className="w-3.5 h-3.5" />
              <span>CRON: {sch.cron_expr} ({sch.time_utc} UTC)</span>
            </div>
            <div className="text-[11px] text-[#5E5E61] flex items-center justify-between pt-2 border-t border-[#08482D]/10">
              <span>Retention: {sch.retention_days} Days</span>
              <span className="text-[#101410] font-semibold uppercase">{sch.backup_type} Target</span>
            </div>
          </div>
        ))}
      </div>

      {/* Backup History Table */}
      <div className="rounded-xl border border-[#08482D]/12 bg-white overflow-hidden shadow-sm">
        <div className="p-4 bg-[#FAFCF6] border-b border-[#08482D]/10 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono-tech text-[#08482D]">
            <Archive className="w-4 h-4" />
            <span className="font-semibold">Archived TAR Images in /var/backups/warehousex</span>
          </div>
          <span className="text-[11px] font-mono-tech text-[#5E5E61]">{backups.length} Registered Snapshots</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono-tech text-xs">
            <thead className="bg-[#F5F8EF] border-b border-[#08482D]/10 text-[#5E5E61] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Archive Filename</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Size</th>
                <th className="py-3 px-4 text-center">Integrity</th>
                <th className="py-3 px-4">SHA-256 Checksum</th>
                <th className="py-3 px-4">Created Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#08482D]/08">
              {backups.map((bkp) => (
                <tr key={bkp.id} className="hover:bg-[#FAFCF6] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#08482D]">{bkp.filename}</div>
                    {bkp.notes && <div className="text-[10px] text-[#5E5E61]">{bkp.notes}</div>}
                  </td>
                  <td className="py-3 px-4 uppercase text-[#5E5E61] font-medium">
                    {bkp.backup_type}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-[#101410]">
                    {bkp.size_formatted}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={bkp.verification_status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-[10px] text-[#5E5E61] truncate max-w-[160px]" title={bkp.sha256_checksum}>
                    {bkp.sha256_checksum ? `${bkp.sha256_checksum.slice(0, 16)}...` : 'n/a'}
                  </td>
                  <td className="py-3 px-4 text-[#5E5E61] text-[11px]">
                    {new Date(bkp.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => handleVerify(bkp)}
                        disabled={verifyingId === bkp.id}
                        title="Verify TAR stream integrity (tar -tzf)"
                        className="p-1.5 rounded-lg bg-[#FAFCF6] hover:bg-[#DAE7C7]/50 text-[#08482D] border border-[#08482D]/20 transition-colors cursor-pointer"
                      >
                        <FileCheck className={`w-3.5 h-3.5 ${verifyingId === bkp.id ? 'animate-spin' : ''}`} />
                      </button>
                      {userRole === 'admin' && (
                        <button
                          onClick={() => {
                            setDeleteTarget(bkp);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Delete archive from storage"
                          className="p-1.5 rounded-lg bg-[#FAFCF6] hover:bg-rose-50 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Terminal Console Logs for Backup Executions */}
      <div>
        <TerminalView
          title="systemd / cron daemon - backup_create.sh log stream"
          command="/backend/scripts/backup_create.sh full /var/backups/warehousex"
          logs={logs}
          maxHeight="max-h-60"
        />
      </div>

      {/* Create Backup Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Execute Manual TAR Backup"
        subtitle="Generates verified compressed archive using Linux Bash integration script"
        maxWidth="md"
      >
        <form onSubmit={handleCreateBackup} className="space-y-4 font-mono-tech text-xs">
          <div>
            <label className="block text-[#5E5E61] font-semibold mb-1">Target Payload</label>
            <select
              value={backupType}
              onChange={(e) => setBackupType(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#08482D]"
            >
              <option value="full">Full System & Data (Database + Catalog + Configs)</option>
              <option value="database">Database Only (SQLite snapshot with WAL flush)</option>
              <option value="inventory">Inventory Catalog (SKUs, Zones, Quantities)</option>
              <option value="config">System Configurations (UFW, SSH, CRON)</option>
            </select>
          </div>

          <div>
            <label className="block text-[#5E5E61] font-semibold mb-1">Backup Operator Notes</label>
            <input
              type="text"
              value={backupNotes}
              onChange={(e) => setBackupNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] focus:outline-none focus:ring-1 focus:ring-[#08482D]"
            />
          </div>

          <div className="p-3 bg-[#DAE7C7]/40 border border-[#08482D]/20 rounded-lg text-[11px] text-[#08482D] leading-relaxed">
            Archive will be compiled directly to <span className="font-bold text-[#101410]">/var/backups/warehousex</span> and checked with SHA-256 verification before registration.
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-[#08482D]/10">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isCreating}
              className="px-4 py-2 rounded-lg border border-[#08482D]/20 text-[#5E5E61] hover:bg-[#F5F8EF] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2 rounded-lg bg-[#08482D] hover:bg-[#063823] font-semibold text-white cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isCreating ? 'Packaging Archive...' : 'Compile Archive'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule Configuration Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Configure Automated Backup Cron"
        subtitle="Installs scheduled daemon timer for hands-free warehouse protection"
        maxWidth="md"
      >
        <form onSubmit={handleSaveSchedule} className="space-y-4 font-mono-tech text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#5E5E61] font-semibold mb-1">Schedule Frequency</label>
              <select
                value={scheduleData.schedule_type}
                onChange={(e) => setScheduleData({ ...scheduleData, schedule_type: e.target.value as 'daily' | 'weekly' | 'hourly' })}
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#08482D]"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
            <div>
              <label className="block text-[#5E5E61] font-semibold mb-1">Daily Trigger Time (UTC)</label>
              <input
                type="text"
                value={scheduleData.time_utc}
                onChange={(e) => setScheduleData({ ...scheduleData, time_utc: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] focus:outline-none focus:ring-1 focus:ring-[#08482D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#5E5E61] font-semibold mb-1">Retention Policy (Days)</label>
              <input
                type="number"
                min="1"
                max="90"
                value={scheduleData.retention_days}
                onChange={(e) => setScheduleData({ ...scheduleData, retention_days: parseInt(e.target.value) || 14 })}
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] focus:outline-none focus:ring-1 focus:ring-[#08482D]"
              />
            </div>
            <div>
              <label className="block text-[#5E5E61] font-semibold mb-1">Payload Type</label>
              <select
                value={scheduleData.backup_type}
                onChange={(e) => setScheduleData({ ...scheduleData, backup_type: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#08482D]"
              >
                <option value="full">Full System</option>
                <option value="database">Database</option>
                <option value="inventory">Inventory</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-[#08482D]/10">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#08482D]/20 text-[#5E5E61] hover:bg-[#F5F8EF] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#08482D] hover:bg-[#063823] font-semibold text-white cursor-pointer shadow-sm"
            >
              Save Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Backup Archive Removal"
        message={`Are you sure you want to permanently delete archive ${deleteTarget?.filename}? This physically removes the file from local storage and deletes its cryptographic hash record.`}
        confirmLabel="Permanently Delete"
        confirmVariant="danger"
      />
    </div>
  );
};
