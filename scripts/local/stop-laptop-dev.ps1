#Requires -Version 5.1
<#
.SYNOPSIS
  Stop all background processes started by start-laptop-dev.ps1 (Vite, Artisan serve).
#>

param(
    [switch]$StopMySQL
)

Write-Host "Stopping DIYAR Laptop Dev processes..." -ForegroundColor Yellow

# 1. Stop port 3000 (Vite)
$pids3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($p in $pids3000) {
    if ($p -and $p -ne 0) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped process on port 3000 (PID: $p)" -ForegroundColor Green
    }
}

# 2. Stop port 8000 (Artisan serve)
$pids8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($p in $pids8000) {
    if ($p -and $p -ne 0) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped process on port 8000 (PID: $p)" -ForegroundColor Green
    }
}

# 3. Optional stop MySQL
if ($StopMySQL) {
    Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped mysqld process" -ForegroundColor Green
}

Write-Host "All development services stopped." -ForegroundColor Cyan
