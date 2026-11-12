import random
import time
from datetime import datetime, timezone

class LinuxEmulator:
    """
    High-fidelity Ubuntu 24.04 LTS System Emulator.
    Used when WareHouseX is running in DEMO mode or on a development host without Linux root privileges.
    Clearly tags all payloads with mode='simulated'.
    """
    def __init__(self):
        self._start_time = time.time() - (14 * 86400 + 7 * 3600 + 42 * 60) # ~14 days uptime

    def get_system_metrics(self):
        elapsed = time.time() - self._start_time
        days = int(elapsed // 86400)
        hours = int((elapsed % 86400) // 3600)
        mins = int((elapsed % 3600) // 60)
        uptime_str = f"up {days} days, {hours} hours, {mins} minutes"

        cpu_base = 24.0 + random.uniform(-6.0, 12.0)
        mem_used_mb = 7168 + int(random.uniform(-300, 500))
        total_mem_mb = 16384

        return {
            "mode": "simulated",
            "environment": "Ubuntu 24.04 LTS (Kernel 6.8.0-45-generic x86_64)",
            "hostname": "warehousex-core-srv01",
            "os_release": "Ubuntu 24.04.1 LTS (Noble Numbat)",
            "uptime": uptime_str,
            "uptime_seconds": int(elapsed),
            "load_average": {
                "1m": round(0.42 + random.uniform(-0.15, 0.35), 2),
                "5m": round(0.55 + random.uniform(-0.10, 0.20), 2),
                "15m": round(0.61 + random.uniform(-0.05, 0.15), 2)
            },
            "cpu": {
                "percent": max(5, min(95, round(cpu_base, 1))),
                "cores": 8,
                "model": "AMD EPYC 7763 64-Core Processor @ 2.45GHz",
                "temperature_c": round(44.5 + random.uniform(-2.0, 4.0), 1)
            },
            "memory": {
                "total_mb": total_mem_mb,
                "used_mb": mem_used_mb,
                "free_mb": total_mem_mb - mem_used_mb,
                "percent": round((mem_used_mb / total_mem_mb) * 100, 1),
                "cached_mb": 4096,
                "swap_total_mb": 8192,
                "swap_used_mb": 512
            },
            "disk": {
                "total_gb": 3072,
                "used_gb": 1342,
                "avail_gb": 1730,
                "percent": 43.7
            },
            "network": {
                "interface": "ens3 (10Gbps SFP+ Fiber)",
                "rx_bytes": 10485760000 + int(elapsed * 124000),
                "tx_bytes": 6291456000 + int(elapsed * 98000),
                "rx_speed_kbps": round(1420 + random.uniform(-300, 600), 1),
                "tx_speed_kbps": round(980 + random.uniform(-200, 400), 1)
            },
            "services": {
                "ssh": "active",
                "ufw": "active",
                "cron": "active",
                "nginx": "active",
                "warehousex-api": "active",
                "systemd-journald": "active"
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    def get_storage_info(self):
        return {
            "mode": "simulated",
            "total_capacity_gb": 3072,
            "used_storage_gb": 1342,
            "available_storage_gb": 1730,
            "used_percent": 43.7,
            "filesystems": [
                {"filesystem": "/dev/mapper/vg_warehousex-lv_root", "type": "ext4", "size": "240G", "used": "98G", "avail": "130G", "use_percent": "43%", "mount": "/"},
                {"filesystem": "/dev/mapper/vg_warehousex-lv_inv", "type": "xfs", "size": "500G", "used": "145G", "avail": "355G", "use_percent": "29%", "mount": "/opt/warehousex/data"},
                {"filesystem": "/dev/mapper/vg_warehousex-lv_backup", "type": "ext4", "size": "1.2T", "used": "420G", "avail": "780G", "use_percent": "35%", "mount": "/var/backups/warehousex"},
                {"filesystem": "/dev/mapper/vg_warehousex-lv_database", "type": "ext4", "size": "300G", "used": "89G", "avail": "211G", "use_percent": "30%", "mount": "/var/lib/warehousex/db"},
                {"filesystem": "/dev/nvme0n1p1", "type": "vfat", "size": "1024M", "used": "120M", "avail": "904M", "use_percent": "12%", "mount": "/boot/efi"}
            ],
            "volume_groups": [
                {"vg": "vg_warehousex", "size": "3.00 TiB", "free": "730.00 GiB", "pv_count": 2, "lv_count": 4, "format": "lvm2"}
            ],
            "logical_volumes": [
                {"lv": "lv_root", "vg": "vg_warehousex", "size": "240.00 GiB", "mount": "/", "filesystem": "ext4", "status": "active"},
                {"lv": "lv_inv", "vg": "vg_warehousex", "size": "500.00 GiB", "mount": "/opt/warehousex/data", "filesystem": "xfs", "status": "active"},
                {"lv": "lv_backup", "vg": "vg_warehousex", "size": "1.20 TiB", "mount": "/var/backups/warehousex", "filesystem": "ext4", "status": "active"},
                {"lv": "lv_database", "vg": "vg_warehousex", "size": "300.00 GiB", "mount": "/var/lib/warehousex/db", "filesystem": "ext4", "status": "active"}
            ],
            "physical_volumes": [
                {"pv": "/dev/nvme0n1p3", "vg": "vg_warehousex", "size": "2.00 TiB", "free": "450.00 GiB", "type": "NVMe Gen4 Enterprise"},
                {"pv": "/dev/sdb1", "vg": "vg_warehousex", "size": "1.00 TiB", "free": "280.00 GiB", "type": "SAS 12Gbps Enterprise HDD"}
            ],
            "smart_status": "Healthy - All 4 Drives Verified (0 SMART Errors)",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    def get_security_audit(self):
        return {
            "mode": "simulated",
            "firewall": {
                "status": "active",
                "default_incoming": "deny",
                "default_outgoing": "allow",
                "logging": "on (medium)",
                "rules": [
                    {"num": 1, "rule": "22/tcp", "action": "ALLOW IN", "from": "192.168.1.0/24", "comment": "OpenSSH Warehouse Admin Net"},
                    {"num": 2, "rule": "80/tcp", "action": "ALLOW IN", "from": "Anywhere", "comment": "Nginx HTTP"},
                    {"num": 3, "rule": "443/tcp", "action": "ALLOW IN", "from": "Anywhere", "comment": "WareHouseX HTTPS UI"},
                    {"num": 4, "rule": "5000/tcp", "action": "ALLOW IN", "from": "10.0.0.0/8", "comment": "Internal Flask API Bridge"},
                    {"num": 5, "rule": "9100/tcp", "action": "DENY IN", "from": "Anywhere", "comment": "Block Public Metrics"}
                ]
            },
            "openssh": {
                "status": "active",
                "service": "ssh.service",
                "port": "22",
                "protocol": "2",
                "permit_root_login": "no (Hardened)",
                "password_authentication": "no (Ed25519 Keys Only)",
                "max_auth_tries": 3,
                "banner": "/etc/issue.net (WareHouseX Authorized Only)"
            },
            "active_sessions": [
                {"user": "whx_admin", "tty": "pts/0", "from": "192.168.1.105", "login_time": "14:22 UTC", "idle": "2m"},
                {"user": "whx_leadsec", "tty": "pts/1", "from": "192.168.1.109", "login_time": "15:05 UTC", "idle": "12s"}
            ],
            "failed_logins": [
                {"time": "Nov 10 03:14:22", "ip": "185.220.101.45", "user": "root", "reason": "Unauthorized external SSH brute force blocked"},
                {"time": "Nov 10 05:22:11", "ip": "45.154.255.89", "user": "oracle", "reason": "Repeated failed attempts, IP banned via fail2ban"},
                {"time": "Nov 10 08:44:03", "ip": "192.168.1.250", "user": "guest", "reason": "Invalid console token on terminal 4"}
            ],
            "security_score": 96,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    def get_linux_users(self):
        return {
            "mode": "simulated",
            "users": [
                {"username": "whx_admin", "uid": 1001, "gid": 1001, "home": "/home/whx_admin", "shell": "/bin/bash", "groups": "wh-admins sudo", "status": "active"},
                {"username": "whx_manager", "uid": 1002, "gid": 1002, "home": "/home/whx_manager", "shell": "/bin/bash", "groups": "wh-managers", "status": "active"},
                {"username": "whx_staff01", "uid": 1003, "gid": 1003, "home": "/home/whx_staff01", "shell": "/bin/bash", "groups": "wh-staff", "status": "active"},
                {"username": "whx_staff02", "uid": 1004, "gid": 1004, "home": "/home/whx_staff02", "shell": "/bin/bash", "groups": "wh-staff", "status": "active"},
                {"username": "whx_leadsec", "uid": 1005, "gid": 1005, "home": "/home/whx_leadsec", "shell": "/bin/bash", "groups": "wh-admins", "status": "active"}
            ],
            "groups": ["wh-admins", "wh-managers", "wh-staff", "backup-operators", "sudo"]
        }
