#Requires -Version 5.1
<#
.SYNOPSIS
  Phase 21 — Whole Platform Performance & Capacity Test Suite
  Executes systematic endpoint baseline, traffic ladder (25->50->100->150->175 RPS),
  1s Docker/MySQL/Redis/Octane telemetry, and produces authoritative measurement artifacts.
#>
param(
    [string]$BaseUrl = 'http://127.0.0.1:8193',
    [int[]]$RpsLadder = @(25, 50, 100, 150, 175),
    [string]$StageDuration = '30s'
)

$ErrorActionPreference = 'Continue'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

$PhaseRoot = Join-Path $Root 'backend/storage/certification/kvm2-equivalent/phase21-whole-platform'
$Project = 'diyar-kvm2-test'
$compose = @('-p', $Project, '-f', 'docker-compose.production.yml', '-f', 'docker-compose.production.octane.yml', '-f', 'docker-compose.kvm2-test.yml', '-f', 'docker-compose.kvm2-test.k6.yml', '--env-file', 'deploy/docker/kvm2-test.env')

function Probe-Url([string]$Url) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $res = curl.exe -s -w '%{http_code}|%{size_download}' -o NUL $Url
    $sw.Stop()
    $parts = $res -split '\|'
    return [ordered]@{
        url = $Url
        duration_ms = [math]::Round($sw.Elapsed.TotalMilliseconds, 2)
        http_code = [int]$parts[0]
        size_bytes = [int]$parts[1]
    }
}

function Invoke-MysqlCmd([string]$Sql) {
    docker exec -e MYSQL_PWD=kvm2_test_db_secret "${Project}-mysql-1" mysql -udiyar diyar_kvm2_test -N -e $Sql 2>$null
}

function Start-SamplerJob([string]$Label, [string]$OutFolder, [int]$DurationSeconds = 60) {
    $samplerScript = Join-Path $PSScriptRoot 'kvm2-phase2-sampler.ps1'
    $argList = "-NoProfile -ExecutionPolicy Bypass -File `"$samplerScript`" -Profile `"$Label`" -OutDir `"$OutFolder`" -IntervalMs 1000 -DurationSeconds $DurationSeconds"
    $job = Start-Process powershell -ArgumentList $argList -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 2
    return $job
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " PHASE 21: WHOLE PLATFORM PERFORMANCE & CAPACITY SUITE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Capture Environment Baseline State
Write-Host "[ENV] Checking stack health and pre-conditions..." -ForegroundColor Yellow
$ready = curl.exe -sf "$BaseUrl/api/v1/health/ready" 2>$null
if (-not $ready) {
    Write-Error "Stack is not ready at $BaseUrl/api/v1/health/ready"
    exit 1
}

$prodCount = (Invoke-MysqlCmd "SELECT count(*) FROM products;").Trim()
$catCount = (Invoke-MysqlCmd "SELECT count(*) FROM categories;").Trim()
$vendorCount = (Invoke-MysqlCmd "SELECT count(*) FROM vendor_accounts;").Trim()
$failedJobs = (Invoke-MysqlCmd "SELECT count(*) FROM failed_jobs;").Trim()
$qDefault = (docker exec "${Project}-redis-1" redis-cli -a kvm2_test_redis_secret LLEN diyar-kvm2-test-queues:default 2>$null | Select-Object -Last 1).Trim()
$qAnalytics = (docker exec "${Project}-redis-1" redis-cli -a kvm2_test_redis_secret LLEN diyar-kvm2-test-queues:analytics 2>$null | Select-Object -Last 1).Trim()

$envStatus = [ordered]@{
    timestamp = (Get-Date).ToUniversalTime().ToString('o')
    database = "MySQL 8.0 (InnoDB)"
    products = [int]$prodCount
    categories = [int]$catCount
    vendors = [int]$vendorCount
    failed_jobs = [int]$failedJobs
    queue_default = [int]$qDefault
    queue_analytics = [int]$qAnalytics
}
$envStatus | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $PhaseRoot 'environment/stack-preconditions.json') -Encoding utf8
Write-Host "  -> DB: products=$prodCount, categories=$catCount, vendors=$vendorCount | Queues: default=$qDefault, analytics=$qAnalytics, failed_jobs=$failedJobs" -ForegroundColor Green

