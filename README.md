# WAREHOUSEX
### Intelligent E-Commerce Warehouse Management & Linux Server Administration System
> **TAGLINE:** Secure. Automate. Monitor. Recover.

🌐 **Website:** [https://rashmigowda1206.github.io/WareHouseX/](https://rashmigowda1206.github.io/WareHouseX/)

---

## 🚀 Overview

**WareHouseX** is a centralized, enterprise-grade warehouse management platform fused directly with a robust **Ubuntu Linux Server Administration System**. It bridges day-to-day warehouse logistics (inventory cataloging, stock thresholds, order allocations, personnel accounts) with mission-critical server administration (LVM storage pools, automated POSIX TAR backups, SHA-256 disaster recovery, real-time hardware telemetry, OpenSSH security auditing, and UFW firewall enforcement).

WareHouseX is designed not as a toy CRUD website, but as a commercial infrastructure platform engineered for logistics centers running on production Linux servers.

---

## 🛡️ Key Architectural Highlights

1. **Dual-Engine Architecture (Live Linux Host + High-Fidelity Demo Emulation)**:
   - **Live Server Mode**: Automatically detects Linux environments and executes controlled, parameter-validated Bash scripts against `/proc`, `systemctl`, `df`, `pvs`, `vgs`, `lvs`, `tar`, and `ufw`.
   - **Demo / Emulation Mode**: High-fidelity simulation engine conforming to Ubuntu 24.04 LTS kernel specs, ensuring full functionality and testing capabilities on developer workstations without root permissions.
   - **Zero Fabricated Live Data**: Live server data and simulated demo data are strictly segregated and labeled with real-time UI status badges.

2. **Real POSIX TAR Backups & Overwrite-Protected Disaster Recovery**:
   - Creates genuine `.tar.gz` compressed archives with SHA-256 checksums and file-size telemetry.
   - Disaster recovery enforces a two-stage preflight check and requires explicit confirmation (`confirmation_code="RESTORE"`) before any state modifications can proceed.

3. **Strict Linux Security & Least Privilege**:
   - Zero arbitrary shell execution: Only allowlisted commands and strictly validated parameters are permitted.
   - PBKDF2/SHA-256 password hashing with role-based JWT sessions (`admin`, `manager`, `staff`).
   - OpenSSH port and hardening audits, UFW packet filter management, active session audits (`who`/`w`), and Fail2Ban intrusion detection.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI/UX** | React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Lucide React, Recharts |
| **Backend REST API** | Python 3.13, Flask, Flask-CORS, PyJWT, Werkzeug Security, psutil |
| **Database** | SQLite 3 with Write-Ahead Logging (`WAL` mode) and foreign key constraints |
| **Linux Integration Layer** | Ubuntu Linux, Bash shell scripts, LVM2, OpenSSH, UFW, Cron, POSIX TAR |

---

## 📂 Project Architecture

```
WareHouseX/
├── backend/
│   ├── app.py                      # Flask Application factory & REST route registrations
│   ├── config.py                   # Environment, storage paths, and JWT security keys
│   ├── requirements.txt            # Python dependencies
│   ├── warehousex.db               # SQLite production database (seeded with 25+ items & 7 users)
│   ├── database/
│   │   ├── db.py                   # Thread-safe SQLite connection & WAL PRAGMA handlers
│   │   ├── schema.sql              # Clean relational schema (10 tables)
│   │   └── seed_data.py            # Comprehensive enterprise seed data
│   ├── system_bridge/
│   │   ├── linux_adapter.py        # Safe script execution layer & cross-platform TAR engine
│   │   ├── emulator.py             # Realistic Ubuntu 24.04 LTS telemetry emulator
│   │   └── validator.py            # Strict regex sanitizers and command allowlists
│   ├── scripts/                    # Production Linux Bash integration scripts
│   │   ├── system_metrics.sh       # Hardware telemetry (CPU, RAM, Load, Network)
│   │   ├── storage_info.sh         # LVM groups, physical volumes, df mount points
│   │   ├── backup_create.sh        # POSIX TAR.GZ compilation & SHA-256 hashing
│   │   ├── backup_restore.sh       # Pre-flight integrity verify and safe unpack
│   │   ├── user_management.sh      # /etc/passwd and group synchronization
│   │   ├── security_audit.sh       # UFW firewall, OpenSSH, and failed auth auditing
│   │   └── service_control.sh      # Systemd daemon controls (ssh, ufw, cron, nginx)
│   ├── backups_storage/            # Directory where genuine .tar.gz archives are landed
│   ├── data_vault/                 # Production data assets & recovery sandbox
│   └── modules/
│       ├── auth.py                 # JWT authentication, role guards, login auditing
│       ├── employees.py            # Personnel CRUD + Linux system user sync
│       ├── inventory.py            # Warehouse asset catalog, SKU tracking, stock adjustments
│       ├── storage.py              # LVM and filesystem inspection endpoints
│       ├── backups.py              # Manual backups, cron schedules, archive verification
│       ├── recovery.py             # Overwrite-protected disaster recovery workflows
│       ├── monitoring.py           # Real-time hardware telemetry streams & top processes
│       ├── security.py             # UFW rules, OpenSSH audit, Fail2Ban management
│       ├── logs.py                 # Tamper-evident administrative audit trail
│       └── settings.py             # Facility config, profile updates, and Mode Toggle
│
├── frontend/
│   ├── package.json                # React, Vite, Tailwind, Recharts, Lucide, Framer Motion
│   ├── vite.config.ts              # Vite bundler with proxy to Flask on port 5000
│   ├── tsconfig.json               # TypeScript configuration
│   ├── src/
│   │   ├── main.tsx                # React root entrypoint
│   │   ├── App.tsx                 # Core application shell & navigation router
│   │   ├── index.css               # Dark industrial theme, custom scrollbars, cyber glows
│   │   ├── types/                  # Strict TypeScript type definitions
│   │   ├── services/               # REST API client services
│   │   ├── components/             # Reusable UI components (StatCards, Modals, TerminalView)
│   │   │   ├── layout/             # Sidebar, Header, ModeBadge
│   │   │   ├── common/             # StatCard, StatusBadge, Modal, ConfirmDialog, TerminalView
│   │   │   └── charts/             # LiveTelemetryChart, InventoryCategoryChart
│   │   └── pages/                  # The 11 Dedicated Application Views
│   │       ├── Login.tsx           # Authentication view with Quick-Fill role selector
│   │       ├── Dashboard.tsx       # Executive overview with 6 metric cards & live charts
│   │       ├── Inventory.tsx       # Warehouse inventory management & stock adjustment
│   │       ├── Employees.tsx       # Employee records & Linux /etc/passwd accounts
│   │       ├── Storage.tsx         # LVM2 storage pools & mounted filesystems
│   │       ├── Backups.tsx         # Backup automation & TAR operations
│   │       ├── DisasterRecovery.tsx# Safe rollback with explicit "RESTORE" confirmation
│   │       ├── Monitoring.tsx      # Deep real-time Linux telemetry & process manager
│   │       ├── Security.tsx        # UFW firewall & OpenSSH configuration audit
│   │       ├── ActivityLogs.tsx    # Filterable audit trail & CSV export
│   │       └── Settings.tsx        # Facility config & Live/Demo Mode Switcher
│
├── start_server.bat                # Windows 1-Click Launch Script
├── start_server.sh                 # Linux 1-Click Launch Script
├── .env.example                    # Environment variable template
└── README.md                       # Complete Documentation
```

---

## ⚡ Installation & Quick Start

### 1. Prerequisites
- **Python**: Version 3.10+ (Tested on Python 3.13)
- **Node.js**: Version 18+ (Tested on Node v24)
- **Linux Tools** (Optional for local dev, auto-detected on Ubuntu): `bash`, `tar`, `systemd`, `ufw`, `lvm2`

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start backend REST API server (Runs on port 5000)
python app.py
```

### 3. Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite React development server (Runs on port 5173)
npm run dev
```

### 4. 1-Click Launcher (Windows / Linux)
- On **Windows**: Double-click `start_server.bat`
- On **Linux / Ubuntu**: Run `chmod +x start_server.sh && ./start_server.sh`

Open your browser to:
👉 **`http://localhost:5173`**

---

## 🔑 Default Credentials & Role Matrix

WareHouseX includes pre-configured demo users with quick-fill buttons on the login screen:

| Username | Password | Role | Permissions |
|---|---|---|---|
| `admin` | `admin123` | **Administrator** | Full system authority: disaster recovery, security policies, user provisioning, systemd controls |
| `manager` | `manager123` | **Warehouse Manager** | Inventory catalog CRUD, stock adjustments, manual backup generation, employee oversight |
| `staff` | `staff123` | **Warehouse Staff** | View dashboard, inventory lookup, stock counting, system telemetry inspection |

---

## 🖥️ Screen Guide & Features

### 1. Login Page
- Dark industrial technology aesthetic with animated server heartbeat.
- Password visibility toggle and role-based JWT session token issuance.
- Instant single-click role quick-fill buttons for rapid evaluation.

### 2. Main Dashboard
- 6 High-level KPI cards: Total Products, Total Personnel, Fulfillment Orders, Total Inventory Value ($), Available Storage, Backup Status.
- Real-time CPU & RAM stream using Recharts Area Charts.
- Category asset distribution chart.
- Server health indicator: Kernel, Uptime, 1m/5m/15m Load Averages.
- Live administrative activity log feed.

### 3. Inventory Management
- Real-time catalog with 25+ preloaded industrial items across Electronics, Machinery, Packaging, IT Hardware, and Safety Equipment.
- Full CRUD: Add Product, Edit Specifications, Delete Item.
- Search by SKU, Product ID, Name, or Warehouse Zone.
- Category filtering and Stock Level alerts (`Low Stock`, `Out of Stock`, `In Stock`, `Overstocked`).
- Instant Stock Adjustment (+/-) with required audit log reason.
- CSV export for warehouse picking sheets and manifests.

### 4. Employee Management
- Provision new staff with name, email, credentials, and role.
- **Linux User Integration**: Automatically provisions corresponding `/etc/passwd` account (`whx_<username>`) and assigns to appropriate Linux group (`wh-admins`, `wh-managers`, `wh-staff`).
- Dedicated tab to inspect system accounts, UIDs, GIDs, and login shells.

### 5. Storage & LVM Management
- Real-time disk capacity, used space, and available headroom.
- Hierarchical inspection of LVM2 architecture: Physical Volumes (`pvs`), Volume Groups (`vgs`), Logical Volumes (`lvs`).
- Mounted filesystems table (`df -hPT`) with visual utilization gauges.
- SMART health status monitor.
- One-click temporary buffer purge for storage reclamation.

### 6. Backup Center
- Create manual backups: Full System, Database WAL Dump, Inventory Catalog, or System Configs.
- POSIX TAR.GZ compression with computed SHA-256 cryptographic checksums.
- Archive integrity verification (`tar -tzf`).
- Configure daily, weekly, or hourly Cron backup schedules and retention rules.
- Real-time terminal view of backup execution logs.

### 7. Disaster Recovery Center
- Lists verified archive snapshots ready for restoration.
- Pre-flight safety check: Verifies TAR header integrity and counts files before touching production state.
- **Production Overwrite Protection**: Destructive writes are gated behind an explicit confirmation code (`RESTORE`) modal.
- Logs all restoration incidents in an immutable recovery history table.

### 8. System Monitoring
- Live 3s/5s/10s polling of Linux CPU, RAM, Disk I/O, and Network throughput.
- Systemd daemon controller: Check status, restart, or reload allowlisted services (`ssh`, `ufw`, `cron`, `nginx`, `warehousex-api`).
- Top 10 CPU and Memory consuming kernel processes table.

### 9. Security & Firewall Center
- UFW packet filter status and rules table.
- OpenSSH daemon audit: Port 22, Protocol 2, Root Login Disabled, Key-Based Auth enforced.
- Active login session inspection (`who -u` / `w`).
- Dropped intrusion attempts from `/var/log/auth.log` with Fail2Ban monitoring.
- Allowlisted administrator controls: Add Port Rule, Delete Policy, Reload UFW, Flush IP Bans.

### 10. Activity Logs
- Comprehensive audit trail recording employee provisioning, inventory adjustments, backup creation, disaster recoveries, and firewall modifications.
- Filterable by module and severity (`INFO`, `WARNING`, `CRITICAL`, `SUCCESS`).
- One-click CSV export for compliance reporting.

### 11. Settings
- Update warehouse facility metadata, currency, and timezone.
- Configure backup target path and retention cycle.
- Operator profile and password credential updates.
- **Operational Mode Toggle**: Instant switch between **Live Ubuntu Host Mode** and **Demo Simulation Mode**.

---

## 🔒 Security Best Practices Implemented

1. **No Arbitrary Shell Execution**: The backend does NOT expose arbitrary `eval` or shell terminals. All Linux interactions run through dedicated, parameterized Bash scripts with strict allowlists.
2. **Path Traversal Protection**: All archive filenames and storage paths are sanitized against `../` or absolute path escapes using `pathlib.Path.resolve()`.
3. **Password Security**: Passwords are never stored in plaintext. Passwords use Werkzeug's salted `pbkdf2:sha256` hashing algorithm.
4. **Role-Based API Guards**: Sensitive operations (Disaster Recovery, Firewall modifications, Employee Deletion) require the `admin` role header.
5. **Overwrite Prevention**: Disaster recovery requires typing the exact confirmation code `RESTORE` to prevent accidental data destruction.

---

## 📄 License
MIT License. Developed for enterprise e-commerce warehouse logistics and Linux server infrastructure management.
