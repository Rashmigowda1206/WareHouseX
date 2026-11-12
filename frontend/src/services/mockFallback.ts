// Client-Side Demo Fallback Engine for Static Hosting (e.g. GitHub Pages)
// Seamlessly activates when a remote /api backend is unreachable.

const STORAGE_KEYS = {
  PRODUCTS: 'whx_demo_products',
  EMPLOYEES: 'whx_demo_employees',
  BACKUPS: 'whx_demo_backups',
  LOGS: 'whx_demo_logs',
  RULES: 'whx_demo_rules',
  SETTINGS: 'whx_demo_settings',
};

const INITIAL_PRODUCTS = [
  { id: 1, sku: 'WHX-ELC-001', name: 'Industrial RFID Scanner Gun', category: 'Electronics', stock_quantity: 42, min_stock_threshold: 15, unit_price: 349.99, warehouse_zone: 'Zone-A1', supplier: 'Zebra Tech Corp' },
  { id: 2, sku: 'WHX-ELC-002', name: 'Thermal Barcode Label Printer', category: 'Electronics', stock_quantity: 8, min_stock_threshold: 10, unit_price: 520.00, warehouse_zone: 'Zone-A2', supplier: 'Honeywell Scanning' },
  { id: 3, sku: 'WHX-LOG-003', name: 'Heavy-Duty Pallet Jack 3-Ton', category: 'Machinery', stock_quantity: 14, min_stock_threshold: 5, unit_price: 1250.00, warehouse_zone: 'Zone-B1', supplier: 'Crown Equipment' },
  { id: 4, sku: 'WHX-LOG-004', name: 'Electric Forklift Battery 48V', category: 'Machinery', stock_quantity: 3, min_stock_threshold: 5, unit_price: 4800.00, warehouse_zone: 'Zone-B2', supplier: 'Hyster-Yale Group' },
  { id: 5, sku: 'WHX-PKG-005', name: 'High-Tensile Stretch Wrap 80G', category: 'Packaging', stock_quantity: 180, min_stock_threshold: 50, unit_price: 24.50, warehouse_zone: 'Zone-C1', supplier: 'Berry Plastics' },
  { id: 6, sku: 'WHX-PKG-006', name: 'Reinforced Corrugated Boxes #4', category: 'Packaging', stock_quantity: 850, min_stock_threshold: 200, unit_price: 3.80, warehouse_zone: 'Zone-C2', supplier: 'Uline Supply Co' },
  { id: 7, sku: 'WHX-SAF-007', name: 'OSHA High-Visibility Safety Vest', category: 'Safety Gear', stock_quantity: 65, min_stock_threshold: 20, unit_price: 18.00, warehouse_zone: 'Zone-D1', supplier: '3M Industrial Safety' },
  { id: 8, sku: 'WHX-SAF-008', name: 'Steel-Toe Composite Safety Boots', category: 'Safety Gear', stock_quantity: 28, min_stock_threshold: 15, unit_price: 110.00, warehouse_zone: 'Zone-D2', supplier: 'Red Wing Shoes' },
  { id: 9, sku: 'WHX-STO-009', name: 'Galvanized Teardrop Racking Beam', category: 'Storage Hardware', stock_quantity: 92, min_stock_threshold: 30, unit_price: 85.00, warehouse_zone: 'Zone-E1', supplier: 'Interlake Mecalux' },
  { id: 10, sku: 'WHX-STO-010', name: 'Wire Mesh Decking 42x46', category: 'Storage Hardware', stock_quantity: 120, min_stock_threshold: 40, unit_price: 45.00, warehouse_zone: 'Zone-E2', supplier: 'Nashville Wire' },
  { id: 11, sku: 'WHX-LOG-011', name: 'Automated Guided Vehicle (AGV) Beacon', category: 'Automation', stock_quantity: 6, min_stock_threshold: 8, unit_price: 2100.00, warehouse_zone: 'Zone-A3', supplier: 'KION Group' },
  { id: 12, sku: 'WHX-PKG-012', name: 'Biodegradable Void-Fill Air Pillows', category: 'Packaging', stock_quantity: 450, min_stock_threshold: 100, unit_price: 42.00, warehouse_zone: 'Zone-C3', supplier: 'Sealed Air Corp' },
];

