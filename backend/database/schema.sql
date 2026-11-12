-- WareHouseX Enterprise Database Schema

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'staff')),
    linux_user TEXT,
    linux_group TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_price REAL NOT NULL DEFAULT 0.0,
    supplier TEXT NOT NULL,
    stock_status TEXT NOT NULL CHECK(stock_status IN ('In Stock', 'Low Stock', 'Out of Stock', 'Overstocked')),
    reorder_point INTEGER NOT NULL DEFAULT 10,
    location_zone TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    customer TEXT NOT NULL,
    items_count INTEGER NOT NULL DEFAULT 1,
    total_amount REAL NOT NULL DEFAULT 0.0,
    status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT UNIQUE NOT NULL,
    backup_type TEXT NOT NULL CHECK(backup_type IN ('full', 'database', 'inventory', 'config')),
    size_bytes INTEGER NOT NULL DEFAULT 0,
    size_formatted TEXT NOT NULL DEFAULT '0 B',
    status TEXT NOT NULL CHECK(status IN ('completed', 'failed', 'verifying', 'restoring')),
    sha256_checksum TEXT,
    file_path TEXT NOT NULL,
    verification_status TEXT DEFAULT 'verified' CHECK(verification_status IN ('verified', 'unverified', 'corrupt')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS backup_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_type TEXT NOT NULL CHECK(schedule_type IN ('daily', 'weekly', 'hourly')),
    time_utc TEXT NOT NULL DEFAULT '02:00',
    cron_expr TEXT NOT NULL DEFAULT '0 2 * * *',
    retention_days INTEGER NOT NULL DEFAULT 14,
    backup_type TEXT NOT NULL DEFAULT 'full',
    enabled INTEGER NOT NULL DEFAULT 1,
    last_run TIMESTAMP,
    next_run TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recovery_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    backup_id INTEGER,
    backup_filename TEXT NOT NULL,
    restored_by TEXT NOT NULL,
    restore_target TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('success', 'in_progress', 'failed')),
    files_restored_count INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    log_output TEXT,
    FOREIGN KEY(backup_id) REFERENCES backups(id)
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    username TEXT NOT NULL,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    details TEXT,
    severity TEXT NOT NULL CHECK(severity IN ('info', 'warning', 'critical', 'success')),
    ip_address TEXT DEFAULT '127.0.0.1'
);

CREATE TABLE IF NOT EXISTS security_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_type TEXT NOT NULL DEFAULT 'ufw',
    rule_name TEXT NOT NULL,
    port INTEGER NOT NULL,
    protocol TEXT NOT NULL DEFAULT 'tcp',
    action TEXT NOT NULL DEFAULT 'allow' CHECK(action IN ('allow', 'deny', 'reject')),
    source_ip TEXT DEFAULT 'Anywhere',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS failed_logins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username_attempted TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT NOT NULL,
    user_agent TEXT
);

CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
