#Requires -Version 5.1
<#
.SYNOPSIS
  KVM2 Phase 1–2: recreate strict envelope stack, health-gate, then diagnostic k6
  with DURING-load sampling. Does not optimize the application.
#>
param(
    [switch]$SkipRecreate,
    [switch]$SkipCampaign,
    [switch]$RebuildApp,
    [string]$ReportsDir = 'backend/storage/certification/kvm2-equivalent/phase1-2',
    [string[]]$Profiles
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

$Project = 'diyar-kvm2-test'
$EnvFile = Join-Path $Root 'deploy/docker/kvm2-test.env'
$Reports = if ([System.IO.Path]::IsPathRooted($ReportsDir)) { $ReportsDir } else { Join-Path $Root $ReportsDir }
New-Item -ItemType Directory -Force -Path $Reports | Out-Null

$compose = @(
    '-p', $Project,
    '-f', 'docker-compose.production.yml',
    '-f', 'docker-compose.production.octane.yml',
    '-f', 'docker-compose.kvm2-test.yml',
    '-f', 'docker-compose.kvm2-test.k6.yml',
    '--env-file', 'deploy/docker/kvm2-test.env'
)

function Get-HttpPort {
    $line = Get-Content $EnvFile | Where-Object { $_ -match '^HTTP_PORT=' } | Select-Object -First 1
    if ($line -match '=(\d+)') { return $Matches[1] }
    return '8193'
}

function Save-EnvCert {
    $app = "${Project}-app-1"
    $cert = [ordered]@{
        captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
        git_head = (git rev-parse HEAD)
        docker_ncpu = (docker info --format '{{.NCPU}}')
        docker_mem_bytes = (docker info --format '{{.MemTotal}}')
        wslconfig = 'memory=8GB processors=4'
        cpuset = @{}
        mysql = @{}
        redis = @{}
        nginx = @{}
        octane = @{}
    }
    docker ps --filter "name=$Project" --format '{{.Names}}' | ForEach-Object {
        $cert.cpuset[$_] = docker inspect $_ --format '{{.HostConfig.CpusetCpus}} NanoCPUs={{.HostConfig.NanoCpus}} Memory={{.HostConfig.Memory}}'
    }
    try {
        $cert.octane.php = (docker exec $app php -r 'echo PHP_VERSION;')
        $cert.octane.swoole = (docker exec $app php -r 'echo extension_loaded("swoole")?"yes":"no";')
        $cert.octane.workers_env = (docker exec $app printenv OCTANE_WORKERS)
        $cert.octane.status = (docker exec $app php artisan octane:status --no-ansi)
        $cert.octane.laravel = (docker exec $app php artisan --version)
    } catch {}
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'SilentlyContinue'
    $mysqlWarn = Join-Path $env:TEMP 'kvm2-mysql-warn.txt'
    $cert.mysql.version = (docker exec "${Project}-mysql-1" mysql -udiyar -pkvm2_test_db_secret -N -e "SELECT VERSION();" 2>$mysqlWarn)
    $cert.mysql.buffer_pool = (docker exec "${Project}-mysql-1" mysql -udiyar -pkvm2_test_db_secret -N -e "SHOW VARIABLES LIKE 'innodb_buffer_pool_size';" 2>$mysqlWarn)
    $cert.mysql.max_connections = (docker exec "${Project}-mysql-1" mysql -udiyar -pkvm2_test_db_secret -N -e "SHOW VARIABLES LIKE 'max_connections';" 2>$mysqlWarn)
    $cert.mysql.cnf_warning = ((Get-Content $mysqlWarn -ErrorAction SilentlyContinue) -join ' ')
    $cert.redis.info = (docker exec "${Project}-redis-1" redis-cli -a kvm2_test_redis_secret INFO server 2>$null | Select-String 'redis_version|os')
    $cert.redis.memory = (docker exec "${Project}-redis-1" redis-cli -a kvm2_test_redis_secret INFO memory 2>$null | Select-String 'maxmemory_human|maxmemory_policy|used_memory_human')
    $cert.nginx.version = (docker exec "${Project}-nginx-1" nginx -v 2>&1)
    $cert.nginx.stub = (docker exec "${Project}-nginx-1" wget -qO- http://127.0.0.1/nginx_status 2>$null)
    $ErrorActionPreference = $prevEap
    $cert | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $Reports 'environment-cert.json') -Encoding utf8
}

$port = Get-HttpPort
$healthUrl = "http://127.0.0.1:${port}/api/v1/health/live"

if (-not $SkipRecreate) {
    Write-Host "=== Recreating $Project with cpuset 0-1 ===" -ForegroundColor Cyan
    $env:OCTANE_WORKERS = '2'
    if ($RebuildApp) {
        Write-Host "=== Rebuilding app/octane image ===" -ForegroundColor Cyan
        docker compose @compose build app queue-critical queue-default
        if ($LASTEXITCODE -ne 0) { throw 'App/queue image rebuild failed.' }
        docker compose @compose up -d --force-recreate mysql redis app nginx queue-critical queue-default scheduler reverb-1 reverb-2
    } else {
        docker compose @compose up -d mysql redis app nginx queue-critical queue-default scheduler reverb-1 reverb-2
    }
    if ($LASTEXITCODE -ne 0) { throw 'Stack failed to start.' }

    $ready = $false
    for ($i = 0; $i -lt 60; $i++) {
        try {
            $r = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10
            if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) { $ready = $true; break }
        } catch { Start-Sleep -Seconds 3 }
    }
    if (-not $ready) { throw "Health check failed: $healthUrl" }
    Save-EnvCert
    Write-Host "Environment cert written." -ForegroundColor Green
}