# 2. Probe Complete API and Frontend Surface (Component Isolation)
Write-Host "`n[BASELINE] Probing representative platform surface..." -ForegroundColor Yellow

$sampleProduct = docker exec "${Project}-app-1" php artisan tinker --execute="echo App\Models\Product::query()->publiclyVisible()->first()?->id;" 2>$null
$sampleProduct = "$sampleProduct".Trim()

$endpoints = @(
    # Frontend SPA
    "$BaseUrl/",
    # Health & Ingress
    "$BaseUrl/api/v1/health/live",
    "$BaseUrl/api/v1/health/ready",
    # Storefront
    "$BaseUrl/api/v1/storefront/home",
    "$BaseUrl/api/v1/categories",
    "$BaseUrl/api/v1/vendors",
    # Catalog Listing & Sorting
    "$BaseUrl/api/v1/products?per_page=12",
    "$BaseUrl/api/v1/products?per_page=12&page=2",
    "$BaseUrl/api/v1/products?per_page=12&sort=price",
    "$BaseUrl/api/v1/products?per_page=12&sort=-price",
    # Search
    "$BaseUrl/api/v1/products?q=chair",
    "$BaseUrl/api/v1/products?q=%D8%B7%D8%A7%D9%88%D9%84%D8%A9",
    "$BaseUrl/api/v1/products?q=%D8%B7%D8%A7%D9%88",
    "$BaseUrl/api/v1/catalog/search?q=chair&type=products",
    # Detail & Engagement
    "$BaseUrl/api/v1/products/$sampleProduct",
    "$BaseUrl/api/v1/products/$sampleProduct/reviews",
    # Services
    "$BaseUrl/api/v1/services?per_page=12",
    "$BaseUrl/api/v1/service-categories"
)

# Warmup
for ($w = 1; $w -le 3; $w++) {
    curl.exe -sf -o NUL "$BaseUrl/api/v1/products?per_page=12"
    curl.exe -sf -o NUL "$BaseUrl/api/v1/catalog/search?q=chair"
}

$baselineProbes = @()
foreach ($ep in $endpoints) {
    $runs = @()
    for ($r = 1; $r -le 5; $r++) {
        $p = Probe-Url $ep
        $runs += $p.duration_ms
        Start-Sleep -Milliseconds 40
    }
    $sorted = $runs | Sort-Object
    $median = $sorted[2]
    $lastProbe = Probe-Url $ep

    $rel = ($ep -replace [regex]::Escape($BaseUrl), '')
    if ($rel -eq '') { $rel = '/' }

    $probeResult = [ordered]@{
        endpoint = $rel
        median_ms = $median
        min_ms = $sorted[0]
        max_ms = $sorted[-1]
        http_code = $lastProbe.http_code
        size_bytes = $lastProbe.size_bytes
    }
    $baselineProbes += [PSCustomObject]$probeResult
}

$baselineProbes | Format-Table -AutoSize
$baselineProbes | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $PhaseRoot 'baseline/baseline-endpoints.json') -Encoding utf8

# 3. Whole-Platform Traffic Ladder via k6
Write-Host "`n[TRAFFIC LADDER] Executing whole-platform traffic ladder..." -ForegroundColor Yellow

$ladderResults = @()

