# DIYAR V1 — STAGE 32 PHASE D
## Safe Read-Only Hostinger KVM2 VPS Audit Checklist

> **Target Environment:** Hostinger KVM2 VPS (Production Target)  
> **Host Specifications:** 2 vCPU, 8 GiB RAM, 100 GB NVMe, Ubuntu 22.04 / 24.04 LTS  
> **Phase D Execution Model:** **100% READ-ONLY — ZERO DESTRUCTIVE ACTIONS — ZERO CONTAINER DEPLOYMENTS**  
> **Prerequisite:** **Owner-Led Hostinger Account Recovery** (Antigravity/AI is explicitly unauthorized to perform account recovery)  

---

## 1. Owner Recovery Prerequisite (Owner Action Only)

Before this audit can be performed, the project owner must independently regain administrative access:

1. **Hostinger hPanel:** Log in to `https://hpanel.hostinger.com`.
2. **VPS Access:** Navigate to the VPS Dashboard for the DIYAR server.
3. **SSH Access Credentials:**
   - Retrieve or verify the active VPS Public IP address.
   - Verify or reset the SSH Key (`~/.ssh/id_ed25519` recommended) or obtain root password / emergency browser console access via hPanel.
   - Test connecting from owner terminal:
     ```bash
     ssh -i ~/.ssh/id_ed25519 root@<VPS_IP>
     ```
4. **Handoff:** Once SSH connection succeeds, the owner authorizes execution of the safe read-only inspection commands below.

---

## 2. Strict Read-Only Boundaries

During Phase D, **NO system state may be changed**:
- ❌ Do NOT run `apt-get upgrade` or install/remove packages.
- ❌ Do NOT start, stop, restart, or remove Docker containers or volumes.
- ❌ Do NOT change UFW firewall rules or reload firewall.
- ❌ Do NOT alter `/etc/ssh/sshd_config` or reload SSH daemon.
- ❌ Do NOT alter DNS records or live domains (`diyar.sa`).
- ❌ Do NOT modify any database or application configuration files.
- ✅ ONLY execute read-only queries and inspection commands that print system telemetry.

---

## 3. Systematic Read-Only VPS Audit Commands

Run the following commands in the VPS terminal and record all outputs into the Phase D audit log:

### Step 1: System Identification & Kernel
Verify OS distribution, release version, kernel version, and uptime:
```bash
cat /etc/os-release
uname -a
uptime
```
*Expected:* Ubuntu 22.04 LTS or 24.04 LTS; 64-bit Linux kernel (5.15+ or 6.8+).

---

### Step 2: Hardware Inventory & Resource Sizing
Verify physical resources match the KVM2 plan (2 vCPU, 8,192 MiB RAM, 100 GB NVMe):
```bash
# CPU Architecture and cores
lscpu | grep -E "Model name|CPU\(s\):|Thread|Core"

# Memory and Swap
free -m
swapon --show

# Disk utilization and filesystem types
df -hT / /var /var/lib/docker
lsblk -f
```
*Verification criteria:*
- CPU: Exactly 2 vCPU cores.
- Memory: ≥ 7,800 MiB visible to OS.
- Swap: ≥ 2,048 MiB (4,096 MiB recommended) configured and active.
- Disk: Root filesystem `/` has ≥ 60 GB available space on NVMe storage.

---

### Step 3: Network Sockets & Port Conflict Audit
Ensure host ports required by Option C (ports 80 and 443 for Nginx reverse proxy) are not already bound by host-level daemons (e.g., host Apache, standalone Nginx, or host MySQL):
```bash
ss -tulpn
```
*Verification criteria:*
- Port 22 (or custom SSH port) is listening.
- Ports 80 and 443: Check if occupied by legacy containers or host Apache (`apache2`, `httpd`). If occupied, note the PID for scheduled decommissioning in Phase E.
- Ports 3306 (MySQL) and 6379 (Redis) MUST NOT be bound on `0.0.0.0` or public interface.

---

### Step 4: Host Firewall (UFW) & Cloudflare Restriction Audit
Inspect firewall state and confirm whether ports 80 and 443 are properly restricted to Cloudflare IPs:
```bash
ufw status verbose
iptables -L -n -v --line-numbers | head -n 40
```
*Verification criteria:*
- UFW is active (`Status: active`).
- Ingress on ports 80/443 is ideally restricted to Cloudflare CIDR blocks (or prepared for rule insertion in Phase E).
- Direct internet traffic to internal ports (3306, 6379, 8000, 8090) is blocked.
- SSH port is allowed with rate limiting (`LIMIT` rule).

