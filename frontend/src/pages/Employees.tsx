import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Terminal,
  Edit2,
  Trash2,
  Search
} from 'lucide-react';
import { employeeService } from '../services';
import { User, LinuxSystemAccount } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

interface EmployeesProps {
  currentUserRole?: string;
}

export const Employees: React.FC<EmployeesProps> = ({ currentUserRole = 'admin' }) => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [linuxAccounts, setLinuxAccounts] = useState<LinuxSystemAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'employees' | 'linux'>('employees');

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
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

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
      } else {
        await employeeService.createEmployee(formData as any);
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
      setIsDeleteDialogOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error deleting employee');
    }
  };

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
            Role-based warehouse authentication synchronized with Ubuntu Linux system accounts and groups
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
            <span>Linux Accounts ({linuxAccounts.length})</span>
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

      {/* Main Content: Warehouse Staff View */}
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
        /* Linux System Accounts View */
        <div className="rounded-3xl border border-[#08482D]/12 bg-[#FFFFFF] overflow-hidden shadow-xs">
          <div className="p-4 bg-[#FAFCF6] border-b border-[#08482D]/12 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono-tech text-[#08482D] font-bold">
              <Terminal className="w-4 h-4" />
              <span>Ubuntu /etc/passwd Synchronized System Accounts</span>
            </div>
            <span className="text-[11px] font-mono-tech text-[#5E5E61]">UID Range: &gt;= 1000 or whx_*</span>
          </div>

          <table className="w-full text-left font-mono-tech text-xs">
            <thead className="bg-[#FFFFFF] border-b border-[#08482D]/10 text-[#5E5E61] uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Linux Username</th>
                <th className="py-3 px-4">UID / GID</th>
                <th className="py-3 px-4">Home Directory</th>
                <th className="py-3 px-4">Login Shell</th>
                <th className="py-3 px-4">Group Memberships</th>
                <th className="py-3 px-4 text-center">Shell Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#08482D]/8">
              {linuxAccounts.map((acc, idx) => (
                <tr key={idx} className="hover:bg-[#F8FAF4] transition-colors">
                  <td className="py-3 px-4 font-bold text-[#08482D]">
                    {acc.username}
                  </td>
                  <td className="py-3 px-4 text-[#5E5E61]">
                    {acc.uid} : {acc.gid}
                  </td>
                  <td className="py-3 px-4 text-[#101410]">{acc.home}</td>
                  <td className="py-3 px-4 text-[#5E5E61]">
                    <span className="px-1.5 py-0.5 rounded bg-[#F5F8EF] border border-[#08482D]/15 text-[11px] font-bold">
                      {acc.shell}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#5E5E61] text-[11px]">{acc.groups}</td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={acc.status || 'active'} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                <option value="staff">Warehouse Staff</option>
                <option value="manager">Warehouse Manager</option>
                <option value="admin">Administrator</option>
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
              <span>Create synchronized Ubuntu system user in /etc/passwd</span>
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
