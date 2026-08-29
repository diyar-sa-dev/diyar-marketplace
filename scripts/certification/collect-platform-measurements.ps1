#!/usr/bin/env pwsh
# Collect platform measurements for production capacity certification.
# Usage: .\scripts\certification\collect-platform-measurements.ps1
$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Backend = Join-Path $Root 'backend'
$RawDir = Join-Path $Root 'conception\optimization\_raw'
New-Item -ItemType Directory -Force -Path $RawDir | Out-Null

$env:DIYAR_LOADTEST_MODE = 'false'
$env:CACHE_STORE = 'array'
$timestamp = Get-Date -Format 'yyyy-MM-ddTHH-mm-ss'

function Write-JsonFile($name, $content) {
    $path = Join-Path $RawDir "$name"
    $content | Out-File -FilePath $path -Encoding utf8
    Write-Host "Wrote $path"
}

# 1. Host metadata
$hostMeta = [ordered]@{
    timestamp_utc = (Get-Date).ToUniversalTime().ToString('o')
    hostname      = $env:COMPUTERNAME
    os            = [System.Environment]::OSVersion.VersionString
    cpu_logical   = (Get-CimInstance Win32_ComputerSystem).NumberOfLogicalProcessors
    ram_gb        = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)
    php           = (php -r 'echo PHP_VERSION;' 2>$null)
    node          = (node -v 2>$null)
    docker        = try { (docker version --format '{{.Server.Version}}' 2>$null) } catch { 'unavailable' }
    k6            = try { (k6 version 2>$null) } catch { 'not installed' }
    mysql_3306    = (Test-NetConnection 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue).TcpTestSucceeded
    mysql_3307    = (Test-NetConnection 127.0.0.1 -Port 3307 -WarningAction SilentlyContinue).TcpTestSucceeded
    redis_6379    = (Test-NetConnection 127.0.0.1 -Port 6379 -WarningAction SilentlyContinue).TcpTestSucceeded
}
Write-JsonFile "host-meta-$timestamp.json" ($hostMeta | ConvertTo-Json -Depth 5)

# 2. DB baseline + scale explain (MySQL if reachable)
Push-Location $Backend
if ($hostMeta.mysql_3306) {
    $env:DB_CONNECTION = 'mysql'
    $env:DB_HOST = '127.0.0.1'
    $env:DB_PORT = '3306'
    if (-not $env:DB_DATABASE) { $env:DB_DATABASE = 'diyar' }
    if (-not $env:DB_USERNAME) { $env:DB_USERNAME = 'root' }
    php scripts/stage28-db-baseline.php 2>&1 | Tee-Object -FilePath (Join-Path $RawDir "db-baseline-mysql-$timestamp.json")
    php scripts/stage29-db-scale-explain.php --label=cert --output=(Join-Path $RawDir "db-scale-explain-$timestamp.json") 2>&1
}

# 3. Start API for latency baseline
$apiJob = $null
try {
    $env:DB_CONNECTION = if ($hostMeta.mysql_3306) { 'mysql' } else { 'sqlite' }
    if ($env:DB_CONNECTION -eq 'sqlite') {
        $env:DB_DATABASE = 'database/database.sqlite'
    }
    $env:CACHE_STORE = 'array'
    $apiJob = Start-Job -ScriptBlock {
        Set-Location $using:Backend
        $env:DIYAR_LOADTEST_MODE = 'false'
        $env:CACHE_STORE = 'array'
        if ($using:hostMeta.mysql_3306) {
            $env:DB_CONNECTION = 'mysql'
            $env:DB_HOST = '127.0.0.1'
            $env:DB_PORT = '3306'
        } else {
            $env:DB_CONNECTION = 'sqlite'
            $env:DB_DATABASE = 'database/database.sqlite'
        }
        php artisan serve --host=127.0.0.1 --port=8000 2>&1
    }
    Start-Sleep -Seconds 4
    $health = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/v1/health' -UseBasicParsing -TimeoutSec 10
    if ($health.StatusCode -eq 200) {
        php scripts/stage28-performance-environment.php --base-url=http://127.0.0.1:8000 2>&1 | Tee-Object -FilePath (Join-Path $RawDir "perf-environment-$timestamp.json")
        php scripts/stage28-performance-api-baseline.php --base-url=http://127.0.0.1:8000 --iterations=20 2>&1 | Tee-Object -FilePath (Join-Path $RawDir "api-baseline-$timestamp.json")
    }
} catch {
    Write-Host "API baseline skipped: $_"
} finally {
    if ($apiJob) { Stop-Job $apiJob -ErrorAction SilentlyContinue; Remove-Job $apiJob -Force -ErrorAction SilentlyContinue }
}

Pop-Location
Write-Host "Measurement collection complete."
