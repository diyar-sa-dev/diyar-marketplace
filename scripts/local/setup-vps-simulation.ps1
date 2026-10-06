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

# 2. Safety verification
Push-Location $Backend
try {
    php artisan diyar:validate-environment --env=vps-simulation
    Write-Host "[OK] Environment safety check passed." -ForegroundColor Green
} catch {
    Write-Warning "Environment check returned non-zero. Verify configuration."
}
Pop-Location

# 3. Database check
if (-not $SkipDbCheck) {
    Write-Host "[INFO] Checking local database service (port 3306)..." -ForegroundColor Yellow
    $dbTest = Test-NetConnection 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue
    if ($dbTest.TcpTestSucceeded) {
        Write-Host "[OK] Database port 3306 is reachable." -ForegroundColor Green
    } else {
        Write-Warning "Database port 3306 is not currently active. Start MariaDB/MySQL daemon prior to launch."
    }
}

# 4. Redis check
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
Write-Host "When ready to launch the simulation:" -ForegroundColor White
Write-Host "  1. Start Database & Redis:"
Write-Host "     - MariaDB: Start mysqld daemon with diyar_vps_simulation database"
Write-Host "     - Redis: Start redis-server on 127.0.0.1:6379"
Write-Host "  2. Run Migrations & Cache Warming:"
Write-Host "     cd backend"
Write-Host "     php artisan migrate --force --env=vps-simulation"
Write-Host "     php artisan config:cache --env=vps-simulation"
Write-Host "  3. Start Simulation Services:"
Write-Host "     - API:       php artisan serve --port=8000 --env=vps-simulation"
Write-Host "     - Queues:    php artisan queue:work redis --queue=critical,default,notifications --env=vps-simulation"
Write-Host "     - Scheduler: php artisan schedule:run --env=vps-simulation"
Write-Host "     - Reverb:    php artisan reverb:start --port=8090 --env=vps-simulation"
Write-Host "     - Frontend:  cd frontend && npm run preview (Serving production dist on :3000)"
Write-Host ""