const INITIAL_EMPLOYEES = [
  { id: 1, username: 'admin', full_name: 'Rashmi Gowda', role: 'admin', email: 'rashmigowda@Ubuntu-Linux-Admin', linux_username: 'rashmigowda', linux_group: 'warehouse-admins', status: 'active', last_login: new Date().toISOString() },
  { id: 2, username: 'staff', full_name: 'Warehouse Operations Staff', role: 'staff', email: 'staff@warehousex.internal', linux_username: 'whx_staff', linux_group: 'warehouse-staff', status: 'active', last_login: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, username: 'manager', full_name: 'Logistics Shift Supervisor', role: 'manager', email: 'manager@warehousex.internal', linux_username: 'whx_manager', linux_group: 'warehouse-admins', status: 'active', last_login: new Date(Date.now() - 7200000).toISOString() },
  { id: 4, username: 'monis', full_name: 'Monis Systems Engineer', role: 'admin', email: 'monis@Ubuntu-Linux-Admin', linux_username: 'monis', linux_group: 'warehouse-admins', status: 'active', last_login: new Date().toISOString() },
];

const INITIAL_BACKUPS = [
  { id: 1, filename: 'warehousex_full_20261112_183001.tar.gz', backup_type: 'full', size_bytes: 2516582, size_formatted: '2.4 MB', sha256_checksum: '4f2c98a5e81d830b42c67b93c830df2b8f72a44e5904d1c9ef0076a0d33e5472', verification_status: 'verified', notes: 'Daily automated production snapshot', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 2, filename: 'warehousex_database_20261111_020000.tar.gz', backup_type: 'database', size_bytes: 419430, size_formatted: '410 KB', sha256_checksum: 'a93b41d08e5c149b29381c8b3019e04859a8031d9082ef183c2089ef0921bb01', verification_status: 'verified', notes: 'Scheduled SQLite WAL checkpoint backup', created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 3, filename: 'warehousex_full_20261110_020000.tar.gz', backup_type: 'full', size_bytes: 2490368, size_formatted: '2.3 MB', sha256_checksum: '7b8893d9e8432a1884c71830e018d9480129bc83a0918ef00918c01830129ab8', verification_status: 'verified', notes: 'Automated cron archive', created_at: new Date(Date.now() - 259200000).toISOString() },
];

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStored(key: string, val: any) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export async function handleMockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const url = endpoint.replace(/^\/api/, '');
  const body = options.body ? JSON.parse(options.body as string) : {};

  // Artificial short latency to simulate realistic system responsiveness
  await new Promise((r) => setTimeout(r, 60));

  // --- AUTH ---
  if (url === '/auth/login' && method === 'POST') {
    const { username, password } = body;
    let role = 'staff';
    let full_name = 'Warehouse Staff';

    if (username === 'admin') {
      role = 'admin';
      full_name = 'Rashmi Gowda';
    } else if (username === 'manager') {
      role = 'manager';
      full_name = 'Logistics Supervisor';
    }

    const user = { id: 1, username, role, full_name, email: `${username}@warehousex.internal` };
    const token = `whx_demo_jwt_token_${Date.now()}`;
    return { token, user } as unknown as T;
  }

  if (url === '/auth/me') {
    const saved = localStorage.getItem('whx_user');
    const user = saved ? JSON.parse(saved) : { id: 1, username: 'admin', role: 'admin', full_name: 'Rashmi Gowda' };
    return { user } as unknown as T;
  }

  // --- INVENTORY ---
  if (url.startsWith('/inventory')) {
    let products = getStored(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);

    if (url === '/inventory' && method === 'GET') {
      return { products, total: products.length } as unknown as T;
    }

    if (url === '/inventory/stats' && method === 'GET') {
      const total_skus = products.length;
      const total_units = products.reduce((acc, p) => acc + (p.stock_quantity || 0), 0);
      const total_value = products.reduce((acc, p) => acc + (p.stock_quantity * p.unit_price || 0), 0);
      const low_stock_count = products.filter((p) => p.stock_quantity <= p.min_stock_threshold).length;
      return { total_skus, total_units, total_value, low_stock_count } as unknown as T;
    }

    if (url === '/inventory' && method === 'POST') {
      const newP = { id: Date.now(), ...body };
      products = [newP, ...products];
      setStored(STORAGE_KEYS.PRODUCTS, products);
      return { message: 'Product created successfully', product: newP } as unknown as T;
    }

    if (method === 'PUT' && url.match(/^\/inventory\/\d+/)) {
      const id = parseInt(url.split('/')[2]);
      products = products.map((p) => (p.id === id ? { ...p, ...body } : p));
      setStored(STORAGE_KEYS.PRODUCTS, products);
      return { message: 'Product updated successfully' } as unknown as T;
    }

    if (method === 'DELETE' && url.match(/^\/inventory\/\d+/)) {
      const id = parseInt(url.split('/')[2]);
      products = products.filter((p) => p.id !== id);
      setStored(STORAGE_KEYS.PRODUCTS, products);
      return { message: 'Product deleted' } as unknown as T;
    }
  }

  // --- EMPLOYEES ---
  if (url.startsWith('/employees')) {
    let employees = getStored(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);

    if (url === '/employees' && method === 'GET') {
      return { employees, total: employees.length } as unknown as T;
    }

    if (url === '/employees' && method === 'POST') {
      const newEmp = { id: Date.now(), ...body, linux_username: `whx_${body.username}`, status: 'active' };
      employees = [...employees, newEmp];
      setStored(STORAGE_KEYS.EMPLOYEES, employees);
      return { message: 'Employee provisioned in database and Linux user mapping', employee: newEmp } as unknown as T;
    }

    if (method === 'PUT' && url.match(/^\/employees\/\d+/)) {
      const id = parseInt(url.split('/')[2]);
      employees = employees.map((e) => (e.id === id ? { ...e, ...body } : e));
      setStored(STORAGE_KEYS.EMPLOYEES, employees);
      return { message: 'Employee updated successfully' } as unknown as T;
    }

    if (method === 'DELETE' && url.match(/^\/employees\/\d+/)) {
      const id = parseInt(url.split('/')[2]);
      employees = employees.filter((e) => e.id !== id);
      setStored(STORAGE_KEYS.EMPLOYEES, employees);
      return { message: 'Employee record deleted' } as unknown as T;
    }
  }

  // --- STORAGE & LVM ---
  if (url.startsWith('/storage')) {
    if (url === '/storage/overview') {
      return {
        total_capacity_gb: 3072,
        used_storage_gb: 1342,
        available_storage_gb: 1730,
        used_percent: 43.7,
        physical_volumes: [
          { pv: '/dev/nvme0n1p2', vg: 'vg_warehousex', size: '2048 GB', free: '1150 GB', type: 'PCIe 4.0 NVMe Array' },
          { pv: '/dev/sda1', vg: 'vg_warehousex', size: '1024 GB', free: '580 GB', type: 'SAS 12Gbps Enterprise' },
        ],
        volume_groups: [
          { vg: 'vg_warehousex', size: '3072 GB', free: '1730 GB', pv_count: 2, lv_count: 3, format: 'lvm2 (standard)' },
        ],
        logical_volumes: [
          { lv: 'lv_opt', size: '20 GB', mount: '/opt/warehousex', filesystem: 'ext4' },
          { lv: 'lv_backups', size: '500 GB', mount: '/var/backups/warehousex', filesystem: 'ext4' },
          { lv: 'lv_data', size: '822 GB', mount: '/home/rashmigowda/WareHouseX', filesystem: 'ext4' },
        ],
        filesystems: [
          { filesystem: '/dev/mapper/vg_warehousex-lv_opt', type: 'ext4', mount: '/opt/warehousex', size: '20G', used: '3.8G', avail: '15G', use_percent: '21%' },
          { filesystem: '/dev/mapper/vg_warehousex-lv_backups', type: 'ext4', mount: '/var/backups/warehousex', size: '500G', used: '43.2G', avail: '432G', use_percent: '9%' },
          { filesystem: '/dev/mapper/vg_warehousex-lv_data', type: 'ext4', mount: '/home/rashmigowda/WareHouseX', size: '822G', used: '184G', avail: '596G', use_percent: '24%' },
          { filesystem: '/dev/nvme0n1p1', type: 'vfat', mount: '/boot/efi', size: '512M', used: '64M', avail: '448M', use_percent: '13%' },
        ],
      } as unknown as T;
    }

    if (url === '/storage/cleanup') {
      return { success: true, message: 'Purged 420MB of expired temporary staging buffers and rotated old logs' } as unknown as T;
    }
  }

  // --- BACKUPS & CRON ---
  if (url.startsWith('/backups')) {
    let backups = getStored(STORAGE_KEYS.BACKUPS, INITIAL_BACKUPS);

    if (url === '/backups' && method === 'GET') {
      return {
        backups,
        schedules: [
          { id: 1, schedule_type: 'daily', time_utc: '02:00', cron_expr: '0 2 * * *', retention_days: 14, backup_type: 'full', enabled: 1 },
          { id: 2, schedule_type: 'hourly', time_utc: '00:00', cron_expr: '0 * * * *', retention_days: 2, backup_type: 'database', enabled: 1 },
          { id: 3, schedule_type: 'weekly', time_utc: '03:00 (Sun)', cron_expr: '0 3 * * 0', retention_days: 30, backup_type: 'full', enabled: 1 },
        ],
      } as unknown as T;
    }

    if (url === '/backups/create' && method === 'POST') {
      const type = body.backup_type || 'full';
      const nowIso = new Date().toISOString();
      const timestamp = nowIso.substring(0, 10).replace(/-/g, '') + '_' + nowIso.substring(11, 19).replace(/:/g, '');
      const newBkp = {
        id: Date.now(),
        filename: `warehousex_${type}_${timestamp}.tar.gz`,
        backup_type: type,
        size_bytes: 2541800,
        size_formatted: '2.5 MB',
        sha256_checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        verification_status: 'verified',
        notes: body.notes || 'Manual administrative snapshot',
        created_at: new Date().toISOString(),
      };
      backups = [newBkp, ...backups];
      setStored(STORAGE_KEYS.BACKUPS, backups);
      return { message: 'TAR archive created and SHA-256 verified successfully', backup: newBkp } as unknown as T;
    }

    if (url.startsWith('/backups/verify/')) {
      return { status: 'verified', details: { message: 'TAR stream tested with zero corruption errors.' } } as unknown as T;
    }

    if (url === '/backups/logs') {
      return {
        logs: [
          { timestamp: '18:30:01', level: 'INFO', message: 'Initiating full backup sequence (/opt/warehousex/backup_warehouse.sh)...' },
          { timestamp: '18:30:01', level: 'INFO', message: 'Flushing SQLite Write-Ahead Log (WAL) checkpoint...' },
          { timestamp: '18:30:02', level: 'INFO', message: 'Compressing assets into POSIX TAR.GZ archive stream...' },
          { timestamp: '18:30:03', level: 'INFO', message: 'Performing tar stream verification test (tar -tzf)...' },
          { timestamp: '18:30:04', level: 'SUCCESS', message: 'Backup archive verified: 12 components intact.' },
          { timestamp: '18:30:04', level: 'SUCCESS', message: 'SHA-256 integrity hash registered.' },
        ],
      } as unknown as T;
    }
  }

  // --- DISASTER RECOVERY ---
  if (url.startsWith('/recovery')) {
    const backups = getStored(STORAGE_KEYS.BACKUPS, INITIAL_BACKUPS);

    if (url === '/recovery/available') {
      return { available_backups: backups } as unknown as T;
    }

    if (url === '/recovery/preflight') {
      return {
        status: 'ready',
        verification: {
          files_count: 12,
          message: 'Archive POSIX header intact. SHA-256 checksum matches local security ledger.',
        },
      } as unknown as T;
    }

    if (url === '/recovery/restore') {
      return {
        success: true,
        files_restored: 12,
        details: { log: 'Extracted database checkpoint and system configs into staging vault. All file hashes verified.' },
      } as unknown as T;
    }

    if (url === '/recovery/history') {
      return {
        history: [
          { id: 1, backup_filename: 'warehousex_full_20261112_183001.tar.gz', restore_target: '/opt/warehousex/restored', restored_by: 'rashmigowda', status: 'success', files_restored_count: 12, started_at: new Date(Date.now() - 3600000).toISOString() },
        ],
      } as unknown as T;
    }
  }

  // --- MONITORING ---
  if (url.startsWith('/monitoring')) {
    if (url === '/monitoring/metrics') {
      const cpu = 22 + Math.floor(Math.sin(Date.now() / 8000) * 8);
      const mem = 43;
      return {
        mode: 'demo',
        is_linux: true,
        cpu: { percent: Math.max(12, cpu), temperature_c: 44.5, cores: 8 },
        memory: { percent: mem, used_mb: 7065, total_mb: 16384 },
        load_average: { '1m': '0.42', '5m': '0.55', '15m': '0.61' },
        network: { rx_speed_kbps: 1420, interface: 'ens3 (10Gbps SFP+)' },
        uptime: '14 days, 6 hours, 22 minutes',
      } as unknown as T;
    }

    if (url === '/monitoring/history') {
      const now = Date.now();
      const points = [];
      for (let i = 20; i >= 0; i--) {
        const t = new Date(now - i * 5000).toLocaleTimeString();
        points.push({
          time: t,
          cpu: 20 + Math.floor(Math.sin((now - i * 5000) / 7000) * 9),
          memory: 42 + Math.floor(Math.cos((now - i * 5000) / 15000) * 3),
        });
      }
      return { history: points } as unknown as T;
    }

    if (url === '/monitoring/processes') {
      return {
        processes: [
          { pid: 12480, user: 'rashmigowda', name: 'python3 backend/app.py', cpu: 2.4, mem: 4.8, status: 'running' },
          { pid: 1102, user: 'root', name: '/usr/sbin/sshd -D', cpu: 0.1, mem: 0.8, status: 'running' },
          { pid: 840, user: 'root', name: '/lib/systemd/systemd-journald', cpu: 0.3, mem: 1.2, status: 'running' },
          { pid: 1420, user: 'root', name: 'cron -f', cpu: 0.0, mem: 0.4, status: 'running' },
          { pid: 15300, user: 'www-data', name: 'nginx: worker process', cpu: 0.4, mem: 1.5, status: 'running' },
        ],
      } as unknown as T;
    }

    if (url === '/monitoring/service') {
      return { message: `Service ${body.service} reloaded successfully.` } as unknown as T;
    }
  }

  // --- SECURITY ---
  if (url.startsWith('/security')) {
    if (url === '/security/audit') {
      return {
        security_score: 96,
        openssh: { status: 'active', port: '22', permit_root_login: 'no (Hardened)', password_authentication: 'no (Keys Only)' },
        firewall: { status: 'active', default_policy: 'DENY Incoming / ALLOW Outgoing' },
        active_sessions: [
          { user: 'rashmigowda', tty: 'pts/0', from: '192.168.1.100', login_time: '18:15' },
          { user: 'monis', tty: 'pts/1', from: '192.168.1.105', login_time: '20:40' },
        ],
        database_rules: [
          { id: 1, rule_name: 'Hardened OpenSSH', port: 22, protocol: 'tcp', action: 'allow', source_ip: 'Anywhere' },
          { id: 2, rule_name: 'WareHouseX REST API', port: 5000, protocol: 'tcp', action: 'allow', source_ip: '192.168.1.0/24' },
          { id: 3, rule_name: 'WareHouseX Vite Web UI', port: 5173, protocol: 'tcp', action: 'allow', source_ip: 'Anywhere' },
          { id: 4, rule_name: 'Reverse Proxy HTTP', port: 80, protocol: 'tcp', action: 'allow', source_ip: 'Anywhere' },
        ],
        recent_failed_attempts: [
          { ip_address: '185.220.101.45', username_attempted: 'root', reason: 'Direct root SSH prohibited', timestamp: new Date(Date.now() - 1400000).toISOString() },
          { ip_address: '194.26.29.112', username_attempted: 'admin', reason: 'Invalid Ed25519 public key signature', timestamp: new Date(Date.now() - 3200000).toISOString() },
        ],
      } as unknown as T;
    }

    if (url === '/security/rules' && method === 'POST') {
      return { message: 'Firewall port policy applied successfully' } as unknown as T;
    }
  }

  // --- LOGS ---
  if (url.startsWith('/logs')) {
    return {
      logs: [
        { id: 1, timestamp: new Date().toISOString(), severity: 'info', module: 'auth', action: 'USER_LOGIN', username: 'admin', ip_address: '192.168.1.100', details: 'Successful JWT authentication for operator rashmigowda' },
        { id: 2, timestamp: new Date(Date.now() - 1800000).toISOString(), severity: 'success', module: 'backup', action: 'BACKUP_CREATE', username: 'system', ip_address: '127.0.0.1', details: 'Automated POSIX TAR snapshot generated with SHA-256 hash' },
        { id: 3, timestamp: new Date(Date.now() - 3600000).toISOString(), severity: 'info', module: 'inventory', action: 'STOCK_RESTOCK', username: 'staff', ip_address: '192.168.1.104', details: 'Added 40 units to SKU WHX-ELC-001 in Zone-A1' },
        { id: 4, timestamp: new Date(Date.now() - 7200000).toISOString(), severity: 'warning', module: 'security', action: 'FAILED_SSH', username: 'root', ip_address: '185.220.101.45', details: 'SSH root login rejected by sshd_config policy' },
      ],
    } as unknown as T;
  }

  // --- SETTINGS ---
  if (url.startsWith('/settings')) {
    return {
      settings: {
        warehouse_name: 'WareHouseX Alpha Central - Hub 01',
        currency: 'USD ($)',
        timezone: 'UTC+00:00',
        low_stock_threshold_default: '15',
        backup_storage_path: '/var/backups/warehousex',
        backup_retention_days: '14',
        ssh_port: '22',
      },
      system_info: {
        python_version: '3.13.1',
        platform: 'Ubuntu 24.04 LTS (x86_64)',
        database_engine: 'SQLite 3 (WAL mode)',
        database_size: '128.0 KB',
        current_mode: 'demo',
      },
    } as unknown as T;
  }

  // Default fallback
  return { success: true, message: 'Operation completed in demo mode' } as unknown as T;
}
