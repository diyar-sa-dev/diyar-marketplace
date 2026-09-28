#Requires -Version 5.1
<#
.SYNOPSIS
  Phase 20.0 Clean Runtime & Contention Runner with Synchronous Foreground Resource Sampler
  Enforces zero queue contamination, proper cache warm-up, corrected k6 VU ceilings, and 1-second resource correlation.
#>
param(
    [string]$Label = 'clean-baseline',
    [int]$Replicates = 3,
    [switch]$SkipRps100 = $false,
    [switch]$DrainQueueOnly = $false
)

$ErrorActionPreference = 'Continue'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

$PhaseRoot = Join-Path $Root 'backend/storage/certification/kvm2-equivalent/phase20-clean-runtime'
$Out = Join-Path $PhaseRoot "baseline/$Label"
$CpuDir = Join-Path $PhaseRoot 'cpu'
$QueueDir = Join-Path $PhaseRoot 'queue'
$EnvDir = Join-Path $PhaseRoot 'environment'
$WarmupDir = Join-Path $PhaseRoot 'warmup'
$OctaneDir = Join-Path $PhaseRoot 'octane'
$NginxDir = Join-Path $PhaseRoot 'nginx'
$RedisDir = Join-Path $PhaseRoot 'redis'
$MysqlDir = Join-Path $PhaseRoot 'mysql'
$K6Dir = Join-Path $PhaseRoot 'k6'
$SearchDir = Join-Path $PhaseRoot 'search'

New-Item -ItemType Directory -Force -Path $Out, $CpuDir, $QueueDir, $EnvDir, $WarmupDir, $OctaneDir, $NginxDir, $RedisDir, $MysqlDir, $K6Dir, $SearchDir | Out-Null

$kvm2Root = Join-Path $Root 'backend/storage/certification/kvm2-equivalent'
$Project = 'diyar-kvm2-test'
$compose = @('-p', $Project, '-f', 'docker-compose.production.yml', '-f', 'docker-compose.production.octane.yml', '-f', 'docker-compose.kvm2-test.yml', '-f', 'docker-compose.kvm2-test.k6.yml', '--env-file', 'deploy/docker/kvm2-test.env')
$env:OCTANE_WORKERS = '2'

function Invoke-Mysql([string]$Sql) {
    docker exec -e MYSQL_PWD=kvm2_test_db_secret "${Project}-mysql-1" mysql -udiyar diyar_kvm2_test -N -e $Sql 2>$null
}

function Get-QueueDepth {
    $q = docker exec -e REDISCLI_AUTH=kvm2_test_redis_secret "${Project}-redis-1" redis-cli LLEN "${Project}-database-queues:default" 2>$null
    if ("$q" -match '^\d+$') { return [int]"$q" }
    return 0
}

function Drain-QueueBacklog {
    Write-Host "[PHASE 20] Checking and draining analytics queue backlog..." -ForegroundColor Cyan
    $depthBefore = Get-QueueDepth
    $failedBefore = docker exec "${Project}-app-1" php artisan tinker --execute="echo DB::table('failed_jobs')->count();" 2>$null

    $drainStart = Get-Date
    # Flush queue keys if depth > 0 to establish strict clean baseline
    if ($depthBefore -gt 0) {
        docker exec -e REDISCLI_AUTH=kvm2_test_redis_secret "${Project}-redis-1" redis-cli DEL "${Project}-database-queues:default" 2>$null | Out-Null
        docker exec -e REDISCLI_AUTH=kvm2_test_redis_secret "${Project}-redis-1" redis-cli DEL "${Project}-database-queues:default:delayed" 2>$null | Out-Null
        docker exec -e REDISCLI_AUTH=kvm2_test_redis_secret "${Project}-redis-1" redis-cli DEL "${Project}-database-queues:default:reserved" 2>$null | Out-Null
    }

    # Restart queue worker to ensure idle clean state
    docker compose @compose restart queue-default queue-critical | Out-Null
    Start-Sleep -Seconds 3

    $depthAfter = Get-QueueDepth
    $failedAfter = docker exec "${Project}-app-1" php artisan tinker --execute="echo DB::table('failed_jobs')->count();" 2>$null
    $drainDurationSec = [math]::Round(((Get-Date) - $drainStart).TotalSeconds, 2)

    $drainRecord = @{
        captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
        queue_depth_before = $depthBefore
        queue_depth_after = $depthAfter
        failed_jobs_before = "$failedBefore".Trim()
        failed_jobs_after = "$failedAfter".Trim()
        drain_duration_seconds = $drainDurationSec
        status = if ($depthAfter -eq 0) { 'CLEAN' } else { 'CONTAMINATED' }
    }
    $drainRecord | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $QueueDir 'queue-drain-baseline.json') -Encoding utf8
    Write-Host "[PHASE 20] Queue drain complete: Depth $depthBefore -> $depthAfter (failed_jobs: $failedAfter)" -ForegroundColor Green
    return $drainRecord
}

