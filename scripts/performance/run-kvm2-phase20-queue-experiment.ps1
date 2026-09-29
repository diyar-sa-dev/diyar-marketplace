#Requires -Version 5.1
<#
.SYNOPSIS
  Phase 20.1 Dedicated Analytics Queue Experiment Runner
  Executes paired Control (default queue) vs Treatment (dedicated analytics queue)
  under identical KVM2-equivalent envelope conditions.
#>
param(
    [ValidateSet('control', 'treatment', 'all')][string]$Mode = 'all',
    [string]$StageDuration = '60s',
    [int]$Replicates = 2
)

$ErrorActionPreference = 'Continue'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

$PhaseRoot = Join-Path $Root 'backend/storage/certification/kvm2-equivalent/phase20-queue-isolation'
$ControlDir = Join-Path $PhaseRoot 'control'
$TreatmentDir = Join-Path $PhaseRoot 'treatment'
$CpuDir = Join-Path $PhaseRoot 'cpu'
$QueueDir = Join-Path $PhaseRoot 'queue'

New-Item -ItemType Directory -Force -Path $PhaseRoot, $ControlDir, $TreatmentDir, $CpuDir, $QueueDir | Out-Null

$kvm2Root = Join-Path $Root 'backend/storage/certification/kvm2-equivalent'
$Project = 'diyar-kvm2-test'
$compose = @('-p', $Project, '-f', 'docker-compose.production.yml', '-f', 'docker-compose.production.octane.yml', '-f', 'docker-compose.kvm2-test.yml', '-f', 'docker-compose.kvm2-test.k6.yml', '--env-file', 'deploy/docker/kvm2-test.env')

function Get-QueueDepth([string]$QueueName = 'default') {
    $q = docker exec -e REDISCLI_AUTH=kvm2_test_redis_secret "${Project}-redis-1" redis-cli LLEN "${Project}-database-queues:${QueueName}" 2>$null
    if ("$q" -match '^\d+$') { return [int]"$q" }
    return 0
}

function Drain-Queues {
    Write-Host "[PHASE 20.1] Draining all queues to ensure clean state..." -ForegroundColor Cyan
    foreach ($q in @('default', 'analytics', 'critical')) {
        docker exec -e REDISCLI_AUTH=kvm2_test_redis_secret "${Project}-redis-1" redis-cli DEL "${Project}-database-queues:${q}" 2>$null | Out-Null
        docker exec -e REDISCLI_AUTH=kvm2_test_redis_secret "${Project}-redis-1" redis-cli DEL "${Project}-database-queues:${q}:delayed" 2>$null | Out-Null
        docker exec -e REDISCLI_AUTH=kvm2_test_redis_secret "${Project}-redis-1" redis-cli DEL "${Project}-database-queues:${q}:reserved" 2>$null | Out-Null
    }
    docker compose @compose restart queue-default queue-critical 2>$null | Out-Null
    # Also restart queue-analytics if running
    docker compose @compose restart queue-analytics 2>$null | Out-Null
    Start-Sleep -Seconds 3

    $dDef = Get-QueueDepth 'default'
    $dAna = Get-QueueDepth 'analytics'
    $failed = docker exec "${Project}-app-1" php artisan tinker --execute="echo DB::table('failed_jobs')->count();" 2>$null
    Write-Host "[PHASE 20.1] Queues clean: default=$dDef, analytics=$dAna, failed_jobs=$("$failed".Trim())" -ForegroundColor Green
}

function Start-Sampler([string]$ProfileLabel, [int]$DurationSeconds = 75) {
    $samplerScript = Join-Path $PSScriptRoot 'kvm2-phase2-sampler.ps1'
    $argList = "-NoProfile -ExecutionPolicy Bypass -File `"$samplerScript`" -Profile `"$ProfileLabel`" -OutDir `"$CpuDir`" -IntervalMs 1000 -DurationSeconds $DurationSeconds"
    $job = Start-Process powershell -ArgumentList $argList -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 2
    return $job
}

