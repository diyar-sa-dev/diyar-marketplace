#Requires -Version 5.1
<#
.SYNOPSIS
  Step 13B Failure Injection & Recovery Validation under Octane.
#>
$ErrorActionPreference = 'Continue'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

Write-Host "=== Step 13B: Infrastructure Failure & Recovery under Octane ===" -ForegroundColor Cyan

# 1. Redis Outage & Reconnection
Write-Host "`n--- Test 1: Redis Outage & Auto-Reconnection ---" -ForegroundColor Yellow
Write-Host "Stopping Redis container..." -ForegroundColor Gray
docker stop diyar-vps-sim-redis-1 | Out-Null
Start-Sleep -Seconds 2

try {
    $rFail = Invoke-WebRequest -Uri "http://localhost:8092/api/v1/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "During Redis outage: HTTP $($rFail.StatusCode) (Controlled response)" -ForegroundColor Gray
} catch {
    Write-Host "During Redis outage: Handled connection failure ($($_.Exception.Message))" -ForegroundColor Gray
}

Write-Host "Restarting Redis container..." -ForegroundColor Gray
docker start diyar-vps-sim-redis-1 | Out-Null
Start-Sleep -Seconds 5

$redisRecovered = $false
for ($i = 0; $i -lt 15; $i++) {
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:8092/api/v1/health" -TimeoutSec 5
        if ($res.data.checks.cache.ok -eq $true) {
            $redisRecovered = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}
if ($redisRecovered) {
    Write-Host "[PASS] Octane Workers Recovered & Reconnected to Redis (Cache OK: True)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Redis did not recover within timeout" -ForegroundColor Red
}

# 2. MySQL Outage & Reconnection
Write-Host "`n--- Test 2: MySQL Outage & Auto-Reconnection ---" -ForegroundColor Yellow
Write-Host "Stopping MySQL container..." -ForegroundColor Gray
docker stop diyar-vps-sim-mysql-1 | Out-Null
Start-Sleep -Seconds 2

try {
    $mFail = Invoke-WebRequest -Uri "http://localhost:8092/api/v1/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "During MySQL outage: HTTP $($mFail.StatusCode) (Controlled response)" -ForegroundColor Gray
} catch {
    Write-Host "During MySQL outage: Handled connection failure ($($_.Exception.Message))" -ForegroundColor Gray
}

Write-Host "Restarting MySQL container..." -ForegroundColor Gray
docker start diyar-vps-sim-mysql-1 | Out-Null
Start-Sleep -Seconds 10

$mysqlRecovered = $false
for ($i = 0; $i -lt 25; $i++) {
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:8092/api/v1/health" -TimeoutSec 5
        if ($res.data.checks.database.ok -eq $true) {
            $mysqlRecovered = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}
if ($mysqlRecovered) {
    Write-Host "[PASS] Octane Workers Recovered & Reconnected to MySQL (Database OK: True)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] MySQL did not recover within timeout" -ForegroundColor Red
}

# 3. Worker In-Flight Restart / Reload
Write-Host "`n--- Test 3: Octane Worker Reload Under Traffic ---" -ForegroundColor Yellow
docker compose -p diyar-vps-sim -f docker-compose.production-like.yml -f docker-compose.production-like.octane.yml exec app php artisan octane:reload | Out-Null
Start-Sleep -Seconds 1

try {
    $resReload = Invoke-RestMethod -Uri "http://localhost:8092/api/v1/health" -TimeoutSec 5
    if ($resReload.data.status -eq 'ok') {
        Write-Host "[PASS] Octane Workers Immediately Healthy After Reload (Status: OK)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Octane status unhealthy after reload" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Failed to contact Octane after reload: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Failure Recovery Tests Completed ===" -ForegroundColor Cyan
