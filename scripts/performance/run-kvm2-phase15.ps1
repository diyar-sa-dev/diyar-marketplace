#Requires -Version 5.1
param(
    [switch]$RebuildApp,
    [switch]$SkipRecreate,
    [string]$ReportsDir = 'backend/storage/certification/kvm2-equivalent/phase15-authenticated-octane',
    [string[]]$Profiles,
    [int]$OctaneWorkers = 2
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

$Project = 'diyar-kvm2-test'
$Reports = if ([System.IO.Path]::IsPathRooted($ReportsDir)) { $ReportsDir } else { Join-Path $Root $ReportsDir }
$WorkerDir = Join-Path $Reports "workers-$OctaneWorkers"
New-Item -ItemType Directory -Force -Path $WorkerDir | Out-Null
$kvm2Root = Join-Path $Root 'backend/storage/certification/kvm2-equivalent'
$reportLeaf = ($WorkerDir.Substring($kvm2Root.Length).TrimStart('\', '/') -replace '\\', '/')

$compose = @(
    '-p', $Project,
    '-f', 'docker-compose.production.yml',
    '-f', 'docker-compose.production.octane.yml',
    '-f', 'docker-compose.kvm2-test.yml',
    '-f', 'docker-compose.kvm2-test.k6.yml',
    '--env-file', 'deploy/docker/kvm2-test.env'
)

$env:OCTANE_WORKERS = "$OctaneWorkers"

function Save-EnvCert {
    param([string]$Out)
    $app = "${Project}-app-1"
    $cert = [ordered]@{
        captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
        git_head = (git rev-parse HEAD)
        octane_workers = $OctaneWorkers
        docker_ncpu = (docker info --format '{{.NCPU}}')
        cpuset = @{}
        images = @{}
    }
    docker ps --filter "name=$Project" --format '{{.Names}}' | ForEach-Object {
        $cert.cpuset[$_] = docker inspect $_ --format '{{.HostConfig.CpusetCpus}} NanoCPUs={{.HostConfig.NanoCpus}} Memory={{.HostConfig.Memory}}'
        $cert.images[$_] = docker inspect $_ --format '{{.Image}}'
    }
    try {
        $cert.octane.workers_env = (docker exec $app printenv OCTANE_WORKERS)
        $cert.octane.status = (docker exec $app php artisan octane:status --no-ansi)
    } catch {}
    $cert | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $Out 'environment-cert.json') -Encoding utf8
}

function Get-QueueState {
    $failed = docker exec "${Project}-app-1" php artisan tinker --execute="echo \DB::table('failed_jobs')->count();" 2>$null
    $failed = ("$failed".Trim() -replace '\D', '')
    if ($failed -eq '') { $failed = 'unknown' }
    return [ordered]@{ failed_jobs = $failed }
}

function Test-QueueWorkerProcess {
    param([string]$Container)
    $raw = docker exec $Container cat /proc/1/cmdline 2>$null
    return ("$raw" -match 'queue:work')
}

function Assert-QueueHealthy {
    if (-not (Test-QueueWorkerProcess "${Project}-queue-critical-1")) {
        throw 'queue-critical: queue:work not found in PID 1 cmdline.'
    }
    if (-not (Test-QueueWorkerProcess "${Project}-queue-default-1")) {
        throw 'queue-default: queue:work not found in PID 1 cmdline.'
    }
    $st = Get-QueueState
    if ($st.failed_jobs -ne '0' -and $st.failed_jobs -ne 'unknown') {
        throw "failed_jobs=$($st.failed_jobs) before benchmark."
    }
}

function Flush-ProductDetailCache {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'SilentlyContinue'
    docker exec "${Project}-redis-1" sh -c 'redis-cli -a kvm2_test_redis_secret --no-auth-warning --scan --pattern "diyar:catalog:products:detail:*" | head -500 | xargs -r redis-cli -a kvm2_test_redis_secret --no-auth-warning DEL' *>$null
    docker exec "${Project}-redis-1" sh -c 'redis-cli -a kvm2_test_redis_secret --no-auth-warning --scan --pattern "lock:diyar:catalog:products:detail:*" | head -200 | xargs -r redis-cli -a kvm2_test_redis_secret --no-auth-warning DEL' *>$null
    $ErrorActionPreference = $prev
}

function Warm-ProductDetailCache {
    param([string]$BaseUrl = 'http://127.0.0.1:8193/api/v1')
    for ($p = 1; $p -le 3; $p++) {
        try {
            $list = Invoke-RestMethod -Uri "$BaseUrl/products?per_page=12&page=$p" -Headers @{ Accept = 'application/json'; 'Accept-Language' = 'ar' } -TimeoutSec 30
            foreach ($item in $list.data.items) {
                if ($item.id) {
                    Invoke-WebRequest -Uri "$BaseUrl/products/$($item.id)" -Headers @{ Accept = 'application/json'; 'Accept-Language' = 'ar' } -UseBasicParsing -TimeoutSec 30 | Out-Null
                }
            }
        } catch {}
    }
}

if (-not $SkipRecreate) {
    Write-Host "=== Stack up (workers=$OctaneWorkers) ===" -ForegroundColor Cyan
    if ($RebuildApp) {
        docker compose @compose build app queue-critical queue-default
        if ($LASTEXITCODE -ne 0) { throw 'Image build failed.' }
    }
    if ($RebuildApp) {
        docker compose @compose up -d --force-recreate --no-deps app queue-critical queue-default nginx
    } else {
        docker compose @compose up -d mysql redis app nginx queue-critical queue-default scheduler reverb-1 reverb-2
    }
    if ($LASTEXITCODE -ne 0) { throw 'Stack start failed.' }
    if ($RebuildApp) {
        docker compose @compose up -d mysql redis scheduler reverb-1 reverb-2
    }

    $healthUrl = 'http://127.0.0.1:8193/api/v1/health/live'
    $ready = $false
    for ($i = 0; $i -lt 60; $i++) {
        try {
            $r = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10
            if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) { $ready = $true; break }
        } catch { Start-Sleep -Seconds 3 }
    }
    if (-not $ready) { throw "Health check failed: $healthUrl" }
    Save-EnvCert -Out $WorkerDir
    Assert-QueueHealthy
    Get-QueueState | ConvertTo-Json | Set-Content (Join-Path $WorkerDir 'queue-before.json') -Encoding utf8
}

$campaign = if ($Profiles) { $Profiles } else {
    @(
        'detail-auth-vu5', 'detail-auth-vu10', 'detail-auth-vu25', 'detail-auth-vu50',
        'detail-auth-cold', 'detail-auth-warm',
        'stampede-detail',
        'detail-guest', 'mix-realistic',
        'rps50', 'rps75', 'rps100', 'rps125', 'rps150', 'rps200',
        'vu25', 'vu50'
    )
}

# Normalize alias
$campaign = $campaign | ForEach-Object { if ($_ -eq 'detail-auth-vu25') { 'detail-auth' } else { $_ } }

$results = @()
$samplerPath = Join-Path $PSScriptRoot 'kvm2-phase2-sampler.ps1'
foreach ($profile in $campaign) {
    Write-Host "`n=== PHASE15 $profile (workers=$OctaneWorkers) ===" -ForegroundColor Cyan

    if ($profile -eq 'detail-auth-cold') {
        Flush-ProductDetailCache
        Write-Host 'Flushed product-detail cache namespace (cold run).' -ForegroundColor Yellow
    }
    if ($profile -eq 'detail-auth-warm') {
        Warm-ProductDetailCache
        Write-Host 'Warmed public product-detail cache via guest GETs.' -ForegroundColor Yellow
    }
    if ($profile -eq 'stampede-detail') {
        Flush-ProductDetailCache
        Write-Host 'Flushed cache before HTTP stampede.' -ForegroundColor Yellow
    }

    $workload = $profile
    if ($profile -match '^vu|^rps') { $workload = 'mixed' }
    if ($profile -match '^detail-auth') { $workload = 'detail-auth' }

    $script = if ($profile -match '^(vu|rps)') {
        '/scripts/kvm2-phase2-diagnostics.js'
    } else {
        '/scripts/kvm2-phase15-diagnostics.js'
    }

    $sample = $profile -match '^(rps|detail-auth|mix-realistic|stampede)'
    $sampler = $null
    if ($sample -and (Test-Path $samplerPath)) {
        $errLog = Join-Path $WorkerDir "sampler-$profile.err.log"
        $outLog = Join-Path $WorkerDir "sampler-$profile.out.log"
        $sampler = Start-Process -FilePath "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -ArgumentList @(
            '-NoProfile', '-ExecutionPolicy', 'Bypass',
            '-File', "`"$samplerPath`"",
            '-Profile', $profile,
            '-OutDir', "`"$WorkerDir`""
        ) -PassThru -WindowStyle Hidden -RedirectStandardError $errLog -RedirectStandardOutput $outLog
        Start-Sleep -Seconds 2
    }

    docker compose @compose --profile k6 run --rm `
        -e "PROFILE=$profile" `
        -e "WORKLOAD=$workload" `
        -e "STAGE_DURATION=90s" `
        -e "REPORT_DIR=$reportLeaf" `
        -e "FRONTEND_ORIGIN=http://127.0.0.1:8193" `
        -e "K6_SESSION_BASE=http://nginx" `
        k6 run $script
    $code = $LASTEXITCODE

    if ($sampler -and -not $sampler.HasExited) {
        Stop-Process -Id $sampler.Id -Force -ErrorAction SilentlyContinue
    }

    $summaryPath = Join-Path $WorkerDir "summary-$profile.json"
    if (-not (Test-Path $summaryPath)) {
        $summaryPath = Join-Path $Reports "summary-$profile.json"
    }
    if (Test-Path $summaryPath) {
        $results += Get-Content $summaryPath -Raw | ConvertFrom-Json
    }
    if ($code -ne 0) {
        Write-Warning "k6 exit $code for $profile"
    }
}

Assert-QueueHealthy
Get-QueueState | ConvertTo-Json | Set-Content (Join-Path $WorkerDir 'queue-after.json') -Encoding utf8

@{
    octane_workers = $OctaneWorkers
    git_head = (git rev-parse HEAD)
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    reports_dir = $WorkerDir
    profiles = $results
} | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $WorkerDir 'campaign.json') -Encoding utf8

Write-Host "Phase 15 campaign written to $WorkerDir" -ForegroundColor Green