function Warmup-Endpoints {
    Write-Host "[PHASE 20.1] Running cache warmup..." -ForegroundColor Cyan
    $eps = @(
        'http://127.0.0.1:8193/api/v1/products?per_page=12',
        'http://127.0.0.1:8193/api/v1/search?q=sofa',
        'http://127.0.0.1:8193/api/v1/search?q=chair',
        'http://127.0.0.1:8193/api/v1/search?q=table'
    )
    for ($i = 1; $i -le 10; $i++) {
        foreach ($ep in $eps) { curl.exe -sf -o NUL $ep }
    }
}

function Run-BenchmarkSet {
    param(
        [string]$SubDirName,
        [string]$PhaseLabel
    )

    $targetDir = Join-Path $PhaseRoot $SubDirName
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    $leaf = "phase20-queue-isolation/$SubDirName"

    Write-Host "`n========================================================" -ForegroundColor Magenta
    Write-Host " EXECUTING BENCHMARK SET: $PhaseLabel ($SubDirName)" -ForegroundColor Magenta
    Write-Host "========================================================" -ForegroundColor Magenta

    Drain-Queues
    Warmup-Endpoints

    $testMatrix = @(
        @{ Profile = 'rps150'; Workload = 'search'; Reps = 1 },
        @{ Profile = 'rps150'; Workload = 'mixed';  Reps = $Replicates },
        @{ Profile = 'rps175'; Workload = 'mixed';  Reps = $Replicates },
        @{ Profile = 'rps200'; Workload = 'mixed';  Reps = $Replicates }
    )

    $results = @()

    foreach ($item in $testMatrix) {
        $p = $item.Profile
        $w = $item.Workload
        $reps = $item.Reps

        for ($r = 1; $r -le $reps; $r++) {
            $label = "${SubDirName}-${p}-${w}-run${r}"
            Write-Host "`n>>> [$PhaseLabel] Profile=$p Workload=$w Run=$r ..." -ForegroundColor Yellow

            $samplerJob = Start-Sampler -ProfileLabel $label -DurationSeconds 75

            # Execute k6
            docker compose @compose --profile k6 run --rm `
                -e "PROFILE=$p" `
                -e "WORKLOAD=$w" `
                -e "STAGE_DURATION=$StageDuration" `
                -e "REPORT_DIR=$leaf" `
                -e "FRONTEND_ORIGIN=http://127.0.0.1:8193" `
                k6 run /scripts/kvm2-phase2-diagnostics.js | Out-Null

            if ($samplerJob) {
                Stop-Process -Id $samplerJob.Id -Force -ErrorAction SilentlyContinue
            }

            # Move and rename output
            $src = Join-Path $targetDir "summary-$p.json"
            if (Test-Path $src) {
                $dest = Join-Path $targetDir "summary-${p}-${w}-run${r}.json"
                Copy-Item $src $dest -Force
                $data = Get-Content $dest -Raw | ConvertFrom-Json
                $dDef = Get-QueueDepth 'default'
                $dAna = Get-QueueDepth 'analytics'
                Write-Host "  -> Result: p95=$([math]::Round($data.p95_ms, 1))ms search_p95=$([math]::Round($data.search_p95_ms, 1))ms default_q=$dDef analytics_q=$dAna" -ForegroundColor Green
                $results += @{
                    profile = $p
                    workload = $w
                    run = $r
                    p50_ms = $data.p50_ms
                    p90_ms = $data.p90_ms
                    p95_ms = $data.p95_ms
                    p99_ms = $data.p99_ms
                    max_ms = $data.max_ms
                    search_p95_ms = $data.search_p95_ms
                    rps = $data.rps
                    error_rate = $data.error_rate
                    queue_default_after = $dDef
                    queue_analytics_after = $dAna
                }
            }
        }
    }

    $summaryObj = @{
        phase = $PhaseLabel
        sub_dir = $SubDirName
        stage_duration = $StageDuration
        captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
        results = $results
    }
    $summaryObj | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $targetDir 'campaign.json') -Encoding utf8
    return $summaryObj
}

if ($Mode -eq 'control' -or $Mode -eq 'all') {
    Run-BenchmarkSet -SubDirName 'control' -PhaseLabel 'CONTROL (default queue)' | Out-Null
}

if ($Mode -eq 'treatment') {
    Run-BenchmarkSet -SubDirName 'treatment' -PhaseLabel 'TREATMENT (dedicated analytics queue)' | Out-Null
}
