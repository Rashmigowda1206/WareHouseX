import os
import hashlib
from datetime import datetime, timedelta, timezone
from werkzeug.security import generate_password_hash
from database.db import get_db, init_db

def seed_database():
    init_db()

    with get_db() as conn:
        # Check if already seeded
        user_count = conn.execute("SELECT COUNT(*) as count FROM users").fetchone()["count"]
        if user_count > 0:
            print("[INFO] Database already seeded.")
            return

        print("[INFO] Seeding WareHouseX enterprise dataset...")

        # 1. Users / Employees
        users_data = [
            ("admin", generate_password_hash("admin123"), "Alexander Hayes", "admin@warehousex.internal", "admin", "whx_admin", "wh-admins", "active"),
            ("manager", generate_password_hash("manager123"), "Elena Rostova", "manager@warehousex.internal", "manager", "whx_manager", "wh-managers", "active"),
            ("staff", generate_password_hash("staff123"), "Devon Vance", "staff@warehousex.internal", "staff", "whx_staff01", "wh-staff", "active"),
            ("rashmi", generate_password_hash("rashmi123"), "Rashmi", "rashmi@warehousex.internal", "admin", "whx_rashmi", "wh-admins", "active"),
            ("panchak", generate_password_hash("panchak123"), "Panchaksharayya", "panchak@warehousex.internal", "admin", "whx_panchak", "wh-admins", "active"),
            ("darshan", generate_password_hash("darshan123"), "S Darshan Sai", "darshan@warehousex.internal", "manager", "whx_darshan", "wh-managers", "active"),
            ("apoorva", generate_password_hash("apoorva123"), "Apoorva P Keretot", "apoorva@warehousex.internal", "manager", "whx_apoorva", "wh-managers", "active"),
            ("dkalu", generate_password_hash("staff123"), "David Kalu", "d.kalu@warehousex.internal", "staff", "whx_staff02", "wh-staff", "active"),
            ("schen", generate_password_hash("staff123"), "Sarah Chen", "s.chen@warehousex.internal", "manager", "whx_leadsec", "wh-admins", "active"),
            ("ppatel", generate_password_hash("staff123"), "Priya Patel", "p.patel@warehousex.internal", "staff", "whx_staff03", "wh-staff", "active"),
            ("kpatel", generate_password_hash("staff123"), "Kiran Patel", "k.patel@warehousex.internal", "staff", "whx_kpatel", "wh-staff", "active"),
            ("rjohnson", generate_password_hash("staff123"), "Robert Johnson", "r.johnson@warehousex.internal", "staff", "whx_rjohnson", "wh-staff", "active"),
            ("amendoza", generate_password_hash("staff123"), "Anita Mendoza", "a.mendoza@warehousex.internal", "staff", "whx_amendoza", "wh-staff", "active"),
            ("mross", generate_password_hash("staff123"), "Marcus Ross", "m.ross@warehousex.internal", "staff", "whx_staff04", "wh-staff", "inactive")
        ]

        conn.executemany("""
            INSERT INTO users (username, password_hash, full_name, email, role, linux_user, linux_group, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, users_data)

        # 2. Inventory Records (Realistic E-Commerce & Warehouse Items)
        inventory_items = [
            ("WHX-EL-1001", "Industrial Barcode Scanner 2D Pro", "Electronics", 145, 289.50, "OmniScan Dynamics", "In Stock", 20, "Zone A-01-A", "SKU-SCN-289"),
            ("WHX-EL-1002", "Enterprise Rugged RFID Handheld Terminal", "Electronics", 42, 650.00, "ZebraTech Global", "In Stock", 15, "Zone A-01-B", "SKU-RFD-650"),
            ("WHX-EL-1003", "Thermal Label Printer ZT-411 Series", "Electronics", 12, 895.00, "LogiPrint Industrial", "Low Stock", 15, "Zone A-02-C", "SKU-PRN-895"),
            ("WHX-EL-1004", "Industrial Wireless AP WiFi 6E Outdoor", "Electronics", 28, 420.00, "Ubiquiti Edge", "In Stock", 10, "Zone A-03-A", "SKU-WAP-420"),
            ("WHX-EL-1005", "Automated Forklift Fleet Telematics Unit", "Electronics", 8, 1250.00, "AeroVeloce Systems", "Low Stock", 10, "Zone A-03-B", "SKU-FLT-125"),
            ("WHX-MC-2001", "Electric Pallet Jack Lithium 48V 2.5T", "Machinery", 14, 3450.00, "Crown Equipment Corp", "In Stock", 5, "Zone B-01-F", "SKU-PLJ-345"),
            ("WHX-MC-2002", "Automated Guided Vehicle (AGV) Tugger", "Machinery", 4, 18200.00, "KUKA Robotics", "Low Stock", 5, "Zone B-02-F", "SKU-AGV-182"),
            ("WHX-MC-2003", "Hydraulic Scissor Lift Table 1500kg", "Machinery", 9, 2150.00, "Vestil Manufacturing", "In Stock", 4, "Zone B-03-F", "SKU-SCL-215"),
            ("WHX-MC-2004", "Conveyor Roller Module 3.5m Powered", "Machinery", 22, 1180.00, "Interroll Systems", "In Stock", 8, "Zone B-04-F", "SKU-CVR-118"),
            ("WHX-MC-2005", "Stretch Pallet Wrapper Semi-Auto", "Machinery", 3, 4900.00, "Lantech Global", "Low Stock", 4, "Zone B-05-F", "SKU-STW-490"),
            ("WHX-PK-3001", "Heavy-Duty Corrugated Cartons 60x40x40", "Packaging", 2400, 3.85, "Smurfit Kappa", "Overstocked", 500, "Zone C-01-A", "SKU-BOX-604"),
            ("WHX-PK-3002", "Biodegradable Air Pillow Void Fill (Roll)", "Packaging", 320, 48.00, "Sealed Air Solutions", "In Stock", 100, "Zone C-01-B", "SKU-AIR-320"),
            ("WHX-PK-3003", "Reinforced Gummed Paper Tape 70mm x 150m", "Packaging", 580, 14.50, "3M Industrial Tape", "In Stock", 150, "Zone C-02-A", "SKU-TAP-580"),
            ("WHX-PK-3004", "Euro Wooden Pallets Heat Treated EPAL", "Packaging", 650, 22.00, "Faber Pallets BV", "In Stock", 200, "Zone C-03-A", "SKU-PLT-650"),
            ("WHX-PK-3005", "Anti-Static Bubble Wrap Roll 100m", "Packaging", 0, 38.00, "Protective Pac Ltd", "Out of Stock", 50, "Zone C-03-B", "SKU-BUB-100"),
            ("WHX-SF-4001", "Steel-Toe Kevlar Safety Boots ISO 20345", "Safety Gear", 180, 78.00, "Red Wing Industrial", "In Stock", 40, "Zone D-01-A", "SKU-BOT-180"),
            ("WHX-SF-4002", "High-Vis ANSI Class 3 Heated Winter Vest", "Safety Gear", 95, 62.00, "Carhartt Workwear", "In Stock", 30, "Zone D-01-B", "SKU-VST-095"),
            ("WHX-SF-4003", "Cut-Resistant Level 5 Nitrile Grip Gloves", "Safety Gear", 850, 6.50, "Ansell Protective", "In Stock", 200, "Zone D-02-A", "SKU-GLV-850"),
            ("WHX-SF-4004", "Emergency Eyewash Station Wall Mount", "Safety Gear", 16, 210.00, "Haws Safety Co", "In Stock", 5, "Zone D-02-B", "SKU-EYE-016"),
            ("WHX-SF-4005", "Industrial First Aid Kit Class B 150-Person", "Safety Gear", 6, 175.00, "Cintas Corp", "Low Stock", 10, "Zone D-03-A", "SKU-MED-006"),
            ("WHX-IT-5001", "Rackmount Server Chassis 2U Xeon E-2388", "IT Hardware", 7, 2480.00, "Supermicro USA", "In Stock", 3, "Server Room R-01", "SKU-SRV-248"),
            ("WHX-IT-5002", "Enterprise NVMe SSD U.2 7.68TB PCIe 4.0", "IT Hardware", 24, 690.00, "Samsung Electronics", "In Stock", 8, "Server Room R-01", "SKU-SSD-768"),
            ("WHX-IT-5003", "Managed L3 Switch 48-Port 10GbE SFP+", "IT Hardware", 4, 3100.00, "Cisco Systems", "Low Stock", 5, "Server Room R-02", "SKU-SWT-310"),
            ("WHX-IT-5004", "UPS Smart-UPS On-Line 6000VA 230V 4U", "IT Hardware", 2, 4250.00, "APC Schneider", "Low Stock", 3, "Power Room P-01", "SKU-UPS-600"),
            ("WHX-CS-6001", "Smart Temperature & Humidity LoRa Sensor", "IoT Hardware", 110, 54.00, "Milesight IoT", "In Stock", 25, "Zone E-01-A", "SKU-TMP-110")
        ]

        conn.executemany("""
            INSERT INTO inventory (product_id, name, category, quantity, unit_price, supplier, stock_status, reorder_point, location_zone, sku)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, inventory_items)

        # 3. Orders (Realistic E-Commerce Orders)
        orders_data = [
            ("ORD-2026-9011", "Global Logistics Hub GmbH", 18, 4820.00, "shipped"),
            ("ORD-2026-9012", "Metro Fulfillment Center", 5, 12890.00, "processing"),
            ("ORD-2026-9013", "Nordic Supply Chain AS", 140, 2450.00, "delivered"),
            ("ORD-2026-9014", "Pacific Rim Distribution", 32, 8740.00, "delivered"),
            ("ORD-2026-9015", "Apex Retailers Ltd", 3, 10350.00, "pending"),
            ("ORD-2026-9016", "Amazon Relay Fulfillment", 85, 3420.00, "shipped"),
            ("ORD-2026-9017", "FastShip Logistics Inc", 12, 1780.00, "shipped"),
            ("ORD-2026-9018", "EuroPort Terminal Services", 4, 18200.00, "processing"),
            ("ORD-2026-9019", "DHL Supply Chain UK", 62, 5920.00, "delivered"),
            ("ORD-2026-9020", "FedEx Freight Depot", 20, 2850.00, "delivered")
        ]

        conn.executemany("""
            INSERT INTO orders (order_number, customer, items_count, total_amount, status)
            VALUES (?, ?, ?, ?, ?)
        """, orders_data)

        # 4. Initial Backups record
        backups_data = [
            ("whx_backup_full_20261109_0200.tar.gz", "full", 184549376, "176.0 MB", "completed", "a8fbc89e34e56721098df1234abcd89012345678abcdef1234567890abcdef12", "backups_storage/whx_backup_full_20261109_0200.tar.gz", "verified", "Automated daily system and database snapshot"),
            ("whx_backup_db_20261110_0200.tar.gz", "database", 14680064, "14.0 MB", "completed", "7c98124ef90123456789abcdef1234567890abcdef1234567890abcdef123456", "backups_storage/whx_backup_db_20261110_0200.tar.gz", "verified", "Automated nightly SQLite WAL snapshot"),
            ("whx_backup_inventory_20261110_0800.tar.gz", "inventory", 8388608, "8.0 MB", "completed", "5e2390ab1234567890abcdef1234567890abcdef1234567890abcdef12345678", "backups_storage/whx_backup_inventory_20261110_0800.tar.gz", "verified", "Shift change inventory catalog export")
        ]

        conn.executemany("""
            INSERT INTO backups (filename, backup_type, size_bytes, size_formatted, status, sha256_checksum, file_path, verification_status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, backups_data)

        # 5. Backup Schedules
        schedules_data = [
            ("daily", "02:00", "0 2 * * *", 14, "full", 1),
            ("daily", "14:00", "0 14 * * *", 7, "database", 1),
            ("weekly", "00:00", "0 0 * * 0", 30, "full", 1)
        ]

        conn.executemany("""
            INSERT INTO backup_schedules (schedule_type, time_utc, cron_expr, retention_days, backup_type, enabled)
            VALUES (?, ?, ?, ?, ?, ?)
        """, schedules_data)

        # 6. Recovery History
        recovery_data = [
            (2, "whx_backup_db_20261108_0200.tar.gz", "Alexander Hayes", "Staging Validation DB", "success", 12, "2026-11-08 14:15:22", "2026-11-08 14:17:05", "Checksum OK. Database tables verified. 0 anomalies detected.")
        ]

        conn.executemany("""
            INSERT INTO recovery_history (backup_id, backup_filename, restored_by, restore_target, status, files_restored_count, started_at, completed_at, log_output)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, recovery_data)

        # 7. Activity Logs
        logs_data = [
            ("admin", "SYSTEM_STARTUP", "system", "WareHouseX daemon started on Ubuntu 24.04 LTS (kernel 6.8.0-45-generic)", "info", "127.0.0.1"),
            ("admin", "LOGIN_SUCCESS", "auth", "User admin logged in successfully via console session", "success", "192.168.1.105"),
            ("admin", "BACKUP_VERIFY", "backup", "Integrity check passed for whx_backup_full_20261109_0200.tar.gz (SHA256 Match)", "success", "127.0.0.1"),
            ("manager", "STOCK_UPDATE", "inventory", "Updated stock quantity for SKU-SCN-289 (+25 units received)", "info", "192.168.1.112"),
            ("schen", "UFW_RULE_ADDED", "security", "Firewall rule created: ALLOW TCP 5000 from 192.168.1.0/24", "warning", "192.168.1.109"),
            ("admin", "CRON_CONFIG_UPDATE", "backup", "Updated nightly backup schedule to retention=14 days", "info", "192.168.1.105"),
            ("system", "LVM_SNAPSHOT_CLEANUP", "storage", "Removed expired LVM snapshot vg_warehousex/snap_inv_temp", "info", "127.0.0.1"),
            ("staff", "INVENTORY_QUERY", "inventory", "Bulk export generated for Zone B machinery assets", "info", "192.168.1.140")
        ]

        conn.executemany("""
            INSERT INTO activity_logs (username, action, module, details, severity, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
        """, logs_data)

        # 8. Security Rules
        rules_data = [
            ("ufw", "OpenSSH Production Access", 22, "tcp", "allow", "192.168.1.0/24", "active"),
            ("ufw", "WareHouseX Web GUI (HTTP)", 80, "tcp", "allow", "Anywhere", "active"),
            ("ufw", "WareHouseX Secure API (HTTPS)", 443, "tcp", "allow", "Anywhere", "active"),
            ("ufw", "Internal Backend API Microservice", 5000, "tcp", "allow", "10.0.0.0/8", "active"),
            ("ufw", "Telemetry & Prometheus Node Exporter", 9100, "tcp", "deny", "Anywhere", "active")
        ]

        conn.executemany("""
            INSERT INTO security_rules (rule_type, rule_name, port, protocol, action, source_ip, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, rules_data)

        # 9. Failed Logins
        failed_logins = [
            ("root", "185.220.101.45", "Unauthorized root SSH attempt via external IP", "SSH-2.0-OpenSSH_8.9p1"),
            ("oracle", "45.154.255.89", "Dictionary brute force detected and dropped by UFW", "libssh-0.9.6"),
            ("guest", "192.168.1.250", "Invalid password credential on web portal", "Mozilla/5.0")
        ]

        conn.executemany("""
            INSERT INTO failed_logins (username_attempted, ip_address, reason, user_agent)
            VALUES (?, ?, ?, ?)
        """, failed_logins)

        # 10. System Settings
        settings_data = [
            ("warehouse_name", "WareHouseX Alpha Central - Hub 01", "general", "Operational facility identifier"),
            ("currency", "USD ($)", "general", "Default financial reporting currency"),
            ("timezone", "UTC+00:00", "general", "Server system timezone alignment"),
            ("low_stock_threshold_default", "15", "inventory", "Global fallback alert threshold for inventory replenishment"),
            ("backup_storage_path", "/var/backups/warehousex", "backup", "Linux local filesystem target mount for TAR archives"),
            ("backup_retention_days", "14", "backup", "Automated pruning cycle for legacy backup images"),
            ("ssh_port", "22", "security", "Configured OpenSSH daemon listening port"),
            ("enforce_linux_user_sync", "true", "system", "Whether warehouse employees are mirrored in Linux /etc/passwd")
        ]

        conn.executemany("""
            INSERT INTO system_settings (setting_key, setting_value, category, description)
            VALUES (?, ?, ?, ?)
        """, settings_data)

        print("[SUCCESS] WareHouseX database initialized and seeded successfully.")

if __name__ == "__main__":
    seed_database()
