#Requires -Version 5.1
<#
.SYNOPSIS
  Configure and prepare the DIYAR local VPS production simulation environment.

.DESCRIPTION
  Prepares local simulation topology replicating Hostinger KVM 2 constraints:
  - Validates backend/.env.vps-simulation
  - Prepares MariaDB/MySQL database diyar_vps_simulation
  - Checks Redis connection on port 6379
  - Provides launcher commands for API, workers, scheduler, Reverb, and static frontend.
  Safe for local use; strictly isolates simulation from real production VPS.
#>

param(
    [switch]$SkipDbCheck,
    [switch]$SkipRedisCheck
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Backend = Join-Path $Root 'backend'
$Frontend = Join-Path $Root 'frontend'

Write-Host "=== DIYAR — VPS Production Simulation Setup ===" -ForegroundColor Cyan
Write-Host "Target: Hostinger KVM 2 Local Emulation (Isolated)" -ForegroundColor Gray
Write-Host ""

# 1. Environment file check
$simEnv = Join-Path $Backend '.env.vps-simulation'
$simEnvExample = Join-Path $Backend '.env.vps-simulation.example'

if (-not (Test-Path $simEnv)) {
    if (Test-Path $simEnvExample) {
        Copy-Item $simEnvExample $simEnv
        Write-Host "[OK] Created backend/.env.vps-simulation from template." -ForegroundColor Green
    } else {
        throw "Missing backend/.env.vps-simulation.example template."
    }
} else {
    Write-Host "[OK] backend/.env.vps-simulation is configured." -ForegroundColor Green
}

# 2. Database check
if (-not $SkipDbCheck) {
    Write-Host "[INFO] Checking local database service (port 3306)..." -ForegroundColor Yellow
    $dbTest = Test-NetConnection 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue
    if ($dbTest.TcpTestSucceeded) {
        Write-Host "[OK] Database port 3306 is reachable." -ForegroundColor Green
    } else {
        Write-Warning "Database port 3306 is not currently active. Start MariaDB/MySQL daemon prior to launch."
    }
}

# 3. Redis check
if (-not $SkipRedisCheck) {
    Write-Host "[INFO] Checking local Redis service (port 6379)..." -ForegroundColor Yellow
    $redisTest = Test-NetConnection 127.0.0.1 -Port 6379 -WarningAction SilentlyContinue
    if ($redisTest.TcpTestSucceeded) {
        Write-Host "[OK] Redis port 6379 is reachable." -ForegroundColor Green
    } else {
        Write-Warning "Redis port 6379 is not currently active. Start Redis daemon prior to launch."
    }
}

Write-Host ""
Write-Host "=== Simulation Configuration Ready ===" -ForegroundColor Cyan
Write-Host "Architecture Topology:" -ForegroundColor Yellow
Write-Host "  Public Simulation URL:  http://localhost:8092 (Docker) or http://diyar.local:8080 (Gateway)"
Write-Host "  Host Ports:             8092 (Nginx Gateway), 3306 (MySQL local), 6379 (Redis local)"
Write-Host "  Internal Ports:         80 (Nginx), 9000 (FastCGI), 8090 (Reverb), 3306 (MySQL), 6379 (Redis)"
Write-Host "  Internal Service URLs:  app:9000, reverb:8090, mysql:3306, redis:6379"
Write-Host ""
Write-Host "Execution Mode Options:" -ForegroundColor Yellow
Write-Host "  [Option A: Containerized Local VPS Simulation (Docker Compose)]" -ForegroundColor White
Write-Host "    1. Build Frontend:   npm --prefix frontend run build"
Write-Host "    2. Launch Stack:     docker compose -p diyar-vps-sim -f docker-compose.production-like.yml up -d --build"
Write-Host "    3. Run Migrations:   docker compose -p diyar-vps-sim -f docker-compose.production-like.yml exec app php artisan migrate --force"
Write-Host "    4. Verify Gateway:   curl http://localhost:8092/api/v1/health"
Write-Host ""
Write-Host "  [Option B: Native Local VPS Simulation (Windows / WSL Host)]" -ForegroundColor White
Write-Host "    1. Database & Redis: Ensure MariaDB (diyar_vps_simulation) and Redis (:6379, prefix diyar_vps_sim_) are running"
Write-Host "    2. Migrations:       cd backend && php artisan migrate --force --env=vps-simulation"
Write-Host "    3. Start Services:"
Write-Host "       - API:            php artisan serve --port=8000 --env=vps-simulation"
Write-Host "       - Worker:         php artisan queue:work redis --queue=critical,notifications-high,notifications,notifications-low,broadcast,chat,chat-low,analytics,default --env=vps-simulation"
Write-Host "       - Scheduler:      php artisan schedule:run --env=vps-simulation"
Write-Host "       - Reverb:         php artisan reverb:start --port=8090 --env=vps-simulation"
Write-Host "       - Frontend:       cd frontend && npm run preview (serving dist on :3000)"
Write-Host ""
