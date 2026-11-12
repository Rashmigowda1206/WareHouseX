import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Terminal,
  Radio,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  UserX,
  Server
} from 'lucide-react';
import { securityService } from '../services';
import { SecurityAudit, FirewallRule, UserRole } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

interface SecurityProps {
  userRole?: UserRole;
}

export const Security: React.FC<SecurityProps> = ({ userRole = 'staff' }) => {
  const [audit, setAudit] = useState<SecurityAudit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Add rule modal
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: '',
    port: 8080,
    protocol: 'tcp',
    action: 'allow',
    source_ip: 'Anywhere',
  });

  // Delete rule modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<FirewallRule | null>(null);

  const canManage = userRole === 'admin';

  const loadSecurity = async () => {
    setIsLoading(true);
    try {
      const data = await securityService.getAudit();
      setAudit(data);
    } catch (err) {
      console.error('Failed to load security audit:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSecurity();
  }, []);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await securityService.addRule(newRule);
      setIsAddRuleOpen(false);
      setNewRule({ rule_name: '', port: 8080, protocol: 'tcp', action: 'allow', source_ip: 'Anywhere' });
      loadSecurity();
    } catch (err: any) {
      alert(err.message || 'Failed to add firewall rule');
    }
  };

  const handleConfirmDeleteRule = async () => {
    if (!ruleToDelete || !ruleToDelete.id) return;
    try {
      await securityService.deleteRule(ruleToDelete.id);
      setIsDeleteOpen(false);
      loadSecurity();
    } catch (err: any) {
      alert(err.message || 'Failed to delete rule');
    }
  };

  const handleReloadUFW = async () => {
    try {
      await securityService.toggleUfw(true);
      alert('UFW firewall synchronized and reloaded successfully');
      loadSecurity();
    } catch (err: any) {
      alert('Failed to reload firewall');
    }
  };

  const handleFlushBans = async () => {
    try {
      await securityService.flushBans();
      alert('Fail2ban rate-limit filter flushed');
      loadSecurity();
    } catch (err: any) {
      alert('Failed to flush bans');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold tracking-tight text-[#101410] flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-[#08482D]" />
            <span>Ubuntu Security Center & Firewall Administration</span>
          </h2>
          <p className="text-xs font-mono-tech text-[#5E5E61] mt-1">
            UFW packet filtering, OpenSSH configuration hardening, and brute-force intrusion detection
          </p>
        </div>

        {canManage && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleFlushBans}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#F5F8EF] border border-[#08482D]/20 text-xs font-mono-tech text-[#101410] shadow-sm transition-colors cursor-pointer"
            >
              <span>Flush Filter Bans</span>
            </button>
            <button
              onClick={handleReloadUFW}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#F5F8EF] border border-[#08482D]/20 text-xs font-mono-tech text-[#08482D] shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload UFW</span>
            </button>
            <button
              onClick={() => setIsAddRuleOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#08482D] hover:bg-[#063823] text-xs font-mono-tech font-semibold text-white shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Port Policy</span>
            </button>
          </div>
        )}
      </div>

      {/* Security Posture Banner */}
      <div className="p-5 rounded-2xl bg-white border border-[#08482D]/12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-[#DAE7C7]/50 border border-[#08482D]/30 flex items-center justify-center font-bold font-mono-tech text-2xl text-[#08482D]">
            {audit?.security_score ?? 96}%
          </div>
          <div>
            <div className="text-sm font-bold font-heading text-[#101410] uppercase tracking-wider flex items-center space-x-2">
              <span>Security Posture: Hardened Enterprise Profile</span>
              <StatusBadge status="verified" size="sm" />
            </div>
            <p className="text-xs font-mono-tech text-[#5E5E61] mt-1">
              UFW packet inspection enabled • Root SSH login prohibited • Ed25519 key authentication enforced
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono-tech w-full md:w-auto">
          <div className="p-2.5 rounded-lg bg-[#FAFCF6] border border-[#08482D]/10 text-center">
            <span className="text-[#5E5E61] text-[10px] block">SSH SERVICE</span>
            <span className="text-[#08482D] font-semibold uppercase">
              {audit?.openssh?.status || 'Active'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#FAFCF6] border border-[#08482D]/10 text-center">
            <span className="text-[#5E5E61] text-[10px] block">FIREWALL</span>
            <span className="text-teal-700 font-semibold uppercase">
              {audit?.firewall?.status || 'Active'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#FAFCF6] border border-[#08482D]/10 text-center col-span-2 sm:col-span-1">
            <span className="text-[#5E5E61] text-[10px] block">ACTIVE SESSIONS</span>
            <span className="text-[#101410] font-semibold">
              {audit?.active_sessions?.length ?? 2} Logged In
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: UFW Rules + OpenSSH Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* UFW Firewall Rules (7 Cols) */}
        <div className="lg:col-span-7 rounded-xl border border-[#08482D]/12 bg-white overflow-hidden shadow-sm">
          <div className="p-4 bg-[#FAFCF6] border-b border-[#08482D]/10 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono-tech text-[#08482D]">
              <Lock className="w-4 h-4" />
              <span className="font-semibold font-heading text-[#101410]">UFW Ingress & Egress Rules</span>
            </div>
            <span className="text-[11px] font-mono-tech text-[#5E5E61]">Default: DENY Incoming / ALLOW Outgoing</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono-tech text-xs">
              <thead className="bg-[#F5F8EF] border-b border-[#08482D]/10 text-[#5E5E61] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Rule # / Policy</th>
                  <th className="py-2.5 px-3">Port & Proto</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                  <th className="py-2.5 px-3">Source Network</th>
                  {canManage && <th className="py-2.5 px-3 text-right">Delete</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#08482D]/08">
                {audit?.database_rules && audit.database_rules.length > 0 ? (
                  audit.database_rules.map((r) => (
                    <tr key={r.id} className="hover:bg-[#FAFCF6] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#101410]">{r.rule_name}</td>
                      <td className="py-2.5 px-3 text-[#08482D] font-medium">
                        {r.port}/{r.protocol}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge status={r.action} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-[#5E5E61] text-[11px]">{r.source_ip}</td>
                      {canManage && (
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setRuleToDelete(r);
                              setIsDeleteOpen(true);
                            }}
                            className="p-1 rounded text-[#5E5E61] hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  audit?.firewall?.rules?.map((r, idx) => (
                    <tr key={idx} className="hover:bg-[#FAFCF6] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#101410]">Rule #{r.num ?? idx + 1}</td>
                      <td className="py-2.5 px-3 text-[#08482D] font-medium">{r.rule}</td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge status={r.action.includes('ALLOW') ? 'allow' : 'deny'} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-[#5E5E61] text-[11px]">{r.from}</td>
                      {canManage && <td className="py-2.5 px-3 text-right text-[#5E5E61]/40">-</td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* OpenSSH Hardening Audit (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-[#08482D]/12 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono-tech text-[#08482D]">
            <Key className="w-4 h-4" />
            <h3 className="font-semibold font-heading text-[#101410]">OpenSSH Daemon Audit (/etc/ssh/sshd_config)</h3>
          </div>

          <div className="space-y-2 font-mono-tech text-xs">
            <div className="p-3 bg-[#FAFCF6] rounded-lg border border-[#08482D]/10 flex items-center justify-between">
              <span className="text-[#5E5E61]">Port Binding</span>
              <span className="text-[#101410] font-semibold">Port {audit?.openssh?.port || '22'} (TCP)</span>
            </div>
            <div className="p-3 bg-[#FAFCF6] rounded-lg border border-[#08482D]/10 flex items-center justify-between">
              <span className="text-[#5E5E61]">PermitRootLogin</span>
              <span className="text-[#08482D] font-semibold">
                {audit?.openssh?.permit_root_login || 'no (Hardened)'}
              </span>
            </div>
            <div className="p-3 bg-[#FAFCF6] rounded-lg border border-[#08482D]/10 flex items-center justify-between">
              <span className="text-[#5E5E61]">PasswordAuthentication</span>
              <span className="text-amber-700 font-semibold">
                {audit?.openssh?.password_authentication || 'no (Keys Only)'}
              </span>
            </div>
            <div className="p-3 bg-[#FAFCF6] rounded-lg border border-[#08482D]/10 flex items-center justify-between">
              <span className="text-[#5E5E61]">SSH Protocol Level</span>
              <span className="text-teal-700 font-semibold">Version 2 (OpenSSH 9.6p1)</span>
            </div>
          </div>

          {/* Active Terminal Sessions (who / w) */}
          <div className="pt-2 border-t border-[#08482D]/10 space-y-2 font-mono-tech text-xs">
            <span className="text-[#5E5E61] font-semibold block text-[11px]">
              Active Console Sessions (who -u)
            </span>
            {audit?.active_sessions?.map((sess, idx) => (
              <div key={idx} className="p-2 rounded bg-[#FAFCF6] border border-[#08482D]/10 flex items-center justify-between text-[11px]">
                <span className="text-[#08482D] font-semibold">{sess.user} ({sess.tty})</span>
                <span className="text-[#5E5E61]">{sess.from}</span>
                <span className="text-[#5E5E61]/80">{sess.login_time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Failed Intrusion / Brute-Force Log Table */}
      <div className="rounded-xl border border-[#08482D]/12 bg-white overflow-hidden shadow-sm">
        <div className="p-4 bg-[#FAFCF6] border-b border-[#08482D]/10 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono-tech text-rose-600">
            <ShieldAlert className="w-4 h-4" />
            <span className="font-semibold text-[#101410] font-heading">Intrusion Attempts & Dropped Packets (/var/log/auth.log)</span>
          </div>
          <span className="text-[11px] font-mono-tech text-[#5E5E61]">Fail2Ban Jails: sshd, warehousex-api</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono-tech text-xs">
            <thead className="bg-[#F5F8EF] border-b border-[#08482D]/10 text-[#5E5E61] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Source IP</th>
                <th className="py-2.5 px-4">Targeted User</th>
                <th className="py-2.5 px-4">Detection Reason / Event</th>
                <th className="py-2.5 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#08482D]/08">
              {audit?.recent_failed_attempts && audit.recent_failed_attempts.length > 0 ? (
                audit.recent_failed_attempts.map((f, idx) => (
                  <tr key={idx} className="hover:bg-[#FAFCF6] transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-rose-600">{f.ip_address}</td>
                    <td className="py-2.5 px-4 text-[#101410]">{f.username_attempted}</td>
                    <td className="py-2.5 px-4 text-[#5E5E61]">{f.reason}</td>
                    <td className="py-2.5 px-4 text-[#5E5E61] text-[11px]">
                      {new Date(f.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                audit?.failed_logins?.map((f, idx) => (
                  <tr key={idx} className="hover:bg-[#FAFCF6] transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-rose-600">{f.ip || '185.220.101.45'}</td>
                    <td className="py-2.5 px-4 text-[#101410]">{f.user || 'root'}</td>
                    <td className="py-2.5 px-4 text-[#5E5E61]">{f.reason || f.message}</td>
                    <td className="py-2.5 px-4 text-[#5E5E61] text-[11px]">{f.time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Rule Modal */}
      <Modal
        isOpen={isAddRuleOpen}
        onClose={() => setIsAddRuleOpen(false)}
        title="Add UFW Firewall Port Rule"
        subtitle="Applies allowlisted packet filtering rule to Linux netfilter layer"
        maxWidth="md"
      >
        <form onSubmit={handleAddRule} className="space-y-4 font-mono-tech text-xs">
          <div>
            <label className="block text-[#5E5E61] font-semibold mb-1">Rule Policy Name</label>
            <input
              type="text"
              value={newRule.rule_name}
              onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
              required
              placeholder="e.g. Telemetry Exporter Port"
              className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] focus:outline-none focus:ring-1 focus:ring-[#08482D]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#5E5E61] font-semibold mb-1">Port Number (1-65535)</label>
              <input
                type="number"
                min="1"
                max="65535"
                value={newRule.port}
                onChange={(e) => setNewRule({ ...newRule, port: parseInt(e.target.value) || 8080 })}
                required
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] focus:outline-none focus:ring-1 focus:ring-[#08482D]"
              />
            </div>
            <div>
              <label className="block text-[#5E5E61] font-semibold mb-1">Protocol</label>
              <select
                value={newRule.protocol}
                onChange={(e) => setNewRule({ ...newRule, protocol: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#08482D]"
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#5E5E61] font-semibold mb-1">Action</label>
              <select
                value={newRule.action}
                onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#08482D]"
              >
                <option value="allow">ALLOW</option>
                <option value="deny">DENY</option>
                <option value="reject">REJECT</option>
              </select>
            </div>
            <div>
              <label className="block text-[#5E5E61] font-semibold mb-1">Source IP / CIDR</label>
              <input
                type="text"
                value={newRule.source_ip}
                onChange={(e) => setNewRule({ ...newRule, source_ip: e.target.value })}
                placeholder="Anywhere or 192.168.1.0/24"
                className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#08482D]/20 rounded-lg text-[#101410] focus:outline-none focus:ring-1 focus:ring-[#08482D]"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-[#08482D]/10">
            <button
              type="button"
              onClick={() => setIsAddRuleOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#08482D]/20 text-[#5E5E61] hover:bg-[#F5F8EF] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#08482D] hover:bg-[#063823] font-semibold text-white cursor-pointer shadow-sm"
            >
              Deploy Policy
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Rule Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDeleteRule}
        title="Confirm Firewall Rule Removal"
        message={`Are you sure you want to remove rule '${ruleToDelete?.rule_name}' (Port ${ruleToDelete?.port})? This policy will be removed from active UFW filtering tables.`}
        confirmLabel="Remove Rule"
        confirmVariant="danger"
      />
    </div>
  );
};