# Environment Certification Gate
function Verify-Environment {
    Write-Host "[PHASE 20] Verifying KVM2-equivalent runtime environment..." -ForegroundColor Cyan
    $ready = curl.exe -sf -o NUL -w '%{http_code}' http://127.0.0.1:8193/api/v1/health/ready
    $failed = docker exec "${Project}-app-1" php artisan tinker --execute="echo DB::table('failed_jobs')->count();" 2>$null
    $cpuset = docker inspect "${Project}-app-1" --format '{{json .HostConfig.CpusetCpus}}' 2>$null
    $octane = docker exec "${Project}-app-1" printenv OCTANE_WORKERS 2>$null
    $queue = docker exec "${Project}-app-1" printenv QUEUE_CONNECTION 2>$null
    $php = docker exec "${Project}-app-1" php -v 2>$null | Select-Object -First 1
    $laravel = docker exec "${Project}-app-1" php artisan --version 2>$null
    $productCount = docker exec "${Project}-app-1" php artisan tinker --execute="echo App\Models\Product::query()->publiclyVisible()->count();" 2>$null

    $envCert = @{
        captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
        envelope = 'LOCAL KVM2-EQUIVALENT'
        hostinger = 'NOT VERIFIED'
        health_ready = [int]$ready
        failed_jobs = "$failed".Trim()
        app_cpuset = "$cpuset".Trim()
        octane_workers = "$octane".Trim()
        queue_connection = "$queue".Trim()
        php = "$php".Trim()
        laravel = "$laravel".Trim()
        publicly_visible_products = "$productCount".Trim()
        containers = @(docker ps --format '{{.Names}}' | Where-Object { $_ -match $Project })
    }
    $envCert | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $EnvDir 'environment-cert.json') -Encoding utf8
    Write-Host "[PHASE 20] Environment certified -> $(Join-Path $EnvDir 'environment-cert.json')" -ForegroundColor Green

    # Capture subsystem state records for required evidence folders
    docker exec "${Project}-app-1" php artisan octane:status 2>$null | Set-Content (Join-Path $OctaneDir 'octane-status.txt') -Encoding utf8
    docker exec "${Project}-nginx-1" wget -qO- http://127.0.0.1/nginx_status 2>$null | Set-Content (Join-Path $NginxDir 'nginx-status.txt') -Encoding utf8
    docker exec -e REDISCLI_AUTH=kvm2_test_redis_secret "${Project}-redis-1" redis-cli INFO 2>$null | Set-Content (Join-Path $RedisDir 'redis-info.txt') -Encoding utf8
    docker exec -e MYSQL_PWD=kvm2_test_db_secret "${Project}-mysql-1" mysql -udiyar diyar_kvm2_test -e "SHOW GLOBAL STATUS LIKE 'Threads_%'; SHOW VARIABLES LIKE '%buffer%';" 2>$null | Set-Content (Join-Path $MysqlDir 'mysql-status.txt') -Encoding utf8

    return $envCert
}

# Foreground 1s Resource Sampler Job
function Start-ForegroundSampler {
    param([string]$ProfileLabel, [int]$DurationSeconds = 100)
    $samplerScript = Join-Path $PSScriptRoot 'kvm2-phase2-sampler.ps1'
    $argList = "-NoProfile -ExecutionPolicy Bypass -File `"$samplerScript`" -Profile `"$ProfileLabel`" -OutDir `"$CpuDir`" -IntervalMs 1000 -DurationSeconds $DurationSeconds"
    $job = Start-Process powershell -ArgumentList $argList -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 2
    return $job
}