if ($SkipCampaign) { exit 0 }

$campaign = if ($Profiles -and $Profiles.Count -gt 0) {
    $Profiles
} else {
    @(
        'health',
        'vu5', 'vu10', 'vu25', 'vu50',
        'rps25', 'rps50', 'rps75', 'rps100',
        'search', 'products', 'detail',
        'rps125', 'rps150', 'rps200'
    )
}

$results = @()
foreach ($profile in $campaign) {
    Write-Host "`n=== PHASE2 $profile ===" -ForegroundColor Cyan
    $workload = 'mixed'
    if ($profile -in @('search', 'products', 'detail', 'health')) { $workload = $profile }

    $samplerPath = Join-Path $PSScriptRoot 'kvm2-phase2-sampler.ps1'
    $errLog = Join-Path $Reports "sampler-$profile.err.log"
    $outLog = Join-Path $Reports "sampler-$profile.out.log"
    $sampler = Start-Process -FilePath "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -ArgumentList @(
        '-NoProfile', '-ExecutionPolicy', 'Bypass',
        '-File', "`"$samplerPath`"",
        '-Profile', $profile,
        '-OutDir', "`"$Reports`""
    ) -PassThru -WindowStyle Hidden -RedirectStandardError $errLog -RedirectStandardOutput $outLog

    Start-Sleep -Seconds 2
    docker compose @compose --profile k6 run --rm `
        -e "K6_PROFILE=$profile" `
        -e "PROFILE=$profile" `
        -e "WORKLOAD=$workload" `
        -e "STAGE_DURATION=90s" `
        -e "REPORT_DIR=$(Split-Path $Reports -Leaf)" `
        k6 run /scripts/kvm2-phase2-diagnostics.js
    $code = $LASTEXITCODE

    if ($sampler -and -not $sampler.HasExited) {
        Stop-Process -Id $sampler.Id -Force -ErrorAction SilentlyContinue
    }

    $summaryPath = Join-Path $Reports "summary-$profile.json"
    if (Test-Path $summaryPath) {
        $sum = Get-Content $summaryPath -Raw | ConvertFrom-Json
        $results += $sum
        if ($sum.http_5xx -gt 0 -or $sum.error_rate -gt 0.05) {
            Write-Warning "Stopping campaign after $profile (5xx or error_rate)."
            break
        }
    }
    if ($code -ne 0 -and $profile -in @('health', 'vu5', 'vu10')) {
        Write-Warning "Aborting after critical profile $profile"
        break
    }
}

@{
    project = $Project
    http_port = $port
    git_head = (git rev-parse HEAD)
    profiles = $results
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
} | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $Reports 'campaign.json') -Encoding utf8

Write-Host "`nPhase 2 campaign written to $Reports" -ForegroundColor Green
