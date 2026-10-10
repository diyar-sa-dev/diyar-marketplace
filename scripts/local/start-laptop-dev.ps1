#Requires -Version 5.1
<#
.SYNOPSIS
  Start lightweight DIYAR development environment tailored for this Dell laptop.
  Zero Docker, Zero Redis container overhead, uses XAMPP MySQL + PHP 8.3 CLI + Vite.

.DESCRIPTION
  - Starts XAMPP MySQL (if not already running) on port 3306.
  - Launches Laravel backend on http://127.0.0.1:8000 using native PHP 8.3.
  - Launches React frontend on http://localhost:3000 using Vite with API proxy.
  - Resource usage: ~200-300MB RAM total (vs 6-8GB with Docker Desktop).
#>

param(
    [switch]$NoBrowser,
    [switch]$FreshMigrate
)

$ErrorActionPreference = 'Stop'
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path (Split-Path $ScriptRoot -Parent) -Parent

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   DIYAR LAPTOP DEV ENVIRONMENT (Lightweight / Native)    " -ForegroundColor Cyan
Write-Host "   Dell Laptop (i5 11th Gen / 16GB RAM) - Zero Docker    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Setup PATH to ensure PHP 8.3, MySQL, and Node are available
$pathsToAdd = @('C:\php83', 'C:\xampp\mysql\bin', 'C:\Program Files\nodejs')
foreach ($p in $pathsToAdd) {
    if (Test-Path $p) {
        if ($env:PATH -notlike "*$p*") {
            $env:PATH = "$p;$env:PATH"
        }
    }
}

# 2. Check & Start XAMPP MySQL
Write-Host "[1/4] Checking XAMPP MySQL (Port 3306)..." -ForegroundColor Yellow
$mysqlRunning = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $async = $tcp.BeginConnect("127.0.0.1", 3306, $null, $null)
    $success = $async.AsyncWaitHandle.WaitOne(1000, $false)
    if ($success -and $tcp.Connected) {
        $tcp.EndConnect($async)
        $mysqlRunning = $true
    }
    $tcp.Close()
} catch {}

if (-not $mysqlRunning) {
    Write-Host "      Starting XAMPP mysqld.exe..." -ForegroundColor DarkGray
    $myIni = "C:\xampp\mysql\bin\my.ini"
    $mysqldExe = "C:\xampp\mysql\bin\mysqld.exe"
    if (Test-Path $mysqldExe) {
        # Clean any stale PID file
        $pidFile = "C:\xampp\mysql\data\mysql.pid"
        if (Test-Path $pidFile) {
            Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
        }
        Start-Process -FilePath $mysqldExe -ArgumentList "--defaults-file=`"$myIni`"", "--standalone" -WindowStyle Hidden
        Start-Sleep -Seconds 3
    } else {
        Write-Warning "      XAMPP mysqld.exe not found at $mysqldExe. Please ensure XAMPP MySQL is installed."
    }
}
Write-Host "      MySQL is UP on 127.0.0.1:3306" -ForegroundColor Green

# 3. Verify Backend Configuration (.env)
Write-Host "[2/4] Checking Laravel backend configuration..." -ForegroundColor Yellow
$backendDir = Join-Path $ProjectRoot "backend"
$backendEnv = Join-Path $backendDir ".env"
$backendEnvExample = Join-Path $backendDir ".env.laptop.example"

if (-not (Test-Path $backendEnv)) {
    if (Test-Path $backendEnvExample) {
        Copy-Item $backendEnvExample $backendEnv
        Write-Host "      Created backend/.env from .env.laptop.example" -ForegroundColor Green
    }
}

if ($FreshMigrate) {
    Write-Host "      Running fresh database migrations and seeders..." -ForegroundColor Yellow
    Push-Location $backendDir
    php artisan migrate:fresh --seed --force
    Pop-Location
}

# 4. Start Laravel Backend (port 8000)
Write-Host "[3/4] Checking Laravel API (Port 8000)..." -ForegroundColor Yellow
$apiRunning = $false
try {
    $resp = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/v1/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($resp.StatusCode -eq 200) { $apiRunning = $true }
} catch {}

if (-not $apiRunning) {
    Write-Host "      Launching 'php artisan serve --port=8000' in new window..." -ForegroundColor DarkGray
    $artisanCmd = @"
`$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
Set-Location '$backendDir'
Write-Host '=== DIYAR Laravel Backend (Native PHP 8.3) ===' -ForegroundColor Cyan
php artisan serve --host=127.0.0.1 --port=8000
"@
    Start-Process powershell -ArgumentList @('-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $artisanCmd)
    
    # Wait for API to respond
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Seconds 1
        try {
            $resp = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/v1/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($resp.StatusCode -eq 200) {
                $apiRunning = $true
                break
            }
        } catch {}
    }
}
Write-Host "      API is UP at http://127.0.0.1:8000/api/v1" -ForegroundColor Green

# 5. Start Frontend Vite Server (port 3000)
Write-Host "[4/4] Checking React Frontend (Port 3000)..." -ForegroundColor Yellow
$frontendDir = Join-Path $ProjectRoot "frontend"
$frontendRunning = $false
try {
    $resp = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($resp.StatusCode -eq 200) { $frontendRunning = $true }
} catch {}

if (-not $frontendRunning) {
    Write-Host "      Launching 'npm run dev' in new window..." -ForegroundColor DarkGray
    $viteCmd = @"
`$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
Set-Location '$frontendDir'
Write-Host '=== DIYAR React Frontend (Vite) ===' -ForegroundColor Cyan
npm run dev
"@
    Start-Process powershell -ArgumentList @('-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $viteCmd)
    
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 1
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($resp.StatusCode -eq 200) {
                $frontendRunning = $true
                break
            }
        } catch {}
    }
}
Write-Host "      Frontend is UP at http://localhost:3000" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   DIYAR LOCAL DEV READY                                  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Storefront (React):  http://localhost:3000" -ForegroundColor White
Write-Host "  API Health:          http://127.0.0.1:8000/api/v1/health" -ForegroundColor White
Write-Host "  MySQL Database:      127.0.0.1:3306 (database: diyar)" -ForegroundColor White
Write-Host "  Stop script:         .\scripts\local\stop-laptop-dev.ps1" -ForegroundColor DarkGray
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""

if (-not $NoBrowser) {
    Start-Process "http://localhost:3000"
}