---

### Step 5: Docker Engine & Compose Verification
Verify Docker daemon version, storage driver, and Compose V2 plugin:
```bash
docker --version
docker compose version
docker info | grep -E "Server Version|Storage Driver|Logging Driver|Cgroup Driver|Default Runtime"
```
*Verification criteria:*
- Docker Engine ≥ 24.0.0.
- Docker Compose ≥ 2.20.0 (V2 plugin).
- Storage Driver: `overlay2`.
- Logging Driver: `json-file` or `local` with log rotation configured in `/etc/docker/daemon.json`.

---

### Step 6: Legacy Docker State Inventory
Audit what is currently running or lingering from previous deployments or Stage 31/32 preliminary work:
```bash
# Running and stopped containers
docker ps -a --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"

# Existing Docker volumes (data preservation check)
docker volume ls

# Existing Docker networks
docker network ls

# Disk space used by Docker objects
docker system df
```
*Action rule:*
- If existing volumes named `diyar_*` or `production_*` exist, flag them for backup before any Phase E action.
- Never delete volumes during Phase D.

---

### Step 7: Host Security & Intrusion Prevention
Verify Fail2Ban status and SSH hardening settings:
```bash
# Fail2ban service and jail status
systemctl status fail2ban --no-pager
fail2ban-client status
fail2ban-client status sshd 2>/dev/null || true

# SSH daemon configuration review
grep -E "^(PermitRootLogin|PasswordAuthentication|PubkeyAuthentication|X11Forwarding|Port|MaxAuthTries)" /etc/ssh/sshd_config /etc/ssh/sshd_config.d/* 2>/dev/null
```
*Verification criteria:*
- `PubkeyAuthentication yes`.
- `PasswordAuthentication no` (or planned for disable once SSH key is proven).
- Fail2Ban is active and monitoring SSH attempts.

---

### Step 8: System Health & Error Diagnostics
Inspect system logs for recent kernel panics, OOM killer invocations, hardware errors, or disk I/O bottlenecks:
```bash
# Check for OOM killer incidents
dmesg -T | grep -i -E "oom|out of memory|killed process" || echo "Zero OOM events found"

# Systemd error logs in current boot
journalctl -p 3 -xb --no-pager -n 50
```
*Verification criteria:*
- Zero unrecovered hardware or filesystem errors.
- Zero active OOM killer events in recent memory.

---

## 4. Phase D Audit Output Scorecard

| Area | Inspection Target | Expected Value | Measured Value | Pass / Action Required |
|:---|:---|:---|:---|:---|
| **OS** | Distribution & Version | Ubuntu 22.04 or 24.04 LTS | *[To be filled]* | |
| **Kernel** | Architecture & Version | x86_64 Linux 5.15+ | *[To be filled]* | |
| **CPU** | Available vCPUs | 2 vCPUs | *[To be filled]* | |
| **RAM** | Host Physical Memory | ≥ 7,800 MiB | *[To be filled]* | |
| **Swap** | Active Swap Space | ≥ 2,048 MiB | *[To be filled]* | |
| **Disk** | Root NVMe Free Space | ≥ 60 GB available | *[To be filled]* | |
| **Ports** | Conflict Audit (80, 443, 3306, 6379) | Clean / No conflicting host daemons | *[To be filled]* | |
| **Firewall** | UFW Status & Cloudflare Rules | Active; SSH protected; 80/443 Cloudflare-only | *[To be filled]* | |
| **Docker** | Engine & Compose V2 Version | Docker ≥ 24.0; Compose ≥ 2.20 | *[To be filled]* | |
| **Security** | Fail2Ban & SSH Hardening | Active jails; Pubkey auth enabled | *[To be filled]* | |
| **Stability**| OOM / Kernel Diagnostics | 0 OOM kills; 0 filesystem errors | *[To be filled]* | |

---

## 5. Next Steps After Phase D Completion

Once this audit checklist is completed and all output is recorded:
1. Review findings against the Option C 8-container architecture in `conception/Stages/Stage 32 - Deploy/STAGE_32_MASTER.md`.
2. Present the completed scorecard to the owner for formal Phase E deployment authorization.
3. No container builds, migrations, or service start operations will commence until Phase E is authorized.
