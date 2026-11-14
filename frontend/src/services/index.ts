import { apiRequest } from './api';
import {
  User,
  InventoryItem,
  InventorySummary,
  StorageInfo,
  BackupRecord,
  BackupSchedule,
  RecoveryHistoryItem,
  SecurityAudit,
  ActivityLog,
  SystemMetrics,
  SystemSettings
} from '../types';

// Auth Services
export const authService = {
  login: (credentials: { username: string; password: string }) =>
    apiRequest<{ message: string; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => apiRequest<{ user: User }>('/auth/me'),
  logout: () => apiRequest<{ message: string }>('/auth/logout', { method: 'POST' }),
};

// Inventory Services
export const inventoryService = {
  getItems: (params?: { category?: string; status?: string; search?: string; sort_by?: string; sort_dir?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params?.sort_dir) searchParams.append('sort_dir', params.sort_dir);
    return apiRequest<{ items: InventoryItem[]; count: number }>(`/inventory?${searchParams.toString()}`);
  },
  getSummary: () => apiRequest<InventorySummary>('/inventory/summary'),
  getCategories: () => apiRequest<{ categories: string[] }>('/inventory/categories'),
  addProduct: (product: Partial<InventoryItem>) =>
    apiRequest<{ message: string; id: number; product_id: string }>('/inventory', {
      method: 'POST',
      body: JSON.stringify(product),
    }),
  updateProduct: (id: number | string, product: Partial<InventoryItem>) =>
    apiRequest<{ message: string }>(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    }),
  deleteProduct: (id: number | string) =>
    apiRequest<{ message: string }>(`/inventory/${id}`, { method: 'DELETE' }),
  adjustStock: (id: number | string, delta: number, reason: string) =>
    apiRequest<{ message: string; new_quantity: number; stock_status: string }>(`/inventory/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ delta, reason }),
    }),
  exportInventory: (format: 'csv' | 'json' = 'csv') =>
    apiRequest<string>(`/inventory/export?format=${format}`),
};

// Employee Services
export const employeeService = {
  getEmployees: (params?: { role?: string; status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.append('role', params.role);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    return apiRequest<{ employees: User[]; linux_system_accounts: any[]; count: number }>(
      `/employees?${searchParams.toString()}`
    );
  },
  createEmployee: (employee: Partial<User> & { password: string; sync_linux?: boolean }) =>
    apiRequest<{ message: string; employee_id: number; linux_sync: string }>('/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    }),
  updateEmployee: (id: number, employee: Partial<User> & { password?: string }) =>
    apiRequest<{ message: string }>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employee),
    }),
  deleteEmployee: (id: number) =>
    apiRequest<{ message: string }>(`/employees/${id}`, { method: 'DELETE' }),
  getLinuxUsers: () =>
    apiRequest<{ mode: string; users: any[]; groups: any[] }>('/employees/linux/users'),
  getLinuxGroups: () =>
    apiRequest<{ mode: string; groups: any[] }>('/employees/linux/groups'),
  lockLinuxUser: (username: string) =>
    apiRequest<{ action: string; username: string; status: string; message: string }>(
      `/employees/linux/user/${username}/lock`,
      { method: 'POST' }
    ),
  unlockLinuxUser: (username: string) =>
    apiRequest<{ action: string; username: string; status: string; message: string }>(
      `/employees/linux/user/${username}/unlock`,
      { method: 'POST' }
    ),
  changeLinuxUserShell: (username: string, shell: string) =>
    apiRequest<{ action: string; username: string; shell: string; status: string; message: string }>(
      `/employees/linux/user/${username}/shell`,
      {
        method: 'POST',
        body: JSON.stringify({ shell }),
      }
    ),
};

// Storage Services
export const storageService = {
  getOverview: () => apiRequest<StorageInfo>('/storage/overview'),
  triggerCleanup: () =>
    apiRequest<{ status: string; message: string; freed_space_mb: number }>('/storage/cleanup', {
      method: 'POST',
    }),
};

// Backup Services
export const backupService = {
  listBackups: () =>
    apiRequest<{ backups: BackupRecord[]; schedules: BackupSchedule[]; count: number }>('/backups'),
  createBackup: (backup_type: string, notes?: string) =>
    apiRequest<{ message: string; backup: BackupRecord }>('/backups', {
      method: 'POST',
      body: JSON.stringify({ backup_type, notes }),
    }),
  verifyBackup: (id: number) =>
    apiRequest<{ message: string; status: string; details: any }>(`/backups/${id}/verify`, {
      method: 'POST',
    }),
  deleteBackup: (id: number) =>
    apiRequest<{ message: string }>(`/backups/${id}`, { method: 'DELETE' }),
  saveSchedule: (schedule: Partial<BackupSchedule>) =>
    apiRequest<{ message: string }>('/backups/schedules', {
      method: 'POST',
      body: JSON.stringify(schedule),
    }),
  getBackupLogs: () =>
    apiRequest<{ logs: { timestamp: string; level: string; message: string }[] }>('/backups/logs'),
};

// Recovery Services
export const recoveryService = {
  getAvailable: () => apiRequest<{ available_backups: BackupRecord[] }>('/recovery/available'),
  preflightCheck: (filename: string) =>
    apiRequest<{ status: string; archive: string; verification: any; requires_confirmation: boolean; confirmation_keyword: string }>(
      `/recovery/preflight/${filename}`
    ),
  restoreBackup: (filename: string, confirmation_code: string, target_destination?: string) =>
    apiRequest<{ message: string; details: any; files_restored: number }>('/recovery/restore', {
      method: 'POST',
      body: JSON.stringify({ filename, confirmation_code, target_destination }),
    }),
  getHistory: () => apiRequest<{ history: RecoveryHistoryItem[] }>('/recovery/history'),
};

// Monitoring Services
export const monitoringService = {
  getMetrics: () => apiRequest<SystemMetrics>('/monitoring/metrics'),
  getHistory: () => apiRequest<{ history: any[] }>('/monitoring/history'),
  getProcesses: () => apiRequest<{ processes: any[] }>('/monitoring/processes'),
  manageService: (serviceName: string, action: 'status' | 'restart' | 'reload') =>
    apiRequest<{ message: string; result: any }>(`/monitoring/service/${serviceName}/${action}`, {
      method: 'POST',
    }),
};

// Security Services
export const securityService = {
  getAudit: () => apiRequest<SecurityAudit>('/security/audit'),
  addRule: (rule: { rule_name: string; port: number; protocol: string; action: string; source_ip?: string }) =>
    apiRequest<{ message: string; rule_id: number }>('/security/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    }),
  deleteRule: (id: number) =>
    apiRequest<{ message: string }>(`/security/rules/${id}`, { method: 'DELETE' }),
  toggleUfw: (enable: boolean) =>
    apiRequest<{ message: string; active: boolean }>('/security/toggle-ufw', {
      method: 'POST',
      body: JSON.stringify({ enable }),
    }),
  flushBans: () =>
    apiRequest<{ message: string }>('/security/flush-bans', { method: 'POST' }),
};

// Activity Logs Services
export const logsService = {
  getLogs: (params?: { module?: string; severity?: string; search?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.module) searchParams.append('module', params.module);
    if (params?.severity) searchParams.append('severity', params.severity);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    return apiRequest<{ logs: ActivityLog[]; count: number }>(`/logs?${searchParams.toString()}`);
  },
  exportLogs: () => apiRequest<string>('/logs/export'),
};

// Settings Services
export const settingsService = {
  getSettings: () => apiRequest<SystemSettings>('/settings'),
  updateSettings: (settings: Record<string, string>) =>
    apiRequest<{ message: string }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  toggleMode: (mode: 'live' | 'demo' | 'auto') =>
    apiRequest<{ message: string; current_mode: 'live' | 'demo'; is_live: boolean }>('/settings/mode', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    }),
  updateProfile: (profile: { full_name?: string; email?: string; current_password?: string; new_password?: string }) =>
    apiRequest<{ message: string }>('/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),
};

// Search Services (Exact & Qdrant Semantic Vector Search)
export const searchService = {
  exactSearch: (query: string, type: 'all' | 'item_id' | 'sku' | 'barcode' = 'all') =>
    apiRequest<{ query: string; search_type: string; items: InventoryItem[]; count: number }>(
      `/search/exact?query=${encodeURIComponent(query)}&type=${type}`
    ),

  semanticSearch: (params: {
    query: string;
    category?: string;
    warehouse_location?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) =>
    apiRequest<{
      query: string;
      cleaned_query?: string;
      auto_detected_filters?: Record<string, string>;
      results: InventoryItem[];
      count: number;
    }>('/search/semantic', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  getSimilar: (itemId: string, limit: number = 6) =>
    apiRequest<{ item_id: string; similar_items: InventoryItem[]; count: number }>(
      `/search/similar/${encodeURIComponent(itemId)}?limit=${limit}`
    ),

  getFilters: () =>
    apiRequest<{
      categories: string[];
      warehouse_locations: string[];
      suppliers: string[];
      statuses: string[];
    }>('/search/filters'),
};

// Qdrant Vector DB Backup Services
export const qdrantBackupService = {
  getStatus: () =>
    apiRequest<{
      database: string;
      collection: string;
      total_snapshots: number;
      latest_snapshot: any;
      last_recovery: any;
      encryption: string;
      integrity_check: string;
      health: string;
    }>('/backups/qdrant/status'),

  createSnapshot: (backup_type: 'manual' | 'scheduled' = 'manual', notes?: string) =>
    apiRequest<{ message: string; backup: any }>('/backups/qdrant/snapshot', {
      method: 'POST',
      body: JSON.stringify({ backup_type, notes }),
    }),

  listSnapshots: () =>
    apiRequest<{ snapshots: any[]; count: number; collection: string }>('/backups/qdrant/list'),

  verifySnapshot: (filename: string) =>
    apiRequest<{ valid: boolean; filename: string; point_count: number; sha256_checksum: string }>(
      `/backups/qdrant/verify/${encodeURIComponent(filename)}`
    ),

  restoreSnapshot: (filename: string) =>
    apiRequest<{ message: string; result: any }>('/backups/qdrant/restore', {
      method: 'POST',
      body: JSON.stringify({ filename }),
    }),
};
