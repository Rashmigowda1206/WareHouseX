import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Terminal,
  Edit2,
  Trash2,
  Search,
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderGit2,
  Layers,
  KeyRound
} from 'lucide-react';
import { employeeService } from '../services';
import { User, LinuxSystemAccount, LinuxGroup } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

interface EmployeesProps {
  currentUserRole?: string;
}

export const Employees: React.FC<EmployeesProps> = ({ currentUserRole = 'admin' }) => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [linuxAccounts, setLinuxAccounts] = useState<LinuxSystemAccount[]>([]);
  const [linuxGroups, setLinuxGroups] = useState<LinuxGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'employees' | 'linux'>('employees');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    role: 'staff',
    status: 'active',
    password: '',
    sync_linux: true,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await employeeService.getEmployees({ search: searchQuery });
      setEmployees(res.employees || []);
      setLinuxAccounts(res.linux_system_accounts || []);

      // Also fetch linux groups
      try {
        const groupsRes = await employeeService.getLinuxGroups();
        if (groupsRes && groupsRes.groups) {
          setLinuxGroups(groupsRes.groups);
        }
      } catch (err) {
        console.warn('Failed fetching linux groups:', err);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  // Handle Linux User Lock
  const handleLockLinuxUser = async (username: string) => {
    setIsProcessingAction(username);
    try {
      const res = await employeeService.lockLinuxUser(username);
      setActionNotice({
        type: 'success',
        message: res.message || `Linux account ${username} successfully locked (usermod -L)`,
      });
      loadData();
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || `Failed to lock account ${username}`,
      });
    } finally {
      setIsProcessingAction(null);
    }
  };

  // Handle Linux User Unlock
  const handleUnlockLinuxUser = async (username: string) => {
    setIsProcessingAction(username);
    try {
      const res = await employeeService.unlockLinuxUser(username);
      setActionNotice({
        type: 'success',
        message: res.message || `Linux account ${username} unlocked (usermod -U)`,
      });
      loadData();
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || `Failed to unlock account ${username}`,
      });
    } finally {
      setIsProcessingAction(null);
    }
  };

  // Handle Shell Change
  const handleChangeShell = async (username: string, newShell: string) => {
    setIsProcessingAction(username);
    try {
      const res = await employeeService.changeLinuxUserShell(username, newShell);
      setActionNotice({
        type: 'success',
        message: res.message || `Login shell of ${username} updated to ${newShell}`,
      });
      loadData();
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || `Failed to change shell for ${username}`,
      });
    } finally {
      setIsProcessingAction(null);
    }
  };

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData({
      username: '',
      full_name: '',
      email: '',
      role: 'staff',
      status: 'active',
      password: '',
      sync_linux: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: User) => {
    setEditingEmployee(emp);
    setFormData({
      username: emp.username,
      full_name: emp.full_name,
      email: emp.email,
      role: emp.role,
      status: emp.status,
      password: '',
      sync_linux: false,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await employeeService.updateEmployee(editingEmployee.id, formData as any);
        setActionNotice({
          type: 'success',
          message: `Updated profile for @${editingEmployee.username}`,
        });
      } else {
        const res = await employeeService.createEmployee(formData as any);
        setActionNotice({
          type: 'success',
          message: `Provisioned employee @${formData.username}. ${res.linux_sync || ''}`,
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error saving employee');
    }
  };

  const handleOpenDelete = (emp: User) => {
    setEmployeeToDelete(emp);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      await employeeService.deleteEmployee(employeeToDelete.id);
      setActionNotice({
        type: 'success',
        message: `Revoked employee @${employeeToDelete.username} and purged corresponding credentials.`,
      });
      setIsDeleteDialogOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error deleting employee');
    }
  };

  // Filter Linux accounts by search query
  const filteredLinuxAccounts = linuxAccounts.filter((acc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      acc.username.toLowerCase().includes(q) ||
      acc.home.toLowerCase().includes(q) ||
      acc.shell.toLowerCase().includes(q) ||
      (acc.groups && acc.groups.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold tracking-tight text-[#101410] flex items-center space-x-2">
            <Users className="w-6 h-6 text-[#08482D]" />
            <span>Employee & Linux User Management</span>
          </h2>
          <p className="text-xs font-mono-tech text-[#5E5E61] mt-1">
            Role-based warehouse authentication synchronized with Ubuntu Linux POSIX system accounts (/etc/passwd, /etc/group)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#08482D] hover:bg-[#063722] text-xs font-mono-tech font-bold text-white shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision Employee</span>
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between font-mono-tech text-xs transition-all ${
            actionNotice.type === 'success'
              ? 'bg-[#EAF3DE] border border-[#08482D]/20 text-[#08482D]'
              : 'bg-[#FEE2E2] border border-[#DC2626]/20 text-[#DC2626]'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-[11px] font-bold underline hover:opacity-75 cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* View Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#FFFFFF] border border-[#08482D]/12 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-2 bg-[#F5F8EF] p-1 rounded-xl border border-[#08482D]/10 text-xs font-mono-tech">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
              activeTab === 'employees'
                ? 'bg-[#08482D] text-white shadow-xs'
                : 'text-[#5E5E61] hover:text-[#101410]'
            }`}
          >
            Warehouse Staff ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('linux')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 font-bold ${
              activeTab === 'linux'
                ? 'bg-[#08482D] text-white shadow-xs'
                : 'text-[#5E5E61] hover:text-[#101410]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Linux System Accounts ({linuxAccounts.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#5E5E61] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employees or Linux users..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAFCF6] border border-[#08482D]/18 rounded-xl text-xs font-mono-tech text-[#101410] placeholder-[#A3A3A3] focus:outline-none focus:border-[#08482D]"
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. WAREHOUSE STAFF VIEW */}
      {/* ============================================================ */}
      {activeTab === 'employees' ? (
        <div className="rounded-3xl border border-[#08482D]/12 bg-[#FFFFFF] overflow-hidden shadow-xs">
          <table className="w-full text-left font-mono-tech text-xs">
            <thead className="bg-[#FAFCF6] border-b border-[#08482D]/12 text-[#5E5E61] uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Operator</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">Role Designation</th>
                <th className="py-3.5 px-4">Linux User / Group</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#08482D]/8">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#5E5E61]">
                    Loading personnel records...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#5E5E61]">
                    No employees found matching filter.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#F8FAF4] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#101410]">{emp.full_name}</div>
                      <div className="text-[10px] text-[#5E5E61]">@{emp.username}</div>
                    </td>
                    <td className="py-3 px-4 text-[#5E5E61]">{emp.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase bg-[#DAE7C7] text-[#08482D] border-[#08482D]/20">
                        {emp.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#5E5E61]">
                      <div className="flex items-center space-x-1.5">
                        <Terminal className="w-3.5 h-3.5 text-[#08482D]" />
                        <span className="text-[#08482D] font-bold">{emp.linux_user || 'none'}</span>
                        <span className="text-[#A3A3A3]">/</span>
                        <span className="text-[#5E5E61]">{emp.linux_group || 'none'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={emp.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          title="Edit details"
                          className="p-1.5 rounded-lg bg-[#F5F8EF] hover:bg-[#DAE7C7] text-[#08482D] border border-[#08482D]/15 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(emp)}
                          title="Delete employee"
                          className="p-1.5 rounded-lg bg-[#F5F8EF] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#08482D]/15 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* ============================================================ */
        /* 2. LINUX SYSTEM ACCOUNTS & PRIVILEGE MANAGEMENT VIEW */
        /* ============================================================ */
        <div className="space-y-6">
          {/* Security Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#08482D]/12 shadow-xs">
              <div className="text-[11px] font-mono-tech text-[#5E5E61] uppercase font-bold">
                Total System Accounts
              </div>
              <div className="text-xl font-heading font-black text-[#08482D] mt-1">
                {linuxAccounts.length}
              </div>
              <div className="text-[10px] font-mono-tech text-[#A3A3A3] mt-0.5">
                POSIX UID ≥ 1000
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#08482D]/12 shadow-xs">
              <div className="text-[11px] font-mono-tech text-[#5E5E61] uppercase font-bold">
                Interactive Shells
              </div>
              <div className="text-xl font-heading font-black text-[#08482D] mt-1">
                {linuxAccounts.filter((a) => a.shell === '/bin/bash').length}
              </div>
              <div className="text-[10px] font-mono-tech text-[#A3A3A3] mt-0.5">
                /bin/bash enabled
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#08482D]/12 shadow-xs">
              <div className="text-[11px] font-mono-tech text-[#5E5E61] uppercase font-bold">
                Locked / Restricted
              </div>
              <div className="text-xl font-heading font-black text-[#B45309] mt-1">
                {linuxAccounts.filter((a) => a.status === 'locked' || a.shell.includes('nologin')).length}
              </div>
              <div className="text-[10px] font-mono-tech text-[#A3A3A3] mt-0.5">
                /usr/sbin/nologin
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#08482D]/12 shadow-xs">
              <div className="text-[11px] font-mono-tech text-[#5E5E61] uppercase font-bold">
                Security Groups
              </div>
              <div className="text-xl font-heading font-black text-[#101410] mt-1">
                {linuxGroups.length > 0 ? linuxGroups.length : 5}
              </div>
              <div className="text-[10px] font-mono-tech text-[#A3A3A3] mt-0.5">
                wh-admins, wh-managers, ...
              </div>
            </div>
          </div>

          {/* Linux Security Groups & Access Control Matrix */}
          <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#08482D]/12 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#08482D]/10 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#08482D]" />
                <h3 className="text-sm font-heading font-extrabold text-[#101410]">
                  Ubuntu POSIX Security Groups & Sudo Privileges
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#DAE7C7] text-[#08482D] font-mono-tech text-[10px] font-bold">
                /etc/group
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {linuxGroups.map((grp) => (
                <div
                  key={grp.name}
                  className="p-3.5 rounded-2xl bg-[#FAFCF6] border border-[#08482D]/12 space-y-2 font-mono-tech text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#08482D] text-[12px] flex items-center space-x-1">
                      <span>{grp.name}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#F5F8EF] text-[#5E5E61] text-[10px] font-bold border border-[#08482D]/10">
                      GID: {grp.gid}
                    </span>
                  </div>

                  {grp.description && (
                    <p className="text-[10.5px] text-[#5E5E61] leading-relaxed">
                      {grp.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-[#08482D]/8">
                    <div className="text-[9.5px] uppercase text-[#A3A3A3] font-bold mb-1">
                      Active Members ({grp.members ? grp.members.length : 0})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {grp.members && grp.members.length > 0 ? (
                        grp.members.map((m) => (
                          <span
                            key={m}
                            className="px-2 py-0.5 rounded bg-[#EAF3DE] text-[#08482D] text-[10px] font-bold border border-[#08482D]/15"
                          >
                            {m}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-[#A3A3A3] italic">No members assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Linux Accounts Interactive Table */}
          <div className="rounded-3xl border border-[#08482D]/12 bg-[#FFFFFF] overflow-hidden shadow-xs">
            <div className="p-4 bg-[#FAFCF6] border-b border-[#08482D]/12 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-mono-tech text-[#08482D] font-bold">
                <Terminal className="w-4 h-4" />
                <span>Synchronized POSIX Accounts (/etc/passwd)</span>
              </div>
              <span className="text-[11px] font-mono-tech text-[#5E5E61]">
                Live usermod -L / usermod -U execution enabled
              </span>
            </div>

            <table className="w-full text-left font-mono-tech text-xs">
              <thead className="bg-[#FFFFFF] border-b border-[#08482D]/10 text-[#5E5E61] uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Linux Username</th>
                  <th className="py-3 px-4">UID : GID</th>
                  <th className="py-3 px-4">Home Directory</th>
                  <th className="py-3 px-4">Login Shell</th>
                  <th className="py-3 px-4">POSIX Groups</th>
                  <th className="py-3 px-4 text-center">Account Status</th>
                  <th className="py-3 px-4 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#08482D]/8">
                {filteredLinuxAccounts.map((acc) => {
                  const isLocked = acc.status === 'locked' || acc.shell.includes('nologin');
                  const isProcessing = isProcessingAction === acc.username;

                  return (
                    <tr key={acc.username} className="hover:bg-[#F8FAF4] transition-colors">
                      <td className="py-3 px-4 font-bold text-[#08482D]">
                        {acc.username}
                      </td>
                      <td className="py-3 px-4 text-[#5E5E61]">
                        {acc.uid} : {acc.gid}
                      </td>
                      <td className="py-3 px-4 text-[#101410]">{acc.home}</td>
                      <td className="py-3 px-4">
                        <select
                          value={acc.shell}
                          onChange={(e) => handleChangeShell(acc.username, e.target.value)}
                          disabled={isProcessing}
                          className="px-2 py-1 rounded bg-[#F5F8EF] border border-[#08482D]/15 text-[11px] font-bold text-[#08482D] cursor-pointer focus:outline-none"
                        >
                          <option value="/bin/bash">/bin/bash (Full Shell)</option>
                          <option value="/usr/sbin/nologin">/usr/sbin/nologin (Blocked)</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-[#5E5E61] text-[11px]">
                        <div className="flex flex-wrap gap-1">
                          {acc.groups.split(' ').map((g) => (
                            <span
                              key={g}
                              className="px-1.5 py-0.5 rounded bg-[#FAFCF6] border border-[#08482D]/10 text-[10px]"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={isLocked ? 'locked' : 'active'} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isLocked ? (
                            <button
                              onClick={() => handleUnlockLinuxUser(acc.username)}
                              disabled={isProcessing}
                              title="Unlock account (usermod -U)"
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#EAF3DE] hover:bg-[#DAE7C7] text-[#08482D] border border-[#08482D]/20 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Unlock</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleLockLinuxUser(acc.username)}
                              disabled={isProcessing || acc.username === 'whx_admin'}
                              title={
                                acc.username === 'whx_admin'
                                  ? 'Root admin account cannot be locked'
                                  : 'Lock account (usermod -L)'
                              }
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]/20 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Lock</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provision / Edit Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? `Edit Employee: ${editingEmployee.username}` : 'Provision New Warehouse Employee'}
        subtitle="Synchronizes user record with Linux security groups and access controls"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4 font-mono-tech text-xs">
          <div>
            <label className="block text-[#5E5E61] mb-1 font-bold">Username (Login ID)</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={!!editingEmployee}
              className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-xl text-[#101410] font-bold disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-[#5E5E61] mb-1 font-bold">Full Legal Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-xl text-[#101410] font-bold font-sans"
            />
          </div>

          <div>
            <label className="block text-[#5E5E61] mb-1 font-bold">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-xl text-[#101410]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#5E5E61] mb-1 font-bold">Assigned Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-xl text-[#101410] font-bold cursor-pointer"
              >
                <option value="staff">Warehouse Staff (wh-staff)</option>
                <option value="manager">Warehouse Manager (wh-managers)</option>
                <option value="admin">Administrator (wh-admins + sudo)</option>
              </select>
            </div>
            <div>
              <label className="block text-[#5E5E61] mb-1 font-bold">Account Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-xl text-[#101410] font-bold cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#5E5E61] mb-1 font-bold">
              {editingEmployee ? 'Update Password (leave blank to keep unchanged)' : 'Initial Temporary Password'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingEmployee}
              placeholder={editingEmployee ? '••••••••' : 'Minimum 8 characters'}
              className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-xl text-[#101410]"
            />
          </div>

          {!editingEmployee && (
            <label className="flex items-center space-x-2 pt-1 text-[#101410] font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={formData.sync_linux}
                onChange={(e) => setFormData({ ...formData, sync_linux: e.target.checked })}
                className="rounded bg-[#FAFCF6] border-[#08482D]/30 text-[#08482D] focus:ring-0"
              />
              <span>Create synchronized Ubuntu system user in /etc/passwd & /etc/group</span>
            </label>
          )}

          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-[#08482D]/12">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#08482D]/20 text-[#5E5E61] hover:bg-[#F5F8EF] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#08482D] hover:bg-[#063722] font-bold text-white cursor-pointer shadow-sm"
            >
              {editingEmployee ? 'Save Changes' : 'Provision User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Employee Revocation"
        message={`Are you sure you want to delete employee @${employeeToDelete?.username}? This will revoke web access and remove the corresponding Linux system user.`}
        confirmLabel="Revoke & Delete"
        confirmVariant="danger"
      />
    </div>
  );
};
