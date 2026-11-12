# WareHouseX – Linux Implementation Guide

## Project
WareHouseX – E-Commerce Warehouse Management Using Linux Server

## 1. User and Group Management

Groups created:
- warehouse_admin
- inventory
- dispatch

Users created:
- warehouse_manager
- inventory_staff
- dispatch_staff

Manager supplementary groups:
sudo usermod -aG inventory,dispatch warehouse_manager

Verification:
id warehouse_manager
id inventory_staff
id dispatch_staff

## 2. Directory Ownership and Permissions

sudo chown -R root:warehouse_admin /opt/warehousex
sudo chown -R root:inventory /opt/warehousex/inventory
sudo chown -R root:dispatch /opt/warehousex/orders
sudo chown -R root:warehouse_admin /opt/warehousex/employees

Directory permissions:
sudo chmod 750 /opt/warehousex
sudo chmod 750 /opt/warehousex/inventory
sudo chmod 750 /opt/warehousex/orders
sudo chmod 750 /opt/warehousex/employees
sudo chmod 750 /opt/warehousex/backups
sudo chmod 750 /opt/warehousex/logs
sudo chmod 750 /opt/warehousex/scripts
sudo chmod 750 /opt/warehousex/reports

CSV file permissions:
sudo find /opt/warehousex -type f -name "*.csv" -exec chmod 640 {} \;

## 3. Access Control Lists (ACL)

Grant directory traversal:
sudo setfacl -m g:inventory:--x,g:dispatch:--x /opt/warehousex

Inventory access:
sudo setfacl -m g:inventory:r-x /opt/warehousex/inventory

Order access:
sudo setfacl -m g:dispatch:r-x /opt/warehousex/orders

Administrator access:
sudo setfacl -m g:warehouse_admin:rwx /opt/warehousex

Grant inventory CSV read access:
sudo find /opt/warehousex/inventory -maxdepth 1 -type f -name "*.csv" -exec setfacl -m g:inventory:r-- {} +

Grant order CSV read access:
sudo find /opt/warehousex/orders -maxdepth 1 -type f -name "*.csv" -exec setfacl -m g:dispatch:r-- {} +

Verification:
getfacl /opt/warehousex
getfacl /opt/warehousex/inventory
getfacl /opt/warehousex/orders

## 4. Inventory Reporting

Script:
 /opt/warehousex/scripts/inventory_report.sh

Purpose:
- Reads warehouse stock data.
- Displays product quantities.
- Identifies products with quantity below 30.
- Generates inventory_report.txt.

Execution:
sudo bash /opt/warehousex/scripts/inventory_report.sh

## 5. Automated Backup

Script:
 /opt/warehousex/scripts/backup_warehouse.sh

Purpose:
- Creates compressed TAR.GZ archives.
- Backs up inventory, employee, order and report data.
- Uses timestamps to distinguish backup versions.

Execution:
sudo bash /opt/warehousex/scripts/backup_warehouse.sh

## 6. Cron Scheduling

Enable cron:
sudo systemctl enable --now cron

Root crontab:
0 0 * * * /bin/bash /opt/warehousex/scripts/backup_warehouse.sh >> /opt/warehousex/logs/backup_cron.log 2>&1

0 8 * * * /bin/bash /opt/warehousex/scripts/system_monitor.sh >> /opt/warehousex/logs/monitor_cron.log 2>&1

Verification:
systemctl is-active cron
sudo crontab -l

## 7. Package Management

Installed utilities:
sudo apt install tree htop -y

Verification:
dpkg -l tree htop

## 8. System Monitoring

Script:
 /opt/warehousex/scripts/system_monitor.sh

Monitors:
- CPU information
- Memory usage
- Disk usage
- System uptime
- Running processes

Execution:
sudo bash /opt/warehousex/scripts/system_monitor.sh

Generated report:
 /opt/warehousex/reports/system_monitor_report.txt

## 9. Backup Recovery Verification

List backup contents:
sudo tar -tzf /opt/warehousex/backups/warehouse_backup_2026-11-11_16-01-02.tar.gz

Restore test:
sudo mkdir -p /tmp/warehousex_restore_test

sudo tar -xzf /opt/warehousex/backups/warehouse_backup_2026-11-11_16-01-02.tar.gz -C /tmp/warehousex_restore_test

The restored files were compared with the original files using checksums.

## 10. Web Application Integration

Application:
WareHouseX

Frontend:
React, TypeScript, Vite and Tailwind CSS.

Backend:
Python Flask and Flask-CORS.

Database:
SQLite.

Frontend development server:
http://localhost:5173/

Backend API:
http://localhost:5000/

Health verification:
curl http://127.0.0.1:5000/api/health

The application was tested in DEMO mode. The dashboard demonstrates warehouse administration features, while the Linux administration scripts and scheduled tasks are configured separately on Ubuntu.

## 11. Final Verification

Check cron:
systemctl is-active cron

Check scripts:
sudo ls -lh /opt/warehousex/scripts/

Check backups:
sudo ls -lh /opt/warehousex/backups/

Check scheduled jobs:
sudo crontab -l

Check directory permissions:
sudo ls -ld /opt/warehousex/inventory /opt/warehousex/orders /opt/warehousex/employees

---

Project tagline:
Secure. Automate. Monitor. Recover.