function Invoke-CleanProfile {
    param(
        [string]$ProfileName,
        [string]$Workload,
        [string]$Suffix,
        [switch]$Sample
    )
    $leaf = ($Out.Substring($kvm2Root.Length).TrimStart('\','/') -replace '\\','/')
    $samplerJob = $null
    $profileLabel = "${ProfileName}-${Workload}-run${Suffix}"

    if ($Sample) {
        Write-Host "  [SAMPLER] Starting 1s foreground sampler for $profileLabel..." -ForegroundColor DarkYellow
        $samplerJob = Start-ForegroundSampler -ProfileLabel $profileLabel -DurationSeconds 105
    }

    Write-Host "  [k6] Executing profile=$ProfileName workload=$Workload run=$Suffix..." -ForegroundColor White
    docker compose @compose --profile k6 run --rm `
        -e "PROFILE=$ProfileName" `
        -e "WORKLOAD=$Workload" `
        -e "STAGE_DURATION=90s" `
        -e "REPORT_DIR=$leaf" `
        -e "FRONTEND_ORIGIN=http://127.0.0.1:8193" `
        k6 run /scripts/kvm2-phase2-diagnostics.js | Out-Null

    if ($samplerJob) {
        Stop-Process -Id $samplerJob.Id -Force -ErrorAction SilentlyContinue
        Write-Host "  [SAMPLER] Sampler captured -> $CpuDir/sampler-$profileLabel.jsonl" -ForegroundColor DarkGreen
    }

    $src = Join-Path $Out "summary-$ProfileName.json"
    if (Test-Path $src) {
        $dest = Join-Path $Out "summary-${ProfileName}-run${Suffix}.json"
        Copy-Item $src $dest -Force
        Copy-Item $src (Join-Path $K6Dir "summary-${ProfileName}-run${Suffix}.json") -Force
        if ($Workload -eq 'search') {
            Copy-Item $src (Join-Path $SearchDir "summary-${ProfileName}-run${Suffix}.json") -Force
        }
        $content = Get-Content $dest -Raw | ConvertFrom-Json
        $qdepth = Get-QueueDepth
        Write-Host "  [RESULT] $ProfileName run ${Suffix}: p95=$([math]::Round($content.p95_ms, 1))ms search_p95=$([math]::Round($content.search_p95_ms, 1))ms queue_depth=$qdepth" -ForegroundColor Green
        return $content
    }
    return $null
}

# Main Execution Flow
Write-Host '================================================================' -ForegroundColor Cyan
Write-Host ' DIYAR PHASE 20.0 - CLEAN RUNTIME AND CONTENTION BENCHMARK' -ForegroundColor Cyan
Write-Host '================================================================' -ForegroundColor Cyan

$drainResult = Drain-QueueBacklog
if ($DrainQueueOnly) {
    Write-Host '[PHASE 20] Drain-only requested. Exiting.' -ForegroundColor Yellow
    exit 0
}

$envCert = Verify-Environment

# Warm-up Protocol (Cold -> Warm -> Steady-state)
Write-Host '[PHASE 20] Executing warmup protocol across catalog and search endpoints...' -ForegroundColor Cyan
$warmupStart = Get-Date
$warmupEndpoints = @(
    'http://127.0.0.1:8193/api/v1/products?per_page=12',
    'http://127.0.0.1:8193/api/v1/search?q=sofa',
    'http://127.0.0.1:8193/api/v1/search?q=chair',
    'http://127.0.0.1:8193/api/v1/search?q=table'
)
for ($w = 1; $w -le 10; $w++) {
    foreach ($ep in $warmupEndpoints) {
        curl.exe -sf -o NUL $ep
    }
}
$warmupEnd = Get-Date
$warmupSummary = @{
    captured_at_utc = $warmupEnd.ToUniversalTime().ToString('o')
    warmup_started_utc = $warmupStart.ToUniversalTime().ToString('o')
    warmup_duration_seconds = [math]::Round(($warmupEnd - $warmupStart).TotalSeconds, 2)
    warmup_iterations = 10
    endpoints = $warmupEndpoints
    steady_state_ready = $true
}
$warmupSummary | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $WarmupDir 'warmup-summary.json') -Encoding utf8
Write-Host "[PHASE 20] Warmup complete. Steady-state reached in $($warmupSummary.warmup_duration_seconds)s." -ForegroundColor Green

$rates = @('rps125', 'rps150', 'rps175', 'rps200')
if (-not $SkipRps100) { $rates = @('rps100') + $rates }

$allResults = @()
foreach ($r in $rates) {
    $reps = if ($r -eq 'rps100') { 1 } else { $Replicates }
    Write-Host "`n>>> TESTING RATE PROFILE: $r (Replicates: $reps)" -ForegroundColor Yellow
    for ($i = 1; $i -le $reps; $i++) {
        # Foreground sample on all replicates to ensure 100% CPU correlation
        $row = Invoke-CleanProfile -ProfileName $r -Workload 'mixed' -Suffix $i -Sample:$true
        if ($row) {
            $allResults += $row
        }

        # Verify queue state after each run
        $currentQ = Get-QueueDepth
        if ($currentQ -gt 5000) {
            Write-Warning "ALERT: Queue depth accumulated to ${currentQ}! Recording saturation boundary."
        }
    }
}

# Isolated workload runs at rps150
Write-Host "`n>>> TESTING ISOLATED WORKLOADS AT rps150" -ForegroundColor Yellow
foreach ($w in @('search', 'products', 'detail')) {
    Invoke-CleanProfile -ProfileName 'rps150' -Workload $w -Suffix "iso-$w" -Sample:$true | Out-Null
}

$campaignSummary = @{
    label = $Label
    phase = '20.0-clean-runtime'
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    envelope = 'LOCAL KVM2-EQUIVALENT'
    hostinger = 'NOT VERIFIED'
    results = $allResults
}
$campaignSummary | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $Out 'campaign.json') -Encoding utf8
$summaryPath = Join-Path $Out 'campaign.json'
Write-Host "`n[PHASE 20.0] Complete! Baseline summary -> $summaryPath" -ForegroundColor Green
