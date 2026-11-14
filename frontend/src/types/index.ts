export type UserRole = 'admin' | 'manager' | 'staff' | 'OWNER' | 'WAREHOUSE_MANAGER' | 'INVENTORY_STAFF' | 'DISPATCH_STAFF' | 'owner';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  linux_user?: string;
  linux_group?: string;
  status: UserStatus;
  created_at?: string;
}

export interface InventoryItem {
  id: number | string;
  product_id: string;
  name: string;
  category: string;
  quantity: number;
  unit_price: number;
  supplier: string;
  stock_status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstocked' | string;
  reorder_point: number;
  location_zone: string;
  sku: string;
  last_updated?: string;
  // Qdrant vector database schema extensions
  item_id?: string;
  item_name?: string;
  SKU?: string;
  barcode?: string;
  description?: string;
  minimum_stock?: number;
  warehouse_location?: string;
  status?: string;
  date_added?: string;
  score?: number;
  similarity_percent?: string;
  match_type?: 'exact' | 'semantic' | 'similar';
}

export interface InventorySummary {
  total_products: number;
  total_quantity: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_orders: number;
  pending_orders?: number;
  total_revenue: number;
  primary_database?: string;
  categories: {
    category: string;
    count: number;
    value: number;
    quantity: number;
  }[];
}

export interface SearchResult {
  query: string;
  cleaned_query?: string;
  auto_detected_filters?: Record<string, string>;
  results: InventoryItem[];
  count: number;
  limit?: number;
  offset?: number;
}

export interface SearchFilters {
  categories: string[];
  warehouse_locations: string[];
  suppliers: string[];
  statuses: string[];
}

export interface QdrantBackupStatus {
  database: string;
  collection: string;
  total_snapshots: number;
  latest_snapshot?: {
    filename: string;
    size_formatted: string;
    created_at: string;
    algorithm: string;
  } | null;
  last_recovery?: any;
  encryption: string;
  integrity_check: string;
  health: string;
}

export interface LinuxSystemAccount {
  username: string;
  uid: number;
  gid: number;
  home: string;
  shell: string;
  groups: string;
  status: string;
}

export interface LinuxGroup {
  name: string;
  gid: number;
  description?: string;
  members: string[];
}

export interface SystemMetrics {
  mode: 'live' | 'simulated';
  environment?: string;
  hostname: string;
  os_release: string;
  uptime: string;
  uptime_seconds: number;
  load_average: {
    '1m': number;
    '5m': number;
    '15m': number;
  };
  cpu: {
    percent: number;
    cores: number;
    model?: string;
    temperature_c?: number;
  };
  memory: {
    total_mb: number;
    used_mb: number;
    free_mb: number;
    percent: number;
    cached_mb?: number;
    swap_total_mb?: number;
    swap_used_mb?: number;
  };
  disk: {
    total_gb: number;
    used_gb: number;
    avail_gb: number;
    percent: number;
  };
  network: {
    interface?: string;
    rx_bytes: number;
    tx_bytes: number;
    rx_speed_kbps?: number;
    tx_speed_kbps?: number;
  };
  services: Record<string, string>;
  timestamp: string;
}

export interface FilesystemItem {
  filesystem: string;
  type: string;
  size: string;
  used: string;
  avail: string;
  use_percent: string;
  mount: string;
}

export interface VolumeGroup {
  vg: string;
  size: string;
  free: string;
  pv_count?: number;
  lv_count?: number;
  format?: string;
}

export interface LogicalVolume {
  lv: string;
  vg: string;
  size: string;
  mount?: string;
  filesystem?: string;
  status?: string;
}

export interface PhysicalVolume {
  pv: string;
  vg: string;
  size: string;
  free: string;
  type?: string;
}

export interface StorageInfo {
  mode: 'live' | 'simulated';
  total_capacity_gb: number;
  used_storage_gb: number;
  available_storage_gb: number;
  used_percent: number;
  filesystems: FilesystemItem[];
  volume_groups: VolumeGroup[];
  logical_volumes: LogicalVolume[];
  physical_volumes: PhysicalVolume[];
  smart_status?: string;
  timestamp: string;
}

export interface BackupRecord {
  id: number;
  filename: string;
  backup_type: 'full' | 'database' | 'inventory' | 'config';
  size_bytes: number;
  size_formatted: string;
  status: 'completed' | 'failed' | 'verifying' | 'restoring';
  sha256_checksum: string;
  file_path: string;
  verification_status: 'verified' | 'unverified' | 'corrupt';
  created_at: string;
  notes?: string;
}

export interface BackupSchedule {
  id: number;
  schedule_type: 'daily' | 'weekly' | 'hourly';
  time_utc: string;
  cron_expr: string;
  retention_days: number;
  backup_type: string;
  enabled: number;
  last_run?: string;
  next_run?: string;
}

export interface RecoveryHistoryItem {
  id: number;
  backup_id?: number;
  backup_filename: string;
  restored_by: string;
  restore_target: string;
  status: 'success' | 'in_progress' | 'failed';
  files_restored_count: number;
  started_at: string;
  completed_at?: string;
  log_output?: string;
}

export interface FirewallRule {
  num?: number;
  id?: number;
  rule_name?: string;
  rule?: string;
  port?: number;
  protocol?: string;
  action: string;
  from?: string;
  source_ip?: string;
  status?: string;
}

export interface SecurityAudit {
  mode: 'live' | 'simulated';
  firewall: {
    status: string;
    default_incoming: string;
    default_outgoing: string;
    rules: FirewallRule[];
  };
  openssh: {
    status: string;
    service?: string;
    port: string;
    protocol: string;
    permit_root_login: string;
    password_authentication: string;
    max_auth_tries?: number;
  };
  active_sessions: {
    user: string;
    tty: string;
    from: string;
    login_time: string;
  }[];
  failed_logins: {
    time: string;
    ip?: string;
    user?: string;
    reason?: string;
    message?: string;
  }[];
  database_rules?: FirewallRule[];
  recent_failed_attempts?: any[];
  groups?: string[];
  security_score: number;
  timestamp: string;
}

export interface ActivityLog {
  id: number;
  timestamp: string;
  user_id?: number;
  username: string;
  action: string;
  module: string;
  details: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  ip_address: string;
}

export interface SystemSettings {
  settings: Record<string, string>;
  system_info: {
    python_version: string;
    platform: string;
    system: string;
    machine: string;
    database_size: string;
    database_engine: string;
    current_mode: 'live' | 'demo';
    can_run_linux_scripts: boolean;
    is_linux_host: boolean;
  };
}