foreach ($rps in $RpsLadder) {
    $profileName = "rps$rps"
    Write-Host "`n--- Running Workload Ladder Step: $profileName (Stage: $StageDuration) ---" -ForegroundColor Cyan

    $stepDir = Join-Path $PhaseRoot "traffic-model/step-$profileName"
    New-Item -ItemType Directory -Force -Path $stepDir | Out-Null

    $sampler = Start-SamplerJob -Label "whole-platform-$profileName" -OutFolder $stepDir -DurationSeconds 45
    $reportLeaf = "phase21-whole-platform/traffic-model/step-$profileName"

    $k6Start = Get-Date
    docker compose @compose --profile k6 run --rm `
        -e "PROFILE=$profileName" `
        -e "WORKLOAD=mixed" `
        -e "STAGE_DURATION=$StageDuration" `
        -e "REPORT_DIR=$reportLeaf" `
        -e "FRONTEND_ORIGIN=http://127.0.0.1:8193" `
        -e "PRODUCT_ID=$sampleProduct" `
        k6 run /scripts/kvm2-phase2-diagnostics.js | Out-Null
    $k6Elapsed = [math]::Round(((Get-Date) - $k6Start).TotalSeconds, 1)

    if ($sampler) {
        Stop-Process -Id $sampler.Id -Force -ErrorAction SilentlyContinue
    }

    # Harvest k6 summary
    $k6File = Join-Path $stepDir "summary-$profileName.json"
    $k6Data = $null
    if (Test-Path $k6File) {
        $k6Data = Get-Content $k6File -Raw | ConvertFrom-Json
        Write-Host "  -> Result for ${profileName}: p50=$([math]::Round($k6Data.p50_ms, 1))ms, p95=$([math]::Round($k6Data.p95_ms, 1))ms, search_p95=$([math]::Round($k6Data.search_p95_ms, 1))ms, errors=$($k6Data.error_rate)" -ForegroundColor Green

        $ladderResults += [ordered]@{
            rps_target = $rps
            profile = $profileName
            duration_s = $k6Elapsed
            p50_ms = [math]::Round($k6Data.p50_ms, 2)
            p95_ms = [math]::Round($k6Data.p95_ms, 2)
            p99_ms = [math]::Round($k6Data.p99_ms, 2)
            search_p95_ms = [math]::Round($k6Data.search_p95_ms, 2)
            products_p95_ms = [math]::Round($k6Data.products_p95_ms, 2)
            detail_p95_ms = [math]::Round($k6Data.detail_p95_ms, 2)
            error_rate = $k6Data.error_rate
            http_429 = $k6Data.http_429
            http_5xx = $k6Data.http_5xx
            http_ok = $k6Data.http_ok
        }
    } else {
        Write-Warning "k6 summary file not found at $k6File"
    }

    # Cool down
    Start-Sleep -Seconds 5
}

$ladderResults | Format-Table -AutoSize
$ladderResults | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $PhaseRoot 'traffic-model/traffic-ladder-summary.json') -Encoding utf8

# 4. Final Queue & MySQL State Verification
$qDefaultPost = (docker exec "${Project}-redis-1" redis-cli -a kvm2_test_redis_secret LLEN diyar-kvm2-test-queues:default 2>$null | Select-Object -Last 1).Trim()
$qAnalyticsPost = (docker exec "${Project}-redis-1" redis-cli -a kvm2_test_redis_secret LLEN diyar-kvm2-test-queues:analytics 2>$null | Select-Object -Last 1).Trim()
$failedJobsPost = (Invoke-MysqlCmd "SELECT count(*) FROM failed_jobs;").Trim()

$postVerify = [ordered]@{
    timestamp = (Get-Date).ToUniversalTime().ToString('o')
    queue_default = [int]$qDefaultPost
    queue_analytics = [int]$qAnalyticsPost
    failed_jobs = [int]$failedJobsPost
}
$postVerify | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $PhaseRoot 'environment/post-run-verification.json') -Encoding utf8

Write-Host "`n[PHASE 21 COMPLETE] Suite finished successfully. Telemetry and reports saved under $PhaseRoot" -ForegroundColor Green
