// Client-Side Demo Fallback Engine for Static Hosting (e.g. GitHub Pages)
// Seamlessly activates when a remote /api backend is unreachable.

const STORAGE_KEYS = {
  PRODUCTS: 'whx_demo_products_v2',
  EMPLOYEES: 'whx_demo_employees_v2',
  BACKUPS: 'whx_demo_backups_v2',
  LOGS: 'whx_demo_logs_v2',
  RULES: 'whx_demo_rules_v2',
  SETTINGS: 'whx_demo_settings_v2',
};

const INITIAL_PRODUCTS = [
  { id: 1, product_id: 'WHX-EL-1001', name: 'Industrial Barcode Scanner 2D Pro', category: 'Electronics', quantity: 145, stock_quantity: 145, unit_price: 289.50, supplier: 'OmniScan Dynamics', stock_status: 'In Stock', reorder_point: 20, min_stock_threshold: 20, location_zone: 'Zone A-01-A', warehouse_zone: 'Zone A-01-A', sku: 'SKU-SCN-289' },
  { id: 2, product_id: 'WHX-EL-1002', name: 'Enterprise Rugged RFID Handheld Terminal', category: 'Electronics', quantity: 42, stock_quantity: 42, unit_price: 650.00, supplier: 'ZebraTech Global', stock_status: 'In Stock', reorder_point: 15, min_stock_threshold: 15, location_zone: 'Zone A-01-B', warehouse_zone: 'Zone A-01-B', sku: 'SKU-RFD-650' },
  { id: 3, product_id: 'WHX-EL-1003', name: 'Thermal Label Printer ZT-411 Series', category: 'Electronics', quantity: 12, stock_quantity: 12, unit_price: 895.00, supplier: 'LogiPrint Industrial', stock_status: 'Low Stock', reorder_point: 15, min_stock_threshold: 15, location_zone: 'Zone A-02-C', warehouse_zone: 'Zone A-02-C', sku: 'SKU-PRN-895' },
  { id: 4, product_id: 'WHX-EL-1004', name: 'Industrial Wireless AP WiFi 6E Outdoor', category: 'Electronics', quantity: 28, stock_quantity: 28, unit_price: 420.00, supplier: 'Ubiquiti Edge', stock_status: 'In Stock', reorder_point: 10, min_stock_threshold: 10, location_zone: 'Zone A-03-A', warehouse_zone: 'Zone A-03-A', sku: 'SKU-WAP-420' },
  { id: 5, product_id: 'WHX-EL-1005', name: 'Automated Forklift Fleet Telematics Unit', category: 'Electronics', quantity: 8, stock_quantity: 8, unit_price: 1250.00, supplier: 'AeroVeloce Systems', stock_status: 'Low Stock', reorder_point: 10, min_stock_threshold: 10, location_zone: 'Zone A-03-B', warehouse_zone: 'Zone A-03-B', sku: 'SKU-FLT-125' },
  { id: 6, product_id: 'WHX-MC-2001', name: 'Electric Pallet Jack Lithium 48V 2.5T', category: 'Machinery', quantity: 14, stock_quantity: 14, unit_price: 3450.00, supplier: 'Crown Equipment Corp', stock_status: 'In Stock', reorder_point: 5, min_stock_threshold: 5, location_zone: 'Zone B-01-F', warehouse_zone: 'Zone B-01-F', sku: 'SKU-PLJ-345' },
  { id: 7, product_id: 'WHX-MC-2002', name: 'Automated Guided Vehicle (AGV) Tugger', category: 'Machinery', quantity: 4, stock_quantity: 4, unit_price: 18200.00, supplier: 'KUKA Robotics', stock_status: 'Low Stock', reorder_point: 5, min_stock_threshold: 5, location_zone: 'Zone B-02-F', warehouse_zone: 'Zone B-02-F', sku: 'SKU-AGV-182' },
  { id: 8, product_id: 'WHX-MC-2003', name: 'Hydraulic Scissor Lift Table 1500kg', category: 'Machinery', quantity: 9, stock_quantity: 9, unit_price: 2150.00, supplier: 'Vestil Manufacturing', stock_status: 'In Stock', reorder_point: 4, min_stock_threshold: 4, location_zone: 'Zone B-03-F', warehouse_zone: 'Zone B-03-F', sku: 'SKU-SCL-215' },
  { id: 9, product_id: 'WHX-MC-2004', name: 'Conveyor Roller Module 3.5m Powered', category: 'Machinery', quantity: 22, stock_quantity: 22, unit_price: 1180.00, supplier: 'Interroll Systems', stock_status: 'In Stock', reorder_point: 8, min_stock_threshold: 8, location_zone: 'Zone B-04-F', warehouse_zone: 'Zone B-04-F', sku: 'SKU-CVR-118' },
  { id: 10, product_id: 'WHX-MC-2005', name: 'Stretch Pallet Wrapper Semi-Auto', category: 'Machinery', quantity: 3, stock_quantity: 3, unit_price: 4900.00, supplier: 'Lantech Global', stock_status: 'Low Stock', reorder_point: 4, min_stock_threshold: 4, location_zone: 'Zone B-05-F', warehouse_zone: 'Zone B-05-F', sku: 'SKU-STW-490' },
  { id: 11, product_id: 'WHX-PK-3001', name: 'Heavy-Duty Corrugated Cartons 60x40x40', category: 'Packaging', quantity: 2400, stock_quantity: 2400, unit_price: 3.85, supplier: 'Smurfit Kappa', stock_status: 'Overstocked', reorder_point: 500, min_stock_threshold: 500, location_zone: 'Zone C-01-A', warehouse_zone: 'Zone C-01-A', sku: 'SKU-BOX-604' },
  { id: 12, product_id: 'WHX-PK-3002', name: 'Biodegradable Air Pillow Void Fill (Roll)', category: 'Packaging', quantity: 320, stock_quantity: 320, unit_price: 48.00, supplier: 'Sealed Air Solutions', stock_status: 'In Stock', reorder_point: 100, min_stock_threshold: 100, location_zone: 'Zone C-01-B', warehouse_zone: 'Zone C-01-B', sku: 'SKU-AIR-320' },
  { id: 13, product_id: 'WHX-PK-3003', name: 'Reinforced Gummed Paper Tape 70mm x 150m', category: 'Packaging', quantity: 580, stock_quantity: 580, unit_price: 14.50, supplier: '3M Industrial Tape', stock_status: 'In Stock', reorder_point: 150, min_stock_threshold: 150, location_zone: 'Zone C-02-A', warehouse_zone: 'Zone C-02-A', sku: 'SKU-TAP-580' },
  { id: 14, product_id: 'WHX-PK-3004', name: 'Euro Wooden Pallets Heat Treated EPAL', category: 'Packaging', quantity: 650, stock_quantity: 650, unit_price: 22.00, supplier: 'Faber Pallets BV', stock_status: 'In Stock', reorder_point: 200, min_stock_threshold: 200, location_zone: 'Zone C-03-A', warehouse_zone: 'Zone C-03-A', sku: 'SKU-PLT-650' },
  { id: 15, product_id: 'WHX-PK-3005', name: 'Anti-Static Bubble Wrap Roll 100m', category: 'Packaging', quantity: 0, stock_quantity: 0, unit_price: 38.00, supplier: 'Protective Pac Ltd', stock_status: 'Out of Stock', reorder_point: 50, min_stock_threshold: 50, location_zone: 'Zone C-03-B', warehouse_zone: 'Zone C-03-B', sku: 'SKU-BUB-100' },
  { id: 16, product_id: 'WHX-SF-4001', name: 'Steel-Toe Kevlar Safety Boots ISO 20345', category: 'Safety Gear', quantity: 180, stock_quantity: 180, unit_price: 78.00, supplier: 'Red Wing Industrial', stock_status: 'In Stock', reorder_point: 40, min_stock_threshold: 40, location_zone: 'Zone D-01-A', warehouse_zone: 'Zone D-01-A', sku: 'SKU-BOT-180' },
  { id: 17, product_id: 'WHX-SF-4002', name: 'High-Vis ANSI Class 3 Heated Winter Vest', category: 'Safety Gear', quantity: 95, stock_quantity: 95, unit_price: 62.00, supplier: 'Carhartt Workwear', stock_status: 'In Stock', reorder_point: 30, min_stock_threshold: 30, location_zone: 'Zone D-01-B', warehouse_zone: 'Zone D-01-B', sku: 'SKU-VST-095' },
  { id: 18, product_id: 'WHX-SF-4003', name: 'Cut-Resistant Level 5 Nitrile Grip Gloves', category: 'Safety Gear', quantity: 850, stock_quantity: 850, unit_price: 6.50, supplier: 'Ansell Protective', stock_status: 'In Stock', reorder_point: 200, min_stock_threshold: 200, location_zone: 'Zone D-02-A', warehouse_zone: 'Zone D-02-A', sku: 'SKU-GLV-850' },
  { id: 19, product_id: 'WHX-SF-4004', name: 'Emergency Eyewash Station Wall Mount', category: 'Safety Gear', quantity: 16, stock_quantity: 16, unit_price: 210.00, supplier: 'Haws Safety Co', stock_status: 'In Stock', reorder_point: 5, min_stock_threshold: 5, location_zone: 'Zone D-02-B', warehouse_zone: 'Zone D-02-B', sku: 'SKU-EYE-016' },
  { id: 20, product_id: 'WHX-SF-4005', name: 'Industrial First Aid Kit Class B 150-Person', category: 'Safety Gear', quantity: 6, stock_quantity: 6, unit_price: 175.00, supplier: 'Cintas Corp', stock_status: 'Low Stock', reorder_point: 10, min_stock_threshold: 10, location_zone: 'Zone D-03-A', warehouse_zone: 'Zone D-03-A', sku: 'SKU-MED-006' },
  { id: 21, product_id: 'WHX-IT-5001', name: 'Rackmount Server Chassis 2U Xeon E-2388', category: 'IT Hardware', quantity: 7, stock_quantity: 7, unit_price: 2480.00, supplier: 'Supermicro USA', stock_status: 'In Stock', reorder_point: 3, min_stock_threshold: 3, location_zone: 'Server Room R-01', warehouse_zone: 'Server Room R-01', sku: 'SKU-SRV-248' },
  { id: 22, product_id: 'WHX-IT-5002', name: 'Enterprise NVMe SSD U.2 7.68TB PCIe 4.0', category: 'IT Hardware', quantity: 24, stock_quantity: 24, unit_price: 690.00, supplier: 'Samsung Electronics', stock_status: 'In Stock', reorder_point: 8, min_stock_threshold: 8, location_zone: 'Server Room R-01', warehouse_zone: 'Server Room R-01', sku: 'SKU-SSD-768' },
  { id: 23, product_id: 'WHX-IT-5003', name: 'Managed L3 Switch 48-Port 10GbE SFP+', category: 'IT Hardware', quantity: 4, stock_quantity: 4, unit_price: 3100.00, supplier: 'Cisco Systems', stock_status: 'Low Stock', reorder_point: 5, min_stock_threshold: 5, location_zone: 'Server Room R-02', warehouse_zone: 'Server Room R-02', sku: 'SKU-SWT-310' },
  { id: 24, product_id: 'WHX-IT-5004', name: 'UPS Smart-UPS On-Line 6000VA 230V 4U', category: 'IT Hardware', quantity: 2, stock_quantity: 2, unit_price: 4250.00, supplier: 'APC Schneider', stock_status: 'Low Stock', reorder_point: 3, min_stock_threshold: 3, location_zone: 'Power Room P-01', warehouse_zone: 'Power Room P-01', sku: 'SKU-UPS-600' },
  { id: 25, product_id: 'WHX-CS-6001', name: 'Smart Temperature & Humidity LoRa Sensor', category: 'IoT Hardware', quantity: 110, stock_quantity: 110, unit_price: 54.00, supplier: 'Milesight IoT', stock_status: 'In Stock', reorder_point: 25, min_stock_threshold: 25, location_zone: 'Zone E-01-A', warehouse_zone: 'Zone E-01-A', sku: 'SKU-TMP-110' },
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

    if (url.startsWith('/inventory/summary')) {
      const total_products = products.length;
      const total_quantity = products.reduce((acc, p) => acc + (p.quantity || p.stock_quantity || 0), 0);
      const total_value = products.reduce((acc, p) => acc + ((p.quantity || p.stock_quantity || 0) * (p.unit_price || 0)), 0);
      const low_stock_count = products.filter((p) => (p.quantity || p.stock_quantity || 0) <= (p.reorder_point || p.min_stock_threshold || 15) && (p.quantity || p.stock_quantity || 0) > 0).length;
      const out_of_stock_count = products.filter((p) => (p.quantity || p.stock_quantity || 0) === 0).length;

      const catMap: Record<string, { count: number; value: number; quantity: number }> = {};
      products.forEach((p) => {
        const cat = p.category || 'General';
        const qty = p.quantity || p.stock_quantity || 0;
        const val = qty * (p.unit_price || 0);
        if (!catMap[cat]) catMap[cat] = { count: 0, value: 0, quantity: 0 };
        catMap[cat].count += 1;
        catMap[cat].quantity += qty;
        catMap[cat].value += val;
      });

      let categories = Object.entries(catMap).map(([category, info]) => ({
        category,
        count: info.count,
        value: Math.round(info.value),
        quantity: info.quantity,
      }));

      if (categories.length === 0) {
        categories = [
          { category: 'Machinery', count: 5, value: 152000, quantity: 52 },
          { category: 'Electronics', count: 5, value: 98500, quantity: 235 },
          { category: 'IT Hardware', count: 4, value: 58200, quantity: 37 },
          { category: 'Storage', count: 4, value: 36800, quantity: 240 },
          { category: 'Packaging', count: 5, value: 24500, quantity: 3950 },
          { category: 'Safety Gear', count: 5, value: 14500, quantity: 1147 },
        ];
      }

      return {
        total_products: total_products || 25,
        total_quantity: total_quantity || 5661,
        total_value: Math.round(total_value) || 384500,
        low_stock_count: low_stock_count || 5,
        out_of_stock_count: out_of_stock_count || 1,
        total_orders: 142,
        total_revenue: 524300,
        categories,
      } as unknown as T;
    }

    if (url.startsWith('/inventory/categories')) {
      const cats = Array.from(new Set(products.map((p) => p.category))).filter(Boolean).sort();
      return { categories: cats.length > 0 ? cats : ['Automation', 'Electronics', 'IT Hardware', 'Machinery', 'Packaging', 'Safety Gear', 'Storage Hardware'] } as unknown as T;
    }

    if (url === '/inventory/stats' && method === 'GET') {
      const total_skus = products.length;
      const total_units = products.reduce((acc, p) => acc + (p.quantity || p.stock_quantity || 0), 0);
      const total_value = products.reduce((acc, p) => acc + ((p.quantity || p.stock_quantity || 0) * (p.unit_price || 0)), 0);
      const low_stock_count = products.filter((p) => (p.quantity || p.stock_quantity || 0) <= (p.reorder_point || p.min_stock_threshold || 15)).length;
      return { total_skus, total_units, total_value, low_stock_count } as unknown as T;
    }

    if (method === 'GET' && (url === '/inventory' || url.startsWith('/inventory?') || url.startsWith('/inventory/'))) {
      const searchParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
      const search = (searchParams.get('search') || '').toLowerCase();
      const category = searchParams.get('category') || 'all';
      const status = searchParams.get('status') || 'all';

      let filtered = [...products];
      if (category && category !== 'all') {
        filtered = filtered.filter((p) => (p.category || '').toLowerCase() === category.toLowerCase());
      }
      if (status && status !== 'all') {
        filtered = filtered.filter((p) => (p.stock_status || '').toLowerCase() === status.toLowerCase());
      }
      if (search) {
        filtered = filtered.filter(
          (p) =>
            (p.name || '').toLowerCase().includes(search) ||
            (p.sku || '').toLowerCase().includes(search) ||
            (p.product_id || '').toLowerCase().includes(search) ||
            (p.supplier || '').toLowerCase().includes(search)
        );
      }

      const items = filtered.map((p, idx) => ({
        id: p.id || idx + 1,
        product_id: p.product_id || `WHX-${(p.category || 'GEN').substring(0, 2).toUpperCase()}-${String(idx + 1001)}`,
        name: p.name,
        category: p.category || 'General',
        quantity: p.quantity ?? p.stock_quantity ?? 25,
        unit_price: p.unit_price ?? 50.0,
        supplier: p.supplier || 'Standard Logistics',
        stock_status: p.stock_status || ((p.quantity ?? p.stock_quantity ?? 0) <= (p.reorder_point ?? 15) ? 'Low Stock' : 'In Stock'),
        reorder_point: p.reorder_point ?? p.min_stock_threshold ?? 15,
        location_zone: p.location_zone || p.warehouse_zone || 'Zone A-01',
        sku: p.sku || `SKU-${idx + 100}`,
      }));

      return {
        items,
        products: items,
        count: items.length,
        total: items.length,
      } as unknown as T;
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
